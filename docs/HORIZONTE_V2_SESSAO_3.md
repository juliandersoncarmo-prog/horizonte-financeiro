# Horizonte Financeiro — Sessão 3: Diário inteligente

## Continuidade e proteção

Base remota verificada em 11/10/2026: `feat/horizonte-v2-motor` em `da57996ef7f900bf3fd51437c0789bdddc6033b7`. `main` e `backup/horizonte-v1-2026-10-11` em `e4ba912f14db49b98b3e9129c27670b7bf050d48`. Plano e relatório da Sessão 2 lidos; AGENTS.md e documentação instalada de Server Functions consultados.

Branch exclusiva: `feat/horizonte-v2-diario`. Nenhuma alteração na main, acesso ao banco real, aplicação de migração, seed, reset ou comando de deploy. Não foram implementados cartões nem Resumo Mensal. A versão original e a Sessão 2 permanecem recuperáveis.

## Regra do Diário

- Orçamentos sem competência (`mes_referencia` nulo/vazio) são globais e repetem nos meses futuros. Registros com competência são adicionais somente naquele mês. Descrições/categorias não identificam substituições; nenhum registro existente é convertido ou apagado. O gerenciador distingue global/competência, e novas inclusões continuam globais.
- Cálculo em centavos inteiros. Restos são distribuídos pelos primeiros dias elegíveis. Previsões nunca ficam negativas, inclusive quando o realizado excede o orçamento.
- Uma realização por usuário/data. Zero é valor informado; ausência é `null`. Realizado substitui previsão, nunca se soma a ela. Edição faz upsert; exclusão remove apenas a realização daquela data e volta à previsão recalculada.
- O mês é refeito cronologicamente desde o dia 1. Cada valor manual substitui a previsão vigente naquele ponto; a diferença é redistribuída entre os dias **posteriores àquela data**, sem realização manual. Dias sem registro assumem a previsão aplicável na sequência, inclusive se já passaram. Todos os valores manuais futuros/passados são preservados.
- Essa consolidação é calculada, não gravada como lançamento nem snapshot. O relógio muda somente o destaque de hoje: não faz previsões históricas voltarem ao divisor inicial. Editar retroativamente refaz as previsões posteriores, inclusive as assumidas em dias passados sem registro; isso concretiza a exigência de recálculo cronológico. Antes da data editada, as parcelas permanecem iguais.
- No último dia, ou sem dias posteriores elegíveis, a diferença permanece como economia/excesso no fechamento. Excesso maior que toda a provisão restante também permanece. Não redistribui para outro mês; apenas o saldo contínuo carrega a diferença.
- Exemplo: janeiro R$ 3.100, R$ 100 inicialmente por dia. Dia 1 realizado zero: 30 parcelas restantes repartem R$ 3.100. Dia 31 realizado zero, sem outras realizações: gasto mensal R$ 3.000 e R$ 100 a mais no saldo de fevereiro; orçamento de fevereiro continua R$ 3.100.
- Em abertura no meio do mês, a distribuição é calculada para o mês completo, mas somente dias desde a âncora afetam o saldo. Realizações anteriores podem influenciar as previsões restantes; nunca são descontadas novamente da abertura.

## Conciliação explícita e seus limites

Antes de implementar, foi apresentada a alternativa recomendada: marcação explícita “Incluída no total do Diário” para saídas avulsas e regras recorrentes. Não há associação por texto, categoria, data ou valor. Padrão `false` preserva a contabilização separada dos registros existentes.

Uma saída marcada permanece listada no modal, mas não integra novamente `outSum`, saldo ou total mensal: está declarada como contida no Diário. A coluna Saídas mostra saídas contabilizadas separadamente; a coluna Diário mostra a provisão/realização variável. Para regra recorrente, a marcação vale para TODAS as ocorrências da regra, inclusive passadas; não é uma associação de ocorrência isolada. O editor agora informa esse alcance.

**O total realizado do Diário deve conter os valores das saídas marcadas, mais demais gastos variáveis.** A marcação não cria nem soma realização automaticamente. Caso saídas marcadas superem o Diário, o modal mostra aviso para corrigir o total ou desmarcar saídas separadas. Essa inconsistência não é conciliada automaticamente: o motor respeita a declaração manual e a provisão; exige revisão do usuário. Não marcar faturas de cartão como incluídas. Gastos de cartão fora do Diário devem ser contabilizados pela fatura; não existe identificação de forma de pagamento nesta sessão. Não se pode detectar automaticamente gasto lançado duas vezes sem uma declaração de vínculo.

Limites adicionais: alterar orçamento global/regra recalcula também o histórico projetado; não há snapshots de regras antigas. Não há política de sobreposição por categoria entre orçamento global e mensal, que são aditivos. Esses limites são explícitos e não implicam conversão dos dados existentes.

