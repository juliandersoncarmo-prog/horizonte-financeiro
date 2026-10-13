// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import postcss from 'postcss'
import MonthColumn, { type Mode } from './MonthColumn'
import { runProjection, formatBRL } from '@/lib/engine/projection'
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))
vi.mock('@/app/actions', () => ({ saveDailyActual: vi.fn() }))
vi.mock('./ProjectionProvider', () => ({ useDailyEditor: () => ({ date: null, open: vi.fn(), close: vi.fn() }), useProjectionUpdate: () => undefined }))
const amounts = [25, 200, 1200, 10000, 11958.01, 125000]
let cleanup = () => {}
afterEach(() => { cleanup(); document.body.innerHTML = '' })
it.each(['diario', 'entrada', 'saida'] as Mode[])('%s shares a table hierarchy and preserves complete money strings and edit placement', async mode => {
 const projection = runProjection({ settings: { saldo_abertura: 125000, data_ancora: '2026-10-01' }, recurringRules: [], transactions: [], dailyBudgets: [], horizonMonths: 1 })
 const month = projection.months[0]
 month.days = month.days.slice(0, amounts.length).map((day, index) => ({ ...day, diario: amounts[index], diarioRealizado: amounts[index], inSum: amounts[index], outSum: amounts[index], saldo: amounts[index] }))
 const host = document.createElement('div'); document.body.append(host); const root = createRoot(host)
 cleanup = () => { act(() => root.unmount()) }
 await act(() => root.render(<MonthColumn month={month} mode={mode} selectedDate={null} onDaySelect={vi.fn()} onModeChange={vi.fn()} />))
 const table = host.querySelector('.month-table')!
 expect(table.parentElement?.className).toBe('month-table-viewport')
 expect(table.querySelector('.month-table-heading')?.parentElement).toBe(table)
 expect(table.querySelector('.month-scroll')?.parentElement).toBe(table)
 const rows = [...table.querySelectorAll('.month-day-row')]
 expect(rows).toHaveLength(6)
 rows.forEach((row, index) => {
  expect(row.children).toHaveLength(3)
  expect(row.querySelector('.day-mid-value .num')?.textContent?.trim()).toBe(`${mode === 'entrada' ? '+' : '−'}${formatBRL(amounts[index])}`)
  expect(row.querySelector('.day-balance .num')?.textContent?.trim()).toBe(formatBRL(amounts[index]))
  const display = row.querySelector('.daily-display')
  if (mode === 'diario') { expect(display?.children[0].tagName).toBe('SPAN'); expect(display?.children[1].tagName).toBe('BUTTON'); expect(display?.querySelector('svg')).not.toBeNull() }
  else expect(display).toBeNull()
 })
 expect(host.querySelector('[style*="money-scale"]')).toBeNull()
})
it('has one mobile layout owner, shared intrinsic columns and readable fixed font sizes', () => {
 const css = readFileSync('app/globals.css', 'utf8'), tree = postcss.parse(css)
 expect(css).not.toMatch(/money-scale|cqw|1\.8fr/)
 const definitions: Record<string, string[]> = {}
 tree.walkRules(rule => { rule.walkDecls(decl => { const key = `${rule.selector}:${decl.prop}`; (definitions[key] ??= []).push(decl.value) }) })
 expect(definitions['.ledger-months .month-table:grid-template-columns']).toEqual(['max-content max-content max-content'])
 const shared = Object.entries(definitions).find(([key]) => key.includes('.month-table-heading') && key.includes('.month-scroll') && key.endsWith(':grid-template-columns'))
 expect(shared?.[1]).toEqual(['subgrid'])
 expect(definitions['.ledger-months .daily-display:gap']).toEqual(['5px'])
 expect(definitions['.ledger-months .daily-display > button:position']).toEqual(['static'])
 expect(definitions['.month-table-viewport, .month-table:display']).toEqual(['contents'])
 const fonts: string[] = []
 tree.walkRules(rule => { if (rule.selector.includes('.day-balance > span.num')) rule.walkDecls('font-size', decl => { fonts.push(decl.value) }) })
 expect(fonts).toEqual(['16px', '15px'])
})
it('preserves month swipes when content fits and scrolls exceptional overflow without opening a day', async () => {
 const month = runProjection({ settings: { saldo_abertura: 100, data_ancora: '2026-10-01' }, recurringRules: [], transactions: [], dailyBudgets: [], horizonMonths: 1 }).months[0]
 const swipe = vi.fn(), select = vi.fn()
 const host = document.createElement('div'); document.body.append(host); const root = createRoot(host); cleanup = () => { act(() => root.unmount()) }
 await act(() => root.render(<div onTouchStart={swipe}><MonthColumn month={month} mode="saida" selectedDate={null} onDaySelect={select} onModeChange={vi.fn()} /></div>))
 const viewport = host.querySelector<HTMLElement>('.month-table-viewport')!
 const row = host.querySelector<HTMLElement>('.month-day-row')!
 let contentWidth = 288
 Object.defineProperty(viewport, 'clientWidth', { value: 288 })
 Object.defineProperty(viewport, 'scrollWidth', { get: () => contentWidth })
 const touch = async (name: string, x: number) => { await act(() => { const event = new Event(name, { bubbles: true }); Object.defineProperty(event, 'touches', { value: name === 'touchend' ? [] : [{clientX:x,clientY:100}] }); row.dispatchEvent(event) }) }
 await touch('touchstart', 200); expect(swipe).toHaveBeenCalledTimes(1); await touch('touchend', 200)
 contentWidth = 500
 await touch('touchstart', 200); await touch('touchmove', 120); await touch('touchend', 120)
 expect(swipe).toHaveBeenCalledTimes(1); expect(viewport.scrollLeft).toBe(80)
 await act(() => row.click()); expect(select).not.toHaveBeenCalled()
 await touch('touchstart', 120); await touch('touchend', 120); await act(() => row.click()); expect(select).toHaveBeenCalledTimes(1)
})
