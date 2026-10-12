// Opt-in integration test. Never loads the application's .env or service role.
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { curlTestFetch } from './curl-test-fetch.mjs'
const required = name => { const value = process.env[name]; assert(value, `Missing ${name}`); return value }
const ref = required('HF_TEST_PROJECT_REF')
assert.equal(ref, 'hsvjkbfpvmtnehjbwtgr', 'Only the expressly authorized test project is allowed')
assert.equal(required('HF_TEST_CONFIRM'), `ISOLATED:${ref}`)
assert.match(ref, /^[a-z0-9]+$/)
const url = required('HF_TEST_SUPABASE_URL')
assert.equal(url, `https://${ref}.supabase.co`)
assert.notEqual(ref, required('HF_PRODUCTION_PROJECT_REF'))
const key = required('HF_TEST_ANON_KEY')
const client = () => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false },
 global: { fetch: process.env.HF_TEST_CURL_TRANSPORT === 'true' ? curlTestFetch : (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(15000) }) } })
const a = client(), b = client(), anon = client()
const ok = result => { assert.equal(result.error, null, result.error?.message); return result.data }
const denied = result => assert(result.error || result.data?.length === 0, 'Cross-user operation unexpectedly returned rows')
let cardId
const created = []
const tag = `HF-TEST-${randomUUID()}`
try {
 const sa = ok(await a.auth.signInWithPassword({ email: required('HF_TEST_A_EMAIL'), password: required('HF_TEST_A_PASSWORD') }))
 const sb = ok(await b.auth.signInWithPassword({ email: required('HF_TEST_B_EMAIL'), password: required('HF_TEST_B_PASSWORD') }))
 assert.notEqual(sa.user.id, sb.user.id)
 assert.equal(ok(await a.auth.getUser()).user.id, sa.user.id)
 console.log('PASS: two distinct password logins and validated user session')
 const fixtures = {
  settings: { saldo_abertura: -100, data_ancora: '2099-01-15' },
  transactions: { tipo: 'entrada', valor: 123.45, descricao: tag, categoria: '', data: '2099-01-16' },
  recurring_rules: { tipo: 'saida', valor: 10, descricao: tag, categoria: '', frequencia: 'mensal', dia_do_mes: 31, data_inicio: '2099-01-15', modo_termino: 'ocorrencias', valor_termino: '3' },
  daily_budgets: { descricao: tag, categoria: '', valor_mensal: 100 },
 }
 assert.equal(ok(await a.from('settings').select('id')).length, 0, 'Use a fresh synthetic account')
 for (const [table, row] of Object.entries(fixtures)) {
  const item = ok(await a.from(table).insert({ ...row, user_id: sa.user.id }).select('*').single())
  created.push([table, item.id])
  denied(await b.from(table).select('id').eq('id', item.id))
  denied(await anon.from(table).select('id').eq('id', item.id))
  denied(await b.from(table).update(row).eq('id', item.id).select('id'))
  denied(await b.from(table).delete().eq('id', item.id).select('id'))
  assert((await a.from(table).update({ user_id: sb.user.id }).eq('id', item.id)).error, 'Ownership reassignment must fail')
  assert((await b.from(table).insert({ ...row, user_id: sa.user.id })).error, 'Forged owner must fail')
 }
 assert((await a.from('settings').insert({ ...fixtures.settings, user_id: sa.user.id })).error, 'Only one initial setting per user')
 const outflow = ok(await a.from('transactions').insert({ ...fixtures.transactions, user_id: sa.user.id, tipo: 'saida', valor: 25, incluido_diario: true }).select('id').single())
 created.push(['transactions', outflow.id])
 console.log('PASS: initial settings uniqueness, inflow/outflow, recurrence, budget and base-table isolation')
 cardId = ok(await a.rpc('create_credit_card', { p_nome: tag, p_dia: 31, p_faturas: [{ mes_referencia: '2099-02', valor: 0 }] }))
 assert.equal(ok(await a.from('credit_cards').select('id').eq('id', cardId)).length, 1)
 denied(await b.from('credit_cards').select('id').eq('id', cardId))
 denied(await anon.from('credit_cards').select('id').eq('id', cardId))
 denied(await b.from('credit_cards').update({ nome: 'forbidden' }).eq('id', cardId).select('id'))
 denied(await b.from('credit_cards').delete().eq('id', cardId).select('id'))
 assert((await b.from('card_invoices').insert({ user_id: sb.user.id, card_id: cardId, mes_referencia: '2099-03', valor: 1 })).error)
 assert((await a.from('card_invoices').insert({ user_id: sa.user.id, card_id: cardId, mes_referencia: '2099-02', valor: 1 })).error)
 const invoice = ok(await a.from('card_invoices').select('*').eq('card_id', cardId))[0]
 denied(await b.from('card_invoices').select('id').eq('id', invoice.id))
 denied(await b.from('card_invoices').update({ valor: 123 }).eq('id', invoice.id).select('id'))
 denied(await b.from('card_invoices').delete().eq('id', invoice.id).select('id'))
 ok(await a.from('card_invoices').update({ valor: 12.34 }).eq('id', invoice.id).select('id').single())
 // New client and password login prove a separate session can read persistence.
 const reload = client()
 ok(await reload.auth.signInWithPassword({ email: required('HF_TEST_A_EMAIL'), password: required('HF_TEST_A_PASSWORD') }))
 assert.equal(Number(ok(await reload.from('card_invoices').select('valor').eq('id', invoice.id).single()).valor), 12.34)
 assert.equal(Number(ok(await reload.from('settings').select('saldo_abertura').single()).saldo_abertura), -100)
 assert.equal(ok(await reload.from('transactions').select('id')).length, 2)
 await reload.auth.signOut({ scope: 'local' })
 const badName = `${tag}-atomic`
 assert((await a.rpc('create_credit_card', { p_nome: badName, p_dia: 31, p_faturas: [{ mes_referencia: '2099-01', valor: 1 }, { mes_referencia: '2099-01', valor: 2 }] })).error)
 assert.equal(ok(await a.from('credit_cards').select('id').eq('nome', badName)).length, 0)
 const day = '2099-12-31'
 // Refuse overwriting existing data, including a zero actual.
 assert.equal(ok(await a.from('daily_actuals').select('id').eq('data', day)).length, 0)
 const actual = ok(await a.from('daily_actuals').insert({ user_id: sa.user.id, data: day, valor: 0 }).select('id').single())
 try {
  denied(await b.from('daily_actuals').select('id').eq('id', actual.id))
  denied(await anon.from('daily_actuals').select('id').eq('id', actual.id))
  denied(await b.from('daily_actuals').update({ valor: 1 }).eq('id', actual.id).select('id'))
  denied(await b.from('daily_actuals').delete().eq('id', actual.id).select('id'))
  assert((await b.from('daily_actuals').insert({ user_id: sa.user.id, data: day, valor: 1 })).error)
  ok(await a.from('daily_actuals').update({ valor: 7.89 }).eq('id', actual.id).select('id').single())
  assert.equal(Number(ok(await a.from('daily_actuals').select('valor').eq('id', actual.id).single()).valor), 7.89)
 } finally { ok(await a.from('daily_actuals').delete().eq('id', actual.id).select('id').single()) }
 console.log('PASS: real password auth, fresh session persistence, owner CRUD, cross-owner/anonymous isolation, FK, uniqueness and RPC atomicity. Browser E2E and migration/rollback execution remain separate.')
} finally {
 if (cardId) ok(await a.from('credit_cards').delete().eq('id', cardId).select('id').single())
 for (const [table, id] of created.reverse()) ok(await a.from(table).delete().eq('id', id).select('id').single())
 await Promise.all([a.auth.signOut({ scope: 'local' }), b.auth.signOut({ scope: 'local' })])
}
