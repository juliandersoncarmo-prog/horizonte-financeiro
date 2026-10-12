// Demo-only adapter. Never imports Supabase, service credentials or Server Actions.
import type { Transaction, RecurringRule, Settings } from '@/types'
import { read, write, reset } from './store'
import { validMonth, validMoney, validDueDay } from '@/lib/cards'
const id = () => crypto.randomUUID()
function mutate(change: (state: ReturnType<typeof read>) => void) { try { const copy = structuredClone(read()); change(copy); write(copy); return { success: true } } catch (err) { return { success: false, error: err instanceof Error ? err.message : 'Falha ao salvar no navegador' } } }
function money(value: number) { if (!validMoney(value)) throw new Error('Valor inválido') }
function found<T extends { id: string }>(rows: T[], key: string) { const row = rows.find(r => r.id === key); if (!row) throw new Error('Registro inexistente'); return row }
export async function addTransaction(input: Omit<Transaction, 'id' | 'categoria'>) { return mutate(s => { money(input.valor); s.transactions.push({ ...input, id: id(), categoria: '' }) }) }
export async function updateTransaction(key: string, input: Pick<Transaction, 'descricao' | 'valor' | 'incluido_diario'>) { return mutate(s => { money(input.valor); Object.assign(found(s.transactions, key), input) }) }
export async function updateRecurringRule(key: string, input: Pick<RecurringRule, 'descricao' | 'valor' | 'incluido_diario'>) { return mutate(s => { money(input.valor); Object.assign(found(s.recurringRules, key), input) }) }
export async function addRecurringRule(input: Pick<RecurringRule, 'tipo' | 'valor' | 'descricao' | 'dia_do_mes' | 'modo_termino' | 'valor_termino' | 'incluido_diario'>) { return mutate(s => { money(input.valor); s.recurringRules.push({ ...input, id: id(), categoria: '', frequencia: 'mensal', data_inicio: s.todayISO! }) }) }
export async function saveSettings(input: Settings) { return mutate(s => { if (!Number.isFinite(input.saldo_abertura) || !/^\d{4}-\d{2}-\d{2}$/.test(input.data_ancora) || new Date(input.data_ancora + 'T00:00:00Z').toISOString().slice(0,10) !== input.data_ancora) throw new Error('Configuração inválida'); s.settings = input }) }
export async function saveDailyActual(data: string, valor: number | null) { return mutate(s => { if (valor !== null) money(valor); s.dailyActuals = (s.dailyActuals ?? []).filter(r => r.data !== data); if (valor !== null) s.dailyActuals.push({ data, valor }) }) }
export async function getAllDailyBudgets() { return structuredClone(read().dailyBudgets) }
export async function addDailyBudget(input: { descricao: string; valor_mensal: number }) { return mutate(s => { money(input.valor_mensal); s.dailyBudgets.push({ ...input, id: id(), categoria: '', mes_referencia: null }) }) }
export async function updateDailyBudget(key: string, value: number) { return mutate(s => { money(value); found(s.dailyBudgets, key).valor_mensal = value }) }
export async function deleteDailyBudget(key: string) { return mutate(s => { found(s.dailyBudgets, key); s.dailyBudgets = s.dailyBudgets.filter(r => r.id !== key) }) }
export async function getCreditCards() { return { enabled: true, cards: structuredClone(read().cards ?? []) } }
export async function createCreditCard(input: { nome: string; dia_vencimento: number; invoices: { mes_referencia: string; valor: number }[] }) { return mutate(s => { if (!input.nome.trim() || !validDueDay(input.dia_vencimento) || !input.invoices.length || input.invoices.length > 60 || new Set(input.invoices.map(i => i.mes_referencia)).size !== input.invoices.length) throw new Error('Cartão inválido'); input.invoices.forEach(i => { money(i.valor); if (!validMonth(i.mes_referencia)) throw new Error('Mês inválido') }); s.cards ??= []; s.cards.push({ ...input, id: id(), invoices: input.invoices.map(i => ({ ...i, id: id() })) }) }) }
export async function updateCreditCard(key: string, nome: string, dia: number) { return mutate(s => { if (!nome.trim() || !validDueDay(dia)) throw new Error('Cartão inválido'); Object.assign(found(s.cards ?? [], key), { nome, dia_vencimento: dia }) }) }
export async function saveCardInvoice(cardId: string, invoiceId: string | null, month: string, value: number) { return mutate(s => { money(value); if (!validMonth(month)) throw new Error('Mês inválido'); const card = found(s.cards ?? [], cardId); if (card.invoices.some(i => i.mes_referencia === month && i.id !== invoiceId)) throw new Error('Este cartão já possui uma fatura nesse mês.'); if (invoiceId) Object.assign(found(card.invoices, invoiceId), { mes_referencia: month, valor: value }); else card.invoices.push({ id: id(), mes_referencia: month, valor: value }) }) }
export async function deleteCardInvoice(cardId: string, invoiceId: string) { return mutate(s => { const card = found(s.cards ?? [], cardId); found(card.invoices, invoiceId); card.invoices = card.invoices.filter(i => i.id !== invoiceId) }) }
export async function deleteCreditCard(key: string) { return mutate(s => { found(s.cards ?? [], key); s.cards = s.cards!.filter(c => c.id !== key) }) }
export async function resetAllData() { reset(); return { success: true } }
export async function signOut() { location.hash = '/'; window.dispatchEvent(new Event('hf-demo-change')) }
