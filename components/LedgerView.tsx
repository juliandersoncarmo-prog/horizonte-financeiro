'use client'

import { useState, useMemo } from 'react'
import { TrendingUp, Download, Upload } from 'lucide-react'
import type { ProjectionResult, DayResult } from '@/types'
import { balanceColor, formatBRL, monthLabel } from '@/lib/engine/projection'
import KpiCard from './KpiCard'
import MonthColumn, { type Mode } from './MonthColumn'
import DayDetail from './DayDetail'
import LedgerControls from './LedgerControls'

const VISIBLE = 4

const MONTHS_SHORT = ['jan.','fev.','mar.','abr.','mai.','jun.','jul.','ago.','set.','out.','nov.','dez.']

function todayFormatted(): string {
  const t = new Date()
  return `${t.getDate()} de ${MONTHS_SHORT[t.getMonth()]} de ${t.getFullYear()}`
}

interface LedgerViewProps {
  projection: ProjectionResult
}

export default function LedgerView({ projection }: LedgerViewProps) {
  const { months } = projection
  const todayLabel = useMemo(todayFormatted, [])

  const todayMonthIdx = useMemo(
    () => Math.max(0, months.findIndex(m => m.days.some(d => d.isToday))),
    [months],
  )

  const [startIndex,   setStartIndex]   = useState(todayMonthIdx)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [mode,         setMode]         = useState<Mode>('diario')

  const visibleMonths = months.slice(startIndex, startIndex + VISIBLE)

  const selectedDay = useMemo<DayResult | null>(
    () => selectedDate ? (months.flatMap(m => m.days).find(d => d.date === selectedDate) ?? null) : null,
    [months, selectedDate],
  )

  const todayDay = useMemo<DayResult | null>(
    () => months.flatMap(m => m.days).find(d => d.isToday) ?? null,
    [months],
  )

  const currentMonth = months[startIndex] ?? months[0]
  const kpiSaldo    = todayDay?.saldo ?? projection.settings.saldo_abertura
  const kpiEntradas = currentMonth?.totalEntradas ?? 0
  const kpiSaidas   = currentMonth?.totalSaidas   ?? 0

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-3 px-6 py-4 flex-none">
        <KpiCard
          label="Saldo Hoje"
          value={formatBRL(kpiSaldo)}
          sublabel={todayLabel}
          color={balanceColor(kpiSaldo)}
          icon={TrendingUp}
          iconBg="#dcfce7"
          iconColor="#16a34a"
        />
        <KpiCard
          label="Entradas do Mês"
          value={formatBRL(kpiEntradas)}
          sublabel={currentMonth ? monthLabel(currentMonth.year, currentMonth.month) : undefined}
          color="green"
          icon={Download}
          iconBg="#dcfce7"
          iconColor="#16a34a"
        />
        <KpiCard
          label="Saídas do Mês"
          value={kpiSaidas > 0 ? `-${formatBRL(kpiSaidas)}` : formatBRL(kpiSaidas)}
          sublabel={currentMonth ? monthLabel(currentMonth.year, currentMonth.month) : undefined}
          color="red"
          icon={Upload}
          iconBg="#fee2e2"
          iconColor="#dc2626"
        />
      </div>

      {/* Controls */}
      <LedgerControls
        months={months}
        startIndex={startIndex}
        visible={VISIBLE}
        onStartChange={setStartIndex}
      />

      {/* Ledger columns — 4 colunas, layout card */}
      <div className="flex flex-1 overflow-hidden gap-3 px-4 py-3">
        {visibleMonths.map((month, i) => (
          <MonthColumn
            key={month.label}
            month={month}
            selectedDate={selectedDate}
            onDaySelect={setSelectedDate}
            mode={mode}
            onModeChange={setMode}
            className={
              i >= 2 ? 'flex-1 min-w-0 hidden lg:flex' :
              i >= 1 ? 'flex-1 min-w-0 hidden sm:flex' :
              'flex-1 min-w-0'
            }
          />
        ))}
      </div>

      {/* Day detail modal */}
      {selectedDay && (
        <DayDetail
          day={selectedDay}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  )
}
