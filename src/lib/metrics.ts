import { prisma } from "@/lib/prisma"
import { BookingStatus, SlotStatus } from "@prisma/client"

export interface MetricsSummaryFilter {
  complexId: string
  startDate: Date
  endDate: Date
}

export interface CourtMetricBreakdown {
  courtId: string
  courtName: string
  courtType: string
  confirmedRevenue: number
  confirmedBookingsCount: number
  totalSlots: number
  bookedSlots: number
  occupancyRate: number
}

export interface PeakHourMetric {
  time: string
  bookingsCount: number
  percentage: number
}

export interface DayOfWeekMetric {
  dayName: string
  dayIndex: number
  bookingsCount: number
}

export interface DailyRevenueMetric {
  date: string
  confirmedRevenue: number
  bookingsCount: number
}

export interface MetricsSummaryResponse {
  dateRange: {
    startDate: string
    endDate: string
  }
  kpis: {
    totalConfirmedRevenue: number
    totalProjectedRevenue: number
    confirmedBookingsCount: number
    pendingBookingsCount: number
    totalBookingsCount: number
    averageTicket: number
    totalSlots: number
    bookedSlots: number
    occupancyRate: number
  }
  courtBreakdown: CourtMetricBreakdown[]
  peakHours: PeakHourMetric[]
  daysOfWeek: DayOfWeekMetric[]
  dailyRevenue: DailyRevenueMetric[]
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

/**
 * Calculates comprehensive financial and occupancy metrics for a complex within a date range.
 */
export async function getComplexMetricsSummary({
  complexId,
  startDate,
  endDate,
}: MetricsSummaryFilter): Promise<MetricsSummaryResponse> {
  // Normalize start and end of dates
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)

  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)

  // 1. Fetch all bookings for the complex within the date range
  const bookings = await prisma.booking.findMany({
    where: {
      complexId,
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    include: {
      court: {
        select: { id: true, name: true, type: true },
      },
      slot: {
        select: { id: true, date: true, startTime: true, endTime: true },
      },
    },
    orderBy: { createdAt: "asc" },
  })

  // 2. Fetch all courts for the complex to guarantee representation even with 0 bookings
  const courts = await prisma.court.findMany({
    where: { complexId, isActive: true },
    select: { id: true, name: true, type: true },
  })

  // 3. Fetch slots within the date range to calculate true occupancy
  const slots = await prisma.slot.findMany({
    where: {
      court: { complexId },
      date: {
        gte: start,
        lte: end,
      },
    },
    select: {
      id: true,
      courtId: true,
      status: true,
      startTime: true,
      date: true,
    },
  })

  // KPI Calculations
  let totalConfirmedRevenue = 0
  let totalProjectedRevenue = 0
  let confirmedBookingsCount = 0
  let pendingBookingsCount = 0

  const courtStatsMap = new Map<
    string,
    {
      courtId: string
      courtName: string
      courtType: string
      confirmedRevenue: number
      confirmedBookingsCount: number
      totalSlots: number
      bookedSlots: number
    }
  >()

  // Initialize all courts in stats map
  for (const court of courts) {
    courtStatsMap.set(court.id, {
      courtId: court.id,
      courtName: court.name,
      courtType: court.type,
      confirmedRevenue: 0,
      confirmedBookingsCount: 0,
      totalSlots: 0,
      bookedSlots: 0,
    })
  }

  // Count slot availability per court
  for (const slot of slots) {
    const stat = courtStatsMap.get(slot.courtId)
    if (stat) {
      stat.totalSlots += 1
      if (slot.status === SlotStatus.BOOKED) {
        stat.bookedSlots += 1
      }
    }
  }

  const hourlyCounts = new Map<string, number>()
  const dayOfWeekCounts = new Array<number>(7).fill(0)
  const dailyRevenueMap = new Map<string, { confirmedRevenue: number; bookingsCount: number }>()

  for (const b of bookings) {
    const amount = Number(b.totalAmount) || 0

    if (b.status === BookingStatus.CONFIRMED) {
      totalConfirmedRevenue += amount
      confirmedBookingsCount += 1

      // Court breakdown
      const courtStat = courtStatsMap.get(b.courtId)
      if (courtStat) {
        courtStat.confirmedRevenue += amount
        courtStat.confirmedBookingsCount += 1
      }

      // Daily revenue grouping
      const dateKey = b.createdAt.toISOString().split("T")[0]
      const currentDay = dailyRevenueMap.get(dateKey) || { confirmedRevenue: 0, bookingsCount: 0 }
      currentDay.confirmedRevenue += amount
      currentDay.bookingsCount += 1
      dailyRevenueMap.set(dateKey, currentDay)
    } else if (
      b.status === BookingStatus.PAYMENT_PENDING ||
      b.status === BookingStatus.RECEIPT_UPLOADED
    ) {
      totalProjectedRevenue += amount
      pendingBookingsCount += 1
    }

    // Hourly demand distribution (all non-cancelled bookings)
    if (b.status !== BookingStatus.CANCELLED) {
      const startTime = b.slot?.startTime || "Unknown"
      hourlyCounts.set(startTime, (hourlyCounts.get(startTime) || 0) + 1)

      const bookingDate = b.slot?.date ? new Date(b.slot.date) : new Date(b.createdAt)
      const dayIndex = bookingDate.getUTCDay()
      dayOfWeekCounts[dayIndex] = (dayOfWeekCounts[dayIndex] || 0) + 1
    }
  }

  const totalBookingsCount = bookings.length
  const averageTicket =
    confirmedBookingsCount > 0 ? Math.round((totalConfirmedRevenue / confirmedBookingsCount) * 100) / 100 : 0

  const totalSlots = slots.length
  const totalBookedSlots = slots.filter((s) => s.status === SlotStatus.BOOKED).length
  const overallOccupancyRate =
    totalSlots > 0 ? Math.round((totalBookedSlots / totalSlots) * 1000) / 10 : 0

  // Format Court Breakdown
  const courtBreakdown: CourtMetricBreakdown[] = Array.from(courtStatsMap.values()).map((c) => ({
    courtId: c.courtId,
    courtName: c.courtName,
    courtType: c.courtType,
    confirmedRevenue: Math.round(c.confirmedRevenue * 100) / 100,
    confirmedBookingsCount: c.confirmedBookingsCount,
    totalSlots: c.totalSlots,
    bookedSlots: c.bookedSlots,
    occupancyRate: c.totalSlots > 0 ? Math.round((c.bookedSlots / c.totalSlots) * 1000) / 10 : 0,
  }))

  // Format Peak Hours sorted by time
  const totalActiveBookings = Array.from(hourlyCounts.values()).reduce((acc, curr) => acc + curr, 0)
  const peakHours: PeakHourMetric[] = Array.from(hourlyCounts.entries())
    .map(([time, count]) => ({
      time,
      bookingsCount: count,
      percentage: totalActiveBookings > 0 ? Math.round((count / totalActiveBookings) * 1000) / 10 : 0,
    }))
    .sort((a, b) => a.time.localeCompare(b.time))

  // Format Days of Week
  const daysOfWeek: DayOfWeekMetric[] = dayOfWeekCounts.map((count, index) => ({
    dayName: DAY_NAMES[index],
    dayIndex: index,
    bookingsCount: count,
  }))

  // Format Daily Revenue
  const dailyRevenue: DailyRevenueMetric[] = Array.from(dailyRevenueMap.entries())
    .map(([date, data]) => ({
      date,
      confirmedRevenue: Math.round(data.confirmedRevenue * 100) / 100,
      bookingsCount: data.bookingsCount,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    dateRange: {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    },
    kpis: {
      totalConfirmedRevenue: Math.round(totalConfirmedRevenue * 100) / 100,
      totalProjectedRevenue: Math.round(totalProjectedRevenue * 100) / 100,
      confirmedBookingsCount,
      pendingBookingsCount,
      totalBookingsCount,
      averageTicket,
      totalSlots,
      bookedSlots: totalBookedSlots,
      occupancyRate: overallOccupancyRate,
    },
    courtBreakdown,
    peakHours,
    daysOfWeek,
    dailyRevenue,
  }
}

/**
 * Generates RFC 4180 compliant CSV string of bookings for export.
 */
export async function exportBookingsToCSV({
  complexId,
  startDate,
  endDate,
}: MetricsSummaryFilter): Promise<string> {
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)

  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)

  const bookings = await prisma.booking.findMany({
    where: {
      complexId,
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    include: {
      court: { select: { name: true, type: true } },
      slot: { select: { date: true, startTime: true, endTime: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const headers = [
    "Booking ID",
    "Date",
    "Time Slot",
    "Court",
    "Court Type",
    "Customer Name",
    "Customer Phone",
    "Customer Email",
    "Total Amount",
    "Status",
    "Created At",
  ]

  const escapeCSV = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return '""'
    const stringValue = String(value).replace(/"/g, '""')
    return `"${stringValue}"`
  }

  const rows = bookings.map((b) => {
    const slotDate = b.slot?.date ? new Date(b.slot.date).toISOString().split("T")[0] : ""
    const timeSlot = b.slot ? `${b.slot.startTime} - ${b.slot.endTime}` : ""
    const createdAtFormatted = new Date(b.createdAt).toISOString()

    return [
      escapeCSV(b.id),
      escapeCSV(slotDate),
      escapeCSV(timeSlot),
      escapeCSV(b.court?.name || ""),
      escapeCSV(b.court?.type || ""),
      escapeCSV(b.customerName),
      escapeCSV(b.customerPhone),
      escapeCSV(b.customerEmail || ""),
      escapeCSV(Number(b.totalAmount).toFixed(2)),
      escapeCSV(b.status),
      escapeCSV(createdAtFormatted),
    ].join(",")
  })

  return [headers.join(","), ...rows].join("\r\n")
}
