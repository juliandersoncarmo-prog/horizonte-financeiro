import { beforeEach, expect, it, vi } from 'vitest'
const m = vi.hoisted(() => ({ auth: vi.fn(), db: vi.fn(), calls: [] as unknown[][], result: { data: [{id:'ok'}] as unknown, error: null as unknown } }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: {getUser:m.auth} }) }))
vi.mock('@/lib/supabase/service', () => ({ createUserDataClient:m.db }))
vi.mock('next/cache', () => ({ revalidatePath:vi.fn() }))
vi.mock('next/navigation', () => ({ redirect:vi.fn(), unstable_rethrow:vi.fn() }))
import { deleteTransaction, deleteRecurringRule, updateTransaction, updateRecurringRule } from './actions'
const id = '11111111-1111-4111-8111-111111111111'
beforeEach(() => {
  vi.clearAllMocks(); m.calls=[]; m.result={data:[{id}],error:null}
  m.auth.mockResolvedValue({data:{user:{id:'owner'}},error:null})
  const chain: Record<string,unknown>={then:(resolve:(result:unknown)=>void)=>resolve(m.result)}
  for(const method of ['delete','update','eq','select']) chain[method]=(...args:unknown[])=>{m.calls.push([method,...args]);return chain}
  m.db.mockResolvedValue({from:(table:string)=>{m.calls.push(['from',table]);return chain}})
})
it('deletes only selected transaction with session owner and returning verification',async()=>{
  expect(await deleteTransaction(id)).toEqual({success:true})
  expect(m.calls).toEqual([['from','transactions'],['delete'],['eq','id',id],['eq','user_id','owner'],['select','id']])
})
it('legacy whole-rule deletion is blocked for stale clients',async()=>{
  expect((await deleteRecurringRule(id,'occurrence' as 'all-occurrences')).success).toBe(false);expect(m.db).not.toHaveBeenCalled()
  expect((await deleteRecurringRule(id,'all-occurrences')).success).toBe(false);expect(m.db).not.toHaveBeenCalled()
})
it('blocks absent session before database',async()=>{
  m.auth.mockResolvedValue({data:{user:null}})
  expect((await deleteTransaction(id)).success).toBe(false);expect(m.db).not.toHaveBeenCalled()
})
it('invalid ids cannot widen deletion',async()=>{
  for(const value of ['', 'all', '*', undefined]) expect((await deleteTransaction(value as string)).success).toBe(false)
  expect(m.db).not.toHaveBeenCalled()
})
it.each([[],null])('foreign/missing records never report success, returned %s',async data=>{
  m.result.data=data
  expect((await deleteTransaction(id)).success).toBe(false)
  expect((await deleteRecurringRule(id,'all-occurrences')).success).toBe(false)
  expect((await updateTransaction(id,{descricao:'x',valor:0.01})).success).toBe(false)
  expect((await updateRecurringRule(id,{descricao:'x',valor:0.01})).success).toBe(false)
})
it('database failure never reports success',async()=>{m.result.error={code:'42501'};expect((await deleteTransaction(id)).success).toBe(false)})

it('changes transaction date with ownership filters and rejects impossible dates',async()=>{
 expect((await updateTransaction(id,{descricao:'Nova',valor:30,data:'2026-11-02'})).success).toBe(true)
 expect(m.calls).toContainEqual(['update',{descricao:'Nova',valor:30,data:'2026-11-02'}]);expect(m.calls).toContainEqual(['eq','user_id','owner'])
 m.calls=[];m.db.mockClear();expect((await updateTransaction(id,{descricao:'x',valor:10,data:'2026-02-30'})).success).toBe(false);expect(m.db).not.toHaveBeenCalled()
})
it('persists complete recurring schedule and refuses incomplete or invalid termination',async()=>{
 const rule={descricao:'Regra',valor:50,frequencia:'quinzenal' as const,dia_do_mes:10,data_inicio:'2026-09-01',modo_termino:'ocorrencias' as const,valor_termino:'8'}
 expect((await updateRecurringRule(id,rule)).success).toBe(true);expect(m.calls).toContainEqual(['update',rule])
 for(const invalid of [{...rule,valor_termino:'0'},{...rule,dia_do_mes:32},{...rule,data_inicio:'2026-02-30'},{...rule,modo_termino:'data' as const,valor_termino:'2026-08-01'}]) expect((await updateRecurringRule(id,invalid)).success).toBe(false)
 expect((await updateRecurringRule(id,{descricao:'x',valor:10,frequencia:'mensal'})).success).toBe(false)
})
