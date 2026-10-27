// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'
import MonthColumn from './MonthColumn'
import { runProjection } from '@/lib/engine/projection'
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))
vi.mock('@/app/actions', () => ({ saveDailyActual: vi.fn() }))
vi.mock('./ProjectionProvider', () => ({ useDailyEditor: () => ({ date: null, open: vi.fn(), close: vi.fn() }), useProjectionUpdate: () => undefined }))
let cleanup = () => {}
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); document.body.innerHTML = '' })
async function setup(width = 390, today = true, rowTop = 1300) {
 Object.defineProperty(window, 'innerWidth', { value: width, configurable: true })
 const frames = new Map<number, FrameRequestCallback>(); let id = 0
 vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { frames.set(++id, cb); return id })
 vi.stubGlobal('cancelAnimationFrame', (key: number) => frames.delete(key))
 const month = runProjection({ settings: { saldo_abertura: 1000, data_ancora: '2026-10-01' }, recurringRules: [], transactions: [], dailyBudgets: [], horizonMonths: 1 }).months[0]
 month.days = month.days.map(day => ({ ...day, isToday: today && day.day === 27 }))
 const host = document.createElement('div'); document.body.append(host); const root = createRoot(host)
 const draw = () => root.render(<div className="ledger-view"><div className="ledger-kpis">Indicadores</div><MonthColumn month={{ ...month }} selectedDate={null} onDaySelect={vi.fn()} mode="diario" onModeChange={vi.fn()} /></div>)
 cleanup = () => act(() => root.unmount())
 await act(draw)
 const page = host.querySelector<HTMLElement>('.ledger-view')!, rows = host.querySelector<HTMLElement>('.month-scroll')!
 for (const element of [page, rows]) {
  Object.defineProperty(element, 'clientHeight', { value: 500 })
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({ top: 60, height: 500 } as DOMRect)
 }
 vi.spyOn(host.querySelector('.month-table-heading')!, 'getBoundingClientRect').mockReturnValue({ height: 40 } as DOMRect)
 const current = host.querySelector('[data-today]')
 if (current) vi.spyOn(current, 'getBoundingClientRect').mockReturnValue({ top: rowTop, height: 40 } as DOMRect)
 const flush = () => act(() => { const pending = [...frames.values()]; frames.clear(); pending.forEach(cb => cb(0)) })
 return { page, rows, draw, flush, frames, host }
}
it.each([320, 375, 390, 430])('positions today using the mobile page at %ipx, once, without moving rows internally', async width => {
 const { page, rows, draw, flush, frames } = await setup(width)
 await flush()
 expect(page.scrollTop).toBe(1192); expect(rows.scrollTop).toBe(0)
 page.scrollTop = 30
 await act(draw); await flush()
 expect(page.scrollTop).toBe(30); expect(frames.size).toBe(0)
})
it.each(['wheel', 'touchstart', 'pointerdown', 'keydown'])('cancels pending mobile positioning on %s anywhere in the page', async event => {
 const { page, flush, host } = await setup()
 host.querySelector('.ledger-kpis')!.dispatchEvent(new Event(event, { bubbles: true }))
 await flush(); expect(page.scrollTop).toBe(0)
})
it('leaves an already visible current day in place', async () => {
 const { page, flush } = await setup(390, true, 180)
 await flush(); expect(page.scrollTop).toBe(0)
})
it('does not position months without today', async () => {
 const { page, rows, flush } = await setup(390, false)
 await flush(); expect(page.scrollTop).toBe(0); expect(rows.scrollTop).toBe(0)
})
it.each([640, 768, 1280])('keeps desktop/tablet internal positioning at %ipx', async width => {
 const { page, rows, flush } = await setup(width)
 await flush(); expect(page.scrollTop).toBe(0); expect(rows.scrollTop).toBeGreaterThan(1000)
})
