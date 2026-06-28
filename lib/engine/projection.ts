import type {
  ProjectionInput,
  ProjectionResult,
  MonthResult,
  DayResult,
  DayEvent,
} from '@/types'

const MONTH_NAMES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function toISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export type BalanceColor = 'green' | 'green-light' | 'yellow' | 'orange' | 'red'

export function balanceColor(saldo: number): BalanceColor {
  if (saldo >= 2000) return 'green'
  if (saldo >= 500)  return 'green-light'
  if (saldo >= 100)  return 'yellow'
  if (saldo >= -250) return 'orange'
  return 'red'
}

export function monthName(month: number): string {
  return MONTH_NAMES[month]
}

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function monthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month]} de ${year}`
}

function isRuleActiveOnDate(
  rule: { frequencia: string; dia_do_mes: number; data_inicio: string; modo_termino: string; valor_termino: string | null },
  dateISO: string,
  year: number,
  month: number,
  day: number,
): boolean {
  if (dateISO < rule.data_inicio) return false

  if (rule.modo_termino === 'data' && rule.valor_termino) {
    if (dateISO > rule.valor_termino) return false
  }

  switch (rule.frequencia) {
    case 'mensal':
      return day === rule.dia_do_mes

    case 'quinzenal':
      return day === rule.dia_do_mes || day === rule.dia_do_mes + 15

    case 'semanal': {
      const inicio = new Date(rule.data_inicio + 'T12:00:00')
      const current = new Date(dateISO + 'T12:00:00')
      return inicio.getDay() === current.getDay()
    }

    case 'unico':
      return dateISO === rule.data_inicio

    default:
      return false
  }
}

export function runProjection(input: ProjectionInput): ProjectionResult {
  const { settings, recurringRules, dailyBudgets, horizonMonths } = input

  const [anchorYear, anchorMonth] = settings.data_ancora.split('-').map(Number)
  const startMonth = anchorMonth - 1
  const startYear = anchorYear

  const today = new Date()
  const todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate())

  let saldo = settings.saldo_abertura
  let firstNegativeDate: string | null = null
  const months: MonthResult[] = []

  for (let mi = 0; mi < horizonMonths; mi++) {
    const totalMonths = startMonth + mi
    const year = startYear + Math.floor(totalMonths / 12)
    const month = totalMonths % 12
    const label = `${year}-${String(month + 1).padStart(2, '0')}`

    const N = daysInMonth(year, month)
    const saldoAbertura = saldo

    const budget = dailyBudgets.find(b => b.mes_referencia === label)
    const valorMensalDiario = budget?.valor_mensal ?? 0
    const diarioPorDia = valorMensalDiario > 0 ? valorMensalDiario / N : 0

    let totalEntradas = 0
    let totalSaidas = 0
    const days: DayResult[] = []

    for (let d = 1; d <= N; d++) {
      const dateISO = toISO(year, month, d)
      const diario = diarioPorDia
      saldo -= diario
      totalSaidas += diario

      const events: DayEvent[] = []

      for (const rule of recurringRules) {
        if (!isRuleActiveOnDate(rule, dateISO, year, month, d)) continue

        events.push({
          descricao: rule.descricao,
          categoria: rule.categoria,
          valor: rule.valor,
          tipo: rule.tipo,
        })

        if (rule.tipo === 'entrada') {
          saldo += rule.valor
          totalEntradas += rule.valor
        } else {
          saldo -= rule.valor
          totalSaidas += rule.valor
        }
      }

      const inSum  = events.filter(e => e.tipo === 'entrada').reduce((a, e) => a + e.valor, 0)
      const outSum = events.filter(e => e.tipo === 'saida').reduce((a, e) => a + e.valor, 0)

      const isFirstNeg = !firstNegativeDate && saldo < 0
      if (isFirstNeg) firstNegativeDate = dateISO

      days.push({
        date: dateISO,
        day: d,
        month,
        year,
        events,
        diario,
        inSum,
        outSum,
        saldo,
        isToday: dateISO === todayISO,
        isFirstNeg,
      })
    }

    months.push({
      year,
      month,
      label,
      days,
      saldoAbertura,
      saldoFechamento: saldo,
      totalEntradas,
      totalSaidas,
    })
  }

  return { months, firstNegativeDate, settings }
}
