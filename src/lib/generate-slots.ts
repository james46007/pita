import { prisma } from "@/lib/prisma"

/**
 * Generates fixed-duration availability slots for a court across a date range.
 * Complies with weekly schedules configured in AvailableSchedule.
 */
export async function generateSlotsForCourt(
  courtId: string,
  startDate: Date,
  endDate: Date
) {
  const court = await prisma.court.findUnique({
    where: { id: courtId },
    include: { schedules: { where: { isActive: true } } },
  })

  if (!court) {
    throw new Error("COURT_NOT_FOUND")
  }

  const slotsToCreate: Array<{
    courtId: string
    date: Date
    startTime: string
    endTime: string
    status: "AVAILABLE"
  }> = []

  const slotDuration = court.slotDurationMin || 60
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay()
    const daySchedule = court.schedules.find((h) => h.dayOfWeek === dayOfWeek)

    if (daySchedule) {
      const [openH, openM] = daySchedule.openTime.split(":").map(Number)
      const [closeH, closeM] = daySchedule.closeTime.split(":").map(Number)

      let currentMinutes = openH * 60 + openM
      const closeMinutes = closeH * 60 + closeM

      while (currentMinutes + slotDuration <= closeMinutes) {
        const startH = Math.floor(currentMinutes / 60)
        const startM = currentMinutes % 60
        const endH = Math.floor((currentMinutes + slotDuration) / 60)
        const endM = (currentMinutes + slotDuration) % 60

        const startTimeStr = `${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}`
        const endTimeStr = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`

        slotsToCreate.push({
          courtId,
          date: new Date(currentDate),
          startTime: startTimeStr,
          endTime: endTimeStr,
          status: "AVAILABLE",
        })

        currentMinutes += slotDuration
      }
    }

    // Advance by one day
    currentDate.setDate(currentDate.getDate() + 1)
  }

  if (slotsToCreate.length > 0) {
    return await prisma.slot.createMany({
      data: slotsToCreate,
      skipDuplicates: true, // Idempotency guaranteed by @@unique([courtId, date, startTime])
    })
  }

  return { count: 0 }
}
