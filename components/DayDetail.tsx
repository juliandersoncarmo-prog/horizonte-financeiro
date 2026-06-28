'use client'

import type { DayResult } from '@/types'
import { balanceColor, formatBRL } from '@/lib/engine/projection'

const COLOR_TEXT: Record<string, string> = {
  green:        'text-green',
  'green-light':'text-green-light',
  yellow:       'text-yellow',
  orange:       'text-orange',
  red:          'text-red',
}

const MONTHS = [
  'janeiro','fevereiro','março','abril','maio','junho',
  'julho','agosto','setembro','outubro','novembro','dezembro',
]
const WEEKDAYS = [
  'Domingo','Segunda-feira','Terça-feira','Quarta-feira',
  'Quinta-feira','Sexta-feira','Sábado',
]

interface DayDetailProps {
  day: DayResult
  onClose: () => void
}

export default function DayDetail({ day, onClose }: DayDetailProps) {
  const color    = balanceColor(day.saldo)
  const weekday  = WEEKDAYS[new Date(day.date + 'T12:00:00').getDay()]
  const entradas = day.events.filter(e => e.tipo === 'entrada')
  const saidas   = day.events.filter(e => e.tipo === 'saida')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-surface rounded-2xl shadow-xl border border-border w-96 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] text-text-3">{weekday}</p>
            <h3 className="text-xl font-bold text-text leading-tight num">
              {String(day.day).padStart(2, '0')} de {MONTHS[day.month]}, {day.year}
            </h3>
            <p className={`text-2xl font-bold mt-1.5 num ${COLOR_TEXT[color]}`}>
              {formatBRL(day.saldo)}
            </p>
            <p className="text-[11px] text-text-3 mt-0.5">saldo projetado</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-3 hover:bg-surface-2 hover:text-text transition-colors flex-none mt-0.5"
          >
            ✕
          </button>
        </div>

        {/* Events */}
        <div className="px-4 py-4 flex flex-col gap-5">
          {entradas.length > 0 && (
            <section>
              <p className="text-[10px] font-bold text-text-3 uppercase tracking-widest mb-2">Entradas</p>
              <div className="flex flex-col gap-1.5">
                {entradas.map((e, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 bg-green-soft rounded-xl">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text truncate">{e.descricao}</p>
                      <p className="text-[11px] text-text-3">{e.categoria}</p>
                    </div>
                    <span className="text-sm font-semibold text-green num ml-3 flex-none">{formatBRL(e.valor)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {saidas.length > 0 && (
            <section>
              <p className="text-[10px] font-bold text-text-3 uppercase tracking-widest mb-2">Saídas</p>
              <div className="flex flex-col gap-1.5">
                {saidas.map((e, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 bg-red-soft rounded-xl">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text truncate">{e.descricao}</p>
                      <p className="text-[11px] text-text-3">{e.categoria}</p>
                    </div>
                    <span className="text-sm font-semibold text-red num ml-3 flex-none">−{formatBRL(e.valor)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {day.diario > 0 && (
            <section>
              <p className="text-[10px] font-bold text-text-3 uppercase tracking-widest mb-2">Orçamento Diário</p>
              <div className="flex items-center justify-between px-3 py-2 bg-surface-2 rounded-xl">
                <p className="text-sm font-medium text-text">Gasto variável</p>
                <span className="text-sm font-semibold text-text-2 num ml-3 flex-none">−{formatBRL(day.diario)}</span>
              </div>
            </section>
          )}

          {entradas.length === 0 && saidas.length === 0 && day.diario === 0 && (
            <p className="text-sm text-text-3 text-center py-6">Nenhum evento neste dia</p>
          )}
        </div>
      </div>
    </div>
  )
}
