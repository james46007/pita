"use client"

import { useState, useEffect } from "react"
import {
  MessageCircle,
  QrCode,
  LogOut,
  Send,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Smartphone,
  ShieldAlert,
  Calendar,
  Sparkles,
  Zap,
} from "lucide-react"
import { toast } from "sonner"
import { QrModal } from "@/components/dashboard/whatsapp/QrModal"
import { TestMessageModal } from "@/components/dashboard/whatsapp/TestMessageModal"

interface WhatsappConfigData {
  id: string
  instanceName: string
  status: "DISCONNECTED" | "CONNECTING" | "CONNECTED"
  phoneNumber: string | null
  profileName: string | null
  isActive: boolean
  customMessage: string | null
  updatedAt: string
}

interface OutboundMessageItem {
  id: string
  toPhone: string
  messageBody: string
  status: "PENDING" | "SENT" | "FAILED_PERMANENT" | "EXPIRED"
  attempts: number
  lastError: string | null
  sentAt: string | null
  createdAt: string
  booking?: {
    id: string
    customerName: string
    totalAmount: number
    court?: { name: string }
    slot?: { date: string; startTime: string; endTime: string }
  }
}

export default function WhatsAppDashboardPage() {
  const [config, setConfig] = useState<WhatsappConfigData | null>(null)
  const [userRole, setUserRole] = useState<string>("STAFF")
  const [metrics, setMetrics] = useState({ pending: 0, sent: 0, failed: 0 })
  const [messages, setMessages] = useState<OutboundMessageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Modals
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [isTestModalOpen, setIsTestModalOpen] = useState(false)

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/dashboard/whatsapp/status")
      if (res.ok) {
        const data = await res.json()
        setConfig(data.config)
        setUserRole(data.userRole || "STAFF")
        if (data.metrics) setMetrics(data.metrics)
        if (data.recentMessages) setMessages(data.recentMessages)
      }
    } catch {
      toast.error("Failed to load WhatsApp configuration")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect this WhatsApp account? Automated messages will be paused.")) {
      return
    }

    setActionLoading(true)
    try {
      const res = await fetch("/api/dashboard/whatsapp/instance", { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to disconnect WhatsApp")
      }
      toast.success("WhatsApp session disconnected")
      fetchStatus()
    } catch (err: any) {
      toast.error(err.message || "Error disconnecting")
    } finally {
      setActionLoading(false)
    }
  }

  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN"
  const isConnected = config?.status === "CONNECTED"

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              WhatsApp Notifications
            </h1>
          </div>
          <p className="text-sm text-zinc-500 mt-1">
            Connect your sports complex WhatsApp number to send automated instant booking confirmations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setLoading(true)
              fetchStatus()
            }}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-700/50 shadow-sm transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          {isConnected && isAdmin && (
            <button
              onClick={() => setIsTestModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-xl shadow-sm hover:bg-emerald-700 transition"
            >
              <Send className="w-3.5 h-3.5" />
              Send Test
            </button>
          )}
        </div>
      </div>

      {/* Role Notice for STAFF */}
      {!isAdmin && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl text-xs text-amber-800 dark:text-amber-300">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            You have <strong>Staff</strong> permissions. You can view the connection status and message logs, but only an <strong>Administrator</strong> can pair or disconnect the WhatsApp session.
          </span>
        </div>
      )}

      {/* Main Connection State Card */}
      <div className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div
                className={`p-3.5 rounded-2xl shrink-0 ${
                  isConnected
                    ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600"
                    : config?.status === "CONNECTING"
                    ? "bg-amber-50 dark:bg-amber-950/50 text-amber-600"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                }`}
              >
                <Smartphone className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    {isConnected
                      ? "WhatsApp Connected & Ready"
                      : config?.status === "CONNECTING"
                      ? "Pairing in Progress"
                      : "WhatsApp Disconnected"}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      isConnected
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : config?.status === "CONNECTING"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isConnected
                          ? "bg-emerald-500 animate-pulse"
                          : config?.status === "CONNECTING"
                          ? "bg-amber-500 animate-ping"
                          : "bg-zinc-400"
                      }`}
                    />
                    {config?.status || "DISCONNECTED"}
                  </span>
                </div>

                <p className="text-xs text-zinc-500 max-w-xl">
                  {isConnected
                    ? `Your complex is actively paired with ${
                        config?.phoneNumber ? `+${config.phoneNumber}` : "WhatsApp"
                      }. When you mark an uploaded payment receipt as confirmed, players will instantly receive an automated WhatsApp confirmation.`
                    : "Link your phone number by scanning a QR code with WhatsApp Linked Devices to enable direct player confirmations."}
                </p>

                {isConnected && config?.updatedAt && (
                  <p className="text-[11px] text-zinc-400 pt-1">
                    Last session sync: {new Date(config.updatedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {isAdmin && !isConnected && (
                <button
                  onClick={() => setIsQrModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-emerald-600 text-white rounded-xl shadow-md hover:bg-emerald-700 transition"
                >
                  <QrCode className="w-4 h-4" />
                  Link WhatsApp (Scan QR)
                </button>
              )}

              {isAdmin && isConnected && (
                <>
                  <button
                    onClick={() => setIsTestModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-600" />
                    Test Message
                  </button>
                  <button
                    onClick={handleDisconnect}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-xl transition disabled:opacity-50"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Disconnect
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Feature Highlights Footer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100 dark:divide-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/40 border-t border-zinc-100 dark:border-zinc-800/80 px-6 py-4 text-xs text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-2.5 py-1">
            <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Instant delivery on payment verification</span>
          </div>
          <div className="flex items-center gap-2.5 py-1 sm:px-4">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Anti-spam randomized templates</span>
          </div>
          <div className="flex items-center gap-2.5 py-1 sm:px-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Automated retries with backoff</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Delivered Messages
            </span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">{metrics.sent}</p>
          <p className="text-xs text-zinc-400 mt-1">Successfully confirmed to players</p>
        </div>

        <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Pending in Queue
            </span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
            {metrics.pending}
          </p>
          <p className="text-xs text-zinc-400 mt-1">Scheduled for next cron cycle</p>
        </div>

        <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Failed / Invalid
            </span>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/60 text-rose-600 rounded-xl">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
            {metrics.failed}
          </p>
          <p className="text-xs text-zinc-400 mt-1">Unregistered numbers or max retries</p>
        </div>
      </div>

      {/* Outbound Delivery Log */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Recent WhatsApp Outbound Logs
            </h3>
            <p className="text-xs text-zinc-500">
              Audit trail of automated confirmation messages dispatched to players
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {messages.length === 0 ? (
            <div className="p-12 text-center text-zinc-400 text-xs">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No WhatsApp messages recorded yet. Messages will appear here as bookings are confirmed.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/80 dark:bg-zinc-800/40 text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-3 font-semibold">Player</th>
                  <th className="px-6 py-3 font-semibold">Destination</th>
                  <th className="px-6 py-3 font-semibold">Court &amp; Schedule</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Dispatched At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {messages.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition">
                    <td className="px-6 py-3.5">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {item.booking?.customerName || "Customer"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-zinc-600 dark:text-zinc-400">
                      +{item.toPhone}
                    </td>
                    <td className="px-6 py-3.5 text-zinc-500">
                      {item.booking?.court?.name || "Court"} •{" "}
                      {item.booking?.slot?.date
                        ? new Date(item.booking.slot.date).toLocaleDateString()
                        : ""}{" "}
                      ({item.booking?.slot?.startTime || ""})
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          item.status === "SENT"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : item.status === "PENDING"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : item.status === "EXPIRED"
                            ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        }`}
                      >
                        {item.status}
                      </span>
                      {item.lastError && (
                        <p className="text-[10px] text-rose-500 mt-0.5 truncate max-w-[180px]" title={item.lastError}>
                          {item.lastError}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-zinc-400">
                      {item.sentAt
                        ? new Date(item.sentAt).toLocaleString()
                        : new Date(item.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modals */}
      <QrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onConnected={fetchStatus}
      />
      <TestMessageModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        defaultPhone={config?.phoneNumber}
      />
    </div>
  )
}
