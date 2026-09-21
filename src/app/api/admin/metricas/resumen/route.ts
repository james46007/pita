import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptionsAdmin } from "@/lib/auth"
import { getAdminMetricsSummary } from "@/lib/admin-metrics"

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

    const summary = await getAdminMetricsSummary({
      startDate,
      endDate,
    })

    return NextResponse.json(summary)
  } catch (error) {
    console.error("Error fetching superadmin metrics summary:", error)
    return NextResponse.json(
      { error: "Internal server error fetching global metrics" },
      { status: 500 }
    )
  }
}
