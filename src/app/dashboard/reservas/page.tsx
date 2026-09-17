"use client"

import { useState, useEffect } from "react"
import { Search, Filter, CheckCircle, XCircle, Clock, Eye, FileText } from "lucide-react"
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

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [dateFilter, setDateFilter] = useState<string>("")
  const [search, setSearch] = useState<string>("")

  // Selected Booking Modal
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Booking Management
          </h1>
          <p className="text-sm text-zinc-500">
            View, filter, and audit payment receipts for customer reservations.
          </p>
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
                {filteredBookings.map((b) => (
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
                    <td className="px-6 py-4">{renderStatusBadge(getStatus(b))}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedBooking(b)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
                  The customer has not uploaded a payment receipt yet.
                </div>
              )}
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
