export function limitReachedTemplate({ checkoutUrl }: { checkoutUrl: string }): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Has alcanzado el límite gratuito</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td>
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">
                Has alcanzado tu límite mensual
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#71717a;line-height:1.6;">
                El plan gratuito incluye <strong>5 análisis por mes</strong>. Ya los has utilizado todos este mes.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef9ec;border:1px solid #fde68a;border-radius:8px;padding:20px;margin-bottom:28px;">
                <tr>
                  <td>
                    <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#92400e;">Plan gratuito</p>
                    <p style="margin:0;font-size:14px;color:#78350f;">5 análisis / mes — cuota agotada</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#18181b;">
                Actualiza a Pro y obtén análisis ilimitados
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#71717a;line-height:1.6;">
                Por solo $9.99/mes desbloqueas análisis ilimitados y todas las funcionalidades futuras.
              </p>

              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#18181b;border-radius:8px;">
                    <a href="${checkoutUrl}" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">
                      Actualizar a Pro →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;font-size:13px;color:#a1a1aa;">
                Tu cuota gratuita se renueva el primer día del mes siguiente.
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
