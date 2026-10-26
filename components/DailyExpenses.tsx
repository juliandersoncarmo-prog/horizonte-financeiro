'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, ChevronLeft, ChevronRight, Pencil, Plus, Trash2, X } from 'lucide-react'
import { createExpenseCategory, loadExpenseMonth, removeExpense, saveExpense } from '@/app/expense-actions'
import { expenseSummary, validExpenseDate } from '@/lib/daily-expenses'
import type { DailyExpense, ExpenseInput, ExpenseMonth } from '@/lib/daily-expenses'
import { formatBRL } from '@/lib/engine/projection'
import ModalPortal from './ModalPortal'
import { useOptionalProjection } from './ProjectionProvider'

const todayLocal=()=>new Intl.DateTimeFormat('sv-SE').format(new Date())
const dateLabel=(date:string)=>new Date(date+'T12:00:00Z').toLocaleDateString('pt-BR',{timeZone:'UTC',day:'2-digit',month:'long',year:'numeric'})
export default function DailyExpenses({ initialDate }: { initialDate?: string }) {
 const router=useRouter()
 const projection=useOptionalProjection()
 const revision=JSON.stringify([projection?.inputSnapshot?.dailyActuals,projection?.inputSnapshot?.dailyBudgets])
 const [selected,setSelected]=useState(()=>initialDate??todayLocal())
 const month=selected.slice(0,7)
 const [data,setData]=useState<ExpenseMonth|null>(null)
 const [loading,setLoading]=useState(true), [error,setError]=useState(''),[notice,setNotice]=useState('')
 const [form,setForm]=useState<ExpenseInput|null>(null),[deleting,setDeleting]=useState<DailyExpense|null>(null)
 const [busy,setBusy]=useState(false),[formError,setFormError]=useState(''),[reconcile,setReconcile]=useState(false),[uncertain,setUncertain]=useState(false)
 const [value,setValue]=useState(''),[categoryName,setCategoryName]=useState(''),[newCategory,setNewCategory]=useState(false)
 const [categories,setCategories]=useState<ExpenseMonth['categories']>([])
 const request=useRef(0),lock=useRef(false)
 const reload=useCallback(async()=>{
  const id=++request.current; setLoading(true);setError('')
  try {
   const result=await loadExpenseMonth(month)
   if(id!==request.current) return
   if(result.success) {setData(result.data);setCategories(result.data.categories)} else {setData(null);setError(result.error)}
  } catch {if(id===request.current) {setData(null);setError('Falha ao carregar. Tente novamente.')}}
  finally {if(id===request.current) setLoading(false)}
 },[month])
 useEffect(()=>{let active=true;queueMicrotask(()=>{if(active)setSelected(todayLocal())});return()=>{active=false}},[])
 useEffect(()=>{let active=true;const pending=request;queueMicrotask(()=>{if(active)void reload()});return()=>{active=false;pending.current++}},[reload,revision])
 function changeMonth(delta:number) {
  const date=new Date(month+'-01T12:00:00Z');date.setUTCMonth(date.getUTCMonth()+delta)
  const next=date.toISOString().slice(0,10);if(validExpenseDate(next)) setSelected(next)
 }
 function open(item?:DailyExpense,date=todayLocal()) {
  setForm(item?{id:item.id,description:item.description,amount:item.amount,category_id:item.category_id,expense_date:item.expense_date,expected:item.updated_at}:{id:crypto.randomUUID(),description:'',amount:0,category_id:null,expense_date:date})
  setValue(item?item.amount.toFixed(2).replace('.',','):'');setFormError('');setReconcile(false);setUncertain(false);setNewCategory(false);setCategoryName('')
 }
 function close() {if(!lock.current) {setForm(null);setDeleting(null)}}
 async function save() {
  if(!form || lock.current) return
  const amount=Number(value.replace(',','.'))
  if(!value.trim() || !Number.isFinite(amount) || amount<=0) {setFormError('Informe um valor positivo.');return}
  lock.current=true;setBusy(true);setFormError('')
  try {
   const result=await saveExpense({...form,amount})
   if(!result.success) {setFormError(result.error??'Não foi possível salvar.');setReconcile(!!result.reconcile);return}
   setForm(null);setNotice('Gasto salvo. Diário e projeção atualizados.');await reload();router.refresh()
  } catch {setFormError('A confirmação não chegou. Confira o histórico antes de repetir a operação.');setUncertain(true)}
  finally {lock.current=false;setBusy(false)}
 }
 async function confirmDelete() {
  if(!deleting || lock.current) return
  lock.current=true;setBusy(true);setFormError('')
  try {
   const result=await removeExpense(deleting.id,deleting.updated_at)
   if(!result.success) {setFormError(result.error??'Não foi possível excluir.');return}
   setDeleting(null);setNotice('Gasto excluído. Diário e projeção atualizados.');await reload();router.refresh()
  } catch {setFormError('A confirmação não chegou. Recarregue o histórico para conferir.');setUncertain(true)}
  finally {lock.current=false;setBusy(false)}
 }
 async function addCategory() {
  if(lock.current) return
  lock.current=true;setBusy(true);setFormError('')
  try {
   const result=await createExpenseCategory(categoryName)
   if(result.success && result.category) {const cat=result.category;setCategories(items=>[...items,cat].sort((a,b)=>a.name.localeCompare(b.name)));setForm(current=>current?{...current,category_id:cat.id}:null);setNewCategory(false);setCategoryName('')}
   else setFormError(result.error??'Não foi possível criar a categoria.')
  } catch {setFormError('Falha de comunicação ao criar categoria.')}
  finally {lock.current=false;setBusy(false)}
 }
 const summary=data?expenseSummary(month,data):null
 const dayIndex=Number(selected.slice(8))-1, day=summary?.schedule[dayIndex]
 const items=data?.expenses.filter(e=>e.expense_date===selected)??[]
 const adjustment=data?.days.find(d=>d.expense_date===selected)?.manual_adjustment
 const legacy=data?.days.find(d=>d.expense_date===selected)?.legacy_actual
 const confirmed=day?.realizado??null
 const available=day?Math.round((day.previsto-(confirmed??0))*100)/100:0
 const count=summary?.schedule.length??new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5)),0)).getUTCDate()
 const offset=new Date(month+'-01T12:00:00Z').getUTCDay()
 const categoryLabel=(id:string|null)=>categories.find(c=>c.id===id)?.name??'Sem categoria'
 return <div className="daily-expenses-page" aria-busy={loading}>
  <header className="expenses-heading"><div><h1>Gastos do Diário</h1><p>Suas despesas, integradas ao Diário Inteligente.</p></div><button className="expenses-primary" onClick={()=>open()} disabled={loading || !data}><Plus size={18}/>Novo gasto</button></header>
  <div className="expenses-month-nav"><button aria-label="Mês anterior" onClick={()=>changeMonth(-1)}><ChevronLeft size={20}/></button><label><span className="sr-only">Mês do histórico</span><input type="month" min="1900-01" max="9999-12" value={month} onChange={e=>{if(validExpenseDate(e.target.value+'-01'))setSelected(e.target.value+'-01')}}/></label><button aria-label="Próximo mês" onClick={()=>changeMonth(1)}><ChevronRight size={20}/></button><button onClick={()=>setSelected(todayLocal())}>Hoje</button></div>
  {notice && <p role="status" className="expenses-notice">{notice}</p>}
  {loading?<p role="status" className="expenses-panel">Carregando histórico…</p>:error?<div role="alert" className="expenses-panel"><p>{error}</p><button className="expenses-primary" onClick={()=>void reload()}>Tentar novamente</button></div>:data && summary && day && <>
   <section className="expenses-panel" aria-label="Resumo do dia"><h2>{dateLabel(selected)}</h2><div className="expenses-kpis">
    <div><span>Orçamento do dia</span><strong>{formatBRL(day.previsto)}</strong></div>
    <div><span>Realizado confirmado</span><strong>{confirmed===null?'—':formatBRL(confirmed)}</strong><small>{confirmed===null?'Sem realizado confirmado':`${items.length} gasto(s) detalhado(s)`}</small></div>
    <div className={available<0?'expenses-over':'expenses-available'}><span>{available<0?'Excesso':'Disponível'}</span><strong>{formatBRL(Math.abs(available))}</strong></div>
   </div><p className="expenses-help">Os valores futuros são redistribuídos pelo Diário Inteligente. O disponível é orçamento de consumo, não saldo bancário.</p></section>
   <div className="expenses-columns"><section className="expenses-panel expenses-calendar" aria-label="Calendário mensal"><h2><CalendarDays size={19}/>Calendário de gastos</h2><div className="expenses-calendar-grid">
    {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((name,i)=><span className="expenses-weekday" key={i}>{name}</span>)}
    {Array.from({length:offset},(_,i)=><span key={'blank'+i}/>)}
    {Array.from({length:count},(_,i)=>{const date=month+'-'+String(i+1).padStart(2,'0');const hasItems=(summary.byDate[date]??0)>0;const actual=summary.schedule[i].realizado;return <button key={date} className={selected===date?'selected':''} aria-pressed={selected===date} aria-current={date===todayLocal()?'date':undefined} aria-label={`${dateLabel(date)}${hasItems?', com gastos':''}${actual===null?'':', realizado confirmado'}`} onClick={()=>setSelected(date)}><span>{i+1}</span><small aria-hidden="true">{hasItems?'●':actual!==null?'○':' '}</small></button>})}
   </div><p className="expenses-help">● Gastos detalhados · ○ Total manual</p></section>
   <section className="expenses-panel expenses-history" aria-label="Histórico diário"><div className="expenses-section-heading"><h2>Despesas de {selected.slice(8)}/{selected.slice(5,7)}</h2><button className="expenses-secondary" onClick={()=>open(undefined,selected)}><Plus size={16}/>Adicionar neste dia</button></div>
    {adjustment!==null && adjustment!==undefined && <p className="expenses-adjustment">Ajuste manual preservado: <strong>{formatBRL(adjustment)}</strong>. O realizado inclui esse ajuste e os itens abaixo. O editor do Diário altera somente o ajuste restante.</p>}
    {!data.days.some(d=>d.expense_date===selected) && confirmed!==null && <p className="expenses-adjustment">Há um total manual de {formatBRL(confirmed)} neste dia. Ao detalhar, escolha como conciliar esse valor.</p>}
    {legacy!==null && legacy!==undefined && <p className="expenses-help">Total manual anterior à conciliação: {formatBRL(legacy)} (referência histórica).</p>}
    {items.length===0?<p className="expenses-empty">Nenhum gasto detalhado nesta data. Use “Adicionar neste dia” para começar.</p>:<ul className="expenses-list">{items.map(item=><li key={item.id}><div className="expenses-item-copy"><strong>{item.description}</strong><small>{categoryLabel(item.category_id)}</small></div><span className="expenses-item-amount">{formatBRL(item.amount)}</span><div className="expenses-item-actions"><button aria-label={`Editar ${item.description}`} onClick={()=>open(item)}><Pencil size={17}/></button><button aria-label={`Excluir ${item.description}`} onClick={()=>{setDeleting(item);setFormError('');setUncertain(false)}}><Trash2 size={17}/></button></div></li>)}</ul>}
    <div className="expenses-day-total"><span>Total detalhado do dia</span><strong>{formatBRL((summary.byDate[selected]??0)/100)}</strong></div>
   </section></div>
   <section className="expenses-panel" aria-label="Resumo mensal"><h2>Resumo do mês</h2><div className="expenses-kpis"><div><span>Total detalhado</span><strong>{formatBRL(summary.totalCents/100)}</strong></div><div><span>Realizado + ajustes manuais</span><strong>{formatBRL(summary.actualCents/100)}</strong></div><div><span>Orçamento mensal planejado</span><strong>{formatBRL(summary.plannedCents/100)}</strong></div></div>
   <p className="expenses-help">Nas datas confirmadas: previsto {formatBRL(summary.schedule.reduce((s,d)=>s+(d.realizado===null?0:Math.round(d.previsto*100)),0)/100)} · realizado {formatBRL(summary.actualCents/100)}. Os dias sem confirmação continuam como previsão.</p>
   <h3>Gastos detalhados por categoria</h3>{Object.keys(summary.byCategory).length===0?<p className="expenses-help">Nenhum gasto detalhado neste mês.</p>:<ul className="expenses-categories">{Object.entries(summary.byCategory).sort((a,b)=>b[1]-a[1]).map(([id,cents])=><li key={id}><span>{categoryLabel(id||null)}</span><strong>{formatBRL(cents/100)}</strong></li>)}</ul>}</section>
  </>}
  {form && <ModalPortal label={form.expected?'Editar gasto':'Novo gasto do Diário'} onClose={close}><form className="expenses-form" onSubmit={e=>{e.preventDefault();void save()}}><div className="expenses-section-heading"><h2>{form.expected?'Editar gasto':'Novo gasto do Diário'}</h2><button type="button" disabled={busy} aria-label="Fechar cadastro" onClick={close}><X size={22}/></button></div>
   <fieldset disabled={busy || uncertain}><label>Descrição<input data-hf-initial-focus="true" maxLength={200} required value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
   <label>Valor (R$)<input inputMode="decimal" autoComplete="off" required value={value} onChange={e=>setValue(e.target.value)} placeholder="0,00"/></label>
   <label>Data<input type="date" required min="1900-01-01" max="9999-12-31" value={form.expense_date} onChange={e=>{setForm({...form,expense_date:e.target.value,reconcile:undefined});setReconcile(false)}}/></label>
   <label>Categoria<select aria-label="Categoria" value={form.category_id??''} onChange={e=>setForm({...form,category_id:e.target.value||null})}><option value="">Sem categoria</option>{categories.map(cat=><option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></label>
   {!newCategory?<button className="expenses-secondary" type="button" onClick={()=>setNewCategory(true)}><Plus size={16}/>Criar categoria</button>:<div className="expenses-new-category"><label>Nome da categoria<input maxLength={60} value={categoryName} onChange={e=>setCategoryName(e.target.value)}/></label><button type="button" className="expenses-secondary" onClick={()=>void addCategory()}>Criar</button></div>}
   {reconcile && <fieldset className="expenses-reconcile"><legend>Conciliar total manual anterior</legend><p>Se as compras já fazem parte do total anterior, substitua-o. Se são gastos adicionais, preserve-o como ajuste. O valor anterior fica registrado para consulta.</p><label><input type="radio" name="reconcile" checked={form.reconcile==='preserve'} onChange={()=>setForm({...form,reconcile:'preserve'})}/>Preservar total anterior como ajuste e somar os itens</label><label><input type="radio" name="reconcile" checked={form.reconcile==='replace'} onChange={()=>setForm({...form,reconcile:'replace'})}/>Usar somente os itens detalhados</label></fieldset>}
   </fieldset>{formError && <p role="alert" className="expenses-error">{formError}</p>}<div className="expenses-form-actions"><button className="expenses-secondary" type="button" disabled={busy} onClick={close}>Cancelar</button><button className="expenses-primary" disabled={busy || uncertain || (reconcile&&!form.reconcile)}>{busy?'Salvando…':'Salvar gasto'}</button></div></form></ModalPortal>}
  {deleting && <ModalPortal label="Excluir gasto" onClose={close}><div className="expenses-form"><h2>Excluir gasto?</h2><p>Excluir “{deleting.description}” ({formatBRL(deleting.amount)})? O realizado do dia e os dias futuros serão recalculados.</p>{formError && <p role="alert" className="expenses-error">{formError}</p>}<div className="expenses-form-actions"><button className="expenses-secondary" disabled={busy} onClick={close}>Cancelar</button><button className="expenses-primary" disabled={busy || uncertain} onClick={()=>void confirmDelete()}>{busy?'Excluindo…':'Excluir gasto'}</button></div></div></ModalPortal>}
 </div>
}
