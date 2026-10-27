import {expect,it,vi} from 'vitest'
import {ExpenseMonthCache,type MonthResult} from './expense-month-cache'
const data={expenses:[],categories:[],days:[],actuals:[],budgets:[]}
it('deduplicates concurrent loads and reuses a fresh month',async()=>{
 const cache=new ExpenseMonthCache(),load=vi.fn(async()=>({success:true as const,data}))
 await Promise.all([cache.get('2026-10',load),cache.get('2026-10',load)])
 await cache.get('2026-10',load);expect(load).toHaveBeenCalledTimes(1)
})
it('invalidates only affected months while retaining visible data',async()=>{
 const cache=new ExpenseMonthCache(),load=vi.fn(async()=>({success:true as const,data}))
 await cache.get('2026-10',load);await cache.get('2026-11',load)
 cache.invalidate(['2026-10']);expect(cache.peek('2026-10')?.data).toBe(data)
 await cache.get('2026-11',load);expect(load).toHaveBeenCalledTimes(2)
 await cache.get('2026-10',load);expect(load).toHaveBeenCalledTimes(3)
})
it('rejects invalidated responses and keeps the newer request',async()=>{
 const cache=new ExpenseMonthCache();let finish!:(value:MonthResult)=>void
 const old=cache.get('2026-10',()=>new Promise(resolve=>{finish=resolve}))
 cache.invalidate(['2026-10']);await cache.get('2026-10',async()=>({success:true,data}))
 finish({success:true,data:{...data,expenses:[]}});expect((await old).success).toBe(false)
 expect(cache.peek('2026-10')?.data).toBe(data)
})
it('expires and retries failed requests without caching errors',async()=>{
 const cache=new ExpenseMonthCache(5),load=vi.fn(async()=>({success:true as const,data}))
 await cache.get('2026-10',load);cache.peek('2026-10')!.at-=10;await cache.get('2026-10',load)
 expect(load).toHaveBeenCalledTimes(2)
 cache.invalidate();expect((await cache.get('2026-10',async()=>({success:false,error:'offline'}))).success).toBe(false)
 expect(cache.peek('2026-10')?.data).toBe(data)
 await cache.get('2026-10',load);expect(load).toHaveBeenCalledTimes(3)
})
