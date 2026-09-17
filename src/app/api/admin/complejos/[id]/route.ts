import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptionsAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const updateComplexSchema = z.object({
  name: z.string().min(3).optional(),
  phone: z.string().min(7).optional(),
  address: z.string().min(5).optional(),
  logoUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptionsAdmin)
    const user = session?.user as any

    if (!user || !user.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { id } = await params
    const raw = await req.json()
    const body = {
      name: raw.name ?? raw.nombre,
      phone: raw.phone ?? raw.telefono,
      address: raw.address ?? raw.direccion,
      logoUrl: raw.logoUrl,
      isActive: raw.isActive ?? raw.activo,
    }

    const validated = updateComplexSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid data", issues: validated.error.flatten() },
        { status: 400 }
      )
    }

    const complex = await prisma.complex.update({
      where: { id },
      data: validated.data,
    })

    return NextResponse.json(complex)
  } catch (error) {
    console.error("Error updating complex:", error)
    return NextResponse.json({ error: "Internal error updating complex" }, { status: 500 })
  }
}
