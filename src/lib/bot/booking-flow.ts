import { prisma } from "@/lib/prisma"
import { cleanupExpiredBookings } from "@/lib/booking-expiration"
import { runTool } from "./tools"
import { buildMenu, type BotInteractiveList } from "./menu"

/**
 * Guided booking flow that never calls the LLM.
 *
 * State is carried by the WhatsApp list rowIds themselves (day_*, slot_*, book_*, more_*),
 * so it is stateless and safe on serverless. If the client cannot render lists (or the
 * customer types instead of tapping), the typed fallbacks below resolve the same steps
 * using markers present in the last bot message.
 */

const DAYS_AHEAD = 7 // today + next 6 days
const PAGE_SIZE = 9 // WhatsApp lists allow max 10 rows (9 + "ver más")

export const DAY_MARK = "¿Para qué día quieres reservar?"
export const SLOT_MARK = "Elige tu horario"
export const CONFIRM_MARK = "Confirma tu reserva"

export interface FlowComplex {
  id: string
  name: string
  phone: string | null
}

export interface FlowInput {
  text: string
  listRowId?: string | null
  complex: FlowComplex
  phone: string
  customerName: string
  /** Text of the last MODEL message of this conversation (for typed fallbacks). */
  lastModelText?: string | null
}

export interface FlowResult {
  replyText: string
  interactive: BotInteractiveList | null
}

const tz = () => process.env.BOT_TIMEZONE || "America/Guayaquil"
const phoneTail = (p: string) => p.replace(/\D/g, "").slice(-8)

function dateFromOffset(offset: number): string {
  return new Date(Date.now() + offset * 86400000).toLocaleDateString("en-CA", { timeZone: tz() })
}

function nowHHMM(): string {
  return new Date().toLocaleTimeString("en-GB", { timeZone: tz(), hour: "2-digit", minute: "2-digit", hour12: false })
}

function dayLabel(dateStr: string, offset: number): string {
  if (offset === 0) return "Hoy"
  if (offset === 1) return "Mañana"
  return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString("es", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  })
}

const isFlowRow = (id: string) => /^(svc_agendar|svc_menu|day_|more_|slot_|book_)/.test(id)

function dayList(complex: FlowComplex): FlowResult {
  const rows = Array.from({ length: DAYS_AHEAD }, (_, i) => {
    const d = dateFromOffset(i)
    return {
      rowId: `day_${d}`,
      title: `${dayLabel(d, i)}`.slice(0, 24),
      description: d,
    }
  })
  const description = `📅 *${DAY_MARK}*\nSelecciona una fecha:`
  const replyText =
    `${description}\n\n` +
    rows.map((r) => `• ${r.title} (${r.description})`).join("\n") +
    `\n\nToca el botón *Elegir día* o escribe: *hoy*, *mañana* o la fecha (AAAA-MM-DD).`
  return {
    replyText,
    interactive: {
      type: "list",
      title: "Reservar cancha",
      description,
      buttonText: "Elegir día",
      footerText: complex.name,
      sections: [{ title: "Fechas", rows }],
    },
  }
}

async function slotList(complex: FlowComplex, date: string, offset: number, notice = ""): Promise<FlowResult> {
  const courts = await prisma.court.findMany({
    where: { complexId: complex.id, isActive: true },
    select: { id: true },
  })
  await Promise.all(courts.map((c) => cleanupExpiredBookings(c.id)))

  const isToday = date === dateFromOffset(0)
  const slots = await prisma.slot.findMany({
    where: {
      court: { complexId: complex.id, isActive: true },
      date: new Date(`${date}T00:00:00Z`),
      status: "AVAILABLE",
      ...(isToday ? { startTime: { gt: nowHHMM() } } : {}),
    },
    include: { court: { select: { name: true, pricePerHour: true } } },
    orderBy: [{ startTime: "asc" }, { court: { name: "asc" } }],
    skip: offset,
    take: PAGE_SIZE + 1,
  })

  if (slots.length === 0) {
    const phoneTxt = complex.phone ? ` al *${complex.phone}*` : ""
    return {
      replyText:
        `${notice}😕 No hay turnos disponibles para *${date}*.\n\n` +
        `Escribe *1* para elegir otro día o comunícate a recepción${phoneTxt}.`,
      interactive: null,
    }
  }

  const hasMore = slots.length > PAGE_SIZE
  const page = slots.slice(0, PAGE_SIZE)
  const rows = page.map((s) => ({
    rowId: `slot_${s.id}`,
    title: `${s.startTime} - ${s.endTime}`.slice(0, 24),
    description: `${s.court.name} · $${Number(s.court.pricePerHour)}/h`.slice(0, 72),
  }))
  if (hasMore) {
    rows.push({
      rowId: `more_${date}_${offset + PAGE_SIZE}`,
      title: "➡️ Ver más horarios",
      description: "Mostrar más turnos de este día",
    })
  }

  const description = `${notice}⏰ *${SLOT_MARK}* para *${date}*:`
  const replyText =
    `${description}\n` +
    page.map((s) => `• ${s.court.name}: *${s.startTime} - ${s.endTime}* ($${Number(s.court.pricePerHour)}/h)`).join("\n") +
    (hasMore ? `\n… hay más horarios, toca *Ver horarios*.` : "") +
    `\n\n📆 Fecha: (${date})\nToca el botón *Ver horarios* o escribe el turno tal cual, ej: *${page[0].court.name}: ${page[0].startTime} - ${page[0].endTime}*`

  return {
    replyText,
    interactive: {
      type: "list",
      title: "Horarios disponibles",
      description,
      buttonText: "Ver horarios",
      footerText: complex.name,
      sections: [{ title: date, rows }],
    },
  }
}

