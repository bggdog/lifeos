import { createClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
const anon =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ||
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY as string | undefined)?.trim()

export const isSupabaseConfigured = Boolean(url && anon)

export const supabase = isSupabaseConfigured
  ? createClient(url!, anon!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : null
