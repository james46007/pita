/**
 * WhatsApp interactive list menu ("Servicios") + deterministic routing of its options.
 */

export interface BotListRow {
  title: string
  description?: string
  rowId: string
}

export interface BotInteractiveList {
  type: "list"
  title: string
  description: string
  buttonText: string
  footerText: string
  sections: { title: string; rows: BotListRow[] }[]
}

export const MENU_ROWS: BotListRow[] = [
  { rowId: "svc_agendar", title: "📅 Reservar cancha", description: "Ver horarios disponibles y reservar" },
  { rowId: "svc_mis_reservas", title: "📋 Mis reservas", description: "Ver estado o gestionar reservas" },
  { rowId: "svc_cuentas", title: "💳 Cuentas bancarias", description: "Datos para transferir y métodos de pago" },
  { rowId: "svc_info", title: "📍 Ubicación y Contacto", description: "Dirección física y teléfono de recepción" },
]

export function buildMenu(complexName: string, customerName?: string | null): {
  replyText: string
  interactive: BotInteractiveList
} {
  const greeting = customerName ? `¡Hola ${customerName}! 👋` : "¡Hola! 👋"
  const description = `${greeting} Bienvenido a *${complexName}*.\nPor favor selecciona una de nuestras opciones disponibles:`

  // Text fallback (numbered) if the client/Evolution cannot render native lists.
  const fallback =
    `${description}\n\n` + MENU_ROWS.map((r, i) => `${i + 1}. ${r.title}`).join("\n") +
    "\n\nResponde con el número de la opción."

  return {
    replyText: fallback,
    interactive: {
      type: "list",
      title: "Servicios",
      description,
      buttonText: "Servicios",
      footerText: complexName,
      sections: [{ title: "Servicios", rows: MENU_ROWS }],
    },
  }
}

/** Natural-language intents handed to the LLM when a menu option is chosen. */
const ROW_INTENT: Record<string, string> = {
  svc_agendar: "Quiero ver los horarios disponibles para reservar una cancha.",
  svc_mis_reservas: "Quiero consultar mis reservas activas.",
}

export type MenuResolution =
  | { kind: "menu" }
  | { kind: "cuentas" }
  | { kind: "info" }
  | { kind: "intent"; text: string }
  | { kind: "none" }

const GREETING_RE = /^(hola|holi|buenas|buenos dias|buenos días|buenas tardes|buenas noches|menu|menú|inicio|opciones|servicios)\W*$/i

export function resolveMenuInput(text: string, listRowId?: string | null): MenuResolution {
  let rowId = listRowId || ""

  if (!rowId) {
    const t = text.trim()
    if (GREETING_RE.test(t)) return { kind: "menu" }
    const n = /^([1-4])[.)]?$/.exec(t)
    if (n) rowId = MENU_ROWS[Number(n[1]) - 1].rowId
  }

  if (!rowId) return { kind: "none" }
  if (rowId === "svc_cuentas") return { kind: "cuentas" }
  if (rowId === "svc_info") return { kind: "info" }
  if (ROW_INTENT[rowId]) return { kind: "intent", text: ROW_INTENT[rowId] }
  return { kind: "none" }
}

