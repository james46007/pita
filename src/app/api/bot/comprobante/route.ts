import { NextResponse } from "next/server"
import { supabase, BUCKET_PAYMENT_RECEIPTS } from "@/lib/supabase"
import { prisma } from "@/lib/prisma"
import { assertBotAuthorized } from "@/lib/bot-auth"

// POST /api/bot/comprobante
export async function POST(req: Request) {
  if (!assertBotAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const instance = formData.get("instance") as string | null
    const customerPhone = formData.get("customerPhone") as string | null
    const specificBookingId = formData.get("bookingId") as string | null
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "Archivo comprobante es requerido ('file')" }, { status: 400 })
    }

    if (!instance && !specificBookingId) {
      return NextResponse.json(
        { error: "Se requiere 'instance' o 'bookingId'" },
        { status: 400 }
      )
    }

    let booking: any = null

    if (specificBookingId) {
      booking = await prisma.booking.findUnique({
        where: { id: specificBookingId },
      })
    } else if (instance && customerPhone) {
      // Find complex by instance
      const config = await prisma.complexWhatsappConfig.findUnique({
        where: { instanceName: instance },
        select: { complexId: true },
      })

      if (!config) {
        return NextResponse.json({ error: "Instancia no vinculada a complejo" }, { status: 404 })
      }

      // Find the most recent active unpaid booking for this phone in this complex
      booking = await prisma.booking.findFirst({
        where: {
          complexId: config.complexId,
          customerPhone: { contains: customerPhone.replace(/\D/g, "").slice(-8) },
          status: "PAYMENT_PENDING",
        },
        orderBy: { createdAt: "desc" },
      })
    }

    if (!booking) {
      return NextResponse.json(
        { error: "No se encontró ninguna reserva pendiente de pago para este teléfono o ID" },
        { status: 404 }
      )
    }

    // Validate MIME type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Formato no soportado. Permitidos: JPG, PNG, WEBP, PDF" },
        { status: 422 }
      )
    }

    // Max 5MB
    const MAX_FILE_SIZE = 5 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "El archivo excede el tamaño máximo permitido de 5MB" },
        { status: 422 }
      )
    }

    // Upload to Supabase Storage
    const fileExt = file.name.split(".").pop() || "jpg"
    const timestamp = Date.now()
    const filePath = `comprobantes/${booking.complexId}/${booking.id}_${timestamp}.${fileExt}`

    const fileBuffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_PAYMENT_RECEIPTS)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error("[BOT_COMPROBANTE_UPLOAD_ERROR]", uploadError)
      return NextResponse.json({ error: "Error al almacenar el comprobante" }, { status: 500 })
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_PAYMENT_RECEIPTS)
      .getPublicUrl(filePath)

    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        receiptUrl: publicUrlData.publicUrl,
        status: "RECEIPT_UPLOADED",
      },
    })

    return NextResponse.json({
      success: true,
      bookingId: updatedBooking.id,
      status: updatedBooking.status,
      receiptUrl: updatedBooking.receiptUrl,
      message: "Comprobante registrado y en revisión por el complejo.",
    })
  } catch (error: any) {
    console.error("[BOT_COMPROBANTE_ERROR]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
