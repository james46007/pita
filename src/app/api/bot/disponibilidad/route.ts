import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { assertBotAuthorized } from "@/lib/bot-auth"
import { cleanupExpiredBookings } from "@/lib/booking-expiration"

// GET /api/bot/disponibilidad?instance=...&fecha=YYYY-MM-DD
export async function GET(req: Request) {
  if (!assertBotAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const instanceName = searchParams.get("instance")
  const dateStr = searchParams.get("fecha") || searchParams.get("date")

  if (!instanceName || !dateStr) {
    return NextResponse.json(
      { error: "Query parameters 'instance' and 'fecha' (YYYY-MM-DD) are required" },
      { status: 400 }
    )
  }

  // Validate date format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json(
      { error: "Invalid date format. Expected YYYY-MM-DD" },
      { status: 400 }
    )
  }

  try {
    const config = await prisma.complexWhatsappConfig.findUnique({
      where: { instanceName },
      select: { complexId: true },
    })

    if (!config) {
      return NextResponse.json(
        { error: `No complex found for instance: ${instanceName}` },
        { status: 404 }
      )
    }

    // Free up any expired unpaid bookings for courts in this complex
    const courts = await prisma.court.findMany({
      where: { complexId: config.complexId, isActive: true },
      select: { id: true, name: true, type: true, pricePerHour: true },
    })

    await Promise.all(courts.map((c) => cleanupExpiredBookings(c.id)))

    const targetDate = new Date(`${dateStr}T00:00:00Z`)

    const slots = await prisma.slot.findMany({
      where: {
        court: { complexId: config.complexId, isActive: true },
        date: targetDate,
        status: "AVAILABLE",
      },
      include: {
        court: {
          select: {
            id: true,
            name: true,
            type: true,
            pricePerHour: true,
          },
        },
      },
      orderBy: [
        { court: { name: "asc" } },
        { startTime: "asc" },
      ],
    })

    return NextResponse.json({
      date: dateStr,
      totalSlotsAvailable: slots.length,
      slots: slots.map((s) => ({
        slotId: s.id,
        courtId: s.courtId,
        courtName: s.court.name,
        courtType: s.court.type,
        pricePerHour: s.court.pricePerHour,
        startTime: s.startTime,
        endTime: s.endTime,
      })),
    })
  } catch (error: any) {
    console.error("[BOT_DISPONIBILIDAD_ERROR]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
