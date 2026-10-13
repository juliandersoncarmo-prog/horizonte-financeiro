'use client'

import { useState, useEffect, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TrendingUp, TrendingDown, List, CreditCard, Settings, LogOut, LayoutDashboard, CalendarDays, Menu, X, Home, Plus, BarChart3 } from 'lucide-react'
import AddTransactionModal from './AddTransactionModal'
import CreditCardsModal from './CreditCardsModal'
import DiarioModal from './DiarioModal'
import MonthlySummaryModal from './MonthlySummaryModal'
import ModalPortal from './ModalPortal'
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
  const [menuOpen, setMenuOpen] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const [modal,       setModal]       = useState<'entrada' | 'saida' | null>(null)
  const [showDiario,  setShowDiario]  = useState(false)
  const [showCards, setShowCards] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => 'light' as const)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    const viewport = window.visualViewport
    const update = () => setKeyboardOpen(!!viewport && window.innerHeight - viewport.height > 150 && !!document.activeElement?.matches('input, textarea, select'))
    viewport?.addEventListener('resize', update)
    document.addEventListener('focusout', update)
    return () => { viewport?.removeEventListener('resize', update); document.removeEventListener('focusout', update) }
  }, [])

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    localStorage.setItem('hf-theme', next)
    window.dispatchEvent(new Event('hf-theme-change'))
  }

  const navBtn = (isActive: boolean) => [
    'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left',
    isActive ? 'bg-accent-soft text-accent' : 'text-text-2 hover:bg-surface-2 hover:text-text',
  ].join(' ')

  const content = <>

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

    </>
  return <>
      {modal && (
        <AddTransactionModal tipo={modal} onClose={() => setModal(null)} />
      )}

      {showSummary && <MonthlySummaryModal onClose={() => setShowSummary(false)} />}

      {showCards && <CreditCardsModal onClose={() => setShowCards(false)} />}

      {showDiario && (
        <DiarioModal onClose={() => setShowDiario(false)} />
      )}

    <header className="mobile-header">
      <button type="button" aria-label="Abrir menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Menu size={22} /></button>
      <span className="mobile-brand font-semibold text-text">Horizonte</span>
      <Link href="/configuracoes" prefetch={false} className="mobile-avatar" aria-label="Configurações da conta">{profile.initials}</Link>
    </header>
    <nav className={`mobile-bottom-nav${keyboardOpen ? ' keyboard-open' : ''}`} aria-label="Navegação principal">
      <Link href="/" aria-current={pathname === '/' && !showDiario && !showCards && !showSummary ? 'page' : undefined}><Home size={22} /><span>Início</span></Link>
      <button type="button" onClick={() => setShowDiario(true)} aria-pressed={showDiario}><CalendarDays size={22} /><span>Diário</span></button>
      <button type="button" className="mobile-add" aria-label="Novo lançamento" onClick={() => setShowAdd(true)}><Plus size={32} /></button>
      <button type="button" onClick={() => setShowCards(true)} aria-pressed={showCards}><CreditCard size={22} /><span>Cartões</span></button>
      <button type="button" onClick={() => setShowSummary(true)} aria-pressed={showSummary}><BarChart3 size={22} /><span>Resumo</span></button>
    </nav>
    {showAdd && <ModalPortal label="Novo lançamento" onClose={() => setShowAdd(false)}>
      <div className="bg-surface p-5 rounded-2xl border border-border">
        <div className="flex items-center justify-between mb-4"><h2 className="font-semibold text-text">Novo lançamento</h2><button type="button" aria-label="Fechar opções" onClick={() => setShowAdd(false)} className="p-3"><X size={20} /></button></div>
        <button type="button" className="mobile-new-entry" onClick={() => { setShowAdd(false); setModal('entrada') }}><TrendingUp size={22} />Nova entrada</button>
        <button type="button" className="mobile-new-expense" onClick={() => { setShowAdd(false); setModal('saida') }}><TrendingDown size={22} />Nova saída</button>
      </div>
    </ModalPortal>}
    <aside className="desktop-sidebar w-60 flex-none flex flex-col border-r border-border bg-surface h-full">{content}</aside>
    {menuOpen && <ModalPortal label="Menu de navegação" onClose={() => setMenuOpen(false)}>
      <aside className="mobile-drawer bg-surface flex flex-col" onClick={event => { if ((event.target as Element).closest('nav button, nav a')) setMenuOpen(false) }}>
        <button className="self-end p-3" aria-label="Fechar menu" onClick={() => setMenuOpen(false)}><X size={22} /></button>
        {content}
      </aside>
    </ModalPortal>}
  </>
}
