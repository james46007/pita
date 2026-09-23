"use client"

import { useState } from "react"
import { X, Send, Smartphone, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface TestMessageModalProps {
  isOpen: boolean
  onClose: () => void
  defaultPhone?: string | null
}

export function TestMessageModal({ isOpen, onClose, defaultPhone }: TestMessageModalProps) {
  const [phone, setPhone] = useState(defaultPhone || "")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim()) {
      toast.error("Please enter a destination phone number")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/dashboard/whatsapp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toPhone: phone,
          message: message.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to send test message")
      }

      toast.success(data.message || "Test message sent successfully!")
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Error sending test message")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Send Test WhatsApp
              </h3>
              <p className="text-xs text-zinc-500">Verify immediate delivery to your phone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSend} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Destination Phone Number
            </label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 0987654321 or +593987654321"
                className="w-full pl-9 pr-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
                required
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Supports domestic Ecuador format (09...) or international with country code.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Custom Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Leave blank to send default confirmation test message..."
              className="w-full p-3 text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-xl shadow-md hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Send Test
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