async function confirmStep(complex: FlowComplex, slotId: string): Promise<FlowResult> {
  const slot = await prisma.slot.findUnique({
    where: { id: slotId },
    include: { court: { select: { name: true, pricePerHour: true, complexId: true } } },
  })
  if (!slot || slot.court.complexId !== complex.id) {
    return { replyText: "No encontramos ese horario. Escribe *1* para ver los horarios disponibles.", interactive: null }
  }
  const date = slot.date.toISOString().slice(0, 10)
  if (slot.status !== "AVAILABLE") {
    return slotList(complex, date, 0, "⚠️ Ese horario ya no está disponible.\n\n")
  }

  const summary =
    `✅ *${CONFIRM_MARK}*\n\n` +
    `🏟️ ${slot.court.name}\n📅 ${date}\n⏰ ${slot.startTime} - ${slot.endTime}\n💵 $${Number(slot.court.pricePerHour)}`
  const replyText =
    `${summary}\n\nResponde *confirmar* para reservar o *cancelar* para volver.\n🔖 Ref: ${slot.id}`

  return {
    replyText,
    interactive: {
      type: "list",
      title: "Confirmar reserva",
      description: summary,
      buttonText: "Opciones",
      footerText: complex.name,
      sections: [
        {
          title: "¿Confirmas?",
          rows: [
            { rowId: `book_${slot.id}`, title: "✅ Confirmar reserva", description: "Apartar este turno ahora" },
            { rowId: `day_${date}`, title: "↩️ Otro horario", description: `Ver turnos de ${date}` },
            { rowId: "svc_menu", title: "🏠 Menú principal", description: "Volver al inicio" },
          ],
        },
      ],
    },
  }
}

async function bookStep(input: FlowInput, slotId: string): Promise<FlowResult> {
  const { complex, phone, customerName } = input

  const slot = await prisma.slot.findUnique({
    where: { id: slotId },
    include: { court: { select: { complexId: true } } },
  })
  if (!slot || slot.court.complexId !== complex.id) {
    return { replyText: "No encontramos ese horario. Escribe *1* para ver los horarios disponibles.", interactive: null }
  }

  // Idempotency: double tap / retry of the same confirmation
  const existing = await prisma.booking.findFirst({
    where: {
      slotId: slot.id,
      customerPhone: { contains: phoneTail(phone) },
      status: { not: "CANCELLED" },
    },
  })
  if (existing) {
    return {
      replyText: `ℹ️ Ya tienes este turno reservado. Escribe *2* para ver el estado de tus reservas.`,
      interactive: null,
    }
  }

  const res: any = await runTool("create_booking", { slotId }, { complexId: complex.id, customerPhone: phone, customerName })
  if (!res?.success) {
    const date = slot.date.toISOString().slice(0, 10)
    return slotList(complex, date, 0, `⚠️ ${res?.error || "No se pudo crear la reserva."}\n\n`)
  }

  let reply =
    `🎉 *¡Reserva creada!*\n\n` +
    `🏟️ ${res.court}\n📅 ${res.date}\n⏰ ${res.start} - ${res.end}\n💵 Total: $${res.total}\n\n` +
    `⏳ Tienes *${res.payWithinMinutes} minutos* para pagar o el turno se liberará.\n\n`

  if (res.bankAccounts?.length) {
    reply +=
      `💳 *Datos para transferir:*\n` +
      res.bankAccounts
        .map((b: any) => {
          const lines = [
            `🏦 *${b.bank}* (${b.type === "SAVINGS" ? "Ahorros" : "Corriente"})`,
            `• N°: *${b.number}*`,
            `• Titular: ${b.holder}`,
          ]
          if (b.holderId) lines.push(`• CI/RUC: ${b.holderId}`)
          return lines.join("\n")
        })
        .join("\n\n") +
      `\n\n`
  } else if (complex.phone) {
    reply += `Comunícate a recepción al *${complex.phone}* para los datos de pago.\n\n`
  }
  reply += `📸 *Envía la foto de tu comprobante por este chat para validar tu reserva.*`

  return { replyText: reply, interactive: null }
}

