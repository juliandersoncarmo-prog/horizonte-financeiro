export type TipoTransacao = 'entrada' | 'saida'
export type Frequencia    = 'mensal' | 'quinzenal' | 'semanal' | 'unico'
export type ModoTermino   = 'nunca' | 'horizonte' | 'ocorrencias' | 'data'

export interface RecurringRule {
  id: string
  tipo: TipoTransacao
  incluido_diario?: boolean
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
  mes_referencia: string | null     // YYYY-MM
  descricao: string
  categoria: string
  valor_mensal: number
}

export interface Settings {
  saldo_abertura: number
  data_ancora: string        // ISO date YYYY-MM-DD
}

export interface DayEvent {
  cardId?: string
  invoiceId?: string
  id?: string      // set for avulsa transactions
  ruleId?: string  // set for recurring rule occurrences
  descricao: string
  categoria: string
  valor: number
  tipo: TipoTransacao
  incluido_diario?: boolean
}

export interface DayResult {
  date: string               // ISO date YYYY-MM-DD
  day: number
  month: number              // 0-based
  year: number
  events: DayEvent[]
  diarioPrevisto?: number
  diarioRealizado?: number | null
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
  editorData?: { recurringRules: RecurringRule[]; dailyBudgets: DailyBudget[] }
  cardData?: { enabled: boolean; cards: CreditCard[] }
  months: MonthResult[]
  firstNegativeDate: string | null
  settings: Settings
}

export interface Transaction {
  id: string
  tipo: TipoTransacao
  incluido_diario?: boolean
  valor: number
  descricao: string
  categoria: string
  data: string  // ISO date YYYY-MM-DD
}

export interface ProjectionInput {
  cards?: CreditCard[]
  settings: Settings
  recurringRules: RecurringRule[]
  transactions: Transaction[]
  dailyBudgets: DailyBudget[]
  dailyActuals?: DailyActual[]
  todayISO?: string         // optional civil date for deterministic tests
  horizonMonths: number
}

export interface DailyActual { data: string; valor: number }

export interface CardInvoice { id: string; mes_referencia: string; valor: number }
export interface CreditCard { id: string; nome: string; dia_vencimento: number; invoices: CardInvoice[] }
