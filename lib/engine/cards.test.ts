import { describe, expect, it } from 'vitest'
import { cardEvents, invoiceDate, invoiceMonths } from '@/lib/cards'
import { runProjection } from './projection'
import type { CreditCard, ProjectionInput } from '@/types'
const card: CreditCard = { id: 'card', nome: 'Teste', dia_vencimento: 31,
  invoices: [{ id: 'jan', mes_referencia: '2026-01', valor: 120.12 }, { id: 'feb', mes_referencia: '2026-02', valor: 200 }, { id: 'mar', mes_referencia: '2026-03', valor: 0 }] }
const base: ProjectionInput = { settings: { saldo_abertura: 1000, data_ancora: '2026-01-01' }, recurringRules: [], transactions: [], dailyBudgets: [], horizonMonths: 4, cards: [card] }
describe('cartões na projeção', () => {
  it.each([[2026, 28], [2024, 29]])('ajusta fevereiro/%s sem deriva', (year, day) => {
    expect(invoiceDate(`${year}-02`, 31)).toBe(`${year}-02-${day}`)
    expect(invoiceDate(`${year}-03`, 31)).toBe(`${year}-03-31`)
    expect(invoiceDate(`${year}-04`, 31)).toBe(`${year}-04-30`)
  })
  it('gera meses na virada do ano sem vincular compras', () => { expect(invoiceMonths('2026-12', 3)).toEqual(['2026-12', '2027-01', '2027-02']) })
  it.each([0, 61, 1.5, NaN])('rejeita quantidade %s', n => { expect(() => invoiceMonths('2026-01', n)).toThrow() })
  it('rejeita mês impossível e intervalo além de 9999', () => {
    expect(() => invoiceDate('2026-13', 31)).toThrow(); expect(() => invoiceMonths('9999-12', 2)).toThrow()
  })
  it('contabiliza uma saída por competência, zero explícito e continuidade', () => {
    const result = runProjection(base)
    expect(result.months.map(m => m.saldoFechamento)).toEqual([879.88, 679.88, 679.88, 679.88])
    expect(result.months[1].days.at(-1)?.outSum).toBe(200)
    expect(result.months[2].days.at(-1)?.events).toHaveLength(1)
    expect(result.months[3].days.flatMap(d => d.events)).toHaveLength(0)
  })
  it('não desconta faturas anteriores à âncora', () => {
    const result = runProjection({ ...base, settings: { saldo_abertura: 1000, data_ancora: '2026-02-28' } })
    expect(result.months[0].saldoFechamento).toBe(800)
  })
  it('múltiplos cartões no mesmo vencimento somam sem misturar identidades', () => {
    const result = runProjection({ ...base, cards: [card, { ...card, id: 'other', nome: 'Outro' }] })
    expect(result.months[0].days.at(-1)?.outSum).toBe(240.24)
    expect(result.months[0].days.at(-1)?.events).toHaveLength(2)
  })
  it('recalcular é idempotente e não grava eventos no input', () => {
    const original = structuredClone(base)
    expect(runProjection(base)).toEqual(runProjection(base)); expect(base).toEqual(original)
  })
  it('rejeita fatura duplicada em vez de produzir saldo silenciosamente errado', () => {
    expect(() => cardEvents([{ ...card, invoices: [card.invoices[0], card.invoices[0]] }])).toThrow('duplicada')
  })
  it('edição, inclusão e exclusão afetam apenas as faturas correspondentes', () => {
    const edited = { ...card, invoices: [{ ...card.invoices[0], valor: 100 }, { id: 'apr', mes_referencia: '2026-04', valor: 50 }] }
    const result = runProjection({ ...base, cards: [edited] })
    expect(result.months.map(m => m.totalSaidas)).toEqual([100, 0, 0, 50])
    expect(runProjection({ ...base, cards: [] }).months[3].saldoFechamento).toBe(1000)
  })
  it('preserva avulsas/recorrências com nome e valor iguais, sem migrar nem deduplicar por texto', () => {
    const result = runProjection({ ...base, transactions: [{ id: 'old', tipo: 'saida', descricao: 'Teste · 2026-01', categoria: '', valor: 120.12, data: '2026-01-31' }],
      recurringRules: [{ id: 'legacy', tipo: 'saida', descricao: 'Teste', categoria: '', valor: 10, frequencia: 'mensal', dia_do_mes: 31, data_inicio: '2026-01-01', modo_termino: 'nunca', valor_termino: null }] })
    expect(result.months[0].totalSaidas).toBe(250.24)
  })
  it('fatura permanece separada do Diário realizado e previsão', () => {
    const result = runProjection({ ...base, dailyBudgets: [{ id: 'budget', descricao: '', categoria: '', mes_referencia: null, valor_mensal: 310 }], dailyActuals: [{ data: '2026-01-31', valor: 0 }] })
    expect(result.months[0].days.at(-1)?.diario).toBe(0)
    expect(result.months[0].days.at(-1)?.outSum).toBe(120.12)
    expect(result.months[0].totalSaidas).toBe(420.12)
  })
})
