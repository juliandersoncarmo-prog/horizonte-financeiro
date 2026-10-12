import { afterEach, expect, it, vi } from 'vitest'
import { assertTestProject } from './test-project'
afterEach(() => vi.unstubAllEnvs())
it('refuses any other project when test mode is active', () => {
  vi.stubEnv('HF_TEST_MODE', 'true')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://aahliptkdexrbqcnnlvt.supabase.co')
  expect(assertTestProject).toThrow('horizonte-testes')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://other.supabase.co')
  expect(assertTestProject).toThrow('horizonte-testes')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://hsvjkbfpvmtnehjbwtgr.supabase.co')
  expect(assertTestProject).not.toThrow()
})
