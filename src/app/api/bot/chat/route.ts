import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { assertBotAuthorized } from "@/lib/bot-auth"
import { buildMenu, resolveMenuInput } from "@/lib/bot/menu"
import { runAgent, type GeminiContent } from "@/lib/bot/llm"

const HISTORY_LIMIT = 30
const MEMORY_TTL_MS = 12 * 60 * 60 * 1000 // conversation context expires after 12h of inactivity

const chatSchema = z.object({
  instance: z.string().min(1),
  phone: z.string().min(5),
  pushName: z.string().optional(),
  text: z.string().optional().default(""),
  listRowId: z.string().optional().nullable(),
  isImage: z.boolean().optional().default(false),
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
      return NextResponse.json({ replyText: menu.replyText, interactive: menu.interactive })
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
      return NextResponse.json({ replyText: reply, interactive: null })
    }

    if (menuInput.kind === "info") {
      const reply =
        `📍 *Ubicación y Contacto - ${complex.name}*\n\n` +
        `🏢 *Dirección:* ${complex.address || "Consultar con administración"}\n` +
        `📞 *Teléfono / Recepción:* ${complex.phone}\n\n` +
        `Si necesitas asistencia de nuestro personal o consultar por torneos/eventos, te atenderemos en ese número.`
      await save("USER", text || "[ubicacion y contacto]", [{ text: text || "Ubicación y contacto" }])
      await save("MODEL", reply, [{ text: reply }])
      return NextResponse.json({ replyText: reply, interactive: null })
    }

    if (isImage) {
      // TODO: download media from Evolution and forward to /api/bot/comprobante.
      const reply = `¡Gracias ${customerName}! 📄 Recibimos tu archivo. Si es tu comprobante de pago, nuestro equipo lo verificará y te confirmará la reserva.`
      await save("USER", "[imagen]", [{ text: "[El cliente envió una imagen/comprobante]" }])
      await save("MODEL", reply, [{ text: reply }])
      return NextResponse.json({ replyText: reply, interactive: null })
    }

    if (!text && menuInput.kind === "none") {
      const menu = buildMenu(complex.name, customerName)
      return NextResponse.json({ replyText: menu.replyText, interactive: menu.interactive })
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
    } catch (err) {
      console.error("[BOT_CHAT_LLM_ERROR]", err)
      const reply = "Disculpa, tuve un problema técnico. Escribe *menu* para ver las opciones o inténtalo de nuevo en un momento."
      return NextResponse.json({ replyText: reply, interactive: null })
    }

    // Persist every turn (including tool calls) so the model remembers slot IDs, bookings, etc.
    for (const turn of result.newTurns) {
      const plain = turn.parts.map((p) => (typeof p.text === "string" ? p.text : "")).join("").trim()
      await save(turn.role === "user" ? "USER" : "MODEL", plain, turn.parts)
    }

    return NextResponse.json({ replyText: result.replyText, interactive: null })
  } catch (error) {
    console.error("[BOT_CHAT_ERROR]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
