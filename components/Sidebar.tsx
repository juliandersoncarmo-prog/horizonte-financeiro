'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TrendingUp, TrendingDown, List, Settings } from 'lucide-react'
import AddTransactionModal from './AddTransactionModal'

export default function Sidebar() {
  const [active, setActive] = useState('entradas')
  const [modal,  setModal]  = useState<'entrada' | 'saida' | null>(null)
  const [theme,  setTheme]  = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const saved = localStorage.getItem('hf-theme') as 'light' | 'dark' | null
    if (saved) {
      setTheme(saved)
      document.documentElement.setAttribute('data-theme', saved)
    }
  }, [])

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('hf-theme', next)
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
        <button
          onClick={() => { setActive('entradas'); setModal('entrada') }}
          className={navBtn(active === 'entradas')}
        >
          <TrendingUp className="w-[18px] h-[18px] flex-none" />
          + Entrada
        </button>

        <button
          onClick={() => { setActive('saidas'); setModal('saida') }}
          className={navBtn(active === 'saidas')}
        >
          <TrendingDown className="w-[18px] h-[18px] flex-none" />
          + Saída
        </button>

        <button
          onClick={() => setActive('diario')}
          className={navBtn(active === 'diario')}
        >
          <List className="w-[18px] h-[18px] flex-none" />
          Diário
        </button>

        <Link
          href="/configuracoes"
          className={navBtn(active === 'configuracoes')}
          onClick={() => setActive('configuracoes')}
        >
          <Settings className="w-[18px] h-[18px] flex-none" />
          Configurações
        </Link>
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-7 h-7 rounded-full bg-accent-soft text-accent flex items-center justify-center text-[11px] font-bold flex-none select-none">
            JA
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text truncate">Julia Anderson</p>
            <p className="text-[11px] text-text-3 truncate">juliandersoncarmo@gmail.com</p>
          </div>
          <button
            onClick={toggleTheme}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-text-2 hover:bg-surface-2 hover:text-text transition-colors flex-none"
            title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
          >
            <span className="text-sm select-none">{theme === 'light' ? '☽' : '☀'}</span>
          </button>
        </div>
      </div>

      {modal && (
        <AddTransactionModal tipo={modal} onClose={() => setModal(null)} />
      )}
    </aside>
  )
}
