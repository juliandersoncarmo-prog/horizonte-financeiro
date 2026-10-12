import { expect, it, vi } from 'vitest'
const session = vi.hoisted(() => ({ client: { marker: 'authenticated-session' }, create: vi.fn() }))
vi.mock('./server', () => ({ createClient: session.create }))
import { createUserDataClient } from './service'
it('uses the request session even when a privileged key is present', async () => {
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'must-never-be-used')
  session.create.mockResolvedValue(session.client)
  expect(await createUserDataClient()).toBe(session.client)
  vi.unstubAllEnvs()
})
