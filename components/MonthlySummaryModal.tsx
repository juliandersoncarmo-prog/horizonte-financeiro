'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X, CircleDollarSign } from 'lucide-react'
import { useProjection } from './ProjectionProvider'
import { formatBRL, monthLabel } from '@/lib/engine/projection'
import { monthSummary, summaryColor, summaryInitialIndex } from '@/lib/engine/month-summary'

export default function MonthlySummaryModal({ onClose }: { onClose: () => void }) {
  const { months } = useProjection()
  const [selected, setSelected] = useState(() => months[summaryInitialIndex(months)]?.label ?? '')
  const index = months.findIndex(month => month.label === selected)
  const month = months[index]
  const dialog = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    dialog.current?.focus()
    return () => previous?.focus()
  }, [])
  useEffect(() => {
    function keys(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
      if (e.key !== 'Tab') return
      const root = dialog.current
      const items = Array.from(root?.querySelectorAll<HTMLElement>('button:not(:disabled)') ?? [])
      const first = items[0], last = items[items.length - 1]
      if (!first) { e.preventDefault(); return }
      if (e.shiftKey && (document.activeElement === first || document.activeElement === root)) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && (document.activeElement === last || document.activeElement === root)) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', keys)
    return () => document.removeEventListener('keydown', keys)
  }, [onClose])
  const summary = month ? monthSummary(month) : null
  const row = (label: string, value: number, color = 'text-text') => <div className="flex justify-between gap-3 py-2"><dt className="text-text-2 flex items-center gap-2"><CircleDollarSign aria-hidden="true" size={15} className="shrink-0 opacity-50" />{label}</dt><dd className={`font-semibold text-right ${color}`}>{formatBRL(value)}</dd></div>
  return <div className="fixed inset-0 z-[70] flex items-center justify-center p-3">
    <div className="absolute inset-0 bg-black/50" onClick={onClose} />
    <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="summary-title" tabIndex={-1} className="relative w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl bg-surface text-text border border-border shadow-xl p-5">
      <div className="flex items-center justify-between mb-4"><h2 id="summary-title" className="text-lg font-semibold">Resumo Mensal</h2><button aria-label="Fechar resumo mensal" onClick={onClose}><X /></button></div>
      {month && summary ? <>
        <div className="flex items-center justify-between gap-2 mb-3">
          <button aria-label="Mês anterior" disabled={index <= 0} className="p-2 rounded-xl hover:bg-surface-2 disabled:opacity-30" onClick={() => setSelected(months[index - 1].label)}><ChevronLeft /></button>
          <h3 aria-live="polite" className="font-semibold text-center">{monthLabel(month.year, month.month)}</h3>
          <button aria-label="Próximo mês" disabled={index >= months.length - 1} className="p-2 rounded-xl hover:bg-surface-2 disabled:opacity-30" onClick={() => setSelected(months[index + 1].label)}><ChevronRight /></button>
        </div>
        {month.days[0]?.day !== 1 && <p className="text-sm text-text-2 mb-3">Mês parcial: desde {month.days[0]?.date.split('-').reverse().join('/')}. A abertura é o saldo antes dos movimentos dessa data.</p>}
        <dl className="text-sm divide-y divide-border">
          {row('Saldo no início do mês', month.saldoAbertura, summaryColor(month.saldoAbertura))}
          {row('Entradas', month.totalEntradas)}
          {row('Saídas', month.totalSaidas)}
          {row(summary.resultado > 0 ? 'Sobrou no mês' : summary.resultado < 0 ? 'Faltou no mês' : 'Resultado do mês', summary.resultado, summaryColor(summary.resultado))}
          {row('Saldo previsto para o fim do mês', month.saldoFechamento, summaryColor(month.saldoFechamento))}
        </dl>
        <p className="text-xs text-text-2 mt-2 mb-4">Resultado mensal = entradas menos saídas. O saldo final inclui também o saldo de abertura.</p>
        <div className="rounded-xl bg-surface-2 p-3"><dl className="text-sm">{row('Faturas de cartões', summary.cartoes)}</dl><p className="text-xs text-text-2">Este valor já está incluído nas Saídas.</p></div>
        <p className="text-xs text-text-2 mt-3">Navegação limitada ao período da projeção do calendário.</p>
      </> : <p role="status">Nenhum mês disponível na projeção.</p>}
    </div>
  </div>
}
