import { beforeEach, expect, it, vi } from 'vitest'
const mock = vi.hoisted(() => ({ service: vi.fn(), eq: vi.fn(), select: vi.fn(), from: vi.fn() }))
vi.mock('@/lib/supabase/service', () => ({ createUserDataClient: mock.service }))
import { getDailyActuals } from './queries'
beforeEach(() => {
  vi.clearAllMocks(); vi.stubEnv('DIARIO_INTELIGENTE_ENABLED', 'true')
  mock.eq.mockResolvedValue({ data: [{ data: '2026-01-01', valor: '0.00' }], error: null })
  mock.select.mockReturnValue({ eq: mock.eq }); mock.from.mockReturnValue({ select: mock.select }); mock.service.mockReturnValue({ from: mock.from })
})
it('não consulta tabela nova com Diário desabilitado/ausente', async () => {
  vi.stubEnv('DIARIO_INTELIGENTE_ENABLED', '')
  expect(await getDailyActuals('owner')).toEqual([]); expect(mock.service).not.toHaveBeenCalled()
})
it('leitura do Diário usa proprietário e preserva zero informado', async () => {
  expect(await getDailyActuals('owner')).toEqual([{ data: '2026-01-01', valor: 0 }])
  expect(mock.eq).toHaveBeenCalledWith('user_id', 'owner')
})
it('falha de migração/leitura não resulta em Diário vazio', async () => {
  mock.eq.mockResolvedValue({ data: null, error: { code: '42P01' } })
  await expect(getDailyActuals('owner')).rejects.toThrow('carregar o Diário')
})
