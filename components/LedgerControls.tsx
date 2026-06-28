'use client'

import { useMemo } from 'react'
import type { MonthResult } from '@/types'

interface LedgerControlsProps {
  months: MonthResult[]
  startIndex: number
  visible: number
  onStartChange: (i: number) => void
}

export default function LedgerControls({ months, startIndex, visible, onStartChange }: LedgerControlsProps) {
  const btnBase = 'flex items-center justify-center rounded-lg border border-border text-sm text-text-2 hover:bg-surface-2 disabled:opacity-40 transition-colors'

  // Gera range de anos: 2 anos antes do início dos dados até o último ano dos dados
  const yearRange = useMemo(() => {
    const seen = new Set<number>()
    months.forEach(m => seen.add(m.year))
    const sorted = Array.from(seen).sort((a, b) => a - b)
    const min = (sorted[0] ?? new Date().getFullYear()) - 2
    const max = sorted[sorted.length - 1] ?? new Date().getFullYear()
    return Array.from({ length: max - min + 1 }, (_, i) => min + i)
  }, [months])

  const currentYear     = months[startIndex]?.year ?? yearRange[0]
  const currentMonthNum = months[startIndex]?.month

  function jumpToYear(year: number) {
    // Procura o mesmo mês no ano alvo
    const sameMonth = months.findIndex(m => m.year === year && m.month === currentMonthNum)
    if (sameMonth !== -1) {
      onStartChange(sameMonth)
      return
    }
    // Fora do range dos dados: vai para o início ou fim disponível
    if (year < (months[0]?.year ?? 9999)) {
      onStartChange(0)
    } else {
      onStartChange(Math.max(0, months.length - visible))
    }
  }

  const atFirst = startIndex === 0
  const atLast  = startIndex >= months.length - visible

  return (
    <div className="flex items-center gap-3 px-6 py-2.5 border-b border-border bg-surface flex-none">
      <select
        value={currentYear}
        onChange={e => jumpToYear(Number(e.target.value))}
        className="text-sm border border-border rounded-xl px-3 py-1.5 bg-surface text-text focus:outline-none focus:border-accent cursor-pointer"
      >
        {yearRange.map(year => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onStartChange(startIndex - 1)}
          disabled={atFirst}
          className={`${btnBase} w-8 h-8 text-base`}
        >‹</button>
        <button
          onClick={() => onStartChange(startIndex + 1)}
          disabled={atLast}
          className={`${btnBase} w-8 h-8 text-base`}
        >›</button>
      </div>
    </div>
  )
}
