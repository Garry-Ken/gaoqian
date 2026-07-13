import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ============================================================
// Paste your project's values here (or set VITE_SUPABASE_URL /
// VITE_SUPABASE_ANON_KEY in a .env). Until a real URL is present the
// app runs fully on the local seeded world — no backend required.
// The anon/publishable key is public by design; all security rests on
// RLS + SECURITY DEFINER functions (see supabase/schema.sql).
// ============================================================
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? 'https://YOUR-PROJECT.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'YOUR-ANON-KEY'

export const SUPABASE_READY = /^https:\/\/[a-z0-9]+\.supabase\.co$/.test(SUPABASE_URL)

export const supabase: SupabaseClient | null = SUPABASE_READY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null
