'use client'

import { useRef, useState } from 'react'
import { CalendarX2, CalendarRange, ChevronRight } from 'lucide-react'
import ModalPortal from './ModalPortal'
import { cancelRecurringMonth, endRecurringFromMonth } from '@/app/actions'
import { monthLabel } from '@/lib/engine/projection'

export default function CancelRecurringDialog({ ruleId, name, date, onClose, onSaved }: {
  ruleId: string; name: string; date: string; onClose: () => void; onSaved: () => void
}) {
  const [scope, setScope] = useState<'month' | 'future' | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [uncertain, setUncertain] = useState(false)
  const lock = useRef(false)
  const [year, month] = date.split('-').map(Number)
  const label = monthLabel(year, month - 1)
  async function confirm() {
    if (!scope || lock.current || uncertain) return
    lock.current = true; setBusy(true); setError('')
    try {
      const result = scope === 'month' ? await cancelRecurringMonth(ruleId, date) : await endRecurringFromMonth(ruleId, date)
      if (!result.success) {
        setUncertain(true)
        setError(result.error ?? 'Não foi possível confirmar. Recarregue para conferir o resultado.')
        return
      }
      onSaved()
    } catch {
      setUncertain(true)
      setError('Confirmação não recebida. Recarregue para conferir o resultado antes de tentar novamente.')
    } finally { lock.current = false; setBusy(false) }
  }
  return <ModalPortal label={scope ? 'Confirmar cancelamento' : 'Cancelar recorrência?'} onClose={() => { if (!lock.current) onClose() }}>
    <div className="recurring-cancel-panel bg-surface text-text border border-border rounded-2xl p-5">
      <h2 className="text-lg font-semibold">{scope ? 'Confirmar cancelamento' : 'Cancelar recorrência?'}</h2>
      <div className="my-4"><p className="font-semibold break-words">{name}</p><p className="text-sm text-text-2">{label}</p></div>
      {!scope ? <>
        <p className="text-sm text-text-2 mb-4">Escolha quais lançamentos deseja cancelar.</p>
        <div className="flex flex-col gap-3">
          <button type="button" className="recurring-cancel-option" onClick={() => setScope('month')}><CalendarX2 size={20} className="text-accent shrink-0" aria-hidden="true" /><span className="flex-1 min-w-0"><strong className="block text-sm">Somente este mês</strong><span className="block text-xs text-text-2 mt-1">Cancela {label.toLocaleLowerCase('pt-BR')}.</span></span><ChevronRight size={18} className="text-text-3 shrink-0" aria-hidden="true" /></button>
          <button type="button" className="recurring-cancel-option" onClick={() => setScope('future')}><CalendarRange size={20} className="text-red shrink-0" aria-hidden="true" /><span className="flex-1 min-w-0"><strong className="block text-sm">Deste mês em diante</strong><span className="block text-xs text-text-2 mt-1">Preserva os meses anteriores.</span></span><ChevronRight size={18} className="text-text-3 shrink-0" aria-hidden="true" /></button>
        </div>
      </> : <>
        <p className="text-sm text-text-2 mb-4">{scope === 'month' ? `Cancelar todas as ocorrências de ${label.toLocaleLowerCase('pt-BR')}?` : `Encerrar a partir de ${label.toLocaleLowerCase('pt-BR')}? Os meses anteriores serão preservados.`}</p>
        <button type="button" disabled={busy || uncertain} onClick={() => void confirm()} className={`w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50 ${scope === 'month' ? 'bg-accent' : 'bg-red'}`}>{busy ? 'Cancelando…' : 'Confirmar cancelamento'}</button>
      </>}
      {error && <p role="alert" className="text-sm text-red mt-3">{error}</p>}
      {busy && <p role="status" className="text-xs text-text-2 mt-3">Atualizando recorrência…</p>}
      <button type="button" disabled={busy} className="w-full border border-border rounded-xl py-3 text-sm mt-4 disabled:opacity-50" onClick={() => { if (scope && !uncertain) setScope(null); else onClose() }}>Voltar</button>
      <p className="text-xs text-text-3 mt-3 leading-relaxed">Os saldos e as projeções serão atualizados após a confirmação.</p>
    </div>
  </ModalPortal>
}
