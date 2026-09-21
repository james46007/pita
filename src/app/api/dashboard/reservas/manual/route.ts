import { NextResponse } from "next/server"
import { z } from "zod"
import { BookingStatus, SlotStatus } from "@prisma/client"
import { getCurrentUserAndTenant } from "@/lib/tenant"
import { prisma } from "@/lib/prisma"
import { assertSubscriptionWriteAccess, SubscriptionExpiredError } from "@/lib/subscription-guard"

const manualBookingSchema = z.object({
  slotId: z.string().min(1, "slotId is required"),
  customerName: z.string().min(2, "Customer name required"),
  customerPhone: z.string().min(6, "Customer phone required"),
  customerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  paymentMethod: z.string().optional().default("CASH"),
  notes: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const targetComplexId = searchParams.get("complexId") || searchParams.get("complejoId") || undefined
    const { complexId, role } = await getCurrentUserAndTenant(targetComplexId)

    // Soft-lock subscription guard: ensure complex is authorized for write operations
    await assertSubscriptionWriteAccess(complexId)

    const raw = await req.json()
    const body = {
      slotId: raw.slotId,
      customerName: raw.customerName ?? raw.nombreCliente,
      customerPhone: raw.customerPhone ?? raw.telefonoCliente,
      customerEmail: raw.customerEmail ?? raw.emailCliente,
      paymentMethod: raw.paymentMethod ?? raw.metodoPago,
      notes: raw.notes ?? raw.notas,
    }

    const validated = manualBookingSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid reservation data", issues: validated.error.flatten() },
        { status: 400 }
      )
    }

    const { slotId, customerName, customerPhone, customerEmail, paymentMethod, notes } = validated.data

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch slot and verify ownership by this complex
      const slot = await tx.slot.findUnique({
        where: { id: slotId },
        include: {
          court: {
            select: {
              id: true,
              name: true,
              type: true,
              pricePerHour: true,
              complexId: true,
            },
          },
        },
      })

      if (!slot) {
        throw new Error("SLOT_NOT_FOUND")
      }

      if (slot.court.complexId !== complexId) {
        throw new Error("FORBIDDEN_COMPLEX")
      }

      if (slot.status !== SlotStatus.AVAILABLE) {
        throw new Error("SLOT_NOT_AVAILABLE")
      }

      // 2. Mark slot as BOOKED
      await tx.slot.update({
        where: { id: slotId },
        data: { status: SlotStatus.BOOKED },
      })

      // 3. Construct notes with payment method info
      const combinedNotes = [
        notes,
        paymentMethod ? `[Manual Booking - Payment: ${paymentMethod}]` : "[Manual Booking]",
      ]
        .filter(Boolean)
        .join(" ")

      // 4. Create confirmed booking
      const booking = await tx.booking.create({
        data: {
          slotId: slot.id,
          courtId: slot.court.id,
          complexId,
          customerName,
          customerPhone,
          customerEmail: customerEmail || null,
          status: BookingStatus.CONFIRMED,
          totalAmount: slot.court.pricePerHour,
          notes: combinedNotes,
        },
        include: {
          court: { select: { id: true, name: true, type: true } },
          slot: { select: { id: true, date: true, startTime: true, endTime: true } },
        },
      })

      return booking
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    if (error.message === "SLOT_NOT_FOUND") {
      return NextResponse.json({ error: "Selected slot not found" }, { status: 404 })
    }
    if (error.message === "FORBIDDEN_COMPLEX") {
      return NextResponse.json({ error: "Access denied to slot for this complex" }, { status: 403 })
    }
    if (error.message === "SLOT_NOT_AVAILABLE") {
      return NextResponse.json(
        { error: "Slot is no longer available (already booked or locked)" },
        { status: 409 }
      )
    }
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error.message === "FORBIDDEN_TENANT_ACCESS") {
      return NextResponse.json({ error: "Forbidden: Access denied to complex" }, { status: 403 })
    }

    if (error instanceof SubscriptionExpiredError) {
      return NextResponse.json(
        {
          error: "SUBSCRIPTION_EXPIRED",
          message: error.message,
          subscription: error.subscriptionState,
        },
        { status: 402 }
      )
    }

    console.error("Error creating manual booking:", error)
    return NextResponse.json({ error: "Internal server error creating manual booking" }, { status: 500 })
  }
}
