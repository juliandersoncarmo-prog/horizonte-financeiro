// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ProjectionProvider } from './ProjectionProvider'
import InlineDailyActual from './InlineDailyActual'
import MonthColumn from './MonthColumn'
import CreditCardsModal from './CreditCardsModal'
import MonthlySummaryModal from './MonthlySummaryModal'
import { runProjection } from '@/lib/engine/projection'
import { fixture } from '@/preview/store'

const mocks = vi.hoisted(() => ({ save: vi.fn(), create: vi.fn(), get: vi.fn(), refresh: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mocks.refresh }) }))
vi.mock('@/app/actions', () => ({ saveDailyActual: mocks.save }))
vi.mock('@/app/card-actions', () => ({ createCreditCard: mocks.create, getCreditCards: mocks.get, deleteCreditCard: vi.fn(), deleteCardInvoice: vi.fn(), saveCardInvoice: vi.fn(), updateCreditCard: vi.fn() }))
// Existing components are compiled with the project's preserve JSX setting.
vi.stubGlobal('React', React)
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
let root: Root, host: HTMLDivElement
const projection = runProjection({ ...fixture(), horizonMonths: 2 })
const days = projection.months[0].days
beforeEach(() => { vi.clearAllMocks(); mocks.save.mockResolvedValue({ success: true }); mocks.create.mockResolvedValue({ success: true }); mocks.get.mockResolvedValue({ cards: [], enabled: true }); host = document.createElement('div'); document.body.append(host); root = createRoot(host) })
afterEach(async () => { await act(() => root.unmount()); host.remove() })
async function render(children: React.ReactNode) { await act(() => root.render(<ProjectionProvider projection={projection}>{children}</ProjectionProvider>)) }
function button(label: string) { const found = [...host.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === label || b.textContent === label); if (!found) throw new Error(label); return found }
async function click(label: string) { await act(() => button(label).click()) }
async function input(field: HTMLInputElement, value: string) { await act(() => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(field, value); field.dispatchEvent(new Event('input', { bubbles: true })); field.dispatchEvent(new Event('change', { bubbles: true })) }) }
async function key(value: string) { await act(() => host.querySelector('input')!.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true }))) }
async function daily() { await render(<><InlineDailyActual day={days[0]} /><InlineDailyActual day={days[1]} /></>); await click(`Editar Diário em ${days[0].date}`) }

