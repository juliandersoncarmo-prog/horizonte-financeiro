import { beforeEach, expect, it, vi } from 'vitest'
const mock = vi.hoisted(() => ({ exchange: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { exchangeCodeForSession: mock.exchange } }) }))
import { GET } from './route'
beforeEach(() => mock.exchange.mockResolvedValue({ error: null }))
it('exchanges the original Google/email PKCE code and opens the authenticated page', async () => {
  const response = await GET(new Request('https://test.example/auth/callback?code=example'))
  expect(mock.exchange).toHaveBeenCalledWith('example')
  expect(response.headers.get('location')).toBe('https://test.example/')
})
it('uses the same callback for password recovery', async () => {
  const response = await GET(new Request('https://test.example/auth/callback?code=example&next=/reset-password'))
  expect(response.headers.get('location')).toBe('https://test.example/reset-password')
})
it('never redirects a callback to another origin', async () => {
  const response = await GET(new Request('https://test.example/auth/callback?code=example&next=https://other.example'))
  expect(response.headers.get('location')).toBe('https://test.example/')
})
it('returns to the original login on a missing or invalid code', async () => {
  expect((await GET(new Request('https://test.example/auth/callback'))).headers.get('location')).toBe('https://test.example/login?auth_error=callback')
  mock.exchange.mockResolvedValue({ error: { message: 'invalid' } })
  expect((await GET(new Request('https://test.example/auth/callback?code=bad'))).headers.get('location')).toBe('https://test.example/login?auth_error=callback')
})

it('handles expired recovery and thrown PKCE errors without leaking parameters', async () => {
 const response=await GET(new Request('https://test.example/auth/callback?error=otp_expired&next=/reset-password'))
 expect(response.headers.get('location')).toBe('https://test.example/forgot-password?auth_error=callback')
 expect(response.headers.get('cache-control')).toBe('private, no-store')
 mock.exchange.mockRejectedValueOnce(new Error('private-secret'))
 expect((await GET(new Request('https://test.example/auth/callback?code=secret&next=/reset-password'))).headers.get('location')).toBe('https://test.example/forgot-password?auth_error=callback')
})
