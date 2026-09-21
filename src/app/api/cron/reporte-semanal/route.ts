import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { assertCronAuthorized } from "@/lib/cron-auth"
import { getComplexMetricsSummary } from "@/lib/metrics"
import { sendEmail } from "@/lib/email/resend"
import { renderWeeklyReportEmail } from "@/lib/email/templates/weekly-report"

export async function GET(req: Request) {
  if (!assertCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized: Invalid cron secret" }, { status: 401 })
  }

  try {
    const now = new Date()

    // Calculate previous week boundaries (Monday 00:00 to Sunday 23:59)
    // In UTC or local server time
    const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, etc.
    const daysSinceLastMonday = (dayOfWeek + 6) % 7 || 7 // If today is Monday, daysSinceLastMonday = 7

    const endOfLastWeek = new Date(now)
    endOfLastWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 7 : dayOfWeek))
    endOfLastWeek.setHours(23, 59, 59, 999)

    const startOfLastWeek = new Date(endOfLastWeek)
    startOfLastWeek.setDate(endOfLastWeek.getDate() - 6)
    startOfLastWeek.setHours(0, 0, 0, 0)

    const periodStr = `${startOfLastWeek.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    })} - ${endOfLastWeek.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}`

    // Fetch active complexes with their ADMIN users
    const complexes = await prisma.complex.findMany({
      where: {
        isActive: true,
        subscriptionStatus: { not: "INACTIVE" },
      },
      include: {
        users: {
          where: { role: "ADMIN" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    let reportsDispatched = 0
    const results: Array<{ complexId: string; name: string; recipients: number; revenue: number }> = []

    for (const complex of complexes) {
      try {
        const metrics = await getComplexMetricsSummary({
          complexId: complex.id,
          startDate: startOfLastWeek,
          endDate: endOfLastWeek,
        })

        const totalRevenue = Number(metrics.kpis.totalConfirmedRevenue || 0)
        const confirmedCount = Number(metrics.kpis.confirmedBookingsCount || 0)
        const occupancyRate = Number(metrics.kpis.occupancyRate || 0)

        // Base domain for link to dashboard
        const appUrl = process.env.NEXTAUTH_URL || "https://pita.app"
        const dashboardUrl = `${appUrl}/dashboard/metricas`

        let complexRecipients = 0

        for (const userComplex of complex.users) {
          const adminUser = userComplex.user
          if (!adminUser?.email) continue

          const html = renderWeeklyReportEmail({
            adminName: adminUser.name || "Administrador",
            complexName: complex.name,
            periodStr,
            totalRevenue,
            confirmedBookingsCount: confirmedCount,
            occupancyRate,
            dashboardUrl,
          })

          const sendRes = await sendEmail({
            to: adminUser.email,
            subject: `📊 Balance Semanal (${periodStr}) - ${complex.name}`,
            html,
          })

          if (sendRes.success) {
            reportsDispatched++
            complexRecipients++
          }
        }

        results.push({
          complexId: complex.id,
          name: complex.name,
          recipients: complexRecipients,
          revenue: totalRevenue,
        })
      } catch (err) {
        console.error(`[CRON_REPORTE_SEMANAL] Error processing complex ${complex.id}:`, err)
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      period: periodStr,
      complexesProcessed: complexes.length,
      reportsDispatched,
      details: results,
    })
  } catch (error: any) {
    console.error("[CRON_REPORTE_SEMANAL] Unexpected cron failure:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
