// @vitest-environment happy-dom
import React, { act, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import LedgerControls from './LedgerControls'
import { exhaustedDailyBudget } from '@/lib/daily-budget-status'
import { runProjection } from '@/lib/engine/projection'
vi.stubGlobal('React', React)
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const base = { settings: { saldo_abertura: 1000, data_ancora: '2026-11-01' }, recurringRules: [], transactions: [], dailyBudgets: [{ id: 'b', mes_referencia: null, descricao: 'Diário', categoria: '', valor_mensal: 300 }], horizonMonths: 6, todayISO: '2026-11-01' }
it('identifies exhausted forecast, allows excess actuals and clears after correction without changing projection', () => {
  const project = (value: number) => runProjection({ ...base, dailyActuals: [{ data: '2026-11-02', valor: value }] }).months[0]
  const month = project(400), before = JSON.stringify(month)
  expect(exhaustedDailyBudget(month)).toBe('2026-11-02')
  expect(month.days[1].diario).toBe(400)
  expect(JSON.stringify(month)).toBe(before)
  expect(exhaustedDailyBudget(project(10))).toBeNull()
  expect(exhaustedDailyBudget(runProjection({ ...base, dailyBudgets: [] }).months[0])).toBeNull()
  expect(exhaustedDailyBudget(runProjection(base).months[0])).toBeNull()
})
it('navigates one month per arrow with bounds and ignores editing, dialogs and modified keys', async () => {
  const host = document.createElement('div'); document.body.append(host)
  const root = createRoot(host)
  const months = runProjection(base).months
  function Controls() { const [index, setIndex] = useState(0); return <><output>{index}</output><input /><select><option>A</option></select><div contentEditable /><LedgerControls months={months} startIndex={index} visible={4} onStartChange={setIndex} /></> }
  const key = async (target: EventTarget, key: string, opts = {}) => act(() => { target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...opts })) })
  try {
    await act(() => root.render(<Controls />))
    await key(document, 'ArrowLeft'); expect(host.querySelector('output')!.textContent).toBe('0')
    await key(document, 'ArrowRight'); expect(host.querySelector('output')!.textContent).toBe('1')
    for (const target of host.querySelectorAll('input,select,[contenteditable]')) await key(target, 'ArrowRight')
    await key(document, 'ArrowRight', { ctrlKey: true }); expect(host.querySelector('output')!.textContent).toBe('1')
    const modal = document.createElement('div'); modal.setAttribute('role', 'dialog'); document.body.append(modal)
    await key(document, 'ArrowRight'); expect(host.querySelector('output')!.textContent).toBe('1'); modal.remove()
    await key(document, 'ArrowRight'); await key(document, 'ArrowRight'); expect(host.querySelector('output')!.textContent).toBe('2')
    await key(document, 'ArrowLeft'); expect(host.querySelector('output')!.textContent).toBe('1')
  } finally { await act(() => root.unmount()); host.remove() }
  const event = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true }); document.dispatchEvent(event); expect(event.defaultPrevented).toBe(false)
})
