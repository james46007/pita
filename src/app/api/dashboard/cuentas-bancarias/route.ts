import { NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUserAndTenant, assertAdminOnly } from "@/lib/tenant"
import { prisma } from "@/lib/prisma"

const bankAccountSchema = z.object({
  bankName: z.string().min(2, "Bank name required"),
  accountNumber: z.string().min(4, "Account number required"),
  accountType: z.enum(["CHECKING", "SAVINGS"]).default("SAVINGS"),
  holderName: z.string().min(3, "Account holder name required"),
  holderId: z.string().optional(),
})

// GET /api/dashboard/cuentas-bancarias
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const targetComplexId = searchParams.get("complexId") || searchParams.get("complejoId") || undefined
    const { complexId } = await getCurrentUserAndTenant(targetComplexId)

    const accounts = await prisma.bankAccount.findMany({
      where: { complexId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(accounts)
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (error.message === "FORBIDDEN_TENANT_ACCESS") return NextResponse.json({ error: "Access denied to this complex" }, { status: 403 })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

// POST /api/dashboard/cuentas-bancarias
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const targetComplexId = searchParams.get("complexId") || searchParams.get("complejoId") || undefined
    const { complexId, role } = await getCurrentUserAndTenant(targetComplexId)

    assertAdminOnly(role)

    const raw = await req.json()
    let accType = raw.accountType ?? raw.tipoCuenta
    if (accType === "CORRIENTE") accType = "CHECKING"
    if (accType === "AHORROS") accType = "SAVINGS"

    const body = {
      bankName: raw.bankName ?? raw.banco,
      accountNumber: raw.accountNumber ?? raw.numeroCuenta,
      accountType: accType,
      holderName: raw.holderName ?? raw.titular,
      holderId: raw.holderId ?? raw.identificacionTitular,
    }

    const validated = bankAccountSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid data", issues: validated.error.flatten() },
        { status: 400 }
      )
    }

    const account = await prisma.bankAccount.create({
      data: {
        ...validated.data,
        complexId,
      },
    })

    return NextResponse.json(account, { status: 201 })
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (error.message === "FORBIDDEN_REQUIRES_ADMIN") return NextResponse.json({ error: "ADMIN role required" }, { status: 403 })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

// DELETE /api/dashboard/cuentas-bancarias?id=xxx (Deactivates/toggles bank account)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    const targetComplexId = searchParams.get("complexId") || searchParams.get("complejoId") || undefined
    const { complexId, role } = await getCurrentUserAndTenant(targetComplexId)

    assertAdminOnly(role)

    if (!id) {
      return NextResponse.json({ error: "Account ID required" }, { status: 400 })
    }

    const account = await prisma.bankAccount.findUnique({
      where: { id },
    })

    if (!account || account.complexId !== complexId) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    // Toggle active status (soft delete)
    const updated = await prisma.bankAccount.update({
      where: { id },
      data: { isActive: !account.isActive },
    })

    return NextResponse.json({ success: true, account: updated })
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (error.message === "FORBIDDEN_REQUIRES_ADMIN") return NextResponse.json({ error: "ADMIN role required" }, { status: 403 })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
