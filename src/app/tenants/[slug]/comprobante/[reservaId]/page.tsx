import { notFound } from "next/navigation"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import ComprobanteClient from "./comprobante-client"

export default async function ComprobantePage({
  params,
}: {
  params: Promise<{ slug: string; reservaId: string }>
}) {
  const { slug, reservaId } = await params
  const headersList = await headers()
  const host = headersList.get("host") || ""
  const isSubdomain = host.startsWith(`${slug}.`)
  const basePath = isSubdomain ? "" : `/tenants/${slug}`

  const complex = await prisma.complex.findUnique({
    where: { slug },
    include: {
      bankAccounts: { where: { isActive: true } },
    },
  })

  if (!complex) notFound()

  const booking = await prisma.booking.findUnique({
    where: { id: reservaId },
    include: {
      court: true,
      slot: true,
    },
  })

  if (!booking || booking.complexId !== complex.id) {
    notFound()
  }

  return (
    <ComprobanteClient
      basePath={basePath}
      reservaId={booking.id}
      montoTotal={Number(booking.totalAmount)}
      canchaNombre={booking.court.name}
      fecha={booking.slot.date.toISOString().split("T")[0]}
      horaInicio={booking.slot.startTime}
      horaFin={booking.slot.endTime}
      estadoActual={booking.status}
      expiresAt={booking.expiresAt ? booking.expiresAt.toISOString() : null}
      cuentas={complex.bankAccounts.map((c) => ({
        id: c.id,
        banco: c.bankName,
        numeroCuenta: c.accountNumber,
        tipoCuenta: c.accountType,
        titular: c.holderName,
      }))}
    />
  )
}
