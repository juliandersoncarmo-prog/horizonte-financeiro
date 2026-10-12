import type { CreditCard, DayEvent } from '@/types'

export function validMonth(month: string): boolean {
  return typeof month === 'string' && /^(?:[1-9]\d{3})-(?:0[1-9]|1[0-2])$/.test(month)
}
export function validMoney(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 999999999
    && Math.abs(value * 100 - Math.round(value * 100)) < 0.00001
}
export function validDueDay(day: number): boolean { return Number.isInteger(day) && day >= 1 && day <= 31 }
export function invoiceDate(month: string, day: number): string {
  if (!validMonth(month) || !validDueDay(day)) throw new Error('Vencimento inválido')
  const [y, m] = month.split('-').map(Number)
  return `${month}-${String(Math.min(day, new Date(Date.UTC(y, m, 0)).getUTCDate())).padStart(2, '0')}`
}
export function invoiceMonths(first: string, count: number): string[] {
  if (!validMonth(first) || !Number.isInteger(count) || count < 1 || count > 60) throw new Error('Informe de 1 a 60 faturas')
  const [year, month] = first.split('-').map(Number)
  return Array.from({ length: count }, (_, i) => {
    const index = year * 12 + month - 1 + i
    const result = `${Math.floor(index / 12)}-${String(index % 12 + 1).padStart(2, '0')}`
    if (!validMonth(result)) throw new Error('Mês fora do intervalo permitido')
    return result
  })
}

// Virtual events only: never insert copies into transactions or infer legacy links.
export function cardEvents(cards: CreditCard[]): (DayEvent & { data: string })[] {
  const seen = new Set<string>()
  return cards.flatMap(card => card.invoices.map(invoice => {
    const key = `${card.id}:${invoice.mes_referencia}`
    if (seen.has(key)) throw new Error('Fatura duplicada na projeção')
    seen.add(key)
    if (!validMoney(invoice.valor)) throw new Error('Valor de fatura inválido')
    return { cardId: card.id, invoiceId: invoice.id, descricao: `${card.nome} · ${invoice.mes_referencia}`,
      categoria: 'Fatura de cartão', tipo: 'saida' as const, valor: invoice.valor,
      incluido_diario: false, data: invoiceDate(invoice.mes_referencia, card.dia_vencimento) }
  }))
}
