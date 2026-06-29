'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignIn() {
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      router.push('/')
    }
  }

  async function handleGoogleSignIn() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/auth/callback' },
    })
  }

  return (
    <div className="min-h-screen w-full bg-[#F0F2F8] flex items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-row">
      {/* Painel esquerdo */}
      <div
        className="hidden md:flex flex-col justify-between bg-[#F4F6F9] p-10 w-1/2 min-h-[600px]"
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mb-16">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: '#3B5BDB' }}
          >
            H
          </div>
          <span className="text-gray-700 font-semibold text-lg">Horizonte</span>
        </div>

        {/* Título */}
        <div className="mb-4">
          <h1 className="font-bold text-4xl text-gray-900 leading-tight">Seu horizonte</h1>
          <h1 className="font-bold text-4xl leading-tight" style={{ color: '#3B5BDB' }}>
            financeiro com clareza
          </h1>
        </div>

        {/* Subtítulo */}
        <p className="text-gray-500 text-base mb-12 max-w-sm">
          Acompanhe entradas, saídas e conquiste seus objetivos com uma visão completa das suas finanças.
        </p>

        {/* Features */}
        <div className="flex flex-col gap-6 mb-12">
          <Feature
            icon="📈"
            title="Visão completa"
            description="Entenda sua saúde financeira em tempo real."
          />
          <Feature
            icon="↕️"
            title="Organização inteligente"
            description="Registre, categorize e acompanhe cada movimento."
          />
          <Feature
            icon="🎯"
            title="Decisões melhores"
            description="Dados claros para escolhas mais seguras."
          />
        </div>

        {/* Card de preview */}
        <div>
          <div className="bg-white rounded-2xl shadow-md p-5 border border-gray-100">
            <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">
              Visão geral — Junho 2026
            </p>
            <div className="flex gap-4">
              <KpiCard label="SALDO HOJE" value="R$ 8.420,00" color="#1B7A43" />
              <KpiCard label="ENTRADAS DO MÊS" value="R$ 12.300,00" color="#2E9E5B" />
              <KpiCard label="SAÍDAS DO MÊS" value="R$ 3.880,00" color="#C32626" />
            </div>
          </div>
        </div>
      </div>

      {/* Painel direito */}
      <div className="flex flex-col justify-center p-10 w-full md:w-1/2">
          {/* Logo centralizado */}
          <div className="flex justify-center mb-8">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-xl"
              style={{ backgroundColor: '#3B5BDB' }}
            >
              H
            </div>
          </div>

          {/* Título do formulário */}
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">
            Entrar na sua conta
          </h2>
          <p className="text-gray-500 text-sm text-center mb-8">
            Acesse seu horizonte financeiro
          </p>

          {/* Erro */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Campo E-mail */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>

          {/* Campo Senha */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* Lembrar + Esqueci */}
          <div className="flex items-center justify-between mb-6">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 accent-blue-600"
              />
              <span className="text-sm text-gray-600">Lembrar de mim</span>
            </label>
            <a
              href="/forgot-password"
              className="text-sm font-medium"
              style={{ color: '#3B5BDB' }}
            >
              Esqueci minha senha
            </a>
          </div>

          {/* Botão Entrar */}
          <div
            onClick={!loading ? handleSignIn : undefined}
            className="w-full rounded-lg py-2.5 text-sm font-semibold text-white text-center cursor-pointer transition mb-4 select-none"
            style={{
              backgroundColor: loading ? '#7D9BF0' : '#3B5BDB',
            }}
            onMouseEnter={(e) => {
              if (!loading) (e.currentTarget as HTMLDivElement).style.backgroundColor = '#2F4EC0'
            }}
            onMouseLeave={(e) => {
              if (!loading) (e.currentTarget as HTMLDivElement).style.backgroundColor = '#3B5BDB'
            }}
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </div>

          {/* Rodapé */}
          <p className="text-center text-sm text-gray-500 mb-4">
            Ainda não tem conta?{' '}
            <a href="/register" className="font-medium" style={{ color: '#3B5BDB' }}>
              Criar conta
            </a>
          </p>

          {/* Divisor */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">ou</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Botão Google */}
          <div
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 bg-white cursor-pointer hover:bg-gray-50 transition select-none"
          >
            <GoogleIcon />
            Continuar com Google
          </div>
      </div>
      </div>
    </div>
  )
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
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

function KpiCard({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: string
}) {
  return (
    <div className="flex-1">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">{label}</p>
      <p className="text-base font-bold" style={{ color }}>
        {value}
      </p>
    </div>
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
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}
