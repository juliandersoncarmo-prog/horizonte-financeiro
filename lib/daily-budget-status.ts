import type { MonthResult } from '@/types'

// Read the existing schedule; never recalculate or mutate financial values.
export function exhaustedDailyBudget(month: MonthResult): string | null {
  if (!month.days.some(day => (day.diarioPrevisto ?? 0) > 0)) return null
  for (let index = 0; index < month.days.length - 1; index++) {
    const day = month.days[index]
    if ((day.diarioRealizado ?? 0) <= 0 || month.days[index + 1].diarioPrevisto !== 0) continue
    const pending = month.days.slice(index + 1).filter(next => next.diarioRealizado == null)
    if (pending.length && pending.every(next => next.diarioPrevisto === 0)) return day.date
  }
  return null
}
