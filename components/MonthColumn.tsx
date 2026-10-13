'use client'

import { useRef } from 'react'
import ChoiceField from './ChoiceField'

import { exhaustedDailyBudget } from '@/lib/daily-budget-status'
import InlineDailyActual from './InlineDailyActual'
import MobileColumnMode from './MobileColumnMode'
import type { MonthResult, DayResult } from '@/types'
import { balanceColor, formatBRL, monthLabel } from '@/lib/engine/projection'

export type Mode = 'entrada' | 'saida' | 'diario'

const SALDO_CLASS: Record<string, string> = {
  green:        'text-green bg-green-soft',
  'green-light':'text-green-light bg-green-light-soft',
  yellow:       'text-yellow bg-yellow-soft',
  orange:       'text-orange bg-orange-soft',
  red:          'text-red bg-red-soft',
  neutral:      'text-gray-400 bg-gray-100',
}

const WEEKDAY = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

function midValue(day: DayResult, mode: Mode): string {
  if (mode === 'entrada') return day.inSum  > 0 ? `+${formatBRL(day.inSum)}`  : '—'
  if (mode === 'saida')   return day.outSum > 0 ? `−${formatBRL(day.outSum)}` : '—'
  return day.diarioRealizado != null || day.diario > 0 ? `−${formatBRL(day.diario)}` : '—'
}

interface MonthColumnProps {
  month: MonthResult
  selectedDate: string | null
  onDaySelect: (date: string) => void
  mode: Mode
  onModeChange: (m: Mode) => void
  className?: string
  hasData?: boolean
}

export default function MonthColumn({
  month, selectedDate, onDaySelect, mode, onModeChange, className, hasData,
}: MonthColumnProps) {
  // Overflow uses the existing gesture boundary only when content needs scrolling.
  const scrollTouch = useRef<{ x: number; y: number; left: number } | null>(null)
  const dragged = useRef(false)
  const exhausted = exhaustedDailyBudget(month)
  return (
    <div className={`month-card flex flex-col border border-border rounded-xl shadow-sm bg-surface h-full overflow-hidden ${className ?? ''}`}>

      {/* Month header */}
      <div className="month-heading px-4 py-3 border-b border-border bg-surface flex-none">
        <h2 className="relative pr-5 text-base font-bold text-text leading-tight">
          {monthLabel(month.year, month.month)}
          {mode === 'diario' && exhausted && <span role="status" aria-label="Orçamento do Diário esgotado" title="Orçamento do Diário esgotado" className="absolute right-0 top-0 inline-flex h-4 w-4 items-center justify-center rounded-full bg-surface-2 text-text-3 text-[10px] font-normal">!</span>}
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

      <div className="month-table-viewport" onTouchStart={event => {
        dragged.current = false
        if (event.currentTarget.scrollWidth <= event.currentTarget.clientWidth || event.touches.length !== 1) return
        event.stopPropagation()
        const touch = event.touches[0]
        scrollTouch.current = { x: touch.clientX, y: touch.clientY, left: event.currentTarget.scrollLeft }
      }} onTouchMove={event => {
        const start = scrollTouch.current
        if (!start || event.touches.length !== 1) return
        event.stopPropagation()
        const touch = event.touches[0], dx = touch.clientX - start.x, dy = touch.clientY - start.y
        if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          event.currentTarget.scrollLeft = start.left - dx
          dragged.current = true
        }
      }} onTouchEnd={event => { if (scrollTouch.current) event.stopPropagation(); scrollTouch.current = null }} onTouchCancel={() => { scrollTouch.current = null }} onClickCapture={event => {
        if (dragged.current) { event.preventDefault(); event.stopPropagation(); dragged.current = false }
      }}>
      <div className="month-table">
      {/* Column headers — same grid as day rows */}
      <div className="month-table-heading grid grid-cols-[72px_1fr_96px] items-center px-3 py-1.5 bg-surface-2 border-b border-border flex-none">
        <span className="text-xs font-semibold text-text-3 uppercase tracking-wide">Data</span>
        <div className="flex justify-center">
          <ChoiceField label={`Valores exibidos em ${monthLabel(month.year, month.month)}`} value={mode} onChange={value => onModeChange(value as Mode)} options={[{value:'diario',label:'Diário'},{value:'entrada',label:'Entradas'},{value:'saida',label:'Saídas'}]} className="desktop-column-mode text-xs font-semibold text-text-3 bg-transparent uppercase tracking-wide" />
          <MobileColumnMode mode={mode} onChange={onModeChange} month={monthLabel(month.year, month.month)} />
        </div>
        <span className="text-right text-xs font-semibold text-text-3 uppercase tracking-wide">Saldo</span>
      </div>

      {/* Day rows */}
      <div className="flex-1 overflow-y-auto month-scroll">
        {month.days.map(day => {
          const color      = balanceColor(day.saldo, hasData)
          const isSelected = day.date === selectedDate
          const wday       = WEEKDAY[new Date(day.date + 'T12:00:00').getDay()]
          const middle = midValue(day, mode)
          const balance = formatBRL(day.saldo)

          return (
            <div
              key={day.date}
              onClick={() => onDaySelect(day.date)}
              className={[
                'month-day-row w-full grid grid-cols-[72px_1fr_96px] h-9 items-center px-3 text-left transition-colors',
                isSelected  ? 'bg-accent-soft' :
                day.isToday ? 'bg-blue-50'     :
                'hover:bg-surface-2',
              ].join(' ')}
            >
              {/* Data */}
              <button onClick={e => { e.stopPropagation(); onDaySelect(day.date) }} aria-label={`Abrir dia ${day.date}`} className="flex items-baseline">
                <span className={`text-sm font-semibold num whitespace-nowrap ${day.isToday ? 'text-accent' : 'text-text'}`}>
                  {String(day.day).padStart(2, '0')}
                </span>
                <span className="text-xs text-text-3 ml-1 whitespace-nowrap">{wday}</span>
              </button>

              {/* Coluna central */}
              <div className="day-mid-value text-center min-w-0">
                {mode === 'diario' ? <InlineDailyActual day={day} /> : <>
                <span className={`text-sm font-medium num whitespace-nowrap ${
                  mode === 'entrada' ? 'text-green-light' :
                  mode === 'saida'   ? 'text-red'         :
                  day.diarioRealizado != null ? 'text-text font-semibold' : 'text-text-3'
                }`}>
                  {middle}
                </span></>}
              </div>

              {/* Saldo */}
              <div className="day-balance text-right">
                <span className={`text-sm font-semibold num whitespace-nowrap px-1.5 py-0.5 rounded-md ${SALDO_CLASS[color]}`}>
                  {balance}
                </span>
              </div>
            </div>
          )
        })}
      </div>
      </div>
      </div>
    </div>
  )
}
