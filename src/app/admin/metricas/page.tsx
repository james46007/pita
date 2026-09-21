"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  BarChart3,
  DollarSign,
  CalendarCheck,
  TrendingUp,
  Building2,
  Download,
  Award,
  Crown,
  Shield,
  Medal,
  ExternalLink,
  Layers,
  Sparkles,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"
import type { AdminMetricsSummaryResponse, ComplexRankingItem, RevenueTier } from "@/lib/admin-metrics"

export default function AdminMetricsPage() {
  const [data, setData] = useState<AdminMetricsSummaryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [preset, setPreset] = useState("thismonth")
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")

  const fetchMetrics = async (targetPreset = preset, from = customFrom, to = customTo) => {
    setLoading(true)
    try {
      let url = `/api/admin/metricas/resumen?preset=${targetPreset}`
      if (targetPreset === "custom" && from && to) {
        url += `&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      }
      const res = await fetch(url)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to load platform metrics")
      }
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      toast.error(err.message || "Error loading metrics")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (preset !== "custom") {
      fetchMetrics(preset)
    }
  }, [preset])

  const handleExportCSV = async () => {
    setExporting(true)
    try {
      let url = `/api/admin/metricas/exportar?preset=${preset}`
      if (preset === "custom" && customFrom && customTo) {
        url += `&from=${encodeURIComponent(customFrom)}&to=${encodeURIComponent(customTo)}`
      }
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to export metrics")
      const blob = await res.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = downloadUrl
      a.download = `superadmin-metrics-${preset}-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(downloadUrl)
      toast.success("Consolidated CSV report downloaded successfully")
    } catch (err: any) {
      toast.error(err.message || "Failed to download CSV")
    } finally {
      setExporting(false)
    }
  }

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customFrom || !customTo) {
      toast.error("Please specify both start and end dates")
      return
    }
    fetchMetrics("custom", customFrom, customTo)
  }

  const renderTierBadge = (tier: RevenueTier) => {
    switch (tier) {
      case "GOLD":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            Gold Tier
          </span>
        )
      case "SILVER":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-400/15 text-slate-300 border border-slate-400/30">
            <Shield className="w-3.5 h-3.5 text-slate-300" />
            Silver Tier
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-700/15 text-orange-400 border border-orange-700/30">
            <Medal className="w-3.5 h-3.5 text-orange-400" />
            Bronze Tier
          </span>
        )
    }
  }

  const kpis = data?.kpis

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Global Platform Metrics
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/50">
                  Cross-Tenant
                </span>
              </h1>
              <p className="text-sm text-zinc-400">
                Consolidated revenue performance, complex rankings, and tiered business intelligence.
              </p>
            </div>
          </div>
        </div>

        {/* Date Filter Presets & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg bg-zinc-900 border border-zinc-800 p-1">
            {[
              { id: "today", label: "Today" },
              { id: "last7days", label: "Last 7 Days" },
              { id: "thismonth", label: "This Month" },
              { id: "lastmonth", label: "Last Month" },
              { id: "custom", label: "Custom" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setPreset(item.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                  preset === item.id
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            disabled={exporting || loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-purple-400" />
            {exporting ? "Exporting..." : "Export CSV"}
          </button>

          <button
            onClick={() => fetchMetrics()}
            disabled={loading}
            title="Refresh metrics"
            className="p-2 text-zinc-400 hover:text-white rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Custom Range Picker */}
      {preset === "custom" && (
        <form
          onSubmit={handleApplyCustom}
          className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800"
        >
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span>From:</span>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
              required
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span>To:</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition"
          >
            Apply Range
          </button>
        </form>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total GMV */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Platform GMV
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-extrabold text-white">
              ${(kpis?.totalGmv ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <p className="text-xs text-zinc-500 mt-1">Confirmed gross bookings volume</p>
          </div>
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
        </div>

        {/* Total Bookings */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Confirmed Bookings
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-extrabold text-white">
              {(kpis?.totalConfirmedBookings ?? 0).toLocaleString("en-US")}
            </h2>
            <p className="text-xs text-zinc-500 mt-1">Across all registered complexes</p>
          </div>
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl" />
        </div>

        {/* Platform Average Ticket */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Average Ticket
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-extrabold text-white">
              ${(kpis?.platformAverageTicket ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <p className="text-xs text-zinc-500 mt-1">Platform-wide average per booking</p>
          </div>
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl" />
        </div>

        {/* Active Complexes */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Active Network
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-extrabold text-white">
              {kpis?.activeComplexesCount ?? 0}
              <span className="text-sm font-normal text-zinc-500 ml-1">
                / {kpis?.totalComplexesCount ?? 0} venues
              </span>
            </h2>
            <p className="text-xs text-zinc-500 mt-1">Operational sports complexes</p>
          </div>
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl" />
        </div>
      </div>

      {/* Tier Distribution Summary Banner */}
      <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold text-white">Revenue Tier Distribution</h2>
              <p className="text-xs text-zinc-400">
                Classification basis for offering volume-based benefits, discounted fees, and premium features.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold">{kpis?.goldComplexesCount ?? 0}</span> Gold (&gt;$5k)
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-400/10 border border-slate-400/20 text-xs text-slate-300">
              <Shield className="w-3.5 h-3.5 text-slate-300" />
              <span className="font-bold">{kpis?.silverComplexesCount ?? 0}</span> Silver ($2k-$5k)
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-700/10 border border-orange-700/20 text-xs text-orange-300">
              <Medal className="w-3.5 h-3.5 text-orange-400" />
              <span className="font-bold">{kpis?.bronzeComplexesCount ?? 0}</span> Bronze (&lt;$2k)
            </div>
          </div>
        </div>
      </div>

      {/* Complex Revenue Ranking Leaderboard */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" />
              Complex Financial Leaderboard
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Ranked by confirmed revenue generated within the active period.
            </p>
          </div>
          <span className="text-xs text-zinc-400">
            Showing {data?.ranking.length ?? 0} complexes
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-zinc-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-400 mb-3" />
            <p className="text-sm">Calculating platform metrics & rankings...</p>
          </div>
        ) : (data?.ranking.length ?? 0) === 0 ? (
          <div className="p-12 text-center text-zinc-400">
            <Building2 className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
            <p className="text-sm font-semibold text-zinc-300">No complexes found</p>
            <p className="text-xs text-zinc-500 mt-1">
              Add complexes from the Sports Complexes management tab.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/50 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-16 text-center">Rank</th>
                  <th className="py-3.5 px-4">Complex</th>
                  <th className="py-3.5 px-4 text-center">Courts</th>
                  <th className="py-3.5 px-4 text-center">Confirmed Bookings</th>
                  <th className="py-3.5 px-4 text-right">Revenue</th>
                  <th className="py-3.5 px-4 text-right">Avg Ticket</th>
                  <th className="py-3.5 px-4 text-center">Revenue Tier</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-sm">
                {data?.ranking.map((item: ComplexRankingItem, index: number) => {
                  const rank = index + 1
                  return (
                    <tr
                      key={item.complexId}
                      className="hover:bg-zinc-800/40 transition group"
                    >
                      {/* Rank */}
                      <td className="py-3.5 px-4 text-center font-bold">
                        {rank === 1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs">
                            🥇 1
                          </span>
                        ) : rank === 2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-400/20 text-slate-300 border border-slate-400/40 text-xs">
                            🥈 2
                          </span>
                        ) : rank === 3 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-700/20 text-orange-400 border border-orange-700/40 text-xs">
                            🥉 3
                          </span>
                        ) : (
                          <span className="text-zinc-500 text-xs">#{rank}</span>
                        )}
                      </td>

                      {/* Complex Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white group-hover:text-purple-300 transition">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-zinc-500 flex items-center gap-2">
                          <span>/{item.slug}</span>
                          {item.phone && <span>• {item.phone}</span>}
                        </div>
                      </td>

                      {/* Courts */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-xs text-zinc-300 bg-zinc-800/80 px-2 py-0.5 rounded-md border border-zinc-700/50">
                          <Layers className="w-3 h-3 text-purple-400" />
                          {item.courtsCount}
                        </span>
                      </td>

                      {/* Bookings */}
                      <td className="py-3.5 px-4 text-center font-medium text-zinc-200">
                        {item.confirmedBookingsCount}
                      </td>

                      {/* Revenue */}
                      <td className="py-3.5 px-4 text-right font-extrabold text-emerald-400">
                        ${item.confirmedRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Avg Ticket */}
                      <td className="py-3.5 px-4 text-right text-zinc-300 font-mono text-xs">
                        ${item.averageTicket.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Tier Badge */}
                      <td className="py-3.5 px-4 text-center">
                        {renderTierBadge(item.revenueTier)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {item.isActive ? (
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" title="Active" />
                        ) : (
                          <span className="inline-block w-2 h-2 rounded-full bg-red-500 ring-4 ring-red-500/20" title="Inactive" />
                        )}
                      </td>

                      {/* Action Link */}
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/dashboard?complexId=${item.complexId}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                          title="Inspect Complex Dashboard"
                        >
                          <span>Inspect</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
