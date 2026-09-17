import { NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUserAndTenant, assertAdminOnly } from "@/lib/tenant"
import { prisma } from "@/lib/prisma"

const updateConfigSchema = z.object({
  paymentTimeoutMin: z.coerce
    .number()
    .int("Debe ser un número entero")
    .min(5, "El tiempo mínimo es de 5 minutos")
    .max(120, "El tiempo máximo es de 120 minutos"),
})

// GET /api/dashboard/configuracion (ADMIN/STAFF)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const targetComplexId = searchParams.get("complexId") || searchParams.get("complejoId") || undefined
    const { complexId } = await getCurrentUserAndTenant(targetComplexId)

    const complex = await prisma.complex.findUnique({
      where: { id: complexId },
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        slug: true,
        paymentTimeoutMin: true,
      },
    })

    if (!complex) {
      return NextResponse.json({ error: "Complex not found" }, { status: 404 })
    }

    return NextResponse.json(complex)
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (error.message === "FORBIDDEN_TENANT_ACCESS") return NextResponse.json({ error: "Access denied" }, { status: 403 })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

// PATCH /api/dashboard/configuracion (ADMIN only)
export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const targetComplexId = searchParams.get("complexId") || searchParams.get("complejoId") || undefined
    const { complexId, role } = await getCurrentUserAndTenant(targetComplexId)

    assertAdminOnly(role)

    const body = await req.json()
    const validated = updateConfigSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: "Datos inválidos", issues: validated.error.flatten() },
        { status: 400 }
      )
    }

    const updated = await prisma.complex.update({
      where: { id: complexId },
      data: {
        paymentTimeoutMin: validated.data.paymentTimeoutMin,
      },
      select: {
        id: true,
        name: true,
        paymentTimeoutMin: true,
      },
    })

    return NextResponse.json({
      message: "Configuración actualizada con éxito",
      complex: updated,
    })
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (error.message === "FORBIDDEN_TENANT_ACCESS" || error.message === "ADMIN_ONLY") {
      return NextResponse.json({ error: "Acceso denegado: solo administradores" }, { status: 403 })
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
