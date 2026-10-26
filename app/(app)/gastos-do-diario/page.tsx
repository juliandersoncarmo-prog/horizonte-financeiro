import DailyExpenses from '@/components/DailyExpenses'
export default function ExpensesPage() {
 if(process.env.GASTOS_DIARIO_ENABLED!=='true' || process.env.DIARIO_INTELIGENTE_ENABLED!=='true') return <div className="p-6 text-text">Gastos do Diário ainda não está disponível nesta versão.</div>
 const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Fortaleza'}).format(new Date())
 return <DailyExpenses initialDate={today} />
}
