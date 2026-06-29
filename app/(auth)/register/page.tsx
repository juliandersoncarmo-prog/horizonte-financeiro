'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleContinue() {
    setError('')
    if (!email) { setError('Informe seu e-mail.'); return }
    setStep(2)
  }

  async function handleGoogleSignIn() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/auth/callback' },
    })
  }

  async function handleSignUp() {
    setError('')
    if (!name) { setError('Informe seu nome completo.'); return }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return }
    if (password !== confirmPassword) { setError('As senhas não coincidem.'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
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
          {step === 1 ? (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: '#3B5BDB' }}>H</div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">Criar sua conta</h2>
              <p className="text-gray-500 text-sm text-center mb-8">Informe seu e-mail para começar.</p>

              {error && <Alert type="error">{error}</Alert>}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><EnvelopeIcon /></span>
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
              </div>

              <PrimaryBtn onClick={handleContinue} loading={false}>Continuar</PrimaryBtn>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">ou continue com</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 bg-white cursor-pointer hover:bg-gray-50 transition mb-6 select-none"
              >
                <GoogleIcon />
                Continuar com Google
              </div>

              <SecurityBadge />
            </>
          ) : (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: '#3B5BDB' }}>H</div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">Criar sua conta</h2>
              <p className="text-gray-500 text-sm text-center mb-8">Complete seu cadastro abaixo.</p>

              {error && <Alert type="error">{error}</Alert>}
              {success && (
                <Alert type="success">Verifique seu e-mail para confirmar a conta.</Alert>
              )}

              {!success && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><EnvelopeIcon /></span>
                      <input
                        type="email"
                        value={email}
                        readOnly
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-16 py-2.5 text-sm text-gray-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => { setStep(1); setError('') }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium"
                        style={{ color: '#3B5BDB' }}
                      >
                        Alterar
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><PersonIcon /></span>
                      <input
                        type="text"
                        placeholder="Seu nome"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
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

                  <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><ShieldIcon /></span>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Repita a senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 pl-10 pr-11 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                        {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>

                  <PrimaryBtn onClick={handleSignUp} loading={loading}>
                    {loading ? 'Criando conta…' : 'Criar conta'}
                  </PrimaryBtn>

                  <p className="text-xs text-gray-400 text-center mb-6">
                    Ao criar uma conta, você concorda com nossos{' '}
                    <span className="underline cursor-pointer">Termos de Uso</span> e{' '}
                    <span className="underline cursor-pointer">Política de Privacidade</span>.
                  </p>
                </>
              )}

              <SecurityBadge />
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

function SecurityBadge() {
  return (
    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
      <span className="text-gray-400 flex-none"><ShieldIcon size={15} /></span>
      <p className="text-xs text-gray-500">Seus dados são protegidos com criptografia de ponta a ponta.</p>
    </div>
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

// ── Icons ────────────────────────────────────────────────────

function EnvelopeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

function PersonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 1 0-16 0" />
    </svg>
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

function ShieldIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}
