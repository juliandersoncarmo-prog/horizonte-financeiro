import { afterAll, beforeAll, expect, it } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { runProjection } from './engine/projection'
const db=new PGlite()
const owner='10000000-0000-4000-8000-000000000001', other='10000000-0000-4000-8000-000000000002'
let seq=0
const uuid=()=>`20000000-0000-4000-8000-${String(++seq).padStart(12,'0')}`
async function login(user=owner) { await db.exec(`RESET ROLE; SET ROLE authenticated; SET request.jwt.claim.sub='${user}';`) }
async function actual(date:string) {return (await db.query<{valor:string}>('select valor from daily_actuals where data=$1',[date])).rows[0]?.valor??null}
async function save(date:string,amount:number,mode:string|null=null,id=uuid(),expected:string|null=null,cat:string|null=null) {
 await db.query('select save_daily_expense($1,$2,$3,$4,$5,$6,$7)',[id,'Gasto de teste',amount,cat,date,mode,expected]);return id
}
async function timestamp(id:string) {return (await db.query<{stamp:string}>('select updated_at::text as stamp from daily_expenses where id=$1',[id])).rows[0].stamp}
beforeAll(async()=>{
 await db.exec(`CREATE ROLE authenticated;CREATE ROLE anon;CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid primary key);CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;GRANT USAGE ON SCHEMA auth TO authenticated,anon;GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated,anon;INSERT INTO auth.users VALUES('${owner}'),('${other}');`)
 await db.exec(readFileSync('migrations/003_diario_inteligente.sql','utf8').replaceAll(/ALTER TABLE public\.(transactions|recurring_rules)[^;]+;/g,''))
 await db.exec(readFileSync('supabase/migrations/20261026213250_gastos_do_diario.sql','utf8'))
 await login()
},30000)
afterAll(async()=>{await db.close()})
it('creates, retries without duplication, edits and deletes while maintaining cents',async()=>{
 const id=await save('2026-10-01',0.1);await save('2026-10-01',0.2)
 expect(await actual('2026-10-01')).toBe('0.30')
 await save('2026-10-01',0.1,null,id)
 expect(await actual('2026-10-01')).toBe('0.30')
 const stamp=await timestamp(id)
 await save('2026-10-01',1.23,null,id,stamp)
 expect(await actual('2026-10-01')).toBe('1.43')
 await expect(save('2026-10-01',99,null,id,stamp)).rejects.toThrow(/mudou/)
 await db.query('select delete_daily_expense($1,$2)',[id,await timestamp(id)])
 expect(await actual('2026-10-01')).toBe('0.20')
})
it('requires explicit reconciliation and archives the original manual total',async()=>{
 await db.exec(`insert into daily_actuals(user_id,data,valor) values('${owner}','2026-10-02',80),('${owner}','2026-10-03',80)`)
 await expect(save('2026-10-02',10)).rejects.toThrow(/RECONCILE_REQUIRED/)
 expect(await actual('2026-10-02')).toBe('80.00')
 await save('2026-10-02',10,'preserve');expect(await actual('2026-10-02')).toBe('90.00')
 await save('2026-10-03',10,'replace');expect(await actual('2026-10-03')).toBe('10.00')
 const rows=(await db.query<{legacy_actual:string}>('select legacy_actual from daily_expense_days where expense_date in ($1,$2) order by expense_date',['2026-10-02','2026-10-03'])).rows
 expect(rows.map(r=>r.legacy_actual)).toEqual(['80.00','80.00'])
})
it('recomputes source/destination when moving an expense across months',async()=>{
 const id=await save('2026-09-30',100)
 await save('2026-10-04',80,null,id,await timestamp(id))
 expect(await actual('2026-09-30')).toBe(null);expect(await actual('2026-10-04')).toBe('80.00')
 const history=(await db.query<{expense_date:string}>('select expense_date::text as expense_date from daily_expenses where expense_date >= $1 and expense_date < $2',['2026-10-01','2026-11-01'])).rows
 expect(history.some(r=>r.expense_date==='2026-10-04')).toBe(true)
})
it('preserves manual overrides and protects detailed expenses from old inline writes',async()=>{
 const id=await save('2026-10-05',20)
 await db.exec(`update daily_actuals set valor=50 where data='2026-10-05'`)
 await save('2026-10-05',25,null,id,await timestamp(id))
 expect(await actual('2026-10-05')).toBe('55.00')
 await expect(db.exec(`update daily_actuals set valor=10 where data='2026-10-05'`)).rejects.toThrow(/menor/)
 await expect(db.exec(`delete from daily_actuals where data='2026-10-05'`)).rejects.toThrow(/detalhados/)
 await db.query('select delete_daily_expense($1,$2)',[id,await timestamp(id)])
 expect(await actual('2026-10-05')).toBe('30.00')
})
it('distinguishes absent days, explicit zero and deletion of the last item',async()=>{
 const id=await save('2026-10-06',1)
 await db.query('select delete_daily_expense($1,$2)',[id,await timestamp(id)])
 expect(await actual('2026-10-06')).toBe(null)
 await db.exec(`insert into daily_actuals(user_id,data,valor) values('${owner}','2026-10-07',0)`)
 const zero=await save('2026-10-07',1,'preserve')
 await db.query('select delete_daily_expense($1,$2)',[zero,await timestamp(zero)])
 expect(await actual('2026-10-07')).toBe('0.00')
})
it('enforces RLS for read/update/delete and category ownership at the database',async()=>{
 const id=await save('2026-10-08',10), cat=uuid()
 await db.exec(`insert into expense_categories(id,user_id,name) values('${cat}','${owner}','Alimentação')`)
 await login(other)
 expect((await db.query('select * from daily_expenses where id=$1',[id])).rows).toEqual([])
 expect((await db.query('select * from daily_actuals')).rows).toEqual([])
 expect((await db.query('select * from daily_expense_days')).rows).toEqual([])
 expect((await db.query('select * from expense_categories')).rows).toEqual([])
 await expect(db.query('select delete_daily_expense($1,$2)',[id,'2026-01-01'])).rejects.toThrow()
 await expect(save('2026-10-08',10,null,uuid(),null,cat)).rejects.toThrow(/foreign key/)
 await expect(db.query('insert into expense_categories(user_id,name) values($1,$2)',[owner,'Inválida'])).rejects.toThrow(/row-level security/)
 await db.exec('RESET ROLE; SET ROLE anon;')
 await expect(db.query('select * from daily_expenses')).rejects.toThrow(/permission denied/)
 await expect(db.query('select save_daily_expense($1,$2,$3,$4,$5)',[uuid(),'Inválido',1,null,'2026-10-09'])).rejects.toThrow(/permission denied/)
 await login()
})
it('rejects invalid input in SQL and rolls back an entire edit on destination conflict',async()=>{
 for(const amount of [0,-1,1.001,1000000000]) await expect(save('2026-10-10',amount)).rejects.toThrow()
 const id=await save('2026-10-10',10)
 await db.exec(`insert into daily_actuals(user_id,data,valor) values('${owner}','2026-10-11',20)`)
 await expect(save('2026-10-11',10,null,id,await timestamp(id))).rejects.toThrow(/RECONCILE_REQUIRED/)
 expect(await actual('2026-10-10')).toBe('10.00');expect(await actual('2026-10-11')).toBe('20.00')
})
it('feeds the unchanged projection engine once: savings, excess, retroactivity and month closure',async()=>{
 const input={settings:{saldo_abertura:10000,data_ancora:'2026-11-01'},transactions:[],recurringRules:[],dailyBudgets:[{id:'budget',descricao:'Diário',categoria:'Outros',mes_referencia:null,valor_mensal:3000}],horizonMonths:2,todayISO:'2026-11-01'}
 const id=await save('2026-11-10',80)
 async function project() {
  const dailyActuals=(await db.query<{data:string;valor:string}>('select data::text as data,valor from daily_actuals')).rows.map(r=>({data:r.data,valor:Number(r.valor)}))
  return runProjection({...input,dailyActuals})
 }
 let result=await project();expect(result.months[0].days[10].diario).toBe(101)
 expect(result.months[0].saldoFechamento).toBe(7000)
 await save('2026-11-10',120,null,id,await timestamp(id))
 result=await project();expect(result.months[0].days[10].diario).toBe(99)
 expect(result.months[0].saldoFechamento).toBe(7000)
 await save('2026-11-01',50)
 result=await project();expect(result.months[0].days[0].diarioRealizado).toBe(50)
 expect(result.months[0].days[9].diarioRealizado).toBe(120)
 expect(result.months[0].saldoFechamento).toBe(7000)
 await save('2026-11-30',5000)
 result=await project();expect(result.months[0].days[29].diario).toBe(5000)
 expect(result.months[1].saldoAbertura).toBe(result.months[0].saldoFechamento)
 expect(result.months[1].days.reduce((s,d)=>s+Math.round(d.diario*100),0)).toBe(300000)
})
