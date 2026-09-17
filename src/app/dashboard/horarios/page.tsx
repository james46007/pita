"use client"

import { useState, useEffect } from "react"
import { Clock, Plus, Trash2, Calendar } from "lucide-react"
import { toast } from "sonner"

interface CourtOption {
  id: string
  name?: string
  nombre?: string
}

interface ScheduleItem {
  id: string
  courtId?: string
  canchaId?: string
  dayOfWeek?: number
  diaSemana?: number
  openTime?: string
  horaApertura?: string
  closeTime?: string
  horaCierre?: string
  isActive?: boolean
  activo?: boolean
}

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]

export default function SchedulesPage() {
  const [courts, setCourts] = useState<CourtOption[]>([])
  const [selectedCourt, setSelectedCourt] = useState<string>("")
  const [schedules, setSchedules] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form State
  const [dayOfWeek, setDayOfWeek] = useState<number>(1)
  const [openingTime, setOpeningTime] = useState("07:00")
  const [closingTime, setClosingTime] = useState("22:00")

  useEffect(() => {
    const fetchCourts = async () => {
      try {
        const res = await fetch("/api/dashboard/canchas")
        if (res.ok) {
          const data = await res.json()
          setCourts(data)
          if (data.length > 0) {
            setSelectedCourt(data[0].id)
          }
        }
      } catch {
        toast.error("Error loading courts")
      }
    }
    fetchCourts()
  }, [])

  useEffect(() => {
    if (!selectedCourt) return
    const fetchSchedules = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/dashboard/horarios?courtId=${selectedCourt}`)
        if (res.ok) {
          const data = await res.json()
          setSchedules(data)
        }
      } catch {
        toast.error("Error loading schedules")
      } finally {
        setLoading(false)
      }
    }
    fetchSchedules()
  }, [selectedCourt])

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch("/api/dashboard/horarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courtId: selectedCourt,
          dayOfWeek,
          openTime: openingTime,
          closeTime: closingTime,
          isActive: true,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Error saving schedule")
      }

      toast.success("Schedule saved successfully")
      // Refresh
      const refresh = await fetch(`/api/dashboard/horarios?courtId=${selectedCourt}`)
      const data = await refresh.json()
      setSchedules(data)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSchedule = async (id: string) => {
    try {
      const res = await fetch(`/api/dashboard/horarios?id=${id}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Error deleting schedule")
      toast.success("Schedule removed")
      setSchedules(schedules.filter((h) => h.id !== id))
    } catch {
      toast.error("Failed to delete schedule")
    }
  }

  const getDayOfWeek = (s: ScheduleItem) => s.dayOfWeek ?? s.diaSemana ?? 0
  const getOpenTime = (s: ScheduleItem) => s.openTime || s.horaApertura || ""
  const getCloseTime = (s: ScheduleItem) => s.closeTime || s.horaCierre || ""

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Court Operating Hours & Schedules
        </h1>
        <p className="text-sm text-zinc-500">
          Define the weekly operating hours for each court to power slot availability.
        </p>
      </div>

      {/* Court Selector */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border dark:border-zinc-800 flex items-center gap-4">
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Select Court:
        </label>
        <select
          value={selectedCourt}
          onChange={(e) => setSelectedCourt(e.target.value)}
          className="px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {courts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name || c.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Day Configuration Form */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border dark:border-zinc-800 h-fit space-y-4">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-600" />
            Configure Day
          </h3>

          <form onSubmit={handleSaveSchedule} className="space-y-3 text-sm">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Day of Week
              </label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
              >
                {DAYS_OF_WEEK.map((dayName, idx) => (
                  <option key={idx} value={idx}>
                    {dayName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Opening Time
                </label>
                <input
                  type="time"
                  required
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Closing Time
                </label>
                <input
                  type="time"
                  required
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || !selectedCourt}
              className="w-full mt-2 py-2 px-4 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save for this Day"}
            </button>
          </form>
        </div>

        {/* Weekly Schedule Grid */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-5 rounded-xl border dark:border-zinc-800">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            Configured Weekly Schedule
          </h3>

          {loading ? (
            <div className="py-12 text-center text-zinc-400 text-sm animate-pulse">
              Loading schedules...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DAYS_OF_WEEK.map((dayName, idx) => {
                const conf = schedules.find((h) => getDayOfWeek(h) === idx)
                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-lg border flex items-center justify-between ${
                      conf
                        ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                        : "border-dashed border-zinc-200 dark:border-zinc-800 opacity-60"
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                        {dayName}
                      </p>
                      {conf ? (
                        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          {getOpenTime(conf)} - {getCloseTime(conf)}
                        </p>
                      ) : (
                        <p className="text-xs text-zinc-400">Closed / No schedule</p>
                      )}
                    </div>

                    {conf && (
                      <button
                        onClick={() => handleDeleteSchedule(conf.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-500 rounded transition"
                        title="Delete slot range"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
