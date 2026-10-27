import { afterAll, beforeAll, expect, it } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
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
 await db.exec(`CREATE TABLE public.daily_budgets(id uuid primary key default gen_random_uuid(),user_id uuid references auth.users(id),descricao text,valor_mensal numeric,mes_referencia text); ALTER TABLE public.daily_budgets ENABLE ROW LEVEL SECURITY; CREATE POLICY owner ON public.daily_budgets FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid()); GRANT ALL ON public.daily_budgets TO authenticated;`)
 await db.exec(readFileSync('supabase/migrations/20261026235504_refinamentos_gastos_diario.sql','utf8'))
 await db.exec(readFileSync('supabase/migrations/20261027005337_budget_crossing_alert.sql','utf8'))
 await login()
},30000)
afterAll(async()=>{await db.close()})

async function quote(date:string,amount:number,id=uuid(),expected:string|null=null,choice='included') {
 try {await save(date,amount,null,id,expected);return id} catch(error) {
  const d=JSON.parse((error as {detail:string}).detail)
  await save(date,amount,`${choice}:${Number(d.total).toFixed(2)}:${Number(d.remaining).toFixed(2)}`,id,expected);return id
 }
}
it('keeps 100 with an included 30, persists 70 remaining and is idempotent',async()=>{
 await db.exec(`insert into daily_actuals(user_id,data,valor) values('${owner}','2026-12-01',100)`)
 const id=await quote('2026-12-01',30)
 expect(await actual('2026-12-01')).toBe('100.00')
 expect((await db.query<{manual_adjustment:string}>("select manual_adjustment from daily_expense_days where expense_date='2026-12-01'")).rows[0].manual_adjustment).toBe('70.00')
 await save('2026-12-01',30,null,id);expect(await actual('2026-12-01')).toBe('100.00')
 await db.query('select delete_daily_expense($1,$2)',[id,await timestamp(id)])
 expect(await actual('2026-12-01')).toBe('100.00')
})
it('adds 30 to 100 and removing an additional item restores 100',async()=>{
 await db.exec(`insert into daily_actuals(user_id,data,valor) values('${owner}','2026-12-02',100)`)
 const id=await quote('2026-12-02',30,uuid(),null,'additional')
 expect(await actual('2026-12-02')).toBe('130.00')
 await db.query('select delete_daily_expense($1,$2)',[id,await timestamp(id)]);expect(await actual('2026-12-02')).toBe('100.00')
})
it('repeated details consume remainder, reject overflow, and require a fresh quote',async()=>{
 await db.exec(`insert into daily_actuals(user_id,data,valor) values('${owner}','2026-12-03',100)`)
 await quote('2026-12-03',70)
 await expect(save('2026-12-03',40,'included:100.00:30.00')).rejects.toThrow(/RECONCILE_REQUIRED/)
 await expect(save('2026-12-03',10,'included:100.00:100.00')).rejects.toThrow(/RECONCILE_REQUIRED/)
 await quote('2026-12-03',40,uuid(),null,'additional');expect(await actual('2026-12-03')).toBe('140.00')
})
it('increases/decreases covered items and protects the total after later manual edits',async()=>{
 await db.exec(`insert into daily_actuals(user_id,data,valor) values('${owner}','2026-12-04',100)`)
 const id=await quote('2026-12-04',30)
 await quote('2026-12-04',40,id,await timestamp(id));expect(await actual('2026-12-04')).toBe('100.00')
 await save('2026-12-04',20,null,id,await timestamp(id));expect(await actual('2026-12-04')).toBe('100.00')
 await db.exec("update daily_actuals set valor=25 where data='2026-12-04'")
 await expect(quote('2026-12-04',30,id,await timestamp(id))).rejects.toThrow(/RECONCILE_REQUIRED/)
 expect(await actual('2026-12-04')).toBe('25.00')
 await quote('2026-12-04',30,id,await timestamp(id),'additional');expect(await actual('2026-12-04')).toBe('35.00')
})
it('moves included items between years with atomic source/destination reconciliation',async()=>{
 await db.exec(`insert into daily_actuals(user_id,data,valor) values('${owner}','2026-12-31',100),('${owner}','2027-01-01',50)`)
 const id=await quote('2026-12-31',30)
 await expect(save('2027-01-01',30,null,id,await timestamp(id))).rejects.toThrow(/RECONCILE_REQUIRED/)
 expect(await actual('2026-12-31')).toBe('100.00')
 await quote('2027-01-01',30,id,await timestamp(id));expect(await actual('2026-12-31')).toBe('100.00');expect(await actual('2027-01-01')).toBe('50.00')
 await save('2027-01-02',30,null,id,await timestamp(id));expect(await actual('2027-01-01')).toBe('50.00');expect(await actual('2027-01-02')).toBe('30.00')
})
it('auto-links budgets, deduplicates names, follows renames and retains history after deletion',async()=>{
 const b=uuid(),b2=uuid()
 await db.query('insert into daily_budgets(id,user_id,descricao,valor_mensal) values($1,$2,$3,1500),($4,$2,$5,100)',[b,owner,'Mercado',b2,' mercado '])
 const category=(await db.query<{id:string}>('select id from expense_categories where lower(name)=$1',['mercado'])).rows[0].id
 expect((await db.query('select * from budget_expense_categories where category_id=$1',[category])).rows).toHaveLength(2)
 const id=await save('2027-02-01',1650,null,uuid(),null,category)
 await db.query('update daily_budgets set descricao=$1 where id=$2',['Supermercado',b])
 expect((await db.query<{name:string}>('select name from expense_categories where id=$1',[category])).rows[0].name).toBe('Supermercado')
 await db.query('delete from daily_budgets where id in($1,$2)',[b,b2])
 expect((await db.query('select * from expense_categories where id=$1',[category])).rows).toHaveLength(1)
 expect(await actual('2027-02-01')).toBe('1650.00')
 expect((await db.query('select * from daily_expenses where id=$1',[id])).rows).toHaveLength(1)
})
it('category collision merges history without changing financial totals',async()=>{
 const b=uuid();await db.query('insert into daily_budgets(id,user_id,descricao,valor_mensal) values($1,$2,$3,50)',[b,owner,'Cursos'])
 const cat=(await db.query<{id:string}>("select id from expense_categories where name='Cursos'")).rows[0].id
 await save('2027-02-03',10,null,uuid(),null,cat)
 await db.query('update daily_budgets set descricao=$1 where id=$2',['Supermercado',b])
 expect((await db.query("select * from expense_categories where name='Cursos'")).rows).toHaveLength(0)
 expect(await actual('2027-02-03')).toBe('10.00')
})
it('isolates category links between owners and rejects anonymous RPC calls',async()=>{
 await login(other);expect((await db.query('select * from budget_expense_categories')).rows).toHaveLength(0)
 await db.exec('RESET ROLE; SET ROLE anon;')
 await expect(db.query('select * from budget_expense_categories')).rejects.toThrow(/permission/)
 await expect(save('2027-01-01',30)).rejects.toThrow(/permission/)
 await login()
})

