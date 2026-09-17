"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Upload, Building2, CreditCard, Loader2, Clock, AlertTriangle, RefreshCw } from "lucide-react"

interface CuentaBancariaInfo {
  id: string
  banco: string
  numeroCuenta: string
  tipoCuenta: string
  titular: string
}

export default function ComprobanteClient({
  basePath = "",
  reservaId,
  montoTotal,
  canchaNombre,
  fecha,
  horaInicio,
  horaFin,
  estadoActual,
  expiresAt,
  cuentas,
}: {
  basePath?: string
  reservaId: string
  montoTotal: number
  canchaNombre: string
  fecha: string
  horaInicio: string
  horaFin: string
  estadoActual: string
  expiresAt?: string | null
  cuentas: CuentaBancariaInfo[]
}) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(estadoActual === "COMPROBANTE_SUBIDO" || estadoActual === "CONFIRMADA")
  const [error, setError] = useState("")

  // Expiration countdown logic
  const [isExpired, setIsExpired] = useState(() => {
    if (estadoActual === "CANCELLED") return true
    if (!expiresAt) return false
    return new Date().getTime() >= new Date(expiresAt).getTime()
  })
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    if (!expiresAt) return 0
    const diff = Math.floor((new Date(expiresAt).getTime() - new Date().getTime()) / 1000)
    return diff > 0 ? diff : 0
  })

  // Timer interval
  useEffect(() => {
    if (!expiresAt || success || isExpired) return

    const timer = setInterval(() => {
      const now = new Date().getTime()
      const end = new Date(expiresAt).getTime()
      const diff = Math.floor((end - now) / 1000)

      if (diff <= 0) {
        setIsExpired(true)
        setRemainingSeconds(0)
        clearInterval(timer)
      } else {
        setRemainingSeconds(diff)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [expiresAt, success, isExpired])

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || isExpired) return

    setUploading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch(`/api/reservas/${reservaId}/comprobante`, {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 410) {
          setIsExpired(true)
        }
        setError(data.error || "Failed to upload payment receipt")
        setUploading(false)
        return
      }

      setSuccess(true)
    } catch {
      setError("Network error while uploading payment receipt")
    } finally {
      setUploading(false)
    }
  }

  const isWarningTime = remainingSeconds > 0 && remainingSeconds <= 300 // Last 5 minutes

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 px-4 py-12">
      <div className="mx-auto max-w-xl space-y-6">
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-md">
          <CardHeader className="text-center pb-2">
            <div
              className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full ${
                isExpired
                  ? "bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400"
                  : "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
              }`}
            >
              {isExpired ? <AlertTriangle className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
            </div>
            <CardTitle className="text-xl font-bold">
              {isExpired ? "Reserva Vencida" : "Turno Pre-reservado"}
            </CardTitle>
            <CardDescription>
              {isExpired
                ? "El tiempo para adjuntar el comprobante ha expirado y la cancha ha sido liberada."
                : "Realiza la transferencia bancaria y sube tu comprobante antes de que finalice el temporizador."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-4">
            {/* Live Countdown Timer Banner (Only if not completed and not expired) */}
            {!success && !isExpired && expiresAt && (
              <div
                className={`rounded-xl p-4 flex items-center justify-between border transition-all ${
                  isWarningTime
                    ? "bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-300 animate-pulse"
                    : "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-300"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Clock
                    className={`h-5 w-5 ${
                      isWarningTime ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider">
                      {isWarningTime ? "¡Tiempo límite casi agotado!" : "Tiempo para transferir"}
                    </p>
                    <p className="text-xs opacity-80">
                      Sube tu pago antes de que se libere el horario
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono text-2xl font-black tracking-tight">
                    {formatTime(remainingSeconds)}
                  </span>
                </div>
              </div>
            )}

            {/* Expired Alert Banner */}
            {isExpired && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-5 text-center space-y-3 dark:bg-red-950/40 dark:border-red-900">
                <div className="flex items-center justify-center gap-2 text-red-700 dark:text-red-400 font-bold text-sm">
                  <AlertTriangle className="h-5 w-5" />
                  Plazo de pago agotado
                </div>
                <p className="text-xs text-red-600 dark:text-red-300 leading-relaxed">
                  Para no bloquear la cancha a otros deportistas, esta reserva ha sido cancelada
                  automáticamente. Si ya realizaste la transferencia, comunícate directamente con el complejo.
                </p>
                <Button
                  onClick={() => router.push(basePath || "/")}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold mt-2"
                >
                  <RefreshCw className="mr-2 h-3.5 w-3.5" /> Volver y reservar otro horario
                </Button>
              </div>
            )}

            {/* Booking Summary */}
            <div className="rounded-lg bg-zinc-100 dark:bg-zinc-900 p-4 space-y-2 text-sm">
              <div className="flex justify-between font-semibold">
                <span>Cancha:</span>
                <span>{canchaNombre}</span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Horario:</span>
                <span>
                  {fecha} ({horaInicio} - {horaFin})
                </span>
              </div>
              <div className="flex justify-between text-emerald-600 font-bold text-base pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <span>Monto Total a Transferir:</span>
                <span>${montoTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Bank Accounts (Only if not expired) */}
            {!isExpired && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200">
                  <Building2 className="h-4 w-4 text-emerald-600" />
                  Cuentas Bancarias del Complejo
                </h3>

                {cuentas.length === 0 ? (
                  <p className="text-xs text-zinc-500">
                    Contacta directamente con la administración del complejo para obtener las cuentas bancarias.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {cuentas.map((c) => (
                      <div
                        key={c.id}
                        className="rounded-lg border border-zinc-200 p-3 text-xs dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center"
                      >
                        <div>
                          <p className="font-bold text-zinc-900 dark:text-zinc-100">{c.banco}</p>
                          <p className="text-zinc-500">
                            Cuenta {c.tipoCuenta}:{" "}
                            <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">
                              {c.numeroCuenta}
                            </span>
                          </p>
                          <p className="text-zinc-500">Titular: {c.titular}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          <CreditCard className="h-3 w-3 mr-1" /> Transferencia
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Status or Upload Form */}
            {success ? (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center space-y-2 dark:bg-emerald-950/40 dark:border-emerald-900">
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  ✓ Comprobante enviado con éxito
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-500">
                  El administrador validará tu transferencia y confirmará tu turno en breve.
                </p>
              </div>
            ) : isExpired ? null : (
              <form onSubmit={handleUpload} className="space-y-4 pt-2 border-t">
                {error && (
                  <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-200">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Adjuntar Comprobante de Transferencia (Foto o PDF)
                  </label>
                  <Input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    required
                    disabled={uploading || isExpired}
                  />
                  <p className="text-[11px] text-zinc-500">
                    Máximo 5MB. Formatos permitidos: JPG, PNG, WEBP, PDF.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={!file || uploading || isExpired}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subiendo comprobante...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" /> Enviar Comprobante
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex justify-center border-t pt-4">
            <Button variant="ghost" size="sm" onClick={() => router.push(basePath || "/")}>
              Volver a la página principal
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
