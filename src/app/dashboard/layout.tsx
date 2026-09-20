import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import Link from "next/link"
import { authOptionsAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { LayoutDashboard, Calendar, Trophy, Clock, Settings, LogOut, ShieldAlert, BarChart3 } from "lucide-react"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptionsAdmin)

  if (!session?.user) {
    redirect("/login")
  }

  const user = session.user as any
  const firstComplexId = user.complexes?.[0]?.complexId

  let complexName = "My Complex"
  if (firstComplexId) {
    const c = await prisma.complex.findUnique({
      where: { id: firstComplexId },
      select: { name: true },
    })
    if (c) complexName = c.name
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-white dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex h-16 items-center border-b px-6 gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold">
            P
          </div>
          <div className="overflow-hidden">
            <h2 className="text-sm font-bold truncate text-zinc-900 dark:text-zinc-100">
              {complexName}
            </h2>
            <p className="text-[11px] text-zinc-500 truncate">{user.email}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-emerald-50 hover:text-emerald-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <LayoutDashboard className="h-4 w-4 text-emerald-600" />
            Today's Agenda
          </Link>
          <Link
            href="/dashboard/reservas"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-emerald-50 hover:text-emerald-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Calendar className="h-4 w-4 text-emerald-600" />
            All Bookings
          </Link>
          <Link
            href="/dashboard/metricas"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-emerald-50 hover:text-emerald-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <BarChart3 className="h-4 w-4 text-emerald-600" />
            Metrics & Reports
          </Link>
          <Link
            href="/dashboard/canchas"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-emerald-50 hover:text-emerald-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Trophy className="h-4 w-4 text-emerald-600" />
            Courts
          </Link>
          <Link
            href="/dashboard/slots"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-emerald-50 hover:text-emerald-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Clock className="h-4 w-4 text-emerald-600" />
            Generate Slots
          </Link>
          <Link
            href="/dashboard/configuracion"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-emerald-50 hover:text-emerald-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Settings className="h-4 w-4 text-emerald-600" />
            Bank Accounts
          </Link>

          {user.isSuperAdmin && (
            <Link
              href="/admin/complejos"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300"
            >
              <ShieldAlert className="h-4 w-4 text-purple-600" />
              SuperAdmin Panel
            </Link>
          )}
        </nav>

        <div className="border-t p-4">
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-white dark:bg-zinc-900 dark:border-zinc-800 px-6">
          <div className="flex items-center gap-3 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-sm">
              P
            </div>
            <span className="font-bold text-sm">{complexName}</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-zinc-500 font-medium">
              Signed in as: <strong className="text-zinc-800 dark:text-zinc-200">{user.name || user.email}</strong>
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
