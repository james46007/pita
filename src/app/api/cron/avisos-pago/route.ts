import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { assertCronAuthorized } from "@/lib/cron-auth"
import { renderPaymentExpiringWarningWhatsApp, type BookingTemplateVariables } from "@/lib/whatsapp/templates"
import { normalizePhoneToE164 } from "@/lib/whatsapp/phone"
import { EvolutionApiClient } from "@/lib/whatsapp/evolution"

// GET /api/cron/avisos-pago
// Notifica por WhatsApp a los clientes cuyas reservas en PAYMENT_PENDING estén a punto de expirar
export async function GET(req: Request) {
  if (!assertCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized: Invalid cron secret" }, { status: 401 })
  }

  try {
    const now = new Date()
    // Ventana de aviso: reservas que expiran en los próximos 12 minutos
    const warningDeadline = new Date(now.getTime() + 12 * 60 * 1000)

    const candidates = await prisma.booking.findMany({
      where: {
        status: "PAYMENT_PENDING",
        expiresAt: {
          gt: now,
          lte: warningDeadline,
        },
      },
      include: {
        slot: true,
        court: true,
        complex: {
          include: {
            whatsappConfig: true,
          },
        },
      },
    })

    let warningsSent = 0
    const errors: Array<{ bookingId: string; error: string }> = []

    for (const booking of candidates) {
      // Ignorar si ya se envió el aviso a esta reserva
      if (booking.notes && booking.notes.includes("[AVISO_PAGO_ENVIADO]")) {
        continue
      }

      const instanceName = booking.complex.whatsappConfig?.instanceName
      if (!booking.customerPhone || !instanceName || !booking.expiresAt) {
        continue
      }

      try {
        const phoneValidation = normalizePhoneToE164(booking.customerPhone)
        if (!phoneValidation.isValid) continue

        const remainingMinutes = Math.max(1, Math.round((booking.expiresAt.getTime() - now.getTime()) / 60000))

        const slotDate = booking.slot?.date
          ? new Date(booking.slot.date).toLocaleDateString("es-ES", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })
          : "Fecha reservada"

        const templateVars: BookingTemplateVariables = {
          customerName: booking.customerName,
          complexName: booking.complex.name,
          complexAddress: booking.complex.address || "Consultar con recepción",
          courtName: booking.court?.name || "Cancha",
          date: slotDate,
          startTime: booking.slot?.startTime || "",
          endTime: booking.slot?.endTime || "",
          totalAmount: Number(booking.totalAmount),
          bookingId: booking.id,
        }

        const whatsappBody = renderPaymentExpiringWarningWhatsApp(templateVars, remainingMinutes)

        const sendRes = await EvolutionApiClient.sendTextMessage(
          instanceName,
          phoneValidation.formattedPhone,
          whatsappBody
        )

        if (sendRes.success) {
          warningsSent++
          // Marcar como notificado en notes de forma idempotente
          const updatedNotes = (booking.notes ? `${booking.notes} ` : "") + "[AVISO_PAGO_ENVIADO]"
          await prisma.booking.update({
            where: { id: booking.id },
            data: { notes: updatedNotes },
          })
        } else {
          console.warn(`[AVISO_PAGO_WARN] Failed sending to booking ${booking.id}:`, sendRes.error)
          errors.push({ bookingId: booking.id, error: sendRes.error || "Evolution dispatch failed" })
        }
      } catch (err: any) {
        console.error(`[AVISO_PAGO_ERROR] Booking ${booking.id}:`, err)
        errors.push({ bookingId: booking.id, error: err.message || "Unknown error" })
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      candidatesFound: candidates.length,
      warningsSent,
      errors,
    })
  } catch (error: any) {
    console.error("[CRON_AVISOS_PAGO_ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
