'use client'

import { useState, useMemo, useEffect } from 'react'
import { TrendingUp, Download, Upload } from 'lucide-react'
import type { ProjectionResult, DayResult } from '@/types'
import { balanceColor, formatBRL, monthLabel } from '@/lib/engine/projection'
import KpiCard from './KpiCard'
import MonthColumn, { type Mode } from './MonthColumn'
import DayDetail from './DayDetail'
import LedgerControls from './LedgerControls'


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
  const [visible, setVisible] = useState(4)
  useEffect(() => {
    const update = () => setVisible(window.innerWidth >= 1024 ? 4 : window.innerWidth >= 640 ? 2 : 1)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  const todayLabel = useMemo(() => todayFormatted(), [])

  const todayMonthIdx = useMemo(
    () => Math.max(0, months.findIndex(m => m.days.some(d => d.isToday))),
    [months],
  )

  const [startIndex,   setStartIndex]   = useState(todayMonthIdx)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [mode,         setMode]         = useState<Mode>('diario')

  const maxStart = Math.max(0, months.length - visible)
  const safeStart = Math.min(startIndex, maxStart)
  const visibleMonths = months.slice(safeStart, safeStart + visible)

  const selectedDay = useMemo<DayResult | null>(
    () => selectedDate ? (months.flatMap(m => m.days).find(d => d.date === selectedDate) ?? null) : null,
    [months, selectedDate],
  )

  const todayDay = useMemo<DayResult | null>(
    () => months.flatMap(m => m.days).find(d => d.isToday) ?? null,
    [months],
  )

  const currentMonth = months[safeStart] ?? months[0]
  const kpiSaldo    = todayDay?.saldo
  const kpiEntradas = currentMonth?.totalEntradas ?? 0
  const kpiSaidas   = currentMonth?.totalSaidas   ?? 0

  const hasData = useMemo(
    () => months.some(m => m.totalEntradas > 0 || m.totalSaidas > 0),
    [months],
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* KPI cards */}
      <div className="ledger-kpis grid grid-cols-3 gap-3 px-6 py-4 flex-none">
        <KpiCard
          label="Saldo Hoje"
          value={kpiSaldo === undefined ? '—' : formatBRL(kpiSaldo)}
          sublabel={kpiSaldo === undefined ? `Referência: ${projection.settings.data_ancora.split('-').reverse().join('/')}` : todayLabel}
          color={balanceColor(kpiSaldo ?? 0, kpiSaldo === undefined ? false : hasData)}
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
        startIndex={safeStart}
        visible={visible}
        onStartChange={setStartIndex}
      />

      {/* Ledger columns — 4 colunas, layout card */}
      <div className="ledger-months flex flex-1 min-h-0 overflow-hidden gap-3 px-4 py-3">
        {visibleMonths.map((month, i) => (
          <MonthColumn
            key={month.label}
            month={month}
            selectedDate={selectedDate}
            onDaySelect={setSelectedDate}
            mode={mode}
            onModeChange={setMode}
            hasData={hasData}
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
          key={selectedDay.date}
          day={selectedDay}
          onClose={() => setSelectedDate(null)}
          hasData={hasData}
        />
      )}
    </div>
  )
}
