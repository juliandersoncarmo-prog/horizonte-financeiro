import { it } from 'vitest'
import { performance } from 'node:perf_hooks'
import { runProjection } from '../lib/engine/projection'
import type { ProjectionInput } from '../types'
it('measures deterministic 73-month projection without database', () => {
  const input: ProjectionInput = {
    settings: { saldo_abertura: 10000, data_ancora: '2026-01-01' }, horizonMonths: 73, todayISO: '2026-10-12',
    recurringRules: Array.from({length:100}, (_, i) => ({id:String(i),tipo:'entrada',valor:0.01,descricao:'Fixture',categoria:'',frequencia:'mensal',dia_do_mes:i%31+1,data_inicio:'2024-01-01',modo_termino:i%2?'nunca':'ocorrencias',valor_termino:i%2?null:'90'})),
    transactions: Array.from({length:2000}, (_, i) => ({id:String(i),tipo:'saida',valor:1,descricao:'Fixture',categoria:'',data:`2026-${String(i%12+1).padStart(2,'0')}-${String(i%28+1).padStart(2,'0')}`})), dailyBudgets:[],
  }
  runProjection(input)
  const samples = Array.from({length:7},()=>{const t=performance.now();runProjection(input);return performance.now()-t}).sort((a,b)=>a-b)
  process.stdout.write(JSON.stringify({fixture:'100 rules, 2000 transactions, 73 months',median_ms:samples[3],min_ms:samples[0],max_ms:samples[6]}))
})
