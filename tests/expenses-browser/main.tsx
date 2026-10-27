import { createRoot } from 'react-dom/client'
import DailyExpenses from '@/components/DailyExpenses'
import Sidebar from '@/components/Sidebar'
import '@/app/globals.css'
createRoot(document.getElementById('root')!).render(<div className="app-shell flex" style={{height:'100dvh',display:'flex',background:'var(--bg)'}}><Sidebar profile={{name:'Usuário de teste',email:'teste@example.invalid',initials:'UT'}}/><main className="app-main" style={{flex:1,minWidth:0,overflow:'auto'}}><DailyExpenses initialDate="2026-10-27"/></main></div>)
