import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import Link from "next/link"
import { authOptionsAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { LayoutDashboard, Calendar, Trophy, Clock, Settings, LogOut, ShieldAlert, BarChart3, MessageCircle } from "lucide-react"
import { getSubscriptionState, SubscriptionState } from "@/lib/subscription"
import { SubscriptionBanner } from "@/components/dashboard/SubscriptionBanner"
import { PwaInstallPrompt } from "@/components/pwa/PwaInstallPrompt"
import { ComplexSwitcher } from "@/components/dashboard/ComplexSwitcher"
import { getCurrentUserAndTenant } from "@/lib/tenant"

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

  let activeComplexId = ""
  try {
    const tenant = await getCurrentUserAndTenant()
    activeComplexId = tenant.complexId
  } catch {
    activeComplexId = user.complexes?.[0]?.complexId || ""
  }

  let userComplexes: Array<{ id: string; name: string }> = []
  if (user.isSuperAdmin) {
    userComplexes = await prisma.complex.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })
  } else {
    const complexIds = user.complexes?.map((c: any) => c.complexId) || []
    if (complexIds.length > 0) {
      userComplexes = await prisma.complex.findMany({
        where: { id: { in: complexIds }, isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    }
  }

  const activeComplex = userComplexes.find((c) => c.id === activeComplexId) || userComplexes[0]
  if (activeComplex && !activeComplexId) {
    activeComplexId = activeComplex.id
  }
  const complexName = activeComplex?.name || (user.isSuperAdmin ? "Global Administration" : "My Complex")

  let pendingReceiptsCount = 0
  let subscriptionState: SubscriptionState | null = null

  if (activeComplexId) {
    const [receipts, complexData] = await Promise.all([
      prisma.booking.count({
        where: {
          complexId: activeComplexId,
          status: "RECEIPT_UPLOADED",
        },
      }),
      prisma.complex.findUnique({
        where: { id: activeComplexId },
        select: {
          subscriptionStatus: true,
          trialEndsAt: true,
          trialDays: true,
          gracePeriodDays: true,
          createdAt: true,
          isActive: true,
        },
      }),
    ])

    pendingReceiptsCount = receipts
    if (complexData) {
      subscriptionState = getSubscriptionState(complexData)
    }
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

        {userComplexes.length > 1 && (
          <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <ComplexSwitcher currentComplexId={activeComplexId} complexes={userComplexes} />
          </div>
        )}

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
            className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-emerald-50 hover:text-emerald-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-emerald-600" />
              <span>All Bookings</span>
            </div>
            {pendingReceiptsCount > 0 && (
              <span
                className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-amber-900 bg-amber-200 rounded-full dark:bg-amber-900/60 dark:text-amber-200 animate-pulse"
                title={`${pendingReceiptsCount} pending receipt${pendingReceiptsCount > 1 ? "s" : ""} to review`}
              >
                {pendingReceiptsCount}
              </span>
            )}
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
          <Link
            href="/dashboard/whatsapp"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-emerald-50 hover:text-emerald-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <MessageCircle className="h-4 w-4 text-emerald-600" />
            WhatsApp
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
          <div className="flex items-center gap-2 md:hidden max-w-[200px]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-sm shrink-0">
              P
            </div>
            {userComplexes.length > 1 ? (
              <div className="w-36">
                <ComplexSwitcher currentComplexId={activeComplexId} complexes={userComplexes} />
              </div>
            ) : (
              <span className="font-bold text-sm truncate">{complexName}</span>
            )}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <PwaInstallPrompt />
            <span className="text-xs text-zinc-500 font-medium">
              Signed in as: <strong className="text-zinc-800 dark:text-zinc-200">{user.name || user.email}</strong>
            </span>
          </div>
        </header>

        <SubscriptionBanner subscription={subscriptionState} isSuperAdmin={user.isSuperAdmin} />

        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
