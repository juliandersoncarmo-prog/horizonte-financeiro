'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import ModalPortal from './ModalPortal'
import { useOptionalProjection } from './ProjectionProvider'
import { X } from 'lucide-react'
import { createCreditCard, deleteCreditCard, deleteCardInvoice, getCreditCards, saveCardInvoice, updateCreditCard } from '@/app/card-actions'
import { invoiceDate, resizeInvoiceDraft, invoiceMonthLabel } from '@/lib/cards'
import { formatBRL } from '@/lib/engine/projection'
import type { CreditCard, CardInvoice } from '@/types'

const field = 'w-full min-w-0 border border-border rounded-xl px-3 py-1.5 text-sm bg-surface-2 text-text focus:outline-none focus:border-accent'
const button = 'rounded-xl px-3 py-2 text-sm bg-accent text-white disabled:opacity-50'
const currentMonth = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Fortaleza', year: 'numeric', month: '2-digit' }).format(new Date())

export default function CreditCardsModal({ onClose, initialCardId }: { onClose: () => void; initialCardId?: string }) {
  const router = useRouter()
  const seed = useOptionalProjection()?.cardData
  const [refreshing, startRefresh] = useTransition()
  const [notice, setNotice] = useState('')
  const mutationLock = useRef(false)
  const dialog = useRef<HTMLDivElement>(null)
  const [cards, setCards] = useState<CreditCard[]>(seed?.cards ?? [])
  const [enabled, setEnabled] = useState<boolean | null>(seed?.enabled ?? null)
  const [loading, setLoading] = useState(!seed)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState(false)
  const [selected, setSelected] = useState<string | null>(initialCardId ?? null)
  const [nome, setNome] = useState(seed?.cards.find(c => c.id === initialCardId)?.nome ?? '')
  const [dia, setDia] = useState(() => { const initial = seed?.cards.find(c => c.id === initialCardId); return initial ? String(initial.dia_vencimento) : '' })
  const [first, setFirst] = useState(currentMonth)
  const [count, setCount] = useState('')
  const [draft, setDraft] = useState<{ mes_referencia: string; valor: string }[] | null>(null)
  const [invoice, setInvoice] = useState<{ id: string | null; month: string; value: string } | null>(null)
  const [confirm, setConfirm] = useState<{ kind: 'card' | 'invoice'; id: string } | null>(null)
  const card = cards.find(c => c.id === selected)

  useEffect(() => {
    let active = true
    ;(seed ? Promise.resolve(seed) : getCreditCards()).then(result => {
      if (!active) return
      setCards(result.cards); setEnabled(result.enabled); setLoading(false)
      const initial = result.cards.find(c => c.id === initialCardId)
      if (initial) { setNome(initial.nome); setDia(String(initial.dia_vencimento)) }
    }).catch(() => { if (active) { setError('Não foi possível carregar os cartões. Tente novamente.'); setLoading(false) } })
    return () => { active = false }
  }, [initialCardId, seed])


  function choose(c?: CreditCard) {
    setSelected(c?.id ?? null); setNome(c?.nome ?? ''); setDia(c ? String(c.dia_vencimento) : '')
    setCreated(false); setFirst(currentMonth()); setDraft(null); setCount(''); setInvoice(null); setConfirm(null); setError('')
  }
  async function run(action: () => Promise<{ success: boolean; error?: string }>, after?: () => void) {
    if (mutationLock.current || refreshing) return
    mutationLock.current = true
    setBusy(true); setError(''); setNotice('')
    try {
      const result = await action()
      if (!result.success) { setError(result.error ?? 'Não foi possível salvar'); return }
      // Refresh the ledger even if the subsequent manager read fails.
      startRefresh(() => router.refresh())
      after?.()
      setNotice('Alteração salva com sucesso.')
      if (!seed) try {
        const resultCards = await getCreditCards()
        setCards(resultCards.cards); setEnabled(resultCards.enabled)
      } catch { setError('Alteração salva, mas a lista não pôde ser atualizada. Recarregue os cartões.') }
    } catch { setError('Falha de comunicação. Recarregue os cartões antes de tentar novamente.') }
    finally { mutationLock.current = false; setBusy(false) }
  }
  function resize(nextFirst: string, nextCount: string) {
    if (!nextCount) {
      if (draft?.some(i => i.valor !== '') && !window.confirm('Remover os valores preenchidos das faturas?')) return
      setCount(''); setFirst(nextFirst); setDraft(null); return
    }
    try {
      const next = resizeInvoiceDraft(draft ?? [], nextFirst, Number(nextCount))
      if (next.discardsValues && !window.confirm('Esta alteração remove faturas com valores preenchidos. Continuar?')) return
      setDraft(next.rows)
      setFirst(nextFirst); setCount(nextCount); setError('')
    } catch { setError('Informe um primeiro mês válido e de 1 a 60 faturas.') }
  }
  function editInvoice(i: CardInvoice) { setInvoice({ id: i.id, month: i.mes_referencia, value: String(i.valor) }); setConfirm(null) }

  return <ModalPortal onClose={() => { if (!busy) onClose() }} label="Cartões de crédito">
    <div ref={dialog} tabIndex={-1} className="relative w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl bg-surface text-text border border-border shadow-xl p-5">
      <div className="flex items-center justify-between mb-3"><h2 id="cards-title" className="text-lg font-semibold">Cartões de crédito</h2><button aria-label="Fechar cartões" disabled={busy || refreshing} onClick={onClose}><X /></button></div>
      <p className="text-sm text-text-2 mb-4">Faturas entram nas Saídas. Evite duplicar valores no Diário ou em lançamentos antigos.</p>
      {error && <p role="alert" className="text-red mb-3">{error}</p>}
      {loading ? <p role="status">Carregando cartões…</p> : enabled === false ? <p>Cartões aguardam habilitação no ambiente de testes.</p> : enabled === null ? <p>Não foi possível abrir o gerenciador. Recarregue para tentar novamente.</p> : created ? <section className="rounded-xl bg-accent-soft p-5 space-y-3"><h3 role="status" className="text-lg font-semibold text-accent">Cartão cadastrado!</h3><p className="text-sm">As faturas foram incluídas na projeção.</p><div className="flex gap-2"><button disabled={busy || refreshing} className={button} onClick={() => choose()}>Cadastrar outro</button><button disabled={busy || refreshing} className="border border-border rounded-xl px-3 py-2 text-sm" onClick={onClose}>Fechar</button></div></section> : <>
        <div className="flex gap-2 flex-wrap mb-4">
          {cards.map(c => <button key={c.id} disabled={busy || refreshing} aria-pressed={selected === c.id} className={`border border-border rounded-xl px-3 py-2 text-sm ${selected === c.id ? 'bg-accent-soft text-accent' : 'bg-surface-2'}`} onClick={() => choose(c)}>{c.nome}</button>)}
          <button disabled={busy || refreshing} className={button} onClick={() => choose()}>+ Novo cartão</button>
        </div>
        <fieldset disabled={busy || refreshing} className="space-y-3">
          <form className="space-y-2" onSubmit={e => {
            e.preventDefault()
            if (card) void run(() => updateCreditCard(card.id, nome, Number(dia)))
            else if (draft) void run(() => createCreditCard({ nome, dia_vencimento: Number(dia), invoices: draft.map(i => ({ mes_referencia: i.mes_referencia, valor: Number(i.valor) })) }), () => setCreated(true))
          }}>
            <div className="flex flex-wrap items-start gap-3 max-w-[22rem]">
              <label className="text-sm min-w-0 w-48 max-w-full">Nome do cartão<input required maxLength={100} className={field} value={nome} onChange={e => setNome(e.target.value)} /></label>
              <label className="text-sm w-24">Vencimento<input required type="number" min="1" max="31" step="1" className={field} value={dia} onChange={e => setDia(e.target.value)} /></label>
            </div>
            <p className="text-xs text-text-3">Meses curtos: último dia válido. Mudar o vencimento atualiza também as faturas passadas.</p>
            {card ? <div className="flex gap-3"><button className={button}>Salvar cartão</button><button type="button" className="text-red text-sm" onClick={() => setConfirm({ kind: 'card', id: card.id })}>Excluir cartão</button></div> : <>
              <div className="flex flex-wrap items-start gap-3 max-w-[22rem]">
                <label className="text-sm min-w-0 w-40 max-w-full">Primeiro mês<input type="month" min="1000-01" max="9999-12" required className={field} value={first} onChange={e => { resize(e.target.value, count) }} /></label>
                <label className="text-sm whitespace-nowrap">Quantidade de faturas<input aria-label="Quantidade de faturas" type="number" min="1" max="60" step="1" required className={`${field} block !w-20`} value={count} onChange={e => { resize(first, e.target.value) }} /></label>
              </div>
              {draft && <div className="grid grid-cols-1 gap-y-1.5 w-fit max-w-full"><p className="text-xs text-text-3 ">Valores das faturas (R$)</p>{draft.map((i, index) => <label key={i.mes_referencia} className="grid grid-cols-[minmax(0,10rem)_minmax(0,7rem)] items-center gap-2 text-xs"><span>{invoiceMonthLabel(i.mes_referencia)}</span><input aria-label={`Valor de ${invoiceMonthLabel(i.mes_referencia)}`} required type="number" min="0" max="999999999" step="0.01" className={field} value={i.valor} onChange={e => setDraft(rows => rows?.map((row, k) => k === index ? { ...row, valor: e.target.value } : row) ?? null)} /></label>)}<button className={`${button}  mt-2`}>Cadastrar cartão e faturas</button></div>}
            </>}
          </form>
          {card && <section className="space-y-3 border-t border-border pt-4">
            <div className="flex justify-between"><h3 className="font-semibold">Faturas de {card.nome}</h3><button className="text-accent text-sm" onClick={() => { setInvoice({ id: null, month: currentMonth(), value: '' }); setConfirm(null) }}>+ Fatura</button></div>
            {card.invoices.length === 0 && <p className="text-sm text-text-3">Nenhuma fatura cadastrada.</p>}
            {card.invoices.map(i => <div key={i.id} className="flex flex-wrap gap-2 items-center justify-between rounded-xl bg-surface-2 px-3 py-2 text-sm"><span>{invoiceMonthLabel(i.mes_referencia)} · vence {invoiceDate(i.mes_referencia, card.dia_vencimento).split('-').reverse().join('/')}</span><span className="font-semibold">{formatBRL(i.valor)}</span><div className="flex gap-3"><button className="text-accent" onClick={() => editInvoice(i)}>Editar</button><button className="text-red" onClick={() => { setConfirm({ kind: 'invoice', id: i.id }); setInvoice(null) }}>Excluir</button></div></div>)}
            {invoice && <form className="space-y-3 border border-border rounded-xl p-3" onSubmit={e => { e.preventDefault(); void run(() => saveCardInvoice(card.id, invoice.id, invoice.month, Number(invoice.value)), () => setInvoice(null)) }}>
              <h4 className="font-semibold">{invoice.id ? 'Editar fatura' : 'Incluir fatura'}</h4>
              <label className="text-sm block max-w-[14rem]">Mês<input required type="month" min="1000-01" max="9999-12" className={field} value={invoice.month} onChange={e => setInvoice({ ...invoice, month: e.target.value })} /></label>
              <label className="text-sm block max-w-[9rem]">Valor (R$)<input required type="number" min="0" max="999999999" step="0.01" className={field} value={invoice.value} onChange={e => setInvoice({ ...invoice, value: e.target.value })} /></label>
              <button className={button}>Salvar fatura</button><button type="button" className="ml-3 text-sm" onClick={() => setInvoice(null)}>Cancelar</button>
            </form>}
          </section>}
          {confirm && card && <div role="alert" className="border border-border rounded-xl p-3 space-y-2"><p>{confirm.kind === 'card' ? 'Excluir este cartão e todas as suas faturas?' : 'Excluir esta fatura?'} A projeção será recalculada. As saídas avulsas permanecem.</p><button className="rounded-xl bg-red text-white px-3 py-2 text-sm" onClick={() => { void run(() => confirm.kind === 'card' ? deleteCreditCard(confirm.id) : deleteCardInvoice(card.id, confirm.id), () => { if (confirm.kind === 'card') choose(); else setConfirm(null) }) }}>Confirmar exclusão</button><button className="ml-3 text-sm" onClick={() => setConfirm(null)}>Cancelar</button></div>}
        </fieldset>
      </>}
      {!loading && !created && <button disabled={busy || refreshing} className="mt-4 text-accent text-sm" onClick={() => { setLoading(true); getCreditCards().then(result => { setCards(result.cards); setEnabled(result.enabled) }).catch(() => setError('Não foi possível carregar os cartões.')).finally(() => setLoading(false)) }}>Recarregar cartões</button>}
      {notice && <p role="status" className="text-sm text-green mt-3">{notice}</p>}
      {refreshing && <p role="status" className="text-sm mt-3">Atualizando saldos…</p>}
      {busy && <p role="status" className="mt-3 text-sm">Salvando…</p>}
    </div>
  </ModalPortal>
}
