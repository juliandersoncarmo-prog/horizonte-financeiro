// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import DayDetail from './DayDetail'
import CreditCardsModal from './CreditCardsModal'
import { ProjectionProvider } from './ProjectionProvider'
import { runProjection } from '@/lib/engine/projection'
const m=vi.hoisted(()=>({del:vi.fn(),rule:vi.fn(),refresh:vi.fn(),cards:vi.fn()}))
vi.mock('next/navigation',()=>({useRouter:()=>({refresh:m.refresh})}))
vi.mock('@/app/actions',()=>({deleteTransaction:m.del,deleteRecurringRule:m.rule,updateTransaction:vi.fn(),updateRecurringRule:vi.fn(),addTransaction:vi.fn(),addRecurringRule:vi.fn()}))
vi.mock('@/app/card-actions',()=>({getCreditCards:m.cards,createCreditCard:vi.fn(),deleteCreditCard:vi.fn(),deleteCardInvoice:vi.fn(),saveCardInvoice:vi.fn(),updateCreditCard:vi.fn()}))
vi.stubGlobal('React',React);vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true)
let host:HTMLDivElement,root:ReturnType<typeof createRoot>
const projection=runProjection({settings:{saldo_abertura:100,data_ancora:'2026-10-12'},horizonMonths:2,dailyBudgets:[],transactions:[{id:'11111111-1111-4111-8111-111111111111',descricao:'Teste',categoria:'',tipo:'saida',valor:10,data:'2026-10-12'}],recurringRules:[]})
const day=projection.months[0].days[0]
beforeEach(()=>{vi.clearAllMocks();m.del.mockResolvedValue({success:true});m.cards.mockResolvedValue({enabled:true,cards:[]});host=document.createElement('div');document.body.append(host);root=createRoot(host)})
afterEach(async()=>{await act(()=>root.unmount());host.remove()})
function button(text:string){return [...document.querySelectorAll('button')].find(b=>b.textContent===text || b.title===text)!}
async function click(text:string){await act(()=>{button(text).focus();button(text).click()})}
async function render(){await act(()=>root.render(<DayDetail day={day} onClose={vi.fn()} />));await click('Editar')}
it('removes Diário detail block and requires explicit deletion confirmation',async()=>{
 await render();expect(document.body.textContent).not.toContain('Previsto:');expect(document.body.textContent).not.toContain('Diferença')
 await click('Excluir lançamento');expect(m.del).not.toHaveBeenCalled();await click('Cancelar exclusão');expect(m.del).not.toHaveBeenCalled()
 await click('Excluir lançamento');await click('Confirmar exclusão');expect(m.del).toHaveBeenCalledWith(day.events[0].id)
 expect(m.refresh).toHaveBeenCalledTimes(1);expect(document.body.textContent).toContain('excluído com sucesso')
})
it('keeps editor and shows database failure without reporting success',async()=>{
 m.del.mockResolvedValue({success:false,error:'Não foi possível excluir.'});await render();await click('Excluir lançamento');await click('Confirmar exclusão')
 expect(document.body.textContent).toContain('Não foi possível excluir.');expect(m.refresh).not.toHaveBeenCalled();expect(document.body.textContent).not.toContain('excluído com sucesso')
})
it('blocks duplicate delete while persistence is pending',async()=>{
 let finish!:(value:{success:boolean})=>void;m.del.mockReturnValue(new Promise(resolve=>{finish=resolve}));await render();await click('Excluir lançamento');await click('Confirmar exclusão')
 await act(()=>document.querySelector<HTMLButtonElement>('[type=submit]')!.click());expect(m.del).toHaveBeenCalledTimes(1)
 expect(document.body.textContent).not.toContain('excluído com sucesso');await act(()=>finish({success:true}))
})
it('Escape closes only top editor and restores focus to edit trigger',async()=>{
 await render();expect(document.querySelectorAll('[role=dialog]')).toHaveLength(2)
 await act(()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true})))
 expect(document.querySelectorAll('[role=dialog]')).toHaveLength(1);expect((document.activeElement as HTMLButtonElement).title).toBe('Editar')
})
it('card manager uses projection snapshot and does not issue another read on opening',async()=>{
 const cards={enabled:true,cards:[{id:'c',nome:'Inicial',dia_vencimento:15,invoices:[]}]}
 await act(()=>root.render(<ProjectionProvider projection={{...projection,cardData:cards}}><CreditCardsModal onClose={vi.fn()} initialCardId="c" /></ProjectionProvider>))
 expect(m.cards).not.toHaveBeenCalled();expect(document.querySelector<HTMLInputElement>('input')!.value).toBe('Inicial')
 await act(()=>root.render(<ProjectionProvider projection={{...projection,cardData:{...cards,cards:[]}}}><CreditCardsModal onClose={vi.fn()} /></ProjectionProvider>))
 expect(document.body.textContent).not.toContain('Faturas de Inicial');expect(m.cards).not.toHaveBeenCalled()
})

it('rule confirmation describes past and future scope and calls whole-rule deletion',async()=>{
 m.rule.mockResolvedValue({success:true})
 const event={...day.events[0],id:undefined,ruleId:'22222222-2222-4222-8222-222222222222'}
 await act(()=>root.render(<DayDetail day={{...day,events:[event]}} onClose={vi.fn()} />));await click('Editar');await click('Excluir regra recorrente')
 expect(document.body.textContent).toContain('passadas e futuras');expect(m.rule).not.toHaveBeenCalled()
 await click('Confirmar exclusão');expect(m.rule).toHaveBeenCalledWith(event.ruleId,'all-occurrences');expect(m.del).not.toHaveBeenCalled()
})
