import { NextResponse } from "next/server"
import { supabase, BUCKET_PAYMENT_RECEIPTS } from "@/lib/supabase"
import { prisma } from "@/lib/prisma"

// POST /api/reservas/[id]/comprobante
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const booking = await prisma.booking.findUnique({
      where: { id },
    })

    if (!booking) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 })
    }

    if (booking.status === "CANCELLED") {
      return NextResponse.json({ error: "Reservation was previously cancelled" }, { status: 400 })
    }

    // Check if reservation has expired due to payment timeout
    if (booking.status === "PAYMENT_PENDING" && booking.expiresAt && new Date() > booking.expiresAt) {
      await prisma.$transaction(async (tx) => {
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: "CANCELLED",
            notes: "Expired automatically: payment receipt timeout exceeded",
          },
        })
        await tx.slot.update({
          where: { id: booking.slotId },
          data: { status: "AVAILABLE" },
        })
      })

      return NextResponse.json(
        { error: "The payment time limit has expired and the court slot has been released." },
        { status: 410 }
      )
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "Attached file required" }, { status: 400 })
    }

    // Validate file MIME type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported format. Allowed: JPG, PNG, WEBP, PDF" },
        { status: 422 }
      )
    }

    // Validate maximum file size: 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size cannot exceed 5MB" }, { status: 422 })
    }

    // Upload to Supabase Storage
    const fileExt = file.name.split(".").pop()
    const filePath = `payment-receipt-${booking.id}-${Date.now()}.${fileExt}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_PAYMENT_RECEIPTS)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error("Error uploading receipt to Supabase:", uploadError)

      return NextResponse.json(
        {
          error: "Failed to upload receipt",
          details: uploadError.message,
        },
        { status: 500 }
      )
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_PAYMENT_RECEIPTS)
      .getPublicUrl(filePath)

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        receiptUrl: publicUrlData.publicUrl,
        status: "RECEIPT_UPLOADED",
      },
    })

    return NextResponse.json({
      message: "Receipt uploaded successfully",
      booking: updatedBooking,
      reserva: updatedBooking,
    })
  } catch (error) {
    console.error("Error processing receipt upload:", error)
    return NextResponse.json({ error: "Internal error uploading receipt" }, { status: 500 })
  }
}
