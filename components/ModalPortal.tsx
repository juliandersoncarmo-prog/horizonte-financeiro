'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/** Shared viewport layer: never inherits clipping or stacking from the wizard. */
export default function ModalPortal({ children, onClose, label }: {
  children: ReactNode; onClose: () => void; label: string
}) {
  const [container] = useState(() => { if (typeof document === 'undefined') return null; const el = document.createElement('div'); el.dataset.hfModal = 'true'; return el })
  const panel = useRef<HTMLDivElement>(null)
  const close = useRef(onClose)
  useEffect(() => { close.current = onClose }, [onClose])
  useEffect(() => {
    if (!container) return
    const previousFocus = document.activeElement as HTMLElement | null
    const background = [...document.body.children].filter(el => el instanceof HTMLElement) as HTMLElement[]
    const previousInert = background.map(el => el.inert)
    background.forEach(el => { el.inert = true })
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.body.appendChild(container)
    const focusable = () => [...(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]') ?? [])].filter(el => !el.hidden && el.getAttribute('aria-hidden') !== 'true')
    ;(panel.current?.querySelector<HTMLElement>('[data-hf-initial-focus="true"]') ?? focusable()[0] ?? panel.current)?.focus()
    function keydown(event: KeyboardEvent) {
      if ([...document.querySelectorAll('[data-hf-modal]')].at(-1) !== container) return
      if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); close.current(); return }
      if (event.key !== 'Tab') return
      const fields = focusable(), first = fields[0], last = fields.at(-1)
      if (!first) { event.preventDefault(); panel.current?.focus(); return }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel.current)) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', keydown, true)
    return () => {
      document.removeEventListener('keydown', keydown, true)
      container.remove()
      background.forEach((el, i) => { el.inert = previousInert[i] })
      document.body.style.overflow = overflow
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [container])
  if (!container) return null
  return createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/50" aria-hidden="true" onClick={onClose} />
    <div ref={panel} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}
      className="relative w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl focus:outline-none">
      {children}
    </div>
  </div>, container)
}
