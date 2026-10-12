import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { CreditCard } from '@/types'
function enabled() { return process.env.CARTOES_ENABLED === 'true' }
export const readCreditCards = cache(async (): Promise<{ enabled: boolean; cards: CreditCard[] }> => {
  if (!enabled()) return { enabled: false, cards: [] }
  const db = await createClient()
  const { data: { user }, error: authError } = await db.auth.getUser()
  if (authError || !user) throw new Error('Não autenticado')
  const userId = user.id
  const { data, error } = await db.from('credit_cards').select('id,nome,dia_vencimento,card_invoices(id,mes_referencia,valor)').eq('user_id', userId).order('created_at')
  if (error) throw new Error('Não foi possível carregar os cartões. Verifique a migração no ambiente de testes.')
  return { enabled: true, cards: (data ?? []).map(c => ({ id: c.id, nome: c.nome, dia_vencimento: c.dia_vencimento,
    invoices: (c.card_invoices ?? []).map(i => ({ id: i.id, mes_referencia: i.mes_referencia, valor: Number(i.valor) })).sort((a, b) => a.mes_referencia.localeCompare(b.mes_referencia)) })) }
})
