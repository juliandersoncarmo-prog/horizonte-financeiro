import { cardEvents } from '@/lib/cards'
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
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
}

function toISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export type BalanceColor = 'green' | 'green-light' | 'yellow' | 'orange' | 'red' | 'neutral'

export function balanceColor(saldo: number, hasData?: boolean): BalanceColor {
  if (hasData === false && saldo === 0) return 'neutral'
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

// Civil dates use UTC solely for calendar arithmetic, never elapsed local hours.
function civilDay(iso: string): number {
  return Date.parse(iso + 'T00:00:00Z') / 86400000
}

function firingDays(rule: ProjectionInput['recurringRules'][number], year: number, month: number): number[] {
  const n = daysInMonth(year, month)
  if (rule.frequencia === 'mensal') return [Math.min(rule.dia_do_mes, n)]
  // Preserve the existing twice-per-month rule; it is not a rolling 15-day interval.
  if (rule.frequencia === 'quinzenal') return [rule.dia_do_mes, rule.dia_do_mes + 15].filter(d => d <= n)
  return []
}

function isRuleActiveOnDate(
  rule: ProjectionInput['recurringRules'][number], dateISO: string,
  year: number, month: number, day: number,
): boolean {
  if (dateISO < rule.data_inicio) return false
  if (rule.modo_termino === 'data' && rule.valor_termino && dateISO > rule.valor_termino) return false
  let occurrence = 0
  if (rule.frequencia === 'unico') {
    if (dateISO !== rule.data_inicio) return false
    occurrence = 1
  } else if (rule.frequencia === 'semanal') {
    const distance = civilDay(dateISO) - civilDay(rule.data_inicio)
    if (distance % 7 !== 0) return false
    occurrence = distance / 7 + 1
  } else {
    if (!firingDays(rule, year, month).includes(day)) return false
    if (rule.modo_termino !== 'ocorrencias' || !rule.valor_termino) return true
    const [iy, im] = rule.data_inicio.split('-').map(Number)
    for (let index = iy * 12 + im - 1; index <= year * 12 + month; index++) {
      const y = Math.floor(index / 12), m = index % 12
      for (const d of firingDays(rule, y, m)) {
        const candidate = toISO(y, m, d)
        if (candidate >= rule.data_inicio && candidate <= dateISO) occurrence++
      }
    }
  }
  if (rule.modo_termino === 'ocorrencias' && rule.valor_termino) {
    return occurrence <= Number(rule.valor_termino)
  }
  // 'horizonte' is bounded by the projection window, like 'nunca'.
  return true
}

export function projectionHorizon(anchor: string, start: string, months: number): number {
  const [ay, am] = anchor.split('-').map(Number)
  const [sy, sm] = start.split('-').map(Number)
  return Math.max(0, (sy - ay) * 12 + sm - am + months)
}

export function runProjection(input: ProjectionInput): ProjectionResult {
  const { settings, recurringRules, transactions, dailyBudgets, horizonMonths } = input

  const invoices = cardEvents(input.cards ?? [])
  function indexByDate<T extends { data: string }>(rows: T[]) {
    const result = new Map<string, T[]>()
    for (const row of rows) {
      const group = result.get(row.data)
      if (group) group.push(row); else result.set(row.data, [row])
    }
    return result
  }
  const transactionsByDate = indexByDate(transactions)
  const invoicesByDate = indexByDate(invoices)

  const [anchorYear, anchorMonth] = settings.data_ancora.split('-').map(Number)
  const startMonth = anchorMonth - 1
  const startYear = anchorYear

  const today = new Date()
  const todayISO = input.todayISO ?? new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Fortaleza' }).format(today)

  const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100
  let saldo = money(settings.saldo_abertura)
  let firstNegativeDate: string | null = null
  const months: MonthResult[] = []

  for (let mi = 0; mi < horizonMonths; mi++) {
    const totalMonths = startMonth + mi
    const year = startYear + Math.floor(totalMonths / 12)
    const month = totalMonths % 12
    const label = `${year}-${String(month + 1).padStart(2, '0')}`

    const N = daysInMonth(year, month)
    const saldoAbertura = saldo

    const schedule = dailySchedule(label, N, dailyBudgets, input.dailyActuals ?? [])

    let totalEntradas = 0
    let totalSaidas = 0
    const days: DayResult[] = []

    for (let d = 1; d <= N; d++) {
      const dateISO = toISO(year, month, d)
      if (dateISO < settings.data_ancora) continue
      // Spread leftover cents over the first days; full months conserve the budget.
      const { previsto: diarioPrevisto, realizado: diarioRealizado, valor: diario } = schedule[d - 1]
      saldo = money(saldo - diario)
      totalSaidas = money(totalSaidas + diario)

      const events: DayEvent[] = []

      for (const rule of recurringRules) {
        if (!isRuleActiveOnDate(rule, dateISO, year, month, d)) continue

        events.push({
          ruleId: rule.id,
          descricao: rule.descricao,
          categoria: rule.categoria,
          valor: money(rule.valor),
          tipo: rule.tipo,
          incluido_diario: rule.incluido_diario,
        })

        if (rule.tipo === 'entrada') {
          saldo = money(saldo + money(rule.valor))
          totalEntradas = money(totalEntradas + money(rule.valor))
        } else if (!rule.incluido_diario) {
          saldo = money(saldo - money(rule.valor))
          totalSaidas = money(totalSaidas + money(rule.valor))
        }
      }

      for (const tx of transactionsByDate.get(dateISO) ?? []) {

        events.push({
          id: tx.id,
          descricao: tx.descricao,
          categoria: tx.categoria,
          valor: money(tx.valor),
          tipo: tx.tipo,
          incluido_diario: tx.incluido_diario,
        })

        if (tx.tipo === 'entrada') {
          saldo = money(saldo + money(tx.valor))
          totalEntradas = money(totalEntradas + money(tx.valor))
        } else if (!tx.incluido_diario) {
          saldo = money(saldo - money(tx.valor))
          totalSaidas = money(totalSaidas + money(tx.valor))
        }
      }

      for (const invoice of invoicesByDate.get(dateISO) ?? []) {
        events.push(invoice)
        saldo = money(saldo - money(invoice.valor))
        totalSaidas = money(totalSaidas + money(invoice.valor))
      }

      const inSum  = money(events.filter(e => e.tipo === 'entrada').reduce((a, e) => a + e.valor, 0))
      const outSum = money(events.filter(e => e.tipo === 'saida' && !e.incluido_diario).reduce((a, e) => a + e.valor, 0))

      const isFirstNeg = !firstNegativeDate && saldo < 0
      if (isFirstNeg) firstNegativeDate = dateISO

      days.push({
        date: dateISO,
        day: d,
        month,
        year,
        events,
        diario,
        diarioPrevisto,
        diarioRealizado,
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

// Month-specific rows are additive only in their month; global rows repeat.
// No identity is inferred from category/description.
export function dailySchedule(label: string, count: number,
  budgets: ProjectionInput['dailyBudgets'], actuals: NonNullable<ProjectionInput['dailyActuals']>) {
  const cents = Math.max(0, budgets.filter(b => !b.mes_referencia || b.mes_referencia === label)
    .reduce((sum, b) => sum + Math.round(b.valor_mensal * 100), 0))
  const confirmed = new Map(actuals.map(a => [a.data, Math.round(a.valor * 100)]))
  const dates = Array.from({ length: count }, (_, i) => `${label}-${String(i + 1).padStart(2, '0')}`)
  const values = dates.map((_, i) => Math.floor(cents / count) + (i < cents % count ? 1 : 0))
  return dates.map((date, i) => {
    const previsto = values[i]
    const realizado = confirmed.get(date)
    if (realizado !== undefined) {
      // Replay chronologically: subsequent unrecorded days inherit the forecast
      // applicable then. The clock never rewrites historical forecasts.
      const targets = dates.map((d, j) => j > i && !confirmed.has(d) ? j : -1).filter(j => j >= 0)
      const remaining = Math.max(0, targets.reduce((sum, j) => sum + values[j], 0) + previsto - realizado)
      targets.forEach((j, k) => { values[j] = Math.floor(remaining / targets.length) + (k < remaining % targets.length ? 1 : 0) })
    }
    return { previsto: previsto / 100, realizado: realizado === undefined ? null : realizado / 100,
      valor: (realizado ?? previsto) / 100 }
  })
}
