import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import Link from "next/link"
import { authOptionsAdmin } from "@/lib/auth"
import { ShieldCheck, Building2, Users, BarChart3, ArrowLeft, LogOut } from "lucide-react"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptionsAdmin)

  if (!session?.user) {
    redirect("/login")
  }

  const user = session.user as any

  if (!user.isSuperAdmin && !user.esSuperAdmin) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* SuperAdmin Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-zinc-900 text-zinc-100 border-zinc-800">
        <div className="flex h-16 items-center border-b border-zinc-800 px-6 gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-600 text-white font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold truncate text-white">
              Super Admin
            </h2>
            <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          <Link
            href="/admin/metricas"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
          >
            <BarChart3 className="h-4 w-4 text-purple-400" />
            Global Metrics
          </Link>
          <Link
            href="/admin/complejos"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
          >
            <Building2 className="h-4 w-4 text-purple-400" />
            Sports Complexes
          </Link>
          <Link
            href="/admin/usuarios"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
          >
            <Users className="h-4 w-4 text-purple-400" />
            Users and Roles
          </Link>

          <div className="pt-4 border-t border-zinc-800">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-emerald-400 hover:bg-zinc-800 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>
        </nav>

        <div className="border-t border-zinc-800 p-4">
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-950/40 transition"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-white dark:bg-zinc-900 dark:border-zinc-800 px-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
              SuperAdmin Global Panel
            </span>
          </div>
          <div>
            <span className="text-xs text-zinc-500">
              {user.name} ({user.email})
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
