import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { assertBotAuthorized } from "@/lib/bot-auth"
import { buildMenu, resolveMenuInput } from "@/lib/bot/menu"
import { runAgent, type GeminiContent } from "@/lib/bot/llm"
import { processCustomerReceipt } from "@/lib/bot/receipt"

const HISTORY_LIMIT = 30
const MEMORY_TTL_MS = 12 * 60 * 60 * 1000 // conversation context expires after 12h of inactivity

const chatSchema = z.object({
  instance: z.string().min(1),
  phone: z.string().min(5),
  pushName: z.string().optional(),
  text: z.string().optional().default(""),
  listRowId: z.string().optional().nullable(),
  isImage: z.boolean().optional().default(false),
  messageId: z.string().optional().nullable(),
  mediaBase64: z.string().optional().nullable(),
})


const isPlainUserText = (c: GeminiContent) =>
  c.role === "user" && c.parts.some((p) => typeof p.text === "string") && !c.parts.some((p) => p.functionResponse)

/** Drops leading turns so history always starts on a user text turn (keeps function call/response pairs intact). */
function trimHistory(history: GeminiContent[]): GeminiContent[] {
  const start = history.findIndex(isPlainUserText)
  return start === -1 ? [] : history.slice(start)
}

export const maxDuration = 60

