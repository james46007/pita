"use client"

import { useState, useEffect } from "react"
import { Trophy, Plus, Edit2, Check, X } from "lucide-react"
import { toast } from "sonner"

interface CourtItem {
  id: string
  name?: string
  nombre?: string
  type?: "PADEL" | "TURF" | "SINTETICA"
  tipo?: "PADEL" | "TURF" | "SINTETICA"
  pricePerHour?: string | number
  precioHora?: string | number
  slotDurationMin?: number
  duracionSlotMin?: number
  isActive?: boolean
  activo?: boolean
  _count?: {
    slots?: number
    bookings?: number
    reservas?: number
  }
}

export default function CourtsPage() {
  const [courts, setCourts] = useState<CourtItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingCourt, setEditingCourt] = useState<CourtItem | null>(null)

  // Form State
  const [name, setName] = useState("")
  const [type, setType] = useState<"PADEL" | "TURF">("PADEL")
  const [hourlyRate, setHourlyRate] = useState<number | string>(80000)
  const [slotDurationMin, setSlotDurationMin] = useState<number | string>(60)

  const fetchCourts = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/dashboard/canchas")
      if (!res.ok) throw new Error("Error fetching courts")
      const data = await res.json()
      setCourts(data)
    } catch {
      toast.error("Could not load courts")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourts()
  }, [])

  const getCourtName = (c: CourtItem) => c.name || c.nombre || ""
  const getCourtType = (c: CourtItem) => {
    const t = c.type || c.tipo || "TURF"
    return t === "SINTETICA" ? "TURF" : t
  }
  const getCourtPrice = (c: CourtItem) => Number(c.pricePerHour ?? c.precioHora ?? 0)
  const getCourtSlotDuration = (c: CourtItem) => c.slotDurationMin ?? c.duracionSlotMin ?? 60
  const getCourtIsActive = (c: CourtItem) => c.isActive ?? c.activo ?? true
  const getCourtSlotsCount = (c: CourtItem) => c._count?.slots ?? 0
  const getCourtBookingsCount = (c: CourtItem) => c._count?.bookings ?? c._count?.reservas ?? 0

  const openCreateModal = () => {
    setEditingCourt(null)
    setName("")
    setType("PADEL")
    setHourlyRate(80000)
    setSlotDurationMin(60)
    setModalOpen(true)
  }

  const openEditModal = (court: CourtItem) => {
    setEditingCourt(court)
    setName(getCourtName(court))
    setType(getCourtType(court) as "PADEL" | "TURF")
    setHourlyRate(getCourtPrice(court))
    setSlotDurationMin(getCourtSlotDuration(court))
    setModalOpen(true)
  }

  const handleSaveCourt = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (editingCourt) {
        // Update court
        const res = await fetch(`/api/dashboard/canchas/${editingCourt.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            type,
            pricePerHour: Number(hourlyRate),
            slotDurationMin: Number(slotDurationMin),
          }),
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || "Error updating court")
        }

        toast.success("Court updated successfully")
      } else {
        // Create new court
        const res = await fetch("/api/dashboard/canchas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            type,
            pricePerHour: Number(hourlyRate),
            slotDurationMin: Number(slotDurationMin),
          }),
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || "Error creating court")
        }

        toast.success("Court created successfully")
      }

      setModalOpen(false)
      fetchCourts()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleCourtStatus = async (court: CourtItem) => {
    const currentActive = getCourtIsActive(court)
    try {
      const res = await fetch(`/api/dashboard/canchas/${court.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      })

      if (!res.ok) throw new Error("Error updating court status")
      toast.success(currentActive ? "Court deactivated" : "Court activated")
      fetchCourts()
    } catch {
      toast.error("Failed to update court status")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Sports Courts
          </h1>
          <p className="text-sm text-zinc-500">
            Manage court types, hourly rates, slot durations, and availability.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition shadow"
        >
          <Plus className="w-4 h-4" /> New Court
        </button>
      </div>

      {/* Courts Grid */}
      {loading ? (
        <div className="py-16 text-center text-zinc-500 text-sm animate-pulse">
          Loading courts...
        </div>
      ) : courts.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-zinc-900 rounded-xl border dark:border-zinc-800">
          <p className="text-zinc-500 text-sm">No courts registered for this sports complex yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courts.map((court) => {
            const active = getCourtIsActive(court)
            const courtType = getCourtType(court)

            return (
              <div
                key={court.id}
                className={`p-5 rounded-xl border bg-white dark:bg-zinc-900 transition shadow-xs flex flex-col justify-between ${
                  active ? "border-zinc-200 dark:border-zinc-800" : "opacity-60 border-dashed border-zinc-300 dark:border-zinc-700"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        courtType === "PADEL"
                          ? "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                      }`}
                    >
                      {courtType === "PADEL" ? "Padel" : "Turf Field"}
                    </span>

                    <button
                      onClick={() => toggleCourtStatus(court)}
                      className={`text-xs px-2 py-0.5 rounded font-medium transition ${
                        active
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40"
                          : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800"
                      }`}
                    >
                      {active ? "Active" : "Inactive"}
                    </button>
                  </div>

                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                    {getCourtName(court)}
                  </h3>
                  <p className="text-2xl font-black text-emerald-600 mb-4">
                    ${getCourtPrice(court).toLocaleString("en-US")}
                    <span className="text-xs font-normal text-zinc-500 ml-1">/ hour</span>
                  </p>

                  <div className="text-xs text-zinc-500 space-y-1">
                    <p>Slot duration: <strong>{getCourtSlotDuration(court)} minutes</strong></p>
                    <p>Total slots: <strong>{getCourtSlotsCount(court)}</strong> | Bookings: <strong>{getCourtBookingsCount(court)}</strong></p>
                  </div>
                </div>

                <div className="pt-4 border-t dark:border-zinc-800 mt-4 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEditModal(court)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border dark:border-zinc-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {editingCourt ? "Edit Court" : "New Court"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCourt} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Court Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Center Court 1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Court Type / Sport
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="PADEL">Padel</option>
                  <option value="TURF">Synthetic Turf Soccer</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Hourly Rate ($)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={1000}
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Slot Duration (minutes)
                  </label>
                  <select
                    value={slotDurationMin}
                    onChange={(e) => setSlotDurationMin(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={60}>60 minutes (1 hour)</option>
                    <option value={90}>90 minutes (1.5 hours)</option>
                    <option value={120}>120 minutes (2 hours)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2 px-4 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 px-4 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Court"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
