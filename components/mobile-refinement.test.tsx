// @vitest-environment happy-dom
import React, { act, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import ChoiceField from './ChoiceField'
import MonthField from './MonthField'
import useConfirmation from './useConfirmation'
import CreditCardsModal from './CreditCardsModal'
import DayDetail from './DayDetail'
import { ProjectionProvider } from './ProjectionProvider'
import { runProjection } from '@/lib/engine/projection'
const m = vi.hoisted(() => ({ get: vi.fn(), create: vi.fn(), update: vi.fn(), refresh: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: m.refresh }) }))
vi.mock('@/app/actions', () => ({ updateRecurringRule: m.update, updateTransaction: vi.fn(), deleteTransaction: vi.fn(), deleteRecurringRule: vi.fn() }))
vi.mock('@/app/card-actions', () => ({ getCreditCards: m.get, createCreditCard: m.create, updateCreditCard: vi.fn(), saveCardInvoice: vi.fn(), deleteCreditCard: vi.fn(), deleteCardInvoice: vi.fn() }))
vi.stubGlobal('React', React); vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
let host: HTMLDivElement, root: ReturnType<typeof createRoot>
beforeEach(() => { vi.clearAllMocks(); m.get.mockResolvedValue({ cards: [], enabled: true }); host = document.createElement('div'); document.body.append(host); root = createRoot(host) })
afterEach(async () => { await act(() => root.unmount()); host.remove() })
async function render(child: React.ReactNode) { await act(() => root.render(child)) }
function button(label: string) { const scope = [...document.querySelectorAll('[role=dialog]')].at(-1) ?? document; return [...scope.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === label || b.textContent === label)! }
async function click(label: string) { await act(() => button(label).click()) }
async function input(field: HTMLInputElement, value: string) { await act(() => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(field, value); field.dispatchEvent(new Event('input', { bubbles: true })) }) }
async function key(key: string, target: EventTarget = document) { await act(() => target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))) }
it('own choices support arrow/home/end, cancellation, selection, inert background and focus return', async () => {
 function Demo() { const [value, setValue] = useState('a'); return <ChoiceField label="Período" value={value} onChange={setValue} options={[{value:'a',label:'Outubro'},{value:'b',label:'Novembro'},{value:'c',label:'Dezembro'}]} /> }
 await render(<Demo />); const trigger = button('Período'); trigger.focus(); await click('Período'); expect(host.inert).toBe(true)
 const options = document.querySelector('.choice-options')!; await key('End', options); expect(document.activeElement).toBe(button('Dezembro')); await key('ArrowUp', button('Dezembro')); expect(document.activeElement).toBe(button('Novembro')); await key('Home', button('Novembro')); expect(document.activeElement).toBe(button('Outubro'))
 await key('Escape'); expect(document.querySelector('[role=dialog]')).toBeNull(); expect(document.activeElement).toBe(trigger); expect(trigger.textContent).toBe('Outubro'); expect(host.inert).toBe(false)
 await click('Período'); await click('Novembro'); expect(trigger.textContent).toBe('Novembro'); expect(document.activeElement).toBe(trigger); expect(document.querySelector('select')).toBeNull()
})
it.each([320,375,390,430])('month picker preserves full label and exact competence at %s px (DOM, no layout engine)', async width => {
 Object.defineProperty(window,'innerWidth',{value:width,configurable:true})
 const change = vi.fn(); await render(<MonthField label="Primeiro mês" value="2026-10" onChange={change} />)
 expect(button('Primeiro mês').textContent).toBe('Outubro de 2026'); expect(document.querySelector('input[type=month]')).toBeNull()
 await click('Primeiro mês'); await click('Próximo ano'); await click('Novembro'); expect(change).toHaveBeenCalledWith('2027-11'); expect(document.querySelector('[role=dialog]')).toBeNull()
 await click('Primeiro mês'); await input(document.querySelector('input')!, '99'); expect(button('Janeiro').disabled).toBe(true); await key('Escape'); expect(change).toHaveBeenCalledTimes(1)
})
it('confirmation cancels by Escape, resolves one pending request and never invokes native alerts', async () => {
 const result = vi.fn(); const native = vi.fn(() => { throw new Error('Native confirmation forbidden') }); window.confirm = native
 function Demo() { const {ask,confirmation} = useConfirmation(); return <><button onClick={() => { void ask('Recalcular todas as ocorrências?').then(result) }}>Salvar</button>{confirmation}</> }
 await render(<Demo />); button('Salvar').focus(); await click('Salvar'); expect(result).not.toHaveBeenCalled(); await key('Escape'); expect(result).toHaveBeenLastCalledWith(false); expect(document.activeElement).toBe(button('Salvar'))
 await click('Salvar'); await click('Confirmar'); expect(result).toHaveBeenLastCalledWith(true); expect(result).toHaveBeenCalledTimes(2); expect(native).not.toHaveBeenCalled()
})
it('card month changes retain common values, ask before discarding, cancel safely and confirm precisely', async () => {
 await render(<CreditCardsModal onClose={vi.fn()} />); await click('Primeiro mês'); await input(document.querySelector('input[aria-label^="Ano de"]')!, '2026'); await click('Outubro')
 await input(document.querySelector('input[aria-label="Quantidade de faturas"]')!, '2')
 const rows = () => [...document.querySelectorAll<HTMLInputElement>('input[aria-label^="Valor de"]')]; await input(rows()[0], '10'); await input(rows()[1], '20')
 await click('Primeiro mês'); await click('Novembro'); expect(rows().map(row=>row.value)).toEqual(['10','20']); await click('Cancelar'); expect(button('Primeiro mês').textContent).toBe('Outubro de 2026')
 await click('Primeiro mês'); await click('Novembro'); await click('Confirmar'); expect(rows().map(row=>row.value)).toEqual(['20','']); expect(button('Primeiro mês').textContent).toBe('Novembro de 2026'); expect(m.create).not.toHaveBeenCalled()
})
it('recurring save waits for own confirmation, cancels intact and blocks duplicate persistence', async () => {
 const rule = {id:'r',tipo:'saida' as const,descricao:'Plano de Saúde - KT',valor:1300,categoria:'',dia_do_mes:5,data_inicio:'2026-10-01',frequencia:'mensal' as const,modo_termino:'nunca' as const,valor_termino:null}
 const p = {...runProjection({settings:{saldo_abertura:10000,data_ancora:'2026-10-01'},recurringRules:[rule],transactions:[],dailyBudgets:[],horizonMonths:1}),editorData:{recurringRules:[rule],dailyBudgets:[]}}
 let finish!: (value: {success:boolean})=>void; m.update.mockReturnValue(new Promise(resolve=>{finish=resolve}))
 await render(<ProjectionProvider projection={p}><DayDetail day={p.months[0].days[4]} onClose={vi.fn()} /></ProjectionProvider>)
 expect(document.querySelector('.event-description')!.textContent).toBe(rule.descricao); expect(document.querySelector('.event-actions')!.querySelectorAll('button')).toHaveLength(2)
 await click(`Editar ${rule.descricao}`); const form = document.querySelector('form')!
 const submit = () => act(() => {form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))})
 await submit(); expect(m.update).not.toHaveBeenCalled(); await click('Cancelar'); expect(document.querySelector('#edit-description')).not.toBeNull()
 await submit(); await click('Confirmar'); await submit(); expect(m.update).toHaveBeenCalledTimes(1); await act(()=>finish({success:true})); expect(m.refresh).toHaveBeenCalledTimes(1)
})
