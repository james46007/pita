import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { assertBotAuthorized } from "@/lib/bot-auth"

const botBookingSchema = z.object({
  instance: z.string().min(1, "Instance name is required"),
  slotId: z.string().min(1, "slotId is required"),
  customerName: z.string().min(2, "Customer name required"),
  customerPhone: z.string().min(7, "Customer phone required"),
  customerEmail: z.string().email("Invalid email address").optional(),
  notes: z.string().optional(),
})

// POST /api/bot/reservas
export async function POST(req: Request) {
  if (!assertBotAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const raw = await req.json()
    const parsed = botBookingSchema.safeParse(raw)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", issues: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { instance, slotId, customerName, customerPhone, customerEmail, notes } = parsed.data

    // Check complex by instance
    const whatsappConfig = await prisma.complexWhatsappConfig.findUnique({
      where: { instanceName: instance },
      select: { complexId: true },
    })

    if (!whatsappConfig) {
      return NextResponse.json(
        { error: `No complex associated with instance: ${instance}` },
        { status: 404 }
      )
    }

    // Atomic transaction: verify slot ownership and lock
    const booking = await prisma.$transaction(async (tx) => {
      const slot = await tx.slot.findUnique({
        where: { id: slotId },
        include: {
          court: {
            include: {
              complex: {
                include: {
                  bankAccounts: { where: { isActive: true } },
                },
              },
            },
          },
        },
      })

      if (!slot) {
        throw new Error("SLOT_NOT_FOUND")
      }

      if (slot.court.complexId !== whatsappConfig.complexId) {
        throw new Error("SLOT_COMPLEX_MISMATCH")
      }

      if (slot.status !== "AVAILABLE") {
        throw new Error("SLOT_NOT_AVAILABLE")
      }

      // Lock slot
      await tx.slot.update({
        where: { id: slotId },
        data: { status: "BOOKED" },
      })

      // Calculate expiration time based on complex policy
      const paymentTimeoutMin = slot.court.complex.paymentTimeoutMin || 15
      const expiresAt = new Date(Date.now() + paymentTimeoutMin * 60 * 1000)

      // Create booking
      const newBooking = await tx.booking.create({
        data: {
          slotId,
          courtId: slot.courtId,
          complexId: whatsappConfig.complexId,
          customerName,
          customerPhone,
          customerEmail: customerEmail || null,
          totalAmount: slot.court.pricePerHour,
          status: "PAYMENT_PENDING",
          expiresAt,
          notes: notes ? `[Chatbot WhatsApp] ${notes}` : "[Chatbot WhatsApp]",
        },
      })

      return {
        booking: newBooking,
        slot,
        bankAccounts: slot.court.complex.bankAccounts,
      }
    })

    return NextResponse.json({
      success: true,
      bookingId: booking.booking.id,
      totalAmount: booking.booking.totalAmount,
      status: booking.booking.status,
      courtName: booking.slot.court.name,
      courtType: booking.slot.court.type,
      startTime: booking.slot.startTime,
      endTime: booking.slot.endTime,
      expiresAt: booking.booking.expiresAt,
      bankAccounts: booking.bankAccounts,
    })
  } catch (error: any) {
    if (error.message === "SLOT_NOT_AVAILABLE") {
      return NextResponse.json(
        { error: "El horario ya no se encuentra disponible. Por favor seleccione otro horario." },
        { status: 409 }
      )
    }
    if (error.message === "SLOT_NOT_FOUND") {
      return NextResponse.json({ error: "Slot no encontrado" }, { status: 404 })
    }
    if (error.message === "SLOT_COMPLEX_MISMATCH") {
      return NextResponse.json({ error: "El slot no corresponde al complejo" }, { status: 400 })
    }

    console.error("[BOT_RESERVAS_ERROR]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
