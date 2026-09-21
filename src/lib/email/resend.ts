import { Resend } from "resend"

const resendApiKey = process.env.RESEND_API_KEY
export const resend = resendApiKey ? new Resend(resendApiKey) : null

export interface SendEmailParams {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!resend) {
    console.warn(
      "[RESEND] RESEND_API_KEY no está configurada en .env. El correo no fue enviado a:",
      to
    )
    return { success: false, reason: "API_KEY_NOT_CONFIGURED" }
  }

  try {
    const fromAddress = process.env.RESEND_FROM_EMAIL || "PITA Reservas <onboarding@resend.dev>"
    const response = await resend.emails.send({
      from: fromAddress,
      to,
      subject,
      html,
    })

    if (response.error) {
      console.error("[RESEND] Error al enviar email:", response.error)
      return { success: false, error: response.error }
    }

    console.log(`[RESEND] Email enviado exitosamente a ${to}. ID:`, response.data?.id)
    return { success: true, data: response.data }
  } catch (error) {
    console.error("[RESEND] Excepción al enviar correo:", error)
    return { success: false, error }
  }
}
