import { NextResponse } from "next/server"
import { getCurrentUserAndTenant } from "@/lib/tenant"
import { exportBookingsToCSV } from "@/lib/metrics"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const targetComplexId = searchParams.get("complexId") || searchParams.get("complejoId") || undefined
    const { complexId } = await getCurrentUserAndTenant(targetComplexId)

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
        return NextResponse.json({ error: "Invalid date format for 'from' or 'to'" }, { status: 400 })
      }
    } else {
      // Default: "thismonth"
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    }

    const csvContent = await exportBookingsToCSV({
      complexId,
      startDate,
      endDate,
    })

    const dateSlug = now.toISOString().split("T")[0]
    const filename = `bookings-report-${dateSlug}.csv`

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error.message === "FORBIDDEN_TENANT_ACCESS" || error.message === "NO_COMPLEX_ASSIGNED") {
      return NextResponse.json({ error: "Forbidden: Access denied to this complex" }, { status: 403 })
    }
    console.error("Error exporting bookings to CSV:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
