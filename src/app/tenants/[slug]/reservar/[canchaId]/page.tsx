import { notFound } from "next/navigation"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import ReservarCanchaClient from "./reservar-client"

export default async function ReservarCanchaPage({
  params,
}: {
  params: Promise<{ slug: string; canchaId: string }>
}) {
  const { slug, canchaId } = await params
  const headersList = await headers()
  const host = headersList.get("host") || ""
  const isSubdomain = host.startsWith(`${slug}.`)
  const basePath = isSubdomain ? "" : `/tenants/${slug}`

  const complex = await prisma.complex.findUnique({
    where: { slug },
  })

  if (!complex) notFound()

  const court = await prisma.court.findFirst({
    where: {
      id: canchaId,
      complexId: complex.id,
      isActive: true,
    },
  })

  if (!court) notFound()

  return (
    <ReservarCanchaClient
      basePath={basePath}
      canchaId={court.id}
      canchaNombre={court.name}
      precioHora={Number(court.pricePerHour)}
      duracionMin={court.slotDurationMin}
    />
  )
}
