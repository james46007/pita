import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptionsAdmin } from "@/lib/auth"
import { exportAdminMetricsToCSV } from "@/lib/admin-metrics"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptionsAdmin)
    const user = session?.user as any

    if (!user || (!user.isSuperAdmin && !user.esSuperAdmin)) {
      return NextResponse.json(
        { error: "Forbidden: SuperAdmin privileges required" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const preset = searchParams.get("preset") || "thismonth"
    const fromParam = searchParams.get("from")
    const toParam = searchParams.get("to")

    const now = new Date()
    let startDate = new Date()
    let endDate = new Date()

    if (preset === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    } else if (preset === "last7days") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    } else if (preset === "lastmonth") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      endDate = new Date(now.getFullYear(), now.getMonth(), 0)
    } else if (preset === "custom" && fromParam && toParam) {
      startDate = new Date(fromParam)
      endDate = new Date(toParam)
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid date format for 'from' or 'to'" },
          { status: 400 }
        )
      }
    } else {
      // Default: "thismonth"
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    }

    const csvContent = await exportAdminMetricsToCSV({
      startDate,
      endDate,
    })

    const dateSlug = now.toISOString().split("T")[0]
    const filename = `superadmin-metrics-${preset}-${dateSlug}.csv`

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Error exporting superadmin metrics to CSV:", error)
    return NextResponse.json(
      { error: "Internal server error exporting global metrics" },
      { status: 500 }
    )
  }
}
