import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { assertCronAuthorized } from "@/lib/cron-auth"
import { sendEmail } from "@/lib/email/resend"
import { renderBookingReminderEmail } from "@/lib/email/templates/booking-reminder"

export async function GET(req: Request) {
  if (!assertCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized: Invalid cron secret" }, { status: 401 })
  }

  try {
    const now = new Date()

    // 1-hour prior window: [now + 50 min, now + 75 min]
    const windowStart = new Date(now.getTime() + 50 * 60 * 1000)
    const windowEnd = new Date(now.getTime() + 75 * 60 * 1000)

    // Today boundaries in UTC/server
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const tomorrowEnd = new Date(now)
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1)
    tomorrowEnd.setHours(23, 59, 59, 999)

    // Fetch confirmed bookings that have not received a reminder yet
    const candidates = await prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        reminderSentAt: null,
        customerEmail: { not: null },
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
        complex: true,
      },
    })

    let remindersSent = 0
    const errors: Array<{ bookingId: string; error: string }> = []

    for (const booking of candidates) {
      if (!booking.customerEmail || !booking.slot?.startTime) continue

      // Parse slot date and time
      const dateIso = new Date(booking.slot.date).toISOString().split("T")[0]
      const [hours, minutes] = booking.slot.startTime.split(":").map(Number)
      const slotDateTime = new Date(`${dateIso}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`)

      // Check if slot falls in the 1h-ahead window
      // Or in test query parameter ?force=true
      const url = new URL(req.url)
      const isForce = url.searchParams.get("force") === "true"

      if (isForce || (slotDateTime >= windowStart && slotDateTime <= windowEnd)) {
        try {
          const formattedDate = new Date(booking.slot.date).toLocaleDateString("es-ES", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })

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

          const sendResult = await sendEmail({
            to: booking.customerEmail,
            subject: `⏰ Recordatorio: Tu partido en ${booking.complex.name} empieza en 1 hora`,
            html,
          })

          if (sendResult.success) {
            await prisma.booking.update({
              where: { id: booking.id },
              data: { reminderSentAt: new Date() },
            })
            remindersSent++
          }
        } catch (err: any) {
          console.error(`[CRON_RECORDATORIOS] Error sending reminder for booking ${booking.id}:`, err)
          errors.push({ bookingId: booking.id, error: err.message || "Unknown error" })
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      candidatesFound: candidates.length,
      remindersSent,
      errors,
    })
  } catch (error: any) {
    console.error("[CRON_RECORDATORIOS] Unexpected cron error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
