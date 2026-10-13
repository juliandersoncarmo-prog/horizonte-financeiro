// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useMobileSwipe } from './useMobileSwipe'
import LedgerView from '@/components/LedgerView'
import MonthlySummaryModal from '@/components/MonthlySummaryModal'
import { ProjectionProvider } from '@/components/ProjectionProvider'
import { runProjection } from '@/lib/engine/projection'
vi.mock('next/navigation',()=>({useRouter:()=>({refresh:vi.fn()})}))
vi.mock('@/app/actions',()=>({saveDailyActual:vi.fn()}))
vi.stubGlobal('React',React);vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true)
let host:HTMLDivElement,root:ReturnType<typeof createRoot>
beforeEach(()=>{Object.defineProperty(window,'innerWidth',{value:390,configurable:true});host=document.createElement('div');document.body.append(host);root=createRoot(host)})
afterEach(async()=>{await act(()=>root.unmount());host.remove()})
async function render(node:React.ReactNode){await act(()=>root.render(node))}
async function touch(target:Element,type:string,x:number,y:number,multi=false){
 const point={identifier:1,clientX:x,clientY:y};const event=new Event(type,{bubbles:true,cancelable:true})
 Object.defineProperties(event,{touches:{value:type==='touchend'||type==='touchcancel'?[]:multi?[point,{...point,identifier:2}]:[point]},changedTouches:{value:[point]}})
 await act(()=>target.dispatchEvent(event))
}
async function drag(target:Element,dx=-100,dy=0){await touch(target,'touchstart',180,100);await touch(target,'touchmove',180+dx,100+dy);await touch(target,'touchend',180+dx,100+dy)}
function Demo({go,blocked}:{go:(d:-1|1)=>void;blocked?:()=>boolean}){const props=useMobileSwipe(go,blocked);return <div data-area {...props}><span>Surface</span><input/><button>Action</button></div>}
it('navigates exactly once in each direction',async()=>{const go=vi.fn();await render(<Demo go={go}/>);const area=host.querySelector('[data-area]')!;await drag(area);await drag(area,100);expect(go.mock.calls).toEqual([[1],[-1]])})
it('ignores vertical, diagonal, short and cancelled gestures',async()=>{const go=vi.fn();await render(<Demo go={go}/>);const area=host.querySelector('[data-area]')!;await drag(area,10,100);await drag(area,80,70);await drag(area,-30);await touch(area,'touchstart',180,100);await touch(area,'touchcancel',80,100);await touch(area,'touchend',80,100);expect(go).not.toHaveBeenCalled()})
it('never reinterprets a vertical scroll as horizontal',async()=>{const go=vi.fn();await render(<Demo go={go}/>);const area=host.querySelector('[data-area]')!;await touch(area,'touchstart',180,100);await touch(area,'touchmove',181,130);await touch(area,'touchend',50,135);expect(go).not.toHaveBeenCalled()})
it('ignores interactive targets, focused editors and multiple fingers',async()=>{const go=vi.fn();await render(<Demo go={go}/>);await drag(host.querySelector('button')!);await drag(host.querySelector('input')!);host.querySelector('input')!.focus();await drag(host.querySelector('[data-area]')!);host.querySelector('input')!.blur();const area=host.querySelector('[data-area]')!;await touch(area,'touchstart',180,100);await touch(area,'touchmove',70,100,true);await touch(area,'touchend',70,100);expect(go).not.toHaveBeenCalled()})
it('ignores desktop and blocked navigation',async()=>{const go=vi.fn();await render(<Demo go={go} blocked={()=>true}/>);await drag(host.querySelector('[data-area]')!);await render(<Demo go={go}/>);Object.defineProperty(window,'innerWidth',{value:1280,configurable:true});await drag(host.querySelector('[data-area]')!);expect(go).not.toHaveBeenCalled()})
it('prevents trailing clicks after a drag but preserves ordinary taps',async()=>{const go=vi.fn(),click=vi.fn();await render(<div onClick={click}><Demo go={go}/></div>);const area=host.querySelector('[data-area]')!;await act(()=>area.dispatchEvent(new MouseEvent('click',{bubbles:true})));expect(click).toHaveBeenCalledTimes(1);await drag(area);await act(()=>area.dispatchEvent(new MouseEvent('click',{bubbles:true})));expect(click).toHaveBeenCalledTimes(1)})
const projection=runProjection({settings:{saldo_abertura:1000,data_ancora:'2020-01-01'},horizonMonths:2,transactions:[],recurringRules:[],dailyBudgets:[]})
it('integrates with ledger, clamps limits and leaves arrows available',async()=>{await render(<ProjectionProvider projection={projection}><LedgerView projection={projection}/></ProjectionProvider>);const area=host.querySelector('.ledger-view')!;await drag(area,100);expect(host.querySelector('h2')!.textContent).toContain('Janeiro');await drag(area);expect(host.querySelector('h2')!.textContent).toContain('Fevereiro');await drag(area);expect(host.querySelector('h2')!.textContent).toContain('Fevereiro');await drag(area,100);expect(host.querySelector('h2')!.textContent).toContain('Janeiro')})
it('integrates with summary and retains cards and month limits',async()=>{await render(<ProjectionProvider projection={projection}><MonthlySummaryModal onClose={vi.fn()}/></ProjectionProvider>);const area=document.querySelector('.summary-panel')!;const initial=area.querySelector('h3')!.textContent;await drag(area,100);expect(area.querySelector('h3')!.textContent).toBe('Janeiro de 2020');await drag(area);expect(area.querySelector('h3')!.textContent).toBe('Fevereiro de 2020');await drag(area);expect(area.querySelector('h3')!.textContent).toBe('Fevereiro de 2020');expect(area.querySelectorAll('dl > div')).toHaveLength(4);expect(initial).toBeTruthy()})
