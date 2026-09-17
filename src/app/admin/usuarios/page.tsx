"use client"

import { useState, useEffect } from "react"
import { Users, Plus, Shield, UserCheck } from "lucide-react"
import { toast } from "sonner"

interface ComplexOption {
  id: string
  name?: string
  nombre?: string
}

interface UserItem {
  id: string
  name?: string
  nombre?: string
  email: string
  isSuperAdmin?: boolean
  esSuperAdmin?: boolean
  createdAt: string
  complexes?: Array<{
    role?: "ADMIN" | "STAFF"
    rol?: "ADMIN" | "STAFF"
    complex?: {
      id: string
      name?: string
      nombre?: string
      slug: string
    }
    complejo?: {
      id: string
      name?: string
      nombre?: string
      slug: string
    }
  }>
  complejos?: Array<{
    role?: "ADMIN" | "STAFF"
    rol?: "ADMIN" | "STAFF"
    complex?: {
      id: string
      name?: string
      nombre?: string
      slug: string
    }
    complejo?: {
      id: string
      name?: string
      nombre?: string
      slug: string
    }
  }>
}

export default function UsuariosAdminPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [complexes, setComplexes] = useState<ComplexOption[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // New user form
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [complexId, setComplexId] = useState("")
  const [role, setRole] = useState<"ADMIN" | "STAFF">("ADMIN")

  const fetchData = async () => {
    setLoading(true)
    try {
      const [resUsers, resComp] = await Promise.all([
        fetch("/api/admin/usuarios"),
        fetch("/api/admin/complejos"),
      ])

      if (resUsers.ok) setUsers(await resUsers.json())
      if (resComp.ok) {
        const comps = await resComp.json()
        setComplexes(comps)
        if (comps.length > 0) setComplexId(comps[0].id)
      }
    } catch {
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          complexId,
          role,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create user")
      }

      toast.success("User created and assigned successfully")
      setModalOpen(false)
      setName("")
      setEmail("")
      setPassword("")
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const getUserName = (u: UserItem) => u.name || u.nombre || ""
  const getIsSuperAdmin = (u: UserItem) => u.isSuperAdmin ?? u.esSuperAdmin ?? false
  const getUserComplexes = (u: UserItem) => u.complexes || u.complejos || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            System Users & Permissions
          </h1>
          <p className="text-sm text-zinc-500">
            Create administrators and staff members assigned to each sports complex.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition shadow"
        >
          <Plus className="w-4 h-4" /> New User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border dark:border-zinc-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-zinc-400 text-sm animate-pulse">
            Loading users...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-300">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b dark:border-zinc-800 text-xs uppercase font-semibold text-zinc-500">
                <tr>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Type / Roles</th>
                  <th className="px-6 py-3.5">Assigned Complexes</th>
                  <th className="px-6 py-3.5">Registered Date</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-zinc-800">
                {users.map((u) => {
                  const userName = getUserName(u)
                  const isSuper = getIsSuperAdmin(u)
                  const comps = getUserComplexes(u)

                  return (
                    <tr key={u.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition">
                      <td className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center text-xs font-bold">
                          {userName.slice(0, 1).toUpperCase()}
                        </div>
                        {userName}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono">{u.email}</td>
                      <td className="px-6 py-4">
                        {isSuper ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                            <Shield className="w-3.5 h-3.5" /> SuperAdmin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                            <UserCheck className="w-3.5 h-3.5" /> Staff / Admin
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {comps.length === 0 ? (
                          <span className="text-zinc-400">Unassigned (Global)</span>
                        ) : (
                          <div className="space-y-1">
                            {comps.map((mc, idx) => {
                              const cName = mc.complex?.name || mc.complex?.nombre || mc.complejo?.name || mc.complejo?.nombre || ""
                              const cRole = mc.role || mc.rol || "STAFF"
                              return (
                                <div key={idx} className="flex items-center gap-1.5">
                                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                    {cName}
                                  </span>
                                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-700">
                                    {cRole}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-400">
                        {new Date(u.createdAt).toLocaleDateString("en-US")}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border dark:border-zinc-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                New Admin / Staff User
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mariana Torres"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Initial Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Assigned Complex
                </label>
                <select
                  value={complexId}
                  onChange={(e) => setComplexId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                >
                  {complexes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Role in Complex
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="ADMIN">Administrator (Full control)</option>
                  <option value="STAFF">Staff (Schedule and bookings only)</option>
                </select>
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
                  {saving ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
