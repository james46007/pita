"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Upload, Building2, CreditCard, Loader2 } from "lucide-react"

interface CuentaBancariaInfo {
  id: string
  banco: string
  numeroCuenta: string
  tipoCuenta: string
  titular: string
}

export default function ComprobanteClient({
  reservaId,
  montoTotal,
  canchaNombre,
  fecha,
  horaInicio,
  horaFin,
  estadoActual,
  cuentas,
}: {
  reservaId: string
  montoTotal: number
  canchaNombre: string
  fecha: string
  horaInicio: string
  horaFin: string
  estadoActual: string
  cuentas: CuentaBancariaInfo[]
}) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(estadoActual === "COMPROBANTE_SUBIDO" || estadoActual === "CONFIRMADA")
  const [error, setError] = useState("")

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

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

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 px-4 py-12">
      <div className="mx-auto max-w-xl space-y-6">
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-md">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl font-bold">Booking Reserved!</CardTitle>
            <CardDescription>
              Your reservation is pre-booked. Complete the bank transfer and submit your receipt for administrator confirmation.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-4">
            {/* Booking Summary */}
            <div className="rounded-lg bg-zinc-100 dark:bg-zinc-900 p-4 space-y-2 text-sm">
              <div className="flex justify-between font-semibold">
                <span>Court:</span>
                <span>{canchaNombre}</span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Time:</span>
                <span>{fecha} ({horaInicio} - {horaFin})</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-bold text-base pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <span>Total Amount to Transfer:</span>
                <span>${montoTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Bank Accounts */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200">
                <Building2 className="h-4 w-4 text-emerald-600" />
                Sports Complex Bank Accounts
              </h3>

              {cuentas.length === 0 ? (
                <p className="text-xs text-zinc-500">
                  Please contact the sports complex management directly to obtain transfer details.
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
                          {c.tipoCuenta} Account: <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">{c.numeroCuenta}</span>
                        </p>
                        <p className="text-zinc-500">Beneficiary: {c.titular}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        <CreditCard className="h-3 w-3 mr-1" /> Wire Transfer
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status or Upload Form */}
            {success ? (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center space-y-2 dark:bg-emerald-950/40 dark:border-emerald-900">
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  ✓ Receipt received
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-500">
                  The administrator will review your transfer and confirm your booking shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleUpload} className="space-y-4 pt-2 border-t">
                {error && (
                  <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-200">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Upload Transfer Receipt (Screenshot or PDF)
                  </label>
                  <Input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    required
                    disabled={uploading}
                  />
                  <p className="text-[11px] text-zinc-500">
                    Maximum 5MB. Supported formats: JPG, PNG, WEBP, PDF.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={!file || uploading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" /> Submit Receipt
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex justify-center border-t pt-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
              Return to Homepage
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
