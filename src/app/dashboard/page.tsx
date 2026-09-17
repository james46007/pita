"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar, Clock, CheckCircle, XCircle, Eye, Loader2 } from "lucide-react"

interface BookingItem {
  id: string
  customerName?: string
  nombreCliente?: string
  customerPhone?: string
  telefonoCliente?: string
  totalAmount?: string | number
  montoTotal?: string | number
  status?: string
  estado?: string
  receiptUrl?: string | null
  comprobanteUrl?: string | null
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

export default function DashboardAgendaPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const todayStr = new Date().toISOString().split("T")[0]

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reservas?fecha=${todayStr}`)
      if (res.ok) {
        const data = await res.json()
        setBookings(data)
      }
    } catch {
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const handleUpdateStatus = async (bookingId: string, newStatus: "CONFIRMED" | "CANCELLED") => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/dashboard/reservas/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        setSelectedBooking(null)
        await fetchBookings()
      }
    } catch {
      alert("Error updating booking status")
    } finally {
      setActionLoading(false)
    }
  }

  const getStatus = (b: BookingItem) => b.status || b.estado || ""
  const getCustomerName = (b: BookingItem) => b.customerName || b.nombreCliente || "Unknown"
  const getCustomerPhone = (b: BookingItem) => b.customerPhone || b.telefonoCliente || ""
  const getTotalAmount = (b: BookingItem) => Number(b.totalAmount ?? b.montoTotal ?? 0)
  const getCourtName = (b: BookingItem) => b.court?.name || b.cancha?.nombre || "Court"
  const getStartTime = (b: BookingItem) => b.slot.startTime || b.slot.horaInicio || ""
  const getEndTime = (b: BookingItem) => b.slot.endTime || b.slot.horaFin || ""
  const getReceiptUrl = (b: BookingItem) => b.receiptUrl || b.comprobanteUrl || null

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "CONFIRMED":
      case "CONFIRMADA":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
      case "RECEIPT_UPLOADED":
      case "COMPROBANTE_SUBIDO":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400"
      case "PAYMENT_PENDING":
      case "PENDIENTE_PAGO":
        return "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
      case "CANCELLED":
      case "CANCELADA":
        return "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400"
      default:
        return "bg-zinc-100 text-zinc-700"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Today's Agenda
          </h1>
          <p className="text-sm text-zinc-500">
            Slots and bookings scheduled for today ({todayStr})
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchBookings} disabled={loading}>
          <Clock className="mr-2 h-4 w-4" /> Refresh Agenda
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">Total Slots Today</CardDescription>
            <CardTitle className="text-2xl font-bold">{bookings.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">Pending Receipt Audit</CardDescription>
            <CardTitle className="text-2xl font-bold text-blue-600">
              {bookings.filter((r) => getStatus(r) === "RECEIPT_UPLOADED" || getStatus(r) === "COMPROBANTE_SUBIDO").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">Confirmed</CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600">
              {bookings.filter((r) => getStatus(r) === "CONFIRMED" || getStatus(r) === "CONFIRMADA").length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Bookings Table for Today */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-600" />
            Scheduled Slots
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12 text-zinc-500">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading agenda...
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-12 text-center text-sm text-zinc-500">
              No slots scheduled for today.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time Slot</TableHead>
                  <TableHead>Court</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-semibold text-xs">
                      {getStartTime(r)} - {getEndTime(r)}
                    </TableCell>
                    <TableCell className="text-xs">{getCourtName(r)}</TableCell>
                    <TableCell className="text-xs">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{getCustomerName(r)}</p>
                      <p className="text-zinc-500">{getCustomerPhone(r)}</p>
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      ${getTotalAmount(r).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] border-0 font-medium ${getBadgeVariant(getStatus(r))}`}>
                        {getStatus(r).replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedBooking(r)}
                        className="h-8 text-xs"
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" /> Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal for Receipt Audit and Confirmation */}
      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        {selectedBooking && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Slot Details</DialogTitle>
              <DialogDescription>
                Review payment proof and confirm or release the slot
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2 text-sm">
              <div className="rounded-lg bg-zinc-100 dark:bg-zinc-900 p-3 space-y-1 text-xs">
                <p><strong>Court:</strong> {getCourtName(selectedBooking)}</p>
                <p><strong>Time:</strong> {getStartTime(selectedBooking)} - {getEndTime(selectedBooking)}</p>
                <p><strong>Customer:</strong> {getCustomerName(selectedBooking)} ({getCustomerPhone(selectedBooking)})</p>
                <p className="text-emerald-600 font-bold">Total: ${getTotalAmount(selectedBooking).toFixed(2)}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Payment Receipt:
                </h4>
                {getReceiptUrl(selectedBooking) ? (
                  <div className="rounded-lg border overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getReceiptUrl(selectedBooking)!}
                      alt="Receipt"
                      className="max-h-60 w-full object-contain bg-zinc-950"
                    />
                  </div>
                ) : (
                  <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg border border-amber-200">
                    The customer has not uploaded a bank transfer receipt yet.
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => handleUpdateStatus(selectedBooking.id, "CONFIRMED")}
                  disabled={actionLoading || getStatus(selectedBooking) === "CONFIRMED" || getStatus(selectedBooking) === "CONFIRMADA"}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                >
                  <CheckCircle className="mr-1.5 h-4 w-4" /> Confirm Booking
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleUpdateStatus(selectedBooking.id, "CANCELLED")}
                  disabled={actionLoading || getStatus(selectedBooking) === "CANCELLED" || getStatus(selectedBooking) === "CANCELADA"}
                  className="flex-1 text-xs"
                >
                  <XCircle className="mr-1.5 h-4 w-4" /> Cancel & Release
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
