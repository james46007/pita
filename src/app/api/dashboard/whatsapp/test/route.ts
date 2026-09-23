import { NextResponse } from "next/server"
import { getCurrentUserAndTenant, assertAdminOnly } from "@/lib/tenant"
import { prisma } from "@/lib/prisma"
import { EvolutionApiClient } from "@/lib/whatsapp/evolution"
import { normalizePhoneToE164 } from "@/lib/whatsapp/phone"

// POST /api/dashboard/whatsapp/test (ADMIN only)
// Sends an immediate test WhatsApp notification to verify active connectivity
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const targetComplexId = searchParams.get("complexId") || undefined
    const { complexId, role } = await getCurrentUserAndTenant(targetComplexId)

    assertAdminOnly(role)

    const body = await req.json().catch(() => ({}))
    const rawPhone = body?.toPhone || ""

    const phoneValidation = normalizePhoneToE164(rawPhone)
    if (!phoneValidation.isValid) {
      return NextResponse.json(
        { error: phoneValidation.error || "Invalid phone number format" },
        { status: 400 }
      )
    }

    const config = await prisma.complexWhatsappConfig.findUnique({
      where: { complexId },
      include: { complex: true },
    })

    if (!config || config.status !== "CONNECTED") {
      return NextResponse.json(
        { error: "WhatsApp instance is not currently connected. Please scan the QR code first." },
        { status: 400 }
      )
    }

    const testText =
      body?.message ||
      `🎾 ¡Mensaje de prueba exitoso desde ${config.complex.name}!\n\nTu conexión de WhatsApp con la plataforma Pita está funcionando correctamente. ✅`

    const sendResult = await EvolutionApiClient.sendTextMessage(
      config.instanceName,
      phoneValidation.formattedPhone,
      testText
    )

    if (!sendResult.success) {
      return NextResponse.json(
        { error: sendResult.error || "Evolution API could not deliver the test message" },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Test message dispatched to +${phoneValidation.formattedPhone}`,
      messageId: sendResult.messageId,
    })
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (error.message === "FORBIDDEN_TENANT_ACCESS" || error.message === "FORBIDDEN_REQUIRES_ADMIN") {
      return NextResponse.json({ error: "Access denied: Administrator role required" }, { status: 403 })
    }
    console.error("[WHATSAPP_TEST_ERROR]", error)
    return NextResponse.json({ error: "Failed to send test message" }, { status: 500 })
  }
}
