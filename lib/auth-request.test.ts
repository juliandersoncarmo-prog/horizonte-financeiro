import { afterEach, expect, it, vi } from 'vitest'
import { AUTH_TIMEOUT_MESSAGE, passwordSignIn, withAuthDeadline } from './auth-request'
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })
it('aborts a pending operation and discards its late result', async () => {
  vi.useFakeTimers()
  let signal!: AbortSignal
  let resolve!: (value: string) => void
  const pending = withAuthDeadline(s => { signal = s; return new Promise<string>(r => { resolve = r }) })
  const assertion = expect(pending).rejects.toThrow(AUTH_TIMEOUT_MESSAGE)
  await vi.advanceTimersByTimeAsync(10000); await assertion
  expect(signal.aborted).toBe(true)
  resolve('late')
  expect(vi.getTimerCount()).toBe(0)
})
it('clears timer on exception and permits a subsequent attempt', async () => {
  vi.useFakeTimers()
  await expect(withAuthDeadline(async () => { throw new Error('offline') })).rejects.toThrow('offline')
  expect(vi.getTimerCount()).toBe(0)
  expect(await withAuthDeadline(async () => 'ok')).toBe('ok')
})
it('uses same origin POST, passes credentials and rejects an auth redirect HTML response', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response('<html>login</html>', { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  await expect(passwordSignIn(' user@example.invalid ', 'password')).rejects.toThrow()
  expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({ method: 'POST', credentials: 'same-origin', cache: 'no-store', body: JSON.stringify({email:'user@example.invalid',password:'password'}) }))
})
it('requires explicit success and presents the returned safe error', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({error:'E-mail ou senha incorretos.'},{status:401})))
  await expect(passwordSignIn('user@example.invalid','password')).rejects.toThrow('E-mail ou senha incorretos.')
})
