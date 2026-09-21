"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FileText,
  Plus,
  Send,
  Calendar,
  MessageCircle,
  Phone,
  User,
  DollarSign,
} from "lucide-react"
import { toast } from "sonner"

interface BookingItem {
  id: string
  customerName?: string
  nombreCliente?: string
  customerPhone?: string
  telefonoCliente?: string
  customerEmail?: string
  emailCliente?: string
  status?: string
  estado?: string
  totalAmount?: string | number
  montoTotal?: string | number
  receiptUrl?: string
  comprobanteUrl?: string
  notes?: string
  notas?: string
  createdAt?: string
  creadaAt?: string
  court?: {
    name: string
    type: string
  }
  cancha?: {
    nombre: string
    tipo: string
  }
  slot: {
    date?: string
    fecha?: string
    startTime?: string
    horaInicio?: string
    endTime?: string
    horaFin?: string
  }
}

interface CourtOption {
  id: string
  name: string
  type: string
  pricePerHour: number
}

interface AvailableSlotOption {
  id: string
  startTime: string
  endTime: string
  status: string
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [dateFilter, setDateFilter] = useState<string>("")
  const [search, setSearch] = useState<string>("")

  // Selected Booking Modal
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Manual Quick Booking Modal State
  const [manualModalOpen, setManualModalOpen] = useState(false)
  const [courts, setCourts] = useState<CourtOption[]>([])
  const [manualCourtId, setManualCourtId] = useState("")
  const [manualDate, setManualDate] = useState(new Date().toISOString().split("T")[0])
  const [availableSlots, setAvailableSlots] = useState<AvailableSlotOption[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [manualSlotId, setManualSlotId] = useState("")
  const [manualCustomerName, setManualCustomerName] = useState("")
  const [manualCustomerPhone, setManualCustomerPhone] = useState("")
  const [manualCustomerEmail, setManualCustomerEmail] = useState("")
  const [manualPaymentMethod, setManualPaymentMethod] = useState("CASH")
  const [manualNotes, setManualNotes] = useState("")
  const [manualSubmitting, setManualSubmitting] = useState(false)

  const fetchBookings = async () => {
    setLoading(true)
    try {
      let url = "/api/reservas"
      const params = new URLSearchParams()
      if (statusFilter !== "ALL") params.append("status", statusFilter)
      if (dateFilter) params.append("date", dateFilter)
      if (params.toString()) url += `?${params.toString()}`

      const res = await fetch(url)
      if (!res.ok) throw new Error("Error fetching bookings")
      const data = await res.json()
      setBookings(data)
    } catch {
      toast.error("Could not load bookings")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [statusFilter, dateFilter])

  // Fetch courts for manual booking dialog
  useEffect(() => {
    if (manualModalOpen && courts.length === 0) {
      fetch("/api/dashboard/canchas")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setCourts(data)
            setManualCourtId(data[0].id)
          }
        })
        .catch(() => toast.error("Failed to load courts"))
    }
  }, [manualModalOpen])

  // Fetch available slots when court or date changes
  useEffect(() => {
    if (manualModalOpen && manualCourtId && manualDate) {
      setLoadingSlots(true)
      setManualSlotId("")
      fetch(`/api/dashboard/slots?courtId=${manualCourtId}&date=${manualDate}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const openSlots = data.filter((s: any) => s.status === "AVAILABLE")
            setAvailableSlots(openSlots)
            if (openSlots.length > 0) {
              setManualSlotId(openSlots[0].id)
            }
          }
        })
        .catch(() => toast.error("Failed to fetch court slots"))
        .finally(() => setLoadingSlots(false))
    }
  }, [manualModalOpen, manualCourtId, manualDate])

  const handleUpdateStatus = async (id: string, newStatus: "CONFIRMED" | "CANCELLED") => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/dashboard/reservas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Error updating booking status")
      }

      toast.success(
        newStatus === "CONFIRMED"
          ? "Booking confirmed successfully!"
          : "Booking cancelled and slot released"
      )
      setSelectedBooking(null)
      fetchBookings()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateManualBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualSlotId) {
      toast.error("Please select an available time slot")
      return
    }
    if (!manualCustomerName || !manualCustomerPhone) {
      toast.error("Please enter customer name and phone")
      return
    }

    setManualSubmitting(true)
    try {
      const res = await fetch("/api/dashboard/reservas/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: manualSlotId,
          customerName: manualCustomerName,
          customerPhone: manualCustomerPhone,
          customerEmail: manualCustomerEmail || undefined,
          paymentMethod: manualPaymentMethod,
          notes: manualNotes,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create manual booking")
      }

      toast.success("Manual booking created & confirmed!")
      setManualModalOpen(false)
      setManualCustomerName("")
      setManualCustomerPhone("")
      setManualCustomerEmail("")
      setManualNotes("")
      fetchBookings()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setManualSubmitting(false)
    }
  }

  const getStatus = (b: BookingItem) => b.status || b.estado || ""
  const getCustomerName = (b: BookingItem) => b.customerName || b.nombreCliente || ""
  const getCustomerPhone = (b: BookingItem) => b.customerPhone || b.telefonoCliente || ""
  const getCourtName = (b: BookingItem) => b.court?.name || b.cancha?.nombre || ""
  const getCourtType = (b: BookingItem) => b.court?.type || b.cancha?.tipo || ""
  const getTotalAmount = (b: BookingItem) => Number(b.totalAmount ?? b.montoTotal ?? 0)
  const getStartTime = (b: BookingItem) => b.slot?.startTime || b.slot?.horaInicio || ""
  const getEndTime = (b: BookingItem) => b.slot?.endTime || b.slot?.horaFin || ""
  const getDate = (b: BookingItem) => b.slot?.date || b.slot?.fecha || ""
  const getReceiptUrl = (b: BookingItem) => b.receiptUrl || b.comprobanteUrl || null

  const handleOpenWhatsApp = (b: BookingItem) => {
    const rawPhone = getCustomerPhone(b)
    const cleanPhone = rawPhone.replace(/\D/g, "")
    if (!cleanPhone || cleanPhone.length < 7) {
      toast.error("Customer phone is invalid or missing")
      return
    }

    const name = getCustomerName(b)
    const court = getCourtName(b)
    const dateFormatted = getDate(b)
      ? new Date(getDate(b)).toLocaleDateString("en-US", { timeZone: "UTC" })
      : ""
    const time = `${getStartTime(b)} - ${getEndTime(b)}`
    const amount = getTotalAmount(b)

    const text = `¡Hola ${name}! Te confirmamos tu reserva en Cancha ${court} para el ${dateFormatted} de ${time}. Total: $${amount}. ¡Te esperamos en el club!`
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
    window.open(url, "_blank")
  }

  const filteredBookings = bookings.filter((b) => {
    if (!search) return true
    const term = search.toLowerCase()
    return (
      getCustomerName(b).toLowerCase().includes(term) ||
      getCustomerPhone(b).toLowerCase().includes(term) ||
      getCourtName(b).toLowerCase().includes(term)
    )
  })

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
      case "CONFIRMADA":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5" /> Confirmed
          </span>
        )
      case "RECEIPT_UPLOADED":
      case "COMPROBANTE_SUBIDO":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400 animate-pulse">
            <FileText className="w-3.5 h-3.5" /> Receipt Ready
          </span>
        )
      case "PAYMENT_PENDING":
      case "PENDIENTE_PAGO":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">
            <Clock className="w-3.5 h-3.5" /> Pending Payment
          </span>
        )
      case "CANCELLED":
      case "CANCELADA":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400">
            <XCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Booking Management
          </h1>
          <p className="text-sm text-zinc-500">
            View, filter, and audit payment receipts, or create manual phone/walk-in reservations.
          </p>
        </div>

        <div>
          <button
            onClick={() => setManualModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-md shadow-emerald-900/20"
          >
            <Plus className="w-4 h-4" />
            + New Manual Booking
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white dark:bg-zinc-900 p-4 rounded-xl border dark:border-zinc-800 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by customer, phone, or court..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 text-sm border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All statuses</option>
            <option value="RECEIPT_UPLOADED">Receipt Uploaded (Priority)</option>
            <option value="PAYMENT_PENDING">Pending Payment</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full py-2 px-3 text-sm border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border dark:border-zinc-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-zinc-500 text-sm animate-pulse">
            Loading bookings...
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-zinc-500 text-sm">No reservations found matching the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-300">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b dark:border-zinc-800 text-xs uppercase font-semibold text-zinc-500">
                <tr>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Court</th>
                  <th className="px-6 py-3.5">Date & Slot</th>
                  <th className="px-6 py-3.5">Total</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-zinc-800">
                {filteredBookings.map((b) => {
                  const status = getStatus(b)
                  const isConfirmed = status === "CONFIRMED" || status === "CONFIRMADA"
                  return (
                    <tr key={b.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{getCustomerName(b)}</p>
                        <p className="text-xs text-zinc-500">{getCustomerPhone(b)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">{getCourtName(b)}</span>
                        <span className="block text-xs text-zinc-400 capitalize">{getCourtType(b).toLowerCase()}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-zinc-900 dark:text-zinc-100 font-medium">
                          {getDate(b) ? new Date(getDate(b)).toLocaleDateString("en-US", { timeZone: "UTC" }) : "—"}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {getStartTime(b)} - {getEndTime(b)}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100">
                        ${getTotalAmount(b).toLocaleString("en-US")}
                      </td>
                      <td className="px-6 py-4">{renderStatusBadge(status)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {isConfirmed && (
                            <button
                              onClick={() => handleOpenWhatsApp(b)}
                              title="Send confirmation via WhatsApp"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border border-emerald-500/30 transition"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="hidden md:inline">WhatsApp</span>
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedBooking(b)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition"
                          >
                            <Eye className="w-3.5 h-3.5" /> Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Quick-Booking Modal */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border dark:border-zinc-800 p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    New Manual Reservation
                  </h3>
                  <p className="text-xs text-zinc-500">Walk-in or telephone customer quick booking</p>
                </div>
              </div>
              <button
                onClick={() => setManualModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualBooking} className="space-y-4 text-xs">
              {/* Court & Date Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">
                    Court
                  </label>
                  <select
                    value={manualCourtId}
                    onChange={(e) => setManualCourtId(e.target.value)}
                    className="w-full p-2.5 rounded-lg border bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    {courts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.type}) - ${c.pricePerHour}/hr
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full p-2 rounded-lg border bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Time Slot Selection */}
              <div>
                <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">
                  Available Time Slot
                </label>
                {loadingSlots ? (
                  <p className="text-zinc-400 py-2">Loading available slots...</p>
                ) : availableSlots.length === 0 ? (
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
                    No available slots for this court on the selected date. (Ensure slots are generated in the "Generate Slots" tab).
                  </div>
                ) : (
                  <select
                    value={manualSlotId}
                    onChange={(e) => setManualSlotId(e.target.value)}
                    className="w-full p-2.5 rounded-lg border bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 font-medium"
                    required
                  >
                    {availableSlots.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.startTime} - {s.endTime} (Available)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Customer Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t dark:border-zinc-800">
                <div>
                  <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Juan Perez"
                    value={manualCustomerName}
                    onChange={(e) => setManualCustomerName(e.target.value)}
                    className="w-full p-2.5 rounded-lg border bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">
                    Customer Phone (WhatsApp) *
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +549112345678"
                    value={manualCustomerPhone}
                    onChange={(e) => setManualCustomerPhone(e.target.value)}
                    className="w-full p-2.5 rounded-lg border bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Payment Method & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">
                    Payment Method
                  </label>
                  <select
                    value={manualPaymentMethod}
                    onChange={(e) => setManualPaymentMethod(e.target.value)}
                    className="w-full p-2.5 rounded-lg border bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="CASH">Cash / Paid on-site (Efectivo)</option>
                    <option value="TRANSFER">Transfer already verified (Transferencia)</option>
                    <option value="OTHER">Other / Courtesy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">
                    Customer Email (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="juan@example.com"
                    value={manualCustomerEmail}
                    onChange={(e) => setManualCustomerEmail(e.target.value)}
                    className="w-full p-2.5 rounded-lg border bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Needs padel rackets rental"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full p-2.5 rounded-lg border bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  className="px-4 py-2 rounded-lg border dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={manualSubmitting || availableSlots.length === 0}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition disabled:opacity-50"
                >
                  {manualSubmitting ? "Creating..." : "Confirm & Book Slot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking Details and Receipt Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border dark:border-zinc-800 p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Reservation Details
              </h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-zinc-400 font-medium">Customer</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200">{getCustomerName(selectedBooking)}</p>
                <p className="text-xs text-zinc-500">{getCustomerPhone(selectedBooking)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 font-medium">Court</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200">{getCourtName(selectedBooking)}</p>
                <p className="text-xs text-zinc-500">{getCourtType(selectedBooking)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 font-medium">Time Slot</p>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {getStartTime(selectedBooking)} - {getEndTime(selectedBooking)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 font-medium">Amount</p>
                <p className="text-base font-extrabold text-emerald-600">
                  ${getTotalAmount(selectedBooking).toLocaleString("en-US")}
                </p>
              </div>
            </div>

            {/* Receipt Viewer */}
            <div>
              <p className="text-xs text-zinc-400 font-medium mb-1.5">Payment Receipt</p>
              {getReceiptUrl(selectedBooking) ? (
                <div className="rounded-lg overflow-hidden border dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2 text-center">
                  <a
                    href={getReceiptUrl(selectedBooking)!}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block"
                  >
                    <img
                      src={getReceiptUrl(selectedBooking)!}
                      alt="Payment Receipt"
                      className="max-h-48 rounded mx-auto object-contain hover:opacity-90 transition"
                    />
                    <span className="block text-xs text-emerald-600 mt-1 underline">
                      Open full image in new tab
                    </span>
                  </a>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-dashed border-zinc-300 dark:border-zinc-700 text-center text-xs text-zinc-500">
                  {selectedBooking.notes?.includes("Manual")
                    ? "In-person / walk-in booking (No receipt required)."
                    : "The customer has not uploaded a payment receipt yet."}
                </div>
              )}
            </div>

            {/* WhatsApp Quick Action in Modal */}
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Notify Player via WhatsApp</p>
                  <p className="text-[11px] text-zinc-500">Sends instant booking details to {getCustomerPhone(selectedBooking)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOpenWhatsApp(selectedBooking)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Send WhatsApp
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                disabled={actionLoading}
                onClick={() => handleUpdateStatus(selectedBooking.id, "CANCELLED")}
                className="flex-1 py-2.5 px-4 text-xs font-semibold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-950/40 transition disabled:opacity-50"
              >
                Reject / Cancel
              </button>
              <button
                disabled={actionLoading || getStatus(selectedBooking) === "CONFIRMED" || getStatus(selectedBooking) === "CONFIRMADA"}
                onClick={() => handleUpdateStatus(selectedBooking.id, "CONFIRMED")}
                className="flex-1 py-2.5 px-4 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition shadow disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : "Confirm Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
