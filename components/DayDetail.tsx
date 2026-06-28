'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, X } from 'lucide-react'
import type { DayResult, DayEvent } from '@/types'
import { balanceColor, formatBRL } from '@/lib/engine/projection'
import { updateTransaction, updateRecurringRule } from '@/app/actions'
import AddTransactionModal from './AddTransactionModal'

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

interface EditState {
  id: string
  kind: 'transaction' | 'rule'
  descricao: string
  valor: string
}

export default function DayDetail({ day, onClose }: DayDetailProps) {
  const router = useRouter()
  const [addTipo,   setAddTipo]   = useState<'entrada' | 'saida' | null>(null)
  const [editing,   setEditing]   = useState<EditState | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [saving,    setSaving]    = useState(false)

  const color    = balanceColor(day.saldo)
  const weekday  = WEEKDAYS[new Date(day.date + 'T12:00:00').getDay()]
  const entradas = day.events.filter(e => e.tipo === 'entrada')
  const saidas   = day.events.filter(e => e.tipo === 'saida')

  function openEdit(e: DayEvent) {
    const id   = e.id ?? e.ruleId
    const kind = e.id ? 'transaction' : 'rule'
    if (!id) return
    setEditing({ id, kind, descricao: e.descricao, valor: String(e.valor) })
    setEditError(null)
  }

  async function handleSaveEdit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!editing) return
    setSaving(true)
    setEditError(null)
    const dados = { descricao: editing.descricao, valor: Number(editing.valor) }
    const result = editing.kind === 'transaction'
      ? await updateTransaction(editing.id, dados)
      : await updateRecurringRule(editing.id, dados)
    setSaving(false)
    if (result.success) {
      router.refresh()
      setEditing(null)
    } else {
      setEditError(result.error ?? 'Erro ao salvar')
    }
  }

  const fieldClass = 'w-full border border-border rounded-xl px-3 py-2 text-sm bg-surface-2 text-text focus:outline-none focus:border-accent'
  const labelClass = 'text-xs font-semibold uppercase tracking-widest text-text-3 block mb-1'

  function EventRow({ e, isEntrada }: { e: DayEvent; isEntrada: boolean }) {
    const bg       = isEntrada ? 'bg-green-soft' : 'bg-red-soft'
    const valColor = isEntrada ? 'text-green'     : 'text-red'
    const prefix   = isEntrada ? ''                : '−'
    return (
      <div className={`flex items-center justify-between px-3 py-2 ${bg} rounded-xl`}>
        <p className="text-sm font-medium text-text truncate min-w-0">{e.descricao}</p>
        <div className="flex items-center gap-2 ml-3 flex-none">
          <span className={`text-sm font-semibold num ${valColor}`}>{prefix}{formatBRL(e.valor)}</span>
          <button
            onClick={() => openEdit(e)}
            className="text-text-3 hover:text-accent transition-colors"
            title="Editar"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

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
                {entradas.map((e, i) => <EventRow key={i} e={e} isEntrada={true} />)}
              </div>
            </section>
          )}

          {saidas.length > 0 && (
            <section>
              <p className="text-[10px] font-bold text-text-3 uppercase tracking-widest mb-2">Saídas</p>
              <div className="flex flex-col gap-1.5">
                {saidas.map((e, i) => <EventRow key={i} e={e} isEntrada={false} />)}
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

        {/* Ações */}
        <div className="px-4 pb-4 flex gap-2">
          <button
            onClick={() => setAddTipo('entrada')}
            className="flex-1 py-2 rounded-xl text-sm font-semibold bg-green text-white hover:opacity-90 transition-opacity"
          >
            + Entrada
          </button>
          <button
            onClick={() => setAddTipo('saida')}
            className="flex-1 py-2 rounded-xl text-sm font-semibold bg-red text-white hover:opacity-90 transition-opacity"
          >
            + Saída
          </button>
        </div>
      </div>

      {/* Modal de adição */}
      {addTipo && (
        <AddTransactionModal
          tipo={addTipo}
          defaultDate={day.date}
          onClose={() => setAddTipo(null)}
        />
      )}

      {/* Modal de edição inline */}
      {editing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditing(null)} />
          <div className="relative bg-surface rounded-2xl shadow-xl border border-border w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-text">
                {editing.kind === 'rule' ? 'Editar recorrente' : 'Editar lançamento'}
              </h2>
              <button onClick={() => setEditing(null)} className="text-text-3 hover:text-text transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            {editing.kind === 'rule' && (
              <p className="text-xs text-text-3 mb-4">
                Altera a regra recorrente — afeta todas as ocorrências futuras.
              </p>
            )}
            <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
              <div>
                <label className={labelClass}>Descrição</label>
                <input
                  type="text"
                  required
                  value={editing.descricao}
                  onChange={ev => setEditing(s => s && ({ ...s, descricao: ev.target.value }))}
                  className={fieldClass}
                />
              </div>
              <div>
                <label className={labelClass}>Valor (R$)</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={editing.valor}
                  onChange={ev => setEditing(s => s && ({ ...s, valor: ev.target.value }))}
                  className={fieldClass}
                />
              </div>
              {editError && <p className="text-xs text-red">{editError}</p>}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="flex-1 border border-border rounded-xl py-2 text-sm text-text-2 hover:bg-surface-2 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-accent text-white rounded-xl py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
