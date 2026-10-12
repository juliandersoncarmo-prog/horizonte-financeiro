'use server'

import { readCreditCards } from '@/lib/db/card-query'
import { createClient } from '@/lib/supabase/server'
import { validDueDay, validMonth, validMoney } from '@/lib/cards'
import type { CreditCard } from '@/types'

function enabled() { return process.env.CARTOES_ENABLED === 'true' }
function validId(id: string) { return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) }
function validName(name: string) { return typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 100 }
async function session() {
  if (!enabled()) throw new Error('Cartões aguardam habilitação no ambiente de testes.')
  const db = await createClient()
  const { data: { user }, error } = await db.auth.getUser()
  if (error || !user) throw new Error('Não autenticado')
  return { db, userId: user.id }
}

type Result = { success: boolean; error?: string }
async function mutate(operation: () => Promise<void>): Promise<Result> {
  try { await operation(); return { success: true } }
  catch (err) { return { success: false, error: err instanceof Error ? err.message : 'Não foi possível salvar os cartões.' } }
}
function check(error: unknown, data?: unknown) {
  if (error || data === null || (Array.isArray(data) && data.length === 0)) throw new Error('Não foi possível alterar o registro. Verifique se ele ainda existe e pertence à sua conta.')
}

export async function getCreditCards(): Promise<{ enabled: boolean; cards: CreditCard[] }> { return readCreditCards() }

export async function createCreditCard(input: { nome: string; dia_vencimento: number; invoices: { mes_referencia: string; valor: number }[] }): Promise<Result> {
  return mutate(async () => {
    if (!input || !validName(input.nome) || !validDueDay(input.dia_vencimento) || !Array.isArray(input.invoices)
      || input.invoices.length < 1 || input.invoices.length > 60
      || input.invoices.some(i => !i || !validMonth(i.mes_referencia) || !validMoney(i.valor))
      || new Set(input.invoices.map(i => i.mes_referencia)).size !== input.invoices.length) throw new Error('Informe nome, vencimento e de 1 a 60 faturas válidas, sem repetir meses.')
    const { db } = await session()
    // Transactional RPC: card and initial invoices commit together, with auth.uid().
    const { error } = await db.rpc('create_credit_card', { p_nome: input.nome.trim(), p_dia: input.dia_vencimento,
      p_faturas: input.invoices.map(i => ({ mes_referencia: i.mes_referencia, valor: i.valor })) })
    check(error)
  })
}

export async function updateCreditCard(id: string, nome: string, dia: number): Promise<Result> {
  return mutate(async () => {
    if (!validId(id) || !validName(nome) || !validDueDay(dia)) throw new Error('Cartão inválido')
    const { db, userId } = await session()
    const { data, error } = await db.from('credit_cards').update({ nome: nome.trim(), dia_vencimento: dia }).eq('id', id).eq('user_id', userId).select('id')
    check(error, data)
  })
}
export async function saveCardInvoice(cardId: string, id: string | null, month: string, value: number): Promise<Result> {
  return mutate(async () => {
    if (!validId(cardId) || (id !== null && !validId(id)) || !validMonth(month) || !validMoney(value)) throw new Error('Fatura inválida')
    const { db, userId } = await session()
    const row = { card_id: cardId, user_id: userId, mes_referencia: month, valor: value }
    // Insert refuses an existing month; edit targets an explicit invoice. No blind upsert.
    const query = id === null ? db.from('card_invoices').insert(row)
      : db.from('card_invoices').update({ mes_referencia: month, valor: value }).eq('id', id).eq('card_id', cardId).eq('user_id', userId)
    const { data, error } = await query.select('id')
    if (error?.code === '23505') throw new Error('Este cartão já possui uma fatura nesse mês. Edite a fatura existente.')
    check(error, data)
  })
}
export async function deleteCardInvoice(cardId: string, id: string): Promise<Result> {
  return mutate(async () => {
    if (!validId(cardId) || !validId(id)) throw new Error('Fatura inválida')
    const { db, userId } = await session()
    const { data, error } = await db.from('card_invoices').delete().eq('id', id).eq('card_id', cardId).eq('user_id', userId).select('id')
    check(error, data)
  })
}
export async function deleteCreditCard(id: string): Promise<Result> {
  return mutate(async () => {
    if (!validId(id)) throw new Error('Cartão inválido')
    const { db, userId } = await session()
    const { data, error } = await db.from('credit_cards').delete().eq('id', id).eq('user_id', userId).select('id')
    check(error, data)
  })
}