async function alertSave(amount:number,cat:string|null,date='2028-01-01',id=uuid(),expected:string|null=null) {
 const r=await db.query<{result:{budgetAlert:null|{budget:number;spent:number;exceeded:number;month:string}}}>('select save_daily_expense_with_budget_alert($1,$2,$3,$4,$5,null,$6) as result',[id,'Alerta teste',amount,cat,date,expected]);
 return {id,alert:r.rows[0].result.budgetAlert}
}
async function alertBudget(name:string,limit=100,month:string|null='2028-01') {
 const id=uuid();await db.query('insert into daily_budgets(id,user_id,descricao,valor_mensal,mes_referencia) values($1,$2,$3,$4,$5)',[id,owner,name,limit,month]);
 return (await db.query<{id:string}>('select id from expense_categories where name=$1',[name])).rows[0].id
}
it('alerts only on crossing, saves once, rearms after deletion and honors idempotency',async()=>{
 const cat=await alertBudget('Combustível alerta')
 expect((await alertSave(100,cat)).alert).toBeNull()
 const over=await alertSave(10,cat,'2028-01-02')
 expect(over.alert).toMatchObject({budget:100,spent:110,exceeded:10,month:'2028-01'})
 expect((await alertSave(10,cat,'2028-01-02',over.id)).alert).toBeNull()
 const later=await alertSave(5,cat,'2028-01-03');expect(later.alert).toBeNull()
 await db.query('select delete_daily_expense($1,$2)',[over.id,await timestamp(over.id)])
 await db.query('select delete_daily_expense($1,$2)',[later.id,await timestamp(later.id)])
 expect((await alertSave(1,cat,'2028-01-04')).alert?.exceeded).toBe(1)
 expect(await actual('2028-01-02')).toBeNull()
})
it('edits rearm crossings; description edits while over do not alert',async()=>{
 const cat=await alertBudget('Edição alerta');const item=await alertSave(90,cat,'2028-01-05')
 expect((await alertSave(110,cat,'2028-01-05',item.id,await timestamp(item.id))).alert?.exceeded).toBe(10)
 expect((await alertSave(110,cat,'2028-01-05',item.id,await timestamp(item.id))).alert).toBeNull()
 expect((await alertSave(80,cat,'2028-01-05',item.id,await timestamp(item.id))).alert).toBeNull()
 expect((await alertSave(105,cat,'2028-01-05',item.id,await timestamp(item.id))).alert?.exceeded).toBe(5)
 expect(await actual('2028-01-05')).toBe('105.00')
})
it('moves categories/months, respects month-specific budgets and ignores missing budgets',async()=>{
 const cat=await alertBudget('Mudança alerta');const free=uuid()
 await db.query('insert into expense_categories(id,user_id,name) values($1,$2,$3)',[free,owner,'Sem limite alerta'])
 const item=await alertSave(110,free,'2028-01-06');expect(item.alert).toBeNull()
 expect((await alertSave(110,cat,'2028-01-06',item.id,await timestamp(item.id))).alert?.exceeded).toBe(10)
 expect((await alertSave(110,cat,'2028-02-06',item.id,await timestamp(item.id))).alert).toBeNull()
 expect((await alertSave(110,cat,'2028-01-06',item.id,await timestamp(item.id))).alert?.exceeded).toBe(10)
 expect((await alertSave(1000,null,'2028-01-07')).alert).toBeNull()
})
it('handles zero and summed recurring/monthly budgets and denies anon execution',async()=>{
 const zero=await alertBudget('Zero alerta',0)
 expect((await alertSave(1,zero,'2028-01-08')).alert?.exceeded).toBe(1)
 const cat=await alertBudget('Soma alerta',50,null);await alertBudget('Soma alerta',50)
 expect((await alertSave(100,cat,'2028-01-09')).alert).toBeNull()
 expect((await alertSave(5,cat,'2028-01-10')).alert?.budget).toBe(100)
 await db.exec('RESET ROLE; SET ROLE anon;')
 await expect(alertSave(1,cat)).rejects.toThrow(/permission/)
 await login(other);expect((await alertSave(1,null,'2028-01-11')).alert).toBeNull()
 await login()
})
