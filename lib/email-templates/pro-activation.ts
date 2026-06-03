export function proActivationTemplate(): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>¡Bienvenido al plan Pro!</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td>
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">
                ¡Tu plan Pro está activo! 🎉
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#71717a;line-height:1.6;">
                Gracias por suscribirte. Tu cuenta ahora tiene acceso completo a Feedback Analyzer sin límites.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin-bottom:24px;">
                <tr>
                  <td>
                    <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#166534;">Plan Pro — activo</p>
                    <ul style="margin:0;padding-left:20px;font-size:14px;color:#15803d;line-height:1.8;">
                      <li>Análisis ilimitados por mes</li>
                      <li>Clasificación automática y análisis de sentimiento</li>
                      <li>Acceso a todas las funcionalidades futuras</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 24px;font-size:14px;color:#71717a;line-height:1.6;">
                Tu suscripción es de <strong>$9.99/mes</strong> y se renueva automáticamente. Puedes cancelarla en cualquier momento desde tu perfil.
              </p>

              <p style="margin:0;font-size:13px;color:#a1a1aa;">
                Si tienes alguna pregunta sobre tu suscripción, responde a este email y te ayudaremos.
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
