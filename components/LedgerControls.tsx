'use client'

import type { MonthResult } from '@/types'
import { monthLabel } from '@/lib/engine/projection'
import type { Mode } from './MonthColumn'

interface LedgerControlsProps {
  months: MonthResult[]
  startIndex: number
  visible: 1 | 2 | 3
  mode: Mode
  onStartChange: (i: number) => void
  onVisibleChange: (n: 1 | 2 | 3) => void
  onModeChange: (m: Mode) => void
  onToday: () => void
}

export default function LedgerControls({
  months, startIndex, visible, mode,
  onStartChange, onVisibleChange, onModeChange, onToday,
}: LedgerControlsProps) {
  const btnBase = 'flex items-center justify-center rounded-lg border border-border text-sm text-text-2 hover:bg-surface-2 disabled:opacity-40 transition-colors'

  return (
    <div className="flex items-center gap-3 px-6 py-2.5 border-b border-border bg-surface flex-none flex-wrap">
      {/* Month select */}
      <select
        value={startIndex}
        onChange={e => onStartChange(Number(e.target.value))}
        className="text-sm border border-border rounded-xl px-3 py-1.5 bg-surface text-text focus:outline-none focus:border-accent cursor-pointer"
      >
        {months.map((m, i) => (
          <option key={m.label} value={i}>{monthLabel(m.year, m.month)}</option>
        ))}
      </select>

      {/* Prev / Next / Hoje */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onStartChange(Math.max(0, startIndex - 1))}
          disabled={startIndex === 0}
          className={`${btnBase} w-8 h-8 text-base`}
        >
          ‹
        </button>
        <button
          onClick={() => onStartChange(Math.min(months.length - visible, startIndex + 1))}
          disabled={startIndex >= months.length - visible}
          className={`${btnBase} w-8 h-8 text-base`}
        >
          ›
        </button>
        <button
          onClick={onToday}
          className={`${btnBase} px-3 h-8 text-xs font-medium`}
        >
          Hoje
        </button>
      </div>

      <div className="flex-1" />

      {/* Visible months: 1 / 2 / 3 */}
      <div className="flex items-center gap-0.5 bg-surface-2 rounded-xl p-0.5">
        {([1, 2, 3] as const).map(n => (
          <button
            key={n}
            onClick={() => onVisibleChange(n)}
            className={[
              'w-8 h-7 rounded-lg text-sm font-medium transition-colors',
              visible === n ? 'bg-surface text-text shadow-sm' : 'text-text-3 hover:text-text-2',
            ].join(' ')}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Mode: Entradas / Saídas / Diário */}
      <div className="flex items-center gap-0.5 bg-surface-2 rounded-xl p-0.5">
        {(['entrada', 'saida', 'diario'] as const).map(m => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className={[
              'px-3 h-7 rounded-lg text-xs font-medium transition-colors',
              mode === m ? 'bg-surface text-text shadow-sm' : 'text-text-3 hover:text-text-2',
            ].join(' ')}
          >
            {m === 'entrada' ? 'Entradas' : m === 'saida' ? 'Saídas' : 'Diário'}
          </button>
        ))}
      </div>
    </div>
  )
}
