'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, ChevronLeft, ChevronRight, Pencil, Plus, Trash2, X } from 'lucide-react'
import { createExpenseCategory, loadExpenseMonth, removeExpense, saveExpense } from '@/app/expense-actions'
import { categoryBudgets, categoryTone, expenseSummary, shiftExpenseDate, validExpenseDate } from '@/lib/daily-expenses'
import type { DailyExpense, ExpenseInput, ExpenseMonth, BudgetAlert, Reconciliation } from '@/lib/daily-expenses'
import { formatBRL } from '@/lib/engine/projection'
import ModalPortal from './ModalPortal'
import ExpenseActionMenu from './ExpenseActionMenu'
import { useOptionalProjection } from './ProjectionProvider'
import { useExpenseMonthCache } from './ExpenseCacheProvider'

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
 const [budgetAlert,setBudgetAlert]=useState<BudgetAlert|null>(null)
 const [categories,setCategories]=useState<ExpenseMonth['categories']>([])
 const request=useRef(0),lock=useRef(false)
 const cache=useExpenseMonthCache()
 const displayedMonth=useRef('')
 const getMonth=useCallback((key:string)=>cache.get(key,loadExpenseMonth),[cache])
 const invalidate=useCallback((keys?:string[])=>cache.invalidate(keys),[cache])
 const reload=useCallback(async(fresh=false)=>{
  if(fresh)invalidate([month])
  const id=++request.current;const hit=cache.peek(month)
  if(hit){setData(hit.data);setCategories(hit.data.categories);displayedMonth.current=month}
  else if(displayedMonth.current!==month)setData(null)
  setLoading(!hit && displayedMonth.current!==month);setError('')
  try {
   const result=await getMonth(month)
   if(id!==request.current)return
   if(result.success) {
    setData(result.data);setCategories(result.data.categories);displayedMonth.current=month
    // Prefetch after foreground reads settle, without cascading prefetches.
    for(const delta of [-1,1]) {
     const date=new Date(month+'-01T12:00:00Z');date.setUTCMonth(date.getUTCMonth()+delta)
     const adjacent=date.toISOString().slice(0,7)
     if(validExpenseDate(adjacent+'-01'))void getMonth(adjacent).catch(()=>{})
    }
   } else {setError(result.error)}
  } catch {if(id===request.current){setError('Falha ao carregar. Tente novamente.')}}
  finally {if(id===request.current)setLoading(false)}
 },[month,getMonth,invalidate,cache])
 useEffect(()=>{if(!initialDate)queueMicrotask(()=>setSelected(todayLocal()))},[initialDate])
 useEffect(()=>{
  if(cache.revision!==undefined && cache.revision!==revision) {
   const [oldActuals,oldBudgets]=JSON.parse(cache.revision)
   const [actuals,budgets]=JSON.parse(revision)
   if(JSON.stringify(oldBudgets)!==JSON.stringify(budgets))invalidate()
   else {
    const before=new Map((oldActuals??[]).map((a:{data:string;valor:number})=>[a.data,a.valor]))
    const after=new Map((actuals??[]).map((a:{data:string;valor:number})=>[a.data,a.valor]))
    const changed=[...new Set([...before.keys(),...after.keys()])].filter(date=>before.get(date)!==after.get(date)) as string[]
    for(const key of new Set(changed.map(date=>date.slice(0,7)))) {
     const entry=cache.peek(key)
     const current=(actuals??[]).filter((a:{data:string})=>a.data.startsWith(key))
     if(entry && JSON.stringify([...entry.data.actuals].sort((a,b)=>a.data.localeCompare(b.data)))!==JSON.stringify(current.sort((a:{data:string},b:{data:string})=>a.data.localeCompare(b.data))))invalidate([key])
    }
   }
  }
  cache.setRevision(revision)
 },[revision,invalidate,cache])
 useEffect(()=>{let active=true;const pendingRequest=request;queueMicrotask(()=>{if(active)void reload()});return()=>{active=false;pendingRequest.current++}},[reload,revision])
 useEffect(()=>{
  const refresh=()=>{if(document.visibilityState!=='hidden' && !lock.current)void reload()}
  const receive=(e:StorageEvent)=>{if(e.key==='hf-expenses-revision'){invalidate();refresh()}}
  window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);window.addEventListener('storage',receive)
  const timer=window.setInterval(refresh,60000)
  return()=>{window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);window.removeEventListener('storage',receive);window.clearInterval(timer)}
 },[reload,invalidate])
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
   setForm(null);setReconcile(null);setNotice('Gasto salvo.');notifyChange();invalidate([...new Set([form.expense_date.slice(0,7),data?.expenses.find(e=>e.id===form.id)?.expense_date.slice(0,7)??month])]);await reload();router.refresh();if(result.budgetAlert)setBudgetAlert(result.budgetAlert);else onQuickClose?.()
  } catch {setFormError('A confirmação não chegou. Confira o histórico antes de repetir a operação.');setUncertain(true)}
  finally {lock.current=false;setBusy(false)}
 }
 async function confirmDelete() {
  if(!deleting || lock.current) return
  lock.current=true;setBusy(true);setFormError('')
  try {
   const result=await removeExpense(deleting.id,deleting.updated_at)
   if(!result.success) {setFormError(result.error??'Não foi possível excluir.');return}
   setDeleting(null);setNotice('Gasto excluído.');notifyChange();invalidate([deleting.expense_date.slice(0,7)]);await reload();router.refresh()
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
  <header className="expenses-heading"><div><h1>Gastos do Diário</h1><p>Suas despesas, integradas ao Diário Inteligente.</p></div>
  <div className="expenses-month-nav"><button aria-label="Mês anterior" onClick={()=>changeMonth(-1)}><ChevronLeft size={20}/></button><label className="expenses-month-picker"><span aria-hidden="true">{new Date(month+'-01T12:00:00Z').toLocaleDateString('pt-BR',{month:'long',year:'numeric',timeZone:'UTC'})}</span><span className="sr-only">Mês do histórico</span><input type="month" min="1900-01" max="9999-12" value={month} onChange={e=>{if(validExpenseDate(e.target.value+'-01'))setSelected(e.target.value+'-01')}}/></label><button aria-label="Próximo mês" onClick={()=>changeMonth(1)}><ChevronRight size={20}/></button></div><button className="expenses-primary" onClick={()=>open()} disabled={loading || !data}><Plus size={18}/>Registrar gasto</button></header>
  {notice && <p role="status" className="expenses-notice">{notice}</p>}
  {error && data && <div role="alert" className="expenses-panel expenses-error"><p>{error}</p><button className="expenses-secondary" onClick={()=>void reload(true)}>Tentar novamente</button></div>}
  {loading?<p role="status" className="expenses-panel">Carregando histórico…</p>:error&&!data?<div role="alert" className="expenses-panel"><p>{error}</p><button className="expenses-primary" onClick={()=>void reload(true)}>Tentar novamente</button></div>:data && summary && day && <>
   <section className="expenses-panel" aria-label="Resumo do dia"><h2>{dateLabel(selected)}</h2><div className="expenses-kpis">
    <div><span>Orçamento do dia</span><strong>{formatBRL(day.previsto)}</strong></div>
    <div><span>Gasto no dia</span><strong>{confirmed===null?'—':formatBRL(confirmed)}</strong><small>{confirmed===null?'Nenhum valor informado':`${items.length} gasto(s) registrado(s)`}</small></div>
    <div className={available<0?'expenses-over':'expenses-available'}><span>Saldo do Diário</span><strong>{formatBRL(available)}</strong></div>
   </div><BudgetProgress spent={confirmed??0} budget={day.previsto} label="Orçamento diário consumido"/></section>
   <div className="expenses-columns"><section className="expenses-panel expenses-calendar" aria-label="Calendário mensal"><h2><CalendarDays size={19}/>Calendário de gastos</h2><div className="expenses-calendar-grid">
    {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((name,i)=><span className="expenses-weekday" key={i}>{name}</span>)}
    {Array.from({length:offset},(_,i)=><span key={'blank'+i}/>)}
    {Array.from({length:count},(_,i)=>{const date=month+'-'+String(i+1).padStart(2,'0');const hasItems=(summary.byDate[date]??0)>0;const actual=summary.schedule[i].realizado;return <button key={date} className={selected===date?'selected':''} aria-pressed={selected===date} aria-current={date===todayLocal()?'date':undefined} aria-label={`${dateLabel(date)}${hasItems?', com gastos':''}${actual===null?'':', com valor informado'}`} onClick={()=>setSelected(date)}><span>{i+1}</span><small aria-hidden="true">{hasItems?'●':actual!==null?'○':' '}</small></button>})}
   </div><p className="expenses-help">● Gastos registrados · ○ Total manual</p></section>
   <section className="expenses-panel expenses-history" aria-label="Histórico diário"><div className="expenses-section-heading"><h2>Despesas de {selected.slice(8)}/{selected.slice(5,7)}</h2><button className="expenses-secondary" onClick={()=>open(undefined,selected)}><Plus size={16}/>Registrar gasto</button></div>
    {(adjustment??(!data.days.some(d=>d.expense_date===selected)?confirmed:0)??0)>0 && <div className="expenses-adjustment"><p>Gastos registrados: <strong>{formatBRL((summary.byDate[selected]??0)/100)}</strong></p><p>Outros gastos informados: <strong>{formatBRL(adjustment??confirmed??0)}</strong></p><p>Total gasto: <strong>{formatBRL(confirmed??0)}</strong></p></div>}
    {items.length===0?<p className="expenses-empty">Nenhum gasto registrado neste dia.</p>:<ul className="expenses-list">{items.map(item=><li key={item.id}><div className="expenses-item-copy"><strong>{item.description}</strong><small className={`expense-category-tag ${categoryTone(item.category_id)}`}>{categoryLabel(item.category_id)}</small></div><span className="expenses-item-amount">{formatBRL(item.amount)}</span><div className="expenses-item-actions"><button aria-label={`Editar ${item.description}`} onClick={()=>open(item)}><Pencil size={17}/></button><button aria-label={`Excluir ${item.description}`} onClick={()=>{setDeleting(item);setFormError('');setUncertain(false)}}><Trash2 size={17}/></button></div><ExpenseActionMenu description={item.description} onEdit={()=>open(item)} onDelete={()=>{setDeleting(item);setFormError('');setUncertain(false)}}/></li>)}</ul>}
    <div className="expenses-day-total"><span>Total gasto no dia</span><strong>{formatBRL((summary.byDate[selected]??0)/100)}</strong></div>
   </section></div>
   <section className="expenses-panel" aria-label="Resumo mensal"><h2>Resumo do mês</h2><div className="expenses-kpis"><div><span>Gastos registrados</span><strong>{formatBRL(summary.totalCents/100)}</strong></div>{summary.actualCents!==summary.totalCents&&<div><span>Total gasto</span><strong>{formatBRL(summary.actualCents/100)}</strong><small>Inclui valores informados sem registro individual</small></div>}<div><span>Orçamento mensal</span><strong>{formatBRL(summary.plannedCents/100)}</strong></div></div>
   <h3>Gastos por categoria</h3>{Object.keys({...summary.byCategory,...limits}).length===0?<p className="expenses-help">Nenhum gasto registrado neste mês.</p>:<ul className="expenses-categories">{Object.keys({...summary.byCategory,...limits}).sort((a,b)=>(summary.byCategory[b]??0)-(summary.byCategory[a]??0)).map(id=>{const spent=summary.byCategory[id]??0,limit=limits[id];return <li key={id}><div className="expenses-category-head"><span className={`expense-category-tag ${categoryTone(id||null)}`}>{categoryLabel(id||null)}</span></div><div className="expenses-category-values"><strong>{formatBRL(spent/100)}</strong><span>{limit!==undefined?`de ${formatBRL(limit/100)}`:'Sem orçamento definido'}</span></div>{limit!==undefined&&<BudgetProgress spent={spent/100} budget={limit/100} label={`Orçamento de ${categoryLabel(id||null)} consumido`} category/>}</li>})}</ul>}</section>
  </>}
  </>}
  {budgetAlert && <ModalPortal label="Orçamento ultrapassado" onClose={()=>{setBudgetAlert(null);onQuickClose?.()}}><div className="expenses-form expenses-budget-alert"><h2>Orçamento ultrapassado</h2><p>Você ultrapassou em {formatBRL(budgetAlert.exceeded)} o orçamento previsto para {budgetAlert.category} neste mês.</p><dl><div><dt>Orçamento previsto</dt><dd>{formatBRL(budgetAlert.budget)}</dd></div><div><dt>Total gasto na categoria</dt><dd>{formatBRL(budgetAlert.spent)}</dd></div><div><dt>Valor excedido</dt><dd>{formatBRL(budgetAlert.exceeded)}</dd></div></dl><div className="expenses-form-actions"><button className="expenses-primary" onClick={()=>{setBudgetAlert(null);onQuickClose?.()}}>Entendi</button></div></div></ModalPortal>}
  {form && !reconcile && <ModalPortal label={form.expected?'Editar gasto':'Registrar gasto'} onClose={close}><form className="expenses-form" onSubmit={e=>{e.preventDefault();void save()}}><div className="expenses-section-heading"><h2>{form.expected?'Editar gasto':'Registrar gasto'}</h2><button type="button" disabled={busy} aria-label="Fechar cadastro" onClick={close}><X size={22}/></button></div>
   <fieldset disabled={busy || uncertain || !!reconcile}><label>Descrição<input data-hf-initial-focus="true" maxLength={200} required value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
   <label>Valor (R$)<input inputMode="decimal" autoComplete="off" required value={value} onChange={e=>setValue(e.target.value)} placeholder="0,00"/></label>
   <label>Data<input type="date" required min="1900-01-01" max="9999-12-31" value={form.expense_date} onChange={e=>{setForm({...form,expense_date:e.target.value,reconcile:undefined});setReconcile(null)}}/></label>
   <label>Categoria<select aria-label="Categoria" value={form.category_id??''} onChange={e=>setForm({...form,category_id:e.target.value||null})}><option value="">Sem categoria</option>{categories.map(cat=><option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></label>
   {!newCategory?<button className="expenses-secondary" type="button" onClick={()=>setNewCategory(true)}><Plus size={16}/>Criar categoria</button>:<div className="expenses-new-category"><label>Nome da categoria<input maxLength={60} value={categoryName} onChange={e=>setCategoryName(e.target.value)}/></label><button type="button" className="expenses-secondary" onClick={()=>void addCategory()}>Criar</button></div>}
   </fieldset>{formError && <p role="alert" className="expenses-error">{formError}</p>}<div className="expenses-form-actions"><button className="expenses-secondary" type="button" disabled={busy} onClick={close}>Cancelar</button><button className="expenses-primary" disabled={busy || uncertain || !!reconcile}>{busy?'Salvando…':'Salvar gasto'}</button></div></form></ModalPortal>}
  {form && reconcile && <ModalPortal label="Confirmar gasto do Diário" onClose={()=>{if(!busy)setReconcile(null)}}><div className="expenses-form"><h2>Este gasto já foi informado?</h2><p>Você já informou {formatBRL(reconcile.total)} como gasto total neste dia. {form.expected && form.expense_date===data?.expenses.find(e=>e.id===form.id)?.expense_date?'O acréscimo':'O novo gasto'} de {formatBRL(reconcile.delta)} já está incluído nesse valor?</p><div className="expenses-confirm-options"><button className="expenses-secondary" disabled={busy||reconcile.delta>reconcile.remaining} onClick={()=>void save('included')}><span>Sim, já está incluído</span><strong>Total: {formatBRL(reconcile.total)}</strong></button>{reconcile.delta>reconcile.remaining&&<p className="expenses-help">Restam {formatBRL(reconcile.remaining)} sem detalhar. Este gasto ultrapassa o total informado; confirme o valor adicional ou ajuste o lançamento.</p>}<button className="expenses-primary" disabled={busy} onClick={()=>void save('additional')}><span>Não, é um gasto adicional</span><strong>Total: {formatBRL(reconcile.total+reconcile.delta)}</strong></button></div>{formError&&<p role="alert" className="expenses-error">{formError}</p>}<button className="expenses-secondary" disabled={busy} onClick={()=>setReconcile(null)}>Voltar ao gasto</button></div></ModalPortal>}
  {deleting && <ModalPortal label="Excluir gasto" onClose={close}><div className="expenses-form"><h2>Excluir gasto?</h2><p className="expenses-delete-copy">Deseja excluir <strong>{deleting.description}</strong> — {formatBRL(deleting.amount)}? O Diário será atualizado automaticamente.</p>{formError && <p role="alert" className="expenses-error">{formError}</p>}<div className="expenses-form-actions"><button className="expenses-secondary" disabled={busy} onClick={close}>Cancelar</button><button className="expenses-danger" disabled={busy || uncertain} onClick={()=>void confirmDelete()}>{busy?'Excluindo…':'Excluir'}</button></div></div></ModalPortal>}
 </div>
}

function BudgetProgress({spent,budget,label,category=false}:{spent:number;budget:number;label:string;category?:boolean}) {
 const over=spent>budget, percent=budget>0?Math.max(0,spent/budget*100):0
 return <div className={`expenses-progress ${over?'is-over':''}`}>
  <div className="expenses-progress-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100,Math.round(percent))} aria-valuetext={budget>0?`${Math.round(percent)}% consumido${over?`, excedido em ${formatBRL(spent-budget)}`:''}`:'Sem orçamento disponível'}><span style={{width:`${Math.min(100,percent)}%`}}/>{over&&<i/>}</div>
  <p>{budget>0?`${Math.round(percent)}% do orçamento`: 'Sem orçamento disponível'}<span>{over?`${formatBRL(spent-budget)} excedidos`:category?`${formatBRL(budget-spent)} restantes`:''}</span></p>
 </div>
}
