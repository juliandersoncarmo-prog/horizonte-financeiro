import { beforeEach, expect, it, vi } from 'vitest'
const mock = vi.hoisted(() => ({ auth: vi.fn(), db: vi.fn(), from: vi.fn(), rpc: vi.fn(), revalidate: vi.fn(), result: { data: [{ id: 'ok' }] as unknown, error: null as unknown }, calls: [] as [string, ...unknown[]][] }))
vi.mock('@/lib/supabase/server', () => ({ createClient: mock.db }))
vi.mock('next/cache', () => ({ revalidatePath: mock.revalidate }))
import { createCreditCard, updateCreditCard, saveCardInvoice, deleteCreditCard, deleteCardInvoice, getCreditCards } from './card-actions'
const id = '00000000-0000-0000-0000-000000000001', invoiceId = '00000000-0000-0000-0000-000000000002'
const input = { nome: ' Cartão ', dia_vencimento: 31, invoices: [{ mes_referencia: '2026-02', valor: 0 }] }
beforeEach(() => {
  vi.clearAllMocks(); vi.stubEnv('CARTOES_ENABLED', 'true'); mock.calls = []; mock.result = { data: [{ id }], error: null }
  mock.auth.mockResolvedValue({ data: { user: { id: 'owner' } }, error: null })
  const chain: Record<string, unknown> = { then: (resolve: (result: unknown) => void) => resolve(mock.result) }
  for (const method of ['select', 'insert', 'update', 'delete', 'eq', 'order']) chain[method] = (...args: unknown[]) => { mock.calls.push([method, ...args]); return chain }
  mock.from.mockImplementation(table => { mock.calls.push(['from', table]); return chain })
  mock.rpc.mockResolvedValue({ error: null })
  mock.db.mockResolvedValue({ auth: { getUser: mock.auth }, from: mock.from, rpc: mock.rpc })
})
it('criação usa RPC atômica sem receber proprietário do formulário', async () => {
  expect((await createCreditCard(input)).success).toBe(true)
  expect(mock.rpc).toHaveBeenCalledWith('create_credit_card', { p_nome: 'Cartão', p_dia: 31, p_faturas: input.invoices })
  expect(mock.from).not.toHaveBeenCalled()
})
it.each([-1, 1.001, Infinity, NaN, 1000000000])('rejeita valor %s', async valor => {
  expect((await createCreditCard({ ...input, invoices: [{ mes_referencia: '2026-02', valor }] })).success).toBe(false)
  expect(mock.db).not.toHaveBeenCalled()
})
it('valida campos, meses duplicados e limites', async () => {
  for (const row of [{ ...input, nome: '' }, { ...input, nome: 'x'.repeat(101) }, { ...input, dia_vencimento: 32 }, { ...input, dia_vencimento: 1.5 }, { ...input, invoices: [] }, { ...input, invoices: [input.invoices[0], input.invoices[0]] }, { ...input, invoices: [{ mes_referencia: '2026-13', valor: 2 }] }]) expect((await createCreditCard(row)).success).toBe(false)
  expect(mock.db).not.toHaveBeenCalled()
})
it('flag bloqueia leitura e escrita antes do cliente', async () => {
  vi.stubEnv('CARTOES_ENABLED', 'false')
  expect(await getCreditCards()).toEqual({ enabled: false, cards: [] })
  expect((await createCreditCard(input)).success).toBe(false); expect(mock.db).not.toHaveBeenCalled()
})
it('sem sessão bloqueia mutação e consulta', async () => {
  mock.auth.mockResolvedValue({ data: { user: null }, error: null })
  expect((await createCreditCard(input)).success).toBe(false)
  await expect(getCreditCards()).rejects.toThrow('Não autenticado'); expect(mock.rpc).not.toHaveBeenCalled(); expect(mock.from).not.toHaveBeenCalled()
})
it('erro de autenticação rejeita mesmo com objeto user', async () => {
  mock.auth.mockResolvedValue({ data: { user: { id: 'owner' } }, error: {} })
  expect((await createCreditCard(input)).success).toBe(false)
})
it('edição do cartão filtra id/proprietário e não altera avulsas', async () => {
  expect((await updateCreditCard(id, 'Novo', 30)).success).toBe(true)
  expect(mock.calls).toContainEqual(['eq', 'user_id', 'owner']); expect(mock.calls).toContainEqual(['eq', 'id', id])
  expect(mock.calls).toContainEqual(['from', 'credit_cards'])
})
it('nova fatura usa insert; edição filtra fatura, cartão e usuário', async () => {
  await saveCardInvoice(id, null, '2026-02', 0)
  expect(mock.calls).toContainEqual(['insert', { card_id: id, user_id: 'owner', mes_referencia: '2026-02', valor: 0 }])
  mock.calls = []; await saveCardInvoice(id, invoiceId, '2026-03', 20)
  expect(mock.calls).toContainEqual(['eq', 'id', invoiceId]); expect(mock.calls).toContainEqual(['eq', 'card_id', id]); expect(mock.calls).toContainEqual(['eq', 'user_id', 'owner'])
})
it('não sobrescreve duplicata nem anuncia sucesso', async () => {
  mock.result.error = { code: '23505' }
  expect((await saveCardInvoice(id, null, '2026-02', 2)).error).toContain('já possui')
  expect(mock.revalidate).not.toHaveBeenCalled()
})
it('delete da fatura/cartão filtra dono e não remove outras tabelas', async () => {
  await deleteCardInvoice(id, invoiceId); await deleteCreditCard(id)
  expect(mock.calls.filter(c => c[0] === 'from')).toEqual([['from', 'card_invoices'], ['from', 'credit_cards']])
  expect(mock.calls.filter(c => c[0] === 'eq' && c[1] === 'user_id')).toHaveLength(2)
})
it('zero registros afetados significa erro', async () => {
  mock.result.data = []
  expect((await deleteCreditCard(id)).success).toBe(false); expect(mock.revalidate).not.toHaveBeenCalled()
})
it('falha RPC não revalida', async () => {
  mock.rpc.mockResolvedValue({ error: {} }); expect((await createCreditCard(input)).success).toBe(false); expect(mock.revalidate).not.toHaveBeenCalled()
})
it('falha de leitura não é carteira vazia', async () => {
  mock.result.error = {}; await expect(getCreditCards()).rejects.toThrow('carregar')
})
it('consulta filtra proprietário, converte valores e ordena meses', async () => {
  mock.result.data = [{ id, nome: 'Teste', dia_vencimento: 31, card_invoices: [{ id: invoiceId, mes_referencia: '2026-03', valor: '1.20' }, { id: 'another', mes_referencia: '2026-02', valor: '0' }] }]
  const result = await getCreditCards(); expect(result.cards[0].invoices.map(i => i.valor)).toEqual([0, 1.2]); expect(mock.calls).toContainEqual(['eq', 'user_id', 'owner'])
})
it('ids inválidos rejeitados antes do banco', async () => {
  expect((await deleteCreditCard('bad')).success).toBe(false); expect((await saveCardInvoice(id, 'bad', '2026-02', 2)).success).toBe(false); expect(mock.db).not.toHaveBeenCalled()
})
