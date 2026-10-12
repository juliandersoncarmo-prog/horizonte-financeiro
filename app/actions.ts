'use server'

import { getCreditCards } from './card-actions'
import { revalidatePath } from 'next/cache'
import { redirect, unstable_rethrow } from 'next/navigation'
import { getUserSettings, getRecurringRules, getTransactions, getDailyBudgets, getDailyActuals } from '@/lib/db/queries'
import { createClient } from '@/lib/supabase/server'
import { createUserDataClient } from '@/lib/supabase/service'
import { runProjection, projectionHorizon } from '@/lib/engine/projection'
import { validMoney, validDueDay } from '@/lib/cards'
import type { ProjectionResult, RecurringRule, Transaction, DailyBudget } from '@/types'

async function getAuthenticatedUserId(): Promise<string> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Não autenticado')
  return user.id
}

export async function getProjectionData(startDate: string, months: number = 4): Promise<ProjectionResult> {
  try {
    const userId = await getAuthenticatedUserId()

    const [settings, rawRules, transactions, rawBudgets, dailyActuals, cardData] = await Promise.all([
      getUserSettings(userId),
      getRecurringRules(userId),
      getTransactions(userId),
      getDailyBudgets(userId),
      getDailyActuals(userId),
      getCreditCards(),
    ])


    const effectiveSettings = settings ?? {
      saldo_abertura: 0,
      data_ancora: new Date().toISOString().split('T')[0],
    }

    const recurringRules: RecurringRule[] = rawRules.map((r) => ({
      id: r.id,
      incluido_diario: r.incluido_diario ?? false,
      tipo: r.tipo,
      valor: Number(r.valor),
      descricao: r.descricao,
      categoria: r.categoria,
      frequencia: r.frequencia,
      dia_do_mes: r.dia_do_mes,
      data_inicio: r.data_inicio,
      modo_termino: r.modo_termino,
      valor_termino: r.valor_termino ?? null,
    }))

    const dailyBudgets: DailyBudget[] = rawBudgets.map((b) => ({
      id: b.id,
      mes_referencia: b.mes_referencia,
      descricao: b.descricao,
      categoria: b.categoria,
      valor_mensal: Number(b.valor_mensal),
    }))

    const mappedTransactions: Transaction[] = transactions.map((t) => ({
      id: t.id,
      incluido_diario: t.incluido_diario ?? false,
      tipo: t.tipo,
      valor: Number(t.valor),
      descricao: t.descricao,
      categoria: t.categoria,
      data: t.data,
    }))

    const result = runProjection({ cards: cardData.cards, settings: effectiveSettings, recurringRules, transactions: mappedTransactions, dailyBudgets, dailyActuals, horizonMonths: projectionHorizon(effectiveSettings.data_ancora, startDate, months) })
    return result
  } catch (err) {
    unstable_rethrow(err)
    throw err
  }
}

export async function addTransaction(formData: {
  incluido_diario?: boolean
  tipo: 'entrada' | 'saida'
  valor: number
  descricao: string
  data: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (!validMoney(formData.valor) || !['entrada', 'saida'].includes(formData.tipo)
      || typeof formData.descricao !== 'string' || !formData.descricao.trim()
      || !/^\d{4}-\d{2}-\d{2}$/.test(formData.data)
      || !Number.isFinite(Date.parse(formData.data + 'T00:00:00Z'))
      || new Date(formData.data + 'T00:00:00Z').toISOString().slice(0, 10) !== formData.data) {
      return { success: false, error: 'Movimentação inválida.' }
    }
    if (formData.incluido_diario && !diarioEnabled()) return { success: false, error: 'Conciliação aguarda habilitação no ambiente de testes.' }
    const userId = await getAuthenticatedUserId()
    const supabase = await createUserDataClient()
    const { error } = await supabase.from('transactions').insert({
      user_id:   userId,
      tipo:      formData.tipo,
      valor:     formData.valor,
      descricao: formData.descricao,
      categoria: '',
      ...(formData.incluido_diario && diarioEnabled() ? { incluido_diario: formData.tipo === 'saida' } : {}),
      data:      formData.data,
    })
    if (error) return { success: false, error: error.message }
    revalidatePath('/')
    return { success: true }
  } catch (err) {
    console.error('addTransaction error:', err)
    return { success: false, error: String(err) }
  }
}

export async function updateTransaction(
  id: string,
  dados: { descricao: string; valor: number; incluido_diario?: boolean },
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!validMoney(dados.valor) || typeof dados.descricao !== 'string' || !dados.descricao.trim()) return { success: false, error: 'Movimentação inválida.' }
    const userId = await getAuthenticatedUserId()
    const supabase = await createUserDataClient()
    const { error } = await supabase
      .from('transactions')
      .update({ descricao: dados.descricao, valor: dados.valor, ...(diarioEnabled() && dados.incluido_diario !== undefined ? { incluido_diario: dados.incluido_diario } : {}) })
      .eq('id', id)
      .eq('user_id', userId)
    if (error) return { success: false, error: error.message }
    revalidatePath('/')
    return { success: true }
  } catch (err) {
    console.error('updateTransaction error:', err)
    return { success: false, error: String(err) }
  }
}

