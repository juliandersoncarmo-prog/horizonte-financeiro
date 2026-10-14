// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import CancelRecurringDialog from './CancelRecurringDialog'
const m=vi.hoisted(()=>({month:vi.fn(),end:vi.fn()}))
vi.mock('@/app/actions',()=>({cancelRecurringMonth:m.month,endRecurringFromMonth:m.end}))
vi.stubGlobal('React',React);vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true)
let host:HTMLDivElement,root:ReturnType<typeof createRoot>
const close=vi.fn(),saved=vi.fn()
beforeEach(async()=>{vi.clearAllMocks();m.month.mockResolvedValue({success:true});m.end.mockResolvedValue({success:true});host=document.createElement('div');document.body.append(host);root=createRoot(host);await act(()=>root.render(<CancelRecurringDialog ruleId="r" name="Energia" date="2026-10-19" onClose={close} onSaved={saved} />))})
afterEach(async()=>{await act(()=>root.unmount());host.remove()})
function btn(label:string){return [...document.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent===label||b.querySelector('strong')?.textContent===label)!}
async function click(label:string){await act(()=>btn(label).click())}
it('vertical choice cards cover full buttons and defer writes until confirmation',async()=>{
 expect(document.querySelectorAll('.recurring-cancel-option')).toHaveLength(2);expect(document.querySelector('.recurring-cancel-option')?.parentElement?.className).toContain('flex-col')
 expect(document.body.textContent).toContain('Cancela outubro de 2026.');expect(document.body.textContent).not.toContain('Toda a recorrência')
 expect(document.activeElement).toBe(btn('Somente este mês'));await click('Deste mês em diante');expect(m.end).not.toHaveBeenCalled();await click('Voltar');expect(m.end).not.toHaveBeenCalled()
 await click('Somente este mês');await click('Confirmar cancelamento');expect(m.month).toHaveBeenCalledWith('r','2026-10-19');expect(saved).toHaveBeenCalledTimes(1)
})
it('blocks duplicate operations and closing by Escape during persistence',async()=>{
 let finish!:(x:{success:boolean})=>void;m.end.mockReturnValue(new Promise(resolve=>{finish=resolve}));await click('Deste mês em diante');const submit=btn('Confirmar cancelamento');await act(()=>{submit.click();submit.click()})
 expect(m.end).toHaveBeenCalledTimes(1);expect(btn('Voltar').disabled).toBe(true)
 await act(()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})));expect(close).not.toHaveBeenCalled()
 await act(()=>finish({success:true}));expect(saved).toHaveBeenCalledTimes(1)
})
it.each(['returned','thrown'])('keeps %s error visible and blocks retries of uncertain writes',async mode=>{
 if(mode==='returned')m.month.mockResolvedValue({success:false,error:'Recarregue para conferir.'});else m.month.mockRejectedValue(new Error('offline'))
 await click('Somente este mês');await click('Confirmar cancelamento');expect(document.querySelector('[role=alert]')).not.toBeNull();expect(btn('Confirmar cancelamento').disabled).toBe(true);expect(saved).not.toHaveBeenCalled()
 await click('Confirmar cancelamento');expect(m.month).toHaveBeenCalledTimes(1)
})
it('Escape closes the choice dialog without saving',async()=>{
 await act(()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})));expect(close).toHaveBeenCalledTimes(1);expect(m.month).not.toHaveBeenCalled()
})