function parseTypedDay(text: string): string | null {
  const t = text.trim().toLowerCase()
  if (/^hoy\W*$/.test(t)) return dateFromOffset(0)
  if (/^mañana\W*$|^manana\W*$/.test(t)) return dateFromOffset(1)
  if (/^pasado\s+ma(ñ|n)ana\W*$/.test(t)) return dateFromOffset(2)
  const iso = /^(\d{4}-\d{2}-\d{2})$/.exec(t)
  if (iso) return iso[1]
  const dm = /^(\d{1,2})[\/-](\d{1,2})$/.exec(t)
  if (dm) {
    const year = dateFromOffset(0).slice(0, 4)
    return `${year}-${dm[2].padStart(2, "0")}-${dm[1].padStart(2, "0")}`
  }
  return null
}

/** Resolve a typed message into a flow rowId using markers from the last bot message. */
async function resolveTyped(input: FlowInput): Promise<string | null> {
  const last = input.lastModelText || ""
  const text = input.text.trim()
  if (!last || !text) return null

  if (last.includes(DAY_MARK)) {
    const d = parseTypedDay(text)
    if (d && d >= dateFromOffset(0)) return `day_${d}`
    return null
  }

  if (last.includes(CONFIRM_MARK)) {
    const ref = /Ref:\s*(\S+)/.exec(last)?.[1]
    if (!ref) return null
    if (/^(confirmar|confirmo|si|sí|ok|dale|listo)\W*$/i.test(text)) return `book_${ref}`
    if (/^(cancelar|no|volver)\W*$/i.test(text)) return "svc_menu"
    return null
  }

  if (last.includes(SLOT_MARK)) {
    const date = /\((\d{4}-\d{2}-\d{2})\)/.exec(last)?.[1]
    const m = /^(.+?):\s*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\W*$/.exec(text)
    if (!date || !m) return null
    const pad = (v: string) => v.padStart(5, "0")
    const slot = await prisma.slot.findFirst({
      where: {
        court: { complexId: input.complex.id, isActive: true, name: { equals: m[1].trim(), mode: "insensitive" } },
        date: new Date(`${date}T00:00:00Z`),
        startTime: pad(m[2]),
        endTime: pad(m[3]),
      },
      select: { id: true },
    })
    return slot ? `slot_${slot.id}` : null
  }

  return null
}

/**
 * Returns a reply when the message belongs to the guided flow, or null so the caller
 * falls through to the rest of the bot (menu / LLM).
 */
export async function handleGuidedFlow(input: FlowInput): Promise<FlowResult | null> {
  let rowId = input.listRowId || ""
  if (!rowId) rowId = (await resolveTyped(input)) || ""
  if (!rowId || !isFlowRow(rowId)) return null

  if (rowId === "svc_menu") {
    const menu = buildMenu(input.complex.name, input.customerName)
    return { replyText: menu.replyText, interactive: menu.interactive }
  }
  if (rowId === "svc_agendar") return dayList(input.complex)

  if (rowId.startsWith("day_")) {
    const date = rowId.slice(4)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return dayList(input.complex)
    return slotList(input.complex, date, 0)
  }
  if (rowId.startsWith("more_")) {
    const m = /^more_(\d{4}-\d{2}-\d{2})_(\d+)$/.exec(rowId)
    if (!m) return dayList(input.complex)
    return slotList(input.complex, m[1], Number(m[2]))
  }
  if (rowId.startsWith("slot_")) return confirmStep(input.complex, rowId.slice(5))
  if (rowId.startsWith("book_")) return bookStep(input, rowId.slice(5))
  return null
}
