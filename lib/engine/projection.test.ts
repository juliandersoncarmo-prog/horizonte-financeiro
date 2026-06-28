import { describe, it, expect } from 'vitest'
import { runProjection, balanceColor } from './projection'
import type { ProjectionInput } from '@/types'

// Dados base para os testes
const BASE_INPUT: ProjectionInput = {
  settings: {
    saldo_abertura: 5000,
    data_ancora: '2026-01-01',
  },
  recurringRules: [
    {
      id: '1',
      tipo: 'entrada',
      valor: 3000,
      descricao: 'Salário',
      categoria: 'Receita',
      frequencia: 'mensal',
      dia_do_mes: 5,
      data_inicio: '2026-01-01',
      modo_termino: 'nunca',
      valor_termino: null,
    },
    {
      id: '2',
      tipo: 'saida',
      valor: 1200,
      descricao: 'Aluguel',
      categoria: 'Moradia',
      frequencia: 'mensal',
      dia_do_mes: 10,
      data_inicio: '2026-01-01',
      modo_termino: 'nunca',
      valor_termino: null,
    },
  ],
  dailyBudgets: [
    {
      id: 'b1',
      mes_referencia: '2026-01',
      descricao: 'Gastos variáveis',
      categoria: 'Outros',
      valor_mensal: 1240,  // 1240 / 31 dias = ~40/dia
    },
  ],
  horizonMonths: 3,
}

describe('runProjection', () => {
  it('retorna o número correto de meses', () => {
    const result = runProjection(BASE_INPUT)
    expect(result.months).toHaveLength(3)
  })

  it('retorna o número correto de dias em janeiro', () => {
    const result = runProjection(BASE_INPUT)
    expect(result.months[0].days).toHaveLength(31)
  })

  it('retorna o número correto de dias em fevereiro (2026, não bissexto)', () => {
    const result = runProjection(BASE_INPUT)
    expect(result.months[1].days).toHaveLength(28)
  })

  it('saldo do dia 1 = abertura - diario (sem eventos no dia 1)', () => {
    const result = runProjection(BASE_INPUT)
    const day1 = result.months[0].days[0]
    const diario = 1240 / 31
    expect(day1.saldo).toBeCloseTo(5000 - diario, 5)
  })

  it('salário de R$3000 entra no dia 5', () => {
    const result = runProjection(BASE_INPUT)
    const day5 = result.months[0].days[4]
    expect(day5.inSum).toBe(3000)
  })

  it('aluguel de R$1200 sai no dia 10', () => {
    const result = runProjection(BASE_INPUT)
    const day10 = result.months[0].days[9]
    expect(day10.outSum).toBe(1200)
  })

  it('saldo é contínuo: saldoAbertura do mês 2 = saldoFechamento do mês 1', () => {
    const result = runProjection(BASE_INPUT)
    expect(result.months[1].saldoAbertura).toBeCloseTo(result.months[0].saldoFechamento, 5)
  })

  it('saldo é contínuo: saldoAbertura do mês 3 = saldoFechamento do mês 2', () => {
    const result = runProjection(BASE_INPUT)
    expect(result.months[2].saldoAbertura).toBeCloseTo(result.months[1].saldoFechamento, 5)
  })

  it('regra "unico" dispara só na data_inicio', () => {
    const input: ProjectionInput = {
      ...BASE_INPUT,
      recurringRules: [{
        id: '99',
        tipo: 'entrada',
        valor: 500,
        descricao: 'Bônus único',
        categoria: 'Extra',
        frequencia: 'unico',
        dia_do_mes: 15,
        data_inicio: '2026-01-15',
        modo_termino: 'nunca',
        valor_termino: null,
      }],
      dailyBudgets: [],
    }
    const result = runProjection(input)
    const day15jan = result.months[0].days[14]
    const day15feb = result.months[1].days[14]
    expect(day15jan.inSum).toBe(500)
    expect(day15feb.inSum).toBe(0)
  })

  it('regra com modo_termino="data" não dispara após a data final', () => {
    const input: ProjectionInput = {
      ...BASE_INPUT,
      recurringRules: [{
        id: '77',
        tipo: 'entrada',
        valor: 1000,
        descricao: 'Freelance',
        categoria: 'Extra',
        frequencia: 'mensal',
        dia_do_mes: 1,
        data_inicio: '2026-01-01',
        modo_termino: 'data',
        valor_termino: '2026-01-31',
      }],
      dailyBudgets: [],
    }
    const result = runProjection(input)
    const day1jan = result.months[0].days[0]
    const day1feb = result.months[1].days[0]
    expect(day1jan.inSum).toBe(1000)
    expect(day1feb.inSum).toBe(0)
  })

  it('detecta o primeiro saldo negativo', () => {
    const input: ProjectionInput = {
      settings: { saldo_abertura: 100, data_ancora: '2026-01-01' },
      recurringRules: [],
      dailyBudgets: [{
        id: 'b',
        mes_referencia: '2026-01',
        descricao: 'Gastos',
        categoria: 'Outros',
        valor_mensal: 3100,  // ~100/dia -> fica negativo em ~2 dias
      }],
      horizonMonths: 1,
    }
    const result = runProjection(input)
    expect(result.firstNegativeDate).not.toBeNull()
    expect(result.firstNegativeDate).toMatch(/^2026-01-/)
  })

  it('firstNegativeDate é null quando saldo nunca fica negativo', () => {
    const input: ProjectionInput = {
      settings: { saldo_abertura: 999999, data_ancora: '2026-01-01' },
      recurringRules: [],
      dailyBudgets: [],
      horizonMonths: 3,
    }
    const result = runProjection(input)
    expect(result.firstNegativeDate).toBeNull()
  })
})

describe('balanceColor', () => {
  it('>= 2000 é green', () => expect(balanceColor(2000)).toBe('green'))
  it('500-1999 é green-light', () => expect(balanceColor(999)).toBe('green-light'))
  it('100-499 é yellow', () => expect(balanceColor(200)).toBe('yellow'))
  it('-250 a 99 é orange', () => expect(balanceColor(0)).toBe('orange'))
  it('< -250 é red', () => expect(balanceColor(-300)).toBe('red'))
})
