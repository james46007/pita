import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import ReservarCanchaClient from "./reservar-client"

export default async function ReservarCanchaPage({
  params,
}: {
  params: Promise<{ slug: string; canchaId: string }>
}) {
  const { slug, canchaId } = await params

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
      canchaId={court.id}
      canchaNombre={court.name}
      precioHora={Number(court.pricePerHour)}
      duracionMin={court.slotDurationMin}
    />
  )
}
