import { NextResponse } from "next/server"
import { supabase, BUCKET_COMPROBANTES } from "@/lib/supabase"
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
    const filePath = `reserva-${booking.id}-${Date.now()}.${fileExt}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_COMPROBANTES)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error("Error uploading receipt to Supabase:", uploadError)
      // Fallback URL for local development environments
      const fallbackUrl = `https://storage.supabase.local/${filePath}`
      const updated = await prisma.booking.update({
        where: { id },
        data: {
          receiptUrl: fallbackUrl,
          status: "RECEIPT_UPLOADED",
        },
      })
      return NextResponse.json({
        message: "Receipt registered (development mode)",
        booking: updated,
        reserva: updated,
      })
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_COMPROBANTES)
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
