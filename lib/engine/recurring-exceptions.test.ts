import persisted from '../../scripts/fixtures/recurring-persisted.json'
import { expect, it } from 'vitest'
import { runProjection } from './projection'
import { monthSummary } from './month-summary'
import type { ProjectionInput, RecurringRule } from '@/types'
const rule: RecurringRule = { id:'r', tipo:'saida', valor:1200, descricao:'Aluguel', categoria:'Casa', frequencia:'mensal', dia_do_mes:5, data_inicio:'2026-10-01', modo_termino:'nunca', valor_termino:null }
const input: ProjectionInput = { settings:{saldo_abertura:10000,data_ancora:'2026-10-01'}, recurringRules:[rule], transactions:[], dailyBudgets:[], horizonMonths:3 }
it.each(['entrada','saida'] as const)('cancels November %s and conserves adjacent events and summary', tipo=>{
 const base={...input,recurringRules:[{...rule,tipo}]}
 const cancelled={...base,recurringExceptions:[{rule_id:'r',mes_referencia:'2026-11'}]}
 const p=runProjection(cancelled), original=runProjection(base)
 expect(p.months[0]).toEqual(original.months[0])
 expect(p.months[1].days.flatMap(d=>d.events)).toHaveLength(0)
 expect(p.months[2].days.flatMap(d=>d.events)).toHaveLength(1)
 expect(p.months[1].saldoFechamento).toBe(p.months[0].saldoFechamento)
 expect(p.months[2].saldoFechamento).toBe(tipo==='saida'?7600:12400)
 expect(monthSummary(p.months[1]).recorrentes).toBe(0)
 expect(runProjection(JSON.parse(JSON.stringify(cancelled)))).toEqual(p)
})
it.each(['mensal','semanal','quinzenal','unico'] as const)('keeps %s cancellation after day and start/end/frequency edits', frequencia=>{
 const p=runProjection({...input,recurringRules:[{...rule,frequencia,dia_do_mes:10,data_inicio:'2026-11-03',modo_termino:'data',valor_termino:'2026-12-31'}],recurringExceptions:[{rule_id:'r',mes_referencia:'2026-11'}]})
 expect(p.months[1].days.flatMap(d=>d.events)).toHaveLength(0)
})
it('does not extend an occurrence-limited rule or cancel an unrelated rule',()=>{
 const p=runProjection({...input,recurringRules:[{...rule,modo_termino:'ocorrencias',valor_termino:'2'},{...rule,id:'other'}],recurringExceptions:[{rule_id:'r',mes_referencia:'2026-11'},{rule_id:'r',mes_referencia:'2026-11'}]})
 expect(p.months.map(m=>m.days.flatMap(d=>d.events).map(e=>e.ruleId))).toEqual([['r','other'],['other'],['other']])
})

it('recalculates the committed fixture read in a later DB request under RLS',()=> {
 const p=runProjection({...input, settings:{saldo_abertura:0,data_ancora:'2099-10-01'},recurringRules:persisted.rules as RecurringRule[],recurringExceptions:persisted.exceptions})
 expect(p.months.map(m=>m.totalEntradas)).toEqual([1200,0,1200])
 expect(p.months.map(m=>m.saldoFechamento)).toEqual([1200,1200,2400])
})
