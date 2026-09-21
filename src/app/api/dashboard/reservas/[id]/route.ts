import { NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUserAndTenant } from "@/lib/tenant"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email/resend"
import { renderBookingConfirmedEmail } from "@/lib/email/templates/booking-confirmed"

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
      include: {
        slot: true,
        court: true,
        complex: true,
      },
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

    // 2. Trigger fire-and-forget confirmation email to customer
    if (status === "CONFIRMED" && booking.customerEmail) {
      try {
        const slotDate = booking.slot.date
          ? new Date(booking.slot.date).toLocaleDateString("es-ES", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "Fecha programada"

        const emailHtml = renderBookingConfirmedEmail({
          customerName: booking.customerName,
          complexName: booking.complex.name,
          complexAddress: booking.complex.address,
          complexPhone: booking.complex.phone,
          courtName: booking.court.name,
          courtType: booking.court.type,
          date: slotDate,
          startTime: booking.slot.startTime,
          endTime: booking.slot.endTime,
          totalAmount: Number(booking.totalAmount),
          bookingId: booking.id,
        })

        // Fire-and-forget: do not await to keep latency minimal
        sendEmail({
          to: booking.customerEmail,
          subject: `¡Tu turno en ${booking.complex.name} está confirmado! 🎾`,
          html: emailHtml,
        }).catch((err) => {
          console.error("[CONFIRMATION_EMAIL_ERROR]", err)
        })
      } catch (err) {
        console.error("[PREPARE_EMAIL_ERROR]", err)
      }
    }

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