// POST /api/bot/chat
export async function POST(req: Request) {
  if (!assertBotAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = chatSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.flatten() }, { status: 400 })
  }
  const { instance, listRowId, isImage } = parsed.data
  const text = parsed.data.text.trim()
  const phone = parsed.data.phone.replace(/\D/g, "")
  const customerName = (parsed.data.pushName || "Jugador").slice(0, 60)

  try {
    const config = await prisma.complexWhatsappConfig.findUnique({
      where: { instanceName: instance },
      include: {
        complex: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true,
            bankAccounts: {
              where: { isActive: true },
              select: {
                bankName: true,
                accountNumber: true,
                accountType: true,
                holderName: true,
                holderId: true,
              },
            },
          },
        },
      },
    })
    if (!config) {
      return NextResponse.json({ error: `No complex found for instance: ${instance}` }, { status: 404 })
    }
    const complex = config.complex

    const conversation = await prisma.botConversation.upsert({
      where: { complexId_customerPhone: { complexId: complex.id, customerPhone: phone } },
      create: { complexId: complex.id, customerPhone: phone, customerName },
      update: { customerName, lastMessageAt: new Date() },
    })

    const save = (role: "USER" | "MODEL", content: string, parts: unknown) =>
      prisma.botMessage.create({ data: { conversationId: conversation.id, role, content, parts: parts as any } })

    // ---- Deterministic paths (no LLM cost) ----
    const menuInput = resolveMenuInput(text, listRowId)

    if (menuInput.kind === "menu") {
      const menu = buildMenu(complex.name, customerName)
      await save("USER", text, [{ text }])
      await save("MODEL", menu.replyText, [{ text: menu.replyText }])
      return NextResponse.json({ shouldReply: true, replyText: menu.replyText, interactive: menu.interactive })
    }

    if (menuInput.kind === "cuentas") {
      let reply = `💳 *Cuentas bancarias para transferencias - ${complex.name}*\n\n`
      if (complex.bankAccounts.length === 0) {
        reply += `Por favor comunícate a recepción al *${complex.phone}* para solicitar los datos de pago actualizados.`
      } else {
        reply += complex.bankAccounts
          .map((b) => {
            const lines = [
              `🏦 *${b.bankName}* (${b.accountType === "SAVINGS" ? "Ahorros" : "Corriente"})`,
              `• N°: *${b.accountNumber}*`,
              `• Titular: ${b.holderName}`,
            ]
            if (b.holderId) lines.push(`• CI/RUC: ${b.holderId}`)
            return lines.join("\n")
          })
          .join("\n\n")
        reply += `\n\n📸 *Una vez hecha la transferencia, envía la foto o captura del comprobante por este chat para validar tu reserva.*`
      }
      await save("USER", text || "[cuentas bancarias]", [{ text: text || "Cuentas bancarias" }])
      await save("MODEL", reply, [{ text: reply }])
      return NextResponse.json({ shouldReply: true, replyText: reply, interactive: null })
    }

    if (menuInput.kind === "info") {
      const reply =
        `📍 *Ubicación y Contacto - ${complex.name}*\n\n` +
        `🏢 *Dirección:* ${complex.address || "Consultar con administración"}\n` +
        `📞 *Teléfono / Recepción:* ${complex.phone}\n\n` +
        `Si necesitas asistencia de nuestro personal o consultar por torneos/eventos, te atenderemos en ese número.`
      await save("USER", text || "[ubicacion y contacto]", [{ text: text || "Ubicación y contacto" }])
      await save("MODEL", reply, [{ text: reply }])
      return NextResponse.json({ shouldReply: true, replyText: reply, interactive: null })
    }

    if (isImage) {
      const receiptResult = await processCustomerReceipt({
        complexId: complex.id,
        customerPhone: phone,
        customerName,
        instanceName: instance,
        messageId: parsed.data.messageId,
        mediaBase64: parsed.data.mediaBase64,
      })

      await save("USER", "[comprobante de pago]", [{ text: "[El cliente envió un comprobante de pago]" }])
      await save("MODEL", receiptResult.replyText, [{ text: receiptResult.replyText }])
      return NextResponse.json({ shouldReply: true, replyText: receiptResult.replyText, interactive: null })
    }

    if (!text && menuInput.kind === "none") {
      return NextResponse.json({ shouldReply: false, replyText: null, interactive: null })
    }


    // ---- LLM path with persisted memory ----
    const userText = menuInput.kind === "intent" ? menuInput.text : text

    const stored = await prisma.botMessage.findMany({
      where: { conversationId: conversation.id, createdAt: { gte: new Date(Date.now() - MEMORY_TTL_MS) } },
      orderBy: { createdAt: "desc" },
      take: HISTORY_LIMIT,
    })
    const history = trimHistory(
      stored.reverse().map((m) => ({
        role: m.role === "USER" ? "user" : "model",
        parts: m.parts as any[],
      })) as GeminiContent[]
    )

    let result
    try {
      result = await runAgent({
        history,
        userText,
        complexName: complex.name,
        ctx: { complexId: complex.id, customerPhone: phone, customerName },
      })
    } catch (err: any) {
      console.error("[BOT_CHAT_LLM_ERROR]", err)
      return NextResponse.json({
        shouldReply: true,
        replyText: "Disculpa, tuvimos un inconveniente técnico temporal con nuestro servicio de reservas. Por favor intenta nuevamente o escribe *menu*.",
        interactive: null,
        errorDetail: err?.message || String(err),
      })
    }



    if (!result.shouldReply || !result.replyText) {
      // Mensaje ajeno a reservas: silencio total para no interferir
      return NextResponse.json({ shouldReply: false, replyText: null, interactive: null })
    }

    // Persist every turn (including tool calls) so the model remembers slot IDs, bookings, etc.
    for (const turn of result.newTurns) {
      const plain = turn.parts.map((p) => (typeof p.text === "string" ? p.text : "")).join("").trim()
      await save(turn.role === "user" ? "USER" : "MODEL", plain, turn.parts)
    }

    return NextResponse.json({ shouldReply: true, replyText: result.replyText, interactive: null })
  } catch (error) {
    console.error("[BOT_CHAT_ERROR]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// GET /api/bot/chat - Diagnóstico de configuración
export async function GET(req: Request) {

  const { searchParams } = new URL(req.url)
  const testGemini = searchParams.get("test") === "true"
  const apiKey = process.env.GEMINI_API_KEY
  const envModel = process.env.GEMINI_MODEL
  const model = (!envModel || envModel.includes("2.5") || envModel.includes("1.5")) ? "gemini-3.8-flash" : envModel

  const status = {
    status: "ok",
    geminiKeyConfigured: !!apiKey,
    geminiKeyLength: apiKey ? apiKey.length : 0,
    geminiModel: model,
    botTimezone: process.env.BOT_TIMEZONE || "America/Guayaquil",
    botSecretConfigured: !!process.env.PITA_BOT_SECRET_KEY,
  }

  if (searchParams.get("listModels") === "true" && apiKey) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
      const data = await res.json()
      const names = (data.models || []).map((m: any) => m.name.replace("models/", ""))
      return NextResponse.json({ ...status, availableModels: names })
    } catch (e: any) {
      return NextResponse.json({ ...status, error: e.message })
    }
  }

  if (testGemini && apiKey) {
    const candidates = [model, "gemini-flash-latest", "gemini-2.5-pro", "gemini-pro-latest"]
    const candidateErrors: Record<string, any> = {}
    for (const m of candidates) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: "Responde solo con la palabra: OK" }] }],
            }),
          }
        )
        const data = await res.json()
        if (res.ok) {
          return NextResponse.json({ ...status, testedModel: m, geminiPingOk: true, geminiData: data })
        }
        candidateErrors[m] = { status: res.status, error: data?.error?.message || data }
      } catch (e: any) {
        candidateErrors[m] = { error: e.message }
      }
    }
    return NextResponse.json({ ...status, geminiPingOk: false, candidateErrors })
  }



  return NextResponse.json(status)
}


