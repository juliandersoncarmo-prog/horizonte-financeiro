'use client'
import { useRef, useState } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { useDailyEditor, useProjectionUpdate } from './ProjectionProvider'
import { useRouter } from 'next/navigation'
import { saveDailyActual } from '@/app/actions'
import type { DayResult } from '@/types'
import { formatBRL } from '@/lib/engine/projection'

export default function InlineDailyActual({ day }: { day: DayResult }) {
  const router = useRouter()
  const updateProjection = useProjectionUpdate()
  const lock = useRef(false)
  const editor = useDailyEditor()
  const editing = editor.date === day.date
  const pencil = useRef<HTMLButtonElement>(null)
  function close() { editor.close(); setError(''); pencil.current?.focus() }
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const displayValue = day.diarioRealizado != null || day.diarioPrevisto != null || day.diario > 0 ? `−${formatBRL(day.diario)}` : '—'
  async function save() {
    if (lock.current) return
    const amount = value.trim() === '' ? null : Number(value.replace(',', '.'))
    if (amount !== null && (!Number.isFinite(amount) || amount < 0)) { setError('Informe um valor válido.'); return }
    lock.current = true; editor.setSaving(true); setBusy(true); setError('')
    try {
      const result = await saveDailyActual(day.date, amount)
      if (!result.success) { setError(result.error ?? 'Erro ao salvar.'); return }
      // This branch only runs after the server confirms persistence.
      const actual = result.actual === undefined ? (amount === null ? null : { data: day.date, valor: amount }) : result.actual
      const applied = updateProjection?.(input => ({ ...input, dailyActuals: [
        ...(input.dailyActuals ?? []).filter(actual => actual.data !== day.date),
        ...(actual === null ? [] : [actual]),
      ] }))
      close(); setNotice('Diário salvo com sucesso.'); if (!applied) router.refresh()
    } catch { setError('Falha de comunicação. Tente novamente.') }
    finally { lock.current = false; editor.setSaving(false); setBusy(false) }
  }
  return <div aria-busy={busy} className="relative min-w-0" onClick={e => e.stopPropagation()}>
    {editing && <div className="daily-editor-shell"><form className="daily-editor-form flex items-center gap-0.5 h-7 min-w-0" onSubmit={e => { e.preventDefault(); void save() }} onKeyDown={e => {
      if (e.key === 'Enter' && e.target instanceof HTMLInputElement) { e.preventDefault(); void save() }
      if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); if (!lock.current) close() }
    }}>
      <input autoFocus aria-label={`Diário em ${day.date}`} aria-invalid={!!error} aria-describedby={error ? `daily-error-${day.date}` : undefined} title="Enter confirma; Esc cancela; vazio remove o realizado" inputMode="decimal" disabled={busy} value={value} onChange={e => setValue(e.target.value)} className="daily-editor-input w-full min-w-0 h-7 px-1 text-center text-xs num border border-accent rounded bg-surface text-text outline-none disabled:opacity-50" />
      <button disabled={busy} aria-label="Confirmar Diário" title="Confirmar" className="shrink-0 h-7 w-5 flex items-center justify-center text-accent">{busy ? <span aria-hidden="true">…</span> : <Check size={14} />}</button>
      <button type="button" disabled={busy} aria-label="Cancelar Diário" title="Cancelar" onClick={close} className="shrink-0 h-7 w-5 flex items-center justify-center text-text-3"><X size={14} /></button>
    </form></div>}
    <div aria-hidden={editing || undefined} className={`daily-display flex items-center justify-center gap-1 h-7 min-w-0 ${editing ? 'daily-display-sizing hidden' : ''}`}>
      <span className={`text-sm font-medium num whitespace-nowrap ${day.diarioRealizado != null ? 'daily-actual text-text font-semibold' : 'text-text-3'}`}>{displayValue}</span>
      <button ref={pencil} tabIndex={editing ? -1 : undefined} aria-label={`Editar Diário em ${day.date}`} title="Editar Diário" onClick={() => { if (editor.open(day.date)) { setValue(day.diarioRealizado == null ? '' : String(day.diarioRealizado)); setError(''); setNotice('') } }} className="shrink-0 h-7 w-5 flex items-center justify-center text-text-3 hover:text-accent">{notice ? <Check size={12} className="text-green" /> : <Pencil size={12} />}</button>
    </div>
    {busy && <span role="status" className="sr-only">Salvando Diário…</span>}
    {notice && !editing && <span role="status" className="sr-only">{notice}</span>}
    {editing && error && <span id={`daily-error-${day.date}`} role="alert" className="daily-editor-error absolute z-20 top-full left-0 w-48 rounded border border-border bg-surface p-2 text-xs text-red shadow">{error}</span>}
  </div>
}
