import { createClient } from '@supabase/supabase-js'

// Service role client — bypassa RLS. Usar apenas em Server Actions/Route Handlers
// onde o user_id já é filtrado explicitamente nas queries.
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}
