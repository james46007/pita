"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarIcon, Clock, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react"

interface SlotItem {
  id: string
  horaInicio: string
  horaFin: string
  estado: string
  cancha: {
    nombre: string
    tipo: string
    precioHora: string
  }
}

export default function ReservarCanchaClient({
  canchaId,
  canchaNombre,
  precioHora,
  duracionMin,
}: {
  canchaId: string
  canchaNombre: string
  precioHora: number
  duracionMin: number
}) {
  const router = useRouter()
  const today = new Date().toISOString().split("T")[0]

  const [fecha, setFecha] = useState(today)
  const [slots, setSlots] = useState<SlotItem[]>([])
  const [selectedSlot, setSelectedSlot] = useState<SlotItem | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Customer contact details
  const [nombre, setNombre] = useState("")
  const [telefono, setTelefono] = useState("")
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchSlots() {
      setLoadingSlots(true)
      setSelectedSlot(null)
      try {
        const res = await fetch(`/api/slots?canchaId=${canchaId}&fecha=${fecha}`)
        if (res.ok) {
          const data = await res.json()
          setSlots(data)
        } else {
          setSlots([])
        }
      } catch {
        setSlots([])
      } finally {
        setLoadingSlots(false)
      }
    }
    fetchSlots()
  }, [canchaId, fecha])

  const handleReserva = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlot) return

    setSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: selectedSlot.id,
          nombreCliente: nombre,
          telefonoCliente: telefono,
          emailCliente: email || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to complete reservation")
        setSubmitting(false)
        return
      }

      // Redirect to upload receipt page
      router.push(`/comprobante/${data.reserva.id}`)
    } catch {
      setError("Unexpected error while creating reservation")
      setSubmitting(false)
    }
  }

  const montoTotal = Number(precioHora) * (duracionMin / 60)

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to courts
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Book {canchaNombre}
            </h1>
            <p className="text-sm text-zinc-500">
              {duracionMin}-minute sessions • ${precioHora.toFixed(2)}/hr
            </p>
          </div>
          <Badge className="w-fit bg-emerald-600 text-white text-sm px-3 py-1">
            Total session: ${montoTotal.toFixed(2)}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date & Slots Selector */}
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-emerald-600" />
                1. Select Date & Slot
              </CardTitle>
              <CardDescription>Choose the date to check availability</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fecha">Date</Label>
                <Input
                  id="fecha"
                  type="date"
                  min={today}
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="font-medium"
                />
              </div>

              <div className="space-y-2 pt-2">
                <Label>Available Slots</Label>
                {loadingSlots ? (
                  <div className="flex items-center justify-center p-8 text-zinc-500">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading slots...
                  </div>
                ) : slots.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-6 text-center text-sm text-zinc-500">
                    No slots available for this date.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-1">
                    {slots.map((slot) => {
                      const isSelected = selectedSlot?.id === slot.id
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-sm font-semibold transition-all ${
                            isSelected
                              ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 ring-2 ring-emerald-600"
                              : "border-zinc-200 hover:border-emerald-300 dark:border-zinc-800"
                          }`}
                        >
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {slot.horaInicio}
                          </span>
                          <span className="text-[10px] font-normal text-zinc-500">
                            to {slot.horaFin}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Customer Details Form */}
          <Card className="border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
            <div>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  2. Contact Details
                </CardTitle>
                <CardDescription>
                  {selectedSlot
                    ? `Selected slot: ${fecha} from ${selectedSlot.horaInicio} to ${selectedSlot.horaFin}`
                    : "Select a time slot on the left first"}
                </CardDescription>
              </CardHeader>

              <form id="reserva-form" onSubmit={handleReserva}>
                <CardContent className="space-y-4">
                  {error && (
                    <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-200 dark:bg-red-950/50 dark:border-red-900">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="nombre">Full Name</Label>
                    <Input
                      id="nombre"
                      placeholder="John Doe"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      required
                      disabled={!selectedSlot || submitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefono">Phone Number (WhatsApp)</Label>
                    <Input
                      id="telefono"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      required
                      disabled={!selectedSlot || submitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address (Optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={!selectedSlot || submitting}
                    />
                  </div>
                </CardContent>
              </form>
            </div>

            <div className="p-6 pt-0">
              <Button
                type="submit"
                form="reserva-form"
                disabled={!selectedSlot || submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing Booking...
                  </>
                ) : (
                  `Confirm Booking ($${montoTotal.toFixed(2)})`
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
