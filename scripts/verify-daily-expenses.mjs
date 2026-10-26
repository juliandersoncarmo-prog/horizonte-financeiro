// Isolated interaction/layout check. No login, external database or real finance data.
// Install Playwright Chromium first, or set CHROMIUM_EXECUTABLE to an existing browser.
import {createServer} from 'vite'
import react from '@vitejs/plugin-react'
import {chromium} from 'playwright'
import {fileURLToPath} from 'node:url'
import assert from 'node:assert/strict'
import {mkdir} from 'node:fs/promises'
const path=(p)=>fileURLToPath(new URL(p,import.meta.url))
const server=await createServer({configFile:false,root:path('../tests/expenses-browser/'),plugins:[react()],resolve:{alias:[{find:'./ProjectionProvider',replacement:path('../tests/expenses-browser/projection.ts')},{find:'@/app/expense-actions',replacement:path('../tests/expenses-browser/actions.ts')},{find:'next/navigation',replacement:path('../tests/expenses-browser/navigation.ts')},{find:'@',replacement:path('../')}]},server:{host:'127.0.0.1',port:0}})
await server.listen()
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,args:process.env.CHROMIUM_EXECUTABLE?['--no-sandbox','--disable-dev-shm-usage']:[]})
const output=process.env.HF_SCREENSHOT_DIR||'/tmp/hf-expenses-screens'
await mkdir(output,{recursive:true})
try {
 const page=await browser.newPage({locale:'pt-BR',timezoneId:'America/Fortaleza'})
 const errors=[];page.on('pageerror',e=>{errors.push(String(e));console.error(String(e))})
 const base=server.resolvedUrls.local[0]
 for(const width of [320,375,390,768,1440]) {
  await page.setViewportSize({width,height:1000});await page.goto(base)
  await page.getByRole('heading',{name:'Resumo do mês'}).waitFor()
  for(const theme of ['light','dark']) {
   await page.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme)
   const geometry=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth,calendar:[...document.querySelectorAll('.expenses-calendar-grid button')].map(b=>({w:b.getBoundingClientRect().width,h:b.getBoundingClientRect().height}))}))
   assert(geometry.scroll<=geometry.width,`Overflow at ${width}/${theme}`)
   assert(geometry.calendar.every(b=>b.h>=44 && b.w>=30),`Calendar targets ${width}`)
   await page.screenshot({path:`${output}/${width}-${theme}.png`,fullPage:true})
  }
  await page.getByRole('button',{name:'Novo gasto',exact:true}).click()
  await page.getByLabel('Descrição',{exact:true}).fill('Café com pão e uma descrição longa para testar legibilidade')
  await page.getByLabel('Valor (R$)',{exact:true}).fill('25,90')
  await page.getByRole('button',{name:'Criar categoria',exact:true}).click()
  await page.getByLabel('Nome da categoria',{exact:true}).fill('Alimentação')
  await page.getByRole('button',{name:'Criar',exact:true}).click()
  await page.getByLabel('Categoria',{exact:true}).selectOption({label:'Alimentação'})
  await page.screenshot({path:`${output}/${width}-form.png`,fullPage:true})
  await page.getByRole('button',{name:'Salvar gasto',exact:true}).click()
  await page.getByRole('dialog').waitFor({state:'detached'})
  await page.screenshot({path:`${output}/${width}-history.png`,fullPage:true})
  await page.getByRole('button',{name:/Editar Café/}).click()
  await page.getByLabel('Valor (R$)',{exact:true}).fill('30,10')
  await page.getByRole('button',{name:'Salvar gasto',exact:true}).click()
  await page.getByRole('dialog').waitFor({state:'detached'})
  assert((await page.locator('.expenses-item-amount').textContent()).includes('30,10'))
  await page.getByRole('button',{name:/Excluir Café/}).click()
  await page.getByRole('button',{name:'Excluir gasto',exact:true}).click()
  await page.getByRole('dialog').waitFor({state:'detached'})
  await page.getByText('Nenhum gasto detalhado nesta data.',{exact:false}).waitFor()
  console.log(JSON.stringify({width,themes:2,create:true,category:true,edit:true,delete:true,overflow:false}))
 }
 assert.deepEqual(errors,[])
} finally {await browser.close();await server.close()}
