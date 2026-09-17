import { NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUserAndTenant } from "@/lib/tenant"
import { prisma } from "@/lib/prisma"

const createSlotSchema = z.object({
  courtId: z.string().min(1, "courtId is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid format. Expected HH:mm"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid format. Expected HH:mm"),
  status: z.enum(["AVAILABLE", "BLOCKED"]).default("AVAILABLE"),
})

// GET /api/dashboard/slots?courtId=xxx&date=YYYY-MM-DD (ADMIN/STAFF)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const courtId = searchParams.get("courtId") || searchParams.get("canchaId")
    const dateStr = searchParams.get("date") || searchParams.get("fecha")
    const targetComplexId = searchParams.get("complexId") || searchParams.get("complejoId") || undefined
    const { complexId } = await getCurrentUserAndTenant(targetComplexId)

    if (!courtId || !dateStr) {
      return NextResponse.json({ error: "courtId and date are required" }, { status: 400 })
    }

    const court = await prisma.court.findUnique({
      where: { id: courtId },
      select: { complexId: true },
    })

    if (!court || court.complexId !== complexId) {
      return NextResponse.json({ error: "Court not found in this complex" }, { status: 404 })
    }

    const targetDate = new Date(`${dateStr}T00:00:00Z`)

    const slots = await prisma.slot.findMany({
      where: {
        courtId,
        date: targetDate,
      },
      include: {
        booking: {
          select: {
            id: true,
            customerName: true,
            customerPhone: true,
            customerEmail: true,
            status: true,
            totalAmount: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
    })

    // Add legacy aliases so frontend works seamlessly
    const formatted = slots.map((s) => ({
      ...s,
      canchaId: s.courtId,
      fecha: s.date,
      horaInicio: s.startTime,
      horaFin: s.endTime,
      estado: s.status,
      reserva: s.booking
        ? {
            ...s.booking,
            nombreCliente: s.booking.customerName,
            telefonoCliente: s.booking.customerPhone,
            emailCliente: s.booking.customerEmail,
            estado: s.booking.status,
            montoTotal: s.booking.totalAmount,
          }
        : null,
    }))

    return NextResponse.json(formatted)
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (error.message === "FORBIDDEN_TENANT_ACCESS") return NextResponse.json({ error: "Access denied" }, { status: 403 })
    return NextResponse.json({ error: "Internal error fetching slots" }, { status: 500 })
  }
}

// POST /api/dashboard/slots (ADMIN/STAFF)
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const targetComplexId = searchParams.get("complexId") || searchParams.get("complejoId") || undefined
    const { complexId } = await getCurrentUserAndTenant(targetComplexId)

    const raw = await req.json()
    let statusVal = raw.status ?? raw.estado ?? "AVAILABLE"
    if (statusVal === "DISPONIBLE") statusVal = "AVAILABLE"
    if (statusVal === "BLOQUEADO") statusVal = "BLOCKED"

    const body = {
      courtId: raw.courtId ?? raw.canchaId,
      date: raw.date ?? raw.fecha,
      startTime: raw.startTime ?? raw.horaInicio,
      endTime: raw.endTime ?? raw.horaFin,
      status: statusVal,
    }

    const validated = createSlotSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid data", issues: validated.error.flatten() },
        { status: 400 }
      )
    }

    const { courtId, date, startTime, endTime, status } = validated.data

    const court = await prisma.court.findUnique({
      where: { id: courtId },
      select: { complexId: true },
    })

    if (!court || court.complexId !== complexId) {
      return NextResponse.json({ error: "Court not found in this complex" }, { status: 404 })
    }

    const slotDate = new Date(`${date}T00:00:00Z`)

    // Verify if a slot already exists for that court, date and time
    const existing = await prisma.slot.findUnique({
      where: {
        courtId_date_startTime: {
          courtId,
          date: slotDate,
          startTime,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "A slot already exists on that court at the same time" },
        { status: 409 }
      )
    }

    const slot = await prisma.slot.create({
      data: {
        courtId,
        date: slotDate,
        startTime,
        endTime,
        status,
      },
    })

    return NextResponse.json(slot, { status: 201 })
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (error.message === "FORBIDDEN_TENANT_ACCESS") return NextResponse.json({ error: "Access denied" }, { status: 403 })
    return NextResponse.json({ error: "Internal error creating slot" }, { status: 500 })
  }
}
