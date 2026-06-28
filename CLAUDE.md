
# CLAUDE.md — Horizonte Financeiro

## Visão do produto
App web pessoal de planejamento financeiro que responde: **"Quanto dinheiro terei em cada dia futuro?"**
O saldo é contínuo e nunca reinicia entre meses.

## Stack
- Next.js 15+ (App Router) + TypeScript
- Tailwind CSS
- Drizzle ORM + Supabase (PostgreSQL)
- Supabase Auth + Row Level Security
- Vitest para testes do motor de projeção
- Vercel para deploy

## Estrutura de pastas (alvo)
horizonte-financeiro/

├── app/                    # App Router (páginas e layouts)

├── components/             # Componentes React reutilizáveis

├── lib/

│   ├── engine/             # Motor de projeção (TypeScript puro, testável)

│   ├── db/                 # Schema Drizzle + queries

│   └── supabase/           # Clients Supabase (server e browser)

├── types/                  # Tipos TypeScript globais

└── CLAUDE.md
## Modelo de dados
- **settings**: saldo_abertura (decimal), data_ancora (date), user_id
- **transactions**: tipo (entrada|saida), valor, descricao, categoria, data, recorrente (bool), user_id
- **recurring_rules**: tipo, valor, descricao, categoria, frequencia (mensal|quinzenal|semanal|unico), dia_do_mes, data_inicio, modo_termino (nunca|horizonte|ocorrencias|data), valor_termino, user_id
- **daily_budgets**: mes_referencia (YYYY-MM), descricao, categoria, valor_mensal, user_id

## Motor de projeção (lib/engine/)
Regra central: iterar dia a dia de data_ancora até o horizonte.
Para cada dia:
1. saldo -= (valor_mensal_do_diario ÷ dias_no_mes)  — gasto variável
2. saldo += soma das entradas recorrentes com vencimento naquele dia
3. saldo -= soma das saídas recorrentes com vencimento naquele dia
O saldo NUNCA reinicia. Carrega entre meses continuamente.

## Cores de saldo (regra do produto)
| Faixa de saldo | Classe de cor |
|---|---|
| ≥ R$ 2.000 | verde escuro (--green) |
| R$ 500 a R$ 1.999 | verde claro (--green-light) |
| R$ 100 a R$ 499 | amarelo (--yellow) |
| R$ -250 a R$ 99 | laranja (--orange) |
| < R$ -250 | vermelho (--red) |

## Identidade visual (tokens do mockup)
### Tema claro
- bg: #F4F6F9 | surface: #FFFFFF | surface-2: #FBFCFE | surface-3: #F0F3F8
- border: #E7EBF1 | border-strong: #D8DEE8
- text: #19233A | text-2: #5B6678 | text-3: #9AA4B5
- accent: #2F57E6 | accent-strong: #1E3FC4 | accent-soft: #EAF0FF
- green: #1B7A43 | green-soft: #E8F5ED
- green-light: #2E9E5B | green-light-soft: #D4F0DF
- yellow: #9A6212 | yellow-soft: #FBF2DF
- orange: #C2410C | orange-soft: #FBEEE4
- red: #C32626 | red-soft: #FBEAEA
### Tema escuro (data-theme="dark")
- bg: #0C1322 | surface: #141D30 | surface-2: #19233A | surface-3: #1F2B45
- accent: #5C7CFF | green: #54D38A | yellow: #E9B454 | orange: #F08A4B | red: #F26B6B

## Comandos úteis
```bash
npm run dev          # dev server
npm run build        # build de produção
npm run lint         # ESLint
npm run test         # Vitest (motor de projeção)
npx drizzle-kit generate   # gerar migrations
npx drizzle-kit migrate    # rodar migrations
```

## Convenções de código
- Sempre TypeScript estrito (strict: true no tsconfig)
- Componentes em PascalCase, funções utilitárias em camelCase
- Queries ao banco sempre via Drizzle ORM, nunca SQL raw desnecessário
- Autenticação via Supabase Auth — nunca armazenar tokens manualmente
- RLS ativo em todas as tabelas: user_id = auth.uid()
- Formatação de moeda: sempre pt-BR, BRL (toLocaleString)
- Datas: sempre tratadas como UTC internamente, exibidas em pt-BR
