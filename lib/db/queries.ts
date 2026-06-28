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
      return null
    }
    return { saldo_abertura: Number(data.saldo_abertura), data_ancora: data.data_ancora as string }
  } catch (err) {
    console.error('getUserSettings error:', err)
    return null
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
      return []
    }
    return data ?? []
  } catch (err) {
    console.error('getRecurringRules error:', err)
    return []
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
      return []
    }
    return data ?? []
  } catch (err) {
    console.error('getTransactions error:', err)
    return []
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
      return []
    }
    return data ?? []
  } catch (err) {
    console.error('getDailyBudgets error:', err)
    return []
  }
}
