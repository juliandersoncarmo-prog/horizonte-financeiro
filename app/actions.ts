'use server'

import { revalidatePath } from 'next/cache'
import { getUserSettings, getRecurringRules, getTransactions, getDailyBudgets } from '@/lib/db/queries'
import { createServiceClient } from '@/lib/supabase/service'
import { runProjection } from '@/lib/engine/projection'
import type { ProjectionResult, RecurringRule, Transaction, DailyBudget } from '@/types'

const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'

export async function getProjectionData(startDate: string, months: number = 4): Promise<ProjectionResult> {
  try {
    const [settings, rawRules, transactions, rawBudgets] = await Promise.all([
      getUserSettings(TEST_USER_ID),
      getRecurringRules(TEST_USER_ID),
      getTransactions(TEST_USER_ID),
      getDailyBudgets(TEST_USER_ID),
    ])

    console.log('settings:', JSON.stringify(settings))
    console.log('rules:', rawRules?.length, JSON.stringify(rawRules))
    console.log('transactions:', transactions?.length)
    console.log('budgets:', rawBudgets?.length)

    if (!settings) {
      return {
        months: [],
        firstNegativeDate: null,
        settings: { saldo_abertura: 0, data_ancora: startDate },
      }
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

    console.log('runProjection input:', JSON.stringify({ saldoAbertura: settings.saldo_abertura, dataAncora: settings.data_ancora, startDate, months }))
    const result = runProjection({ settings, recurringRules, transactions: mappedTransactions, dailyBudgets, horizonMonths: months })
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
    const supabase = createServiceClient()
    const { error } = await supabase.from('transactions').insert({
      user_id:   TEST_USER_ID,
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
    const supabase = createServiceClient()
    const { error } = await supabase
      .from('transactions')
      .update({ descricao: dados.descricao, valor: dados.valor })
      .eq('id', id)
      .eq('user_id', TEST_USER_ID)
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
    const supabase = createServiceClient()
    const { error } = await supabase
      .from('recurring_rules')
      .update({ descricao: dados.descricao, valor: dados.valor })
      .eq('id', id)
      .eq('user_id', TEST_USER_ID)
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
  frequencia: 'mensal' | 'quinzenal' | 'semanal'
  dia_do_mes: number
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceClient()
    const today = new Date().toISOString().split('T')[0]
    const { error } = await supabase.from('recurring_rules').insert({
      user_id:      TEST_USER_ID,
      tipo:         formData.tipo,
      valor:        formData.valor,
      descricao:    formData.descricao,
      categoria:    '',
      frequencia:   formData.frequencia,
      dia_do_mes:   formData.dia_do_mes,
      data_inicio:  today,
      modo_termino: 'nunca',
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

export async function resetAllData(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceClient()
    await Promise.all([
      supabase.from('transactions').delete().eq('user_id', TEST_USER_ID),
      supabase.from('recurring_rules').delete().eq('user_id', TEST_USER_ID),
      supabase.from('daily_budgets').delete().eq('user_id', TEST_USER_ID),
      supabase.from('settings').delete().eq('user_id', TEST_USER_ID),
    ])
    revalidatePath('/')
    return { success: true }
  } catch (err) {
    console.error('resetAllData error:', err)
    return { success: false, error: String(err) }
  }
}

export async function addDailyBudget(formData: {
  descricao: string
  categoria: string
  valor_mensal: number
  mes_referencia: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceClient()
    const { error } = await supabase.from('daily_budgets').insert({
      user_id:        TEST_USER_ID,
      descricao:      formData.descricao,
      categoria:      formData.categoria,
      valor_mensal:   formData.valor_mensal,
      mes_referencia: formData.mes_referencia,
    })
    if (error) return { success: false, error: error.message }
    revalidatePath('/')
    return { success: true }
  } catch (err) {
    console.error('addDailyBudget error:', err)
    return { success: false, error: String(err) }
  }
}
