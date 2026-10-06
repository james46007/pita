import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { assertBotAuthorized } from "@/lib/bot-auth"

// GET /api/bot/complejo?instance=...
export async function GET(req: Request) {
  if (!assertBotAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const instanceName = searchParams.get("instance")

  if (!instanceName) {
    return NextResponse.json(
      { error: "Query parameter 'instance' is required" },
      { status: 400 }
    )
  }

  try {
    const config = await prisma.complexWhatsappConfig.findUnique({
      where: { instanceName },
    })

    if (!config) {
      return NextResponse.json(
        { error: `No complex configuration found for instance: ${instanceName}` },
        { status: 404 }
      )
    }

    const complex = await prisma.complex.findUnique({
      where: { id: config.complexId },
      include: {
        courts: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            type: true,
            pricePerHour: true,
          },
        },
        bankAccounts: {
          where: { isActive: true },
          select: {
            id: true,
            bankName: true,
            accountNumber: true,
            accountType: true,
            holderName: true,
          },
        },
      },
    })

    if (!complex) {
      return NextResponse.json(
        { error: `Complex not found` },
        { status: 404 }
      )
    }

    return NextResponse.json({
      instance: instanceName,
      status: config.status,
      isActive: config.isActive,
      complex: {
        id: complex.id,
        name: complex.name,
        slug: complex.slug,
        address: complex.address,
        phone: complex.phone,
        courts: complex.courts,
        bankAccounts: complex.bankAccounts,
      },
    })
  } catch (error: any) {
    console.error("[BOT_COMPLEJO_ERROR]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
