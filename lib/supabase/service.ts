import { createClient } from './server'

// All financial operations use the request session. RLS remains active.
// No service role credential is read or required by the application.
export async function createUserDataClient() {
  return createClient()
}
