"use client"

import { useState, useEffect } from "react"
import { CreditCard, Plus, CheckCircle, XCircle, Clock, Save } from "lucide-react"
import { toast } from "sonner"

interface BankAccountItem {
  id: string
  bankName?: string
  banco?: string
  accountNumber?: string
  numeroCuenta?: string
  accountType?: "SAVINGS" | "CHECKING" | "AHORROS" | "CORRIENTE"
  tipoCuenta?: "SAVINGS" | "CHECKING" | "AHORROS" | "CORRIENTE"
  holderName?: string
  titular?: string
  holderId?: string
  identificacionTitular?: string
  isActive?: boolean
  activo?: boolean
}

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<BankAccountItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Complex Policy State
  const [timeoutMin, setTimeoutMin] = useState<number>(15)
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [savingConfig, setSavingConfig] = useState(false)

  // Form State
  const [bank, setBank] = useState("Bancolombia")
  const [accountNumber, setAccountNumber] = useState("")
  const [accountType, setAccountType] = useState<"SAVINGS" | "CHECKING">("SAVINGS")
  const [accountHolder, setAccountHolder] = useState("")
  const [holderId, setHolderId] = useState("")

  const fetchConfig = async () => {
    setLoadingConfig(true)
    try {
      const res = await fetch("/api/dashboard/configuracion")
      if (res.ok) {
        const data = await res.json()
        if (data.paymentTimeoutMin) {
          setTimeoutMin(data.paymentTimeoutMin)
        }
      }
    } catch {
      toast.error("Error loading complex settings")
    } finally {
      setLoadingConfig(false)
    }
  }

  const fetchAccounts = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/dashboard/cuentas-bancarias")
      if (res.ok) {
        const data = await res.json()
        setAccounts(data)
      }
    } catch {
      toast.error("Error loading bank accounts")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfig()
    fetchAccounts()
  }, [])

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingConfig(true)
    try {
      const res = await fetch("/api/dashboard/configuracion", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentTimeoutMin: timeoutMin }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Error saving timeout settings")
      }

      toast.success("Payment timeout policy updated successfully")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSavingConfig(false)
    }
  }

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch("/api/dashboard/cuentas-bancarias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: bank,
          accountNumber,
          accountType,
          holderName: accountHolder,
          holderId: holderId || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Error adding bank account")
      }

      toast.success("Bank account added successfully")
      setAccountNumber("")
      setAccountHolder("")
      setHolderId("")
      fetchAccounts()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleAccountStatus = async (id: string) => {
    try {
      const res = await fetch(`/api/dashboard/cuentas-bancarias?id=${id}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Error toggling account status")
      toast.success("Account status updated")
      fetchAccounts()
    } catch {
      toast.error("Could not update account")
    }
  }

  const getBankName = (a: BankAccountItem) => a.bankName || a.banco || ""
  const getAccountNumber = (a: BankAccountItem) => a.accountNumber || a.numeroCuenta || ""
  const getAccountType = (a: BankAccountItem) => {
    const t = a.accountType || a.tipoCuenta || "SAVINGS"
    if (t === "AHORROS") return "SAVINGS"
    if (t === "CORRIENTE") return "CHECKING"
    return t
  }
  const getHolderName = (a: BankAccountItem) => a.holderName || a.titular || ""
  const getHolderId = (a: BankAccountItem) => a.holderId || a.identificacionTitular || ""
  const getIsActive = (a: BankAccountItem) => a.isActive ?? a.activo ?? true

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Complex Configuration & Policies
        </h1>
        <p className="text-sm text-zinc-500">
          Manage payment timeout rules, automatic cancellation policies, and destination bank accounts.
        </p>
      </div>

      {/* Reservation & Payment Timeout Policy Card */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border dark:border-zinc-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 dark:border-zinc-800">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Tolerancia de Pago y Liberación Automática
              </h2>
              <p className="text-xs text-zinc-500 max-w-2xl">
                Define cuántos minutos tiene el cliente para realizar la transferencia y adjuntar su comprobante.
                Si vence este plazo, la reserva se cancela y la cancha se libera automáticamente para otros jugadores.
              </p>
            </div>
          </div>

          <form onSubmit={handleSavePolicy} className="flex items-center gap-3">
            <button
              type="submit"
              disabled={savingConfig || loadingConfig}
              className="inline-flex items-center gap-1.5 py-2 px-4 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow disabled:opacity-50 transition"
            >
              <Save className="w-3.5 h-3.5" />
              {savingConfig ? "Guardando..." : "Guardar Política"}
            </button>
          </form>
        </div>

        {loadingConfig ? (
          <div className="py-4 text-xs text-zinc-400 animate-pulse">Cargando configuración...</div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mr-1">
                Accesos rápidos:
              </span>
              {[10, 15, 20, 30, 45, 60].map((min) => (
                <button
                  key={min}
                  type="button"
                  onClick={() => setTimeoutMin(min)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition ${
                    timeoutMin === min
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold"
                      : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300"
                  }`}
                >
                  {min} min
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 max-w-xs">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Minutos personalizados:
              </label>
              <input
                type="number"
                min={5}
                max={120}
                value={timeoutMin}
                onChange={(e) => setTimeoutMin(Number(e.target.value))}
                className="w-24 px-3 py-1.5 border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm font-semibold text-center"
              />
            </div>

            <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 p-3 text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Vista previa:</span>
              Los clientes en tu página pública verán un temporizador de{" "}
              <strong>{timeoutMin} minutos</strong> para subir su comprobante antes de liberar la cancha.
            </div>
          </div>
        )}
      </div>

      <div className="border-t pt-6 dark:border-zinc-800">
        <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-1">
          Bank Accounts & Payment Instructions
        </h2>
        <p className="text-xs text-zinc-500 mb-6">
          Configure destination bank accounts where customers transfer payment for their court bookings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Account Form */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border dark:border-zinc-800 space-y-4 h-fit">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-600" />
            Add Bank Account
          </h3>

          <form onSubmit={handleAddAccount} className="space-y-3 text-sm">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Bank / Mobile Wallet
              </label>
              <input
                type="text"
                required
                placeholder="Bancolombia, Nequi, Chase..."
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Account Type
              </label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
              >
                <option value="SAVINGS">Savings</option>
                <option value="CHECKING">Checking</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Account Number / Mobile Number
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 123456789 or 3001234567"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Account Holder Name
              </label>
              <input
                type="text"
                required
                placeholder="Company or Individual Name"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Tax ID / National ID (Optional)
              </label>
              <input
                type="text"
                placeholder="900.123.456-7"
                value={holderId}
                onChange={(e) => setHolderId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2 px-4 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow disabled:opacity-50"
            >
              {saving ? "Adding..." : "Save Account"}
            </button>
          </form>
        </div>

        {/* Registered Accounts List */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-5 rounded-xl border dark:border-zinc-800 space-y-4">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            Registered Accounts ({accounts.length})
          </h3>

          {loading ? (
            <div className="py-12 text-center text-zinc-400 text-sm animate-pulse">
              Loading accounts...
            </div>
          ) : accounts.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-sm">
              No bank accounts configured. Customers won't see payment instructions.
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((c) => {
                const active = getIsActive(c)
                return (
                  <div
                    key={c.id}
                    className={`p-4 rounded-xl border flex items-center justify-between transition ${
                      active
                        ? "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30"
                        : "border-dashed border-zinc-300 dark:border-zinc-700 opacity-60 bg-zinc-100/40"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          {getBankName(c)}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                          {getAccountType(c)}
                        </span>
                      </div>

                      <p className="text-lg font-mono font-bold text-emerald-600 mt-1">
                        {getAccountNumber(c)}
                      </p>

                      <p className="text-xs text-zinc-500 mt-0.5">
                        Holder: <strong>{getHolderName(c)}</strong>{" "}
                        {getHolderId(c) && `(${getHolderId(c)})`}
                      </p>
                    </div>

                    <button
                      onClick={() => toggleAccountStatus(c.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                        active
                          ? "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40"
                          : "border-zinc-300 text-zinc-600 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800"
                      }`}
                    >
                      {active ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" /> Active
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" /> Inactive
                        </>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
