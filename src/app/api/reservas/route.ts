import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptionsCliente } from "@/lib/auth-cliente"
import { getCurrentUserAndTenant } from "@/lib/tenant"
import { prisma } from "@/lib/prisma"
import { cleanupExpiredBookings } from "@/lib/booking-expiration"

const createBookingSchema = z.object({
  slotId: z.string().min(1, "slotId is required"),
  customerName: z.string().min(2, "Customer name required"),
  customerPhone: z.string().min(7, "Customer phone required"),
  customerEmail: z.string().email("Invalid email address").optional(),
  notes: z.string().optional(),
})

// POST /api/reservas (Public - Registered player or guest)
// Guarantees transactional anti-overbooking
export async function POST(req: Request) {
  try {
    const raw = await req.json()
    const body = {
      slotId: raw.slotId,
      customerName: raw.customerName ?? raw.nombreCliente,
      customerPhone: raw.customerPhone ?? raw.telefonoCliente,
      customerEmail: (raw.customerEmail ?? raw.emailCliente) || undefined,
      notes: raw.notes ?? raw.notas,
    }

    const validated = createBookingSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid data", issues: validated.error.flatten() },
        { status: 400 }
      )
    }

    const { slotId, customerName, customerPhone, customerEmail, notes } = validated.data

    // Check if customer is authenticated
    const customerSession = await getServerSession(authOptionsCliente)
    const customerId = (customerSession?.user as any)?.id || null

    // Atomic transaction: Lock slot + create booking
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch slot with court and complex info
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

      if (slot.status !== "AVAILABLE") {
        throw new Error("SLOT_NOT_AVAILABLE") // Anti-overbooking
      }

      // 2. Mark slot as BOOKED
      await tx.slot.update({
        where: { id: slotId },
        data: { status: "BOOKED" },
      })

      // 3. Calculate expiration deadline based on complex configuration (default 15 minutes)
      const timeoutMin = slot.court.complex.paymentTimeoutMin || 15
      const expiresAt = new Date(Date.now() + timeoutMin * 60 * 1000)

      const totalAmount = Number(slot.court.pricePerHour) * (slot.court.slotDurationMin / 60)

      const booking = await tx.booking.create({
        data: {
          slotId,
          courtId: slot.courtId,
          complexId: slot.court.complexId,
          customerId,
          customerName,
          customerPhone,
          customerEmail,
          totalAmount,
          notes,
          status: "PAYMENT_PENDING",
          expiresAt,
        },
        include: {
          court: { select: { name: true, type: true } },
          slot: { select: { date: true, startTime: true, endTime: true } },
        },
      })

      return {
        booking,
        bankAccounts: slot.court.complex.bankAccounts,
      }
    })

    return NextResponse.json(
      {
        message: "Reservation created successfully. Proceed to payment to confirm.",
        booking: result.booking,
        reserva: {
          ...result.booking,
          id: result.booking.id,
        },
        paymentInstructions: result.bankAccounts,
        instruccionesPago: result.bankAccounts,
      },
      { status: 201 }
    )
  } catch (error: any) {
    if (error.message === "SLOT_NOT_FOUND") {
      return NextResponse.json({ error: "Selected slot does not exist" }, { status: 404 })
    }
    if (error.message === "SLOT_NOT_AVAILABLE" || error.code === "P2002") {
      return NextResponse.json(
        { error: "This slot was just booked by another user" },
        { status: 409 }
      )
    }
    console.error("Error creating reservation:", error)
    return NextResponse.json({ error: "Internal error processing reservation" }, { status: 500 })
  }
}

// GET /api/reservas (Admin/Staff complex booking query)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const targetComplexId = searchParams.get("complexId") || searchParams.get("complejoId") || undefined
    let statusFilter = searchParams.get("status") || searchParams.get("estado") || undefined
    if (statusFilter === "CONFIRMADA") statusFilter = "CONFIRMED"
    if (statusFilter === "PENDIENTE_PAGO") statusFilter = "PAYMENT_PENDING"
    if (statusFilter === "COMPROBANTE_SUBIDO") statusFilter = "RECEIPT_UPLOADED"
    if (statusFilter === "CANCELADA") statusFilter = "CANCELLED"

    const dateStr = searchParams.get("date") || searchParams.get("fecha") || undefined

    const { complexId } = await getCurrentUserAndTenant(targetComplexId)

    // Automatically release any bookings that have exceeded their payment timeout
    await cleanupExpiredBookings(undefined, complexId)

    const where: any = { complexId }

    if (statusFilter) {
      where.status = statusFilter
    }

    if (dateStr) {
      const date = new Date(`${dateStr}T00:00:00Z`)
      where.slot = { date }
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        court: { select: { name: true, type: true } },
        slot: { select: { date: true, startTime: true, endTime: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    // Add legacy aliases for backward compatibility with existing frontends
    const formatted = bookings.map((b) => ({
      ...b,
      nombreCliente: b.customerName,
      telefonoCliente: b.customerPhone,
      emailCliente: b.customerEmail,
      estado: b.status,
      montoTotal: b.totalAmount,
      comprobanteUrl: b.receiptUrl,
      creadaAt: b.createdAt,
      cancha: {
        nombre: b.court.name,
        tipo: b.court.type,
      },
      slot: {
        fecha: b.slot.date,
        horaInicio: b.slot.startTime,
        horaFin: b.slot.endTime,
      },
    }))

    return NextResponse.json(formatted)
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (error.message === "FORBIDDEN_TENANT_ACCESS") return NextResponse.json({ error: "Access denied" }, { status: 403 })
    console.error("Error listing reservations:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
