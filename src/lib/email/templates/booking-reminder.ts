export interface BookingReminderEmailProps {
  customerName: string
  complexName: string
  complexAddress?: string
  complexPhone?: string
  courtName: string
  courtType?: string
  date: string
  startTime: string
  endTime: string
}

export function renderBookingReminderEmail(props: BookingReminderEmailProps): string {
  const {
    customerName,
    complexName,
    complexAddress,
    complexPhone,
    courtName,
    courtType,
    date,
    startTime,
    endTime,
  } = props

  const whatsappUrl = complexPhone
    ? `https://wa.me/${complexPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Hola, voy en camino a mi turno en ${complexName}`
      )}`
    : null

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>¡Recordatorio de Turno! - ${complexName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e4e4e7;">
          
          <!-- Header Accent -->
          <tr>
            <td style="background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%); padding: 32px 28px; text-align: center;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background-color: rgba(255,255,255,0.2); width: 48px; height: 48px; line-height: 48px; border-radius: 50%; margin-bottom: 12px; font-size: 24px; color: #ffffff;">
                      ⏰
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">
                      ¡Tu partido empieza en 1 hora!
                    </h1>
                    <p style="margin: 6px 0 0 0; color: #e0f2fe; font-size: 14px;">
                      Prepárate para jugar en ${complexName}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 28px 24px;">
              <p style="margin: 0 0 16px 0; color: #27272a; font-size: 15px; line-height: 1.5;">
                Hola <strong>${customerName}</strong>, te recordamos que tienes un turno reservado para hoy:
              </p>

              <!-- Reservation Summary Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                    <span style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">
                      Cancha & Deporte
                    </span>
                    <span style="font-size: 15px; font-weight: 700; color: #0f172a;">
                      ${courtName} ${courtType ? `• ${courtType}` : ""}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                    <span style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">
                      Horario del Partido
                    </span>
                    <span style="font-size: 16px; font-weight: 800; color: #0284c7;">
                      📅 ${date} &nbsp;•&nbsp; ⏰ ${startTime} - ${endTime}
                    </span>
                  </td>
                </tr>
                ${
                  complexAddress
                    ? `
                <tr>
                  <td style="padding: 16px 20px;">
                    <span style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">
                      Dirección de la Sede
                    </span>
                    <span style="font-size: 14px; color: #334155;">
                      📍 ${complexAddress}
                    </span>
                  </td>
                </tr>
                `
                    : ""
                }
              </table>

              <!-- Contact Button -->
              ${
                whatsappUrl
                  ? `
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${whatsappUrl}" target="_blank" style="display: inline-block; background-color: #25D366; color: #ffffff; font-weight: 600; font-size: 14px; text-decoration: none; padding: 12px 24px; border-radius: 8px; box-shadow: 0 2px 6px rgba(37,211,102,0.3);">
                      💬 Avisar o Consultar por WhatsApp
                    </a>
                  </td>
                </tr>
              </table>
              `
                  : ""
              }

              <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.5; text-align: center;">
                Recuerda llevar tu equipamiento e hidratación. ¡Te esperamos en la cancha!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f4f4f5; padding: 16px 24px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; color: #a1a1aa; font-size: 11px;">
                Recordatorio automático enviado por <strong>${complexName}</strong> a través de <strong>PITA Platform</strong>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}
