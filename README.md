# Water Reports API

API para que los ciudadanos reporten fugas de agua en la via publica. Al crear un reporte,
el ciudadano adjunta una foto de la fuga; la foto se sube a un bucket de S3, el reporte se
guarda en PostgreSQL y se envia un correo de aviso a la cuadrilla de mantenimiento con los
datos y la foto de la fuga.

La API se distribuye como imagen de Docker. En cada push a `main`, GitHub Actions publica la
imagen en Docker Hub y la despliega en una EC2 de AWS por SSH. La infraestructura (EC2, bucket,
rol IAM, dominio de No-IP) se crea con Terraform en el repositorio
[511-WaterReportsInfra](https://github.com/LeoGoMa/511-WaterReportsInfra).

## Stack

- NestJS 11 con TypeScript
- PostgreSQL + TypeORM con migraciones (`synchronize: false`)
- Variables de entorno con `env-var` + `dotenv` (`src/config/envs.ts`)
- Contrasenas hasheadas con `bcryptjs`
- Correo con `nodemailer`
- Validacion de entrada con DTOs y `class-validator`
- Fotos en Amazon S3 con `@aws-sdk/client-s3` (`StorageModule`)
- Docker (`node:22-alpine`) + GitHub Actions para publicar la imagen y desplegarla en EC2
- CORS habilitado para que el front la consuma desde el navegador

## Entidades

### Report -> tabla `WATER_REPORT`

| Campo          | Tipo en Postgres | Descripcion                     |
| -------------- | ---------------- | ------------------------------- |
| id             | `SERIAL` (PK)    | Identificador                   |
| address        | `varchar(200)`   | Direccion o referencia          |
| description    | `varchar(500)`   | Que se observa                  |
| severity       | `varchar(10)`    | `low` / `medium` / `high`       |
| reporterPhone  | `varchar(20)`    | Telefono de contacto            |
| isResolved     | `boolean`        | Inicia en `false`               |
| photoUrl       | `varchar(500)`   | URL en S3 de la foto de la fuga |
| repairPhotoUrl | `varchar(500)`   | URL de la foto de la reparacion |
| createdAt      | `timestamp`      | Fecha del reporte               |

`photoUrl` y `repairPhotoUrl` aceptan `null` en la base de datos para no romper los
reportes creados antes de esta version; todo reporte nuevo llega con `photoUrl`.

### User -> tabla `SYSTEM_USER`

| Campo                 | Tipo en Postgres        | Descripcion                     |
| --------------------- | ----------------------- | ------------------------------- |
| id                    | `SERIAL` (PK)           | Identificador                   |
| name                  | `varchar(100)`          | Nombre                          |
| email                 | `varchar(150)` unico    | Correo                          |
| password              | `varchar`               | Hash de bcrypt, nunca se expone |
| isNotificationEnabled | `boolean`               | Recibe avisos de fugas          |

## Endpoints

### ReportsController

| Metodo | Ruta       | Body             | Descripcion                                  |
| ------ | ---------- | ---------------- | -------------------------------------------- |
| `POST` | `/reports` | multipart: `CreateReportDto` + archivo `photo` | Sube la foto a S3, guarda el reporte y envia el correo |
| `GET`  | `/reports` | -                | Lista todos los reportes, con `photoUrl` y `repairPhotoUrl` |

`POST /reports` recibe `multipart/form-data` con los campos `address`, `description`,
`severity`, `reporterPhone` y el archivo `photo` (imagen, maximo 5 MB). La foto se guarda en
la carpeta `reports/` del bucket. Si no viene la foto responde `400`.

Responde `201` con el reporte guardado y `notified`, que indica si el correo salio:

```json
{
  "report": {
    "id": 1,
    "address": "Calle Hidalgo 245, Col. Centro",
    "description": "Fuga en la banqueta, brota agua constante",
    "severity": "high",
    "reporterPhone": "4771234567",
    "isResolved": false,
    "photoUrl": "https://mi-bucket.s3.us-east-1.amazonaws.com/reports/3f2a9c1e-....jpg",
    "repairPhotoUrl": null,
    "createdAt": "2026-09-09T14:11:48.790Z"
  },
  "notified": true
}
```

### AppController y UsersController

| Metodo | Ruta     | Descripcion                                                     |
| ------ | -------- | --------------------------------------------------------------- |
| `GET`  | `/`      | Estado de la API: `{ "api": "AguaFix", "version": "1.0.0", "status": "ok" }` |
| `GET`  | `/users` | Lista los usuarios (`id`, `name`, `isNotificationEnabled`); nunca `email` ni `password` |

### AuthController

| Metodo | Ruta             | Body            | Descripcion                          |
| ------ | ---------------- | --------------- | ------------------------------------ |
| `POST` | `/auth/register` | `CreateUserDto` | Registra usuario, hashea la contrasena |
| `POST` | `/auth/login`    | `LoginDto`      | Valida credenciales                   |

Con credenciales invalidas, `/auth/login` responde `400`:

```json
{
  "message": "Correo o contrasena incorrectos",
  "error": "Bad Request",
  "statusCode": 400
}
```

Se usa el mismo mensaje para correo inexistente y contrasena incorrecta, para no revelar
cual de los dos fallo. Ninguna respuesta incluye el campo `password`.

## A quien se le envia el correo

El enunciado pide avisar a la cuadrilla de mantenimiento, y la entidad `User` tiene el
campo `isNotificationEnabled`. Por eso el destinatario se resuelve asi:

1. Siempre al correo de la cuadrilla configurado en `MAILER_CREW`.
2. Ademas, a todos los usuarios con `isNotificationEnabled = true`.

La lista se deduplica, asi que si un usuario registrado tiene el mismo correo que la
cuadrilla, el aviso le llega una sola vez. De esta forma la cuadrilla recibe el reporte
aunque no haya ningun usuario registrado.

## Puesta en marcha

### 1. Dependencias

```bash
npm install
```

### 2. Variables de entorno

Copia `.env.example` a `.env` y llena los valores:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=waterreportsdb
DB_USER=postgres
DB_PASSWORD=secret123

MAILER_SERVICE=gmail
MAILER_USER=tucorreo@gmail.com
MAILER_TOKEN=tu_app_password_de_gmail
MAILER_CREW=cuadrilla@municipio.gob.mx

AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_SESSION_TOKEN=
AWS_BUCKET_NAME=nombre-de-tu-bucket

DOCKER_USER=tu_usuario_de_docker_hub
```

- `MAILER_TOKEN` es una *App Password* de Gmail, no la contrasena normal de la cuenta.
- Las llaves de AWS solo se usan en local. El SDK las toma del entorno; si no estan, usa el
  perfil de la CLI de AWS. En la EC2 no hay llaves: la API sube las fotos con el rol IAM de la
  instancia.
- `AWS_SESSION_TOKEN` solo se llena con credenciales temporales (AWS Academy / Learner Lab).
- El bucket debe permitir lectura publica de `reports/*` para que la foto se vea en el correo.
- `DOCKER_USER` lo usa `compose.yaml` para saber que imagen descargar de Docker Hub.

### 3a. Desarrollo local

```bash
docker compose up -d postgres
npm run start:dev
```

### 3b. Con la imagen publicada en Docker Hub

```bash
docker compose pull
docker compose up -d
```

Levanta PostgreSQL y la API (`<DOCKER_USER>/water-reports-api:latest`). Dentro de compose la
API se conecta a la base de datos por el nombre del servicio (`DB_HOST=postgres`).

En ambos casos la API queda en `http://localhost:3000` y las migraciones pendientes se
aplican solas al arrancar (`migrationsRun: true`).

## Migraciones

```bash
npm run migration:generate -- src/db/migrations/NombreDeLaMigracion
npm run migration:run
npm run migration:revert
```

Incluidas:

- `1788963010923-CreateReportAndUser.ts`: tablas `WATER_REPORT` y `SYSTEM_USER`.
- `1792795021834-AddPhotoUrlsToReport.ts`: columnas `photoUrl` y `repairPhotoUrl`.

## Docker y GitHub Actions

- `Dockerfile`: construye la API en dos etapas sobre `node:22-alpine` y la ejecuta con
  `node dist/main`.
- `.dockerignore`: deja fuera `.env`, `compose.yaml`, `node_modules`, `dist` y `.git`, entre
  otros. La imagen no lleva credenciales; se le pasan como variables de entorno al correrla.
- `.github/workflows/docker-publish.yml`: en cada push a `main` corre dos jobs:
  1. `docker`: login en Docker Hub, construye la imagen y la publica con el tag `latest`.
  2. `deploy`: entra por SSH a la EC2 y ejecuta `docker compose pull` y `docker compose up -d`
     en `~/aguafix`. Nadie entra al servidor a actualizar a mano.

El workflow lee las credenciales de los secrets del repositorio
(`Settings > Secrets and variables > Actions`):

| Secret            | Valor                                              |
| ----------------- | -------------------------------------------------- |
| `DOCKER_USER`     | Usuario de Docker Hub                              |
| `DOCKER_PASSWORD` | Access token de Docker Hub (Read & Write)          |
| `EC2_HOST`        | Hostname de No-IP del servidor (o su IP publica)   |
| `EC2_SSH_KEY`     | Llave privada SSH cuya publica registra Terraform  |

## Coleccion de Bruno

En [`bruno/`](bruno/). Abrela con `Open Collection`, selecciona el environment **Local** y
corre las requests en orden del 01 al 07. Para la 04 coloca una imagen llamada `fuga.jpg`
dentro de `bruno/`.

| # | Request                  | Esperado |
| - | ------------------------ | -------- |
| 1 | Registrar Usuario        | 201      |
| 2 | Login                    | 200      |
| 3 | Login Invalido           | 400      |
| 4 | Crear Reporte            | 201      |
| 5 | Listar Reportes          | 200      |
| 6 | Reporte Invalido         | 400      |
| 7 | Reporte Sin Foto         | 400      |

Desde terminal:

```bash
cd bruno
npx @usebruno/cli run --env Local
```

## Estructura

```
src/
  auth/
    dtos/login.dto.ts
    auth.controller.ts
    auth.service.ts
    auth.module.ts
  config/envs.ts
  db/
    data-source.ts
    migrations/
  email/
    email.service.ts
    email.module.ts
  storage/
    storage.service.ts
    storage.module.ts
  reports/
    dtos/create-report.dto.ts
    entities/report.entity.ts
    templates/report.template.ts
    reports.controller.ts
    reports.service.ts
    reports.module.ts
  users/
    dtos/create-user.dto.ts
    entities/user.entity.ts
    users.service.ts
    users.module.ts
  app.module.ts
  main.ts
```
