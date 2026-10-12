import type { ProjectionInput } from '@/types'
export const KEY = 'hf-v2-demo-v1'
export function fixture(): ProjectionInput {
const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Fortaleza' }).format(new Date())
const month = today.slice(0, 7)
return { settings: { saldo_abertura: 5000, data_ancora: month + '-01' }, todayISO: today, horizonMonths: 72,
transactions: [], dailyActuals: [], dailyBudgets: [{ id: 'budget-demo', descricao: 'Gastos variáveis fictícios', categoria: '', valor_mensal: 1500, mes_referencia: null }],
recurringRules: [{ id: 'income-demo', tipo: 'entrada', valor: 6000, descricao: 'Receita fictícia', categoria: '', frequencia: 'mensal', dia_do_mes: 5, data_inicio: month + '-01', modo_termino: 'nunca', valor_termino: null }, { id: 'rent-demo', tipo: 'saida', valor: 1800, descricao: 'Moradia fictícia', categoria: '', frequencia: 'mensal', dia_do_mes: 31, data_inicio: month + '-01', modo_termino: 'nunca', valor_termino: null }],
cards: [{ id: 'card-demo', nome: 'Cartão exemplo', dia_vencimento: 31, invoices: [{ id: 'invoice-demo', mes_referencia: month, valor: 450 }] }] }
}
let current: ProjectionInput | undefined
export function read(): ProjectionInput { if (!current) { try { const saved = localStorage.getItem(KEY); current = saved ? JSON.parse(saved) : fixture() } catch { current = fixture() } } return current! }
export function write(input: ProjectionInput) { localStorage.setItem(KEY, JSON.stringify(input)); current = input; window.dispatchEvent(new Event('hf-demo-change')) }
export function reset() { write(fixture()) }
