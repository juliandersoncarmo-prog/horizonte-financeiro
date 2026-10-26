// @vitest-environment happy-dom
import React,{act} from 'react'
import {createRoot} from 'react-dom/client'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
const m=vi.hoisted(()=>({load:vi.fn(),save:vi.fn(),del:vi.fn(),category:vi.fn(),refresh:vi.fn()}))
vi.mock('@/app/expense-actions',()=>({loadExpenseMonth:m.load,saveExpense:m.save,removeExpense:m.del,createExpenseCategory:m.category}))
vi.mock('next/navigation',()=>({useRouter:()=>({refresh:m.refresh})}))
import DailyExpenses from './DailyExpenses'
vi.stubGlobal('React',React);vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true)
let root:ReturnType<typeof createRoot>,host:HTMLDivElement
const date=new Intl.DateTimeFormat('sv-SE').format(new Date())
const item={id:'10000000-0000-4000-8000-000000000001',description:'Café',amount:20,category_id:null,expense_date:date,created_at:date,updated_at:date+'T12:00:00Z'}
beforeEach(async()=>{
 vi.clearAllMocks();m.load.mockResolvedValue({success:true,data:{expenses:[item],categories:[],days:[],actuals:[{data:date,valor:20}],budgets:[{id:'b',descricao:'Diário',categoria:'Outros',mes_referencia:null,valor_mensal:3100}]}})
 m.save.mockResolvedValue({success:true});m.del.mockResolvedValue({success:true})
 host=document.createElement('div');document.body.append(host);root=createRoot(host)
 await act(async()=>{root.render(<DailyExpenses/>);await new Promise(r=>setTimeout(r,0))})
})
afterEach(async()=>{await act(()=>root.unmount());host.remove()})
function button(text:string){return [...document.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent===text || b.getAttribute('aria-label')===text)!}
async function click(text:string){await act(()=>button(text).click())}
it('renders selected date, calendar, daily history, monthly breakdown and navigation',async()=>{
 expect(document.body.textContent).toContain('Gastos do Diário');expect(document.body.textContent).toContain('Café')
 expect(document.querySelectorAll('.expenses-calendar-grid button').length).toBeGreaterThanOrEqual(28)
 await click('Mês anterior');expect(m.load).toHaveBeenCalledTimes(2)
})
it('requires confirmation to delete and sends the concurrency token',async()=>{
 await click('Excluir Café');expect(m.del).not.toHaveBeenCalled();expect(document.querySelector('[role=dialog]')).not.toBeNull()
 await click('Excluir gasto');expect(m.del).toHaveBeenCalledWith(item.id,item.updated_at);expect(m.refresh).toHaveBeenCalled()
})
it('opens the existing shared accessible modal with default date and closes without writes',async()=>{
 await click('Novo gasto');expect(document.querySelector<HTMLInputElement>('input[type=date]')?.value).toBe(date)
 expect(document.querySelector('[role=dialog]')?.getAttribute('aria-modal')).toBe('true')
 expect(document.activeElement?.getAttribute('data-hf-initial-focus')).toBe('true')
 await act(()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})))
 expect(document.querySelector('[role=dialog]')).toBeNull();expect(m.save).not.toHaveBeenCalled()
})
it('keeps load errors visible and supports retry',async()=>{
 m.load.mockResolvedValue({success:false,error:'Falha no histórico'});await click('Mês anterior')
 expect(document.querySelector('[role=alert]')?.textContent).toContain('Falha no histórico')
 await click('Tentar novamente');expect(m.load).toHaveBeenCalledTimes(3)
})
it('edits a persisted item with the expected version',async()=>{
 await click('Editar Café');await click('Salvar gasto')
 expect(m.save).toHaveBeenCalledWith(expect.objectContaining({id:item.id,expected:item.updated_at,amount:20}))
})
