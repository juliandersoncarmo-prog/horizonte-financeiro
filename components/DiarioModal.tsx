'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useOptionalProjection, useProjectionUpdate } from './ProjectionProvider'
import ModalPortal from './ModalPortal'
import { X, Pencil, Trash2, Check } from 'lucide-react'
import { getAllDailyBudgets, addDailyBudget, deleteDailyBudget, updateDailyBudget } from '@/app/actions'

type BudgetItem = {
  id: string
  descricao: string
  categoria: string
  mes_referencia: string | null
  valor_mensal: number
}

interface Props {
  onClose: () => void
}

export default function DiarioModal({ onClose }: Props) {
  const router = useRouter()
  const updateProjection = useProjectionUpdate()
  const snapshot = useOptionalProjection()?.editorData?.dailyBudgets
  const lock = useRef(false)
  const [notice, setNotice] = useState('')

  const [items,        setItems]        = useState<BudgetItem[]>(snapshot ?? [])
  const [previousSnapshot, setPreviousSnapshot] = useState(snapshot)
  if (snapshot !== previousSnapshot) { setPreviousSnapshot(snapshot); if (snapshot) setItems(snapshot) }
  const [loading,      setLoading]      = useState(!snapshot)
  const [newDescricao, setNewDescricao] = useState('')
  const [newValor,     setNewValor]     = useState('')
  const [adding,       setAdding]       = useState(false)
  const [addError,     setAddError]     = useState<string | null>(null)
  const [editingId,    setEditingId]    = useState<string | null>(null)
  const [editDescricao, setEditDescricao] = useState('')
  const [editValor,    setEditValor]    = useState('')
  const [saving,       setSaving]       = useState(false)

  async function loadItems() {
    setLoading(true)
    try { setItems(await getAllDailyBudgets()) }
    catch { setAddError('Não foi possível carregar o Diário.') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (snapshot) return
    let active = true
    getAllDailyBudgets().then(data => {
      if (active) { setItems(data); setLoading(false) }
    }).catch(() => { if (active) { setAddError('Não foi possível carregar o Diário.'); setLoading(false) } })
    return () => { active = false }
  }, [snapshot])

  async function change(action: () => Promise<{ success: boolean; error?: string; budget?: BudgetItem }>, after: (result: { budget?: BudgetItem }) => boolean | undefined) {
    if (lock.current) return
    lock.current = true; setSaving(true); setAddError(null); setNotice('')
    try {
      const result = await action()
      if (!result.success) { setAddError(result.error ?? 'Não foi possível salvar.'); return }
      const applied = after(result); setNotice('Alteração salva com sucesso.'); if (!applied) router.refresh()
    } catch { setAddError('Falha de comunicação. Verifique sua conexão antes de tentar novamente.') }
    finally { lock.current = false; setSaving(false); setAdding(false) }
  }
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newDescricao.trim() || !newValor || lock.current) return
    setAdding(true)
    await change(() => addDailyBudget({ descricao: newDescricao.trim(), valor_mensal: Number(newValor) }), result => {
      setNewDescricao(''); setNewValor('');
      if (!result.budget) { void loadItems(); return false }
      const budget = result.budget
      setItems(items => [...items, budget])
      return updateProjection?.(input => ({ ...input, dailyBudgets: [...input.dailyBudgets, budget] }))
    })
  }
  async function handleDelete(id: string) {
    if (lock.current || !window.confirm('Excluir este orçamento mensal? Os valores realizados do Diário permanecem. A previsão e os saldos serão recalculados.')) return
    await change(() => deleteDailyBudget(id), () => {
      setItems(items => items.filter(item => item.id !== id))
      return updateProjection?.(input => ({ ...input, dailyBudgets: input.dailyBudgets.filter(item => item.id !== id) }))
    })
  }
  async function handleSaveEdit(id: string) {
    if (!editValor || !editDescricao.trim()) return
    if (!window.confirm("Salvar nome e valor mensal? As previsões globais serão recalculadas; os registros realizados permanecem.")) return
    await change(() => updateDailyBudget(id, Number(editValor), editDescricao), result => {
      const budget = result.budget
      setItems(items => items.map(item => item.id === id ? budget ?? { ...item, descricao: editDescricao.trim(), valor_mensal: Number(editValor) } : item)); setEditingId(null)
      return budget && updateProjection?.(input => ({ ...input, dailyBudgets: input.dailyBudgets.map(item => item.id === id ? budget : item) }))
    })
  }

  const month = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Fortaleza' }).format(new Date()).slice(0, 7)
  const [year, monthNumber] = month.split('-').map(Number)
  const dayCount = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
  const totalMensal = items.filter(b => !b.mes_referencia || b.mes_referencia === month).reduce((s, b) => s + b.valor_mensal, 0)
  const diario = totalMensal / dayCount

  const fieldClass = 'border border-border rounded-xl px-3 py-2 text-sm bg-surface-2 text-text focus:outline-none focus:border-accent'

  return (
    <ModalPortal onClose={() => { if (!lock.current) onClose() }} label="Diário — Gastos Variáveis">
      <div className="relative bg-surface rounded-2xl shadow-xl border border-border w-full flex flex-col max-h-[calc(100dvh-2rem)]">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex-none">
          <div className="flex items-start justify-between mb-1">
            <h2 className="text-base font-semibold text-text">Diário — Gastos Variáveis</h2>
            <button aria-label="Fechar" disabled={saving || adding} onClick={onClose} className="text-text-3 hover:text-text transition-colors ml-4 flex-none">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-text-3 leading-relaxed">
            Defina seus gastos variáveis mensais. O total será dividido pelos dias e aplicado automaticamente em todos os meses do horizonte.
          </p>
        </div>

        {/* Lista + formulário (scroll) */}
        <div className="flex-1 overflow-y-auto px-6">

          {notice && <p role="status" className="text-sm text-green">{notice}</p>}
          {saving && <p role="status" className="text-xs text-text-3">Salvando…</p>}
          {/* Itens */}
          {loading && !snapshot ? (
            <p className="text-sm text-text-3 text-center py-6">Carregando…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-text-3 text-center py-4">Nenhum gasto variável cadastrado.</p>
          ) : (
            <div className="flex flex-col gap-1.5 pb-2">
              {items.map(item => (
                <div key={item.id} className="flex flex-wrap items-center gap-2 px-3 py-2 bg-surface-2 rounded-xl">
                  {editingId !== item.id && <span className="flex-1 text-sm text-text truncate min-w-0">{item.descricao}{item.mes_referencia ? ` (${item.mes_referencia})` : ""}</span>}

                  {editingId === item.id ? (
                    <>
                      <input aria-label="Nome do orçamento" value={editDescricao} onChange={e => setEditDescricao(e.target.value)} className={`${fieldClass} w-full`} />
                      <input aria-label="Valor mensal"
                        type="number"
                        min="0"
                        step="0.01"
                        autoFocus
                        value={editValor}
                        onChange={e => setEditValor(e.target.value)}
                        className={`${fieldClass} w-28 text-right`}
                      />
                      <button
                        disabled={saving || adding}
                        onClick={() => handleSaveEdit(item.id)}
                        className="text-accent hover:opacity-70 transition-opacity disabled:opacity-40 flex-none"
                        title="Salvar"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        disabled={saving || adding}
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
                        disabled={saving || adding}
                        onClick={() => { setEditingId(item.id); setEditValor(String(item.valor_mensal)); setEditDescricao(item.descricao) }}
                        className="text-text-3 hover:text-accent transition-colors flex-none"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        disabled={saving || adding}
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
                min="0"
                step="0.01"
                value={newValor}
                onChange={e => setNewValor(e.target.value)}
                placeholder="Valor mensal (R$)"
                className={`${fieldClass} flex-1`}
              />
              <button
                type="submit"
                disabled={saving || adding || !newDescricao.trim() || !newValor}
                className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 flex-none whitespace-nowrap"
              >
                {adding ? '…' : '+ Adicionar'}
              </button>
            </div>
            {addError && <p role="alert" className="text-xs text-red">{addError}</p>}
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
            <span>÷ {dayCount} dias ({month}, média inicial) =</span>
            <span className="font-medium num">
              {diario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} por dia
            </span>
          </div>
          <button
                        disabled={saving || adding}
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Fechar
          </button>
        </div>
      </div>
    </ModalPortal>
  )
}
