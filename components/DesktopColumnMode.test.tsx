// @vitest-environment happy-dom
import React, { act, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import ChoiceField from './ChoiceField'
import type { Mode } from './MonthColumn'
vi.stubGlobal('React', React)
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
let host: HTMLDivElement, root: ReturnType<typeof createRoot>
beforeEach(async () => {
 host = document.createElement('div'); document.body.append(host); root = createRoot(host)
 function Demo() { const [mode,setMode] = useState<Mode>('diario'); return <ChoiceField anchored value={mode} onChange={value=>setMode(value as Mode)} label="Valores exibidos" options={[{value:"diario",label:"Diário"},{value:"entrada",label:"Entradas"},{value:"saida",label:"Saídas"}]} /> }
 await act(() => root.render(<Demo/>))
})
afterEach(async () => { await act(() => root.unmount()); host.remove() })
const trigger = () => host.querySelector<HTMLButtonElement>('.choice-trigger')!
async function open() { await act(() => trigger().click()) }
it('selects all modes and returns focus to trigger without a native select',async()=> {
 expect(host.querySelector('select')).toBeNull()
 for(const label of ['Entradas','Saídas','Diário']) {
  await open()
  await act(() => [...host.querySelectorAll<HTMLButtonElement>('[role=menuitemradio]')].find(item=>item.textContent===label)!.click())
  expect(trigger().textContent).toBe(label);expect(trigger().getAttribute('aria-expanded')).toBe('false');expect(document.activeElement).toBe(trigger())
 }
})
it('focuses active mode and supports arrows and Escape',async()=> {
 await open();expect(document.activeElement?.textContent).toBe('Diário')
 await act(()=>document.activeElement!.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true})))
 expect(document.activeElement?.textContent).toBe('Entradas')
 await act(()=>document.activeElement!.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})))
 expect(host.querySelector('[role=menu]')).toBeNull();expect(document.activeElement).toBe(trigger())
})
it('dismisses on outside touch and viewport changes',async()=> {
 await open();await act(()=>document.body.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true})));expect(host.querySelector('[role=menu]')).toBeNull()
 await open();await act(()=>window.dispatchEvent(new Event('resize')));expect(host.querySelector('[role=menu]')).toBeNull()
})
it('allows Tab to leave the menu',async()=> {
 const outside=document.createElement('button');document.body.append(outside)
 await open();await act(()=>outside.focus());expect(host.querySelector('[role=menu]')).toBeNull();outside.remove()
})

it('does not make the page inert or create a viewport dialog',async()=> { await open(); expect(document.querySelector('[role=dialog]')).toBeNull();expect(host.inert).toBeFalsy();expect(document.body.style.overflow).not.toBe('hidden') })
