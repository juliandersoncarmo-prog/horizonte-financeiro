'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveDailyActual } from '@/app/actions'
import type { DayResult } from '@/types'
import { formatBRL } from '@/lib/engine/projection'

export default function InlineDailyActual({ day }: { day: DayResult }) {
  const router = useRouter()
  const lock = useRef(false)
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function save() {
    if (lock.current) return
    const amount = value.trim() === '' ? null : Number(value.replace(',', '.'))
    if (amount !== null && (!Number.isFinite(amount) || amount < 0)) { setError('Informe um valor válido.'); return }
    lock.current = true; setBusy(true); setError('')
    try {
      const result = await saveDailyActual(day.date, amount)
      if (!result.success) { setError(result.error ?? 'Erro ao salvar.'); return }
      setEditing(false); router.refresh()
    } catch { setError('Falha de comunicação. Tente novamente.') }
    finally { lock.current = false; setBusy(false) }
  }
  return <div className="relative min-w-0" onClick={e => e.stopPropagation()}>
    {editing ? <input autoFocus aria-label={`Diário em ${day.date}`} aria-invalid={!!error} title="Enter salva; Esc cancela; vazio exclui o realizado" inputMode="decimal" disabled={busy} value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => {
      if (e.key === 'Enter') { e.preventDefault(); void save() }
      if (e.key === 'Escape' && !lock.current) { e.preventDefault(); setEditing(false); setError('') }
    }} className="block w-full min-w-0 h-7 px-0 text-center text-sm num border border-accent rounded bg-surface text-text outline-none disabled:opacity-50" /> : <button aria-label={`Editar Diário em ${day.date}`} title="Editar gasto: Enter salva, Esc cancela; apague o campo e pressione Enter para excluir o realizado" onClick={() => { setValue(day.diarioRealizado == null ? '' : String(day.diarioRealizado)); setEditing(true) }} className={`w-full text-sm font-medium num whitespace-nowrap ${day.diarioRealizado != null ? 'text-text font-semibold' : 'text-text-3'}`}>{day.diarioRealizado != null || day.diario > 0 ? `−${formatBRL(day.diario)}` : '—'}</button>}
    {error && <span role="alert" className="absolute z-20 top-full left-0 w-48 rounded border border-border bg-surface p-2 text-xs text-red shadow">{error}</span>}
  </div>
}
