// Browser geometry/interaction fixtures only. Never imported by app routes.
import type { DailyExpense,ExpenseInput,ExpenseCategory } from '@/lib/daily-expenses'
let expenses:DailyExpense[]=[]
const categories:ExpenseCategory[]=[]
export async function loadExpenseMonth(month:string) { return {success:true as const,data:{expenses:expenses.filter(e=>e.expense_date.startsWith(month)),categories:[...categories],days:[],actuals:[...new Set(expenses.map(e=>e.expense_date))].filter(date=>date.startsWith(month)).map(data=>({data,valor:expenses.filter(e=>e.expense_date===data).reduce((s,e)=>s+e.amount,0)})),budgets:[{id:'budget',descricao:'Diário',categoria:'Outros',mes_referencia:null,valor_mensal:3100}]}} }
export async function saveExpense(input:ExpenseInput) {expenses=expenses.filter(e=>e.id!==input.id);expenses.unshift({...input,created_at:new Date().toISOString(),updated_at:new Date().toISOString()});return {success:true}}
export async function removeExpense(id:string) {expenses=expenses.filter(e=>e.id!==id);return {success:true}}
export async function createExpenseCategory(name:string) {const category={id:crypto.randomUUID(),name};categories.push(category);return {success:true,category}}
