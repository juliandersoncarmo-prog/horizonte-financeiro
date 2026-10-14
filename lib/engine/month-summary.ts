import type { MonthResult } from '@/types'

// Presentation aggregation of the existing engine output; no projection is rerun.
export function monthSummary(month: MonthResult) {
  const cents = { avulsas: 0, recorrentes: 0, cartoes: 0, diarioPrevisto: 0, diarioRealizado: 0 }
  for (const day of month.days) {
    cents[day.diarioRealizado == null ? 'diarioPrevisto' : 'diarioRealizado'] += Math.round(day.diario * 100)
    for (const event of day.events) {
      if (event.tipo !== 'saida' || event.incluido_diario) continue
      const origin = event.invoiceId ? 'cartoes' : event.ruleId ? 'recorrentes' : 'avulsas'
      cents[origin] += Math.round(event.valor * 100)
    }
  }
  return {
    resultado: (Math.round(month.totalEntradas * 100) - Math.round(month.totalSaidas * 100) - Math.round((month.totalInvestimentos ?? 0) * 100)) / 100,
    avulsas: cents.avulsas / 100, recorrentes: cents.recorrentes / 100, cartoes: cents.cartoes / 100,
    diarioPrevisto: cents.diarioPrevisto / 100, diarioRealizado: cents.diarioRealizado / 100,
  }
}

export function summaryColor(value: number) {
  return value > 0 ? 'text-green' : value < 0 ? 'text-red' : 'text-text'
}
export function summaryInitialIndex(months: MonthResult[]) {
  const current = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Fortaleza', year: 'numeric', month: '2-digit' }).format(new Date())
  return Math.max(0, months.findIndex(month => month.label === current))
}
