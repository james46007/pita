import { prisma } from "@/lib/prisma"

/**
 * Checks and releases any bookings that have exceeded their payment timeout.
 * Reverts the corresponding slot back to AVAILABLE and marks the booking as CANCELLED.
 */
export async function cleanupExpiredBookings(courtId?: string, complexId?: string): Promise<number> {
  const now = new Date()

  try {
    const expiredBookings = await prisma.booking.findMany({
      where: {
        status: "PAYMENT_PENDING",
        expiresAt: {
          lte: now,
          not: null,
        },
        ...(courtId ? { courtId } : {}),
        ...(complexId ? { complexId } : {}),
      },
      select: {
        id: true,
        slotId: true,
      },
    })

    if (expiredBookings.length === 0) {
      return 0
    }

    const bookingIds = expiredBookings.map((b) => b.id)
    const slotIds = expiredBookings.map((b) => b.slotId)

    await prisma.$transaction(async (tx) => {
      // 1. Cancel expired bookings
      await tx.booking.updateMany({
        where: { id: { in: bookingIds }, status: "PAYMENT_PENDING" },
        data: {
          status: "CANCELLED",
          notes: "Expired automatically: payment receipt timeout exceeded",
        },
      })

      // 2. Free up corresponding slots so other players can book them
      await tx.slot.updateMany({
        where: { id: { in: slotIds }, status: "BOOKED" },
        data: {
          status: "AVAILABLE",
        },
      })
    })

    return expiredBookings.length
  } catch (error) {
    console.error("Error cleaning up expired bookings:", error)
    return 0
  }
}

/**
 * Validates if a single booking is expired
 */
export function isBookingExpired(booking: { status: string; expiresAt: Date | null }): boolean {
  if (booking.status !== "PAYMENT_PENDING" || !booking.expiresAt) {
    return false
  }
  return new Date() > new Date(booking.expiresAt)
}
