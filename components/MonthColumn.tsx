'use client'

import type { MonthResult, DayResult } from '@/types'
import { balanceColor, formatBRL, monthLabel } from '@/lib/engine/projection'

export type Mode = 'entrada' | 'saida' | 'diario'

const SALDO_CLASS: Record<string, string> = {
  green:        'text-green bg-green-soft',
  'green-light':'text-green-light bg-green-light-soft',
  yellow:       'text-yellow bg-yellow-soft',
  orange:       'text-orange bg-orange-soft',
  red:          'text-red bg-red-soft',
}

const WEEKDAY = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

function midValue(day: DayResult, mode: Mode): string {
  if (mode === 'entrada') return day.inSum  > 0 ? `+${formatBRL(day.inSum)}`  : '—'
  if (mode === 'saida')   return day.outSum > 0 ? `−${formatBRL(day.outSum)}` : '—'
  return day.diario > 0 ? `−${formatBRL(day.diario)}` : '—'
}

interface MonthColumnProps {
  month: MonthResult
  selectedDate: string | null
  onDaySelect: (date: string) => void
  mode: Mode
  onModeChange: (m: Mode) => void
  className?: string
}

export default function MonthColumn({
  month, selectedDate, onDaySelect, mode, onModeChange, className,
}: MonthColumnProps) {
  return (
    <div className={`flex flex-col border border-border rounded-xl shadow-sm bg-surface h-full overflow-hidden ${className ?? ''}`}>

      {/* Month header */}
      <div className="px-4 py-3 border-b border-border bg-surface flex-none">
        <h2 className="text-base font-bold text-text leading-tight">
          {monthLabel(month.year, month.month)}
        </h2>
        <div className="flex gap-3 mt-0.5">
          <span className="text-xs text-text-2">
            entradas{' '}
            <span className="text-green-light font-medium num">{formatBRL(month.totalEntradas)}</span>
          </span>
          <span className="text-xs text-text-2">
            saídas{' '}
            <span className="text-red font-medium num">-{formatBRL(month.totalSaidas)}</span>
          </span>
        </div>
      </div>

      {/* Column headers — same grid as day rows */}
      <div className="grid grid-cols-[72px_1fr_96px] items-center px-3 py-1.5 bg-surface-2 border-b border-border flex-none">
        <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Data</span>
        <div className="flex justify-center">
          <select
            value={mode}
            onChange={e => onModeChange(e.target.value as Mode)}
            className="text-xs font-semibold text-text-3 bg-transparent border-none focus:outline-none cursor-pointer uppercase tracking-wide"
          >
            <option value="entrada">Entradas</option>
            <option value="saida">Saídas</option>
            <option value="diario">Diário</option>
          </select>
        </div>
        <span className="text-right text-xs font-semibold text-text-3 uppercase tracking-wide">Saldo</span>
      </div>

      {/* Day rows */}
      <div className="flex-1 overflow-y-auto month-scroll">
        {month.days.map(day => {
          const color      = balanceColor(day.saldo)
          const isSelected = day.date === selectedDate
          const wday       = WEEKDAY[new Date(day.date + 'T12:00:00').getDay()]

          return (
            <button
              key={day.date}
              onClick={() => onDaySelect(day.date)}
              className={[
                'w-full grid grid-cols-[72px_1fr_96px] h-9 items-center px-3 text-left transition-colors',
                isSelected  ? 'bg-accent-soft' :
                day.isToday ? 'bg-blue-50'     :
                'hover:bg-surface-2',
              ].join(' ')}
            >
              {/* Data */}
              <div className="flex items-baseline">
                <span className={`text-sm font-semibold num whitespace-nowrap ${day.isToday ? 'text-accent' : 'text-text'}`}>
                  {String(day.day).padStart(2, '0')}
                </span>
                <span className="text-xs text-text-3 ml-1 whitespace-nowrap">{wday}</span>
              </div>

              {/* Coluna central */}
              <div className="text-center">
                <span className={`text-sm font-medium num whitespace-nowrap ${
                  mode === 'entrada' ? 'text-green-light' :
                  mode === 'saida'   ? 'text-red'         :
                  'text-text-2'
                }`}>
                  {midValue(day, mode)}
                </span>
              </div>

              {/* Saldo */}
              <div className="text-right">
                <span className={`text-sm font-semibold num whitespace-nowrap px-1.5 py-0.5 rounded-md ${SALDO_CLASS[color]}`}>
                  {formatBRL(day.saldo)}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
