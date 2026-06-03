export function welcomeTemplate(): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenido a Feedback Analyzer</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td>
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">
                Bienvenido a Feedback Analyzer 👋
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#71717a;line-height:1.6;">
                Tu cuenta está lista. Ya puedes empezar a analizar el feedback de tus usuarios en segundos.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:8px;padding:20px;margin-bottom:24px;">
                <tr>
                  <td>
                    <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#18181b;">¿Qué puedes hacer con el plan gratuito?</p>
                    <ul style="margin:0;padding-left:20px;font-size:14px;color:#52525b;line-height:1.8;">
                      <li>Hasta 5 análisis por mes</li>
                      <li>Clasificación automática por categoría (bug, feature request, elogio…)</li>
                      <li>Análisis de sentimiento por item</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 24px;font-size:14px;color:#71717a;line-height:1.6;">
                Cuando estés listo para análisis ilimitados, puedes actualizar a <strong>Pro</strong> por $9.99/mes.
              </p>

              <p style="margin:0;font-size:13px;color:#a1a1aa;">
                Si no creaste esta cuenta, ignora este email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