it('opens only one editor, cancels with Escape and cancel icon', async () => { await daily(); await input(host.querySelector('input')!, '12'); await click(`Editar Diário em ${days[1].date}`); expect(host.querySelectorAll('input')).toHaveLength(1); expect(host.querySelector('input')!.getAttribute('aria-label')).toContain(days[1].date); await key('Escape'); expect(host.querySelector('input')).toBeNull(); await click(`Editar Diário em ${days[0].date}`); await click('Cancelar Diário'); expect(mocks.save).not.toHaveBeenCalled() })
it('confirms zero with Enter and empty with confirm, closing both editors', async () => { await daily(); await input(host.querySelector('input')!, '0'); await key('Enter'); expect(mocks.save).toHaveBeenCalledWith(days[0].date, 0); expect(host.querySelector('input')).toBeNull(); await click(`Editar Diário em ${days[0].date}`); await click('Confirmar Diário'); expect(mocks.save).toHaveBeenLastCalledWith(days[0].date, null); expect(host.querySelector('input')).toBeNull(); expect(mocks.refresh).toHaveBeenCalledTimes(2) })
it('keeps failed save open with its value and explains the error', async () => { mocks.save.mockResolvedValue({ success: false, error: 'Falha de armazenamento' }); await daily(); await input(host.querySelector('input')!, '18'); await key('Enter'); expect(host.querySelector('input')!.value).toBe('18'); expect(host.querySelector('[role=alert]')!.textContent).toBe('Falha de armazenamento') })
it('blocks repeated saves and switching editors while persistence is pending', async () => { let finish!: (value: { success: boolean }) => void; mocks.save.mockReturnValue(new Promise(resolve => { finish = resolve })); await daily(); await key('Enter'); await key('Enter'); await click(`Editar Diário em ${days[1].date}`); expect(mocks.save).toHaveBeenCalledTimes(1); expect(host.querySelector('input')!.getAttribute('aria-label')).toContain(days[0].date); await act(() => finish({ success: true })); expect(host.querySelector('input')).toBeNull() })
it('renders four summary cards, final balance and keeps month navigation', async () => { await render(<MonthlySummaryModal onClose={vi.fn()} />); expect(host.querySelectorAll('dl > div')).toHaveLength(4); expect(host.textContent).toContain('Saldo previsto para o fim do mês'); expect(host.textContent).toContain('Este valor já está incluído nas Saídas.'); await click('Próximo mês'); expect(button('Mês anterior').disabled).toBe(false); await click('Mês anterior') })
async function cardForm() { await render(<CreditCardsModal onClose={vi.fn()} />); const fields = host.querySelectorAll('input'); expect(fields[0].value).toBe(''); expect(fields[1].value).toBe(''); expect(fields[3].value).toBe(''); await input(fields[0], 'Teste'); await input(fields[1], '15'); await input(fields[3], '2'); const invoices = host.querySelectorAll<HTMLInputElement>('input[aria-label^="Valor de"]'); await input(invoices[0], '0'); await input(invoices[1], '100'); return fields }
async function submit() { await act(() => host.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))) }
it('preserves invoice values when increasing and when cancelling a reduction', async () => { const fields = await cardForm(); await input(fields[3], '3'); expect([...host.querySelectorAll<HTMLInputElement>('input[aria-label^="Valor de"]')].map(i => i.value)).toEqual(['0', '100', '']); window.confirm = vi.fn(() => false); await input(fields[3], '1'); expect(host.querySelectorAll('input[aria-label^="Valor de"]')).toHaveLength(3) })
it('shows success only after persistence, prevents duplicates and clears for another card', async () => { let finish!: (value: { success: boolean }) => void; mocks.create.mockReturnValue(new Promise(resolve => { finish = resolve })); await cardForm(); await submit(); expect(host.textContent).not.toContain('Cartão cadastrado!'); await submit(); expect(mocks.create).toHaveBeenCalledTimes(1); await act(() => finish({ success: true })); expect(host.textContent).toContain('Cartão cadastrado!'); expect(host.textContent).toContain('As faturas foram incluídas na projeção.'); await click('Cadastrar outro'); const fields = host.querySelectorAll('input'); expect([fields[0].value, fields[1].value, fields[3].value]).toEqual(['', '', '']); expect(host.querySelector('input[aria-label^="Valor de"]')).toBeNull() })
it('keeps failed card draft and closes success via Fechar', async () => { mocks.create.mockResolvedValueOnce({ success: false, error: 'Falha' }); const close = vi.fn(); await cardForm(); await submit(); expect(host.querySelector('input')!.value).toBe('Teste'); expect(host.querySelector('[role=alert]')!.textContent).toBe('Falha'); await render(<CreditCardsModal onClose={close} />); await submit(); await click('Fechar'); expect(close).toHaveBeenCalledTimes(1); expect(mocks.refresh).toHaveBeenCalled() })

it('distinguishes absent forecast, forecast zero and actual zero without changing financial values', async () => {
  const absent = { ...days[0], diario: 0, diarioPrevisto: undefined, diarioRealizado: null }
  const forecast = { ...days[1], diario: 0, diarioPrevisto: 0, diarioRealizado: null }
  const actual = { ...days[2], diario: 0, diarioPrevisto: 0, diarioRealizado: 0 }
  await render(<><InlineDailyActual day={absent} /><InlineDailyActual day={forecast} /><InlineDailyActual day={actual} /></>)
  const values = host.querySelectorAll('span.num')
  expect(values[0].textContent).toBe('—')
  expect(values[1].textContent).toContain('−R$')
  expect(values[1].textContent).toContain('0,00')
  expect(values[1].className).toContain('text-text-3')
  expect(values[2].textContent).toBe(values[1].textContent)
  expect(values[2].className).toContain('text-text font-semibold')
  await click(`Editar Diário em ${forecast.date}`)
  expect(host.querySelector('input')!.value).toBe('')
  await click(`Editar Diário em ${actual.date}`)
  expect(host.querySelector('input')!.value).toBe('0')
})
it('places exhausted status inside the existing month title and keeps excess in balances', async () => {
  const result = runProjection({ settings: { saldo_abertura: 1000, data_ancora: '2026-11-01' }, recurringRules: [], transactions: [], dailyBudgets: [{ id: 'b', mes_referencia: null, descricao: '', categoria: '', valor_mensal: 300 }], dailyActuals: [{ data: '2026-11-02', valor: 400 }, { data: '2026-11-03', valor: 50 }], horizonMonths: 1 })
  const month = result.months[0]
  await render(<MonthColumn month={month} selectedDate={null} onDaySelect={vi.fn()} mode="diario" onModeChange={vi.fn()} />)
  expect(host.querySelector('h2 [role=status]')?.getAttribute('aria-label')).toBe('Orçamento do Diário esgotado')
  expect(host.querySelectorAll('[role=status]')).toHaveLength(1)
  expect(host.textContent).not.toContain('Desde')
  expect(month.days[2].saldo).toBe(month.days[1].saldo - 50)
  expect(month.days[3].diarioPrevisto).toBe(0)
})
