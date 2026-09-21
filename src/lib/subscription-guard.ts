import { prisma } from "@/lib/prisma"
import { getSubscriptionState, SubscriptionState } from "./subscription"

export class SubscriptionExpiredError extends Error {
  subscriptionState: SubscriptionState

  constructor(subscriptionState: SubscriptionState) {
    super(subscriptionState.message)
    this.name = "SubscriptionExpiredError"
    this.subscriptionState = subscriptionState
  }
}

/**
 * Checks whether the specified sports complex is permitted to execute write operations.
 * Throws a SubscriptionExpiredError if the complex is in read-only mode (SUSPENDED or INACTIVE).
 */
export async function assertSubscriptionWriteAccess(complexId: string): Promise<SubscriptionState> {
  const complex = await prisma.complex.findUnique({
    where: { id: complexId },
    select: {
      id: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      trialDays: true,
      gracePeriodDays: true,
      createdAt: true,
      isActive: true,
    },
  })

  if (!complex) {
    throw new Error("COMPLEX_NOT_FOUND")
  }

  const state = getSubscriptionState(complex)

  if (!state.canWrite || !complex.isActive) {
    throw new SubscriptionExpiredError(state)
  }

  return state
}
