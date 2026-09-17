import { NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUserAndTenant } from "@/lib/tenant"
import { prisma } from "@/lib/prisma"

const patchSlotSchema = z.object({
  status: z.enum(["AVAILABLE", "BLOCKED"]),
})

// PATCH /api/dashboard/slots/[id] (ADMIN/STAFF)
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(req.url)
    const targetComplexId = searchParams.get("complexId") || searchParams.get("complejoId") || undefined
    const { complexId } = await getCurrentUserAndTenant(targetComplexId)

    const slot = await prisma.slot.findUnique({
      where: { id },
      include: {
        court: { select: { complexId: true } },
        booking: true,
      },
    })

    if (!slot || slot.court.complexId !== complexId) {
      return NextResponse.json({ error: "Slot not found in this complex" }, { status: 404 })
    }

    const raw = await req.json()
    let statusVal = raw.status ?? raw.estado
    if (statusVal === "DISPONIBLE") statusVal = "AVAILABLE"
    if (statusVal === "BLOQUEADO") statusVal = "BLOCKED"

    const validated = patchSlotSchema.safeParse({ status: statusVal })

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid status. Only AVAILABLE or BLOCKED allowed", issues: validated.error.flatten() },
        { status: 400 }
      )
    }

    const { status } = validated.data

    // If slot is BOOKED or has an active reservation, prevent manual locking
    if (slot.status === "BOOKED" || slot.booking) {
      return NextResponse.json(
        { error: "Cannot change the status of a slot with an active reservation. Please cancel the booking first." },
        { status: 422 }
      )
    }

    const updatedSlot = await prisma.slot.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json(updatedSlot)
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (error.message === "FORBIDDEN_TENANT_ACCESS") return NextResponse.json({ error: "Access denied" }, { status: 403 })
    return NextResponse.json({ error: "Internal error updating slot" }, { status: 500 })
  }
}
