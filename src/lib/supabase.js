import { createClient } from '@supabase/supabase-js'
import { config, isSupabaseConfigured } from '../config'

let client = null

if (isSupabaseConfigured()) {
  client = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}

export const supabase = client
export const supabaseAvailable = isSupabaseConfigured()
