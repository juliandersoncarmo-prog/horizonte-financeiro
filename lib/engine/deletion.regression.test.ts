import { expect, it } from 'vitest'
import { runProjection } from './projection'
import { monthSummary } from './month-summary'
import type { ProjectionInput } from '@/types'
const input: ProjectionInput={settings:{saldo_abertura:100,data_ancora:'2026-10-12'},todayISO:'2026-10-12',horizonMonths:2,dailyBudgets:[],transactions:[{id:'a',tipo:'saida',valor:10,descricao:'A',categoria:'',data:'2026-10-12'},{id:'b',tipo:'saida',valor:20,descricao:'B',categoria:'',data:'2026-10-13'}],recurringRules:[{id:'r',tipo:'entrada',valor:0.01,descricao:'Pequena',categoria:'',frequencia:'mensal',dia_do_mes:12,data_inicio:'2026-10-12',modo_termino:'nunca',valor_termino:null}]}
it('deletion recalculates today, next days and monthly summary without removing other records',()=>{
 const before=runProjection(input), after=runProjection({...input,transactions:input.transactions.filter(t=>t.id!=='a')})
 expect(before.months[0].days[0].saldo).toBe(90.01);expect(after.months[0].days[0].saldo).toBe(100.01)
 expect(after.months[0].totalSaidas).toBe(20);expect(after.months[1].saldoFechamento).toBe(80.02)
 expect(monthSummary(after.months[0]).avulsas).toBe(20)
 expect(after.months[0].days[1].events[0].id).toBe('b')
})
it('rule deletion removes all generated occurrences and preserves avulsas',()=>{
 const after=runProjection({...input,recurringRules:[]})
 expect(after.months[0].totalEntradas).toBe(0);expect(after.months[1].totalEntradas).toBe(0)
 expect(after.months[1].saldoFechamento).toBe(70);expect(after.months[0].totalSaidas).toBe(30)
})
it('card/invoice removal preserves unconnected expenses and recalculates summary',()=>{
 const card={id:'c',nome:'C',dia_vencimento:15,invoices:[{id:'i',mes_referencia:'2026-10',valor:5}]}
 const before=runProjection({...input,cards:[card]}), after=runProjection({...input,cards:[{...card,invoices:[]}]})
 expect(before.months[0].totalSaidas-after.months[0].totalSaidas).toBe(5)
 expect(after.months[0].saldoFechamento).toBe(70.01)
})
