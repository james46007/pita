"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Calendar, Clock, MapPin, CheckCircle, XCircle, FileText, Trophy } from "lucide-react"
import { toast } from "sonner"

interface CustomerBooking {
  id: string
  customerName?: string
  nombreCliente?: string
  customerPhone?: string
  telefonoCliente?: string
  status?: string
  estado?: string
  totalAmount?: string | number
  montoTotal?: string | number
  receiptUrl?: string
  comprobanteUrl?: string
  createdAt?: string
  creadaAt?: string
  complex?: {
    name?: string
    nombre?: string
    slug: string
    phone?: string
    telefono?: string
    address?: string
    direccion?: string
  }
  complejo?: {
    name?: string
    nombre?: string
    slug: string
    phone?: string
    telefono?: string
    address?: string
    direccion?: string
  }
  court?: {
    name?: string
    nombre?: string
    type?: string
    tipo?: string
  }
  cancha?: {
    name?: string
    nombre?: string
    type?: string
    tipo?: string
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

export default function MisReservasPage() {
  const [reservas, setReservas] = useState<CustomerBooking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMisReservas = async () => {
      try {
        const res = await fetch("/api/cliente/reservas")
        if (res.ok) {
          const data = await res.json()
          setReservas(data)
        }
      } catch {
        toast.error("Failed to load booking history")
      } finally {
        setLoading(false)
      }
    }
    fetchMisReservas()
  }, [])

  const getStatus = (r: CustomerBooking) => r.status || r.estado || ""
  const getComplexName = (r: CustomerBooking) => r.complex?.name || r.complex?.nombre || r.complejo?.name || r.complejo?.nombre || ""
  const getComplexAddress = (r: CustomerBooking) => r.complex?.address || r.complex?.direccion || r.complejo?.address || r.complejo?.direccion || ""
  const getComplexSlug = (r: CustomerBooking) => r.complex?.slug || r.complejo?.slug || ""
  const getCourtName = (r: CustomerBooking) => r.court?.name || r.court?.nombre || r.cancha?.name || r.cancha?.nombre || ""
  const getCourtType = (r: CustomerBooking) => r.court?.type || r.court?.tipo || r.cancha?.type || r.cancha?.tipo || ""
  const getSlotDate = (r: CustomerBooking) => r.slot?.date || r.slot?.fecha || ""
  const getStartTime = (r: CustomerBooking) => r.slot?.startTime || r.slot?.horaInicio || ""
  const getEndTime = (r: CustomerBooking) => r.slot?.endTime || r.slot?.horaFin || ""
  const getTotalAmount = (r: CustomerBooking) => Number(r.totalAmount ?? r.montoTotal ?? 0)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
      case "CONFIRMADA":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle className="w-3.5 h-3.5" /> Confirmed
          </span>
        )
      case "RECEIPT_UPLOADED":
      case "COMPROBANTE_SUBIDO":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            <FileText className="w-3.5 h-3.5" /> Under Review
          </span>
        )
      case "PAYMENT_PENDING":
      case "PENDIENTE_PAGO":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <Clock className="w-3.5 h-3.5" /> Payment Pending
          </span>
        )
      case "CANCELLED":
      case "CANCELADA":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
            <XCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b dark:border-zinc-800 pb-5">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              My Bookings
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Complete history and status of your reserved courts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/api/auth/signout"
              className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 underline"
            >
              Sign Out
            </Link>
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="py-20 text-center text-zinc-400 text-sm animate-pulse">
            Loading your bookings...
          </div>
        ) : reservas.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-2xl border dark:border-zinc-800 space-y-3">
            <Trophy className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto" />
            <h3 className="font-bold text-lg text-zinc-800 dark:text-zinc-200">
              No active bookings found
            </h3>
            <p className="text-sm text-zinc-500 max-w-sm mx-auto">
              Visit your favorite sports complex subdomain to book your court time slot.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reservas.map((r) => {
              const status = getStatus(r)
              const slug = getComplexSlug(r)

              return (
                <div
                  key={r.id}
                  className="bg-white dark:bg-zinc-900 rounded-2xl border dark:border-zinc-800 p-5 shadow-xs transition hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                        {getCourtName(r)}
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        {getCourtType(r)}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {getComplexName(r)} · {getComplexAddress(r)}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                        {getSlotDate(r) ? new Date(getSlotDate(r)).toLocaleDateString("en-US", { timeZone: "UTC" }) : "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        {getStartTime(r)} - {getEndTime(r)}
                      </span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        Total: ${getTotalAmount(r).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-2 shrink-0">
                    {getStatusBadge(status)}

                    {(status === "PAYMENT_PENDING" || status === "PENDIENTE_PAGO") && (
                      <a
                        href={`http://${slug}.localhost:3000/comprobante/${r.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 underline mt-1"
                      >
                        <FileText className="w-3.5 h-3.5" /> Upload Payment Receipt
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
