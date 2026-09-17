import { NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUserAndTenant, assertAdminOnly } from "@/lib/tenant"
import { prisma } from "@/lib/prisma"

const scheduleSchema = z.object({
  courtId: z.string().min(1, "courtId is required"),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  openTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid format. Expected HH:mm"),
  closeTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid format. Expected HH:mm"),
  isActive: z.boolean().default(true),
})

// GET /api/dashboard/horarios?courtId=xxx (ADMIN/STAFF)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const courtId = searchParams.get("courtId") || searchParams.get("canchaId")
    const targetComplexId = searchParams.get("complexId") || searchParams.get("complejoId") || undefined
    const { complexId } = await getCurrentUserAndTenant(targetComplexId)

    if (!courtId) {
      // List all court schedules for this complex
      const schedules = await prisma.availableSchedule.findMany({
        where: {
          court: { complexId },
        },
        include: {
          court: { select: { id: true, name: true } },
        },
        orderBy: [{ courtId: "asc" }, { dayOfWeek: "asc" }],
      })
      return NextResponse.json(schedules)
    }

    // Verify court belongs to authenticated complex
    const court = await prisma.court.findUnique({
      where: { id: courtId },
      select: { complexId: true },
    })

    if (!court || court.complexId !== complexId) {
      return NextResponse.json({ error: "Court not found in this complex" }, { status: 404 })
    }

    const schedules = await prisma.availableSchedule.findMany({
      where: { courtId },
      orderBy: { dayOfWeek: "asc" },
    })

    return NextResponse.json(schedules)
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (error.message === "FORBIDDEN_TENANT_ACCESS") return NextResponse.json({ error: "Access denied" }, { status: 403 })
    return NextResponse.json({ error: "Internal error fetching schedules" }, { status: 500 })
  }
}

// POST /api/dashboard/horarios (ADMIN)
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const targetComplexId = searchParams.get("complexId") || searchParams.get("complejoId") || undefined
    const { complexId, role } = await getCurrentUserAndTenant(targetComplexId)

    assertAdminOnly(role)

    const raw = await req.json()
    const body = {
      courtId: raw.courtId ?? raw.canchaId,
      dayOfWeek: raw.dayOfWeek ?? raw.diaSemana,
      openTime: raw.openTime ?? raw.horaApertura,
      closeTime: raw.closeTime ?? raw.horaCierre,
      isActive: raw.isActive ?? raw.activo ?? true,
    }

    const validated = scheduleSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid data", issues: validated.error.flatten() },
        { status: 400 }
      )
    }

    const { courtId, dayOfWeek, openTime, closeTime, isActive } = validated.data

    // Verify court ownership
    const court = await prisma.court.findUnique({
      where: { id: courtId },
      select: { complexId: true },
    })

    if (!court || court.complexId !== complexId) {
      return NextResponse.json({ error: "Court not found in this complex" }, { status: 404 })
    }

    // Upsert schedule for this weekday
    const schedule = await prisma.availableSchedule.upsert({
      where: {
        courtId_dayOfWeek: { courtId, dayOfWeek },
      },
      update: {
        openTime,
        closeTime,
        isActive,
      },
      create: {
        courtId,
        dayOfWeek,
        openTime,
        closeTime,
        isActive,
      },
    })

    return NextResponse.json(schedule, { status: 201 })
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (error.message === "FORBIDDEN_REQUIRES_ADMIN") return NextResponse.json({ error: "Action requires ADMIN role" }, { status: 403 })
    return NextResponse.json({ error: "Internal error saving schedule" }, { status: 500 })
  }
}

// DELETE /api/dashboard/horarios?id=xxx (ADMIN)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    const targetComplexId = searchParams.get("complexId") || searchParams.get("complejoId") || undefined
    const { complexId, role } = await getCurrentUserAndTenant(targetComplexId)

    assertAdminOnly(role)

    if (!id) {
      return NextResponse.json({ error: "Schedule ID required" }, { status: 400 })
    }

    const schedule = await prisma.availableSchedule.findUnique({
      where: { id },
      include: { court: { select: { complexId: true } } },
    })

    if (!schedule || schedule.court.complexId !== complexId) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 })
    }

    await prisma.availableSchedule.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: "Schedule deleted" })
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (error.message === "FORBIDDEN_REQUIRES_ADMIN") return NextResponse.json({ error: "Action requires ADMIN role" }, { status: 403 })
    return NextResponse.json({ error: "Internal error deleting schedule" }, { status: 500 })
  }
}
