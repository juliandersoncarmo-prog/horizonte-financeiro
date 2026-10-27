'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, ChevronLeft, ChevronRight, Pencil, Plus, Trash2, X } from 'lucide-react'
import { createExpenseCategory, loadExpenseMonth, removeExpense, saveExpense } from '@/app/expense-actions'
import { categoryBudgets, categoryTone, expenseSummary, shiftExpenseDate, validExpenseDate } from '@/lib/daily-expenses'
import type { DailyExpense, ExpenseInput, ExpenseMonth, Reconciliation } from '@/lib/daily-expenses'
import { formatBRL } from '@/lib/engine/projection'
import ModalPortal from './ModalPortal'
import { useOptionalProjection } from './ProjectionProvider'

const todayLocal=()=>new Intl.DateTimeFormat('sv-SE').format(new Date())
const dateLabel=(date:string)=>new Date(date+'T12:00:00Z').toLocaleDateString('pt-BR',{timeZone:'UTC',day:'2-digit',month:'long',year:'numeric'})
export default function DailyExpenses({ initialDate, quickAdd=false, onQuickClose }: { initialDate?: string; quickAdd?: boolean; onQuickClose?: () => void }) {
 const router=useRouter()
 const projection=useOptionalProjection()
 const revision=JSON.stringify([projection?.inputSnapshot?.dailyActuals,projection?.inputSnapshot?.dailyBudgets])
 const [selected,setSelected]=useState(()=>initialDate??todayLocal())
 const month=selected.slice(0,7)
 const [data,setData]=useState<ExpenseMonth|null>(null)
 const [loading,setLoading]=useState(true), [error,setError]=useState(''),[notice,setNotice]=useState('')
 const [form,setForm]=useState<ExpenseInput|null>(null),[deleting,setDeleting]=useState<DailyExpense|null>(null)
 const [busy,setBusy]=useState(false),[formError,setFormError]=useState(''),[reconcile,setReconcile]=useState<Reconciliation|null>(null),[uncertain,setUncertain]=useState(false)
 const [value,setValue]=useState(''),[categoryName,setCategoryName]=useState(''),[newCategory,setNewCategory]=useState(false)
 const [categories,setCategories]=useState<ExpenseMonth['categories']>([])
 const request=useRef(0),lock=useRef(false)
 // Component-local memory is discarded on logout/unmount; never shared between users.
 const cache=useRef(new Map<string,{data:ExpenseMonth;at:number}>())
 const pending=useRef(new Map<string,ReturnType<typeof loadExpenseMonth>>())
 const generation=useRef(0)
 const getMonth=useCallback((key:string)=>{
  const hit=cache.current.get(key)
  if(hit && Date.now()-hit.at<30000) return Promise.resolve({success:true as const,data:hit.data})
  const existing=pending.current.get(key);if(existing)return existing
  const epoch=generation.current
  const promise=loadExpenseMonth(key).then(result=>{
   if(result.success && epoch===generation.current) {
    cache.current.set(key,{data:result.data,at:Date.now()})
    if(cache.current.size>6)cache.current.delete(cache.current.keys().next().value!)
   }
   return result
  }).finally(()=>{if(pending.current.get(key)===promise)pending.current.delete(key)})
  pending.current.set(key,promise);return promise
 },[])
 const invalidate=useCallback(()=>{generation.current++;cache.current.clear();pending.current.clear()},[])
 const reload=useCallback(async(fresh=false)=>{
  if(fresh)invalidate()
  const id=++request.current;setLoading(true);setError('')
  try {
   const result=await getMonth(month)
   if(id!==request.current)return
   if(result.success) {
    setData(result.data);setCategories(result.data.categories)
    // Prefetch after foreground reads settle, without cascading prefetches.
    for(const delta of [-1,1]) {
     const date=new Date(month+'-01T12:00:00Z');date.setUTCMonth(date.getUTCMonth()+delta)
     const adjacent=date.toISOString().slice(0,7)
     if(validExpenseDate(adjacent+'-01'))void getMonth(adjacent).catch(()=>{})
    }
   } else {setData(null);setError(result.error)}
  } catch {if(id===request.current){setData(null);setError('Falha ao carregar. Tente novamente.')}}
  finally {if(id===request.current)setLoading(false)}
 },[month,getMonth,invalidate])
 useEffect(()=>{if(!initialDate)queueMicrotask(()=>setSelected(todayLocal()))},[initialDate])
 useEffect(()=>{invalidate()},[revision,invalidate])
 useEffect(()=>{let active=true;const pendingRequest=request;queueMicrotask(()=>{if(active)void reload()});return()=>{active=false;pendingRequest.current++}},[reload,revision])
 useEffect(()=>{
  const refresh=()=>{if(document.visibilityState!=='hidden')void reload(true)}
  const receive=(e:StorageEvent)=>{if(e.key==='hf-expenses-revision')refresh()}
  window.addEventListener('focus',refresh);window.addEventListener('storage',receive)
  const timer=window.setInterval(refresh,30000)
  return()=>{window.removeEventListener('focus',refresh);window.removeEventListener('storage',receive);window.clearInterval(timer)}
 },[reload])
 useEffect(()=>{
  function keydown(event:KeyboardEvent) {
   if(quickAdd || form || deleting || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || document.querySelector('[role="dialog"]'))return
   const target=event.target instanceof Element?event.target:null
   if(target?.closest('input,textarea,select,button,a,[contenteditable]:not([contenteditable="false"]),[role="slider"],[role="combobox"],[role="listbox"],[role="menu"],[role="tablist"]'))return
   if(event.key==='ArrowLeft'||event.key==='ArrowRight') {event.preventDefault();setSelected(date=>shiftExpenseDate(date,event.key==='ArrowLeft'?-1:1))}
  }
  document.addEventListener('keydown',keydown);return()=>document.removeEventListener('keydown',keydown)
 },[quickAdd,form,deleting])
 function notifyChange(){try{localStorage.setItem('hf-expenses-revision',crypto.randomUUID())}catch{}}
 function changeMonth(delta:number) {
  const date=new Date(month+'-01T12:00:00Z');date.setUTCMonth(date.getUTCMonth()+delta)
  const next=date.toISOString().slice(0,10);if(validExpenseDate(next)) setSelected(next)
 }
 function open(item?:DailyExpense,date=todayLocal()) {
  setForm(item?{id:item.id,description:item.description,amount:item.amount,category_id:item.category_id,expense_date:item.expense_date,expected:item.updated_at}:{id:crypto.randomUUID(),description:'',amount:0,category_id:null,expense_date:date})
  setValue(item?item.amount.toFixed(2).replace('.',','):'');setFormError('');setReconcile(null);setUncertain(false);setNewCategory(false);setCategoryName('')
 }
 function close() {if(!lock.current) {setForm(null);setDeleting(null);onQuickClose?.()}}
 useEffect(()=>{if(quickAdd)queueMicrotask(()=>open())},[quickAdd])
 async function save(choice?: 'included'|'additional') {
  if(!form || lock.current) return
  const amount=Number(value.replace(',','.'))
  if(!value.trim() || !Number.isFinite(amount) || amount<=0) {setFormError('Informe um valor positivo.');return}
  lock.current=true;setBusy(true);setFormError('')
  try {
   const result=await saveExpense({...form,amount,reconcile:choice,reconciliation:reconcile??undefined})
   if(!result.success) {setFormError(result.error??'Não foi possível salvar.');setReconcile(result.reconcile?result.reconciliation??null:null);return}
   setForm(null);setReconcile(null);setNotice('Gasto salvo.');notifyChange();await reload(true);router.refresh();onQuickClose?.()
  } catch {setFormError('A confirmação não chegou. Confira o histórico antes de repetir a operação.');setUncertain(true)}
  finally {lock.current=false;setBusy(false)}
 }
 async function confirmDelete() {
  if(!deleting || lock.current) return
  lock.current=true;setBusy(true);setFormError('')
  try {
   const result=await removeExpense(deleting.id,deleting.updated_at)
   if(!result.success) {setFormError(result.error??'Não foi possível excluir.');return}
   setDeleting(null);setNotice('Gasto excluído.');notifyChange();await reload(true);router.refresh()
  } catch {setFormError('A confirmação não chegou. Recarregue o histórico para conferir.');setUncertain(true)}
  finally {lock.current=false;setBusy(false)}
 }
 async function addCategory() {
  if(lock.current) return
  lock.current=true;setBusy(true);setFormError('')
  try {
   const result=await createExpenseCategory(categoryName)
   if(result.success && result.category) {const cat=result.category;invalidate();notifyChange();setCategories(items=>[...items,cat].sort((a,b)=>a.name.localeCompare(b.name)));setForm(current=>current?{...current,category_id:cat.id}:null);setNewCategory(false);setCategoryName('')}
   else setFormError(result.error??'Não foi possível criar a categoria.')
  } catch {setFormError('Falha de comunicação ao criar categoria.')}
  finally {lock.current=false;setBusy(false)}
 }
 const summary=useMemo(()=>data?expenseSummary(month,data):null,[month,data])
 const limits=useMemo(()=>data?categoryBudgets(data):{},[data])
 const dayIndex=Number(selected.slice(8))-1, day=summary?.schedule[dayIndex]
 const items=data?.expenses.filter(e=>e.expense_date===selected)??[]
 const adjustment=data?.days.find(d=>d.expense_date===selected)?.manual_adjustment
 const confirmed=day?.realizado??null
 const available=day?Math.round((day.previsto-(confirmed??0))*100)/100:0
 const count=summary?.schedule.length??new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5)),0)).getUTCDate()
 const offset=new Date(month+'-01T12:00:00Z').getUTCDay()
 const categoryLabel=(id:string|null)=>categories.find(c=>c.id===id)?.name??'Sem categoria'
 return <div className="daily-expenses-page" aria-busy={loading} style={quickAdd?{display:'contents'}:undefined}>
  {!quickAdd && <>
  <header className="expenses-heading"><div><h1>Gastos do Diário</h1><p>Suas despesas, integradas ao Diário Inteligente.</p></div><button className="expenses-primary" onClick={()=>open()} disabled={loading || !data}><Plus size={18}/>Novo gasto</button></header>
  <div className="expenses-month-nav"><button aria-label="Mês anterior" onClick={()=>changeMonth(-1)}><ChevronLeft size={20}/></button><label><span className="sr-only">Mês do histórico</span><input type="month" min="1900-01" max="9999-12" value={month} onChange={e=>{if(validExpenseDate(e.target.value+'-01'))setSelected(e.target.value+'-01')}}/></label><button aria-label="Próximo mês" onClick={()=>changeMonth(1)}><ChevronRight size={20}/></button><button onClick={()=>setSelected(todayLocal())}>Hoje</button></div>
  {notice && <p role="status" className="expenses-notice">{notice}</p>}
  {loading?<p role="status" className="expenses-panel">Carregando histórico…</p>:error?<div role="alert" className="expenses-panel"><p>{error}</p><button className="expenses-primary" onClick={()=>void reload(true)}>Tentar novamente</button></div>:data && summary && day && <>
   <section className="expenses-panel" aria-label="Resumo do dia"><h2>{dateLabel(selected)}</h2><div className="expenses-kpis">
    <div><span>Orçamento do dia</span><strong>{formatBRL(day.previsto)}</strong></div>
    <div><span>Realizado confirmado</span><strong>{confirmed===null?'—':formatBRL(confirmed)}</strong><small>{confirmed===null?'Sem realizado confirmado':`${items.length} gasto(s) detalhado(s)`}</small></div>
    <div className={available<0?'expenses-over':'expenses-available'}><span>{available<0?'Excesso':'Disponível'}</span><strong>{formatBRL(Math.abs(available))}</strong></div>
   </div></section>
   <div className="expenses-columns"><section className="expenses-panel expenses-calendar" aria-label="Calendário mensal"><h2><CalendarDays size={19}/>Calendário de gastos</h2><div className="expenses-calendar-grid">
    {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((name,i)=><span className="expenses-weekday" key={i}>{name}</span>)}
    {Array.from({length:offset},(_,i)=><span key={'blank'+i}/>)}
    {Array.from({length:count},(_,i)=>{const date=month+'-'+String(i+1).padStart(2,'0');const hasItems=(summary.byDate[date]??0)>0;const actual=summary.schedule[i].realizado;return <button key={date} className={selected===date?'selected':''} aria-pressed={selected===date} aria-current={date===todayLocal()?'date':undefined} aria-label={`${dateLabel(date)}${hasItems?', com gastos':''}${actual===null?'':', realizado confirmado'}`} onClick={()=>setSelected(date)}><span>{i+1}</span><small aria-hidden="true">{hasItems?'●':actual!==null?'○':' '}</small></button>})}
   </div><p className="expenses-help">● Gastos detalhados · ○ Total manual</p></section>
   <section className="expenses-panel expenses-history" aria-label="Histórico diário"><div className="expenses-section-heading"><h2>Despesas de {selected.slice(8)}/{selected.slice(5,7)}</h2><button className="expenses-secondary" onClick={()=>open(undefined,selected)}><Plus size={16}/>Adicionar neste dia</button></div>
    {(adjustment??(!data.days.some(d=>d.expense_date===selected)?confirmed:0)??0)>0 && <div className="expenses-adjustment"><p>Gastos detalhados: <strong>{formatBRL((summary.byDate[selected]??0)/100)}</strong></p><p>Outros gastos informados: <strong>{formatBRL(adjustment??confirmed??0)}</strong></p><p>Total realizado: <strong>{formatBRL(confirmed??0)}</strong></p></div>}
    {items.length===0?<p className="expenses-empty">Nenhum gasto detalhado nesta data. Use “Adicionar neste dia” para começar.</p>:<ul className="expenses-list">{items.map(item=><li key={item.id}><div className="expenses-item-copy"><strong>{item.description}</strong><small className={`expense-category-tag ${categoryTone(item.category_id)}`}>{categoryLabel(item.category_id)}</small></div><span className="expenses-item-amount">{formatBRL(item.amount)}</span><div className="expenses-item-actions"><button aria-label={`Editar ${item.description}`} onClick={()=>open(item)}><Pencil size={17}/></button><button aria-label={`Excluir ${item.description}`} onClick={()=>{setDeleting(item);setFormError('');setUncertain(false)}}><Trash2 size={17}/></button></div></li>)}</ul>}
    <div className="expenses-day-total"><span>Total detalhado do dia</span><strong>{formatBRL((summary.byDate[selected]??0)/100)}</strong></div>
   </section></div>
   <section className="expenses-panel" aria-label="Resumo mensal"><h2>Resumo do mês</h2><div className="expenses-kpis"><div><span>Total detalhado</span><strong>{formatBRL(summary.totalCents/100)}</strong></div><div><span>Total realizado</span><strong>{formatBRL(summary.actualCents/100)}</strong></div><div><span>Orçamento mensal planejado</span><strong>{formatBRL(summary.plannedCents/100)}</strong></div></div>
   <h3>Gastos por categoria</h3>{Object.keys({...summary.byCategory,...limits}).length===0?<p className="expenses-help">Nenhum gasto detalhado neste mês.</p>:<ul className="expenses-categories">{Object.keys({...summary.byCategory,...limits}).sort((a,b)=>(summary.byCategory[b]??0)-(summary.byCategory[a]??0)).map(id=>{const spent=summary.byCategory[id]??0,limit=limits[id];return <li key={id}><div><span className={`expense-category-tag ${categoryTone(id||null)}`}>{categoryLabel(id||null)}</span>{limit!==undefined&&<small className={spent>limit?'expenses-limit-over':'expenses-help'}>{spent>limit?`Ultrapassou ${formatBRL((spent-limit)/100)}`:`Restam ${formatBRL((limit-spent)/100)}`}</small>}</div><div><strong>{formatBRL(spent/100)}</strong>{limit!==undefined&&<small className="expenses-help">de {formatBRL(limit/100)}</small>}</div></li>})}</ul>}</section>
  </>}
  </>}
  {form && !reconcile && <ModalPortal label={form.expected?'Editar gasto':'Novo gasto do Diário'} onClose={close}><form className="expenses-form" onSubmit={e=>{e.preventDefault();void save()}}><div className="expenses-section-heading"><h2>{form.expected?'Editar gasto':'Novo gasto do Diário'}</h2><button type="button" disabled={busy} aria-label="Fechar cadastro" onClick={close}><X size={22}/></button></div>
   <fieldset disabled={busy || uncertain || !!reconcile}><label>Descrição<input data-hf-initial-focus="true" maxLength={200} required value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
   <label>Valor (R$)<input inputMode="decimal" autoComplete="off" required value={value} onChange={e=>setValue(e.target.value)} placeholder="0,00"/></label>
   <label>Data<input type="date" required min="1900-01-01" max="9999-12-31" value={form.expense_date} onChange={e=>{setForm({...form,expense_date:e.target.value,reconcile:undefined});setReconcile(null)}}/></label>
   <label>Categoria<select aria-label="Categoria" value={form.category_id??''} onChange={e=>setForm({...form,category_id:e.target.value||null})}><option value="">Sem categoria</option>{categories.map(cat=><option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></label>
   {!newCategory?<button className="expenses-secondary" type="button" onClick={()=>setNewCategory(true)}><Plus size={16}/>Criar categoria</button>:<div className="expenses-new-category"><label>Nome da categoria<input maxLength={60} value={categoryName} onChange={e=>setCategoryName(e.target.value)}/></label><button type="button" className="expenses-secondary" onClick={()=>void addCategory()}>Criar</button></div>}
   </fieldset>{formError && <p role="alert" className="expenses-error">{formError}</p>}<div className="expenses-form-actions"><button className="expenses-secondary" type="button" disabled={busy} onClick={close}>Cancelar</button><button className="expenses-primary" disabled={busy || uncertain || !!reconcile}>{busy?'Salvando…':'Salvar gasto'}</button></div></form></ModalPortal>}
  {form && reconcile && <ModalPortal label="Confirmar gasto do Diário" onClose={()=>{if(!busy)setReconcile(null)}}><div className="expenses-form"><h2>Este gasto já foi informado?</h2><p>Você já informou {formatBRL(reconcile.total)} como gasto total neste dia. {form.expected && form.expense_date===data?.expenses.find(e=>e.id===form.id)?.expense_date?'O acréscimo':'O novo gasto'} de {formatBRL(reconcile.delta)} já está incluído nesse valor?</p><div className="expenses-confirm-options"><button className="expenses-secondary" disabled={busy||reconcile.delta>reconcile.remaining} onClick={()=>void save('included')}><span>Sim, já está incluído</span><strong>Total: {formatBRL(reconcile.total)}</strong></button>{reconcile.delta>reconcile.remaining&&<p className="expenses-help">Restam {formatBRL(reconcile.remaining)} sem detalhar. Este gasto ultrapassa o total informado; confirme o valor adicional ou ajuste o lançamento.</p>}<button className="expenses-primary" disabled={busy} onClick={()=>void save('additional')}><span>Não, é um gasto adicional</span><strong>Total: {formatBRL(reconcile.total+reconcile.delta)}</strong></button></div>{formError&&<p role="alert" className="expenses-error">{formError}</p>}<button className="expenses-secondary" disabled={busy} onClick={()=>setReconcile(null)}>Voltar ao gasto</button></div></ModalPortal>}
  {deleting && <ModalPortal label="Excluir gasto" onClose={close}><div className="expenses-form"><h2>Excluir gasto?</h2><p>Excluir “{deleting.description}” ({formatBRL(deleting.amount)})? O realizado do dia e os dias futuros serão recalculados.</p>{formError && <p role="alert" className="expenses-error">{formError}</p>}<div className="expenses-form-actions"><button className="expenses-secondary" disabled={busy} onClick={close}>Cancelar</button><button className="expenses-primary" disabled={busy || uncertain} onClick={()=>void confirmDelete()}>{busy?'Excluindo…':'Excluir gasto'}</button></div></div></ModalPortal>}
 </div>
}
