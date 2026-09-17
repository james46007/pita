import { getServerSession } from "next-auth"
import { authOptionsAdmin } from "@/lib/auth"

export interface UserSessionPayload {
  id: string
  name: string
  email: string
  isSuperAdmin: boolean
  complexes: Array<{
    complexId: string
    role: "ADMIN" | "STAFF"
  }>
}

/**
 * Retrieves the authenticated user and validates membership for the target complex.
 */
export async function getCurrentUserAndTenant(targetComplexId?: string) {
  const session = await getServerSession(authOptionsAdmin)
  if (!session?.user) {
    throw new Error("UNAUTHORIZED")
  }

  const user = session.user as unknown as UserSessionPayload

  // SuperAdmin holds global access across any sports complex
  if (user.isSuperAdmin) {
    return {
      user,
      role: "SUPER_ADMIN" as const,
      complexId: targetComplexId || user.complexes?.[0]?.complexId,
    }
  }

  if (!targetComplexId) {
    // If target complex is unspecified, default to the first assigned one
    const firstComplex = user.complexes?.[0]
    if (!firstComplex) {
      throw new Error("NO_COMPLEX_ASSIGNED")
    }
    return {
      user,
      role: firstComplex.role,
      complexId: firstComplex.complexId,
    }
  }

  const membership = user.complexes?.find((c) => c.complexId === targetComplexId)
  if (!membership) {
    throw new Error("FORBIDDEN_TENANT_ACCESS")
  }

  return {
    user,
    role: membership.role,
    complexId: membership.complexId,
  }
}

/**
 * Throws an exception if the user does not possess administrative privileges
 */
export function assertAdminOnly(role: string) {
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    throw new Error("FORBIDDEN_REQUIRES_ADMIN")
  }
}
