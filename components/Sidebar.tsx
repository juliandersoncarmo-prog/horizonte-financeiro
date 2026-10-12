'use client'

import { useState, useEffect, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TrendingUp, TrendingDown, List, CreditCard, Settings, LogOut, LayoutDashboard, CalendarDays } from 'lucide-react'
import AddTransactionModal from './AddTransactionModal'
import CreditCardsModal from './CreditCardsModal'
import DiarioModal from './DiarioModal'
import MonthlySummaryModal from './MonthlySummaryModal'
import { signOut } from '@/app/actions'


function readTheme(): 'light' | 'dark' {
  return localStorage.getItem('hf-theme') === 'dark' ? 'dark' : 'light'
}
function subscribeTheme(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener('hf-theme-change', callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener('hf-theme-change', callback)
  }
}

export default function Sidebar({ profile = { name: 'Minha conta', email: 'Horizonte Financeiro', initials: 'HF' } }: { profile?: { name: string; email: string; initials: string } }) {
  const pathname = usePathname()
  const [modal,       setModal]       = useState<'entrada' | 'saida' | null>(null)
  const [showDiario,  setShowDiario]  = useState(false)
  const [showCards, setShowCards] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => 'light' as const)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    localStorage.setItem('hf-theme', next)
    window.dispatchEvent(new Event('hf-theme-change'))
  }

  const navBtn = (isActive: boolean) => [
    'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left',
    isActive ? 'bg-accent-soft text-accent' : 'text-text-2 hover:bg-surface-2 hover:text-text',
  ].join(' ')

  return (
    <aside className="w-60 flex-none flex flex-col border-r border-border bg-surface h-full">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-none"
          style={{ background: 'linear-gradient(135deg, var(--accent), #5C7CFF)' }}
        >
          H
        </div>
        <span className="font-semibold text-text text-sm">Horizonte</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 flex flex-col gap-0.5">
        <Link
          href="/"
          className={navBtn(pathname === '/')}
        >
          <LayoutDashboard className="w-[18px] h-[18px] flex-none" />
          Visão Geral
        </Link>

        <button
          onClick={() => setModal('entrada')}
          className={navBtn(false)}
        >
          <TrendingUp className="w-[18px] h-[18px] flex-none" />
          + Entrada
        </button>

        <button
          onClick={() => setModal('saida')}
          className={navBtn(false)}
        >
          <TrendingDown className="w-[18px] h-[18px] flex-none" />
          + Saída
        </button>

        <button
          onClick={() => setShowDiario(true)}
          className={navBtn(false)}
        >
          <List className="w-[18px] h-[18px] flex-none" />
          Diário
        </button>

        <button onClick={() => setShowCards(true)} className={navBtn(false)}>
          <CreditCard className="w-[18px] h-[18px] flex-none" />
          Cartões
        </button>

        <button onClick={() => setShowSummary(true)} className={navBtn(false)}>
          <CalendarDays className="w-[18px] h-[18px] flex-none" />
          Resumo Mensal
        </button>

        <Link
          href="/configuracoes"
          prefetch={false}
          className={navBtn(pathname === '/configuracoes')}
        >
          <Settings className="w-[18px] h-[18px] flex-none" />
          Configurações
        </Link>
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-7 h-7 rounded-full bg-accent-soft text-accent flex items-center justify-center text-[11px] font-bold flex-none select-none">
            {profile.initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text truncate">{profile.name}</p>
            <p className="text-[11px] text-text-3 truncate">{profile.email}</p>
          </div>
          <button
            onClick={toggleTheme}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-text-2 hover:bg-surface-2 hover:text-text transition-colors flex-none"
            title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
          >
            <span className="text-sm select-none">{theme === 'light' ? '☽' : '☀'}</span>
          </button>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] text-text-3 hover:text-text hover:bg-surface-2 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 flex-none" />
            Sair
          </button>
        </form>
      </div>

      {modal && (
        <AddTransactionModal tipo={modal} onClose={() => setModal(null)} />
      )}

      {showSummary && <MonthlySummaryModal onClose={() => setShowSummary(false)} />}

      {showCards && <CreditCardsModal onClose={() => setShowCards(false)} />}

      {showDiario && (
        <DiarioModal onClose={() => setShowDiario(false)} />
      )}
    </aside>
  )
}
