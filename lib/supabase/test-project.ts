export function assertTestProject() {
  if (process.env.HF_TEST_MODE === 'true'
    && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://hsvjkbfpvmtnehjbwtgr.supabase.co') {
    throw new Error('Ambiente de testes exige o projeto horizonte-testes autorizado.')
  }
}
