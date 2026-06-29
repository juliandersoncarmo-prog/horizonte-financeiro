'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    setError('')
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return }
    if (password !== confirmPassword) { setError('As senhas não coincidem.'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/login'), 2000)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#F0F2F8] flex items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-row">

        {/* Painel esquerdo */}
        <div className="hidden md:flex flex-col justify-between bg-[#F4F6F9] p-10 w-1/2 min-h-[600px]">
          <div className="flex items-center gap-2 mb-16">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: '#3B5BDB' }}>H</div>
            <span className="text-gray-700 font-semibold text-lg">Horizonte</span>
          </div>
          <div className="mb-4">
            <h1 className="font-bold text-4xl text-gray-900 leading-tight">Seu horizonte</h1>
            <h1 className="font-bold text-4xl leading-tight" style={{ color: '#3B5BDB' }}>financeiro com clareza</h1>
          </div>
          <p className="text-gray-500 text-base mb-12 max-w-sm">
            Acompanhe entradas, saídas e conquiste seus objetivos com uma visão completa das suas finanças.
          </p>
          <div className="flex flex-col gap-6 mb-12">
            <Feature icon="📈" title="Visão completa" description="Entenda sua saúde financeira em tempo real." />
            <Feature icon="↕️" title="Organização inteligente" description="Registre, categorize e acompanhe cada movimento." />
            <Feature icon="🎯" title="Decisões melhores" description="Dados claros para escolhas mais seguras." />
          </div>
          <div className="bg-white rounded-2xl shadow-md p-5 border border-gray-100">
            <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">Visão geral — Junho 2026</p>
            <div className="flex gap-4">
              <KpiCard label="SALDO HOJE" value="R$ 8.420,00" color="#1B7A43" />
              <KpiCard label="ENTRADAS DO MÊS" value="R$ 12.300,00" color="#2E9E5B" />
              <KpiCard label="SAÍDAS DO MÊS" value="R$ 3.880,00" color="#C32626" />
            </div>
          </div>
        </div>

        {/* Painel direito */}
        <div className="flex flex-col justify-center p-10 w-full md:w-1/2">
          <div className="flex justify-center mb-8">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: '#3B5BDB' }}>H</div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">Criar nova senha</h2>
          <p className="text-gray-500 text-sm text-center mb-8">Digite sua nova senha abaixo.</p>

          {error && <Alert type="error">{error}</Alert>}
          {success && (
            <Alert type="success">Senha atualizada! Redirecionando para o login…</Alert>
          )}

          {!success && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><LockIcon /></span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 pl-10 pr-11 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nova senha</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><ShieldIcon /></span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repita a nova senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 pl-10 pr-11 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <PrimaryBtn onClick={handleSave} loading={loading}>
                {loading ? 'Salvando…' : 'Salvar nova senha'}
              </PrimaryBtn>
            </>
          )}
        </div>

      </div>
    </div>
  )
}

// ── Shared helpers ───────────────────────────────────────────

function PrimaryBtn({
  onClick,
  loading,
  children,
}: {
  onClick: () => void
  loading: boolean
  children: React.ReactNode
}) {
  return (
    <div
      onClick={!loading ? onClick : undefined}
      className="w-full rounded-lg py-2.5 text-sm font-semibold text-white text-center cursor-pointer transition mb-4 select-none"
      style={{ backgroundColor: loading ? '#7D9BF0' : '#3B5BDB' }}
      onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLDivElement).style.backgroundColor = '#2F4EC0' }}
      onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLDivElement).style.backgroundColor = '#3B5BDB' }}
    >
      {children}
    </div>
  )
}

function Alert({ type, children }: { type: 'error' | 'success'; children: React.ReactNode }) {
  const cls = type === 'error'
    ? 'bg-red-50 border-red-200 text-red-700'
    : 'bg-green-50 border-green-200 text-green-700'
  return (
    <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${cls}`}>{children}</div>
  )
}

function Feature({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-xl mt-0.5">{icon}</span>
      <div>
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  )
}

function KpiCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex-1">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">{label}</p>
      <p className="text-base font-bold" style={{ color }}>{value}</p>
    </div>
  )
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}
