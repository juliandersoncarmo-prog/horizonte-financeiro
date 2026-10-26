import { createRoot } from 'react-dom/client'
import DailyExpenses from '@/components/DailyExpenses'
import '@/app/globals.css'
createRoot(document.getElementById('root')!).render(<div style={{height:'100dvh',display:'flex',background:'var(--bg)'}}><DailyExpenses/></div>)
