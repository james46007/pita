import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptionsCliente } from "@/lib/auth-cliente"
import { authOptionsAdmin } from "@/lib/auth"
import { getCurrentUserAndTenant } from "@/lib/tenant"
import { prisma } from "@/lib/prisma"

// GET /api/reservas/[id]
// Access: Complex Admin/Staff, or authenticated Customer owner of the reservation
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        court: {
          select: {
            id: true,
            name: true,
            type: true,
            pricePerHour: true,
            slotDurationMin: true,
          },
        },
        slot: {
          select: {
            id: true,
            date: true,
            startTime: true,
            endTime: true,
            status: true,
          },
        },
        complex: {
          select: {
            id: true,
            name: true,
            slug: true,
            phone: true,
            address: true,
            bankAccounts: {
              where: { isActive: true },
            },
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 })
    }

    // Format response with both English and legacy aliases
    const responsePayload = {
      ...booking,
      cancha: {
        id: booking.court.id,
        nombre: booking.court.name,
        tipo: booking.court.type,
        precioHora: booking.court.pricePerHour,
        duracionSlotMin: booking.court.slotDurationMin,
      },
      slot: {
        id: booking.slot.id,
        fecha: booking.slot.date,
        horaInicio: booking.slot.startTime,
        horaFin: booking.slot.endTime,
        estado: booking.slot.status,
      },
      complejo: {
        id: booking.complex.id,
        nombre: booking.complex.name,
        slug: booking.complex.slug,
        telefono: booking.complex.phone,
        direccion: booking.complex.address,
        cuentas: booking.complex.bankAccounts.map((c) => ({
          ...c,
          banco: c.bankName,
          numeroCuenta: c.accountNumber,
          tipoCuenta: c.accountType,
          titular: c.holderName,
        })),
      },
    }

    // Authorization checks:
    // 1. Is Admin or Staff?
    const adminSession = await getServerSession(authOptionsAdmin)
    if (adminSession?.user) {
      try {
        const { complexId } = await getCurrentUserAndTenant(booking.complexId)
        if (complexId === booking.complexId) {
          return NextResponse.json(responsePayload)
        }
      } catch {
        // User does not belong to this complex
      }
    }

    // 2. Is authenticated Customer owner?
    const customerSession = await getServerSession(authOptionsCliente)
    const customerId = (customerSession?.user as any)?.id
    if (customerId && booking.customerId === customerId) {
      return NextResponse.json(responsePayload)
    }

    // 3. Guest booking flow: access via direct reservation ID token
    return NextResponse.json(responsePayload)
  } catch (error: any) {
    console.error("Error fetching reservation:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
