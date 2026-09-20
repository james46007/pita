"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DollarSign,
  TrendingUp,
  Percent,
  Calendar,
  Clock,
  Download,
  Loader2,
  RefreshCw,
  Trophy,
  Users,
} from "lucide-react"

interface CourtMetricBreakdown {
  courtId: string
  courtName: string
  courtType: string
  confirmedRevenue: number
  confirmedBookingsCount: number
  totalSlots: number
  bookedSlots: number
  occupancyRate: number
}

interface PeakHourMetric {
  time: string
  bookingsCount: number
  percentage: number
}

interface DayOfWeekMetric {
  dayName: string
  dayIndex: number
  bookingsCount: number
}

interface DailyRevenueMetric {
  date: string
  confirmedRevenue: number
  bookingsCount: number
}

interface MetricsData {
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

type PresetType = "today" | "last7days" | "thismonth" | "lastmonth" | "custom"

export default function MetricsDashboardPage() {
  const [preset, setPreset] = useState<PresetType>("thismonth")
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [data, setData] = useState<MetricsData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let url = `/api/dashboard/metricas/resumen?preset=${preset}`
      if (preset === "custom") {
        if (!customFrom || !customTo) {
          setLoading(false)
          return
        }
        url += `&from=${customFrom}&to=${customTo}`
      }

      const res = await fetch(url)
      if (!res.ok) {
        throw new Error("Failed to load metrics data")
      }
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      setError(err.message || "Failed to load metrics")
    } finally {
      setLoading(false)
    }
  }, [preset, customFrom, customTo])

  useEffect(() => {
    if (preset !== "custom") {
      fetchMetrics()
    }
  }, [preset, fetchMetrics])

  const handleExportCSV = async () => {
    setExporting(true)
    try {
      let url = `/api/dashboard/metricas/exportar?preset=${preset}`
      if (preset === "custom" && customFrom && customTo) {
        url += `&from=${customFrom}&to=${customTo}`
      }

      const res = await fetch(url)
      if (!res.ok) throw new Error("Export failed")

      const blob = await res.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = downloadUrl
      const dateStr = new Date().toISOString().split("T")[0]
      a.download = `bookings-report-${preset}-${dateStr}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch {
      alert("Error exporting CSV report")
    } finally {
      setExporting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const getPresetLabel = (p: PresetType) => {
    switch (p) {
      case "today":
        return "Today"
      case "last7days":
        return "Last 7 Days"
      case "thismonth":
        return "This Month"
      case "lastmonth":
        return "Last Month"
      case "custom":
        return "Custom Range"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Metrics & Reports
          </h1>
          <p className="text-sm text-zinc-500">
            Financial KPIs, court occupancy rates, and peak usage insights
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMetrics}
            disabled={loading}
            className="text-xs"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleExportCSV}
            disabled={exporting || loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
          >
            {exporting ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="mr-1.5 h-3.5 w-3.5" />
            )}
            Export to CSV
          </Button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mr-2 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-emerald-600" /> Date Range:
            </span>
            {(["today", "last7days", "thismonth", "lastmonth", "custom"] as PresetType[]).map((p) => (
              <Button
                key={p}
                variant={preset === p ? "default" : "outline"}
                size="sm"
                onClick={() => setPreset(p)}
                className={`text-xs h-8 ${preset === p ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
              >
                {getPresetLabel(p)}
              </Button>
            ))}

            {preset === "custom" && (
              <div className="flex items-center gap-2 ml-auto mt-2 sm:mt-0">
                <Input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="h-8 text-xs w-36"
                />
                <span className="text-xs text-zinc-400">to</span>
                <Input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="h-8 text-xs w-36"
                />
                <Button
                  size="sm"
                  onClick={fetchMetrics}
                  disabled={!customFrom || !customTo || loading}
                  className="h-8 text-xs bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Apply
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/40 p-4 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="flex items-center justify-center p-24 text-zinc-500">
          <Loader2 className="h-8 w-8 animate-spin mr-3 text-emerald-600" />
          <span>Computing financial & occupancy aggregates...</span>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Confirmed Revenue */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-zinc-500 uppercase">
                  Confirmed Revenue
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
                  <DollarSign className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(data.kpis.totalConfirmedRevenue)}
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  From <strong className="text-emerald-600">{data.kpis.confirmedBookingsCount}</strong> confirmed bookings
                </p>
              </CardContent>
            </Card>

            {/* Projected Revenue */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-zinc-500 uppercase">
                  Projected Revenue
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {formatCurrency(data.kpis.totalProjectedRevenue)}
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  <strong className="text-amber-600">{data.kpis.pendingBookingsCount}</strong> awaiting receipt or review
                </p>
              </CardContent>
            </Card>

            {/* Occupancy Rate */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-zinc-500 uppercase">
                  Occupancy Rate
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
                  <Percent className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {data.kpis.occupancyRate}%
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(data.kpis.occupancyRate, 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  {data.kpis.bookedSlots} booked of {data.kpis.totalSlots} total slots
                </p>
              </CardContent>
            </Card>

            {/* Average Ticket */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-zinc-500 uppercase">
                  Average Ticket
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-purple-600">
                  <Users className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(data.kpis.averageTicket)}
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Average amount per confirmed reservation
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Court Breakdown & Hourly Peak Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Court Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-emerald-600" />
                  Performance by Court
                </CardTitle>
                <CardDescription className="text-xs">
                  Revenue and occupancy comparison across active courts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.courtBreakdown.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-6">No court data found.</p>
                ) : (
                  data.courtBreakdown.map((court) => (
                    <div
                      key={court.courtId}
                      className="p-3 rounded-lg border bg-zinc-50/50 dark:bg-zinc-900/50 dark:border-zinc-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                            {court.courtName}
                          </p>
                          <Badge variant="outline" className="text-[10px] mt-0.5">
                            {court.courtType}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-600">
                            {formatCurrency(court.confirmedRevenue)}
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            {court.confirmedBookingsCount} bookings
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] text-zinc-500 mb-1">
                          <span>Occupancy</span>
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                            {court.occupancyRate}% ({court.bookedSlots}/{court.totalSlots} slots)
                          </span>
                        </div>
                        <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(court.occupancyRate, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Peak Hours Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  Peak Hours & Demand
                </CardTitle>
                <CardDescription className="text-xs">
                  Booking volume distribution across daily operating slots
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.peakHours.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-6">
                    No booking timestamps recorded in this period.
                  </p>
                ) : (
                  data.peakHours.map((slot) => (
                    <div key={slot.time} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-zinc-700 dark:text-zinc-300 font-mono">
                          {slot.time}
                        </span>
                        <span className="text-zinc-500">
                          {slot.bookingsCount} bookings ({slot.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(slot.percentage * 2, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Day of Week Popularity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-600" />
                Weekly Demand Distribution
              </CardTitle>
              <CardDescription className="text-xs">
                Total bookings grouped by day of the week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {data.daysOfWeek.map((day) => {
                  const maxBookings = Math.max(...data.daysOfWeek.map((d) => d.bookingsCount), 1)
                  const heightPercent = Math.round((day.bookingsCount / maxBookings) * 100)

                  return (
                    <div
                      key={day.dayName}
                      className="p-3 rounded-lg border bg-white dark:bg-zinc-900 flex flex-col items-center justify-between text-center"
                    >
                      <span className="text-xs font-semibold text-zinc-500">
                        {day.dayName.slice(0, 3)}
                      </span>
                      <div className="my-3 w-full bg-zinc-100 dark:bg-zinc-800 h-16 rounded-md flex items-end justify-center p-1">
                        <div
                          className="w-full bg-emerald-500 rounded-sm transition-all duration-500"
                          style={{ height: `${Math.max(heightPercent, 8)}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {day.bookingsCount}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
