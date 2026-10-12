import { beforeEach, describe, expect, it, vi } from 'vitest'
const mock = vi.hoisted(() => ({ auth: vi.fn(), db: vi.fn(), revalidate: vi.fn(), eq: vi.fn(), upsert: vi.fn(), del: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser: mock.auth } }) }))
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: mock.db }))
vi.mock('next/cache', () => ({ revalidatePath: mock.revalidate }))
vi.mock('next/navigation', () => ({ redirect: vi.fn(), unstable_rethrow: vi.fn() }))
import { saveDailyActual } from './actions'
beforeEach(() => {
  vi.clearAllMocks(); vi.stubEnv('DIARIO_INTELIGENTE_ENABLED', 'true')
  mock.auth.mockResolvedValue({ data: { user: { id: 'owner' } } })
  mock.eq.mockReturnValue({ eq: mock.eq, error: null })
  mock.del.mockReturnValue({ eq: mock.eq })
  mock.upsert.mockResolvedValue({ error: null })
  mock.db.mockReturnValue({ from: () => ({ upsert: mock.upsert, delete: mock.del }) })
})
describe('persistência Diário (Supabase simulado, sem rede)', () => {
  it('persiste zero como realização, com proprietário da sessão', async () => { expect((await saveDailyActual('2026-01-01', 0)).success).toBe(true); expect(mock.upsert).toHaveBeenCalledWith({ user_id: 'owner', data: '2026-01-01', valor: 0 }, { onConflict: 'user_id,data' }) })
  it('exclusão filtra usuário e data', async () => { await saveDailyActual('2026-01-01', null); expect(mock.eq).toHaveBeenCalledWith('user_id', 'owner'); expect(mock.eq).toHaveBeenCalledWith('data', '2026-01-01') })
  it.each([-1, NaN, Infinity, 1.001, 1000000000])('rejeita valor inválido %s antes do banco', async value => { expect((await saveDailyActual('2026-01-01', value)).success).toBe(false); expect(mock.db).not.toHaveBeenCalled() })
  it('rejeita data impossível', async () => { expect((await saveDailyActual('2026-02-30', 0)).success).toBe(false); expect(mock.db).not.toHaveBeenCalled() })
  it('bloqueia escrita sem feature habilitada', async () => { vi.stubEnv('DIARIO_INTELIGENTE_ENABLED', 'false'); expect((await saveDailyActual('2026-01-01', 10)).success).toBe(false); expect(mock.db).not.toHaveBeenCalled() })
  it('bloqueia usuário sem sessão', async () => { mock.auth.mockResolvedValue({ data: { user: null } }); expect((await saveDailyActual('2026-01-01', 10)).success).toBe(false); expect(mock.db).not.toHaveBeenCalled() })
  it('não anuncia sucesso após falha do banco', async () => { mock.upsert.mockResolvedValue({ error: { code: 'failure' } }); expect((await saveDailyActual('2026-01-01', 10)).success).toBe(false); expect(mock.revalidate).not.toHaveBeenCalled() })
})
