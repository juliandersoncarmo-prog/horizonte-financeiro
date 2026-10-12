import { beforeEach, expect, it, vi } from 'vitest'
const m = vi.hoisted(() => ({ settings: vi.fn(), auth: vi.fn(), insert: vi.fn(), service: vi.fn(), refresh: vi.fn() }))
vi.mock('@/lib/db/queries', () => ({ getUserSettings: m.settings, getRecurringRules: vi.fn(), getTransactions: vi.fn(), getDailyBudgets: vi.fn(), getDailyActuals: vi.fn() }))
vi.mock('./card-actions', () => ({ getCreditCards: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser: m.auth } }) }))
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: m.service }))
vi.mock('next/cache', () => ({ revalidatePath: m.refresh }))
vi.mock('next/navigation', () => ({ redirect: vi.fn(), unstable_rethrow: vi.fn() }))
import { hasInitialSettings, initializeSettings } from './actions'
const input = { saldo_abertura: 0, data_ancora: '2026-10-12' }
beforeEach(() => {
  vi.clearAllMocks()
  m.settings.mockResolvedValue(null)
  m.auth.mockResolvedValue({ data: { user: { id: 'owner' } } })
  m.insert.mockResolvedValue({ error: null })
  m.service.mockReturnValue({ from: () => ({ insert: m.insert }) })
})
it('novo usuário recebe fluxo e pode salvar saldo zero sem fixtures', async () => {
  expect(await hasInitialSettings()).toBe(false)
  expect(await initializeSettings(input)).toEqual({ success: true })
  expect(m.insert).toHaveBeenCalledWith({ user_id: 'owner', ...input })
})
it('configuração existente não recebe fluxo nem é sobrescrita', async () => {
  m.settings.mockResolvedValue(input)
  expect(await hasInitialSettings()).toBe(true)
  expect((await initializeSettings(input)).success).toBe(false)
  expect(m.service).not.toHaveBeenCalled()
})
it('falha de leitura interrompe acesso em vez de iniciar configuração', async () => {
  m.settings.mockRejectedValue(new Error('Banco indisponível'))
  await expect(hasInitialSettings()).rejects.toThrow('Banco indisponível')
  expect((await initializeSettings(input)).success).toBe(false)
  expect(m.service).not.toHaveBeenCalled()
})
it('sem login não consulta nem insere configuração', async () => {
  m.auth.mockResolvedValue({ data: { user: null } })
  expect((await initializeSettings(input)).success).toBe(false)
  expect(m.settings).not.toHaveBeenCalled(); expect(m.insert).not.toHaveBeenCalled()
})
it.each([{ ...input, saldo_abertura: NaN }, { ...input, data_ancora: '2026-02-30' }])('rejeita dados inválidos', async value => {
  expect((await initializeSettings(value)).success).toBe(false)
  expect(m.insert).not.toHaveBeenCalled()
})
it('conflito concorrente na inserção não vira sucesso nem faz upsert', async () => {
  m.insert.mockResolvedValue({ error: { code: '23505' } })
  expect((await initializeSettings(input)).success).toBe(false)
  expect(m.refresh).not.toHaveBeenCalled()
})
