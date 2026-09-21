import { NextResponse } from "next/server"
import { getCurrentUserAndTenant } from "@/lib/tenant"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const targetComplexId = searchParams.get("complexId") || searchParams.get("complejoId") || undefined
    const { complexId } = await getCurrentUserAndTenant(targetComplexId)

    if (!complexId) {
      return NextResponse.json({
        isComplete: true,
        currentStep: 4,
        percent: 100,
        counts: { courts: 0, schedules: 0, slots: 0 },
        steps: [],
      })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [courtsCount, schedulesCount, slotsCount] = await Promise.all([
      prisma.court.count({
        where: { complexId, isActive: true },
      }),
      prisma.availableSchedule.count({
        where: { court: { complexId }, isActive: true },
      }),
      prisma.slot.count({
        where: { court: { complexId }, date: { gte: today } },
      }),
    ])

    const step1Done = courtsCount > 0
    const step2Done = schedulesCount > 0
    const step3Done = slotsCount > 0

    const completedSteps = (step1Done ? 1 : 0) + (step2Done ? 1 : 0) + (step3Done ? 1 : 0)
    const isComplete = step1Done && step2Done && step3Done
    const currentStep = isComplete ? 4 : !step1Done ? 1 : !step2Done ? 2 : 3
    const percent = Math.round((completedSteps / 3) * 100)

    return NextResponse.json({
      isComplete,
      currentStep,
      percent,
      counts: {
        courts: courtsCount,
        schedules: schedulesCount,
        slots: slotsCount,
      },
      steps: [
        {
          id: 1,
          title: "Crea tu primera cancha",
          description: "Registra las canchas de pádel, fútbol o tenis de tu complejo.",
          href: "/dashboard/canchas",
          completed: step1Done,
        },
        {
          id: 2,
          title: "Configura los horarios",
          description: "Define las franjas horarias y días de atención de cada cancha.",
          href: "/dashboard/horarios",
          completed: step2Done,
        },
        {
          id: 3,
          title: "Genera los primeros turnos",
          description: "Crea los slots para que tus clientes puedan reservar desde hoy.",
          href: "/dashboard/slots",
          completed: step3Done,
        },
      ],
    })
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error.message === "FORBIDDEN_TENANT_ACCESS" || error.message === "NO_COMPLEX_ASSIGNED") {
      return NextResponse.json({ error: "Forbidden: Access denied to this complex" }, { status: 403 })
    }
    console.error("Error fetching onboarding status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
