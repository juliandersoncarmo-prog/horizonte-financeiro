// @vitest-environment happy-dom
import React, { act, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { ProjectionProvider, useProjection } from './ProjectionProvider'
import InlineDailyActual from './InlineDailyActual'
import DiarioModal from './DiarioModal'
import { runProjection } from '@/lib/engine/projection'
import type { ProjectionInput, ProjectionResult } from '@/types'
const m = vi.hoisted(() => ({ save: vi.fn(), read: vi.fn(), add: vi.fn(), update: vi.fn(), del: vi.fn(), refresh: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: m.refresh }) }))
vi.mock('@/app/actions', () => ({ saveDailyActual: m.save, getAllDailyBudgets: m.read, addDailyBudget: m.add, updateDailyBudget: m.update, deleteDailyBudget: m.del }))
vi.stubGlobal('React', React); vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const budget = { id: 'b', descricao: 'Mercado', categoria: '', mes_referencia: null, valor_mensal: 310 }
const input: ProjectionInput = { settings: { saldo_abertura: 5000, data_ancora: '2026-10-01' }, horizonMonths: 3, todayISO: '2026-10-12', dailyBudgets: [budget], dailyActuals: [], transactions: [{ id: 't', tipo: 'saida', descricao: 'Compra', categoria: '', valor: 20, data: '2026-10-04', incluido_diario: true }], recurringRules: [] }
function snapshot(i = input): ProjectionResult { return { ...runProjection(i), inputSnapshot: i, editorData: { dailyBudgets: i.dailyBudgets, recurringRules: i.recurringRules } } }
let observed: ProjectionResult, root: ReturnType<typeof createRoot>, host: HTMLDivElement
function Calendar() { const projection = useProjection(); useEffect(() => { observed = projection }, [projection]); return <><InlineDailyActual day={projection.months[0].days[1]} /><InlineDailyActual day={projection.months[0].days[2]} /></> }
beforeEach(() => { vi.clearAllMocks();  host = document.createElement('div'); document.body.append(host); root = createRoot(host) })
afterEach(async () => { await act(() => root.unmount()); host.remove() })
async function render(child: React.ReactNode, p = snapshot()) { await act(() => root.render(<ProjectionProvider projection={p}>{child}</ProjectionProvider>)) }
async function click(label: string) { await act(() => { [...document.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === label || b.title === label || b.textContent === label)!.click() }) }
async function enter(selector: string, value: string) { await act(() => { const field = document.querySelector<HTMLInputElement>(selector)!; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(field, value); field.dispatchEvent(new Event('input', { bubbles: true })) }) }
async function saveDay(value: string) { await click('Editar Diário em 2026-10-02'); await enter('input', value); await click('Confirmar Diário') }
it('never updates finances before persistence, blocks duplicate submissions and preserves all months on failure', async () => {
 let finish!: (r: { success: boolean; error?: string }) => void
 m.save.mockReturnValue(new Promise(resolve => { finish = resolve }))
 await render(<Calendar />); const before = observed
 await saveDay('999'); expect(observed).toBe(before); expect(document.body.textContent).toContain('Salvando Diário'); expect(document.body.textContent).not.toContain('salvo com sucesso')
 await click('Confirmar Diário'); expect(m.save).toHaveBeenCalledTimes(1)
 await act(() => finish({ success: false, error: 'Falha' })); expect(observed).toBe(before); expect(document.querySelector('input')!.value).toBe('999'); expect(m.refresh).not.toHaveBeenCalled()
})
it('confirmed zero, edit and removal exactly match the unchanged engine including later balances', async () => {
 m.save.mockResolvedValue({ success: true }); await render(<Calendar />)
 for (const value of ['0', '600', '']) {
  await saveDay(value)
  const expected = runProjection({ ...input, dailyActuals: value === '' ? [] : [{ data: '2026-10-02', valor: Number(value) }] })
  expect(observed.months).toEqual(expected.months); expect(observed.firstNegativeDate).toBe(expected.firstNegativeDate)
 }
 expect(m.refresh).not.toHaveBeenCalled(); expect(m.read).not.toHaveBeenCalled()
})
it('budget add/edit/delete return confirmed database rows, update global forecasts and reopen without reads', async () => {
 const added = { ...budget, id: 'new', descricao: 'Lazer', valor_mensal: 200 }
 m.add.mockResolvedValue({ success: true, budget: added }); m.update.mockResolvedValue({ success: true, budget: { ...budget, descricao: 'Comida', valor_mensal: 400 } }); m.del.mockResolvedValue({ success: true })
 await render(<><Calendar /><DiarioModal onClose={vi.fn()} /></>)
 expect(m.read).not.toHaveBeenCalled()
 await enter('input[placeholder^="O que"]', 'Lazer'); await enter('input[placeholder="Valor mensal (R$)"]', '200')
 await act(() => document.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
 expect(observed.months).toEqual(runProjection({ ...input, dailyBudgets: [budget, added] }).months)
 await click('Editar'); await enter('input[aria-label="Nome do orçamento"]', 'Comida'); await enter('input[aria-label="Valor mensal"]', '400'); await click('Salvar'); expect(m.update).not.toHaveBeenCalled(); await click('Confirmar')
 const edited = { ...budget, descricao: 'Comida', valor_mensal: 400 }
 expect(observed.months).toEqual(runProjection({ ...input, dailyBudgets: [edited, added] }).months)
 await click('Excluir'); expect(m.del).not.toHaveBeenCalled(); await click('Confirmar'); expect(observed.months).toEqual(runProjection({ ...input, dailyBudgets: [added] }).months)
 expect(m.refresh).not.toHaveBeenCalled(); expect(m.read).not.toHaveBeenCalled()
})
it('a new authenticated server snapshot replaces local state without retaining the previous account data', async () => {
 m.save.mockResolvedValue({ success: true }); await render(<Calendar />); await saveDay('600')
 const other: ProjectionInput = { ...input, settings: { saldo_abertura: 10, data_ancora: '2026-10-01' }, dailyBudgets: [], dailyActuals: [], transactions: [] }
 await render(<Calendar />, snapshot(other)); expect(observed.months).toEqual(runProjection(other).months); expect(observed.inputSnapshot!.dailyActuals).toEqual([])
})
