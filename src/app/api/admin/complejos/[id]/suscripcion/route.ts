import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptionsAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { SubscriptionStatus } from "@prisma/client"
import { getSubscriptionState } from "@/lib/subscription"

const updateSubscriptionSchema = z.object({
  status: z.enum(["TRIAL", "GRACE", "ACTIVE", "SUSPENDED", "INACTIVE"]).optional(),
  extendDays: z.number().int().optional(),
  trialEndsAt: z.string().optional().nullable(),
  trialDays: z.number().int().min(1).optional(),
  gracePeriodDays: z.number().int().min(0).optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptionsAdmin)
    const user = session?.user as any

    if (!user || !user.isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized. Requires SuperAdmin" }, { status: 403 })
    }

    const { id } = await params
    const raw = await req.json()
    const validated = updateSubscriptionSchema.safeParse(raw)

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid data", issues: validated.error.flatten() },
        { status: 400 }
      )
    }

    const existing = await prisma.complex.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: "Complex not found" }, { status: 404 })
    }

    const { status, extendDays, trialEndsAt, trialDays, gracePeriodDays } = validated.data

    const updateData: {
      subscriptionStatus?: SubscriptionStatus
      trialEndsAt?: Date | null
      trialDays?: number
      gracePeriodDays?: number
    } = {}

    if (status) {
      updateData.subscriptionStatus = status as SubscriptionStatus
    }

    if (trialDays !== undefined) {
      updateData.trialDays = trialDays
    }

    if (gracePeriodDays !== undefined) {
      updateData.gracePeriodDays = gracePeriodDays
    }

    if (extendDays !== undefined && extendDays > 0) {
      const now = new Date()
      const baseDate = existing.trialEndsAt && existing.trialEndsAt > now ? existing.trialEndsAt : now
      updateData.trialEndsAt = new Date(baseDate.getTime() + extendDays * 24 * 60 * 60 * 1000)
      // When extending trial, also ensure status is set to TRIAL
      if (!status) {
        updateData.subscriptionStatus = SubscriptionStatus.TRIAL
      }
    } else if (trialEndsAt !== undefined) {
      updateData.trialEndsAt = trialEndsAt ? new Date(trialEndsAt) : null
    }

    const updated = await prisma.complex.update({
      where: { id },
      data: updateData,
    })

    const subscriptionState = getSubscriptionState(updated)

    return NextResponse.json({
      message: "Subscription updated successfully",
      complex: updated,
      subscription: subscriptionState,
    })
  } catch (error) {
    console.error("Error updating subscription:", error)
    return NextResponse.json({ error: "Internal error updating subscription" }, { status: 500 })
  }
}
