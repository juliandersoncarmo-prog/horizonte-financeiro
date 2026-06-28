export type TipoTransacao = 'entrada' | 'saida'
export type Frequencia    = 'mensal' | 'quinzenal' | 'semanal' | 'unico'
export type ModoTermino   = 'nunca' | 'horizonte' | 'ocorrencias' | 'data'

export interface RecurringRule {
  id: string
  tipo: TipoTransacao
  valor: number
  descricao: string
  categoria: string
  frequencia: Frequencia
  dia_do_mes: number
  data_inicio: string        // ISO date YYYY-MM-DD
  modo_termino: ModoTermino
  valor_termino: string | null
}

export interface DailyBudget {
  id: string
  mes_referencia: string     // YYYY-MM
  descricao: string
  categoria: string
  valor_mensal: number
}

export interface Settings {
  saldo_abertura: number
  data_ancora: string        // ISO date YYYY-MM-DD
}

export interface DayEvent {
  descricao: string
  categoria: string
  valor: number
  tipo: TipoTransacao
}

export interface DayResult {
  date: string               // ISO date YYYY-MM-DD
  day: number
  month: number              // 0-based
  year: number
  events: DayEvent[]
  diario: number             // gasto diário proporcional do orçamento variável
  inSum: number
  outSum: number
  saldo: number
  isToday: boolean
  isFirstNeg: boolean
}

export interface MonthResult {
  year: number
  month: number              // 0-based
  label: string              // YYYY-MM
  days: DayResult[]
  saldoAbertura: number
  saldoFechamento: number
  totalEntradas: number
  totalSaidas: number
}

export interface ProjectionResult {
  months: MonthResult[]
  firstNegativeDate: string | null
  settings: Settings
}

export interface ProjectionInput {
  settings: Settings
  recurringRules: RecurringRule[]
  dailyBudgets: DailyBudget[]
  horizonMonths: number
}