## Interface

Mantidos `VISIBLE = 4`, breakpoints desktop/tablet/mobile, grade Data / seletor central / Saldo e as opções existentes Diário / Entradas / Saídas. Uma cifra por célula. Previsto usa `text-text-3`; realizado usa `text-text font-semibold`, inclusive zero. Tokens respeitam temas claro/escuro. Saldo usa o mesmo motor.

Modal da data conserva listagem, edição de avulsas/recorrentes e inclusão de entrada/saída. Acrescenta previsão vigente, realizado, diferença realizado menos previsto, salvar/excluir realizado e aviso de conciliação. Largura limitada à tela no mobile. Modal de orçamento usa número real de dias do mês atual (America/Fortaleza), rotula a média inicial e distingue competências. Nenhuma nova tela pública de teste foi mantida.

## Banco e habilitação de testes

Preparadas, **não aplicadas**:

- `migrations/003_diario_inteligente.sql`: tabela `daily_actuals`, unicidade usuário/data, numeric(15,2), limite não negativo, FK auth.users e RLS por proprietário; campos `incluido_diario` default false em transactions/recurring_rules, com constraint permitindo apenas saídas.
- `migrations/003_diario_inteligente_rollback.sql`: bloqueia exclusão do schema se houver realizações ou saídas marcadas. Exportar e conciliar primeiro; nunca descartar dados novos silenciosamente.
- Schema Drizzle atualizado como representação de tabelas/campos; usar a migração SQL revisada para as políticas/constraints/FK, não `db:push` indiscriminado.

Sem ambiente Supabase isolado fornecido, não houve validação SQL/RLS/autenticação real. Para validar depois: criar projeto separado, inventariar seu schema e policies existentes, aplicar migração uma vez (constraints/tabela não são idempotentes), usar somente fixtures e credenciais desse projeto. Configurar `DIARIO_INTELIGENTE_ENABLED=true` **no servidor de testes**, testar isolamento com dois usuários e operações de criar/editar/zerar/excluir.

Flag ausente/false: tabela nova não é consultada, salvar realizado e cadastrar saída marcada são bloqueados, permitindo executar sobre schema antigo. Não desligar a flag depois de existirem realizações: esconderia esses valores e alteraria o saldo. A flag protege a preparação do schema, não é rollback financeiro. Versão antiga lê tabelas existentes após migração aditiva, mas ignora realizações/marcações novas; voltar o código com dados novos exige conciliação prévia, exportação e restauração validada em testes. Nenhum procedimento no banco real é autorizado por este documento.

Server Action obtém usuário da sessão, valida data civil/valor (incluindo zero) e filtra exclusão por usuário/data. Falhas de leitura financeira deixam de virar listas vazias/saldos aparentes; falha na leitura do Diário interrompe a projeção. Falhas de escrita retornam erro e não anunciam sucesso. Reset existente inclui nova tabela quando habilitada e verifica erros; permanece sem transação entre tabelas, portanto não usar como ferramenta de migração.

## Verificação

- `npm test`: **58/58** (34 anteriores, 13 regressões Diário, 11 persistência simulada).
- `npx tsc --noEmit`: passou.
- `npm run lint`: passou.
- `npm run build`: passou com Turbopack, após copiar dependências locais para resolver limitação de symlink externo ao root.
- `git diff --check`: passou.
- Cenários: sem lançamento passado, zero, retroativo, edição/exclusão, valores futuros manuais preservados, centavos, fevereiro bissexto, orçamento global/mensal, fechamento/virada de mês, excesso, continuidade e avulsa/recorrente explicitamente incluídas. Relógio não altera parcelas históricas.
- Persistência simulada: ownership obtido da sessão, delete filtrado, datas inválidas, negativos/NaN/infinito/precisão/limite, flag, sessão ausente e erro do banco.
- Visual: código e breakpoints inspecionados. Tentativa local com fixtures sintéticas bloqueada por falha de inicialização Chromium/ANGLE no ambiente. **Não houve validação visual em navegador nem E2E autenticado.** A rota temporária foi removida antes do commit.
- Dependências/lockfile preservados; avisos informativos npm http-proxy e plugin vite-tsconfig-paths persistem.

## Sessão 4

Continuar desta branch, verificando HEAD remoto e este documento. Primeiro validar migração, RLS, fluxos do Diário e desktop/mobile no Supabase isolado. Não habilitar em produção antes disso. Faturas de cartão devem gerar uma única saída separada do Diário, com identidade usuário/cartão/competência e sem correspondência inventada com compras. Preservar registros existentes; conciliar faturas anteriores somente por ação explícita. Não implementar Resumo Mensal junto da Sessão 4. Antes de qualquer futuro deploy, conferir credenciais isoladas de previews e automações externas; nenhuma foi acionada manualmente aqui.
