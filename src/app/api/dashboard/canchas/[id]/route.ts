import { NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUserAndTenant, assertAdminOnly } from "@/lib/tenant"
import { prisma } from "@/lib/prisma"

const patchCourtSchema = z.object({
  name: z.string().min(2, "Court name must have at least 2 characters").optional(),
  type: z.enum(["PADEL", "TURF"]).optional(),
  pricePerHour: z.coerce.number().positive("Hourly rate must be a positive number").optional(),
  slotDurationMin: z.coerce.number().int().positive().optional(),
  isActive: z.boolean().optional(),
})

// PATCH /api/dashboard/canchas/[id] (ADMIN)
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(req.url)
    const targetComplexId = searchParams.get("complexId") || searchParams.get("complejoId") || undefined
    const { complexId, role } = await getCurrentUserAndTenant(targetComplexId)

    assertAdminOnly(role)

    // Verify court belongs to authenticated complex
    const court = await prisma.court.findUnique({
      where: { id },
    })

    if (!court || court.complexId !== complexId) {
      return NextResponse.json({ error: "Court not found or does not belong to this complex" }, { status: 404 })
    }

    const raw = await req.json()
    let typeVal = raw.type ?? raw.tipo
    if (typeVal === "SINTETICA") typeVal = "TURF"

    const body = {
      name: raw.name ?? raw.nombre,
      type: typeVal,
      pricePerHour: raw.pricePerHour ?? raw.precioHora,
      slotDurationMin: raw.slotDurationMin ?? raw.duracionSlotMin,
      isActive: raw.isActive ?? raw.activo,
    }

    const validated = patchCourtSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid data", issues: validated.error.flatten() },
        { status: 400 }
      )
    }

    const updatedCourt = await prisma.court.update({
      where: { id },
      data: validated.data,
    })

    return NextResponse.json(updatedCourt)
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (error.message === "FORBIDDEN_REQUIRES_ADMIN") return NextResponse.json({ error: "Action requires ADMIN role" }, { status: 403 })
    if (error.message === "FORBIDDEN_TENANT_ACCESS") return NextResponse.json({ error: "Access denied" }, { status: 403 })
    return NextResponse.json({ error: "Internal error updating court" }, { status: 500 })
  }
}
