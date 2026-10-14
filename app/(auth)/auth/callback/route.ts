import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const recovery = searchParams.get('next') === '/reset-password'
  const destination = recovery ? '/reset-password' : '/'
  const fail = () => {
    const response = NextResponse.redirect(`${origin}${recovery ? '/forgot-password' : '/login'}?auth_error=callback`)
    response.headers.set('Cache-Control', 'private, no-store')
    return response
  }
  const code = searchParams.get('code')
  if (!code || searchParams.has('error')) return fail()
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.warn('auth.callback.failed', { code: error.code ?? 'unknown', status: error.status ?? 0 })
      return fail()
    }
    const response = NextResponse.redirect(`${origin}${destination}`)
    response.headers.set('Cache-Control', 'private, no-store')
    return response
  } catch { return fail() }
}
