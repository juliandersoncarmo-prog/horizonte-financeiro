import { beforeEach, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ settings: vi.fn(), rules: vi.fn(), transactions: vi.fn(), budgets: vi.fn(), actuals: vi.fn(), cards: vi.fn(), auth: vi.fn() }))
vi.mock('@/lib/db/queries', () => ({ getUserSettings: mocks.settings, getRecurringRules: mocks.rules, getTransactions: mocks.transactions, getDailyBudgets: mocks.budgets, getDailyActuals: mocks.actuals }))
vi.mock('./card-actions', () => ({ getCreditCards: mocks.cards }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser: mocks.auth } }) }))
vi.mock('@/lib/supabase/service', () => ({ createUserDataClient: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: vi.fn(), unstable_rethrow: vi.fn() }))
import { getProjectionData } from './actions'
beforeEach(() => {
  vi.clearAllMocks(); mocks.auth.mockResolvedValue({ data: { user: { id: 'owner' } } })
  mocks.settings.mockResolvedValue({ saldo_abertura: 1000, data_ancora: '2026-01-01' })
  for (const method of [mocks.rules, mocks.transactions, mocks.budgets, mocks.actuals]) method.mockResolvedValue([])
  mocks.cards.mockResolvedValue({ enabled: true, cards: [{ id: 'card', nome: 'Teste', dia_vencimento: 31, invoices: [{ id: 'invoice', mes_referencia: '2026-02', valor: 123 }] }] })
})
it('Server Action inclui fatura uma vez em janela distante mantendo saldo anterior', async () => {
  const result = await getProjectionData('2026-02-01', 4)
  expect(result.months).toHaveLength(5); expect(result.months[1].saldoFechamento).toBe(877)
  expect(result.months[4].saldoFechamento).toBe(877)
})
it('falha de cartões interrompe projeção em vez de ocultar despesas', async () => {
  mocks.cards.mockRejectedValue(new Error('Falha cartões'))
  await expect(getProjectionData('2026-01-01')).rejects.toThrow('Falha cartões')
})
it('sem sessão não lê nenhum dado financeiro', async () => {
  mocks.auth.mockResolvedValue({ data: { user: null } })
  await expect(getProjectionData('2026-01-01')).rejects.toThrow('Não autenticado'); expect(mocks.cards).not.toHaveBeenCalled()
})
