import { runProjection } from '@/lib/engine/projection'
import type { ProjectionInput } from '@/types'
import LedgerView from '@/components/LedgerView'

const INPUT: ProjectionInput = {
  settings: {
    saldo_abertura: 12454.33,
    data_ancora:    '2026-04-01',
  },
  recurringRules: [
    { id: '1', tipo: 'entrada', valor: 200,  descricao: 'Pix recebido',     categoria: 'Receitas',  frequencia: 'mensal', dia_do_mes: 5,  data_inicio: '2026-04-01', modo_termino: 'nunca', valor_termino: null },
    { id: '2', tipo: 'entrada', valor: 450,  descricao: 'Plantão',          categoria: 'Receitas',  frequencia: 'mensal', dia_do_mes: 10, data_inicio: '2026-04-01', modo_termino: 'nunca', valor_termino: null },
    { id: '3', tipo: 'entrada', valor: 1500, descricao: 'Salário',          categoria: 'Receitas',  frequencia: 'mensal', dia_do_mes: 25, data_inicio: '2026-04-01', modo_termino: 'nunca', valor_termino: null },
    { id: '4', tipo: 'saida',   valor: 850,  descricao: 'Cartão de crédito',categoria: 'Despesas',  frequencia: 'mensal', dia_do_mes: 8,  data_inicio: '2026-04-01', modo_termino: 'nunca', valor_termino: null },
    { id: '5', tipo: 'saida',   valor: 120,  descricao: 'Internet',         categoria: 'Moradia',   frequencia: 'mensal', dia_do_mes: 12, data_inicio: '2026-04-01', modo_termino: 'nunca', valor_termino: null },
    { id: '6', tipo: 'saida',   valor: 81,   descricao: 'MEI',              categoria: 'Negócios',  frequencia: 'mensal', dia_do_mes: 20, data_inicio: '2026-04-01', modo_termino: 'nunca', valor_termino: null },
    { id: '7', tipo: 'saida',   valor: 1200, descricao: 'Aluguel',          categoria: 'Moradia',   frequencia: 'mensal', dia_do_mes: 25, data_inicio: '2026-04-01', modo_termino: 'nunca', valor_termino: null },
  ],
  dailyBudgets: [
    { id: 'b1', mes_referencia: '2026-04', descricao: 'Gastos variáveis', categoria: 'Variável', valor_mensal: 2700    },
    { id: 'b2', mes_referencia: '2026-05', descricao: 'Gastos variáveis', categoria: 'Variável', valor_mensal: 2700    },
    { id: 'b3', mes_referencia: '2026-06', descricao: 'Gastos variáveis', categoria: 'Variável', valor_mensal: 2957.10 },
    { id: 'b4', mes_referencia: '2026-07', descricao: 'Gastos variáveis', categoria: 'Variável', valor_mensal: 2900.05 },
    { id: 'b5', mes_referencia: '2026-08', descricao: 'Gastos variáveis', categoria: 'Variável', valor_mensal: 2728    },
    { id: 'b6', mes_referencia: '2026-09', descricao: 'Gastos variáveis', categoria: 'Variável', valor_mensal: 2700    },
    { id: 'b7', mes_referencia: '2026-10', descricao: 'Gastos variáveis', categoria: 'Variável', valor_mensal: 2700    },
    { id: 'b8', mes_referencia: '2026-11', descricao: 'Gastos variáveis', categoria: 'Variável', valor_mensal: 2700    },
    { id: 'b9', mes_referencia: '2026-12', descricao: 'Gastos variáveis', categoria: 'Variável', valor_mensal: 2700    },
  ],
  horizonMonths: 9,
}

export default function HomePage() {
  const projection = runProjection(INPUT)
  return <LedgerView projection={projection} />
}
