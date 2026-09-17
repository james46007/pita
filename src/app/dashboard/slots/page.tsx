"use client"

import { useState, useEffect } from "react"
import { Clock, Plus, Lock, Unlock, PlayCircle } from "lucide-react"
import { toast } from "sonner"

interface CourtOption {
  id: string
  name?: string
  nombre?: string
}

interface SlotItem {
  id: string
  courtId?: string
  canchaId?: string
  date?: string
  fecha?: string
  startTime?: string
  horaInicio?: string
  endTime?: string
  horaFin?: string
  status?: string
  estado?: string
  booking?: {
    id: string
    customerName?: string
    nombreCliente?: string
    customerPhone?: string
    telefonoCliente?: string
    status?: string
    estado?: string
    totalAmount?: number
  } | null
  reserva?: {
    id: string
    customerName?: string
    nombreCliente?: string
    customerPhone?: string
    telefonoCliente?: string
    status?: string
    estado?: string
    totalAmount?: number
  } | null
}

export default function SlotsPage() {
  const [courts, setCourts] = useState<CourtOption[]>([])
  const [selectedCourt, setSelectedCourt] = useState<string>("")
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  )
  const [slots, setSlots] = useState<SlotItem[]>([])
  const [loading, setLoading] = useState(true)

  // Bulk Generator
  const [generating, setGenerating] = useState(false)
  const [daysToGenerate, setDaysToGenerate] = useState<number>(7)

  // Manual Slot
  const [manualStartTime, setManualStartTime] = useState("10:00")
  const [manualEndTime, setManualEndTime] = useState("11:00")
  const [creatingSlot, setCreatingSlot] = useState(false)

  useEffect(() => {
    const fetchCourts = async () => {
      try {
        const res = await fetch("/api/dashboard/canchas")
        if (res.ok) {
          const data = await res.json()
          setCourts(data)
          if (data.length > 0) setSelectedCourt(data[0].id)
        }
      } catch {
        toast.error("Error loading courts")
      }
    }
    fetchCourts()
  }, [])

  const fetchSlots = async () => {
    if (!selectedCourt || !date) return
    setLoading(true)
    try {
      const res = await fetch(`/api/dashboard/slots?courtId=${selectedCourt}&date=${date}`)
      if (res.ok) {
        const data = await res.json()
        setSlots(data)
      }
    } catch {
      toast.error("Error loading slots")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSlots()
  }, [selectedCourt, date])

  const getSlotStatus = (s: SlotItem) => s.status || s.estado || "AVAILABLE"
  const getStartTime = (s: SlotItem) => s.startTime || s.horaInicio || ""
  const getEndTime = (s: SlotItem) => s.endTime || s.horaFin || ""
  const getCustomerName = (s: SlotItem) =>
    s.booking?.customerName ||
    s.booking?.nombreCliente ||
    s.reserva?.customerName ||
    s.reserva?.nombreCliente ||
    ""

  const toggleSlotLock = async (slot: SlotItem) => {
    const currentStatus = getSlotStatus(slot)
    if (currentStatus === "BOOKED" || currentStatus === "RESERVADO") {
      toast.error("A reserved slot cannot be directly locked")
      return
    }

    const newStatus = currentStatus === "BLOCKED" || currentStatus === "BLOQUEADO" ? "AVAILABLE" : "BLOCKED"

    try {
      const res = await fetch(`/api/dashboard/slots/${slot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Could not update slot")
      }

      toast.success(newStatus === "BLOCKED" ? "Slot locked" : "Slot unlocked")
      fetchSlots()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleBulkGenerate = async () => {
    if (!selectedCourt) return
    setGenerating(true)

    try {
      const today = new Date()
      const end = new Date()
      end.setDate(today.getDate() + daysToGenerate)

      const res = await fetch("/api/dashboard/slots/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courtId: selectedCourt,
          startDate: today.toISOString().split("T")[0],
          endDate: end.toISOString().split("T")[0],
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Bulk generation error")
      }

      const result = await res.json()
      toast.success(`Success! ${result.count} slots created or synchronized.`)
      fetchSlots()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleCreateManualSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCourt || !date) return
    setCreatingSlot(true)

    try {
      const res = await fetch("/api/dashboard/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courtId: selectedCourt,
          date,
          startTime: manualStartTime,
          endTime: manualEndTime,
          status: "AVAILABLE",
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Could not create slot")
      }

      toast.success("Single slot created successfully")
      fetchSlots()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setCreatingSlot(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Slot & Availability Management
        </h1>
        <p className="text-sm text-zinc-500">
          Generate slots automatically from weekly operating schedules, or create and lock slots manually.
        </p>
      </div>

      {/* Date and Court Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border dark:border-zinc-800">
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Court
          </label>
          <select
            value={selectedCourt}
            onChange={(e) => setSelectedCourt(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100"
          >
            {courts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name || c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Date to Inspect
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100"
          />
        </div>
      </div>

      {/* Quick Actions: Bulk Generator and Manual Slot */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bulk Generator */}
        <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 p-4 rounded-xl space-y-3">
          <div className="flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
              Bulk Slot Generator
            </h3>
          </div>
          <p className="text-xs text-emerald-800 dark:text-emerald-400">
            Automatically generates all slots according to configured court schedules. Existing slots are skipped.
          </p>
          <div className="flex items-center gap-3">
            <select
              value={daysToGenerate}
              onChange={(e) => setDaysToGenerate(Number(e.target.value))}
              className="text-xs py-1.5 px-3 border rounded-lg bg-white dark:bg-zinc-900"
            >
              <option value={7}>Next 7 days</option>
              <option value={15}>Next 15 days</option>
              <option value={30}>Next 30 days</option>
            </select>
            <button
              onClick={handleBulkGenerate}
              disabled={generating || !selectedCourt}
              className="py-1.5 px-4 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {generating ? "Generating..." : "Run Generator"}
            </button>
          </div>
        </div>

        {/* Manual Slot Form */}
        <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 p-4 rounded-xl space-y-3">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Create Single Slot
            </h3>
          </div>
          <form onSubmit={handleCreateManualSlot} className="flex items-center gap-2">
            <input
              type="time"
              value={manualStartTime}
              onChange={(e) => setManualStartTime(e.target.value)}
              className="text-xs py-1.5 px-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800"
            />
            <span className="text-xs text-zinc-400">to</span>
            <input
              type="time"
              value={manualEndTime}
              onChange={(e) => setManualEndTime(e.target.value)}
              className="text-xs py-1.5 px-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800"
            />
            <button
              type="submit"
              disabled={creatingSlot || !selectedCourt}
              className="py-1.5 px-3 text-xs font-semibold rounded-lg bg-zinc-800 text-white hover:bg-zinc-900 dark:bg-zinc-700 disabled:opacity-50"
            >
              {creatingSlot ? "..." : "Create"}
            </button>
          </form>
        </div>
      </div>

      {/* Slots List */}
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border dark:border-zinc-800">
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-600" />
          Slots for Selected Date ({slots.length})
        </h3>

        {loading ? (
          <div className="py-12 text-center text-zinc-400 text-sm animate-pulse">
            Loading slots...
          </div>
        ) : slots.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-sm">
            No slots found for this date. Use the <strong>Bulk Slot Generator</strong> or add one manually.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {slots.map((s) => {
              const status = getSlotStatus(s)
              const customerName = getCustomerName(s)

              return (
                <div
                  key={s.id}
                  className={`p-3 rounded-lg border text-center transition flex flex-col justify-between ${
                    status === "AVAILABLE" || status === "DISPONIBLE"
                      ? "border-emerald-200 bg-emerald-50/50 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200"
                      : status === "BOOKED" || status === "RESERVADO"
                      ? "border-blue-200 bg-blue-50/50 text-blue-950 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200"
                      : "border-zinc-200 bg-zinc-100/70 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/40"
                  }`}
                >
                  <div>
                    <p className="font-extrabold text-sm">{getStartTime(s)}</p>
                    <p className="text-[11px] opacity-75">{getEndTime(s)}</p>
                    <span
                      className={`inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        status === "AVAILABLE" || status === "DISPONIBLE"
                          ? "bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300"
                          : status === "BOOKED" || status === "RESERVADO"
                          ? "bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                          : "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {status}
                    </span>

                    {customerName && (
                      <p className="text-[11px] font-semibold truncate mt-1 text-zinc-800 dark:text-zinc-200">
                        {customerName}
                      </p>
                    )}
                  </div>

                  {status !== "BOOKED" && status !== "RESERVADO" && (
                    <button
                      onClick={() => toggleSlotLock(s)}
                      className="mt-2 text-[11px] py-1 px-2 rounded font-medium border border-zinc-300 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800 transition flex items-center justify-center gap-1"
                    >
                      {status === "BLOCKED" || status === "BLOQUEADO" ? (
                        <>
                          <Unlock className="w-3 h-3 text-emerald-600" /> Unlock
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 text-red-500" /> Lock
                        </>
                      )}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
