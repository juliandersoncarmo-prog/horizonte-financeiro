'use server'

import { getUserSettings, getRecurringRules, getTransactions, getDailyBudgets } from '@/lib/db/queries'
import { runProjection } from '@/lib/engine/projection'
import type { ProjectionResult, RecurringRule, DailyBudget } from '@/types'

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

    console.log('runProjection input:', JSON.stringify({ saldoAbertura: settings.saldo_abertura, dataAncora: settings.data_ancora, startDate, months }))
    const result = runProjection({ settings, recurringRules, dailyBudgets, horizonMonths: months })
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
