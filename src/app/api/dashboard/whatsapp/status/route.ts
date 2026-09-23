import { NextResponse } from "next/server"
import { getCurrentUserAndTenant } from "@/lib/tenant"
import { prisma } from "@/lib/prisma"
import { EvolutionApiClient } from "@/lib/whatsapp/evolution"

// GET /api/dashboard/whatsapp/status (ADMIN and STAFF)
// Inspects current WhatsApp connection state and delivery metrics
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const targetComplexId = searchParams.get("complexId") || undefined
    const { complexId, role } = await getCurrentUserAndTenant(targetComplexId)

    let config = await prisma.complexWhatsappConfig.findUnique({
      where: { complexId },
    })

    // If config exists and status is CONNECTING, check Evolution API to auto-sync if connected
    if (config && config.status === "CONNECTING") {
      const stateResult = await EvolutionApiClient.getConnectionState(config.instanceName)
      if (stateResult.state === "open") {
        config = await prisma.complexWhatsappConfig.update({
          where: { complexId },
          data: { status: "CONNECTED" },
        })
      } else if (stateResult.state === "close") {
        config = await prisma.complexWhatsappConfig.update({
          where: { complexId },
          data: { status: "DISCONNECTED" },
        })
      }
    }

    // Outbound metrics
    const [pendingCount, sentCount, failedCount, recentMessages] = await Promise.all([
      prisma.whatsappOutboundMessage.count({
        where: { complexId, status: "PENDING" },
      }),
      prisma.whatsappOutboundMessage.count({
        where: { complexId, status: "SENT" },
      }),
      prisma.whatsappOutboundMessage.count({
        where: { complexId, status: "FAILED_PERMANENT" },
      }),
      prisma.whatsappOutboundMessage.findMany({
        where: { complexId },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          booking: {
            select: {
              id: true,
              customerName: true,
              totalAmount: true,
              court: { select: { name: true } },
              slot: { select: { date: true, startTime: true, endTime: true } },
            },
          },
        },
      }),
    ])

    return NextResponse.json({
      config: config
        ? {
            id: config.id,
            instanceName: config.instanceName,
            status: config.status,
            phoneNumber: config.phoneNumber,
            profileName: config.profileName,
            isActive: config.isActive,
            customMessage: config.customMessage,
            updatedAt: config.updatedAt,
          }
        : null,
      userRole: role,
      metrics: {
        pending: pendingCount,
        sent: sentCount,
        failed: failedCount,
      },
      recentMessages,
    })
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (error.message === "FORBIDDEN_TENANT_ACCESS") return NextResponse.json({ error: "Access denied" }, { status: 403 })
    console.error("[WHATSAPP_STATUS_ERROR]", error)
    return NextResponse.json({ error: "Internal error checking WhatsApp status" }, { status: 500 })
  }
}
