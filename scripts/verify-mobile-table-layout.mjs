// Requires an existing authenticated test preview and Playwright browser capability.
// BASE_URL=... STORAGE_STATE=/absolute/path/to/test-session.json node scripts/verify-mobile-table-layout.mjs
// Does not create records or change finances; only changes DOM text in the local browser.
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
const base = process.env.BASE_URL
assert(base, 'Supply BASE_URL for the test preview; this script does not start a server')
const browser = await chromium.launch()
const context = await browser.newContext({ storageState: process.env.STORAGE_STATE || undefined })
const page = await context.newPage()
const samples = ['−R$ 25,00', '−R$ 200,00', '−R$ 1.200,00', '−R$ 10.000,00', 'R$ 11.958,01', 'R$ 125.000,00']
const results = []
try {
 for (const width of [320, 375, 390, 430, 1440]) {
  await page.setViewportSize({ width, height: 1000 }); await page.goto(base)
  await page.locator('.month-day-row').first().waitFor()
  await page.evaluate(() => document.fonts.ready)
  if (width >= 640) {
   const desktop = await page.evaluate(() => ({ visible: [...document.querySelectorAll('.month-card')].filter(el => el.getBoundingClientRect().width > 0).length, wrappers: [...document.querySelectorAll('.month-table-viewport, .month-table')].map(el => getComputedStyle(el).display), grid: getComputedStyle(document.querySelector('.month-day-row')).gridTemplateColumns }))
   assert.equal(desktop.visible, 4); assert(desktop.wrappers.every(value => value === 'contents')); assert(desktop.grid.startsWith('72px ')); results.push({ width, desktop }); continue
  }
  for (const mode of ['Diário', 'Entradas', 'Saídas']) {
   await page.locator('.column-mode-trigger:visible').first().click()
   await page.getByRole('menuitemradio', { name: mode, exact: true }).click()
   for (const amount of samples) {
    await page.evaluate(amount => {
     document.querySelectorAll('.month-day-row .day-mid-value .num').forEach(el => { el.textContent = amount })
     document.querySelectorAll('.month-day-row .day-balance .num').forEach(el => { el.textContent = amount.replace('−', '') })
    }, amount)
    const metrics = await page.evaluate(() => {
     const card = [...document.querySelectorAll('.month-card')].find(el => el.getBoundingClientRect().width > 0), row = card.querySelector('.month-day-row')
     const rect = el => { const r = el.getBoundingClientRect(); return { left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:r.width, centerY:(r.top+r.bottom)/2 } }
     const date = row.children[0], mid = row.querySelector('.daily-display') || row.querySelector('.day-mid-value > span'), balance = row.querySelector('.day-balance > span'), pencil = row.querySelector('.daily-display > button'), value = row.querySelector('.day-mid-value .num'), viewport = card.querySelector('.month-table-viewport'), kpis = document.querySelector('.ledger-kpis'), style = getComputedStyle(kpis)
     const innerKpi = rect(kpis); innerKpi.left += parseFloat(style.paddingLeft); innerKpi.right -= parseFloat(style.paddingRight)
     const box = el => ({ ...rect(el), font:parseFloat(getComputedStyle(el).fontSize) })
     return { card:rect(card), kpi:innerKpi, date:box(date.querySelector('.num')), weekday:box(date.lastElementChild), mid:rect(mid), value:box(value), balance:box(balance), pencil:pencil ? rect(pencil) : null, viewport:rect(viewport), scrollWidth:viewport.scrollWidth, clientWidth:viewport.clientWidth, documentWidth:document.documentElement.scrollWidth, dateGroup:rect(date), headingGrid:getComputedStyle(card.querySelector('.month-table-heading')).gridTemplateColumns, rowGrid:getComputedStyle(row).gridTemplateColumns }
    })
    assert(Math.abs(metrics.card.left - metrics.kpi.left) <= 1); assert(Math.abs(metrics.card.right - metrics.kpi.right) <= 1)
    assert(Math.abs(metrics.card.left - (width - metrics.card.right)) <= 1)
    assert.equal(metrics.date.font, 17); assert.equal(metrics.weekday.font, 14)
    assert.equal(metrics.value.font, width < 360 ? 15 : 16); assert.equal(metrics.balance.font, width < 360 ? 15 : 16)
    assert.equal(metrics.headingGrid, metrics.rowGrid)
    assert(metrics.mid.left - metrics.dateGroup.right >= 5); assert(metrics.balance.left - metrics.mid.right >= 5)
    assert(metrics.documentWidth <= width)
    // Required sample values should fit. Exceptional larger values use internal scroll.
    if (metrics.scrollWidth > metrics.clientWidth + 1) {
     // Check the full right-hand value is reachable without document overflow.
     const rightEdge = await page.evaluate(() => { const el = document.querySelector('.month-card:not(.hidden) .month-table-viewport'); el.scrollLeft = el.scrollWidth; const b = el.querySelector('.day-balance > span').getBoundingClientRect(); return { right: b.right, viewportRight: el.getBoundingClientRect().right } })
     assert(rightEdge.right <= rightEdge.viewportRight + 1)
     await page.locator('.month-table-viewport:visible').first().evaluate(el => { el.scrollLeft = 0 })
    } else assert(metrics.balance.right <= metrics.viewport.right + 1)
    assert(metrics.dateGroup.left >= metrics.viewport.left)
    if (metrics.pencil) { assert(Math.abs(metrics.pencil.left - metrics.value.right - 5) < 1); assert(Math.abs(metrics.pencil.centerY - metrics.value.centerY) < 1) }
    results.push({ width, mode, amount, metrics })
   }
   await page.screenshot({ path:`/tmp/horizonte-table-${width}-${mode}.png`, fullPage:true })
  }
 }
 writeFileSync('/tmp/horizonte-table-measurements.json', JSON.stringify(results, null, 2))
 console.log('PASS: rendered mobile matrix and desktop structure; review screenshots separately')
} finally { await browser.close() }
