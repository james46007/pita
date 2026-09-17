import { NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUserAndTenant } from "@/lib/tenant"
import { prisma } from "@/lib/prisma"

const patchBookingSchema = z.object({
  status: z.enum(["CONFIRMED", "CANCELLED"]),
})

// PATCH /api/dashboard/reservas/[id] (ADMIN/STAFF)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const raw = await req.json()
    let statusVal = raw.status ?? raw.estado
    if (statusVal === "CONFIRMADA") statusVal = "CONFIRMED"
    if (statusVal === "CANCELADA") statusVal = "CANCELLED"

    const validated = patchBookingSchema.safeParse({ status: statusVal })

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid status. Only CONFIRMED or CANCELLED allowed" },
        { status: 400 }
      )
    }

    const { status } = validated.data

    // 1. Fetch reservation and verify tenant authorization
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { slot: true },
    })

    if (!booking) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 })
    }

    // Verify user belongs to the complex owning this reservation
    await getCurrentUserAndTenant(booking.complexId)

    // Prisma transaction: if CANCELLED, return slot to AVAILABLE
    const updated = await prisma.$transaction(async (tx) => {
      if (status === "CANCELLED") {
        await tx.slot.update({
          where: { id: booking.slotId },
          data: { status: "AVAILABLE" },
        })
      }

      return await tx.booking.update({
        where: { id },
        data: { status },
      })
    })

    return NextResponse.json({
      message: `Reservation marked as ${status}`,
      booking: updated,
      reserva: updated,
    })
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (error.message === "FORBIDDEN_TENANT_ACCESS") return NextResponse.json({ error: "Access denied" }, { status: 403 })
    console.error("Error updating reservation:", error)
    return NextResponse.json({ error: "Internal error updating reservation" }, { status: 500 })
  }
}
