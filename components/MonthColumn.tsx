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

const MODE_LABEL: Record<Mode, string> = {
  entrada: 'Entradas',
  saida:   'Saídas',
  diario:  'Diário',
}

interface MonthColumnProps {
  month: MonthResult
  selectedDate: string | null
  onDaySelect: (date: string) => void
  mode: Mode
}

export default function MonthColumn({ month, selectedDate, onDaySelect, mode }: MonthColumnProps) {
  return (
    <div className="flex-none w-72 flex flex-col border-r border-border last:border-r-0 h-full overflow-hidden">
      {/* Month header */}
      <div className="px-4 py-3 border-b border-border bg-surface flex-none">
        <h2 className="text-sm font-semibold text-text">{monthLabel(month.year, month.month)}</h2>
        <div className="flex gap-4 mt-0.5">
          <span className="text-[11px] text-text-3">
            entradas <span className="text-green-light font-semibold num">{formatBRL(month.totalEntradas)}</span>
          </span>
          <span className="text-[11px] text-text-3">
            saídas <span className="text-red font-semibold num">{formatBRL(month.totalSaidas)}</span>
          </span>
        </div>
      </div>

      {/* Column headers */}
      <div className="flex items-center px-3 py-1.5 bg-surface-2 border-b border-border flex-none">
        <span className="w-14 text-[10px] font-bold text-text-3 uppercase tracking-wider">Data</span>
        <span className="flex-1 text-right text-[10px] font-bold text-text-3 uppercase tracking-wider">{MODE_LABEL[mode]}</span>
        <span className="w-24 text-right text-[10px] font-bold text-text-3 uppercase tracking-wider">Saldo</span>
      </div>

      {/* Day rows */}
      <div className="flex-1 overflow-y-auto">
        {month.days.map(day => {
          const color    = balanceColor(day.saldo)
          const isSelected = day.date === selectedDate
          const wday     = WEEKDAY[new Date(day.date + 'T12:00:00').getDay()]

          return (
            <div key={day.date}>
              {day.isFirstNeg && (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-soft">
                  <div className="flex-1 border-t-2 border-dashed border-red" />
                  <span className="text-[9px] font-bold text-red uppercase tracking-widest flex-none whitespace-nowrap">
                    1º negativo
                  </span>
                  <div className="flex-1 border-t-2 border-dashed border-red" />
                </div>
              )}

              <button
                onClick={() => onDaySelect(day.date)}
                className={[
                  'w-full flex items-center px-3 py-1.5 text-left transition-colors',
                  isSelected   ? 'bg-accent-soft'  :
                  day.isToday  ? 'bg-surface-3'     :
                  'hover:bg-surface-2',
                ].join(' ')}
              >
                <div className="w-14 flex-none flex items-baseline gap-1">
                  <span className={`text-sm font-semibold num ${day.isToday ? 'text-accent' : 'text-text'}`}>
                    {String(day.day).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] text-text-3">{wday}</span>
                </div>

                <div className="flex-1 text-right pr-2">
                  <span className={`text-xs num ${
                    mode === 'entrada' ? 'text-green-light' :
                    mode === 'saida'   ? 'text-red'         :
                    'text-text-2'
                  }`}>
                    {midValue(day, mode)}
                  </span>
                </div>

                <div className="w-24 text-right flex-none">
                  <span className={`text-xs font-semibold num px-1.5 py-0.5 rounded-md ${SALDO_CLASS[color]}`}>
                    {formatBRL(day.saldo)}
                  </span>
                </div>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
