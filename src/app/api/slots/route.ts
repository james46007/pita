import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/slots?courtId=...&date=YYYY-MM-DD (Public)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const courtId = searchParams.get("courtId") || searchParams.get("canchaId")
    const dateStr = searchParams.get("date") || searchParams.get("fecha") // e.g. "2026-09-20"

    if (!courtId || !dateStr) {
      return NextResponse.json(
        { error: "Required parameters: courtId and date (YYYY-MM-DD)" },
        { status: 400 }
      )
    }

    const targetDate = new Date(`${dateStr}T00:00:00Z`)

    const slots = await prisma.slot.findMany({
      where: {
        courtId,
        date: targetDate,
        status: "AVAILABLE",
      },
      include: {
        court: {
          select: {
            name: true,
            type: true,
            pricePerHour: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
    })

    const formatted = slots.map((s) => ({
      ...s,
      horaInicio: s.startTime,
      horaFin: s.endTime,
      estado: s.status,
      cancha: {
        nombre: s.court.name,
        tipo: s.court.type,
        precioHora: s.court.pricePerHour,
      },
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error("Error querying slots:", error)
    return NextResponse.json({ error: "Internal error querying availability" }, { status: 500 })
  }
}
