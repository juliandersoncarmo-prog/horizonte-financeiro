export const AUTH_TIMEOUT_MESSAGE = 'A conexão demorou mais que o esperado. Tente novamente.'

/** Bounds SDK operations as well as network calls; late results are discarded. */
export async function withAuthDeadline<T>(operation: (signal: AbortSignal) => Promise<T>, milliseconds = 10000): Promise<T> {
  const controller = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      operation(controller.signal),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => { controller.abort(); reject(new Error(AUTH_TIMEOUT_MESSAGE)) }, milliseconds)
      }),
    ])
  } finally { clearTimeout(timer) }
}

export async function passwordSignIn(email: string, password: string): Promise<void> {
  await withAuthDeadline(async signal => {
    const response = await fetch('/api/auth/login', {
      method: 'POST', credentials: 'same-origin', cache: 'no-store', signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    }).catch(() => { throw new Error(signal.aborted ? AUTH_TIMEOUT_MESSAGE : 'Falha de conexão. Tente novamente.') })
    const result = await response.json().catch(() => { throw new Error('Não foi possível concluir o acesso. Recarregue a página e tente novamente.') })
    if (!result || typeof result !== 'object' || !('success' in result) || !response.ok || result.success !== true) {
      const message = result && typeof result === 'object' && 'error' in result && typeof result.error === 'string' ? result.error : 'Não foi possível entrar. Tente novamente.'
      throw new Error(message)
    }
  }, 15000)
}
