# Horizonte Financeiro — Sessão 4: cartões de crédito

## Continuidade e proteção

GitHub verificado em 11/10/2026 (America/Fortaleza). Base da Sessão 3: `feat/horizonte-v2-diario`, `ac4c2a35f7c3f3038fc150a499b7ef3cba402f5b`; árvore `d453a8d31bb54faf373caebac671f792a2186a78`. `main` e `backup/horizonte-v1-2026-10-11` estavam em `e4ba912f14db49b98b3e9129c27670b7bf050d48`. Nova branch: `feat/horizonte-v2-cartoes`, criada do SHA verificado. Plano, relatórios 2/3, AGENTS.md e guias instalados Next.js de Server Functions/revalidatePath lidos.

Nenhum acesso ao Supabase real, aplicação de migração, seed, reset, deploy, merge ou alteração de main. Não foi implementado Resumo Mensal. Não houve migração/associação automática de dados antigos.

## Diário: revisão da preparação

`003_diario_inteligente.sql` permanece preparada e não aplicada: unicidade usuário/data, valor não negativo limitado, FK de usuário, RLS com USING/WITH CHECK de proprietário, campos `incluido_diario` default false e checks restringindo marcação a saídas. Seu rollback bloqueia descarte enquanto existirem realizações/marcações. Migração deve ser aplicada uma vez, após inventário do schema/policies do ambiente isolado; não é script idempotente de produção.

`DIARIO_INTELIGENTE_ENABLED` continua estritamente habilitada pelo texto `true` no servidor. Ausente/false não consulta daily_actuals e bloqueia salvar realizado. Foram adicionadas regressões de leitura para flag ausente, filtro do proprietário, zero e erro da tabela. A flag não pode ser desligada como rollback financeiro após haver realizações/marcações: isso pode alterar saldos. As restrições da Sessão 3 continuam válidas.

Não foram encontrados credenciais/configuração de projeto isolado no checkout/variáveis disponíveis, ferramentas Supabase conectadas nem CLI/PostgreSQL/Docker locais. Não se buscou credencial de produção para substituir esse ambiente. SQL/RLS/autenticação reais e persistência integrada permanecem NÃO VALIDADOS.

## Produto e interface

Botão **Cartões** na sidebar abre popup com:

- Novo cartão: nome, dia de vencimento (1–31), primeiro mês, quantidade (1–60), preparação de meses consecutivos e valor individual obrigatório por mês. Zero é permitido. Cadastro inicial salva cartão e todas as faturas em uma transação SQL.
- Seleção de cartão, edição de nome/vencimento, inclusão de fatura avulsa por competência, edição de competência/valor e exclusão de fatura.
- Exclusão de cartão com confirmação explícita apaga somente esse cartão e suas faturas. Transações avulsas/regras/orçamentos antigos permanecem.
- Carregamento, falha de leitura/escrita, recarga, bloqueio durante salvamento e confirmação de exclusão dentro do modal.
- Escape, foco inicial, contenção de Tab/Shift+Tab e restauração de foco ao fechar; labels de inputs, aria-modal e anúncios de erro/estado.
- Tema claro/escuro, largura limitada à tela e rolagem vertical no celular. Quatro colunas e seletor Diário/Entradas/Saídas preservados.

A edição pelo lápis de um evento de fatura abre o gerenciador do cartão correspondente; não chama updateTransaction/updateRecurringRule para essa fatura.

Alterar dia de vencimento recalcula **todas as faturas** daquele cartão, inclusive passadas. Não há snapshot histórico nem status de pagamento nesta versão. O valor da fatura é seu total informado, e zero mantém a competência cadastrada. Não há controle de compras, produtos, estabelecimentos, parcelas de compras ou Resumo Mensal.

## Identidade, persistência e projeção

Novas tabelas: `credit_cards` e `card_invoices`. Um cartão tem nome/dia; fatura tem ID, proprietário, card_id, competência YYYY-MM e valor. Schema Drizzle representa essas tabelas e FK composta; SQL é a fonte das políticas RLS, checks, FK auth.users e função.

- UNIQUE(user_id, card_id, mes_referencia) impede duplicação automática da mesma fatura.
- FK composta (card_id,user_id) -> credit_cards(id,user_id) impede associar fatura ao cartão de outro proprietário, mesmo que os IDs sejam conhecidos. ON DELETE CASCADE acompanha a exclusão explícita do cartão.
- RLS das duas tabelas: usuário autenticado só lê/altera suas linhas; insert/update exigem o mesmo proprietário. Sem permissões para anon.
- Operações novas usam **cliente da sessão**, sem service role. Usuário validado com auth.getUser(); filtros explícitos complementam RLS. IDs, nome, dia, competência e valores são validados no servidor; payload inicial remove campos extras.
- `create_credit_card` é SECURITY INVOKER, usa auth.uid(), valida JSON/limites/decimais e faz criação atômica. EXECUTE somente para authenticated. Duplicata de competência aborta toda a criação inicial.
- Inclusão isolada usa INSERT: mês existente é recusado, sem upsert que sobrescreva silenciosamente. Edição exige ID da fatura, cartão e proprietário. Escrita/exclusão sem linha afetada retorna erro. Falhas não anunciam sucesso.
- Leitura usa relação card_invoices, converte numeric e ordena meses. Erro de leitura interrompe a projeção, nunca vira carteira vazia com saldo incorreto.

