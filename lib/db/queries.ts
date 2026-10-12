import { createUserDataClient } from '@/lib/supabase/service'

export async function getUserSettings(userId: string): Promise<{ saldo_abertura: number; data_ancora: string } | null> {
  try {
    const supabase = await createUserDataClient()
    const { data, error } = await supabase
      .from('settings')
      .select('saldo_abertura, data_ancora')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) {
      console.error('getUserSettings error:', error)
      throw new Error('Falha ao carregar configurações')
    }
    if (data === null) return null
    const balance = data.saldo_abertura == null ? NaN : Number(data.saldo_abertura)
    const date = data.data_ancora
    if (!Number.isFinite(balance) || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || new Date(date + 'T00:00:00Z').toISOString().slice(0, 10) !== date) throw new Error('Configuração existente inválida; não foi sobrescrita.')
    return { saldo_abertura: balance, data_ancora: date }
  } catch (err) {
    console.error('getUserSettings error:', err)
    throw err
  }
}

export async function getRecurringRules(userId: string) {
  try {
    const supabase = await createUserDataClient()
    const { data, error } = await supabase
      .from('recurring_rules')
      .select('*')
      .eq('user_id', userId)
      .eq('ativo', true)
    if (error) {
      console.error('getRecurringRules error:', error)
      throw new Error("Falha ao carregar registros financeiros")
    }
    return data ?? []
  } catch (err) {
    console.error('getRecurringRules error:', err)
    throw err
  }
}

export async function getTransactions(userId: string) {
  try {
    const supabase = await createUserDataClient()
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('data', { ascending: true })
    if (error) {
      console.error('getTransactions error:', error)
      throw new Error("Falha ao carregar registros financeiros")
    }
    return data ?? []
  } catch (err) {
    console.error('getTransactions error:', err)
    throw err
  }
}

export async function getDailyBudgets(userId: string) {
  try {
    const supabase = await createUserDataClient()
    const { data, error } = await supabase
      .from('daily_budgets')
      .select('*')
      .eq('user_id', userId)
    if (error) {
      console.error('getDailyBudgets error:', error)
      throw new Error("Falha ao carregar registros financeiros")
    }
    return data ?? []
  } catch (err) {
    console.error('getDailyBudgets error:', err)
    throw err
  }
}

export async function getDailyActuals(userId: string) {
  if (process.env.DIARIO_INTELIGENTE_ENABLED !== 'true') return []
  const { data, error } = await (await createUserDataClient()).from('daily_actuals').select('data,valor').eq('user_id', userId)
  if (error) throw new Error('Não foi possível carregar o Diário. Verifique a migração no ambiente de testes.')
  return (data ?? []).map(a => ({ data: String(a.data), valor: Number(a.valor) }))
}