export async function updateRecurringRule(
  id: string,
  dados: { descricao: string; valor: number; incluido_diario?: boolean },
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!validMoney(dados.valor) || typeof dados.descricao !== 'string' || !dados.descricao.trim()) return { success: false, error: 'Recorrência inválida.' }
    const userId = await getAuthenticatedUserId()
    const supabase = await createUserDataClient()
    const { error } = await supabase
      .from('recurring_rules')
      .update({ descricao: dados.descricao, valor: dados.valor, ...(diarioEnabled() && dados.incluido_diario !== undefined ? { incluido_diario: dados.incluido_diario } : {}) })
      .eq('id', id)
      .eq('user_id', userId)
    if (error) return { success: false, error: error.message }
    revalidatePath('/')
    return { success: true }
  } catch (err) {
    console.error('updateRecurringRule error:', err)
    return { success: false, error: String(err) }
  }
}

export async function addRecurringRule(formData: {
  incluido_diario?: boolean
  tipo: 'entrada' | 'saida'
  valor: number
  descricao: string
  dia_do_mes: number
  modo_termino: 'nunca' | 'ocorrencias'
  valor_termino: string | null
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (!validMoney(formData.valor) || !validDueDay(formData.dia_do_mes)
      || !['entrada', 'saida'].includes(formData.tipo)
      || typeof formData.descricao !== 'string' || !formData.descricao.trim()
      || !['nunca', 'ocorrencias'].includes(formData.modo_termino)
      || (formData.modo_termino === 'ocorrencias' && (!/^\d+$/.test(formData.valor_termino ?? '')
        || Number(formData.valor_termino) < 1 || Number(formData.valor_termino) > 1200))) {
      return { success: false, error: 'Recorrência inválida.' }
    }
    const userId = await getAuthenticatedUserId()
    const supabase = await createUserDataClient()
    if (formData.incluido_diario && !diarioEnabled()) return { success: false, error: 'Conciliação aguarda habilitação no ambiente de testes.' }
    const today = new Date().toISOString().split('T')[0]
    const { error } = await supabase.from('recurring_rules').insert({
      user_id:      userId,
      tipo:         formData.tipo,
      valor:        formData.valor,
      descricao:    formData.descricao,
      categoria:    '',
      frequencia:   'mensal',
      dia_do_mes:   formData.dia_do_mes,
      data_inicio:  today,
      modo_termino: formData.modo_termino,
      valor_termino: formData.valor_termino,
      ativo:        true,
      ...(formData.incluido_diario && diarioEnabled() ? { incluido_diario: formData.tipo === 'saida' } : {}),
    })
    if (error) return { success: false, error: error.message }
    revalidatePath('/')
    return { success: true }
  } catch (err) {
    console.error('addRecurringRule error:', err)
    return { success: false, error: String(err) }
  }
}

export async function saveSettings(dados: {
  saldo_abertura: number
  data_ancora: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (!Number.isFinite(dados.saldo_abertura) || !/^\d{4}-\d{2}-\d{2}$/.test(dados.data_ancora)
      || new Date(dados.data_ancora + 'T00:00:00Z').toISOString().slice(0, 10) !== dados.data_ancora) {
      return { success: false, error: 'Informe um saldo válido e uma data existente.' }
    }
    const userId = await getAuthenticatedUserId()
    const supabase = await createUserDataClient()
    const { error } = await supabase
      .from('settings')
      .upsert(
        { user_id: userId, saldo_abertura: dados.saldo_abertura, data_ancora: dados.data_ancora },
        { onConflict: 'user_id' },
      )
    if (error) return { success: false, error: error.message }
    revalidatePath('/')
    return { success: true }
  } catch (err) {
    console.error('saveSettings error:', err)
    return { success: false, error: String(err) }
  }
}

// Insert only: a concurrent first access must never overwrite an existing balance.
export async function initializeSettings(dados: { saldo_abertura: number; data_ancora: string }): Promise<{ success: boolean; error?: string }> {
  try {
    if (!Number.isFinite(dados.saldo_abertura) || !/^\d{4}-\d{2}-\d{2}$/.test(dados.data_ancora)
      || new Date(dados.data_ancora + 'T00:00:00Z').toISOString().slice(0, 10) !== dados.data_ancora) return { success: false, error: 'Informe um saldo válido e uma data existente.' }
    const userId = await getAuthenticatedUserId()
    if (await getUserSettings(userId)) return { success: false, error: 'Já existe configuração inicial. Altere-a em Configurações.' }
    const { error } = await (await createUserDataClient()).from('settings').insert({ user_id: userId, ...dados })
    if (error) return { success: false, error: 'Não foi possível criar a configuração. Recarregue antes de tentar novamente.' }
    // The wizard refreshes when the user finishes the optional stage.
    return { success: true }
  } catch { return { success: false, error: 'Não foi possível verificar ou salvar a configuração inicial.' } }
}

