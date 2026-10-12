import { expect, it } from 'vitest'
import { invoiceMonthLabel, resizeInvoiceDraft } from './cards'
it('aumentar quantidade preserva preenchimentos e zero, sem gerar valores fictícios', () => {
  const previous = [{ mes_referencia: '2026-11', valor: '123.45' }, { mes_referencia: '2026-12', valor: '0' }]
  expect(resizeInvoiceDraft(previous, '2026-11', 3)).toEqual({ rows: [...previous, { mes_referencia: '2027-01', valor: '' }], discardsValues: false })
})
it('diminuir quantidade identifica perda mesmo quando valor é zero', () => {
  expect(resizeInvoiceDraft([{ mes_referencia: '2026-12', valor: '0' }], '2026-11', 1).discardsValues).toBe(true)
  expect(resizeInvoiceDraft([{ mes_referencia: '2026-12', valor: '' }], '2026-11', 1).discardsValues).toBe(false)
})
it('alterar primeiro mês preserva somente competências em comum e pede confirmação das demais', () => {
  const draft = [{ mes_referencia: '2026-11', valor: '100' }, { mes_referencia: '2026-12', valor: '200' }]
  expect(resizeInvoiceDraft(draft, '2026-12', 2)).toEqual({ rows: [{ mes_referencia: '2026-12', valor: '200' }, { mes_referencia: '2027-01', valor: '' }], discardsValues: true })
  expect(draft[0].valor).toBe('100')
})
it('meses por extenso e virada de ano', () => {
  expect(invoiceMonthLabel('2026-11')).toBe('Novembro de 2026')
  expect(invoiceMonthLabel('2026-12')).toBe('Dezembro de 2026')
  expect(invoiceMonthLabel('2027-01')).toBe('Janeiro de 2027')
})
it.each([0, 61, 1.5, NaN])('quantidade inválida %s não transforma rascunho', count => {
  expect(() => resizeInvoiceDraft([], '2026-11', count)).toThrow()
})
