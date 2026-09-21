import { prisma } from "@/lib/prisma"
import { BookingStatus } from "@prisma/client"

export type RevenueTier = "BRONZE" | "SILVER" | "GOLD"

export interface ComplexRankingItem {
  complexId: string
  name: string
  slug: string
  phone: string
  address: string
  isActive: boolean
  courtsCount: number
  confirmedBookingsCount: number
  confirmedRevenue: number
  averageTicket: number
  revenueTier: RevenueTier
}

export interface AdminMetricsSummaryResponse {
  dateRange: {
    startDate: string
    endDate: string
  }
  kpis: {
    totalGmv: number
    totalConfirmedBookings: number
    platformAverageTicket: number
    activeComplexesCount: number
    totalComplexesCount: number
    goldComplexesCount: number
    silverComplexesCount: number
    bronzeComplexesCount: number
  }
  ranking: ComplexRankingItem[]
}

export interface AdminMetricsFilter {
  startDate: Date
  endDate: Date
}

/**
 * Calculates preliminary revenue tier based on monthly confirmed GMV.
 * - GOLD: >= $5,000
 * - SILVER: >= $2,000 and < $5,000
 * - BRONZE: < $2,000
 */
export function getRevenueTier(revenue: number): RevenueTier {
  if (revenue >= 5000) return "GOLD"
  if (revenue >= 2000) return "SILVER"
  return "BRONZE"
}

/**
 * Computes consolidated multi-tenant platform metrics and complex ranking for SUPER_ADMIN.
 */
export async function getAdminMetricsSummary({
  startDate,
  endDate,
}: AdminMetricsFilter): Promise<AdminMetricsSummaryResponse> {
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)

  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)

  // 1. Fetch all complexes with active courts count
  const complexes = await prisma.complex.findMany({
    include: {
      courts: {
        where: { isActive: true },
        select: { id: true },
      },
    },
    orderBy: { name: "asc" },
  })

  // 2. Fetch all confirmed bookings across all complexes within date range
  const confirmedBookings = await prisma.booking.findMany({
    where: {
      status: BookingStatus.CONFIRMED,
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    select: {
      id: true,
      complexId: true,
      totalAmount: true,
    },
  })

  // 3. Aggregate booking totals per complex
  const complexRevenueMap = new Map<string, { count: number; total: number }>()
  for (const booking of confirmedBookings) {
    const existing = complexRevenueMap.get(booking.complexId) || { count: 0, total: 0 }
    existing.count += 1
    existing.total += Number(booking.totalAmount)
    complexRevenueMap.set(booking.complexId, existing)
  }

  // 4. Build ranking items
  let goldCount = 0
  let silverCount = 0
  let bronzeCount = 0

  const ranking: ComplexRankingItem[] = complexes.map((c) => {
    const revenueData = complexRevenueMap.get(c.id) || { count: 0, total: 0 }
    const confirmedRevenue = Math.round(revenueData.total * 100) / 100
    const confirmedBookingsCount = revenueData.count
    const averageTicket =
      confirmedBookingsCount > 0
        ? Math.round((confirmedRevenue / confirmedBookingsCount) * 100) / 100
        : 0

    const revenueTier = getRevenueTier(confirmedRevenue)
    if (revenueTier === "GOLD") goldCount++
    else if (revenueTier === "SILVER") silverCount++
    else bronzeCount++

    return {
      complexId: c.id,
      name: c.name,
      slug: c.slug,
      phone: c.phone,
      address: c.address,
      isActive: c.isActive,
      courtsCount: c.courts.length,
      confirmedBookingsCount,
      confirmedRevenue,
      averageTicket,
      revenueTier,
    }
  })

  // Sort ranking by confirmed revenue descending, then confirmed bookings count descending
  ranking.sort((a, b) => {
    if (b.confirmedRevenue !== a.confirmedRevenue) {
      return b.confirmedRevenue - a.confirmedRevenue
    }
    return b.confirmedBookingsCount - a.confirmedBookingsCount
  })

  // 5. Calculate platform-wide totals
  const totalGmv = Math.round(
    ranking.reduce((sum, item) => sum + item.confirmedRevenue, 0) * 100
  ) / 100
  const totalConfirmedBookings = confirmedBookings.length
  const platformAverageTicket =
    totalConfirmedBookings > 0
      ? Math.round((totalGmv / totalConfirmedBookings) * 100) / 100
      : 0
  const activeComplexesCount = complexes.filter((c) => c.isActive).length

  return {
    dateRange: {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    },
    kpis: {
      totalGmv,
      totalConfirmedBookings,
      platformAverageTicket,
      activeComplexesCount,
      totalComplexesCount: complexes.length,
      goldComplexesCount: goldCount,
      silverComplexesCount: silverCount,
      bronzeComplexesCount: bronzeCount,
    },
    ranking,
  }
}

/**
 * Generates RFC 4180 compliant CSV of cross-tenant performance for SUPER_ADMIN export.
 */
export async function exportAdminMetricsToCSV({
  startDate,
  endDate,
}: AdminMetricsFilter): Promise<string> {
  const summary = await getAdminMetricsSummary({ startDate, endDate })

  const headers = [
    "Rank",
    "Complex Name",
    "Slug",
    "Phone",
    "Active Courts",
    "Confirmed Bookings",
    "Confirmed Revenue ($)",
    "Average Ticket ($)",
    "Revenue Tier",
    "Status",
  ]

  const escapeCSV = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return '""'
    const stringValue = String(value).replace(/"/g, '""')
    return `"${stringValue}"`
  }

  const rows = summary.ranking.map((item, index) => [
    escapeCSV(index + 1),
    escapeCSV(item.name),
    escapeCSV(item.slug),
    escapeCSV(item.phone),
    escapeCSV(item.courtsCount),
    escapeCSV(item.confirmedBookingsCount),
    escapeCSV(item.confirmedRevenue.toFixed(2)),
    escapeCSV(item.averageTicket.toFixed(2)),
    escapeCSV(item.revenueTier),
    escapeCSV(item.isActive ? "Active" : "Inactive"),
  ].join(","))

  return [headers.join(","), ...rows].join("\r\n")
}
