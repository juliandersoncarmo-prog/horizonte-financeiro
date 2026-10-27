import { expect,it } from 'vitest'
import { expenseSummary,validExpense,validExpenseDate } from './daily-expenses'
const input={id:'10000000-0000-4000-8000-000000000001',description:'Café',amount:1,category_id:null,expense_date:'2026-10-26'}
it.each([0,-1,NaN,Infinity,1.001,1000000000])('rejects invalid money %s',amount=>expect(validExpense({...input,amount})).toBe(false))
it('validates civil dates and amount without accepting rollover',()=>{
 expect(validExpenseDate('2026-02-29')).toBe(false);expect(validExpenseDate('2024-02-29')).toBe(true)
 expect(validExpense({...input,description:'  '})).toBe(false);expect(validExpense({...input,amount:.1})).toBe(true)
 expect(validExpense({...input,category_id:'other'})).toBe(false)
})
it('summarizes daily/category items independently of manual adjustments and forecast',()=>{
 const item={...input,created_at:'2026-10-26',updated_at:'2026-10-26'}
 const data={categories:[],days:[],expenses:[{...item,amount:.1},{...item,id:'second',amount:.2}],actuals:[{data:input.expense_date,valor:10.3}],budgets:[{id:'b',descricao:'Diário',categoria:'Outros',mes_referencia:null,valor_mensal:3100}]}
 const result=expenseSummary('2026-10',data)
 expect(result.totalCents).toBe(30);expect(result.byCategory['']).toBe(30);expect(result.byDate['2026-10-26']).toBe(30)
 expect(result.actualCents).toBe(1030);expect(result.plannedCents).toBe(310000)
 expect(result.schedule[25].realizado).toBe(10.3);expect(result.schedule[24].realizado).toBe(null)
})

it('uses stable category colors and informative limits without changing totals',async()=>{
 const {categoryStyle,categoryBudgets,shiftExpenseDate}=await import('./daily-expenses')
 expect(categoryStyle('mercado')).toEqual(categoryStyle('mercado'))
 expect(shiftExpenseDate('2026-12-31',1)).toBe('2027-01-01')
 expect(shiftExpenseDate('2024-03-01',-1)).toBe('2024-02-29')
 expect(categoryBudgets({expenses:[],categories:[],days:[],actuals:[],budgets:[{id:'b',descricao:'Mercado',categoria:'',mes_referencia:null,valor_mensal:1500}],budgetCategories:[{budget_id:'b',category_id:'c'}]})).toEqual({c:150000})
})

it('distinguishes identities beyond eight colors and stays stable after reorder, rename and growth',async()=>{
 const {categoryStyle}=await import('./daily-expenses')
 const categories=Array.from({length:200},(_,i)=>({id:`10000000-0000-4000-8000-${String(i).padStart(12,'0')}`,name:`Categoria ${i}`}))
 const colors=categories.map(c=>JSON.stringify(categoryStyle(c.id)))
 expect(new Set(colors).size).toBe(categories.length)
 for(const c of [...categories].reverse()) expect(categoryStyle(c.id)).toEqual(categoryStyle({...c,name:'Renomeada'}.id))
 expect(categoryStyle(null)).not.toEqual(categoryStyle(categories[0].id))
 expect(categoryStyle(categories[0].id)).toEqual(JSON.parse(colors[0]))
})
