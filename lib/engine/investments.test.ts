import { expect, it } from 'vitest'
import { runProjection } from './projection'
import { monthSummary } from './month-summary'
import type { ProjectionInput, RecurringRule } from '@/types'
const rule: RecurringRule={id:'r',tipo:'investimento',valor:120,descricao:'Aporte',categoria:'',frequencia:'mensal',dia_do_mes:5,data_inicio:'2026-09-01',modo_termino:'nunca',valor_termino:null}
const input:ProjectionInput={settings:{saldo_abertura:10000,data_ancora:'2026-09-01'},transactions:[],recurringRules:[],dailyBudgets:[],horizonMonths:4}
it('separates contributions, consumption, reconciled expenses and cards without double counting',()=>{
 const p=runProjection({...input,recurringRules:[rule],dailyBudgets:[{id:'b',mes_referencia:'2026-09',descricao:'Diário',categoria:'',valor_mensal:300}],transactions:[
 {id:'i',tipo:'investimento',valor:500,descricao:'CDB',categoria:'',data:'2026-09-05',incluido_diario:true},
 {id:'income',tipo:'entrada',valor:2000,descricao:'Renda',categoria:'',data:'2026-09-05'},
 {id:'out',tipo:'saida',valor:100,descricao:'Conta',categoria:'',data:'2026-09-05'},
 {id:'daily',tipo:'saida',valor:10,descricao:'Diário conciliado',categoria:'',data:'2026-09-05',incluido_diario:true}],cards:[{id:'c',nome:'Cartão',dia_vencimento:5,invoices:[{id:'f',mes_referencia:'2026-09',valor:200}]}]})
 const m=p.months[0],d=m.days[4]
 expect(m.totalEntradas).toBe(2000);expect(m.totalSaidas).toBe(600);expect(m.totalInvestimentos).toBe(620)
 expect(d.investmentSum).toBe(620);expect(d.outSum).toBe(300);expect(m.saldoFechamento).toBe(10780)
 expect(monthSummary(m)).toMatchObject({resultado:780,avulsas:100,cartoes:200,recorrentes:0})
})
it.each(['mensal','quinzenal','semanal'] as const)('monthly exception and cutoff cover all %s occurrences; preserve history, schedules and persistence',frequencia=>{
 const base={...input,recurringRules:[{...rule,frequencia}],transactions:[{id:'avulsa',tipo:'investimento' as const,valor:1,descricao:'Avulsa',categoria:'',data:'2026-10-05'}]}
 const original=runProjection(base)
 const month=runProjection({...base,recurringExceptions:[{rule_id:'r',mes_referencia:'2026-10'}]})
 expect(month.months[0]).toEqual(original.months[0]);expect(month.months[1].totalInvestimentos).toBe(1)
 expect(month.months[2].totalInvestimentos).toBe(original.months[2].totalInvestimentos)
 const cut={...base,recurringEndings:[{rule_id:'r',mes_inicio:'2026-10'}]}
 const ended=runProjection(cut);expect(ended.months[0]).toEqual(original.months[0]);expect(ended.months.slice(1).map(m=>m.totalInvestimentos)).toEqual([1,0,0])
 expect(runProjection(JSON.parse(JSON.stringify(cut)))).toEqual(ended)
 const edited=runProjection({...cut,recurringRules:[{...rule,frequencia,dia_do_mes:10,modo_termino:'data',valor_termino:'2027-12-31'}]})
 expect(edited.months.slice(1).map(m=>m.totalInvestimentos)).toEqual([1,0,0])
})
it.each(['entrada','saida'] as const)('cutoff preserves historic %s and ignores another rule',tipo=>{
 const base={...input,recurringRules:[{...rule,tipo},{...rule,id:'other',tipo}],recurringEndings:[{rule_id:'r',mes_inicio:'2026-10'}]}
 const p=runProjection(base);expect(p.months[0].days.flatMap(d=>d.events)).toHaveLength(2)
 expect(p.months.slice(1).map(m=>m.days.flatMap(d=>d.events).map(e=>e.ruleId))).toEqual([['other'],['other'],['other']])
})
it('editing and deletion of an investment change available balance only',()=>{
 const tx={id:'i',tipo:'investimento' as const,valor:500,descricao:'Aporte',categoria:'',data:'2026-09-05'}
 expect(runProjection({...input,transactions:[tx]}).months[0]).toMatchObject({saldoFechamento:9500,totalSaidas:0,totalInvestimentos:500})
 expect(runProjection({...input,transactions:[{...tx,valor:600,data:'2026-10-05'}]}).months.map(m=>m.totalInvestimentos)).toEqual([0,600,0,0])
 expect(runProjection(input).months[0].saldoFechamento).toBe(10000)
})

it('uses investment and cancellation fixture read in a separate database request',async()=>{
 const fixture=await import('../../scripts/fixtures/investment-persisted.json')
 const p=runProjection({...input,settings:{saldo_abertura:1000,data_ancora:'2099-09-01'},recurringRules:fixture.rules as RecurringRule[],recurringExceptions:fixture.exceptions,recurringEndings:fixture.endings})
 expect(p.months.map(m=>m.totalInvestimentos)).toEqual([50,0,0,0]);expect(p.months.map(m=>m.saldoFechamento)).toEqual([950,950,950,950])
})
