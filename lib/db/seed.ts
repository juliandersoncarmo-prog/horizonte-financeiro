/**
 * Seed — dados do mockup para desenvolvimento
 * Execute manualmente após rodar as migrations:
 *   npx tsx lib/db/seed.ts
 */

export const SEED_USER_ID = '00000000-0000-0000-0000-000000000001'

export const seedSettings = {
  user_id:        SEED_USER_ID,
  saldo_abertura: '12454.33',
  data_ancora:    '2026-04-01',
}

export const seedRecurringRules = [
  {
    user_id:       SEED_USER_ID,
    tipo:          'entrada' as const,
    valor:         '200.00',
    descricao:     'Pix recebido',
    categoria:     'Receitas',
    frequencia:    'mensal' as const,
    dia_do_mes:    '5',
    data_inicio:   '2026-04-01',
    modo_termino:  'nunca' as const,
    valor_termino: null,
  },
  {
    user_id:       SEED_USER_ID,
    tipo:          'entrada' as const,
    valor:         '450.00',
    descricao:     'Plantão',
    categoria:     'Receitas',
    frequencia:    'mensal' as const,
    dia_do_mes:    '10',
    data_inicio:   '2026-04-01',
    modo_termino:  'nunca' as const,
    valor_termino: null,
  },
  {
    user_id:       SEED_USER_ID,
    tipo:          'entrada' as const,
    valor:         '1500.00',
    descricao:     'Salário',
    categoria:     'Receitas',
    frequencia:    'mensal' as const,
    dia_do_mes:    '25',
    data_inicio:   '2026-04-01',
    modo_termino:  'nunca' as const,
    valor_termino: null,
  },
  {
    user_id:       SEED_USER_ID,
    tipo:          'saida' as const,
    valor:         '850.00',
    descricao:     'Cartão de crédito',
    categoria:     'Despesas',
    frequencia:    'mensal' as const,
    dia_do_mes:    '8',
    data_inicio:   '2026-04-01',
    modo_termino:  'nunca' as const,
    valor_termino: null,
  },
  {
    user_id:       SEED_USER_ID,
    tipo:          'saida' as const,
    valor:         '120.00',
    descricao:     'Internet',
    categoria:     'Moradia',
    frequencia:    'mensal' as const,
    dia_do_mes:    '12',
    data_inicio:   '2026-04-01',
    modo_termino:  'nunca' as const,
    valor_termino: null,
  },
  {
    user_id:       SEED_USER_ID,
    tipo:          'saida' as const,
    valor:         '81.00',
    descricao:     'MEI',
    categoria:     'Negócios',
    frequencia:    'mensal' as const,
    dia_do_mes:    '20',
    data_inicio:   '2026-04-01',
    modo_termino:  'nunca' as const,
    valor_termino: null,
  },
  {
    user_id:       SEED_USER_ID,
    tipo:          'saida' as const,
    valor:         '1200.00',
    descricao:     'Aluguel',
    categoria:     'Moradia',
    frequencia:    'mensal' as const,
    dia_do_mes:    '25',
    data_inicio:   '2026-04-01',
    modo_termino:  'nunca' as const,
    valor_termino: null,
  },
]

export const seedDailyBudgets = [
  { user_id: SEED_USER_ID, mes_referencia: '2026-04', descricao: 'Gastos variáveis', categoria: 'Variável', valor_mensal: '2550.00' },
  { user_id: SEED_USER_ID, mes_referencia: '2026-05', descricao: 'Gastos variáveis', categoria: 'Variável', valor_mensal: '2800.00' },
  { user_id: SEED_USER_ID, mes_referencia: '2026-06', descricao: 'Gastos variáveis', categoria: 'Variável', valor_mensal: '2957.10' },
  { user_id: SEED_USER_ID, mes_referencia: '2026-07', descricao: 'Gastos variáveis', categoria: 'Variável', valor_mensal: '2900.05' },
  { user_id: SEED_USER_ID, mes_referencia: '2026-08', descricao: 'Gastos variáveis', categoria: 'Variável', valor_mensal: '2728.00' },
  { user_id: SEED_USER_ID, mes_referencia: '2026-09', descricao: 'Gastos variáveis', categoria: 'Variável', valor_mensal: '2700.00' },
]

console.log('Seed data exportado. Use com drizzle para inserir no banco.')
