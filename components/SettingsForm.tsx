'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveSettings } from '@/app/actions'

interface Props {
  saldoAtual?: number
  dataAncora: string
}

export default function SettingsForm({ saldoAtual, dataAncora }: Props) {
  const router  = useRouter()
  const [valor,   setValor]   = useState(saldoAtual != null ? String(saldoAtual) : '')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valor) return
    setLoading(true)
    setError(null)
    const result = await saveSettings({
      saldo_abertura: Number(valor),
      data_ancora:    dataAncora,
    })
    setLoading(false)
    if (result.success) {
      router.push('/')
    } else {
      setError(result.error ?? 'Erro ao salvar')
    }
  }

  const fieldClass = 'w-full border border-border rounded-xl px-3 py-2 text-sm bg-surface-2 text-text focus:outline-none focus:border-accent'
  const labelClass = 'text-xs font-semibold uppercase tracking-widest text-text-3 block mb-1'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>Valor (R$)</label>
        <input
          type="number"
          required
          min="0"
          step="0.01"
          placeholder="0,00"
          value={valor}
          onChange={e => setValor(e.target.value)}
          className={fieldClass}
        />
      </div>
      <div>
        <label className={labelClass}>Data</label>
        <input
          type="date"
          value={dataAncora}
          readOnly
          className={`${fieldClass} opacity-60 cursor-not-allowed`}
        />
      </div>
      {error && <p className="text-xs text-red">{error}</p>}
      <button
        type="submit"
        disabled={loading || !valor}
        className="w-full py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? 'Salvando…' : 'Salvar'}
      </button>
    </form>
  )
}
