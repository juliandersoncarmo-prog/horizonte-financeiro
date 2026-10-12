import { createServiceClient } from '@/lib/supabase/service'

export async function getUserSettings(userId: string): Promise<{ saldo_abertura: number; data_ancora: string } | null> {
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('settings')
      .select('saldo_abertura, data_ancora')
      .eq('user_id', userId)
      .limit(1)
      .single()
    if (error) {
      if (error.code === 'PGRST116') return null
      console.error('getUserSettings error:', error)
      throw new Error('Falha ao carregar configurações')
    }
    return { saldo_abertura: Number(data.saldo_abertura), data_ancora: data.data_ancora as string }
  } catch (err) {
    console.error('getUserSettings error:', err)
    throw err
  }
}

export async function getRecurringRules(userId: string) {
  try {
    const supabase = createServiceClient()
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
    const supabase = createServiceClient()
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
    const supabase = createServiceClient()
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
  const { data, error } = await createServiceClient().from('daily_actuals').select('data,valor').eq('user_id', userId)
  if (error) throw new Error('Não foi possível carregar o Diário. Verifique a migração no ambiente de testes.')
  return (data ?? []).map(a => ({ data: String(a.data), valor: Number(a.valor) }))
}
