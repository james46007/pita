import { NextResponse } from "next/server"
import { getCurrentUserAndTenant, assertAdminOnly } from "@/lib/tenant"
import { prisma } from "@/lib/prisma"
import { EvolutionApiClient } from "@/lib/whatsapp/evolution"

// POST /api/dashboard/whatsapp/instance (ADMIN only)
// Creates or reconnects the WhatsApp instance and returns the QR code
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const targetComplexId = searchParams.get("complexId") || undefined
    const { complexId, role } = await getCurrentUserAndTenant(targetComplexId)

    assertAdminOnly(role)

    const instanceName = EvolutionApiClient.getInstanceName(complexId)

    // 1. Ensure instance exists in Evolution API
    const createResult = await EvolutionApiClient.createInstance(instanceName)
    if (!createResult.success) {
      return NextResponse.json(
        { error: createResult.error || "Failed to initialize WhatsApp instance" },
        { status: 502 }
      )
    }

    // 2. Fetch connection QR code
    const qrResult = await EvolutionApiClient.getQrCode(instanceName)

    // 3. Upsert complex WhatsApp configuration
    await prisma.complexWhatsappConfig.upsert({
      where: { complexId },
      create: {
        complexId,
        instanceName,
        status: "CONNECTING",
      },
      update: {
        instanceName,
        status: "CONNECTING",
      },
    })

    return NextResponse.json({
      success: true,
      instanceName,
      qr: qrResult.data || null,
      message: "WhatsApp instance ready for pairing",
    })
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (error.message === "FORBIDDEN_TENANT_ACCESS" || error.message === "FORBIDDEN_REQUIRES_ADMIN") {
      return NextResponse.json({ error: "Access denied: Administrator role required" }, { status: 403 })
    }
    console.error("[WHATSAPP_INSTANCE_POST_ERROR]", error)
    return NextResponse.json({ error: "Internal error managing WhatsApp instance" }, { status: 500 })
  }
}

// DELETE /api/dashboard/whatsapp/instance (ADMIN only)
// Disconnects and logs out the active WhatsApp session
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const targetComplexId = searchParams.get("complexId") || undefined
    const { complexId, role } = await getCurrentUserAndTenant(targetComplexId)

    assertAdminOnly(role)

    const config = await prisma.complexWhatsappConfig.findUnique({
      where: { complexId },
    })

    if (config) {
      await EvolutionApiClient.logoutInstance(config.instanceName).catch(() => {})

      await prisma.complexWhatsappConfig.update({
        where: { complexId },
        data: {
          status: "DISCONNECTED",
          phoneNumber: null,
          profileName: null,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: "WhatsApp disconnected successfully",
    })
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (error.message === "FORBIDDEN_TENANT_ACCESS" || error.message === "FORBIDDEN_REQUIRES_ADMIN") {
      return NextResponse.json({ error: "Access denied: Administrator role required" }, { status: 403 })
    }
    console.error("[WHATSAPP_INSTANCE_DELETE_ERROR]", error)
    return NextResponse.json({ error: "Internal error disconnecting WhatsApp" }, { status: 500 })
  }
}
