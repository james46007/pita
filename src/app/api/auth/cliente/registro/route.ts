import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

const registerSchema = z.object({
  name: z.string().min(2, "Name must have at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must have at least 6 characters"),
})

export async function POST(req: Request) {
  try {
    const raw = await req.json()
    const body = {
      name: raw.name ?? raw.nombre,
      email: raw.email,
      phone: raw.phone ?? raw.telefono,
      password: raw.password,
    }

    const validated = registerSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid data", issues: validated.error.flatten() },
        { status: 400 }
      )
    }

    const { name, email, phone, password } = validated.data

    const existingCustomer = await prisma.customer.findUnique({
      where: { email },
    })

    if (existingCustomer) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error("Error registering customer:", error)
    return NextResponse.json(
      { error: "Internal server error creating account" },
      { status: 500 }
    )
  }
}
