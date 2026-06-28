'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { resetAllData } from '@/app/actions'

export default function ResetButton() {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  async function handleReset() {
    setLoading(true)
    setError(null)
    const result = await resetAllData()
    setLoading(false)
    if (result.success) {
      router.push('/')
    } else {
      setError(result.error ?? 'Erro ao resetar')
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="px-4 py-2 rounded-xl bg-red text-white text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        Resetar sistema
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => !loading && setShowConfirm(false)} />
          <div className="relative bg-surface rounded-2xl shadow-xl border border-border w-full max-w-md mx-4 p-6">
            <h2 className="text-base font-semibold text-text mb-3">Tem certeza?</h2>
            <p className="text-sm text-text-2 mb-6">
              Isso apagará <strong>TODOS</strong> os seus dados: transações, regras recorrentes,
              orçamentos e saldo inicial. O sistema voltará ao estado inicial.
            </p>
            {error && <p className="text-xs text-red mb-4">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="flex-1 border border-border rounded-xl py-2 text-sm text-text-2 hover:bg-surface-2 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleReset}
                disabled={loading}
                className="flex-1 bg-red text-white rounded-xl py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Apagando…' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
