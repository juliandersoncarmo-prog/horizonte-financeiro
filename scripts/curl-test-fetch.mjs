// Optional test-only transport for managed environments where Node fetch cannot
// reach the configured HTTP proxy. Credentials are passed through stdin only.
import { spawnSync } from 'node:child_process'
export async function curlTestFetch(input, init = {}) {
  const url = typeof input === 'string' ? input : input.url ?? String(input)
  const headers = new Headers(init.headers ?? {})
  const lines = [`url = ${JSON.stringify(url)}`, `request = ${JSON.stringify(init.method ?? 'GET')}`]
  headers.forEach((value, name) => lines.push(`header = ${JSON.stringify(`${name}: ${value}`)}`))
  if (init.body !== undefined) lines.push(`data = ${JSON.stringify(String(init.body))}`)
  const result = spawnSync('curl', ['--silent', '--show-error', '--connect-timeout', '5', '--max-time', '20', '--write-out', '\n%{http_code}', '--config', '-'], {
    input: lines.join('\n'), encoding: 'utf8', maxBuffer: 4 * 1024 * 1024,
  })
  if (result.status !== 0) throw new Error('Test HTTP transport failed or timed out')
  const split = result.stdout.lastIndexOf('\n')
  const status = Number(result.stdout.slice(split + 1))
  return new Response(result.stdout.slice(0, split) || null, { status, headers: { 'content-type': 'application/json' } })
}
