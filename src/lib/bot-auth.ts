export function assertBotAuthorized(req: Request): boolean {
  const botSecret = process.env.PITA_BOT_SECRET_KEY

  // In development without secret, allow testing with a warning
  if (!botSecret) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[BOT_AUTH] PITA_BOT_SECRET_KEY no configurada. Permitiendo ejecución en entorno no-producción.")
      return true
    }
    return false
  }

  // Check Authorization Bearer or x-bot-api-key header
  const authHeader = req.headers.get("authorization")
  const customHeader = req.headers.get("x-bot-api-key")

  if (customHeader && customHeader.trim() === botSecret) {
    return true
  }

  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, "").trim()
    if (token === botSecret) {
      return true
    }
  }

  return false
}
