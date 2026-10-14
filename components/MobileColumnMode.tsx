'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import type { Mode } from './MonthColumn'

const options: { value: Mode; label: string }[] = [
  { value: 'diario', label: 'Diário' },
  { value: 'entrada', label: 'Entradas' },
  { value: 'saida', label: 'Saídas' },
  { value: 'investimento', label: 'Investimentos' },
]

export default function MobileColumnMode({ mode, onChange, month }: { mode: Mode; onChange: (mode: Mode) => void; month: string }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const container = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const items = useRef<(HTMLButtonElement | null)[]>([])
  useEffect(() => {
    if (!open) return
    items.current[options.findIndex(option => option.value === mode)]?.focus()
    const outside = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false)
    }
    const resize = () => setOpen(false)
    document.addEventListener('pointerdown', outside)
    window.addEventListener('resize', resize)
    return () => { document.removeEventListener('pointerdown', outside); window.removeEventListener('resize', resize) }
  }, [open, mode])
  function close() { setOpen(false); trigger.current?.focus() }
  return <div ref={container} className="mobile-column-mode" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false)
  }} onKeyDown={event => {
    if (event.key === 'Escape' && open) { event.stopPropagation(); event.preventDefault(); close() }
  }}>
    <button ref={trigger} type="button" className="column-mode-trigger" aria-label={`Valores exibidos em ${month}: ${options.find(option => option.value === mode)?.label}`} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen(value => !value)} onKeyDown={event => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setOpen(true) }
    }}>
      <span>{options.find(option => option.value === mode)?.label}</span><ChevronDown size={14} aria-hidden="true" />
    </button>
    {open && <div id={id} role="menu" aria-label={`Valores exibidos em ${month}`} className="column-mode-menu">
      {options.map((option, index) => <button key={option.value} ref={element => { items.current[index] = element }} type="button" role="menuitemradio" aria-checked={mode === option.value} onClick={() => { onChange(option.value); close() }} onKeyDown={event => {
        const current = items.current.indexOf(event.currentTarget)
        const next = event.key === 'ArrowDown' ? (current + 1) % options.length : event.key === 'ArrowUp' ? (current + options.length - 1) % options.length : event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : -1
        if (next >= 0) { event.preventDefault(); items.current[next]?.focus() }
      }}>
        <span>{option.label}</span>{mode === option.value && <Check size={16} aria-hidden="true" />}
      </button>)}
    </div>}
  </div>
}
