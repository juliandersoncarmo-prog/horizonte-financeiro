'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Pencil, Trash2, Check } from 'lucide-react'
import { getAllDailyBudgets, addDailyBudget, deleteDailyBudget, updateDailyBudget } from '@/app/actions'

type BudgetItem = {
  id: string
  descricao: string
  categoria: string
  valor_mensal: number
}

interface Props {
  onClose: () => void
}

export default function DiarioModal({ onClose }: Props) {
  const router = useRouter()

  const [items,        setItems]        = useState<BudgetItem[]>([])
  const [loading,      setLoading]      = useState(true)
  const [newDescricao, setNewDescricao] = useState('')
  const [newValor,     setNewValor]     = useState('')
  const [adding,       setAdding]       = useState(false)
  const [addError,     setAddError]     = useState<string | null>(null)
  const [editingId,    setEditingId]    = useState<string | null>(null)
  const [editValor,    setEditValor]    = useState('')
  const [saving,       setSaving]       = useState(false)

  async function loadItems() {
    setLoading(true)
    const data = await getAllDailyBudgets()
    setItems(data)
    setLoading(false)
  }

  useEffect(() => { loadItems() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newDescricao.trim() || !newValor) return
    setAdding(true)
    setAddError(null)
    const result = await addDailyBudget({
      descricao:    newDescricao.trim(),
      valor_mensal: Number(newValor),
    })
    setAdding(false)
    if (result.success) {
      setNewDescricao('')
      setNewValor('')
      router.refresh()
      loadItems()
    } else {
      setAddError(result.error ?? 'Erro ao adicionar')
    }
  }

  async function handleDelete(id: string) {
    await deleteDailyBudget(id)
    router.refresh()
    loadItems()
  }

  async function handleSaveEdit(id: string) {
    if (!editValor) return
    setSaving(true)
    const result = await updateDailyBudget(id, Number(editValor))
    setSaving(false)
    if (result.success) {
      setEditingId(null)
      router.refresh()
      loadItems()
    }
  }

  const totalMensal = items.reduce((s, b) => s + b.valor_mensal, 0)
  const diario      = totalMensal / 30

  const fieldClass = 'border border-border rounded-xl px-3 py-2 text-sm bg-surface-2 text-text focus:outline-none focus:border-accent'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-surface rounded-2xl shadow-xl border border-border w-full max-w-md mx-4 flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex-none">
          <div className="flex items-start justify-between mb-1">
            <h2 className="text-base font-semibold text-text">Diário — Gastos Variáveis</h2>
            <button onClick={onClose} className="text-text-3 hover:text-text transition-colors ml-4 flex-none">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-text-3 leading-relaxed">
            Defina seus gastos variáveis mensais. O total será dividido pelos dias e aplicado automaticamente em todos os meses do horizonte.
          </p>
        </div>

        {/* Lista + formulário (scroll) */}
        <div className="flex-1 overflow-y-auto px-6">

          {/* Itens */}
          {loading ? (
            <p className="text-sm text-text-3 text-center py-6">Carregando…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-text-3 text-center py-4">Nenhum gasto variável cadastrado.</p>
          ) : (
            <div className="flex flex-col gap-1.5 pb-2">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-2 px-3 py-2 bg-surface-2 rounded-xl">
                  <span className="flex-1 text-sm text-text truncate min-w-0">{item.descricao}</span>

                  {editingId === item.id ? (
                    <>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        autoFocus
                        value={editValor}
                        onChange={e => setEditValor(e.target.value)}
                        className={`${fieldClass} w-28 text-right`}
                      />
                      <button
                        onClick={() => handleSaveEdit(item.id)}
                        disabled={saving}
                        className="text-accent hover:opacity-70 transition-opacity disabled:opacity-40 flex-none"
                        title="Salvar"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-text-3 hover:text-text transition-colors flex-none"
                        title="Cancelar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-semibold num text-text-2 flex-none">
                        {item.valor_mensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                      <button
                        onClick={() => { setEditingId(item.id); setEditValor(String(item.valor_mensal)) }}
                        className="text-text-3 hover:text-accent transition-colors flex-none"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-text-3 hover:text-red transition-colors flex-none"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Formulário de adição */}
          <form onSubmit={handleAdd} className="flex flex-col gap-2 pt-3 pb-4 border-t border-border mt-2">
            <input
              type="text"
              value={newDescricao}
              onChange={e => setNewDescricao(e.target.value)}
              placeholder="O que é? (ex: Mercado, iFood…)"
              className={`${fieldClass} w-full`}
            />
            <div className="flex gap-2">
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={newValor}
                onChange={e => setNewValor(e.target.value)}
                placeholder="Valor mensal (R$)"
                className={`${fieldClass} flex-1`}
              />
              <button
                type="submit"
                disabled={adding || !newDescricao.trim() || !newValor}
                className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 flex-none whitespace-nowrap"
              >
                {adding ? '…' : '+ Adicionar'}
              </button>
            </div>
            {addError && <p className="text-xs text-red">{addError}</p>}
          </form>
        </div>

        {/* Rodapé sticky */}
        <div className="px-6 py-4 border-t border-border flex-none rounded-b-2xl bg-surface">
          <div className="flex justify-between items-center text-sm mb-1">
            <span className="text-text-2">Total mensal:</span>
            <span className="font-semibold text-text num">
              {totalMensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs text-text-3 mb-4">
            <span>÷ 30 dias =</span>
            <span className="font-medium num">
              {diario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} por dia
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
