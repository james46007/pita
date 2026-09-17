import { NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUserAndTenant } from "@/lib/tenant"
import { generateSlotsForCourt } from "@/lib/generate-slots"
import { prisma } from "@/lib/prisma"

const generateSlotsSchema = z.object({
  courtId: z.string().min(1, "courtId is required"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD"),
})

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const targetComplexId = searchParams.get("complexId") || searchParams.get("complejoId") || undefined
    const { complexId } = await getCurrentUserAndTenant(targetComplexId)

    const raw = await req.json()
    const body = {
      courtId: raw.courtId ?? raw.canchaId,
      startDate: raw.startDate ?? raw.fechaInicio,
      endDate: raw.endDate ?? raw.fechaFin,
    }

    const validated = generateSlotsSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid parameters", issues: validated.error.flatten() },
        { status: 400 }
      )
    }

    const { courtId, startDate, endDate } = validated.data

    // Verify court belongs to authenticated complex
    const court = await prisma.court.findFirst({
      where: { id: courtId, complexId },
    })

    if (!court) {
      return NextResponse.json({ error: "Court not found in this complex" }, { status: 404 })
    }

    const start = new Date(`${startDate}T00:00:00Z`)
    const end = new Date(`${endDate}T23:59:59Z`)

    const result = await generateSlotsForCourt(courtId, start, end)

    return NextResponse.json({
      message: "Slots generated successfully",
      count: result.count,
    })
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (error.message === "FORBIDDEN_TENANT_ACCESS") return NextResponse.json({ error: "Access denied" }, { status: 403 })
    console.error("Error generating slots:", error)
    return NextResponse.json({ error: "Internal error generating slots" }, { status: 500 })
  }
}
