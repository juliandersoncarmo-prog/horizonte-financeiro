import { expect, it } from 'vitest'
import { runProjection } from './projection'
import { monthSummary, summaryColor } from './month-summary'
import type { ProjectionInput } from '@/types'
const fixture = (overrides: Partial<ProjectionInput> = {}) => runProjection({ settings: { saldo_abertura: 1000, data_ancora: '2026-01-01' }, recurringRules: [], transactions: [], dailyBudgets: [], horizonMonths: 3, ...overrides })
it.each([[200, 100, 100], [100, 200, -100], [100, 100, 0]])('resultado de %s menos %s é %s, distinto do saldo', (entrada, saida, result) => {
  const month = fixture({ transactions: [{ id: 'in', tipo: 'entrada', valor: entrada, descricao: '', categoria: '', data: '2026-01-01' }, { id: 'out', tipo: 'saida', valor: saida, descricao: '', categoria: '', data: '2026-01-31' }] }).months[0]
  expect(monthSummary(month).resultado).toBe(result)
  expect(month.saldoFechamento).toBe(1000 + result)
  expect(summaryColor(result)).toBe(result > 0 ? 'text-green' : result < 0 ? 'text-red' : 'text-text')
})
it('concilia todas as origens, substitui previsto por realizado e exclui eventos incluídos', () => {
  const projection = fixture({ dailyBudgets: [{ id: 'budget', mes_referencia: null, descricao: '', categoria: '', valor_mensal: 310 }], dailyActuals: [{ data: '2026-01-01', valor: 15 }, { data: '2026-01-31', valor: 0 }],
    transactions: [{ id: 'out', tipo: 'saida', valor: 12.34, descricao: '', categoria: '', data: '2026-01-01' }, { id: 'included', tipo: 'saida', incluido_diario: true, valor: 10, descricao: '', categoria: '', data: '2026-01-01' }],
    recurringRules: [{ id: 'rule', tipo: 'saida', valor: 20, descricao: '', categoria: '', frequencia: 'mensal', dia_do_mes: 31, data_inicio: '2026-01-01', modo_termino: 'nunca', valor_termino: null }, { id: 'included-rule', tipo: 'saida', incluido_diario: true, valor: 5, descricao: '', categoria: '', frequencia: 'mensal', dia_do_mes: 1, data_inicio: '2026-01-01', modo_termino: 'nunca', valor_termino: null }],
    cards: [{ id: 'card', nome: '', dia_vencimento: 31, invoices: [{ id: 'invoice', mes_referencia: '2026-01', valor: 30.01 }] }] })
  for (const month of projection.months) {
    const summary = monthSummary(month)
    expect(Math.round((summary.avulsas + summary.recorrentes + summary.cartoes + summary.diarioPrevisto + summary.diarioRealizado) * 100)).toBe(Math.round(month.totalSaidas * 100))
    expect(Math.round(month.days.reduce((sum, d) => sum + d.outSum + d.diario, 0) * 100)).toBe(Math.round(month.totalSaidas * 100))
    expect(month.saldoFechamento).toBe(Math.round((month.saldoAbertura + summary.resultado) * 100) / 100)
    expect(month.saldoFechamento).toBe(month.days.at(-1)?.saldo)
  }
  expect(monthSummary(projection.months[0])).toMatchObject({ avulsas: 12.34, recorrentes: 20, cartoes: 30.01, diarioRealizado: 15 })
  expect(projection.months[1].saldoAbertura).toBe(projection.months[0].saldoFechamento)
})
it.each(['2023-12-15', '2024-02-15', '2026-02-15'])('abertura parcial, meses curtos e continuidade em %s', anchor => {
  const projection = fixture({ settings: { saldo_abertura: -12.34, data_ancora: anchor }, dailyBudgets: [{ id: 'b', mes_referencia: null, descricao: '', categoria: '', valor_mensal: 10 }] })
  expect(projection.months[0].days[0].date).toBe(anchor)
  expect(projection.months[0].saldoAbertura).toBe(-12.34)
  projection.months.forEach((month, i) => {
    expect(monthSummary(month).diarioPrevisto).toBe(month.totalSaidas)
    if (i) expect(month.saldoAbertura).toBe(projection.months[i - 1].saldoFechamento)
  })
})
it('zero sem movimentos mantém abertura e fechamento', () => {
  const month = fixture().months[0]
  expect(monthSummary(month).resultado).toBe(0)
  expect(month.totalSaidas).toBe(0)
  expect(month.saldoFechamento).toBe(month.saldoAbertura)
})
