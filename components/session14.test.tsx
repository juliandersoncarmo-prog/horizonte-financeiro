// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { beforeEach, afterEach, it, expect, vi } from 'vitest'
import { ProjectionProvider } from './ProjectionProvider'
import DiarioModal from './DiarioModal'
import DayDetail from './DayDetail'
import LedgerView from './LedgerView'
import { runProjection } from '@/lib/engine/projection'
const m=vi.hoisted(()=>({read:vi.fn(),budget:vi.fn(),refresh:vi.fn(),del:vi.fn()}))
vi.mock('next/navigation',()=>({useRouter:()=>({refresh:m.refresh})}))
vi.mock('@/app/actions',()=>({getAllDailyBudgets:m.read,updateDailyBudget:m.budget,addDailyBudget:vi.fn(),deleteDailyBudget:vi.fn(),deleteTransaction:m.del,deleteRecurringRule:vi.fn(),updateTransaction:vi.fn(),updateRecurringRule:vi.fn(),saveDailyActual:vi.fn()}))
vi.mock('@/app/card-actions',()=>({deleteCardInvoice:vi.fn(),getCreditCards:vi.fn()}))
vi.stubGlobal('React',React);vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true)
let root:ReturnType<typeof createRoot>,host:HTMLDivElement
const budget={id:'b',descricao:'Mercado',categoria:'',valor_mensal:300,mes_referencia:null}
const input={settings:{saldo_abertura:1000,data_ancora:'2026-10-01'},horizonMonths:2,recurringRules:[],transactions:[{id:'t',descricao:'Avulsa',tipo:'saida' as const,valor:10,categoria:'',data:'2026-10-01'}],dailyBudgets:[budget]}
const projection={...runProjection(input),editorData:{recurringRules:[],dailyBudgets:[budget]}}
beforeEach(()=>{vi.clearAllMocks();m.budget.mockResolvedValue({success:true});m.del.mockResolvedValue({success:true});window.confirm=vi.fn(()=>true);host=document.createElement('div');document.body.append(host);root=createRoot(host)})
afterEach(async()=>{await act(()=>root.unmount());host.remove()})
async function render(child:React.ReactNode){await act(()=>root.render(<ProjectionProvider projection={projection}>{child}</ProjectionProvider>))}
async function click(label:string){await act(()=>[...document.querySelectorAll('button')].find(b=>b.title===label||b.textContent===label||b.getAttribute('aria-label')===label)!.click())}
async function value(label:string,v:string){await act(()=>{const field=document.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!;Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(field,v);field.dispatchEvent(new Event('input',{bubbles:true}))})}
it('opens Diario immediately from authenticated snapshot without extra request and saves name/value together',async()=>{
 await render(<DiarioModal onClose={vi.fn()}/>);expect(m.read).not.toHaveBeenCalled();expect(document.body.textContent).toContain('Mercado');expect(document.body.textContent).not.toContain('Carregando')
 await click('Editar');await value('Nome do orçamento','Alimentação');await value('Valor mensal','400');await click('Salvar');expect(m.budget).toHaveBeenCalledWith('b',400,'Alimentação');expect(m.refresh).toHaveBeenCalledTimes(1);expect(document.body.textContent).toContain('Alimentação')
})
it('trash button requires confirmation and cancellation preserves the record',async()=>{
 await render(<DayDetail day={projection.months[0].days[0]} onClose={vi.fn()}/>);await click('Excluir Avulsa');expect(m.del).not.toHaveBeenCalled();await click('Cancelar');expect(m.del).not.toHaveBeenCalled();await click('Excluir Avulsa');await click('Confirmar exclusão');expect(m.del).toHaveBeenCalledWith('t');expect(m.refresh).toHaveBeenCalledTimes(1)
})
it.each([320,375,390,430])('selects one month and keeps navigation and selector at %s px (DOM only)',async width=>{
 Object.defineProperty(window,'innerWidth',{value:width,configurable:true});await render(<LedgerView projection={projection}/>);expect(document.querySelectorAll('h2')).toHaveLength(1);expect(document.querySelector('select[aria-label^="Valores"]')).not.toBeNull();await click('Próximo mês');expect(document.querySelector('h2')!.textContent).toContain('Novembro')
})
it('date change moves an avulsa between months and recalculates summaries',()=>{
 const before=runProjection(input);const after=runProjection({...input,transactions:[{...input.transactions[0],data:'2026-11-02'}]});expect(before.months[0].totalSaidas-after.months[0].totalSaidas).toBe(10);expect(after.months[1].totalSaidas-before.months[1].totalSaidas).toBe(10);expect(after.months[1].saldoFechamento).toBe(before.months[1].saldoFechamento)
})
