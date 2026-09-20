import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

export const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const BUCKET_PAYMENT_RECEIPTS = "payment-receipts"
export const BUCKET_COMPROBANTES = BUCKET_PAYMENT_RECEIPTS
