import { prisma } from "@/lib/prisma"
import { supabase, BUCKET_PAYMENT_RECEIPTS } from "@/lib/supabase"

interface ProcessReceiptParams {
  complexId: string
  customerPhone: string
  customerName: string
  instanceName: string
  messageId?: string | null
  mediaBase64?: string | null
}

interface ProcessReceiptResult {
  success: boolean
  replyText: string
  bookingId?: string
  receiptUrl?: string
}

async function fetchMediaFromEvolution(
  instance: string,
  messageId: string
): Promise<{ buffer: Buffer; mimetype: string } | null> {
  const baseUrl = (process.env.EVOLUTION_API_URL || "https://evolution-api-msng.onrender.com").replace(/\/$/, "")
  const apiKey =
    process.env.EVOLUTION_GLOBAL_KEY ||
    process.env.EVOLUTION_API_KEY ||
    process.env.AUTHENTICATION_API_KEY ||
    ""

  if (!apiKey || !messageId) return null

  try {
    const res = await fetch(`${baseUrl}/chat/getBase64FromMediaMessage/${instance}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify({
        message: {
          key: {
            id: messageId,
          },
        },
        convertToMp4: false,
      }),
    })

    if (!res.ok) {
      console.warn(`[EVOLUTION_MEDIA_FETCH] Status ${res.status} from ${baseUrl}`)
      return null
    }

    const data = await res.json()
    const base64Str = data.base64 || ""
    if (!base64Str) return null

    const cleanBase64 = base64Str.replace(/^data:[^;]+;base64,/, "")
    return {
      buffer: Buffer.from(cleanBase64, "base64"),
      mimetype: data.mimetype || "image/jpeg",
    }
  } catch (err) {
    console.error("[EVOLUTION_FETCH_MEDIA_ERROR]", err)
    return null
  }
}

export async function processCustomerReceipt(
  params: ProcessReceiptParams
): Promise<ProcessReceiptResult> {
  const { complexId, customerPhone, customerName, instanceName, messageId, mediaBase64 } = params

  const digitsOnly = customerPhone.replace(/\D/g, "")
  const tail9 = digitsOnly.slice(-9)
  const tail8 = digitsOnly.slice(-8)

  // 1. Buscar la reserva más reciente pendiente de pago para este teléfono y complejo
  let booking = await prisma.booking.findFirst({
    where: {
      complexId,
      customerPhone: { contains: tail9 || tail8 },
      status: "PAYMENT_PENDING",
    },
    include: {
      court: { select: { name: true } },
      slot: { select: { startTime: true, date: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  if (!booking && tail8 !== tail9) {
    booking = await prisma.booking.findFirst({
      where: {
        complexId,
        customerPhone: { contains: tail8 },
        status: "PAYMENT_PENDING",
      },
      include: {
        court: { select: { name: true } },
        slot: { select: { startTime: true, date: true } },
      },
      orderBy: { createdAt: "desc" },
    })
  }

  if (!booking) {
    return {
      success: false,
      replyText: `¡Gracias ${customerName}! 📄 Hemos recibido tu archivo, pero no encontramos ninguna reserva pendiente de pago para este número. Si deseas reservar una cancha, escribe *menu*.`,
    }
  }

  // 2. Obtener el archivo (desde mediaBase64 provisto o descargándolo de Evolution API)
  let fileBuffer: Buffer | null = null
  let mimetype = "image/jpeg"

  if (mediaBase64 && mediaBase64.length > 50) {
    const clean = mediaBase64.replace(/^data:[^;]+;base64,/, "")
    fileBuffer = Buffer.from(clean, "base64")
  } else if (messageId) {
    const media = await fetchMediaFromEvolution(instanceName, messageId)
    if (media) {
      fileBuffer = media.buffer
      mimetype = media.mimetype
    }
  }

  // Si no pudimos descargar el archivo binario, igual actualizamos el estado para avisar al admin
  let publicUrl: string | null = null

  if (fileBuffer && fileBuffer.length > 0) {
    const ext = mimetype.includes("png") ? "png" : mimetype.includes("pdf") ? "pdf" : "jpg"
    const filePath = `comprobantes/${complexId}/${booking.id}_${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_PAYMENT_RECEIPTS)
      .upload(filePath, fileBuffer, {
        contentType: mimetype,
        upsert: true,
      })

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from(BUCKET_PAYMENT_RECEIPTS)
        .getPublicUrl(filePath)
      publicUrl = urlData.publicUrl
    } else {
      console.error("[SUPABASE_UPLOAD_RECEIPT_ERROR]", uploadError)
    }
  }

  // 3. Actualizar la reserva en la base de datos
  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "RECEIPT_UPLOADED",
      receiptUrl: publicUrl || booking.receiptUrl,
    },
  })

  const courtName = booking.court?.name || "tu cancha"
  const amountStr = booking.totalAmount ? `$${Number(booking.totalAmount).toFixed(2)}` : ""

  return {
    success: true,
    bookingId: updated.id,
    receiptUrl: updated.receiptUrl || undefined,
    replyText: `¡Gracias ${customerName}! 📄 Hemos recibido y registrado tu comprobante de pago${amountStr ? ` por *${amountStr}*` : ""} para *${courtName}*.\n\nTu reserva ha pasado al estado *En revisión* y nuestro equipo la confirmará en breves momentos. ✅`,
  }
}
