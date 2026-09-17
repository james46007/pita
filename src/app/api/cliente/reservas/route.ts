import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptionsCliente } from "@/lib/auth-cliente"
import { prisma } from "@/lib/prisma"

// GET /api/cliente/reservas
// Returns booking history for authenticated customer
export async function GET() {
  try {
    const session = await getServerSession(authOptionsCliente)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
    }

    const customerId = (session.user as any).id

    const bookings = await prisma.booking.findMany({
      where: { customerId },
      include: {
        complex: {
          select: {
            name: true,
            slug: true,
            phone: true,
            address: true,
          },
        },
        court: {
          select: {
            name: true,
            type: true,
          },
        },
        slot: {
          select: {
            date: true,
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const formatted = bookings.map((b) => ({
      ...b,
      nombreCliente: b.customerName,
      telefonoCliente: b.customerPhone,
      estado: b.status,
      montoTotal: b.totalAmount,
      comprobanteUrl: b.receiptUrl,
      creadaAt: b.createdAt,
      complejo: {
        nombre: b.complex.name,
        slug: b.complex.slug,
        telefono: b.complex.phone,
        direccion: b.complex.address,
      },
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
  } catch (error) {
    console.error("Error fetching customer reservations:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
