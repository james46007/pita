import { prisma } from "@/lib/prisma"
import { cleanupExpiredBookings } from "@/lib/booking-expiration"

/**
 * Tools the LLM may call. All of them are scoped to the complex and to the
 * customer's own phone, so the model can never touch other tenants' or users' data.
 */
export interface ToolContext {
  complexId: string
  customerPhone: string
  customerName: string
}

// Gemini function declarations (OpenAPI subset).
export const TOOL_DECLARATIONS = [
  {
    name: "get_availability",
    description: "Lista los horarios libres de las canchas del complejo para una fecha.",
    parameters: {
      type: "OBJECT",
      properties: { date: { type: "STRING", description: "Fecha en formato YYYY-MM-DD" } },
      required: ["date"],
    },
  },
  {
    name: "create_booking",
    description:
      "Crea una reserva para un horario libre (slotId obtenido de get_availability). Solo llamar cuando el cliente confirmó explícitamente.",
    parameters: {
      type: "OBJECT",
      properties: { slotId: { type: "STRING" } },
      required: ["slotId"],
    },
  },
  {
    name: "list_my_bookings",
    description: "Lista las reservas recientes y próximas del cliente que escribe.",
    parameters: { type: "OBJECT", properties: {} },
  },
  {
    name: "cancel_booking",
    description:
      "Cancela una reserva del cliente pendiente de pago y libera el horario. Solo con confirmación explícita.",
    parameters: {
      type: "OBJECT",
      properties: { bookingId: { type: "STRING" } },
      required: ["bookingId"],
    },
  },
]

const phoneTail = (phone: string) => phone.replace(/\D/g, "").slice(-8)

async function getAvailability(ctx: ToolContext, args: { date?: string }) {
  if (!args.date || !/^\d{4}-\d{2}-\d{2}$/.test(args.date)) {
    return { error: "Fecha inválida, se espera YYYY-MM-DD" }
  }

  const courts = await prisma.court.findMany({
    where: { complexId: ctx.complexId, isActive: true },
    select: { id: true },
  })
  await Promise.all(courts.map((c) => cleanupExpiredBookings(c.id)))

  const slots = await prisma.slot.findMany({
    where: {
      court: { complexId: ctx.complexId, isActive: true },
      date: new Date(`${args.date}T00:00:00Z`),
      status: "AVAILABLE",
    },
    include: { court: { select: { name: true, type: true, pricePerHour: true } } },
    orderBy: [{ court: { name: "asc" } }, { startTime: "asc" }],
    take: 60,
  })

  return {
    date: args.date,
    total: slots.length,
    slots: slots.map((s) => ({
      slotId: s.id,
      court: s.court.name,
      type: s.court.type,
      price: Number(s.court.pricePerHour),
      start: s.startTime,
      end: s.endTime,
    })),
  }
}

async function createBooking(ctx: ToolContext, args: { slotId?: string }) {
  if (!args.slotId) return { error: "slotId requerido" }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const slot = await tx.slot.findUnique({
        where: { id: args.slotId },
        include: { court: { include: { complex: { include: { bankAccounts: { where: { isActive: true } } } } } } },
      })
      if (!slot || slot.court.complexId !== ctx.complexId) throw new Error("SLOT_NOT_FOUND")
      if (slot.status !== "AVAILABLE") throw new Error("SLOT_NOT_AVAILABLE")

      await tx.slot.update({ where: { id: slot.id }, data: { status: "BOOKED" } })

      const timeoutMin = slot.court.complex.paymentTimeoutMin || 15
      const booking = await tx.booking.create({
        data: {
          slotId: slot.id,
          courtId: slot.courtId,
          complexId: ctx.complexId,
          customerName: ctx.customerName,
          customerPhone: ctx.customerPhone,
          totalAmount: slot.court.pricePerHour,
          status: "PAYMENT_PENDING",
          expiresAt: new Date(Date.now() + timeoutMin * 60 * 1000),
          notes: "[Chatbot WhatsApp IA]",
        },
      })
      return { booking, slot, bankAccounts: slot.court.complex.bankAccounts, timeoutMin }
    })

    return {
      success: true,
      bookingId: result.booking.id,
      court: result.slot.court.name,
      date: result.slot.date.toISOString().slice(0, 10),
      start: result.slot.startTime,
      end: result.slot.endTime,
      total: Number(result.booking.totalAmount),
      payWithinMinutes: result.timeoutMin,
      bankAccounts: result.bankAccounts.map((b) => ({
        bank: b.bankName,
        number: b.accountNumber,
        type: b.accountType,
        holder: b.holderName,
        holderId: b.holderId,
      })),
      nextStep: "El cliente debe enviar la foto del comprobante de pago por este chat.",
    }
  } catch (e: any) {
    if (e.message === "SLOT_NOT_AVAILABLE") return { error: "Ese horario ya no está disponible." }
    if (e.message === "SLOT_NOT_FOUND") return { error: "Horario no encontrado." }
    console.error("[BOT_TOOL_CREATE_BOOKING]", e)
    return { error: "No se pudo crear la reserva." }
  }
}

async function listMyBookings(ctx: ToolContext) {
  const bookings = await prisma.booking.findMany({
    where: {
      complexId: ctx.complexId,
      customerPhone: { contains: phoneTail(ctx.customerPhone) },
      status: { not: "CANCELLED" },
    },
    include: { slot: true, court: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  })

  return {
    total: bookings.length,
    bookings: bookings.map((b) => ({
      bookingId: b.id,
      court: b.court.name,
      date: b.slot.date.toISOString().slice(0, 10),
      start: b.slot.startTime,
      end: b.slot.endTime,
      status: b.status,
      total: Number(b.totalAmount),
    })),
  }
}

async function cancelBooking(ctx: ToolContext, args: { bookingId?: string }) {
  if (!args.bookingId) return { error: "bookingId requerido" }

  const booking = await prisma.booking.findFirst({
    where: {
      id: args.bookingId,
      complexId: ctx.complexId,
      customerPhone: { contains: phoneTail(ctx.customerPhone) },
    },
  })
  if (!booking) return { error: "Reserva no encontrada para este número." }
  if (booking.status !== "PAYMENT_PENDING") {
    return {
      error:
        "Solo se pueden cancelar por chat reservas pendientes de pago. Para las demás, debe contactar directamente al complejo.",
    }
  }

  await prisma.$transaction([
    prisma.booking.update({ where: { id: booking.id }, data: { status: "CANCELLED" } }),
    prisma.slot.update({ where: { id: booking.slotId }, data: { status: "AVAILABLE" } }),
  ])
  return { success: true, bookingId: booking.id }
}

export async function runTool(name: string, args: any, ctx: ToolContext): Promise<unknown> {
  switch (name) {
    case "get_availability":
      return getAvailability(ctx, args || {})
    case "create_booking":
      return createBooking(ctx, args || {})
    case "list_my_bookings":
      return listMyBookings(ctx)
    case "cancel_booking":
      return cancelBooking(ctx, args || {})
    default:
      return { error: `Tool desconocida: ${name}` }
  }
}
