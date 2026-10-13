import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { assertCronAuthorized } from "@/lib/cron-auth"
import { sendEmail } from "@/lib/email/resend"
import { renderBookingReminderEmail } from "@/lib/email/templates/booking-reminder"
import { renderBookingReminderWhatsApp, type BookingTemplateVariables } from "@/lib/whatsapp/templates"
import { normalizePhoneToE164 } from "@/lib/whatsapp/phone"
import { EvolutionApiClient } from "@/lib/whatsapp/evolution"

export async function GET(req: Request) {
  if (!assertCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized: Invalid cron secret" }, { status: 401 })
  }

  try {
    const now = new Date()
    const url = new URL(req.url)
    const isForce = url.searchParams.get("force") === "true"

    // Default window: matches starting in ~2 hours [now + 60 min, now + 150 min]
    const windowStart = new Date(now.getTime() + 60 * 60 * 1000)
    const windowEnd = new Date(now.getTime() + 150 * 60 * 1000)

    // Today and tomorrow boundaries in UTC
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const tomorrowEnd = new Date(now)
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1)
    tomorrowEnd.setHours(23, 59, 59, 999)

    // Fetch confirmed bookings that haven't received a reminder yet
    const candidates = await prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        reminderSentAt: null,
        slot: {
          date: {
            gte: todayStart,
            lte: tomorrowEnd,
          },
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

    let remindersSentWhatsApp = 0
    let remindersSentEmail = 0
    const errors: Array<{ bookingId: string; error: string }> = []

    for (const booking of candidates) {
      if (!booking.slot?.startTime) continue

      // Parse slot date and time
      const dateIso = new Date(booking.slot.date).toISOString().split("T")[0]
      const [hours, minutes] = booking.slot.startTime.split(":").map(Number)
      const slotDateTime = new Date(`${dateIso}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`)

      // Check if slot falls in the upcoming reminder window (or force=true)
      if (isForce || (slotDateTime >= windowStart && slotDateTime <= windowEnd)) {
        let sentAny = false

        const formattedDate = new Date(booking.slot.date).toLocaleDateString("es-ES", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })

        const templateVars: BookingTemplateVariables = {
          customerName: booking.customerName,
          complexName: booking.complex.name,
          complexAddress: booking.complex.address || "Consultar con recepción",
          courtName: booking.court.name,
          date: formattedDate,
          startTime: booking.slot.startTime,
          endTime: booking.slot.endTime,
          totalAmount: Number(booking.totalAmount),
          bookingId: booking.id,
        }

        // 1. Dispatch WhatsApp reminder
        const instanceName = booking.complex.whatsappConfig?.instanceName
        if (booking.customerPhone && instanceName) {
          try {
            const phoneValidation = normalizePhoneToE164(booking.customerPhone)
            if (phoneValidation.isValid) {
              const whatsappBody = renderBookingReminderWhatsApp(templateVars, 2)
              const sendRes = await EvolutionApiClient.sendTextMessage(
                instanceName,
                phoneValidation.formattedPhone,
                whatsappBody
              )
              if (sendRes.success) {
                remindersSentWhatsApp++
                sentAny = true
              } else {
                console.warn(`[CRON_RECORDATORIOS_WA_WARN] ${booking.id}:`, sendRes.error)
              }
            }
          } catch (waErr: any) {
            console.error(`[CRON_RECORDATORIOS_WA_ERROR] ${booking.id}:`, waErr)
          }
        }

        // 2. Dispatch Email reminder if customer provided email
        if (booking.customerEmail) {
          try {
            const html = renderBookingReminderEmail({
              customerName: booking.customerName,
              complexName: booking.complex.name,
              complexAddress: booking.complex.address,
              complexPhone: booking.complex.phone,
              courtName: booking.court.name,
              courtType: booking.court.type,
              date: formattedDate,
              startTime: booking.slot.startTime,
              endTime: booking.slot.endTime,
            })

            const emailResult = await sendEmail({
              to: booking.customerEmail,
              subject: `⏰ Recordatorio: Tu partido en ${booking.complex.name} empieza pronto`,
              html,
            })

            if (emailResult.success) {
              remindersSentEmail++
              sentAny = true
            }
          } catch (emailErr: any) {
            console.error(`[CRON_RECORDATORIOS_EMAIL_ERROR] ${booking.id}:`, emailErr)
          }
        }

        // Mark as sent if either WhatsApp or Email succeeded
        if (sentAny) {
          await prisma.booking.update({
            where: { id: booking.id },
            data: { reminderSentAt: new Date() },
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      candidatesFound: candidates.length,
      remindersSentWhatsApp,
      remindersSentEmail,
      errors,
    })
  } catch (error: any) {
    console.error("[CRON_RECORDATORIOS] Unexpected cron error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
