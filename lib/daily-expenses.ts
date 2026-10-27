import type { DailyActual, DailyBudget } from '@/types'
import { dailySchedule } from '@/lib/engine/projection'

export interface DailyExpense { id: string; description: string; amount: number; category_id: string | null; expense_date: string; created_at: string; updated_at: string; included_amount?: number }
export interface ExpenseCategory { id: string; name: string }
export interface ExpenseDay { expense_date: string; manual_adjustment: number | null; legacy_actual: number | null }
export interface ExpenseMonth { expenses: DailyExpense[]; categories: ExpenseCategory[]; days: ExpenseDay[]; actuals: DailyActual[]; budgets: DailyBudget[]; budgetCategories?: {budget_id:string;category_id:string}[] }
export interface ExpenseInput { id: string; description: string; amount: number; category_id: string | null; expense_date: string; reconcile?: 'included' | 'additional'; reconciliation?: Reconciliation; expected?: string }
export const validUUID = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
export function validExpenseDate(value: unknown): value is string {
 if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value<'1900-01-01') return false
 const time=Date.parse(value+'T00:00:00Z')
 return Number.isFinite(time) && new Date(time).toISOString().slice(0,10)===value
}
export function validExpense(input: ExpenseInput) {
 return input && validUUID(input.id) && typeof input.description==='string' && input.description.trim().length>0 && input.description.trim().length<=200
 && typeof input.amount==='number' && Number.isFinite(input.amount) && input.amount>0 && input.amount<=999999999
 && Math.abs(input.amount*100-Math.round(input.amount*100))<0.00001 && validExpenseDate(input.expense_date)
 && (input.category_id===null || validUUID(input.category_id)) && (input.reconcile===undefined || ['included','additional'].includes(input.reconcile))
 && (input.expected===undefined || Number.isFinite(Date.parse(input.expected)))
}
export function expenseSummary(month: string, data: ExpenseMonth) {
 const [year,m]=month.split('-').map(Number)
 const count=new Date(Date.UTC(year,m,0)).getUTCDate()
 const schedule=dailySchedule(month,count,data.budgets,data.actuals)
 const byDate: Record<string,number>={}, byCategory: Record<string,number>={}
 for (const item of data.expenses) {
  const cents=Math.round(item.amount*100)
  byDate[item.expense_date]=(byDate[item.expense_date]??0)+cents
  const cat=item.category_id??''; byCategory[cat]=(byCategory[cat]??0)+cents
 }
 return {schedule,byDate,byCategory,totalCents:Object.values(byDate).reduce((a,b)=>a+b,0),
  actualCents:data.actuals.reduce((a,b)=>a+Math.round(b.valor*100),0),
  plannedCents:data.budgets.filter(b=>!b.mes_referencia || b.mes_referencia===month).reduce((a,b)=>a+Math.round(b.valor_mensal*100),0)}
}

export interface Reconciliation { total: number; remaining: number; delta: number }
/** Pure identity-based colors: no finite palette, list position, name or storage dependency.
 * Separate hue/chroma/lightness entropy prevents the former modulo-eight collisions.
 * The same UUID retains its color through rename, month changes and new categories.
 */
export function categoryStyle(id: string | null): Record<string,string> {
 const identity=id??'uncategorized'
 let hash=2166136261, secondary=5381
 for(const char of identity) {hash=Math.imul(hash^char.charCodeAt(0),16777619)>>>0;secondary=(Math.imul(secondary,33)^char.charCodeAt(0))>>>0}
 hash=Math.imul(hash^(hash>>>16),0x85ebca6b)>>>0;hash=Math.imul(hash^(hash>>>13),0xc2b2ae35)>>>0;hash=(hash^(hash>>>16))>>>0
 const hue=(hash/4294967296*360).toFixed(6)
 const saturation=(32+secondary%2400/100).toFixed(2)
 const lightness=(92+(secondary>>>12)%400/100).toFixed(2)
 return {'--category-bg':`hsl(${hue} ${saturation}% ${lightness}%)`,'--category-fg':`hsl(${hue} ${saturation}% 28%)`,'--category-dark-bg':`hsl(${hue} 25% 19%)`,'--category-dark-fg':`hsl(${hue} ${saturation}% 80%)`}
}
export function categoryBudgets(data: ExpenseMonth) {
 const result: Record<string,number>={}
 for(const link of data.budgetCategories??[]) {
  const budget=data.budgets.find(b=>b.id===link.budget_id)
  if(budget) result[link.category_id]=(result[link.category_id]??0)+Math.round(budget.valor_mensal*100)
 }
 return result
}
export function shiftExpenseDate(date: string, days: number) {
 const next=new Date(date+'T12:00:00Z');next.setUTCDate(next.getUTCDate()+days)
 const value=next.toISOString().slice(0,10);return validExpenseDate(value)?value:date
}

export interface BudgetAlert { category: string; budget: number; spent: number; exceeded: number; month: string }
