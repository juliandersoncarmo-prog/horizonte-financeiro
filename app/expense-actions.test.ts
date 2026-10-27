import {beforeEach,expect,it,vi} from 'vitest'
const m=vi.hoisted(()=>({auth:vi.fn(),rpc:vi.fn(),client:vi.fn(),from:vi.fn(),revalidate:vi.fn()}))
vi.mock('@/lib/supabase/service',()=>({createUserDataClient:m.client}))
vi.mock('next/cache',()=>({revalidatePath:m.revalidate}))
import {loadExpenseMonth,saveExpense,removeExpense,createExpenseCategory} from './expense-actions'
const input={id:'10000000-0000-4000-8000-000000000001',description:'Café',amount:10,category_id:null,expense_date:'2026-10-26'}
beforeEach(()=>{
 vi.clearAllMocks();vi.stubEnv('GASTOS_DIARIO_ENABLED','true');vi.stubEnv('DIARIO_INTELIGENTE_ENABLED','true')
 m.auth.mockResolvedValue({data:{user:{id:'owner'}},error:null});m.rpc.mockResolvedValue({data:input.id,error:null})
 m.client.mockResolvedValue({auth:{getUser:m.auth},rpc:m.rpc,from:m.from})
})
it('uses the authenticated RPC without accepting a client owner',async()=>{
 expect((await saveExpense(input)).success).toBe(true)
 expect(m.rpc).toHaveBeenCalledWith('save_daily_expense',{p_id:input.id,p_description:'Café',p_amount:10,p_category:null,p_date:input.expense_date,p_reconcile:null,p_expected:null})
 expect(m.revalidate).toHaveBeenCalledWith('/','layout')
})
it('propagates reconciliation before claiming success',async()=>{
 m.rpc.mockResolvedValue({error:{message:'RECONCILE_REQUIRED'}})
 expect(await saveExpense(input)).toMatchObject({success:false,reconcile:true});expect(m.revalidate).not.toHaveBeenCalled()
})
it('blocks writes without feature flags or authentication',async()=>{
 vi.stubEnv('GASTOS_DIARIO_ENABLED','false');expect((await saveExpense(input)).success).toBe(false);expect(m.client).not.toHaveBeenCalled()
 vi.stubEnv('GASTOS_DIARIO_ENABLED','true');m.auth.mockResolvedValue({data:{user:null},error:null})
 expect((await saveExpense(input)).success).toBe(false);expect(m.rpc).not.toHaveBeenCalled()
})
it('validates inputs before persistence',async()=>{
 expect((await saveExpense({...input,expense_date:'2026-02-30'})).success).toBe(false)
 expect((await removeExpense('invalid','2026-10-26')).success).toBe(false)
 expect((await createExpenseCategory('')).success).toBe(false)
 expect((await loadExpenseMonth('2026-13')).success).toBe(false);expect(m.client).not.toHaveBeenCalled()
})
it('checks delete concurrency token and never reports failed deletes as success',async()=>{
 m.rpc.mockResolvedValue({error:{message:'stale'}})
 expect((await removeExpense(input.id,'2026-10-26T12:00:00Z')).success).toBe(false)
 expect(m.rpc).toHaveBeenCalledWith('delete_daily_expense',{p_id:input.id,p_expected:'2026-10-26T12:00:00Z'});expect(m.revalidate).not.toHaveBeenCalled()
})
it('paginates history and includes ownership and month boundaries',async()=>{
 const filters:unknown[][]=[];let pages=0
 m.from.mockImplementation((table:string)=>{
  const data=table==='daily_expenses'?null:[]
  const query={select:vi.fn(()=>query),eq:vi.fn((...args:unknown[])=>{filters.push([table,...args]);return query}),gte:vi.fn((...args:unknown[])=>{filters.push([table,...args]);return query}),lte:vi.fn((...args:unknown[])=>{filters.push([table,...args]);return query}),order:vi.fn(()=>query),or:vi.fn(()=>query),range:vi.fn(async()=>({data:++pages===1?Array.from({length:500},()=>({...input,amount:'10'})):[],error:null})),then:(resolve:(v:unknown)=>void)=>Promise.resolve({data,error:null}).then(resolve)}
  return query
 })
 const result=await loadExpenseMonth('2024-02');expect(result.success).toBe(true)
 if(result.success)expect(result.data.expenses).toHaveLength(500)
 expect(pages).toBe(2);expect(filters).toContainEqual(['daily_expenses','expense_date','2024-02-29'])
 expect(filters.filter(f=>f[1]==='user_id').every(f=>f[2]==='owner')).toBe(true)
})

it('passes the exact server quote back and exposes fresh conflict details',async()=>{
 m.rpc.mockResolvedValue({error:{message:'RECONCILE_REQUIRED',details:JSON.stringify({total:100,remaining:70,delta:30})}})
 const result=await saveExpense({...input,reconcile:'included',reconciliation:{total:100,remaining:70,delta:30}})
 expect(m.rpc).toHaveBeenCalledWith('save_daily_expense',expect.objectContaining({p_reconcile:'included:100.00:70.00'}))
 expect(result).toMatchObject({success:false,reconcile:true,reconciliation:{total:100,remaining:70,delta:30}})
})
