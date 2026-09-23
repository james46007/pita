/**
 * Evolution API Client (v2 / Baileys).
 * Handles multi-tenant instance management, QR code retrieval,
 * connection state checking, number validation, and text message delivery.
 */

const getApiConfig = () => {
  const baseUrl = (process.env.EVOLUTION_API_URL || "https://evolution-api-msng.onrender.com").replace(/\/$/, "")
  const apiKey = process.env.EVOLUTION_API_KEY || process.env.AUTHENTICATION_API_KEY || ""
  return { baseUrl, apiKey }
}

export interface EvolutionQrResponse {
  pairingCode?: string | null
  code?: string
  base64?: string
  count?: number
}

export interface EvolutionConnectionState {
  state: "open" | "connecting" | "close" | "refused" | "unknown"
  instanceName: string
}

export interface SendMessageResult {
  success: boolean
  messageId?: string
  error?: string
}

export class EvolutionApiClient {
  private static getHeaders() {
    const { apiKey } = getApiConfig()
    return {
      "Content-Type": "application/json",
      apikey: apiKey,
    }
  }

  /**
   * Generates a deterministic, URL-safe instance name for a sports complex.
   */
  public static getInstanceName(complexId: string): string {
    // Sanitize complex ID for Evolution API instance naming
    const sanitized = complexId.toLowerCase().replace(/[^a-z0-9_-]/g, "")
    return `pita_${sanitized}`
  }

  /**
   * Creates or ensures an instance exists in Evolution API.
   */
  public static async createInstance(instanceName: string): Promise<{ success: boolean; error?: string }> {
    const { baseUrl } = getApiConfig()
    const appUrl = (process.env.NEXTAUTH_URL || "https://pita.app").replace(/\/$/, "")
    const webhookUrl = `${appUrl}/api/webhooks/whatsapp`

    try {
      const response = await fetch(`${baseUrl}/instance/create`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          instanceName,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS",
          webhook: webhookUrl,
          webhook_by_events: false,
          events: ["CONNECTION_UPDATE"],
        }),
      })

      // Also ensure webhook is explicitly set for the instance
      fetch(`${baseUrl}/webhook/set/${instanceName}`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          webhook: {
            enabled: true,
            url: webhookUrl,
            byEvents: false,
            base64: false,
            events: ["CONNECTION_UPDATE"],
          },
        }),
      }).catch(() => {})

      if (response.ok || response.status === 403 || response.status === 409) {
        // Instance created or already exists
        return { success: true }
      }

      const errText = await response.text()
      // If instance already created, treat as success
      if (errText.includes("already in use") || errText.includes("already exists")) {
        return { success: true }
      }

      return { success: false, error: errText || `Failed to create instance (${response.status})` }
    } catch (err: any) {
      return { success: false, error: err.message || "Network error connecting to Evolution API" }
    }
  }

  /**
   * Fetches QR code data for an instance to display in the dashboard modal.
   */
  public static async getQrCode(instanceName: string): Promise<{ success: boolean; data?: EvolutionQrResponse; error?: string }> {
    const { baseUrl } = getApiConfig()
    try {
      const response = await fetch(`${baseUrl}/instance/connect/${instanceName}`, {
        method: "GET",
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return { success: false, error: errorText || `Status ${response.status}` }
      }

      const data = await response.json()
      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to fetch QR code" }
    }
  }

  /**
   * Queries the current connection state of a specific instance.
   */
  public static async getConnectionState(instanceName: string): Promise<EvolutionConnectionState> {
    const { baseUrl } = getApiConfig()
    try {
      const response = await fetch(`${baseUrl}/instance/connectionState/${instanceName}`, {
        method: "GET",
        headers: this.getHeaders(),
        cache: "no-store",
      })

      if (!response.ok) {
        return { state: "unknown", instanceName }
      }

      const data = await response.json()
      // Evolution API formats: { instance: { state: "open" } } or { state: "open" }
      const rawState = data?.instance?.state || data?.state || "unknown"
      return {
        state: rawState === "open" ? "open" : rawState === "connecting" ? "connecting" : "close",
        instanceName,
      }
    } catch {
      return { state: "unknown", instanceName }
    }
  }

  /**
   * Verifies if a given phone number has an active WhatsApp account.
   */
  public static async checkNumberExists(
    instanceName: string,
    phoneE164: string
  ): Promise<{ exists: boolean; jid?: string }> {
    const { baseUrl } = getApiConfig()
    try {
      const response = await fetch(`${baseUrl}/chat/whatsappNumbers/${instanceName}`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ numbers: [phoneE164] }),
      })

      if (!response.ok) {
        // If presence check fails, assume true to not block legitimate delivery
        return { exists: true }
      }

      const data = await response.json()
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0]
        return { exists: item.exists !== false, jid: item.jid }
      }

      return { exists: true }
    } catch {
      return { exists: true }
    }
  }

  /**
   * Dispatches a text message from a complex's WhatsApp instance.
   */
  public static async sendTextMessage(
    instanceName: string,
    phoneE164: string,
    text: string
  ): Promise<SendMessageResult> {
    const { baseUrl } = getApiConfig()
    try {
      const response = await fetch(`${baseUrl}/message/sendText/${instanceName}`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          number: phoneE164,
          text,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return { success: false, error: errorText || `HTTP ${response.status}` }
      }

      const data = await response.json()
      const messageId = data?.key?.id || data?.id || "unknown"
      return { success: true, messageId }
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to deliver text message" }
    }
  }

  /**
   * Logs out the WhatsApp session on Evolution API.
   */
  public static async logoutInstance(instanceName: string): Promise<{ success: boolean; error?: string }> {
    const { baseUrl } = getApiConfig()
    try {
      const response = await fetch(`${baseUrl}/instance/logout/${instanceName}`, {
        method: "DELETE",
        headers: this.getHeaders(),
      })

      return { success: response.ok }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  /**
   * Performs a lightweight keep-alive ping to Render to prevent idle container sleep.
   */
  public static async pingKeepAlive(): Promise<void> {
    const { baseUrl } = getApiConfig()
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2500)

      await fetch(`${baseUrl}/`, {
        method: "GET",
        signal: controller.signal,
      }).catch(() => {
        // Ignored by design (fire-and-forget)
      })

      clearTimeout(timeoutId)
    } catch {
      // Ignored by design
    }
  }
}
