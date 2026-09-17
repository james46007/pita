import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { authOptionsAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const createUserSchema = z.object({
  name: z.string().min(2, "Name required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  complexId: z.string().min(1, "Complex ID required"),
  role: z.enum(["ADMIN", "STAFF"]).default("STAFF"),
})

// GET /api/admin/usuarios (SUPER_ADMIN)
export async function GET() {
  try {
    const session = await getServerSession(authOptionsAdmin)
    const user = session?.user as any

    if (!user || !user.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        complexes: {
          include: {
            complex: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    })

    // Exclude passwordHash from response
    const sanitized = users.map((u) => {
      const { passwordHash, ...rest } = u
      return rest
    })

    return NextResponse.json(sanitized)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

// POST /api/admin/usuarios (SUPER_ADMIN)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptionsAdmin)
    const user = session?.user as any

    if (!user || !user.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const raw = await req.json()
    const body = {
      name: raw.name ?? raw.nombre,
      email: raw.email,
      password: raw.password,
      complexId: raw.complexId ?? raw.complejoId,
      role: raw.role ?? raw.rol,
    }

    const validated = createUserSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid data", issues: validated.error.flatten() },
        { status: 400 }
      )
    }

    const { name, email, password, complexId, role } = validated.data

    const existing = await prisma.user.findUnique({
      where: { email },
    })

    if (existing) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        isSuperAdmin: false,
        complexes: {
          create: {
            complexId,
            role,
          },
        },
      },
      include: {
        complexes: {
          include: {
            complex: true,
          },
        },
      },
    })

    const { passwordHash: _, ...rest } = newUser
    return NextResponse.json(rest, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Internal error creating user" }, { status: 500 })
  }
}
