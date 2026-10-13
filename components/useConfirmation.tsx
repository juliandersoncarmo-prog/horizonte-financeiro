'use client'

import { useEffect, useRef, useState } from 'react'
import ModalPortal from './ModalPortal'

/** Resolve once; cancel on Escape, backdrop, or owner unmount. No browser alert. */
export default function useConfirmation() {
  const [message, setMessage] = useState<string | null>(null)
  const pending = useRef<((answer: boolean) => void) | null>(null)
  useEffect(() => () => { pending.current?.(false); pending.current = null }, [])
  function finish(answer: boolean) { const resolve = pending.current; pending.current = null; setMessage(null); resolve?.(answer) }
  function ask(text: string): Promise<boolean> {
    if (pending.current) return Promise.resolve(false)
    setMessage(text)
    return new Promise(resolve => { pending.current = resolve })
  }
  const confirmation = message && <ModalPortal label="Confirmar alteração" onClose={() => finish(false)}>
    <div className="bg-surface text-text border border-border rounded-2xl p-5 space-y-4">
      <h2 className="font-semibold">Confirmar alteração</h2>
      <p className="text-sm leading-relaxed">{message}</p>
      <div className="flex gap-2"><button type="button" autoFocus className="flex-1 border border-border rounded-xl py-2" onClick={() => finish(false)}>Cancelar</button><button type="button" className="flex-1 bg-accent text-white rounded-xl py-2" onClick={() => finish(true)}>Confirmar</button></div>
    </div>
  </ModalPortal>
  return { ask, confirmation }
}
