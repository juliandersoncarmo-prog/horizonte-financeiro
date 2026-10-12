'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
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
  const row = (label: string, value: number, color = 'text-text') => <div className="flex justify-between gap-3 py-2"><dt className="text-text-2">{label}</dt><dd className={`font-semibold text-right ${color}`}>{formatBRL(value)}</dd></div>
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
          {row('Saldo de abertura', month.saldoAbertura, summaryColor(month.saldoAbertura))}
          {row('Total de entradas', month.totalEntradas)}
          {row('Total de saídas', month.totalSaidas)}
          {row('Resultado mensal', summary.resultado, summaryColor(summary.resultado))}
          {row('Saldo final projetado', month.saldoFechamento, summaryColor(month.saldoFechamento))}
        </dl>
        <p className="text-xs text-text-2 mt-2 mb-4">Resultado mensal = entradas menos saídas. O saldo final inclui também o saldo de abertura.</p>
        <h4 className="font-semibold text-sm">Saídas por origem</h4>
        <dl className="text-sm">
          {row('Avulsas', summary.avulsas)}{row('Recorrentes', summary.recorrentes)}{row('Cartões · faturas informadas', summary.cartoes)}
          {row('Diário · previsto', summary.diarioPrevisto, 'text-text-2')}{row('Diário · realizado', summary.diarioRealizado)}
        </dl>
        <p className="text-xs text-text-2 mt-2">O realizado substitui o previsto no Diário. Saídas marcadas como incluídas no Diário não são somadas novamente. Avulsas, recorrentes e faturas não possuem confirmação de pagamento.</p>
        <p className="text-xs text-text-2 mt-3">Navegação limitada ao período da projeção do calendário.</p>
      </> : <p role="status">Nenhum mês disponível na projeção.</p>}
    </div>
  </div>
}
