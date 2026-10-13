import { expect, it } from 'vitest'
import { runProjection } from './projection'
import { monthSummary } from './month-summary'
import rows from '../../scripts/fixtures/release-audit-financial.json'
import type { ProjectionInput } from '@/types'

// Financial rows returned by the real test DB, under authenticated RLS, before rollback.
// This validates DB -> engine arithmetic; it does not claim HTTP or browser coverage.
it('reconciles edited persisted fixtures, zero actual, two invoices and monthly summary', () => {
  const input: ProjectionInput = {
    settings: rows.settings[0],
    transactions: rows.transactions as ProjectionInput['transactions'],
    recurringRules: rows.recurring_rules as ProjectionInput['recurringRules'],
    dailyBudgets: rows.daily_budgets,
    dailyActuals: rows.daily_actuals,
    cards: rows.credit_cards.map(card => ({ ...card, invoices: rows.card_invoices.filter(invoice => invoice.card_id === card.id) })),
    horizonMonths: 2, todayISO: '2099-01-01',
  }
  const [january, february] = runProjection(input).months
  expect(january.days[0].diarioRealizado).toBe(0)
  expect(january.days[0].saldo).toBe(1000)
  expect(january.days.find(day => day.date === '2099-01-04')?.saldo).toBe(1408.98)
  expect(january.days.find(day => day.date === '2099-01-06')?.events.some(event => event.ruleId)).toBe(true)
  expect(january.totalEntradas).toBe(500)
  expect(january.totalSaidas).toBe(680)
  expect(january.saldoFechamento).toBe(820)
  expect(february.saldoAbertura).toBe(820)
  expect(february.saldoFechamento).toBe(260)
  expect(monthSummary(january)).toEqual({ resultado: -180, avulsas: 60, recorrentes: 100, cartoes: 210, diarioPrevisto: 310, diarioRealizado: 0 })
})
