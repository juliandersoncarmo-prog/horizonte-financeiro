'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { addTransaction, addRecurringRule } from '@/app/actions'

type Mode = 'avulsa' | 'recorrente'
type Frequencia = 'mensal' | 'quinzenal' | 'semanal'

interface Props {
  tipo: 'entrada' | 'saida'
  onClose: () => void
  defaultDate?: string
}

export default function AddTransactionModal({ tipo, onClose, defaultDate }: Props) {
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0]

  const [mode,       setMode]       = useState<Mode>('avulsa')
  const [descricao,  setDescricao]  = useState('')
  const [valor,      setValor]      = useState('')
  const [data,       setData]       = useState(defaultDate ?? today)
  const [frequencia, setFrequencia] = useState<Frequencia>('mensal')
  const [diaDoMes,   setDiaDoMes]   = useState('5')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [success,    setSuccess]    = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = mode === 'avulsa'
      ? await addTransaction({ tipo, valor: Number(valor), descricao, data })
      : await addRecurringRule({
          tipo,
          valor:      Number(valor),
          descricao,
          frequencia,
          dia_do_mes: frequencia === 'semanal' ? 1 : Number(diaDoMes),
        })

    setLoading(false)
    if (result.success) {
      router.refresh()
      setSuccess(true)
      setTimeout(onClose, 800)
    } else {
      setError(result.error ?? 'Erro ao salvar')
    }
  }

  const isEntrada  = tipo === 'entrada'
  const titleColor = isEntrada ? 'text-green' : 'text-red'
  const btnClass   = isEntrada
    ? 'bg-green text-white hover:opacity-90'
    : 'bg-red text-white hover:opacity-90'

  const fieldClass = 'w-full border border-border rounded-xl px-3 py-2 text-sm bg-surface-2 text-text focus:outline-none focus:border-accent'
  const labelClass = 'text-xs font-semibold uppercase tracking-widest text-text-3 block mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-surface rounded-2xl shadow-xl border border-border w-full max-w-md mx-4 p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className={`text-base font-semibold ${titleColor}`}>
            {isEntrada ? '+ Nova entrada' : '+ Nova saída'}
          </h2>
          <button onClick={onClose} className="text-text-3 hover:text-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <p className="text-center text-green py-6 font-medium">Salvo com sucesso!</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Toggle Avulsa / Recorrente */}
            <div className="flex rounded-xl border border-border overflow-hidden">
              {(['avulsa', 'recorrente'] as Mode[]).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={[
                    'flex-1 py-2 text-sm font-medium transition-colors capitalize',
                    mode === m
                      ? 'bg-accent text-white'
                      : 'bg-surface-2 text-text-2 hover:bg-surface-3',
                  ].join(' ')}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>

            {/* Campos comuns */}
            <div>
              <label className={labelClass}>Descrição</label>
              <input
                type="text"
                required
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="Ex: Supermercado"
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
                value={valor}
                onChange={e => setValor(e.target.value)}
                placeholder="0,00"
                className={fieldClass}
              />
            </div>

            {/* Campos condicionais */}
            {mode === 'avulsa' && (
              <div>
                <label className={labelClass}>Data</label>
                <input
                  type="date"
                  required
                  value={data}
                  onChange={e => setData(e.target.value)}
                  className={fieldClass}
                />
              </div>
            )}

            {mode === 'recorrente' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Frequência</label>
                  <select
                    value={frequencia}
                    onChange={e => setFrequencia(e.target.value as Frequencia)}
                    className={`${fieldClass} cursor-pointer`}
                  >
                    <option value="mensal">Mensal</option>
                    <option value="quinzenal">Quinzenal</option>
                    <option value="semanal">Semanal</option>
                  </select>
                </div>
                {frequencia === 'mensal' && (
                  <div>
                    <label className={labelClass}>Dia do mês</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="31"
                      value={diaDoMes}
                      onChange={e => setDiaDoMes(e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                )}
              </div>
            )}

            {error && <p className="text-xs text-red">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-border rounded-xl py-2 text-sm text-text-2 hover:bg-surface-2 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-opacity ${btnClass} disabled:opacity-50`}
              >
                {loading ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
