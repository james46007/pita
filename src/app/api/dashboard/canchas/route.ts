import { NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUserAndTenant, assertAdminOnly } from "@/lib/tenant"
import { prisma } from "@/lib/prisma"

const courtSchema = z.object({
  name: z.string().min(2, "Court name must have at least 2 characters"),
  type: z.enum(["PADEL", "TURF"]).default("TURF"),
  pricePerHour: z.coerce.number().positive("Hourly rate must be a positive number"),
  slotDurationMin: z.coerce.number().int().positive().default(60),
})

// GET /api/dashboard/canchas (ADMIN/STAFF)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const targetComplexId = searchParams.get("complexId") || searchParams.get("complejoId") || undefined
    const { complexId } = await getCurrentUserAndTenant(targetComplexId)

    const courts = await prisma.court.findMany({
      where: { complexId },
      include: {
        schedules: true,
        _count: {
          select: { slots: true, bookings: true },
        },
      },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json(courts)
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (error.message === "FORBIDDEN_TENANT_ACCESS") return NextResponse.json({ error: "Access denied" }, { status: 403 })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

// POST /api/dashboard/canchas (ADMIN)
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const targetComplexId = searchParams.get("complexId") || searchParams.get("complejoId") || undefined
    const { complexId, role } = await getCurrentUserAndTenant(targetComplexId)

    assertAdminOnly(role)

    const raw = await req.json()
    let typeVal = raw.type ?? raw.tipo
    if (typeVal === "SINTETICA") typeVal = "TURF"

    const body = {
      name: raw.name ?? raw.nombre,
      type: typeVal,
      pricePerHour: raw.pricePerHour ?? raw.precioHora,
      slotDurationMin: raw.slotDurationMin ?? raw.duracionSlotMin,
    }

    const validated = courtSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid data", issues: validated.error.flatten() },
        { status: 400 }
      )
    }

    const { name, type, pricePerHour, slotDurationMin } = validated.data

    const court = await prisma.court.create({
      data: {
        name,
        type,
        pricePerHour,
        slotDurationMin,
        complexId,
      },
    })

    return NextResponse.json(court, { status: 201 })
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (error.message === "FORBIDDEN_REQUIRES_ADMIN") return NextResponse.json({ error: "Action requires ADMIN role" }, { status: 403 })
    return NextResponse.json({ error: "Internal error creating court" }, { status: 500 })
  }
}
