export function assertCronAuthorized(req: Request): boolean {
  const cronSecret = process.env.CRON_SECRET
  const botSecret = process.env.PITA_BOT_SECRET_KEY

  // In development without secret, allow testing with a warning
  if (!cronSecret && !botSecret) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[CRON_AUTH] Ni CRON_SECRET ni PITA_BOT_SECRET_KEY configuradas. Permitiendo ejecución en entorno no-producción.")
      return true
    }
    return false
  }

  const authHeader = req.headers.get("authorization")
  if (!authHeader) {
    return false
  }

  const token = authHeader.replace(/^Bearer\s+/i, "").trim()
  return (!!cronSecret && token === cronSecret) || (!!botSecret && token === botSecret)
}
