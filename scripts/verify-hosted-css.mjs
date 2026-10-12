// Run after the Sites build: node scripts/verify-hosted-css.mjs <site checkout>
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import assert from 'node:assert/strict'
const site = resolve(process.argv[2] ?? '.')
assert.equal(readFileSync(resolve(site, 'app/globals.css'), 'utf8'), readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8'), 'Hosted CSS must match Horizonte, not starter')
assert.equal(readFileSync(resolve(site, 'app/layout.tsx'), 'utf8'), readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8'), 'Hosted root layout must match Horizonte')
const directory = resolve(site, 'dist/client/_next/static/css')
const css = readdirSync(directory).filter(name => name.endsWith('.css')).map(name => readFileSync(resolve(directory, name), 'utf8')).join('\n')
for (const token of ['--bg:', '--surface:', '--text:', '--accent:', '[data-theme=dark]', '.bg-bg', '.bg-surface', '.text-text', '.bg-accent', '.bg-green', '.bg-red', '.fixed', '.inset-0']) assert(css.includes(token), `Missing compiled token/utility: ${token}`)
assert(!css.includes('--background:#0a0a0a'), 'Starter dark background leaked into bundle')
console.log('PASS: original layout/CSS preserved, light/dark tokens and modal/form utilities emitted')