export async function hasInitialSettings(): Promise<boolean> {
  return (await getUserSettings(await getAuthenticatedUserId())) !== null
}

export async function resetAllData(): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getAuthenticatedUserId()
    const supabase = await createUserDataClient()
    const results = await Promise.all([
      ...(process.env.CARTOES_ENABLED === 'true' ? [supabase.from('credit_cards').delete().eq('user_id', userId)] : []),
      supabase.from('transactions').delete().eq('user_id', userId),
      supabase.from('recurring_rules').delete().eq('user_id', userId),
      supabase.from('daily_budgets').delete().eq('user_id', userId),
      supabase.from('settings').delete().eq('user_id', userId),
      ...(diarioEnabled() ? [supabase.from('daily_actuals').delete().eq('user_id', userId)] : []),
    ])
    if (results.some(r => r.error)) return { success: false, error: 'Não foi possível excluir todos os registros.' }
    revalidatePath('/')
    return { success: true }
  } catch (err) {
    console.error('resetAllData error:', err)
    return { success: false, error: String(err) }
  }
}

export async function getAllDailyBudgets(): Promise<{
  id: string; descricao: string; categoria: string; valor_mensal: number; mes_referencia: string | null
}[]> {
  try {
    const userId = await getAuthenticatedUserId()
    const supabase = await createUserDataClient()
    const { data, error } = await supabase
      .from('daily_budgets')
      .select('id, descricao, categoria, valor_mensal, mes_referencia')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    if (error) return []
    return (data ?? []).map(b => ({
      id: b.id,
      mes_referencia: b.mes_referencia,
      descricao: b.descricao,
      categoria: b.categoria,
      valor_mensal: Number(b.valor_mensal),
    }))
  } catch {
    return []
  }
}

export async function deleteDailyBudget(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getAuthenticatedUserId()
    const supabase = await createUserDataClient()
    const { error } = await supabase
      .from('daily_budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) return { success: false, error: error.message }
    revalidatePath('/')
    return { success: true }
  } catch (err) {
    console.error('deleteDailyBudget error:', err)
    return { success: false, error: String(err) }
  }
}

export async function updateDailyBudget(id: string, valorMensal: number): Promise<{ success: boolean; error?: string }> {
  try {
    if (!Number.isFinite(valorMensal) || valorMensal < 0 || valorMensal > 999999999) return { success: false, error: 'Orçamento inválido.' }
    const userId = await getAuthenticatedUserId()
    const supabase = await createUserDataClient()
    const { error } = await supabase
      .from('daily_budgets')
      .update({ valor_mensal: valorMensal })
      .eq('id', id)
      .eq('user_id', userId)
    if (error) return { success: false, error: error.message }
    revalidatePath('/')
    return { success: true }
  } catch (err) {
    console.error('updateDailyBudget error:', err)
    return { success: false, error: String(err) }
  }
}

export async function addDailyBudget(formData: {
  descricao: string
  valor_mensal: number
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (!Number.isFinite(formData.valor_mensal) || formData.valor_mensal < 0 || formData.valor_mensal > 999999999) return { success: false, error: "Orçamento inválido." }
    const userId = await getAuthenticatedUserId()
    const supabase = await createUserDataClient()
    const { error } = await supabase.from('daily_budgets').insert({
      user_id:      userId,
      descricao:    formData.descricao,
      categoria:    '',
      valor_mensal: formData.valor_mensal,
    })
    if (error) return { success: false, error: error.message }
    revalidatePath('/')
    return { success: true }
  } catch (err) {
    console.error('addDailyBudget error:', err)
    return { success: false, error: String(err) }
  }
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

function diarioEnabled() { return process.env.DIARIO_INTELIGENTE_ENABLED === 'true' }

export async function saveDailyActual(data: string, valor: number | null): Promise<{ success: boolean; error?: string }> {
  try {
    if (!diarioEnabled()) return { success: false, error: 'Diário inteligente aguarda habilitação no ambiente de testes.' }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || !Number.isFinite(Date.parse(data + 'T00:00:00Z'))
      || new Date(data + 'T00:00:00Z').toISOString().slice(0, 10) !== data
      || (valor !== null && (!Number.isFinite(valor) || valor < 0 || valor > 999999999 || Math.abs(valor * 100 - Math.round(valor * 100)) > 0.00001))) {
      return { success: false, error: 'Informe uma data existente e um valor não negativo com até dois decimais.' }
    }
    const userId = await getAuthenticatedUserId()
    const db = await createUserDataClient()
    const result = valor === null
      ? await db.from('daily_actuals').delete().eq('user_id', userId).eq('data', data)
      : await db.from('daily_actuals').upsert({ user_id: userId, data, valor }, { onConflict: 'user_id,data' })
    if (result.error) return { success: false, error: 'Não foi possível salvar o Diário.' }
    revalidatePath('/')
    return { success: true }
  } catch { return { success: false, error: 'Não foi possível salvar o Diário.' } }
}
