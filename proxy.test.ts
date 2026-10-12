import { beforeEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const mock = vi.hoisted(() => ({ user: null as { id: string } | null, error: null as object | null, refresh: false }))
vi.mock('@supabase/ssr', () => ({ createServerClient: (_url: unknown, _key: unknown, options: { cookies: { setAll: (value: unknown[]) => void } }) => ({
  auth: { getUser: async () => {
    if (mock.refresh) options.cookies.setAll([{ name: 'hf-session', value: 'renewed', options: { httpOnly: true, path: '/' } }])
    return { data: { user: mock.user }, error: mock.error }
  } },
}) }))
import { proxy } from './proxy'
beforeEach(() => { mock.user = null; mock.error = null; mock.refresh = false })
it('protects the financial page before onboarding', async () => {
  expect((await proxy(new NextRequest('https://test.example/'))).headers.get('location')).toBe('https://test.example/login')
})
it.each(['/login','/register','/forgot-password','/reset-password','/auth/callback'])('keeps the original public auth route %s', async path => {
  expect((await proxy(new NextRequest('https://test.example' + path))).headers.get('location')).toBeNull()
})
it('preserves refreshed session cookies when redirecting login to the application', async () => {
  mock.user = { id: 'test-user' }; mock.refresh = true
  const response = await proxy(new NextRequest('https://test.example/login'))
  expect(response.headers.get('location')).toBe('https://test.example/')
  expect(response.cookies.get('hf-session')?.value).toBe('renewed')
})
it('rejects an invalid session despite a stale user object', async () => {
  mock.user = { id: 'test-user' }; mock.error = { message: 'expired' }
  expect((await proxy(new NextRequest('https://test.example/'))).headers.get('location')).toBe('https://test.example/login')
})
