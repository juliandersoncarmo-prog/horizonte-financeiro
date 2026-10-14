// Run after the Sites/Vinext build. Never print API keys or session data.
import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import assert from 'node:assert/strict'
const root=resolve(process.argv[2]??'.','dist/client')
function files(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(join(dir,entry.name)):entry.name.endsWith('.js')?[join(dir,entry.name)]:[])}
const bundles=files(root).map(file=>readFileSync(file,'utf8')).join('\n')
assert(!bundles.includes('NEXT_PUBLIC_SUPABASE_URL')&&!bundles.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY'),'Supabase browser configuration unresolved: supply public configuration at build time')
assert(bundles.includes('https://hsvjkbfpvmtnehjbwtgr.supabase.co'),'Authorized test project URL must be embedded in browser build')
assert(bundles.includes('/api/auth/login'),'Password login endpoint missing from browser build')
console.log('PASS: public Supabase config compiled for authorized test project; bounded password endpoint included')

const expected=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
assert(expected && expected !== 'null' && expected !== 'undefined', 'Supply the public project key to verify the build')
const server=files(resolve(process.argv[2]??'.','dist/server')).map(file=>readFileSync(file,'utf8')).join('\n')
assert(bundles.includes(expected), 'Browser key differs from authorized project key')
assert(server.includes(expected), 'Server key differs from authorized project key; runtime changes cannot repair baked build values')
console.log('PASS: server and browser both contain the verified public project key')
