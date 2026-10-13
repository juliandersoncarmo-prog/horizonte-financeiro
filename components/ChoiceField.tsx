'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import ModalPortal from './ModalPortal'

export type Choice = { value: string; label: string }
/** A viewport dialog keeps choices clear of clipped cards and mobile keyboards. */
export default function ChoiceField({ value, options, onChange, label, className = '', disabled = false, anchored = false }: {
  value: string; options: Choice[]; onChange: (value: string) => void; label: string; className?: string; disabled?: boolean; anchored?: boolean
}) {
  const id = useId()
  const container = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const items = useRef<(HTMLButtonElement | null)[]>([])
  useEffect(() => {
    if (!open || !anchored) return
    items.current.find(item => item?.getAttribute('aria-checked') === 'true')?.focus()
    const outside = (event: PointerEvent) => { if (!container.current?.contains(event.target as Node)) setOpen(false) }
    const resize = () => setOpen(false)
    document.addEventListener('pointerdown', outside)
    window.addEventListener('resize', resize)
    return () => { document.removeEventListener('pointerdown', outside); window.removeEventListener('resize', resize) }
  }, [open, anchored, value])
  function closeMenu() { setOpen(false); trigger.current?.focus() }
  if (anchored) return <div ref={container} className="desktop-choice-anchor" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false) }} onKeyDown={event => {
    if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); closeMenu() }
  }}>
    <button ref={trigger} type="button" disabled={disabled} aria-label={label} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined} className={`choice-trigger ${className}`} onClick={() => setOpen(v => !v)} onKeyDown={event => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setOpen(true) } }}>
      <span>{options.find(o => o.value === value)?.label}</span><ChevronDown size={16} aria-hidden="true" />
    </button>
    {open && <div id={id} role="menu" aria-label={label} className="desktop-choice-menu">
      {options.map((option, index) => <button ref={el => { items.current[index] = el }} key={option.value} type="button" role="menuitemradio" aria-checked={option.value === value} onClick={() => { onChange(option.value); closeMenu() }} onKeyDown={event => {
        const next = event.key === 'ArrowDown' ? (index + 1) % options.length : event.key === 'ArrowUp' ? (index + options.length - 1) % options.length : event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : -1
        if (next >= 0) { event.preventDefault(); items.current[next]?.focus() }
      }}><span>{option.label}</span>{option.value === value && <Check size={16} aria-hidden="true" />}</button>)}
    </div>}
  </div>
  return <>
    <button type="button" disabled={disabled} aria-label={label} aria-haspopup="dialog" aria-expanded={open} className={`choice-trigger ${className}`} onClick={() => setOpen(true)} onKeyDown={event => { if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setOpen(true) } }}>
      <span>{options.find(option => option.value === value)?.label ?? 'Selecionar'}</span><ChevronDown size={16} aria-hidden="true" />
    </button>
    {open && <ModalPortal label={label} onClose={() => setOpen(false)}>
      <div className="choice-panel bg-surface border border-border rounded-2xl text-text">
        <div className="dialog-heading"><h2 className="font-semibold">{label}</h2><button type="button" aria-label={`Fechar ${label}`} onClick={() => setOpen(false)}><X size={20} /></button></div>
        <div className="choice-options" role="group" aria-label={label} onKeyDown={event => {
          const current = items.current.indexOf(event.target as HTMLButtonElement)
          const next = event.key === 'ArrowDown' ? (current + 1) % options.length : event.key === 'ArrowUp' ? (current + options.length - 1) % options.length : event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : -1
          if (next >= 0) { event.preventDefault(); event.stopPropagation(); items.current[next]?.focus() }
        }}>
          {options.map((option, index) => <button ref={element => { items.current[index] = element }} data-hf-initial-focus={option.value === value ? "true" : undefined} type="button" key={option.value} aria-pressed={option.value === value} onClick={() => { onChange(option.value); setOpen(false) }}>
            <span>{option.label}</span>{option.value === value && <Check size={18} aria-hidden="true" />}
          </button>)}
        </div>
      </div>
    </ModalPortal>}
  </>
}
