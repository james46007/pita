import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { assertBotAuthorized } from "@/lib/bot-auth"

// POST /api/webhooks/whatsapp
// Webhook endpoint receiving Evolution API connection and status events (from n8n or Evolution API)
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

    // Seguridad: verificar autenticación de n8n (PITA_BOT_SECRET_KEY) o apikey de Evolution API
    const isBotAuth = assertBotAuthorized(req)
    const apiKeyHeader = req.headers.get("apikey")
    const isGlobalKey = process.env.EVOLUTION_GLOBAL_KEY && apiKeyHeader === process.env.EVOLUTION_GLOBAL_KEY
    const isInstanceKey = config.instanceApiKey && apiKeyHeader === config.instanceApiKey

    if (!isBotAuth && !isGlobalKey && !isInstanceKey) {
      if (process.env.NODE_ENV === "production" && (process.env.PITA_BOT_SECRET_KEY || process.env.EVOLUTION_GLOBAL_KEY)) {
        console.warn(`[WHATSAPP_WEBHOOK_UNAUTHORIZED] Intento de webhook no autorizado para la instancia: ${instance}`)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
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
