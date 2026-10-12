'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, X } from 'lucide-react'
import { useOptionalProjection } from './ProjectionProvider'
import { deleteCardInvoice } from '@/app/card-actions'
import type { RecurringRule, DayResult, DayEvent } from '@/types'
import { balanceColor, formatBRL } from '@/lib/engine/projection'
import { updateTransaction, updateRecurringRule, deleteTransaction, deleteRecurringRule } from '@/app/actions'
import ModalPortal from './ModalPortal'
import CreditCardsModal from './CreditCardsModal'
import AddTransactionModal from './AddTransactionModal'

const COLOR_TEXT: Record<string, string> = {
  green:        'text-green',
  'green-light':'text-green-light',
  yellow:       'text-yellow',
  orange:       'text-orange',
  red:          'text-red',
  neutral:      'text-gray-400',
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
  hasData?: boolean
}

interface EditState {
  id: string
  kind: 'transaction' | 'rule'
  descricao: string
  valor: string
  incluido_diario: boolean
  data: string
  tipo: 'entrada' | 'saida'
  rule?: RecurringRule
}

export default function DayDetail({ day, onClose, hasData }: DayDetailProps) {
  const router = useRouter()
  const projection = useOptionalProjection()
  const [deletingEvent, setDeletingEvent] = useState<DayEvent | null>(null)
  const lock = useRef(false)
  const [refreshing, startRefresh] = useTransition()
  const [notice, setNotice] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  function closeEdit() { if (!lock.current) { setEditing(null); setConfirmDelete(false) } }
  const [cardId, setCardId] = useState<string | null>(null)
  const [addTipo,   setAddTipo]   = useState<'entrada' | 'saida' | null>(null)
  const [editing,   setEditing]   = useState<EditState | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [saving,    setSaving]    = useState(false)

  const color    = balanceColor(day.saldo, hasData)
  const weekday  = WEEKDAYS[new Date(day.date + 'T12:00:00').getDay()]
  const entradas = day.events.filter(e => e.tipo === 'entrada')
  const saidas   = day.events.filter(e => e.tipo === 'saida')

  function openEdit(e: DayEvent) {
    if (e.cardId) { setCardId(e.cardId); return }
    const id   = e.id ?? e.ruleId
    const kind = e.id ? 'transaction' : 'rule'
    if (!id) return
    setEditing({ id, kind, descricao: e.descricao, valor: String(e.valor), incluido_diario: e.incluido_diario ?? false, data: day.date, tipo: e.tipo, rule: projection?.editorData?.recurringRules.find(r => r.id === id) })
    setEditError(null)
    setConfirmDelete(false)
  }

  async function mutateEdit(remove: boolean) {
    if (!editing || lock.current) return
    lock.current = true; setSaving(true); setEditError(null)
    try {
      const dados = { ...(editing.kind === "transaction" ? { data: editing.data } : editing.rule ?? {}), descricao: editing.descricao, valor: Number(editing.valor), incluido_diario: editing.tipo === 'saida' && editing.incluido_diario }
      const result = remove
        ? editing.kind === 'transaction' ? await deleteTransaction(editing.id) : await deleteRecurringRule(editing.id, 'all-occurrences')
        : editing.kind === 'transaction' ? await updateTransaction(editing.id, dados) : await updateRecurringRule(editing.id, dados)
      if (!result.success) { setEditError(result.error ?? 'Não foi possível concluir. Tente novamente.'); return }
      setNotice(remove ? 'Lançamento excluído com sucesso.' : 'Lançamento atualizado com sucesso.')
      setEditing(null); setConfirmDelete(false)
      startRefresh(() => router.refresh())
    } catch { setEditError('Falha de comunicação. Verifique sua conexão antes de tentar novamente.') }
    finally { lock.current = false; setSaving(false) }
  }
  async function handleSaveEdit(ev: React.FormEvent) { ev.preventDefault(); if (editing?.kind === 'rule' && !window.confirm('Salvar a regra inteira? Todas as ocorrências, inclusive passadas, serão recalculadas.')) return; await mutateEdit(false) }

  async function removeEvent() {
    const event = deletingEvent
    if (!event || lock.current) return
    lock.current = true; setSaving(true); setEditError(null)
    try {
      const result = event.invoiceId && event.cardId ? await deleteCardInvoice(event.cardId, event.invoiceId)
        : event.id ? await deleteTransaction(event.id) : event.ruleId ? await deleteRecurringRule(event.ruleId, 'all-occurrences') : { success: false, error: 'Registro indisponível.' }
      if (!result.success) { setEditError(result.error ?? 'Não foi possível excluir.'); return }
      setDeletingEvent(null); setNotice('Registro excluído com sucesso.'); startRefresh(() => router.refresh())
    } catch { setEditError('Falha de comunicação. Tente novamente.') }
    finally { lock.current = false; setSaving(false) }
  }

  const fieldClass = 'w-full border border-border rounded-xl px-3 py-2 text-sm bg-surface-2 text-text focus:outline-none focus:border-accent'
  const labelClass = 'text-xs font-semibold uppercase tracking-widest text-text-3 block mb-1'

  function eventRow({ e, isEntrada }: { e: DayEvent; isEntrada: boolean }) {
    const bg       = isEntrada ? 'bg-green-soft' : 'bg-red-soft'
    const valColor = isEntrada ? 'text-green'     : 'text-red'
    const prefix   = isEntrada ? ''                : '−'
    return (
      <div key={e.id ?? e.ruleId ?? e.invoiceId} className={`flex items-center justify-between px-3 py-2 ${bg} rounded-xl`}>
        <p className="text-sm font-medium text-text truncate min-w-0">{e.descricao}{e.incluido_diario ? " · incluída no Diário" : ""}</p>
        <div className="flex items-center gap-2 ml-3 flex-none">
          <span className={`text-sm font-semibold num ${valColor}`}>{prefix}{formatBRL(e.valor)}</span>
          <button
            onClick={() => openEdit(e)}
            className="text-text-3 hover:text-accent transition-colors"
            aria-label={`Editar ${e.descricao}`} title="Editar"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button disabled={saving || refreshing} aria-label={`Excluir ${e.descricao}`} title="Excluir" onClick={() => { setEditError(null); setDeletingEvent(e) }} className="text-text-3 hover:text-red"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    )
  }

  return (
    <>
    <ModalPortal onClose={() => { if (!lock.current) onClose() }} label="Detalhes do dia">

      {/* Modal */}
      <div className="relative bg-surface rounded-2xl shadow-xl border border-border w-full max-h-[80vh] overflow-y-auto">
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
            aria-label="Fechar detalhes" disabled={saving} onClick={onClose}
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
                {entradas.map(e => eventRow({ e, isEntrada: true }))}
              </div>
            </section>
          )}

          {saidas.length > 0 && (
            <section>
              <p className="text-[10px] font-bold text-text-3 uppercase tracking-widest mb-2">Saídas</p>
              <div className="flex flex-col gap-1.5">
                {saidas.map(e => eventRow({ e, isEntrada: false }))}
              </div>
            </section>
          )}

          {notice && <p role="status" className="text-sm text-green">{notice}</p>}
          {refreshing && <p role="status" className="text-sm text-text-3">Atualizando saldos…</p>}
          {entradas.length === 0 && saidas.length === 0 && (
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

    </ModalPortal>
      {cardId && <CreditCardsModal initialCardId={cardId} onClose={() => setCardId(null)} />}

      {deletingEvent && <ModalPortal label="Confirmar exclusão" onClose={() => { if (!lock.current) setDeletingEvent(null) }}>
        <div className="bg-surface p-6 rounded-2xl space-y-4">
          <h2 className="font-semibold">Excluir {deletingEvent.descricao}?</h2>
          <p className="text-sm">{deletingEvent.invoiceId ? 'Somente esta fatura será excluída. O cartão e as outras faturas permanecem.' : deletingEvent.ruleId ? 'A regra inteira será excluída, afetando todas as ocorrências, inclusive passadas. Saldos e Resumo Mensal serão recalculados.' : 'Somente este lançamento será excluído. Saldos e Resumo Mensal serão recalculados.'}</p>
          {editError && <p role="alert">{editError}</p>}
          <button disabled={saving} onClick={() => void removeEvent()} className="bg-red text-white rounded-xl p-3">{saving ? 'Excluindo…' : 'Confirmar exclusão'}</button>
          <button disabled={saving} onClick={() => setDeletingEvent(null)} className="ml-3 p-3">Cancelar</button>
        </div>
      </ModalPortal>}
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
        <ModalPortal onClose={closeEdit} label={editing.kind === 'rule' ? 'Editar regra recorrente' : 'Editar lançamento'}>
          <div className="relative bg-surface rounded-2xl shadow-xl border border-border w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-text">
                {editing.kind === 'rule' ? 'Editar recorrente' : 'Editar lançamento'}
              </h2>
              <button disabled={saving} aria-label="Fechar edição" onClick={closeEdit} className="text-text-3 hover:text-text transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            {editing.kind === 'rule' && (
              <p className="text-xs text-text-3 mb-4">
                Altera a regra recorrente — recalcula todas as ocorrências, inclusive as passadas.
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
              {editing.kind === 'transaction' && <label className={labelClass}>Data<input type="date" required value={editing.data} onChange={e => setEditing(state => state && ({ ...state, data: e.target.value }))} className={fieldClass} /></label>}
              {editing.kind === 'rule' && editing.rule && <>
                <label className={labelClass}>Frequência<select className={fieldClass} value={editing.rule.frequencia} onChange={e => setEditing(state => state?.rule ? ({ ...state, rule: { ...state.rule, frequencia: e.target.value as RecurringRule['frequencia'] } }) : state)}>{[['mensal','Mensal'],['quinzenal','Duas vezes por mês'],['semanal','Semanal'],['unico','Uma vez']].map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label className={labelClass}>Dia do mês<input type="number" min="1" max="31" required className={fieldClass} value={editing.rule.dia_do_mes} onChange={e => setEditing(state => state?.rule ? ({ ...state, rule: { ...state.rule, dia_do_mes: Number(e.target.value) } }) : state)} /></label>
                <label className={labelClass}>Data inicial<input type="date" required className={fieldClass} value={editing.rule.data_inicio} onChange={e => setEditing(state => state?.rule ? ({ ...state, rule: { ...state.rule, data_inicio: e.target.value } }) : state)} /></label>
                <label className={labelClass}>Término<select className={fieldClass} value={editing.rule.modo_termino} onChange={e => setEditing(state => state?.rule ? ({ ...state, rule: { ...state.rule, modo_termino: e.target.value as RecurringRule['modo_termino'], valor_termino: null } }) : state)}>{[['nunca','Sem término'],['horizonte','Horizonte'],['ocorrencias','Quantidade de ocorrências'],['data','Data final']].map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                {['data', 'ocorrencias'].includes(editing.rule.modo_termino) && <label className={labelClass}>{editing.rule.modo_termino === 'data' ? 'Data final' : 'Quantidade'}<input required type={editing.rule.modo_termino === 'data' ? 'date' : 'number'} min={editing.rule.modo_termino === 'data' ? editing.rule.data_inicio : '1'} max={editing.rule.modo_termino === 'ocorrencias' ? '1200' : undefined} className={fieldClass} value={editing.rule.valor_termino ?? ''} onChange={e => setEditing(state => state?.rule ? ({ ...state, rule: { ...state.rule, valor_termino: e.target.value } }) : state)} /></label>}
              </>}
              {editing.tipo === 'saida' && <label className="text-sm text-text"><input type="checkbox" checked={editing.incluido_diario} onChange={e => setEditing(s => s && ({ ...s, incluido_diario: e.target.checked }))} /> Incluída no total do Diário</label>}
              {editError && <p role="alert" className="text-xs text-red">{editError}</p>}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  disabled={saving} aria-label="Fechar edição" onClick={closeEdit}
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
              <button type="button" disabled={saving} onClick={() => setConfirmDelete(true)} className="text-red text-sm border border-red rounded-xl py-2 disabled:opacity-50">{editing.kind === 'rule' ? 'Excluir regra recorrente' : 'Excluir lançamento'}</button>
              {confirmDelete && <div role="alert" className="text-sm bg-red-soft rounded-xl p-3 space-y-3">
                <p>{editing.kind === 'rule' ? 'Excluir a regra inteira? Todas as ocorrências geradas por ela, passadas e futuras, desaparecerão da projeção e do Resumo Mensal. Lançamentos avulsos permanecem. Não há exclusão de uma ocorrência isolada.' : 'Excluir somente este lançamento? Os saldos e o Resumo Mensal serão recalculados.'}</p>
                <button type="button" disabled={saving} onClick={() => void mutateEdit(true)} className="bg-red text-white rounded-lg px-3 py-2 disabled:opacity-50">{saving ? 'Excluindo…' : 'Confirmar exclusão'}</button>
                <button type="button" disabled={saving} onClick={() => setConfirmDelete(false)} className="ml-3">Cancelar exclusão</button>
              </div>}
            </form>
          </div>
        </ModalPortal>
      )}
    </>
  )
}
