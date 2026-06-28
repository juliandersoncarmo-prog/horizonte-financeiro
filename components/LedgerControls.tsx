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

  const yearRange = useMemo(
    () => [...new Set(months.map(m => m.year))],
    [months],
  )

  const currentYear = months[startIndex]?.year ?? yearRange[0]

  function jumpToYear(year: number) {
    const idx = months.findIndex(m => m.year === year)
    onStartChange(idx !== -1 ? idx : 0)
  }

  const atFirst = startIndex === 0
  const atLast  = startIndex + visible >= months.length

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
