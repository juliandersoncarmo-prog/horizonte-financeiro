'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getUserSettings, getRecurringRules, getTransactions, getDailyBudgets } from '@/lib/db/queries'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { runProjection } from '@/lib/engine/projection'
import type { ProjectionResult, RecurringRule, Transaction, DailyBudget } from '@/types'

async function getAuthenticatedUserId(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  return user.id
}

export async function getProjectionData(startDate: string, months: number = 4): Promise<ProjectionResult> {
  try {
    const userId = await getAuthenticatedUserId()

    const [settings, rawRules, transactions, rawBudgets] = await Promise.all([
      getUserSettings(userId),
      getRecurringRules(userId),
      getTransactions(userId),
      getDailyBudgets(userId),
    ])

    console.log('settings:', JSON.stringify(settings))
    console.log('rules:', rawRules?.length, JSON.stringify(rawRules))
    console.log('transactions:', transactions?.length)
    console.log('budgets:', rawBudgets?.length)

    const effectiveSettings = settings ?? {
      saldo_abertura: 0,
      data_ancora: new Date().toISOString().split('T')[0],
    }

    const recurringRules: RecurringRule[] = rawRules.map((r) => ({
      id: r.id,
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
      tipo: t.tipo,
      valor: Number(t.valor),
      descricao: t.descricao,
      categoria: t.categoria,
      data: t.data,
    }))

    console.log('runProjection input:', JSON.stringify({ saldoAbertura: effectiveSettings.saldo_abertura, dataAncora: effectiveSettings.data_ancora, startDate, months }))
    const result = runProjection({ settings: effectiveSettings, recurringRules, transactions: mappedTransactions, dailyBudgets, horizonMonths: months })
    console.log('runProjection output months:', result?.months?.length)
    return result
  } catch (err) {
    console.error('getProjectionData error:', err)
    return {
      months: [],
      firstNegativeDate: null,
      settings: { saldo_abertura: 0, data_ancora: startDate },
    }
  }
}

export async function addTransaction(formData: {
  tipo: 'entrada' | 'saida'
  valor: number
  descricao: string
  data: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getAuthenticatedUserId()
    const supabase = createServiceClient()
    const { error } = await supabase.from('transactions').insert({
      user_id:   userId,
      tipo:      formData.tipo,
      valor:     formData.valor,
      descricao: formData.descricao,
      categoria: '',
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
  dados: { descricao: string; valor: number },
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getAuthenticatedUserId()
    const supabase = createServiceClient()
    const { error } = await supabase
      .from('transactions')
      .update({ descricao: dados.descricao, valor: dados.valor })
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
  dados: { descricao: string; valor: number },
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getAuthenticatedUserId()
    const supabase = createServiceClient()
    const { error } = await supabase
      .from('recurring_rules')
      .update({ descricao: dados.descricao, valor: dados.valor })
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
  tipo: 'entrada' | 'saida'
  valor: number
  descricao: string
  dia_do_mes: number
  modo_termino: 'nunca' | 'ocorrencias'
  valor_termino: string | null
}): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getAuthenticatedUserId()
    const supabase = createServiceClient()
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
    const userId = await getAuthenticatedUserId()
    const supabase = createServiceClient()
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

export async function resetAllData(): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getAuthenticatedUserId()
    const supabase = createServiceClient()
    await Promise.all([
      supabase.from('transactions').delete().eq('user_id', userId),
      supabase.from('recurring_rules').delete().eq('user_id', userId),
      supabase.from('daily_budgets').delete().eq('user_id', userId),
      supabase.from('settings').delete().eq('user_id', userId),
    ])
    revalidatePath('/')
    return { success: true }
  } catch (err) {
    console.error('resetAllData error:', err)
    return { success: false, error: String(err) }
  }
}

export async function getAllDailyBudgets(): Promise<{
  id: string; descricao: string; categoria: string; valor_mensal: number
}[]> {
  try {
    const userId = await getAuthenticatedUserId()
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('daily_budgets')
      .select('id, descricao, categoria, valor_mensal')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    if (error) return []
    return (data ?? []).map(b => ({
      id: b.id,
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
    const supabase = createServiceClient()
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
    const userId = await getAuthenticatedUserId()
    const supabase = createServiceClient()
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
    const userId = await getAuthenticatedUserId()
    const supabase = createServiceClient()
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
