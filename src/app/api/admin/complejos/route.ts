import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptionsAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const createComplexSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  phone: z.string().min(7, "Phone number required"),
  address: z.string().min(5, "Address required"),
  slug: z.string().min(3, "Slug must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and dashes"),
  logoUrl: z.string().url().optional(),
})

// GET /api/admin/complejos (SUPER_ADMIN)
export async function GET() {
  try {
    const session = await getServerSession(authOptionsAdmin)
    const user = session?.user as any

    if (!user || !user.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const complexes = await prisma.complex.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { courts: true, users: true, bookings: true },
        },
      },
    })

    return NextResponse.json(complexes)
  } catch (error) {
    console.error("Error fetching complexes:", error)
    return NextResponse.json({ error: "Internal error fetching complexes" }, { status: 500 })
  }
}

// POST /api/admin/complejos (SUPER_ADMIN)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptionsAdmin)
    const user = session?.user as any

    if (!user || !user.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const raw = await req.json()
    // Support both English and legacy frontend payload
    const body = {
      name: raw.name ?? raw.nombre,
      phone: raw.phone ?? raw.telefono,
      address: raw.address ?? raw.direccion,
      slug: raw.slug,
      logoUrl: raw.logoUrl,
    }

    const validated = createComplexSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid data", issues: validated.error.flatten() },
        { status: 400 }
      )
    }

    const { name, phone, address, slug, logoUrl } = validated.data

    const existing = await prisma.complex.findUnique({
      where: { slug },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Slug is already in use by another complex" },
        { status: 409 }
      )
    }

    const complex = await prisma.complex.create({
      data: {
        name,
        phone,
        address,
        slug,
        logoUrl,
      },
    })

    return NextResponse.json(complex, { status: 201 })
  } catch (error) {
    console.error("Error creating complex:", error)
    return NextResponse.json({ error: "Internal error creating complex" }, { status: 500 })
  }
}
