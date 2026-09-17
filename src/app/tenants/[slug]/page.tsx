import { notFound } from "next/navigation"
import { headers } from "next/headers"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, Calendar, Clock, Trophy } from "lucide-react"

export default async function TenantLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const headersList = await headers()
  const host = headersList.get("host") || ""
  const isSubdomain = host.startsWith(`${slug}.`)
  const basePath = isSubdomain ? "" : `/tenants/${slug}`

  const complex = await prisma.complex.findUnique({
    where: { slug },
    include: {
      courts: {
        where: { isActive: true },
        include: {
          schedules: { where: { isActive: true } },
        },
      },
    },
  })

  if (!complex || !complex.isActive) {
    notFound()
  }

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Complex Hero / Header */}
      <header className="border-b bg-white dark:bg-zinc-900 shadow-xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 font-bold text-white shadow-sm">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {complex.name}
              </h1>
              <p className="flex items-center text-xs text-zinc-500">
                <MapPin className="mr-1 h-3 w-3 text-emerald-600" /> {complex.address}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href={`tel:${complex.phone}`}
              className="hidden sm:flex items-center text-sm font-medium text-zinc-600 hover:text-emerald-600"
            >
              <Phone className="mr-1.5 h-4 w-4" /> {complex.phone}
            </a>
            <Link href="/mis-reservas">
              <Button variant="outline" size="sm">
                My Bookings
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Available Courts
          </h2>
          <p className="text-sm text-zinc-500">
            Select a court to view open slots and book your preferred schedule.
          </p>
        </div>

        {complex.courts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-800">
            <p className="text-sm text-zinc-500">No courts currently available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {complex.courts.map((court) => (
              <Card key={court.id} className="overflow-hidden border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="h-32 bg-gradient-to-br from-emerald-600 to-teal-800 p-4 flex items-end justify-between text-white">
                    <Badge className="bg-black/40 backdrop-blur-md text-white border-0 font-medium">
                      {court.type === "PADEL" ? "Padel" : "Turf Field"}
                    </Badge>
                    <span className="text-xl font-extrabold tracking-tight">
                      ${Number(court.pricePerHour).toFixed(2)}
                      <span className="text-xs font-normal opacity-80"> /hr</span>
                    </span>
                  </div>
                  <CardHeader className="pt-4">
                    <CardTitle className="text-lg font-bold">{court.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1.5 text-xs">
                      <Clock className="h-3.5 w-3.5 text-emerald-600" />
                      {court.slotDurationMin}-minute sessions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs text-zinc-500">
                    <p className="font-semibold text-zinc-700 dark:text-zinc-300">Operating hours:</p>
                    <div className="flex flex-wrap gap-1">
                      {court.schedules.length > 0 ? (
                        court.schedules.map((h) => (
                          <Badge key={h.id} variant="secondary" className="text-[10px]">
                            {daysOfWeek[h.dayOfWeek]}: {h.openTime}-{h.closeTime}
                          </Badge>
                        ))
                      ) : (
                        <span>Schedule to be defined</span>
                      )}
                    </div>
                  </CardContent>
                </div>
                <CardFooter className="pt-2">
                  <Link href={`${basePath}/reservar/${court.id}`} className="w-full">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
                      <Calendar className="mr-2 h-4 w-4" /> Book Court
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
