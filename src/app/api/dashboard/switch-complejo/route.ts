import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptionsAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { UserSessionPayload } from "@/lib/tenant"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptionsAdmin)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = session.user as unknown as UserSessionPayload
    const body = await req.json().catch(() => ({}))
    const { complexId } = body

    if (!complexId || typeof complexId !== "string") {
      return NextResponse.json({ error: "complexId is required" }, { status: 400 })
    }

    // Verify existence of complex
    const complex = await prisma.complex.findUnique({
      where: { id: complexId },
      select: { id: true, name: true },
    })

    if (!complex) {
      return NextResponse.json({ error: "Complex not found" }, { status: 404 })
    }

    // Authorization check
    if (!user.isSuperAdmin) {
      const hasAccess = user.complexes?.some((c) => c.complexId === complexId)
      if (!hasAccess) {
        return NextResponse.json(
          { error: "Forbidden: You do not have access to this complex" },
          { status: 403 }
        )
      }
    }

    const res = NextResponse.json({
      success: true,
      complexId: complex.id,
      complexName: complex.name,
    })

    // Persist active complex in HTTP-only cookie
    res.cookies.set("active-complex-id", complex.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })

    return res
  } catch (error) {
    console.error("Error switching complex:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
