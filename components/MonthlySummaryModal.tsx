'use client'

import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X, Wallet, ArrowDownLeft, ArrowUpRight, TrendingUp, CreditCard, Landmark } from 'lucide-react'
import ModalPortal from './ModalPortal'
import { useProjection } from './ProjectionProvider'
import { formatBRL, monthLabel } from '@/lib/engine/projection'
import { monthSummary, summaryColor, summaryInitialIndex } from '@/lib/engine/month-summary'

export default function MonthlySummaryModal({ onClose }: { onClose: () => void }) {
  const { months } = useProjection()
  const [selected, setSelected] = useState(() => months[summaryInitialIndex(months)]?.label ?? '')
  const index = months.findIndex(month => month.label === selected)
  const month = months[index]
  const dialog = useRef<HTMLDivElement>(null)
  const summary = month ? monthSummary(month) : null
  const metrics = month && summary ? [
    { label: 'Saldo no início do mês', value: month.saldoAbertura, Icon: Wallet, color: summaryColor(month.saldoAbertura) },
    { label: 'Entradas', value: month.totalEntradas, Icon: ArrowDownLeft, color: 'text-green' },
    { label: 'Saídas', value: month.totalSaidas, Icon: ArrowUpRight, color: 'text-red' },
    { label: summary.resultado > 0 ? 'Sobrou no mês' : summary.resultado < 0 ? 'Faltou no mês' : 'Resultado do mês', value: summary.resultado, Icon: TrendingUp, color: summaryColor(summary.resultado) },
  ] : []
  return <ModalPortal label="Resumo Mensal" onClose={onClose}>
    <div ref={dialog} tabIndex={-1} className="summary-panel relative w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl bg-surface text-text border border-border shadow-xl p-5">
      <div className="flex items-center justify-between mb-4"><h2 id="summary-title" className="text-lg font-semibold">Resumo Mensal</h2><button aria-label="Fechar resumo mensal" onClick={onClose}><X /></button></div>
      {month && summary ? <>
        <div className="flex items-center justify-between gap-2 mb-3">
          <button aria-label="Mês anterior" disabled={index <= 0} className="p-2 rounded-xl hover:bg-surface-2 disabled:opacity-30" onClick={() => setSelected(months[index - 1].label)}><ChevronLeft /></button>
          <h3 aria-live="polite" className="font-semibold text-center">{monthLabel(month.year, month.month)}</h3>
          <button aria-label="Próximo mês" disabled={index >= months.length - 1} className="p-2 rounded-xl hover:bg-surface-2 disabled:opacity-30" onClick={() => setSelected(months[index + 1].label)}><ChevronRight /></button>
        </div>
        {month.days[0]?.day !== 1 && <p className="text-sm text-text-2 mb-3">Mês parcial: desde {month.days[0]?.date.split('-').reverse().join('/')}. A abertura é o saldo antes dos movimentos dessa data.</p>}
        <dl className="summary-metrics grid grid-cols-2 gap-2.5">
          {metrics.map(({ label, value, Icon, color }) => <div key={label} className="rounded-xl border border-border bg-surface-2 p-3 min-w-0">
            <Icon aria-hidden="true" size={16} className={`mb-2 ${color} opacity-80`} />
            <dt className="text-xs text-text-2 leading-snug min-h-8">{label}</dt>
            <dd className={`text-lg sm:text-xl font-bold num break-words mt-1 ${color}`}>{formatBRL(value)}</dd>
          </div>)}
        </dl>
        <div className="rounded-2xl border border-accent/20 bg-accent-soft p-4 mt-3">
          <div className="flex gap-2 items-center text-accent mb-2"><Landmark aria-hidden="true" size={18} /><p className="text-sm font-medium">Saldo previsto para o fim do mês</p></div>
          <p className={`text-3xl font-bold num break-words ${summaryColor(month.saldoFechamento)}`}>{formatBRL(month.saldoFechamento)}</p>
          <p className="text-xs text-text-2 mt-2">Inclui o saldo de abertura e o resultado mensal.</p>
        </div>
        <div className="flex items-start gap-2.5 mt-4 text-text-2"><CreditCard aria-hidden="true" size={16} className="shrink-0 mt-0.5" /><div className="flex-1 text-xs"><p>Faturas de cartões <strong className="text-text float-right ml-2 num">{formatBRL(summary.cartoes)}</strong></p><p className="mt-1">Este valor já está incluído nas Saídas.</p></div></div>
        <p className="text-xs text-text-2 mt-3">Navegação limitada ao período da projeção do calendário.</p>
      </> : <p role="status">Nenhum mês disponível na projeção.</p>}
    </div>
  </ModalPortal>
}
