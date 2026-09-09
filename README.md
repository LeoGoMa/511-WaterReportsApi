# Water Reports API

API para que los ciudadanos reporten fugas de agua en la via publica. Al crear un reporte,
el sistema lo guarda en PostgreSQL y envia un correo de aviso a la cuadrilla de
mantenimiento con los datos de la fuga.

## Stack

- NestJS 11 con TypeScript
- PostgreSQL + TypeORM con migraciones (`synchronize: false`)
- Variables de entorno con `env-var` + `dotenv` (`src/config/envs.ts`)
- Contrasenas hasheadas con `bcryptjs`
- Correo con `nodemailer`
- Validacion de entrada con DTOs y `class-validator`

## Entidades

### Report -> tabla `WATER_REPORT`

| Campo         | Tipo en Postgres | Descripcion                  |
| ------------- | ---------------- | ---------------------------- |
| id            | `SERIAL` (PK)    | Identificador                |
| address       | `varchar(200)`   | Direccion o referencia       |
| description   | `varchar(500)`   | Que se observa               |
| severity      | `varchar(10)`    | `low` / `medium` / `high`    |
| reporterPhone | `varchar(20)`    | Telefono de contacto         |
| isResolved    | `boolean`        | Inicia en `false`            |
| createdAt     | `timestamp`      | Fecha del reporte            |

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
| `POST` | `/reports` | `CreateReportDto`| Guarda el reporte y envia el correo de aviso  |
| `GET`  | `/reports` | -                | Lista todos los reportes                      |

`POST /reports` responde `201` con el reporte guardado y `notified`, que indica si el
correo salio:

```json
{
  "report": {
    "id": 1,
    "address": "Calle Hidalgo 245, Col. Centro",
    "description": "Fuga en la banqueta, brota agua constante",
    "severity": "high",
    "reporterPhone": "4771234567",
    "isResolved": false,
    "createdAt": "2026-09-09T14:11:48.790Z"
  },
  "notified": true
}
```

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

1. Todos los usuarios con `isNotificationEnabled = true`.
2. Si no hay ninguno, al correo fijo de la cuadrilla en `MAILER_CREW`.

Asi el aviso funciona desde el primer reporte, aunque todavia no haya usuarios registrados.

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
```

`MAILER_TOKEN` es una *App Password* de Gmail, no la contrasena normal de la cuenta.

### 3. PostgreSQL

```bash
docker compose up -d
```

### 4. Migraciones

```bash
npm run migration:run
```

Crea las tablas `WATER_REPORT` y `SYSTEM_USER`.

### 5. Arrancar

```bash
npm run start:dev
```

La API queda en `http://localhost:3000`.

## Migraciones

```bash
npm run migration:generate -- src/db/migrations/NombreDeLaMigracion
npm run migration:run
npm run migration:revert
```

Incluida: `src/db/migrations/1788963010923-CreateReportAndUser.ts`.

## Coleccion de Bruno

En [`bruno/`](bruno/). Abrela con `Open Collection`, selecciona el environment **Local** y
corre las requests en orden del 01 al 06.

| # | Request                  | Esperado |
| - | ------------------------ | -------- |
| 1 | Registrar Usuario        | 201      |
| 2 | Login                    | 200      |
| 3 | Login Invalido           | 400      |
| 4 | Crear Reporte            | 201      |
| 5 | Listar Reportes          | 200      |
| 6 | Reporte Invalido         | 400      |

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
