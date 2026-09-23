import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST /api/webhooks/whatsapp
// Public webhook endpoint receiving Evolution API connection and status events
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: "Missing payload" }, { status: 400 })
    }

    const { event, instance, data } = body

    if (!instance) {
      return NextResponse.json({ received: true })
    }

    // Match config by instanceName
    const config = await prisma.complexWhatsappConfig.findUnique({
      where: { instanceName: instance },
    })

    if (!config) {
      return NextResponse.json({ received: true, matched: false })
    }

    // Handle connection lifecycle events
    if (event === "connection.update" || event === "CONNECTION_UPDATE") {
      const state = data?.state || body?.state

      if (state === "open") {
        // Extract phone number if provided by Evolution webhook
        const rawSender = body?.sender || data?.sender || ""
        const cleanPhone = rawSender ? rawSender.split("@")[0].replace(/\D/g, "") : null

        await prisma.complexWhatsappConfig.update({
          where: { id: config.id },
          data: {
            status: "CONNECTED",
            ...(cleanPhone ? { phoneNumber: cleanPhone } : {}),
          },
        })
      } else if (state === "close" || state === "refused") {
        await prisma.complexWhatsappConfig.update({
          where: { id: config.id },
          data: {
            status: "DISCONNECTED",
          },
        })
      } else if (state === "connecting") {
        await prisma.complexWhatsappConfig.update({
          where: { id: config.id },
          data: {
            status: "CONNECTING",
          },
        })
      }
    }

    return NextResponse.json({ success: true, eventProcessed: event })
  } catch (error: any) {
    console.error("[WHATSAPP_WEBHOOK_ERROR]", error)
    return NextResponse.json({ error: "Webhook error" }, { status: 500 })
  }
}
