/**
 * Phone number normalization and validation for WhatsApp integration.
 * Supports Ecuador mobile numbers by default while allowing international E.164 formats.
 */

export interface PhoneValidationResult {
  isValid: boolean
  formattedPhone: string // Digits only, e.g. "593987654321"
  error?: string
}

/**
 * Normalizes an arbitrary phone string into an E.164 compliant string of digits.
 *
 * Rules:
 * - Strips all non-digit characters (+, -, spaces, parentheses).
 * - If 10 digits starting with '09' (standard Ecuador mobile): transforms '09...' to '5939...'
 * - If 9 digits starting with '9': prefixes with '593' -> '5939...'
 * - If 12 digits starting with '593': preserved as Ecuador international.
 * - If between 10 and 15 digits starting with other valid country codes: preserved.
 * - Otherwise marks as invalid.
 */
export function normalizePhoneToE164(
  rawPhone: string,
  defaultCountryCode = "593"
): PhoneValidationResult {
  if (!rawPhone || typeof rawPhone !== "string") {
    return { isValid: false, formattedPhone: "", error: "Phone number is empty" }
  }

  // Strip everything except digits
  const cleaned = rawPhone.replace(/\D/g, "")

  if (!cleaned) {
    return { isValid: false, formattedPhone: "", error: "No digits found in phone number" }
  }

  // 1. Ecuador mobile starting with 09 (e.g. 0987654321 -> 10 digits)
  if (cleaned.length === 10 && cleaned.startsWith("09")) {
    return {
      isValid: true,
      formattedPhone: `${defaultCountryCode}${cleaned.slice(1)}`,
    }
  }

  // 2. Ecuador mobile without leading zero (e.g. 987654321 -> 9 digits)
  if (cleaned.length === 9 && cleaned.startsWith("9")) {
    return {
      isValid: true,
      formattedPhone: `${defaultCountryCode}${cleaned}`,
    }
  }

  // 3. Ecuador full international (e.g. 593987654321 -> 12 digits)
  if (cleaned.length === 12 && cleaned.startsWith("593")) {
    return {
      isValid: true,
      formattedPhone: cleaned,
    }
  }

  // 4. Other international numbers (E.164 standard: 10 to 15 digits)
  if (cleaned.length >= 10 && cleaned.length <= 15) {
    return {
      isValid: true,
      formattedPhone: cleaned,
    }
  }

  return {
    isValid: false,
    formattedPhone: cleaned,
    error: `Invalid phone length (${cleaned.length} digits). Expected 10-15 digits.`,
  }
}
