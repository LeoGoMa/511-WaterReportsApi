import { CreateReportDto, Severity } from '../dtos/create-report.dto';

const SEVERITY_LABEL: Record<Severity, string> = {
  [Severity.LOW]: 'Baja',
  [Severity.MEDIUM]: 'Media',
  [Severity.HIGH]: 'Alta',
};

const SEVERITY_COLOR: Record<Severity, string> = {
  [Severity.LOW]: '#2e7d32',
  [Severity.MEDIUM]: '#ed6c02',
  [Severity.HIGH]: '#c62828',
};

// Escapamos el texto del ciudadano para que no rompa el HTML del correo.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function generateReportTemplate(dto: CreateReportDto): string {
  const color = SEVERITY_COLOR[dto.severity];
  const label = SEVERITY_LABEL[dto.severity];

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>Nuevo reporte de fuga de agua</title>
  </head>
  <body style="margin:0;padding:24px;background-color:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0;">
      <tr>
        <td style="background-color:#0d47a1;padding:20px 24px;">
          <h1 style="margin:0;font-size:20px;color:#ffffff;">Nuevo reporte de fuga de agua</h1>
          <p style="margin:4px 0 0;font-size:13px;color:#bbdefb;">Cuadrilla de mantenimiento</p>
        </td>
      </tr>
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 16px;font-size:14px;">
            Se registro un nuevo reporte ciudadano con los siguientes datos:
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;font-size:14px;">
            <tr>
              <td style="padding:10px 12px;background-color:#f4f6f8;border:1px solid #e0e0e0;width:35%;font-weight:bold;">Direccion</td>
              <td style="padding:10px 12px;border:1px solid #e0e0e0;">${escapeHtml(dto.address)}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;background-color:#f4f6f8;border:1px solid #e0e0e0;font-weight:bold;">Descripcion</td>
              <td style="padding:10px 12px;border:1px solid #e0e0e0;">${escapeHtml(dto.description)}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;background-color:#f4f6f8;border:1px solid #e0e0e0;font-weight:bold;">Severidad</td>
              <td style="padding:10px 12px;border:1px solid #e0e0e0;">
                <span style="display:inline-block;padding:4px 10px;border-radius:12px;background-color:${color};color:#ffffff;font-size:12px;font-weight:bold;">${label}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 12px;background-color:#f4f6f8;border:1px solid #e0e0e0;font-weight:bold;">Telefono de contacto</td>
              <td style="padding:10px 12px;border:1px solid #e0e0e0;">${escapeHtml(dto.reporterPhone)}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 24px;background-color:#f4f6f8;border-top:1px solid #e0e0e0;font-size:12px;color:#616161;">
          Correo automatico del sistema de reportes de agua del municipio.
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
