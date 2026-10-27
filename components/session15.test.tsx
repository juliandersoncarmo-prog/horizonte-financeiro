// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import LoginPage from '@/app/(auth)/login/page'
import Sidebar from './Sidebar'
import LedgerView from './LedgerView'
import { ProjectionProvider } from './ProjectionProvider'
import { runProjection } from '@/lib/engine/projection'
const mock=vi.hoisted(()=>({password:vi.fn(),oauth:vi.fn()}))
vi.mock('@/lib/auth-request',async original=>({...await original<typeof import('@/lib/auth-request')>(),passwordSignIn:mock.password}))
vi.mock('@/lib/supabase/client',()=>({createClient:()=>({auth:{signInWithOAuth:mock.oauth}})}))
vi.mock('next/navigation',()=>({usePathname:()=> '/',useRouter:()=>({refresh:vi.fn()})}))
vi.mock('next/link',()=>({default:({children,prefetch,...props}:{children:React.ReactNode;prefetch?:boolean})=>{void prefetch;return <a {...props}>{children}</a>}}))
vi.mock('@/app/actions',()=>({signOut:vi.fn(),getAllDailyBudgets:vi.fn(),saveDailyActual:vi.fn(),getCategories:vi.fn()}))
vi.mock('./AddTransactionModal',()=>({default:({tipo}:{tipo:string})=><div role="dialog">Formulário {tipo}</div>}))
vi.stubGlobal('React',React);vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true)
let root:ReturnType<typeof createRoot>,host:HTMLDivElement
beforeEach(()=>{vi.clearAllMocks();host=document.createElement('div');document.body.append(host);root=createRoot(host)})
afterEach(async()=>{await act(()=>root.unmount());host.remove();vi.restoreAllMocks()})
async function render(node:React.ReactNode){await act(()=>root.render(node))}
async function submit(){await act(()=>document.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})))}
it('releases the busy state after exception and allows retry',async()=>{
 mock.password.mockRejectedValueOnce(new Error('Falha de conexão. Tente novamente.')).mockResolvedValue(undefined)
 const navigate=vi.spyOn(window.location,'assign').mockImplementation(()=>{})
 await render(<LoginPage/>);await submit();expect(document.querySelector('[role=alert]')?.textContent).toContain('Falha de conexão');expect(document.querySelector<HTMLButtonElement>('button[type=submit]')!.disabled).toBe(false)
 await submit();expect(mock.password).toHaveBeenCalledTimes(2);expect(navigate).toHaveBeenCalledWith('/')
})
it('blocks duplicate submits while the request is pending',async()=>{
 let finish!:()=>void;mock.password.mockImplementation(()=>new Promise<void>(resolve=>{finish=resolve}));vi.spyOn(window.location,'assign').mockImplementation(()=>{})
 await render(<LoginPage/>);await submit();await submit();expect(mock.password).toHaveBeenCalledTimes(1);expect(document.querySelector<HTMLButtonElement>('button[type=submit]')!.disabled).toBe(true);await act(()=>finish())
})
it('displays Google provider errors and keeps callback PKCE flow',async()=>{
 mock.oauth.mockResolvedValue({data:{url:null},error:{message:'disabled'}});await render(<LoginPage/>);await act(()=>[...host.querySelectorAll('button')].find(b=>b.textContent?.includes('Google'))!.click());expect(mock.oauth).toHaveBeenCalledWith({provider:'google',options:{redirectTo:window.location.origin+'/auth/callback',skipBrowserRedirect:true}});expect(document.querySelector('[role=alert]')?.textContent).toContain('login Google')
})
it('central plus presents both real entry actions and closes picker before opening form',async()=>{
 await render(<Sidebar profile={{name:'Test User',email:'user@example.invalid',initials:'TU'}}/>);
 expect(document.querySelector('.mobile-avatar')?.textContent).toBe('TU')
 await act(()=>host.querySelector<HTMLButtonElement>('[aria-label="Novo lançamento"]')!.click());expect(document.body.textContent).toContain('Nova entrada');expect(document.body.textContent).toContain('Nova saída');await act(()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Nova saída')!.click());expect(document.body.textContent).toContain('Formulário saida');expect(document.querySelector('[aria-label="Novo lançamento"][role=dialog]')).toBeNull()
})
const projection=runProjection({settings:{saldo_abertura:1000,data_ancora:'2026-10-01'},horizonMonths:5,recurringRules:[],transactions:[],dailyBudgets:[]})
it.each([320,375,390,430,768,1280])('preserves month count at %s px (DOM only)',async width=>{
 Object.defineProperty(window,'innerWidth',{value:width,configurable:true});await render(<ProjectionProvider projection={projection}><LedgerView projection={projection}/></ProjectionProvider>);expect(host.querySelectorAll('.month-card')).toHaveLength(width>=1024?4:width>=640?2:1);expect(host.querySelector('.mobile-month-select > span')?.textContent).toBe('Outubro de 2026')
})

it('keeps main destinations in order and settings/logout together in footer',async()=>{
 await render(<Sidebar/>)
 const nav=host.querySelector('.desktop-sidebar nav')!
 expect([...nav.querySelectorAll('a,button')].map(n=>n.textContent)).toEqual(['Visão Geral','Diário','Gastos do Diário','Cartões','Resumo Mensal','Novo lançamento'])
 expect(nav.querySelector('[href="/configuracoes"]')).toBeNull()
 const footer=host.querySelector('.sidebar-footer-actions')!
 expect(footer.querySelector('a')?.getAttribute('href')).toBe('/configuracoes')
 expect(footer.querySelector('button')?.getAttribute('type')).toBe('submit')
 const bottom=host.querySelector('.mobile-bottom-nav')!
 expect(bottom.children).toHaveLength(5)
 expect([...bottom.children].map(n=>n.textContent)).toEqual(['Início','Diário','','Gastos','Resumo'])
 expect(bottom.children[3].getAttribute('href')).toBe('/gastos-do-diario')
 await act(()=>[...nav.querySelectorAll('button')].find(b=>b.textContent==='Novo lançamento')!.click())
 expect([...document.querySelectorAll('.quick-launch-panel>button')].map(n=>n.textContent)).toEqual(['Nova entrada','Novo investimento','Nova saída','Gasto do Diário'])
 await act(()=>document.querySelector<HTMLButtonElement>('.mobile-new-investment')!.click())
 expect(document.body.textContent).toContain('Formulário investimento')
})

it.each(['/configuracoes','/gastos-do-diario','/'])('closes the mobile drawer on navigation to %s including footer links',async href=>{
 await render(<Sidebar/>)
 await act(()=>host.querySelector<HTMLButtonElement>('[aria-label="Abrir menu"]')!.click())
 const drawer=document.querySelector('.mobile-drawer')!
 expect(drawer).not.toBeNull()
 // Keep the test in this document; the actual link and href remain intact.
 const link=drawer.querySelector<HTMLAnchorElement>(`a[href="${href}"]`)!
 link.addEventListener('click',e=>e.preventDefault())
 await act(()=>link.click())
 expect(document.querySelector('.mobile-drawer')).toBeNull()
 expect(host.querySelector('.desktop-sidebar')).not.toBeNull()
})
