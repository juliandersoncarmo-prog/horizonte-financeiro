'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { addTransaction, addRecurringRule } from '@/app/actions'

type Mode     = 'avulsa' | 'recorrente'
type Duracao  = 'nunca' | 'ocorrencias'

interface Props {
  tipo: 'entrada' | 'saida'
  onClose: () => void
  defaultDate?: string
}

export default function AddTransactionModal({ tipo, onClose, defaultDate }: Props) {
  const router = useRouter()
  const today  = new Date().toISOString().split('T')[0]

  const [mode,       setMode]       = useState<Mode>('avulsa')
  const [descricao,  setDescricao]  = useState('')
  const [valor,      setValor]      = useState('')
  const [data,       setData]       = useState(defaultDate ?? today)
  const [diaDoMes,   setDiaDoMes]   = useState('')
  const [duracao,    setDuracao]    = useState<Duracao>('nunca')
  const [ocorrencias, setOcorrencias] = useState(12)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [success,    setSuccess]    = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (mode === 'recorrente') {
      console.log('[recorrente] submit payload:', {
        duracao,
        ocorrencias,
        modo_termino: duracao,
        valor_termino: duracao === 'ocorrencias' ? String(ocorrencias) : null,
      })
    }

    const result = mode === 'avulsa'
      ? await addTransaction({ tipo, valor: Number(valor), descricao, data })
      : await addRecurringRule({
          tipo,
          valor:         Number(valor),
          descricao,
          dia_do_mes:    Number(diaDoMes),
          modo_termino:  duracao,
          valor_termino: duracao === 'ocorrencias' ? String(ocorrencias) : null,
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
                placeholder={tipo === 'entrada' ? 'Ex: Salário, Freelance...' : 'Ex: Aluguel, Conta de luz...'}
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

            {/* Avulsa: data */}
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

            {/* Recorrente: dia + duração */}
            {mode === 'recorrente' && (
              <>
                <div>
                  <label className={labelClass}>Dia do mês</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="31"
                    value={diaDoMes}
                    onChange={e => setDiaDoMes(e.target.value)}
                    placeholder="Ex: 5"
                    className={fieldClass}
                  />
                </div>

                {/* Duração */}
                <div>
                  <p className={labelClass}>Duração</p>
                  <div className="flex flex-col gap-2">
                    {/* Indefinidamente */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="duracao"
                        checked={duracao === 'nunca'}
                        onChange={() => setDuracao('nunca')}
                        className="accent-accent"
                      />
                      <span className="text-sm text-text">Indefinidamente</span>
                    </label>

                    {/* Número de vezes */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="duracao"
                        checked={duracao === 'ocorrencias'}
                        onChange={() => setDuracao('ocorrencias')}
                        className="accent-accent"
                      />
                      <span className="text-sm text-text">Número de vezes</span>
                    </label>

                    {duracao === 'ocorrencias' && (
                      <div className="flex items-center gap-2 ml-6">
                        <button
                          type="button"
                          onClick={() => setOcorrencias(n => Math.max(2, n - 1))}
                          disabled={ocorrencias <= 2}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-sm text-text-2 hover:bg-surface-2 disabled:opacity-40 transition-colors"
                        >−</button>
                        <input
                          type="number"
                          min="2"
                          max="100"
                          value={ocorrencias}
                          onChange={e => {
                            const v = Number(e.target.value)
                            if (v >= 2 && v <= 100) setOcorrencias(v)
                          }}
                          className="w-14 text-center border border-border rounded-lg px-1 py-1 text-sm bg-surface-2 text-text focus:outline-none focus:border-accent"
                        />
                        <button
                          type="button"
                          onClick={() => setOcorrencias(n => Math.min(100, n + 1))}
                          disabled={ocorrencias >= 100}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-sm text-text-2 hover:bg-surface-2 disabled:opacity-40 transition-colors"
                        >+</button>
                        <span className="text-xs text-text-3">meses</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
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
