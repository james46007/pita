"use client"

import { useState, useEffect } from "react"
import { X, RefreshCw, CheckCircle2, QrCode, Smartphone, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

interface QrModalProps {
  isOpen: boolean
  onClose: () => void
  onConnected: () => void
}

export function QrModal({ isOpen, onClose, onConnected }: QrModalProps) {
  const [loading, setLoading] = useState(false)
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null)
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(45)

  // Fetch or refresh QR code from server
  const fetchQr = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/dashboard/whatsapp/instance", { method: "POST" })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to initialize WhatsApp pairing")
      }

      if (data.qr?.base64) {
        setQrCodeBase64(data.qr.base64)
      } else if (data.qr?.code) {
        // If code is returned without data:image/png prefix
        setQrCodeBase64(
          data.qr.code.startsWith("data:") ? data.qr.code : `data:image/png;base64,${data.qr.code}`
        )
      }

      if (data.qr?.pairingCode) {
        setPairingCode(data.qr.pairingCode)
      }

      setCountdown(45)
    } catch (err: any) {
      toast.error(err.message || "Error requesting QR code")
    } finally {
      setLoading(false)
    }
  }

  // Initial load when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchQr()
    } else {
      setQrCodeBase64(null)
      setPairingCode(null)
    }
  }, [isOpen])

  // Countdown timer for QR expiration
  useEffect(() => {
    if (!isOpen || !qrCodeBase64) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen, qrCodeBase64])

  // Poll connection state every 3s while modal is open
  useEffect(() => {
    if (!isOpen) return

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch("/api/dashboard/whatsapp/status")
        if (res.ok) {
          const data = await res.json()
          if (data.config?.status === "CONNECTED") {
            toast.success("¡WhatsApp vinculado exitosamente! 🎉")
            onConnected()
            onClose()
          }
        }
      } catch {
        // Silent polling catch
      }
    }, 3000)

    return () => clearInterval(pollInterval)
  }, [isOpen, onConnected, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Link WhatsApp Account
              </h3>
              <p className="text-xs text-zinc-500">Scan QR code using WhatsApp Linked Devices</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Instructions */}
          <div className="p-4 space-y-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200/80 dark:border-zinc-700/50 text-xs text-zinc-600 dark:text-zinc-300">
            <div className="flex items-start gap-2.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] shrink-0">
                1
              </span>
              <span>Open WhatsApp on your phone</span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] shrink-0">
                2
              </span>
              <span>Go to Settings / Menu &gt; <strong>Linked Devices</strong></span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] shrink-0">
                3
              </span>
              <span>Tap <strong>Link a device</strong> and scan the QR code below</span>
            </div>
          </div>

          {/* QR Code Canvas Card */}
          <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-inner min-h-[280px]">
            {loading ? (
              <div className="flex flex-col items-center gap-3 text-zinc-500">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
                <p className="text-xs">Generating secure session...</p>
              </div>
            ) : qrCodeBase64 ? (
              <div className="flex flex-col items-center gap-4">
                <div className="relative p-3 bg-white rounded-xl shadow-md border border-zinc-200">
                  {/* QR Image */}
                  <img
                    src={qrCodeBase64}
                    alt="WhatsApp QR Code"
                    className={`w-52 h-52 object-contain transition-all ${
                      countdown === 0 ? "opacity-20 blur-sm" : ""
                    }`}
                  />
                  {countdown === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/90 dark:bg-zinc-900/90 rounded-xl">
                      <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                        QR code expired
                      </p>
                      <button
                        onClick={fetchQr}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700 transition"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Reload QR
                      </button>
                    </div>
                  )}
                </div>

                {/* Expiration bar */}
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    Auto-refreshes in <strong>{countdown}s</strong>
                  </span>
                  <button
                    onClick={fetchQr}
                    title="Refresh manually"
                    className="p-1 hover:text-emerald-600 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {pairingCode && (
                  <div className="text-center">
                    <p className="text-[11px] text-zinc-500">Or use pairing code:</p>
                    <code className="text-sm font-mono font-bold tracking-widest text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                      {pairingCode}
                    </code>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-zinc-400">
                <Smartphone className="w-10 h-10 stroke-1" />
                <p className="text-xs">No active QR session</p>
                <button
                  onClick={fetchQr}
                  className="px-4 py-2 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Generate QR
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>End-to-end encrypted session via your complex's WhatsApp account</span>
          </div>
        </div>
      </div>
    </div>
  )
}
