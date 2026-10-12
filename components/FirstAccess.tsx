'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { initializeSettings } from '@/app/actions'
import { formatBRL } from '@/lib/engine/projection'
import DiarioModal from './DiarioModal'
import AddTransactionModal from './AddTransactionModal'

export default function FirstAccess() {
  const router = useRouter()
  const lock = useRef(false)
  const [balance, setBalance] = useState('')
  const [date, setDate] = useState('')
  const [step, setStep] = useState<'start' | 'confirm' | 'optional'>('start')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [modal, setModal] = useState<'diario' | 'entrada' | 'saida' | null>(null)
  async function save() {
    if (lock.current) return
    lock.current = true; setBusy(true); setError('')
    try {
      const result = await initializeSettings({ saldo_abertura: Number(balance), data_ancora: date })
      if (!result.success) { setError(result.error ?? 'Não foi possível salvar.'); return }
      setStep('optional')
    } catch { setError('Falha de comunicação. Tente novamente.') }
    finally { lock.current = false; setBusy(false) }
  }
  const field = 'w-full rounded-xl border border-border bg-surface-2 p-3 text-text'
  return <main className="flex-1 overflow-y-auto p-5 bg-bg text-text"><section className="mx-auto max-w-lg rounded-2xl bg-surface border border-border p-6 space-y-4">
    <h1 className="text-xl font-semibold">Bem-vindo ao Horizonte</h1>
    <h2 className="font-semibold">{step === 'optional' ? '2 — Configuração opcional' : '1 — Ponto de partida'}</h2>
    {step === 'start' && <form className="space-y-4" onSubmit={e => { e.preventDefault(); setStep('confirm') }}>
      <p className="text-sm text-text-2">O saldo inicial representa o dinheiro disponível antes das movimentações da data escolhida. Você poderá alterar saldo e data em Configurações.</p>
      <label className="block">Saldo inicial (R$)<input required type="number" step="0.01" value={balance} onChange={e => setBalance(e.target.value)} className={field} /></label>
      <label className="block">Data de referência<input required type="date" value={date} onChange={e => setDate(e.target.value)} className={field} /></label>
      <button className="bg-accent text-white rounded-xl p-3">Continuar</button>
    </form>}
    {step === 'confirm' && <><p>Confirme o saldo de <strong>{formatBRL(Number(balance))}</strong> antes das movimentações de <strong>{date.split('-').reverse().join('/')}</strong>.</p><div className="flex gap-3"><button disabled={busy} onClick={() => void save()} className="bg-accent text-white rounded-xl p-3 disabled:opacity-50">{busy ? 'Salvando…' : 'Confirmar e salvar'}</button><button disabled={busy} onClick={() => setStep('start')}>Voltar e editar</button></div></>}
    {error && <p role="alert" className="text-red text-sm">{error}</p>}
    {step === 'optional' && <><p className="text-sm text-text-2">Escolha o que deseja configurar agora. Todas as opções podem ser preenchidas depois.</p><div className="flex flex-wrap gap-3">{(['diario', 'entrada', 'saida'] as const).map(kind => <button key={kind} onClick={() => setModal(kind)} className="border border-border rounded-xl p-3">{kind === 'diario' ? 'Orçamento do Diário' : kind === 'entrada' ? 'Cadastrar Entrada' : 'Cadastrar Saída'}</button>)}</div><button onClick={() => { router.push('/'); router.refresh() }} className="bg-accent text-white rounded-xl p-3">Começar a usar</button></>}
  </section>{modal === 'diario' && <DiarioModal onClose={() => setModal(null)} />}{(modal === 'entrada' || modal === 'saida') && <AddTransactionModal tipo={modal} onClose={() => setModal(null)} />}</main>
}
