// @vitest-environment happy-dom
// Local DOM benchmark only: this does not simulate network or mobile hardware.
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import { ProjectionProvider } from '../components/ProjectionProvider'
import DiarioModal from '../components/DiarioModal'
import { runProjection } from '../lib/engine/projection'
const m = vi.hoisted(() => ({ read: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))
vi.mock('@/app/actions', () => ({ getAllDailyBudgets: m.read, addDailyBudget: vi.fn(), updateDailyBudget: vi.fn(), deleteDailyBudget: vi.fn() }))
vi.stubGlobal('React', React); vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
it('measures opening a preloaded Diary, 30 budgets, 25 samples after warmup', async () => {
 const dailyBudgets = Array.from({ length: 30 }, (_, i) => ({ id: String(i), descricao: `Categoria ${i}`, categoria: '', valor_mensal: 100, mes_referencia: null }))
 const inputSnapshot = { settings: { saldo_abertura: 5000, data_ancora: '2026-10-01' }, recurringRules: [], transactions: [], dailyBudgets, horizonMonths: 73, todayISO: '2026-10-12' }
 const projection = { ...runProjection(inputSnapshot), inputSnapshot, editorData: { recurringRules: [], dailyBudgets } }
 const samples: number[] = []
 for (let i = 0; i < 30; i++) {
  const host = document.createElement('div'); document.body.append(host); const root = createRoot(host)
  await act(() => root.render(<ProjectionProvider projection={projection}>{null}</ProjectionProvider>))
  const start = performance.now()
  await act(() => root.render(<ProjectionProvider projection={projection}><DiarioModal onClose={() => {}} /></ProjectionProvider>))
  const elapsed = performance.now() - start
  expect(document.body.textContent).toContain('Categoria 29')
  if (i >= 5) samples.push(elapsed)
  await act(() => root.unmount()); host.remove()
 }
 samples.sort((a,b) => a-b)
 expect(m.read).not.toHaveBeenCalled()
 process.stdout.write(JSON.stringify({ benchmark: 'preloaded Diario modal local happy-dom', samples: 25, median_ms: samples[12], min_ms: samples[0], max_ms: samples[24], requests: m.read.mock.calls.length }))
})
