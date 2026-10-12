import { beforeEach, expect, it, vi } from 'vitest'
const m = vi.hoisted(() => ({ single: vi.fn(), eq: vi.fn(), service: vi.fn() }))
vi.mock('@/lib/supabase/service', () => ({ createUserDataClient: m.service }))
import { getUserSettings } from './queries'
beforeEach(() => {
  vi.clearAllMocks()
  const chain = { select: () => chain, eq: m.eq, maybeSingle: m.single }
  m.eq.mockReturnValue(chain); m.service.mockReturnValue({ from: () => chain })
})
it('somente ausência sem erro retorna null', async () => {
  m.single.mockResolvedValue({ data: null, error: null })
  expect(await getUserSettings('owner')).toBeNull()
  expect(m.eq).toHaveBeenCalledWith('user_id', 'owner')
})
it.each(['PGRST116', '42P01', 'timeout'])('erro %s nunca é ausência', async code => {
  m.single.mockResolvedValue({ data: null, error: { code } })
  await expect(getUserSettings('owner')).rejects.toThrow()
})
it('saldo zero válido é configuração existente', async () => {
  m.single.mockResolvedValue({ data: { saldo_abertura: '0.00', data_ancora: '2026-10-12' }, error: null })
  expect(await getUserSettings('owner')).toEqual({ saldo_abertura: 0, data_ancora: '2026-10-12' })
})
it.each([{ saldo_abertura: null, data_ancora: '2026-10-12' }, { saldo_abertura: 0, data_ancora: '2026-02-30' }])('registro inválido não é sobrescrito', async data => {
  m.single.mockResolvedValue({ data, error: null })
  await expect(getUserSettings('owner')).rejects.toThrow()
})
