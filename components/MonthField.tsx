'use client'

import { useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'
import ModalPortal from './ModalPortal'
import { invoiceMonthLabel } from '@/lib/cards'

const names = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
export default function MonthField({ value, onChange, label }: { value: string; onChange: (month: string) => void; label: string }) {
  const [open, setOpen] = useState(false)
  const [year, setYear] = useState(value.slice(0, 4))
  const yearNumber = Number(year)
  const valid = /^\d{4}$/.test(year) && yearNumber >= 1000 && yearNumber <= 9999
  return <>
    <button type="button" className="choice-trigger month-field" aria-label={label} aria-haspopup="dialog" aria-expanded={open} onClick={() => { setYear(value.slice(0, 4)); setOpen(true) }}>
      <span>{invoiceMonthLabel(value)}</span><CalendarDays size={18} aria-hidden="true" />
    </button>
    {open && <ModalPortal label={`Selecionar ${label.toLowerCase()}`} onClose={() => setOpen(false)}>
      <div className="month-picker bg-surface border border-border rounded-2xl p-4 text-text">
        <div className="dialog-heading"><h2 className="font-semibold">{label}</h2><button type="button" aria-label="Fechar seleção de mês" onClick={() => setOpen(false)}><X size={20} /></button></div>
        <div className="month-picker-year">
          <button type="button" aria-label="Ano anterior" disabled={!valid || yearNumber <= 1000} onClick={() => setYear(String(yearNumber - 1))}><ChevronLeft size={20} /></button>
          <label>Ano<input aria-label={`Ano de ${label.toLowerCase()}`} inputMode="numeric" maxLength={4} value={year} onChange={e => setYear(e.target.value.replace(/\D/g, ''))} /></label>
          <button type="button" aria-label="Próximo ano" disabled={!valid || yearNumber >= 9999} onClick={() => setYear(String(yearNumber + 1))}><ChevronRight size={20} /></button>
        </div>
        {!valid && <p role="status" className="text-sm text-red">Informe um ano de 1000 a 9999.</p>}
        <div className="month-picker-grid">{names.map((name, index) => {
          const month = `${year}-${String(index + 1).padStart(2, '0')}`
          return <button type="button" key={name} disabled={!valid} aria-pressed={value === month} onClick={() => { onChange(month); setOpen(false) }}>{name}</button>
        })}</div>
      </div>
    </ModalPortal>}
  </>
}
