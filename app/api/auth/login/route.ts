import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { assertTestProject } from '@/lib/supabase/test-project'
import { AUTH_TIMEOUT_MESSAGE, withAuthDeadline } from '@/lib/auth-request'

function failure(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: NextRequest) {
  // Prevent login CSRF. Never trust forwarded hosts supplied by the caller.
  if (request.headers.get('origin') !== new URL(request.url).origin) return failure('Reabra a página e tente novamente.', 403)
  if (!request.headers.get('content-type')?.startsWith('application/json')) return failure('Formato inválido.', 415)
  try {
    assertTestProject()
    const body = await request.text()
    if (body.length > 8192) return failure('Dados inválidos.', 400)
    const { email, password } = JSON.parse(body)
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.length > 254 || typeof password !== 'string' || !password || password.length > 4096) {
      return failure('Informe um e-mail válido e sua senha.', 400)
    }
    return await withAuthDeadline(async signal => {
      const response = NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } })
      const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        global: { fetch: (input, init) => fetch(input, { ...init, signal }) },
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: values => values.forEach(({ name, value, options }) => response.cookies.set(name, value, { ...options, sameSite: 'lax', secure: new URL(request.url).protocol === 'https:' })),
        },
      })
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (signal.aborted) throw new Error(AUTH_TIMEOUT_MESSAGE)
      if (error) {
        console.warn('auth.password.failed', { code: error.code ?? 'unknown', status: error.status ?? 0 })
        if (error.code === 'email_not_confirmed') return failure('Confirme seu e-mail antes de entrar.', 401)
        if (error.status === 429) return failure('Muitas tentativas. Aguarde um pouco e tente novamente.', 429)
        if (error.code === 'invalid_credentials') return failure('E-mail ou senha incorretos. Confira os dados e tente novamente.', 401)
        return failure('Não foi possível conectar. Tente novamente.', 503)
      }
      if (!data.session || !data.user) return failure('Não foi possível iniciar a sessão. Tente novamente.', 401)
      return response
    })
  } catch (error) {
    if (error instanceof SyntaxError) return failure('Dados inválidos.', 400)
    return failure(error instanceof Error && error.message === AUTH_TIMEOUT_MESSAGE ? AUTH_TIMEOUT_MESSAGE : 'Falha de conexão. Tente novamente.', 503)
  }
}