O motor cria **eventos virtuais**, sem gravar transações derivadas. Cada fatura aparece uma única vez como saída separada do Diário no vencimento. Dia 31: 31/01, 28/02 (29 em ano bissexto), 31/03, 30/04; não há deriva para meses seguintes. Faturas anteriores à âncora não são descontadas novamente. Recalcular/navegar não cria lançamentos. O motor rejeita entrada duplicada por cartão/competência em vez de apresentar um saldo silenciosamente errado.

**Duplicações antigas exigem revisão humana:** uma saída/regra já cadastrada e uma nova fatura com mesmo nome/valor continuam separadas. Não existe vínculo inventado por descrição, categoria ou data. O modal avisa para revisar os meses antes de cadastrar faturas correspondentes; nenhum registro antigo é removido, convertido ou desmarcado automaticamente. Também não há identificação automática de compras de cartão dentro do Diário: não repetir o total da fatura no Diário/avulsas. Não foi implementada migração de legado.

O reset preexistente, quando explicitamente solicitado na interface, inclui credit_cards/faturas em cascata se habilitados; a confirmação foi atualizada. Não foi executado. Continua sem transação entre as tabelas financeiras: não serve como migração/rollback.

## Migração e habilitação somente em testes

Preparadas, **não aplicadas**:

- `migrations/004_cartoes.sql`: tabelas, índices, unicidade, FK composta, RLS e RPC atômica. Não modifica tabelas financeiras existentes.
- `migrations/004_cartoes_rollback.sql`: transação que bloqueia remoção do schema se existir qualquer cartão/fatura. Não descarta dados novos silenciosamente.

Nova flag servidor: `CARTOES_ENABLED=true` somente após migração/validação do Supabase isolado. Ausente/false: gerenciador informa pendência, tabela não é lida e mutações são bloqueadas; projeção anterior permanece utilizável. As flags Diário e Cartões são independentes. Nenhum .env com credenciais foi criado/alterado.

**Não desligar CARTOES_ENABLED com faturas existentes como forma de rollback:** despesas seriam ocultadas da projeção. O código original ignora ambas as tabelas novas. Retorno à versão anterior exige exportação, conciliação e teste de restauração; adicionar schema não garante equivalência financeira do código antigo. Não usar db:push indiscriminadamente. Este documento não autoriza operação em produção.

## Verificação e limites

| Verificação | Resultado |
| --- | --- |
| npm test | 99/99 passaram em 8 arquivos (58 anteriores + 41 novos) |
| npx tsc --noEmit | Passou |
| npm run lint | Passou |
| npm run build | Passou, Next.js 16.2.9/Turbopack |
| git diff --check | Passou |
| Interface em Chromium, fixtures sem rede financeira | Passou |
| Supabase real isolado, SQL/RLS/auth reais | Pendente: ambiente não disponível |

Regressões novas: meses curtos/bissextos, virada anual, limites da geração, zero, centavos, continuidade, âncora, múltiplos cartões, idempotência, rejeição de duplicata, edição/inclusão/exclusão, preservação de avulsas/recorrências e separação do Diário. Server Actions com Supabase **simulado**: autenticação ausente/falha, owner filters, flag, RPC, validação, INSERT versus edição, duplicate error, zero linhas afetadas e falha de leitura/escrita. Orquestração da projeção integra faturas na janela distante e interrompe cálculo após falha de cartões.

Visual/fluxos: Chromium local alternativo com software rasterizer desativado; fixture Vite temporária renderizou componentes reais com Server Actions/router substituídos por funções em memória. Testados cadastro de três meses com 100/200/0, vencimento 31->28 em fevereiro, edição de fatura para 250, mensagem de duplicata, inclusão/exclusão de abril, edição de nome/vencimento, exclusão completa e Escape. Verificados 4 seletores mensais visíveis em desktop 1440x900 e 1 em mobile 390x844; popup sem overflow horizontal e dentro da tela; temas claro/escuro e screenshots inspecionados. Sem erros JS. Fixture removida antes do commit. **Não é E2E autenticado nem comprovação de persistência Supabase.**

Dependências e lockfile preservados; avisos informativos existentes de npm http-proxy/Vite tsconfigPaths permanecem. Nenhuma rota de testes pública foi adicionada.

## Pendências e Sessão 5

Continuar de `feat/horizonte-v2-cartoes`, verificar HEAD remoto e ler este relatório junto ao plano/relatórios 2/3. Prioridades:

1. Disponibilizar Supabase separado de produção, inventariar schema/policies e aplicar 003/004 somente nele. Testar autenticação de dois usuários, anon, SELECT/INSERT/UPDATE/DELETE, tentativa de vínculo cruzado, unicidade e rollback atômico da RPC (uma fatura inválida não deixa cartão parcial).
2. Habilitar flags somente nesse servidor, validar reload/persistência, Diário e cartões juntos, desktop/mobile e recuperação segura de dados/código. Não usar banco real como substituto.
3. Implementar Resumo Mensal em popup na sidebar, compartilhando dados do motor, com navegação de meses, abertura/fechamento/entradas/saídas e distinção do Diário previsto/realizado quando aplicável. Garantir conciliação dos totais sem somar novamente eventos incluídos no Diário ou faturas.
4. Preservar estrutura principal, autenticação, valores existentes e limites de produção. Revisar credenciais/automação externa de preview antes de futura publicação; não houve deploy manual nesta sessão.

A tag remota do backup original continua opcionalmente pendente; a branch remota permanente já preserva `e4ba912`. Nenhum bloqueio para desenvolvimento seguro foi substituído por acesso ao ambiente real.
