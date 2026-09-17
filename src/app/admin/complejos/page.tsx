"use client"

import { useState, useEffect } from "react"
import { Building2, Plus, Globe, CheckCircle, XCircle, ExternalLink } from "lucide-react"
import { toast } from "sonner"

interface ComplexItem {
  id: string
  name?: string
  nombre?: string
  phone?: string
  telefono?: string
  address?: string
  direccion?: string
  slug: string
  isActive?: boolean
  activo?: boolean
  _count?: {
    courts?: number
    canchas?: number
    users?: number
    usuarios?: number
    bookings?: number
    reservas?: number
  }
}

export default function ComplejosAdminPage() {
  const [complexes, setComplexes] = useState<ComplexItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // New sports complex form
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [slug, setSlug] = useState("")

  const fetchComplexes = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/complejos")
      if (res.ok) {
        const data = await res.json()
        setComplexes(data)
      }
    } catch {
      toast.error("Failed to load sports complexes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComplexes()
  }, [])

  const handleCreateComplex = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch("/api/admin/complejos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, address, slug }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create sports complex")
      }

      toast.success("Sports complex created successfully!")
      setModalOpen(false)
      setName("")
      setPhone("")
      setAddress("")
      setSlug("")
      fetchComplexes()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (c: ComplexItem) => {
    const isCurrentlyActive = c.isActive ?? c.activo ?? true
    try {
      const res = await fetch(`/api/admin/complejos/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isCurrentlyActive }),
      })

      if (!res.ok) throw new Error("Failed to toggle status")
      toast.success(isCurrentlyActive ? "Sports complex deactivated" : "Sports complex reactivated")
      fetchComplexes()
    } catch {
      toast.error("Could not update status")
    }
  }

  const getComplexName = (c: ComplexItem) => c.name || c.nombre || ""
  const getComplexAddress = (c: ComplexItem) => c.address || c.direccion || ""
  const getComplexPhone = (c: ComplexItem) => c.phone || c.telefono || ""
  const getIsActive = (c: ComplexItem) => c.isActive ?? c.activo ?? true
  const getCourtsCount = (c: ComplexItem) => c._count?.courts ?? c._count?.canchas ?? 0
  const getUsersCount = (c: ComplexItem) => c._count?.users ?? c._count?.usuarios ?? 0
  const getBookingsCount = (c: ComplexItem) => c._count?.bookings ?? c._count?.reservas ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Registered Sports Complexes
          </h1>
          <p className="text-sm text-zinc-500">
            Create venues, assign subdomains (slugs), and manage their public availability across the platform.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition shadow"
        >
          <Plus className="w-4 h-4" /> New Complex
        </button>
      </div>

      {/* Complexes Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border dark:border-zinc-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-zinc-400 text-sm animate-pulse">
            Loading sports complexes...
          </div>
        ) : complexes.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-sm">
            No sports complexes registered yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-300">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b dark:border-zinc-800 text-xs uppercase font-semibold text-zinc-500">
                <tr>
                  <th className="px-6 py-3.5">Complex</th>
                  <th className="px-6 py-3.5">Subdomain / Slug</th>
                  <th className="px-6 py-3.5">Contact</th>
                  <th className="px-6 py-3.5">Metrics</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-zinc-800">
                {complexes.map((c) => {
                  const active = getIsActive(c)
                  return (
                    <tr key={c.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition">
                      <td className="px-6 py-4">
                        <p className="font-bold text-zinc-900 dark:text-zinc-100">{getComplexName(c)}</p>
                        <p className="text-xs text-zinc-500">{getComplexAddress(c)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={`http://${c.slug}.localhost:3000`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-purple-600 hover:underline"
                        >
                          {c.slug} <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-600 dark:text-zinc-400">
                        {getComplexPhone(c)}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span>
                          <strong>{getCourtsCount(c)}</strong> courts · <strong>{getUsersCount(c)}</strong> staff · <strong>{getBookingsCount(c)}</strong> bookings
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            active
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
                              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
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
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => toggleStatus(c)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition border ${
                            active
                              ? "border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/60"
                              : "border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-900/60"
                          }`}
                        >
                          {active ? "Deactivate" : "Reactivate"}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Complex Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border dark:border-zinc-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                New Sports Complex
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateComplex} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Business / Complex Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. North Padel Arena"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (!slug) {
                      setSlug(
                        e.target.value
                          .toLowerCase()
                          .normalize("NFD")
                          .replace(/[\u0300-\u036f]/g, "")
                          .replace(/[^a-z0-9]/g, "-")
                          .replace(/-+/g, "-")
                      )
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Subdomain / Slug (unique)
                </label>
                <input
                  type="text"
                  required
                  placeholder="north-padel"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 font-mono text-zinc-900 dark:text-zinc-100"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Public URL: {slug ? `${slug}.localhost:3000` : "..."}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+1 (555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  required
                  placeholder="123 Main St, City"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2 px-4 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 px-4 text-xs font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 shadow disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Complex"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
