/**
 * WhatsApp Message Templates and Anti-Ban Text Variations.
 * Dynamically rotates syntax variations while retaining essential booking parameters.
 */

export interface BookingTemplateVariables {
  customerName: string
  complexName: string
  complexAddress: string
  courtName: string
  date: string
  startTime: string
  endTime: string
  totalAmount: number
  bookingId?: string
}

const DEFAULT_TEMPLATES = [
  // Variation A
  (v: BookingTemplateVariables) =>
    `¡Hola ${v.customerName}! 👋 Tu reserva en *${v.complexName}* ha sido confirmada con éxito.\n\n` +
    `📍 *Cancha:* ${v.courtName}\n` +
    `📅 *Fecha:* ${v.date}\n` +
    `⏰ *Horario:* ${v.startTime} - ${v.endTime}\n` +
    `💵 *Total:* $${v.totalAmount.toFixed(2)}\n` +
    `📌 *Dirección:* ${v.complexAddress}\n\n` +
    `¡Te esperamos en la cancha! 🎾⚽`,

  // Variation B
  (v: BookingTemplateVariables) =>
    `¡Confirmado, ${v.customerName}! ✅ Tu turno en *${v.complexName}* quedó listo.\n\n` +
    `🎾 *Cancha:* ${v.courtName}\n` +
    `🗓️ *Día:* ${v.date}\n` +
    `🕒 *Hora:* ${v.startTime} - ${v.endTime}\n` +
    `💰 *Monto:* $${v.totalAmount.toFixed(2)}\n` +
    `📍 *Ubicación:* ${v.complexAddress}\n\n` +
    `¡Nos vemos pronto para jugar! 🙌`,

  // Variation C
  (v: BookingTemplateVariables) =>
    `Hola ${v.customerName}, te confirmamos la reserva de tu espacio deportivo en *${v.complexName}*.\n\n` +
    `📌 *Espacio:* ${v.courtName}\n` +
    `📆 *Fecha:* ${v.date}\n` +
    `⏱️ *Horario:* ${v.startTime} - ${v.endTime}\n` +
    `💲 *Total:* $${v.totalAmount.toFixed(2)}\n` +
    `📍 *Dirección:* ${v.complexAddress}\n\n` +
    `¡Que tengas un excelente partido! 🏆`,

  // Variation D
  (v: BookingTemplateVariables) =>
    `¡Todo listo para tu partido, ${v.customerName}! 🏆 Tu turno en *${v.complexName}* está asegurado.\n\n` +
    `🏟️ *Cancha:* ${v.courtName}\n` +
    `📅 *Fecha:* ${v.date} (${v.startTime} - ${v.endTime})\n` +
    `💵 *Total:* $${v.totalAmount.toFixed(2)}\n` +
    `📍 *Dirección:* ${v.complexAddress}\n\n` +
    `¡Nos vemos en la cancha! 🎾`,
]

/**
 * Generates an outbound WhatsApp message body using template rotation or custom template.
 */
export function renderBookingConfirmationWhatsApp(
  variables: BookingTemplateVariables,
  customTemplate?: string | null
): string {
  if (customTemplate && customTemplate.trim().length > 0) {
    return customTemplate
      .replace(/{{cliente}}/gi, variables.customerName)
      .replace(/{{complejo}}/gi, variables.complexName)
      .replace(/{{cancha}}/gi, variables.courtName)
      .replace(/{{fecha}}/gi, variables.date)
      .replace(/{{hora}}/gi, `${variables.startTime} - ${variables.endTime}`)
      .replace(/{{hora_inicio}}/gi, variables.startTime)
      .replace(/{{hora_fin}}/gi, variables.endTime)
      .replace(/{{monto}}/gi, variables.totalAmount.toFixed(2))
      .replace(/{{direccion}}/gi, variables.complexAddress)
  }

  // Anti-ban random template selection
  const randomIndex = Math.floor(Math.random() * DEFAULT_TEMPLATES.length)
  return DEFAULT_TEMPLATES[randomIndex](variables)
}
