'use client'

import { useState, useMemo } from 'react'
import type { ProjectionResult, DayResult } from '@/types'
import { balanceColor, formatBRL } from '@/lib/engine/projection'
import KpiCard from './KpiCard'
import MonthColumn, { type Mode } from './MonthColumn'
import DayDetail from './DayDetail'
import LedgerControls from './LedgerControls'

interface LedgerViewProps {
  projection: ProjectionResult
}

function todayString(): string {
  const t = new Date()
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
}

export default function LedgerView({ projection }: LedgerViewProps) {
  const { months } = projection
  const todayISO = useMemo(todayString, [])

  const todayMonthIdx = useMemo(
    () => Math.max(0, months.findIndex(m => m.days.some(d => d.isToday))),
    [months],
  )

  const [startIndex,   setStartIndex]   = useState(todayMonthIdx)
  const [visible,      setVisible]      = useState<1 | 2 | 3>(3)
  const [mode,         setMode]         = useState<Mode>('entrada')
  const [selectedDate, setSelectedDate] = useState<string | null>(todayISO)

  const visibleMonths = months.slice(startIndex, startIndex + visible)

  const selectedDay = useMemo<DayResult | null>(
    () => selectedDate ? (months.flatMap(m => m.days).find(d => d.date === selectedDate) ?? null) : null,
    [months, selectedDate],
  )

  const todayDay = useMemo<DayResult | null>(
    () => months.flatMap(m => m.days).find(d => d.isToday) ?? null,
    [months],
  )

  const currentMonth = months[startIndex] ?? months[0]
  const kpiSaldo     = todayDay?.saldo ?? projection.settings.saldo_abertura
  const kpiEntradas  = currentMonth?.totalEntradas ?? 0
  const kpiSaidas    = currentMonth?.totalSaidas   ?? 0
  const firstNeg     = projection.firstNegativeDate

  function handleToday() {
    setSelectedDate(todayISO)
    setStartIndex(todayMonthIdx)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-3 px-6 py-4 flex-none">
        <KpiCard
          label="Saldo Hoje"
          value={formatBRL(kpiSaldo)}
          sublabel={todayISO}
          color={balanceColor(kpiSaldo)}
        />
        <KpiCard
          label="Entradas do Mês"
          value={formatBRL(kpiEntradas)}
          sublabel={currentMonth?.label}
          color="green"
        />
        <KpiCard
          label="Saídas do Mês"
          value={formatBRL(kpiSaidas)}
          sublabel={currentMonth?.label}
          color="red"
        />
        <KpiCard
          label="Primeiro Saldo Negativo"
          value={firstNeg ?? 'Não previsto'}
          color={firstNeg ? 'red' : 'green'}
        />
      </div>

      {/* Controls */}
      <LedgerControls
        months={months}
        startIndex={startIndex}
        visible={visible}
        mode={mode}
        onStartChange={setStartIndex}
        onVisibleChange={setVisible}
        onModeChange={setMode}
        onToday={handleToday}
      />

      {/* Ledger + detail panel */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 overflow-x-auto overflow-y-hidden">
          {visibleMonths.map(month => (
            <MonthColumn
              key={month.label}
              month={month}
              selectedDate={selectedDate}
              onDaySelect={setSelectedDate}
              mode={mode}
            />
          ))}
        </div>
        <DayDetail day={selectedDay} />
      </div>
    </div>
  )
}
