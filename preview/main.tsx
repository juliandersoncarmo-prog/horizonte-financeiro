import { useState, useSyncExternalStore } from 'react'
import { createRoot } from 'react-dom/client'
import Sidebar from '@/components/Sidebar'
import { ProjectionProvider, ProjectionLedger } from '@/components/ProjectionProvider'
import SettingsForm from '@/components/SettingsForm'
import { runProjection } from '@/lib/engine/projection'
import { read, reset, KEY } from './store'
import { refresh, usePathname } from './navigation'
import '../app/globals.css'
import './preview.css'
function subscribe(callback: () => void) { window.addEventListener('hf-demo-change', callback); return () => window.removeEventListener('hf-demo-change', callback) }
function Demo() {
useSyncExternalStore(subscribe, () => localStorage.getItem(KEY))
const [menu, setMenu] = useState(false)
const path = usePathname()
const input = read()
return <ProjectionProvider projection={runProjection(input)}><div className="demo-shell">
<header className="demo-banner"><button onClick={() => setMenu(!menu)}>☰ Menu</button><span><strong>Demonstração V2</strong> · Dados fictícios, salvos somente neste navegador. Sem banco ou login financeiro.</span><button onClick={() => { if (confirm('Restaurar os exemplos? As alterações desta demonstração serão apagadas.')) { reset(); refresh() } }}>Restaurar exemplos</button></header>
<div className="demo-body"><div className={'demo-sidebar ' + (menu ? 'open' : '')}><Sidebar profile={{ name: 'Conta demonstração', email: 'Dados fictícios · navegador', initials: 'DE' }} /></div><main className="flex-1 min-w-0 overflow-hidden">{path === '/configuracoes' ? <div className="p-6 max-w-xl"><h1 className="text-xl mb-4">Saldo inicial da demonstração</h1><SettingsForm saldoAtual={input.settings.saldo_abertura} dataAncora={input.settings.data_ancora} /><p className="mt-4 text-sm">Use apenas valores fictícios. Não há sincronização entre dispositivos.</p></div> : <ProjectionLedger />}</main></div></div></ProjectionProvider>
}
createRoot(document.getElementById('root')!).render(<Demo />)
