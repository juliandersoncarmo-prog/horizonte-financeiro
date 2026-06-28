import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Parse .env.local sem dotenv
const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
for (const line of envFile.split('\n')) {
  const [key, ...rest] = line.split('=')
  if (key?.trim() && rest.length) process.env[key.trim()] = rest.join('=').trim()
}

const URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SVC  = process.env.SUPABASE_SERVICE_ROLE_KEY!

const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'

async function run() {
  console.log('\n=== 1. ANON KEY (sofre RLS) ===')
  const anon = createClient(URL, ANON)
  const r1 = await anon.from('settings').select('*')
  console.log('data:', r1.data)
  console.log('error:', r1.error)

  console.log('\n=== 2. SERVICE ROLE (bypassa RLS) ===')
  const svc = createClient(URL, SVC, { auth: { autoRefreshToken: false, persistSession: false } })
  const r2 = await svc.from('settings').select('*')
  console.log('data:', r2.data)
  console.log('error:', r2.error)

  console.log('\n=== 3. SERVICE ROLE filtrando TEST_USER_ID ===')
  const r3 = await svc.from('settings').select('*').eq('user_id', TEST_USER_ID)
  console.log('data:', r3.data)
  console.log('error:', r3.error)

  console.log('\n=== 4. Todos os user_ids existentes em settings ===')
  const r4 = await svc.from('settings').select('user_id, saldo_abertura, data_ancora')
  console.log('rows:', r4.data)
}

run().catch(console.error)
