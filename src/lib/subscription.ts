export type SubscriptionEffectiveStatus =
  | "TRIAL"
  | "GRACE"
  | "ACTIVE"
  | "SUSPENDED"
  | "INACTIVE"

export interface ComplexSubscriptionData {
  subscriptionStatus?: string | null
  trialEndsAt?: Date | string | null
  trialDays?: number | null
  gracePeriodDays?: number | null
  createdAt?: Date | string | null
}

export interface SubscriptionState {
  status: SubscriptionEffectiveStatus
  rawStatus: string
  trialEndsAt: Date | null
  trialDays: number
  gracePeriodDays: number
  daysLeftInTrial: number
  daysLeftInGrace: number
  canWrite: boolean
  isReadOnly: boolean
  message: string
}

/**
 * Computes the real-time dynamic subscription state for a given sports complex.
 */
export function getSubscriptionState(complex: ComplexSubscriptionData): SubscriptionState {
  const rawStatus = (complex.subscriptionStatus || "TRIAL").toUpperCase()
  const trialDays = complex.trialDays ?? 30
  const gracePeriodDays = complex.gracePeriodDays ?? 5

  const now = new Date()

  // Base dates
  let trialEndsAt: Date
  if (complex.trialEndsAt) {
    trialEndsAt = new Date(complex.trialEndsAt)
  } else if (complex.createdAt) {
    const created = new Date(complex.createdAt)
    trialEndsAt = new Date(created.getTime() + trialDays * 24 * 60 * 60 * 1000)
  } else {
    trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000)
  }

  const graceEndsAt = new Date(
    trialEndsAt.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000
  )

  // Direct statuses set by SuperAdmin
  if (rawStatus === "ACTIVE") {
    return {
      status: "ACTIVE",
      rawStatus,
      trialEndsAt,
      trialDays,
      gracePeriodDays,
      daysLeftInTrial: 0,
      daysLeftInGrace: 0,
      canWrite: true,
      isReadOnly: false,
      message: "Suscripción activa y al día",
    }
  }

  if (rawStatus === "INACTIVE") {
    return {
      status: "INACTIVE",
      rawStatus,
      trialEndsAt,
      trialDays,
      gracePeriodDays,
      daysLeftInTrial: 0,
      daysLeftInGrace: 0,
      canWrite: false,
      isReadOnly: true,
      message: "El complejo se encuentra inactivo",
    }
  }

  if (rawStatus === "SUSPENDED") {
    return {
      status: "SUSPENDED",
      rawStatus,
      trialEndsAt,
      trialDays,
      gracePeriodDays,
      daysLeftInTrial: 0,
      daysLeftInGrace: 0,
      canWrite: false,
      isReadOnly: true,
      message: "Suscripción suspendida. Modo solo lectura activado",
    }
  }

  // Dynamic Trial and Grace evaluation
  const msTrialLeft = trialEndsAt.getTime() - now.getTime()
  if (msTrialLeft > 0) {
    const daysLeft = Math.ceil(msTrialLeft / (24 * 60 * 60 * 1000))
    return {
      status: "TRIAL",
      rawStatus,
      trialEndsAt,
      trialDays,
      gracePeriodDays,
      daysLeftInTrial: daysLeft,
      daysLeftInGrace: gracePeriodDays,
      canWrite: true,
      isReadOnly: false,
      message: `Período de prueba gratuito (${daysLeft} días restantes)`,
    }
  }

  const msGraceLeft = graceEndsAt.getTime() - now.getTime()
  if (msGraceLeft > 0) {
    const daysGraceLeft = Math.ceil(msGraceLeft / (24 * 60 * 60 * 1000))
    return {
      status: "GRACE",
      rawStatus,
      trialEndsAt,
      trialDays,
      gracePeriodDays,
      daysLeftInTrial: 0,
      daysLeftInGrace: daysGraceLeft,
      canWrite: true,
      isReadOnly: false,
      message: `Período de gracia (${daysGraceLeft} días restantes para regularizar)`,
    }
  }

  // Trial and grace period both expired -> Soft-Lock (SUSPENDED)
  return {
    status: "SUSPENDED",
    rawStatus,
    trialEndsAt,
    trialDays,
    gracePeriodDays,
    daysLeftInTrial: 0,
    daysLeftInGrace: 0,
    canWrite: false,
    isReadOnly: true,
    message: "Período de prueba y gracia vencidos. Tu cuenta está en modo solo lectura",
  }
}
