import { createClient } from '@supabase/supabase-js'

// Service role client — bypassa RLS. Usar apenas em Server Actions/Route Handlers
// onde o user_id já é filtrado explicitamente nas queries.
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      `Variáveis de ambiente Supabase ausentes: ${!url ? 'NEXT_PUBLIC_SUPABASE_URL ' : ''}${!key ? 'SUPABASE_SERVICE_ROLE_KEY' : ''}`.trim()
    )
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}
