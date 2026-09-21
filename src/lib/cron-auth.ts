export function assertCronAuthorized(req: Request): boolean {
  const cronSecret = process.env.CRON_SECRET

  // In development without secret, allow testing with a warning
  if (!cronSecret) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[CRON_AUTH] CRON_SECRET no configurada. Permitiendo ejecución en entorno no-producción.")
      return true
    }
    return false
  }

  const authHeader = req.headers.get("authorization")
  if (!authHeader) {
    return false
  }

  const token = authHeader.replace(/^Bearer\s+/i, "").trim()
  return token === cronSecret
}
