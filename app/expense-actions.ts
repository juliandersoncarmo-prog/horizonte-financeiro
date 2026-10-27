'use server'
import { createUserDataClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { validExpense, validExpenseDate, validUUID } from '@/lib/daily-expenses'
import type { ExpenseInput, ExpenseMonth } from '@/lib/daily-expenses'

async function session() {
 if(process.env.GASTOS_DIARIO_ENABLED!=='true' || process.env.DIARIO_INTELIGENTE_ENABLED!=='true') throw new Error('Gastos do Diário ainda não está disponível nesta versão.')
 const db=await createUserDataClient()
 const {data:{user},error}=await db.auth.getUser()
 if(error || !user) throw new Error('Sessão expirada. Entre novamente.')
 return {db,user}
}
function message(error: unknown) { return error instanceof Error ? error.message : 'Não foi possível concluir. Recarregue e confira os dados antes de tentar novamente.' }
export async function loadExpenseMonth(month: string): Promise<{success:true;data:ExpenseMonth}|{success:false;error:string}> {
 try {
  if(!validExpenseDate(month+'-01')) throw new Error('Mês inválido.')
  const {db,user}=await session()
  // Paginate instead of silently truncating history at PostgREST's row limit.
  const expenses: ExpenseMonth['expenses']=[]
  const [y,m]=month.split('-').map(Number), end=`${month}-${new Date(Date.UTC(y,m,0)).getUTCDate()}`
  const expensePromise=(async()=>{
  for(let offset=0;;offset+=500) {
   const {data,error}=await db.from('daily_expenses').select('id,description,amount,category_id,expense_date,created_at,updated_at,included_amount').eq('user_id',user.id).gte('expense_date',month+'-01').lte('expense_date',end).order('created_at',{ascending:false}).order('id').range(offset,offset+499)
   if(error) throw new Error('Não foi possível carregar os gastos. Confira sua conexão e tente novamente.')
   expenses.push(...(data??[]).map(row=>({...row,amount:Number(row.amount)})))
   if(!data || data.length<500) break
  }
  })()
  const [results]=await Promise.all([Promise.all([
   db.from('expense_categories').select('id,name').eq('user_id',user.id).order('name'),
   db.from('daily_expense_days').select('expense_date,manual_adjustment,legacy_actual').eq('user_id',user.id).gte('expense_date',month+'-01').lte('expense_date',end),
   db.from('daily_actuals').select('data,valor').eq('user_id',user.id).gte('data',month+'-01').lte('data',end),
   db.from('daily_budgets').select('id,descricao,categoria,mes_referencia,valor_mensal').eq('user_id',user.id).or(`mes_referencia.is.null,mes_referencia.eq.${month}`),
   db.from('budget_expense_categories').select('budget_id,category_id').eq('user_id',user.id),
  ]),expensePromise])
  if(results.some(r=>r.error)) throw new Error('Não foi possível carregar o histórico completo.')
  return {success:true,data:{expenses,budgetCategories:results[4].data??[],categories:results[0].data??[],days:(results[1].data??[]).map(r=>({...r,manual_adjustment:r.manual_adjustment===null?null:Number(r.manual_adjustment),legacy_actual:r.legacy_actual===null?null:Number(r.legacy_actual)})),actuals:(results[2].data??[]).map(r=>({...r,valor:Number(r.valor)})),budgets:(results[3].data??[]).map(r=>({...r,valor_mensal:Number(r.valor_mensal)}))}}
 } catch(error) {return {success:false,error:message(error)}}
}
export async function saveExpense(input: ExpenseInput) {
 try {
  if(!validExpense(input)) throw new Error('Informe descrição, valor positivo com até dois decimais e data válida.')
  const {db}=await session()
  const {error}=await db.rpc('save_daily_expense',{p_id:input.id,p_description:input.description.trim(),p_amount:input.amount,p_category:input.category_id,p_date:input.expense_date,p_reconcile:input.reconcile&&input.reconciliation?`${input.reconcile}:${input.reconciliation.total.toFixed(2)}:${input.reconciliation.remaining.toFixed(2)}`:null,p_expected:input.expected??null})
  if(error) {
   if(error.message.includes('RECONCILE_REQUIRED')) {
    let reconciliation: import('@/lib/daily-expenses').Reconciliation | undefined
    try { const v=JSON.parse(error.details??''); if([v.total,v.remaining,v.delta].every((n:unknown)=>typeof n==='number'&&Number.isFinite(n))) reconciliation=v } catch {}
    return {success:false,error:'Confirme se este gasto já está no total informado.',reconcile:true,reconciliation}
   }
   return {success:false,error:error.message}
  }
  revalidatePath('/','layout')
  return {success:true}
 } catch(error) {return {success:false,error:message(error)}}
}
export async function removeExpense(id: string,expected: string) {
 try {
  if(!validUUID(id) || typeof expected!=='string' || !Number.isFinite(Date.parse(expected))) throw new Error('Gasto inválido.')
  const {db}=await session()
  const {error}=await db.rpc('delete_daily_expense',{p_id:id,p_expected:expected})
  if(error) throw new Error('Não foi possível excluir. O gasto pode ter mudado; recarregue e tente novamente.')
  revalidatePath('/','layout'); return {success:true}
 } catch(error) {return {success:false,error:message(error)}}
}
export async function createExpenseCategory(name: string) {
 try {
  if(typeof name!=='string' || !name.trim() || name.trim().length>60) throw new Error('Use um nome de categoria com 1 a 60 caracteres.')
  const {db,user}=await session()
  const {data,error}=await db.from('expense_categories').insert({user_id:user.id,name:name.trim()}).select('id,name').single()
  if(error || !data) throw new Error(error?.code==='23505'?'Já existe uma categoria com esse nome.':'Não foi possível criar a categoria.')
  return {success:true,category:data}
 } catch(error) {return {success:false,error:message(error)}}
}
