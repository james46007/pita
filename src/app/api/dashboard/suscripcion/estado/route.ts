import { NextResponse } from "next/server"
import { getCurrentUserAndTenant } from "@/lib/tenant"
import { prisma } from "@/lib/prisma"
import { getSubscriptionState } from "@/lib/subscription"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const targetComplexId = searchParams.get("complexId") || searchParams.get("complejoId") || undefined
    const { complexId, role } = await getCurrentUserAndTenant(targetComplexId)

    const complex = await prisma.complex.findUnique({
      where: { id: complexId },
      select: {
        id: true,
        name: true,
        slug: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        trialDays: true,
        gracePeriodDays: true,
        createdAt: true,
        isActive: true,
      },
    })

    if (!complex) {
      return NextResponse.json({ error: "Complex not found" }, { status: 404 })
    }

    const state = getSubscriptionState(complex)

    return NextResponse.json({
      complex: {
        id: complex.id,
        name: complex.name,
        slug: complex.slug,
        isActive: complex.isActive,
      },
      subscription: state,
      role,
    })
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error.message === "FORBIDDEN_TENANT_ACCESS") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
    console.error("Error fetching subscription state:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
