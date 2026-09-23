import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { assertCronAuthorized } from "@/lib/cron-auth"
import { EvolutionApiClient } from "@/lib/whatsapp/evolution"

// GET /api/cron/whatsapp-queue
// Protected cron worker: dispatches 1 message per invocation, applies exponential backoff,
// and issues a keep-alive ping to Render to prevent container hibernation.
export async function GET(req: Request) {
  if (!assertCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized: Invalid cron secret" }, { status: 401 })
  }

  // 1. Keep-alive ping to Evolution API on Render (fire-and-forget)
  EvolutionApiClient.pingKeepAlive().catch(() => {})

  try {
    const now = new Date()

    // 2. Query oldest pending outbound message eligible for delivery
    const message = await prisma.whatsappOutboundMessage.findFirst({
      where: {
        status: "PENDING",
        nextRetryAt: { lte: now },
        attempts: { lt: 3 },
      },
      include: {
        complex: {
          include: {
            whatsappConfig: true,
          },
        },
        booking: {
          include: {
            slot: true,
          },
        },
      },
      orderBy: { nextRetryAt: "asc" },
    })

    if (!message) {
      return NextResponse.json({
        processed: 0,
        message: "No pending messages ready for dispatch",
        timestamp: now.toISOString(),
      })
    }

    // 3. Expiration Check: if booking slot has already passed, expire message
    if (message.booking?.slot) {
      const slotDateIso = new Date(message.booking.slot.date).toISOString().split("T")[0]
      const [h, m] = message.booking.slot.startTime.split(":").map(Number)
      const slotStartTime = new Date(`${slotDateIso}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`)

      if (slotStartTime < now) {
        await prisma.whatsappOutboundMessage.update({
          where: { id: message.id },
          data: {
            status: "EXPIRED",
            lastError: "Booking scheduled slot time has already passed",
          },
        })
        return NextResponse.json({
          processed: 1,
          messageId: message.id,
          status: "EXPIRED",
        })
      }
    }

    // 4. Subscription check: if complex subscription is suspended, pause without consuming attempts
    const subStatus = message.complex.subscriptionStatus
    if (subStatus === "SUSPENDED" || subStatus === "INACTIVE" || !message.complex.isActive) {
      await prisma.whatsappOutboundMessage.update({
        where: { id: message.id },
        data: {
          nextRetryAt: new Date(now.getTime() + 60 * 60 * 1000), // Pause 1 hour
          lastError: `Complex subscription inactive (${subStatus})`,
        },
      })
      return NextResponse.json({
        processed: 1,
        messageId: message.id,
        status: "PAUSED_SUBSCRIPTION",
      })
    }

    // 5. Connection check: if complex WhatsApp is not connected, pause without consuming attempts
    const whatsappConfig = message.complex.whatsappConfig
    if (!whatsappConfig || whatsappConfig.status !== "CONNECTED" || !whatsappConfig.isActive) {
      await prisma.whatsappOutboundMessage.update({
        where: { id: message.id },
        data: {
          nextRetryAt: new Date(now.getTime() + 60 * 60 * 1000), // Pause 1 hour
          lastError: "WhatsApp instance not connected or inactive",
        },
      })
      return NextResponse.json({
        processed: 1,
        messageId: message.id,
        status: "PAUSED_DISCONNECTED",
      })
    }

    const instanceName = whatsappConfig.instanceName

    // 6. Recipient number validation on WhatsApp
    const numberCheck = await EvolutionApiClient.checkNumberExists(instanceName, message.toPhone)
    if (!numberCheck.exists) {
      await prisma.whatsappOutboundMessage.update({
        where: { id: message.id },
        data: {
          status: "FAILED_PERMANENT",
          lastError: "Recipient number is not registered on WhatsApp",
        },
      })
      return NextResponse.json({
        processed: 1,
        messageId: message.id,
        status: "FAILED_NOT_REGISTERED",
      })
    }

    // 7. Dispatch message via Evolution API
    const sendResult = await EvolutionApiClient.sendTextMessage(
      instanceName,
      message.toPhone,
      message.messageBody
    )

    if (sendResult.success) {
      await prisma.whatsappOutboundMessage.update({
        where: { id: message.id },
        data: {
          status: "SENT",
          sentAt: now,
          lastError: null,
        },
      })
      return NextResponse.json({
        processed: 1,
        messageId: message.id,
        status: "SENT",
        externalId: sendResult.messageId,
      })
    }

    // 8. Delivery failed: calculate exponential backoff
    const nextAttempts = message.attempts + 1
    const isPermanentFailure = nextAttempts >= 3

    // Backoff intervals: Attempt 1 = 2 min, Attempt 2 = 8 min, Attempt 3 = 30 min
    const backoffMinutes = nextAttempts === 1 ? 2 : nextAttempts === 2 ? 8 : 30
    const nextRetryAt = new Date(now.getTime() + backoffMinutes * 60 * 1000)

    await prisma.whatsappOutboundMessage.update({
      where: { id: message.id },
      data: {
        attempts: nextAttempts,
        status: isPermanentFailure ? "FAILED_PERMANENT" : "PENDING",
        nextRetryAt: isPermanentFailure ? now : nextRetryAt,
        lastError: sendResult.error || "Evolution API dispatch error",
      },
    })

    return NextResponse.json({
      processed: 1,
      messageId: message.id,
      status: isPermanentFailure ? "FAILED_PERMANENT" : "RETRY_SCHEDULED",
      attempts: nextAttempts,
      nextRetryAt: isPermanentFailure ? null : nextRetryAt.toISOString(),
      error: sendResult.error,
    })
  } catch (error: any) {
    console.error("[CRON_WHATSAPP_QUEUE_ERROR]", error)
    return NextResponse.json({ error: "Internal cron worker error" }, { status: 500 })
  }
}
