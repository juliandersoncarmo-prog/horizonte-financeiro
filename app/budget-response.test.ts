import { beforeEach, expect, it, vi } from 'vitest'
const m = vi.hoisted(() => ({ auth: vi.fn(), select: vi.fn(), eq: vi.fn(), insert: vi.fn(), update: vi.fn(), from: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser: m.auth } }) }))
vi.mock('@/lib/supabase/service', () => ({ createUserDataClient: async () => ({ from: m.from }) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: vi.fn(), unstable_rethrow: vi.fn() }))
import { addDailyBudget, updateDailyBudget } from './actions'
const row = { id: 'b', descricao: 'Mercado', categoria: '', mes_referencia: null, valor_mensal: '123.45' }
beforeEach(() => {
 vi.clearAllMocks(); m.auth.mockResolvedValue({ data: { user: { id: 'owner' } } })
 m.select.mockResolvedValue({ data: [row], error: null }); m.eq.mockReturnValue({ eq: m.eq, select: m.select })
 m.insert.mockReturnValue({ select: m.select }); m.update.mockReturnValue({ eq: m.eq }); m.from.mockReturnValue({ insert: m.insert, update: m.update })
})
it('add returns only the persisted representation in the same authenticated request', async () => {
 const result = await addDailyBudget({ descricao: ' Mercado ', valor_mensal: 123.45 })
 expect(result).toEqual({ success: true, budget: { ...row, valor_mensal: 123.45 } }); expect(m.insert).toHaveBeenCalledWith({ user_id: 'owner', descricao: 'Mercado', categoria: '', valor_mensal: 123.45 }); expect(m.from).toHaveBeenCalledTimes(1)
})
it('update filters the session owner and id and returns the persisted row', async () => {
 expect((await updateDailyBudget('b', 123.45, 'Mercado')).budget?.valor_mensal).toBe(123.45)
 expect(m.eq).toHaveBeenCalledWith('user_id', 'owner'); expect(m.eq).toHaveBeenCalledWith('id', 'b')
})
it.each([[], null])('no returned row means no confirmation', async rows => {
 m.select.mockResolvedValue({ data: rows, error: null }); expect((await addDailyBudget({ descricao: 'Mercado', valor_mensal: 10 })).success).toBe(false); expect((await updateDailyBudget('other', 10)).success).toBe(false)
})
it('database rejection never returns a budget', async () => {
 m.select.mockResolvedValue({ data: null, error: { message: 'RLS' } }); const result = await addDailyBudget({ descricao: 'Mercado', valor_mensal: 10 }); expect(result.success).toBe(false); expect(result.budget).toBeUndefined()
})
it('no session means no financial query', async () => {
 m.auth.mockResolvedValue({ data: { user: null } }); expect((await addDailyBudget({ descricao: 'Mercado', valor_mensal: 10 })).success).toBe(false); expect(m.from).not.toHaveBeenCalled()
})
