export interface BookingConfirmedEmailProps {
  customerName: string
  complexName: string
  complexAddress?: string
  complexPhone?: string
  courtName: string
  courtType?: string
  date: string
  startTime: string
  endTime: string
  totalAmount?: string | number
  bookingId?: string
}

export function renderBookingConfirmedEmail(props: BookingConfirmedEmailProps): string {
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
    totalAmount,
    bookingId,
  } = props

  const formattedAmount = totalAmount ? `$${Number(totalAmount).toFixed(2)}` : null
  const whatsappUrl = complexPhone
    ? `https://wa.me/${complexPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Hola, tengo una consulta sobre mi reserva confirmada #${bookingId?.slice(-6) || ""}`
      )}`
    : null

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>¡Reserva Confirmada! - ${complexName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e4e4e7;">
          
          <!-- Header Accent -->
          <tr>
            <td style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 32px 28px; text-align: center;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background-color: rgba(255,255,255,0.2); width: 48px; height: 48px; line-height: 48px; border-radius: 50%; margin-bottom: 12px; font-size: 24px; color: #ffffff;">
                      ✓
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">
                      ¡Tu reserva está confirmada!
                    </h1>
                    <p style="margin: 6px 0 0 0; color: #d1fae5; font-size: 14px;">
                      ${complexName} ha validado tu turno exitosamente.
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
                Hola <strong>${customerName}</strong>, tu comprobante y lugar han sido verificados. A continuación los detalles de tu partido:
              </p>

              <!-- Reservation Summary Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb;">
                    <span style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px;">
                      Cancha & Deporte
                    </span>
                    <span style="font-size: 15px; font-weight: 700; color: #111827;">
                      ${courtName} ${courtType ? `• ${courtType}` : ""}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb;">
                    <span style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px;">
                      Fecha & Horario
                    </span>
                    <span style="font-size: 15px; font-weight: 700; color: #059669;">
                      📅 ${date} &nbsp;•&nbsp; ⏰ ${startTime} - ${endTime}
                    </span>
                  </td>
                </tr>
                ${
                  complexAddress
                    ? `
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb;">
                    <span style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px;">
                      Ubicación de la sede
                    </span>
                    <span style="font-size: 14px; color: #374151;">
                      📍 ${complexAddress}
                    </span>
                  </td>
                </tr>
                `
                    : ""
                }
                ${
                  formattedAmount
                    ? `
                <tr>
                  <td style="padding: 16px 20px;">
                    <span style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px;">
                      Monto Confirmado
                    </span>
                    <span style="font-size: 16px; font-weight: 800; color: #111827;">
                      ${formattedAmount}
                    </span>
                  </td>
                </tr>
                `
                    : ""
                }
              </table>

              <!-- Action Button / WhatsApp -->
              ${
                whatsappUrl
                  ? `
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${whatsappUrl}" target="_blank" style="display: inline-block; background-color: #25D366; color: #ffffff; font-weight: 600; font-size: 14px; text-decoration: none; padding: 12px 24px; border-radius: 8px; box-shadow: 0 2px 6px rgba(37,211,102,0.3);">
                      💬 Contactar al Complejo por WhatsApp
                    </a>
                  </td>
                </tr>
              </table>
              `
                  : ""
              }

              <p style="margin: 0; color: #71717a; font-size: 13px; line-height: 1.5; text-align: center;">
                Te recomendamos llegar 10 minutos antes del inicio de tu turno. ¡Que disfrutes el partido!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f4f4f5; padding: 16px 24px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; color: #a1a1aa; font-size: 11px;">
                Enviado automáticamente por <strong>${complexName}</strong> a través de <strong>PITA Platform</strong>.
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
