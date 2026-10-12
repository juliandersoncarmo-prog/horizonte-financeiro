import { describe, it, expect } from 'vitest'
import { runProjection, projectionHorizon } from './projection'
import type { ProjectionInput, RecurringRule } from '@/types'
const rule: RecurringRule = { id: 'r', tipo: 'saida', valor: 10, descricao: 'Teste', categoria: '', frequencia: 'mensal', dia_do_mes: 31, data_inicio: '2026-01-01', modo_termino: 'nunca', valor_termino: null }
function project(overrides: Partial<ProjectionInput> = {}) {
  return runProjection({ settings: { saldo_abertura: 1000, data_ancora: '2026-01-01' }, transactions: [], recurringRules: [], dailyBudgets: [], horizonMonths: 4, todayISO: '2026-01-15', ...overrides })
}
function dates(r: RecurringRule, anchor = '2026-01-01', horizonMonths = 4) {
  return project({ settings: { saldo_abertura: 0, data_ancora: anchor }, recurringRules: [r], horizonMonths }).months.flatMap(m => m.days.filter(d => d.events.length).map(d => d.date))
}
describe('regressões da sessão 2', () => {
  it.each([0, -100, 1000])('respeita âncora e inclui seus movimentos, abertura %s', saldo => {
    const r = project({ settings: { saldo_abertura: saldo, data_ancora: '2026-01-15' }, recurringRules: [{ ...rule, dia_do_mes: 10 }], transactions: [14,15,16].map(day => ({ id: String(day), tipo: 'entrada', valor: 100, descricao: '', categoria: '', data: `2026-01-${day}` })), dailyBudgets: [{ id: 'b', descricao: '', categoria: '', mes_referencia: '', valor_mensal: 310 } ] })
    expect(r.months[0].days[0].date).toBe('2026-01-15')
    expect(r.months[0].days[0].saldo).toBe(saldo + 90)
    expect(r.months[0].totalEntradas).toBe(200)
    expect(r.months[0].totalSaidas).toBe(170)
    expect(r.months[1].saldoAbertura).toBe(r.months[0].saldoFechamento)
  })
  it.each([29,30,31])('ajusta dia %s sem deriva', day => {
    expect(dates({ ...rule, dia_do_mes: day })).toEqual([`2026-01-${day}`, '2026-02-28', `2026-03-${day}`, `2026-04-${Math.min(day,30)}`])
  })
  it('fevereiro bissexto e virada de ano', () => {
    expect(dates({ ...rule, data_inicio: '2023-12-01' }, '2023-12-01', 4)).toEqual(['2023-12-31','2024-01-31','2024-02-29','2024-03-31'])
  })
  it('dia 28 continua sem ajuste', () => expect(dates({ ...rule, dia_do_mes: 28 })).toContain('2026-02-28'))
  it('início e término aplicam-se à data ajustada inclusivamente', () => {
    expect(dates({ ...rule, data_inicio: '2026-02-28', modo_termino: 'data', valor_termino: '2026-02-28' })).toEqual(['2026-02-28'])
    expect(dates({ ...rule, data_inicio: '2026-03-31', modo_termino: 'data', valor_termino: '2026-04-29' })).toEqual(['2026-03-31'])
  })
  it('conta ocorrências anteriores à âncora', () => {
    expect(dates({ ...rule, modo_termino: 'ocorrencias', valor_termino: '2' }, '2026-02-15')).toEqual(['2026-02-28'])
  })
  it('primeiro mês sem disparo não consome ocorrência', () => {
    expect(dates({ ...rule, dia_do_mes: 10, data_inicio: '2026-01-15', modo_termino: 'ocorrencias', valor_termino: '2' })).toEqual(['2026-02-10','2026-03-10'])
  })
  it('semanal conta disparos, inclusive antes da âncora', () => {
    expect(dates({ ...rule, frequencia: 'semanal', modo_termino: 'ocorrencias', valor_termino: '3' }, '2026-01-08')).toEqual(['2026-01-08','2026-01-15'])
  })
  it('quinzenal preserva datas existentes e conta cada disparo', () => {
    expect(dates({ ...rule, frequencia: 'quinzenal', dia_do_mes: 10, modo_termino: 'ocorrencias', valor_termino: '3' })).toEqual(['2026-01-10','2026-01-25','2026-02-10'])
    expect(dates({ ...rule, frequencia: 'quinzenal', dia_do_mes: 20 }, '2026-02-01', 1)).toEqual(['2026-02-20'])
  })
  it('único ocorre uma vez e limite zero impede disparos', () => {
    expect(dates({ ...rule, frequencia: 'unico', modo_termino: 'ocorrencias', valor_termino: '1' })).toEqual(['2026-01-01'])
    expect(dates({ ...rule, modo_termino: 'ocorrencias', valor_termino: '0' })).toEqual([])
  })
  it('horizonte e nunca terminam na janela solicitada', () => {
    expect(dates({ ...rule, modo_termino: 'horizonte' })).toEqual(dates(rule))
    expect(projectionHorizon('2024-12-15', '2026-01-01', 4)).toBe(17)
    expect(project({ settings: { saldo_abertura: 0, data_ancora: '2024-12-15' }, horizonMonths: 17 }).months.at(-1)?.label).toBe('2026-04')
  })
  it('relógio injetável e primeiro negativo começam na âncora', () => {
    const r = project({ settings: { saldo_abertura: -1, data_ancora: '2026-01-15' } })
    expect(r.firstNegativeDate).toBe('2026-01-15')
    expect(r.months[0].days.filter(d => d.isToday).map(d => d.date)).toEqual(['2026-01-15'])
  })
  it('conserva centavos em fevereiro e no mês seguinte', () => {
    const r = project({ settings: { saldo_abertura: 100, data_ancora: '2026-02-01' }, dailyBudgets: [{ id: 'b', descricao: '', categoria: '', mes_referencia: '', valor_mensal: 10 }], horizonMonths: 2 })
    expect(r.months.map(m => m.totalSaidas)).toEqual([10,10])
    expect(r.months.map(m => m.saldoFechamento)).toEqual([90,80])
    expect(r.months[0].days[0].diario).toBe(0.36)
    expect(r.months[0].days.at(-1)?.diario).toBe(0.35)
  })

})
