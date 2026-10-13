# Horizonte V2 — Sessão 18: alinhamento mobile e Diário

## Continuidade e isolamento
Consulta direta da coleção de branches GitHub confirmou `feat/horizonte-mobile-gestos`, `726818fda082f33af75bb1686bf6095d740a36a4`, como continuidade da Sessão 17. A busca indexada de commits retornava apenas commits de junho; não foi usada como prova da versão recente. Lidos AGENTS.md, relatório da Sessão 17 e guia use-server da versão instalada de Next.js. Branch nova: `fix/horizonte-mobile-diario-performance`.

Site selecionado: `appgprj_6acd25d8d4708191b849f052ba7532ba`, URL https://horizonte-testes-autenticado.juliandersoncarmo.chatgpt.site. Source inicial Sites: `9d5e1c49d8be2c28d476cb40f0856a01e0693834`. Audiência owner-private preservada (custom, somente proprietário). Banco exclusivo: `hsvjkbfpvmtnehjbwtgr`. Main, backup, produção financeira e banco original não receberam alterações. Sem migrations, alteração de credenciais ou configuração runtime.

## Diagnóstico e correções visuais
CSS da Sessão 16 colocava o número do Diário à direita dentro de uma grade de valor + lápis (26px). Isso deslocava o centro do número em relação ao título e aos modos Entradas/Saídas. Agora a célula usa espaços laterais simétricos de 22px, número centralizado e lápis à direita. O seletor usa espaço simétrico ao ícone de seta; texto fica centrado na mesma coluna. Data/Diário/Saldo preservados. Valores de Diário, Entradas, Saídas e Saldo passam de 12px a 14px somente abaixo de 640px; desktop mantém os tamanhos anteriores. Campos de edição continuam em 16px no mobile. Valores extensos podem quebrar linha (inclusive dentro de número extremo), sem truncamento, com altura flexível; não foi introduzida rolagem horizontal.

## Diagnóstico de desempenho
- A abertura do DiarioModal já usava `editorData.dailyBudgets` da projeção autenticada. Nos testes locais não fazia consulta extra antes nem depois. A causa da lentidão percebida nessa abertura no celular não foi reproduzida nem atribuída a Supabase sem prova.
- O calendário chamava `saveDailyActual`, confirmava a gravação e então `router.refresh()`. Esse refresh repetia carregamento do layout, verificação de autenticação, consultas de configurações/regras/lançamentos/orçamentos/realizados/cartões e cálculo da projeção.
- Adicionar orçamento no gerenciamento disparava `getAllDailyBudgets` E refresh completo após inserir. Edição/exclusão também faziam refresh.
- O motor já indexa lançamentos e faturas por data. Seu código e matemática não foram modificados. Não foi adicionado cache compartilhado de dados de usuário nem removida autenticação.

## Atualização confirmada
`getProjectionData` envia também uma entrada tipada e normalizada do motor, estritamente da conta autenticada. ProjectionProvider guarda esse snapshot somente na instância React da conta. Depois da confirmação real da Server Action, aplica a alteração persistida ao snapshot e roda o MESMO `runProjection`; calendário, saldos, KPIs, resumo e dados de edição recebem o resultado juntos. Nada financeiro muda durante a espera ou quando a gravação falha. A renderização tem feedback Salvando, bloqueio de cliques duplicados e mantém o campo em caso de erro.

INSERT/UPDATE de orçamento retornam a representação do registro via SELECT na mesma requisição; não existe busca extra para descobrir o id inserido. Upsert de realizado retorna data/valor gravados; remoção só aplica ausência após DELETE sem erro. Zero é distinto de ausência. Filtros de proprietário, getUser e RLS mantidos. A chave do Provider é o id da conta para não reaproveitar estado entre contas. Novo snapshot do servidor substitui integralmente o estado local. Caminhos antigos sem snapshot continuam com refresh de segurança.

No caminho completo autenticado testado: abertura do modal = 0 leituras adicionais; salvar realizado = 1 Server Action e 0 refresh; adicionar orçamento = 1 Server Action, 0 busca adicional e 0 refresh. São contagens de chamadas verificadas em testes, não medições de latência de rede.

Tradeoffs: snapshot adicional aumenta o payload inicial e utiliza CPU do cliente para recalcular a mesma projeção após persistência. Não há sincronização em tempo real entre dispositivos/abas. Atualizações externas exigem recarregar para um novo snapshot; edição concorrente em outro dispositivo não foi validada nesta sessão. Os outros fluxos existentes continuam com refresh e substituem o snapshot.

## Medições comparáveis
Execução no mesmo container, mesmo Node, mesmo fixture, baseline `726818f` em worktree separado e branch atual. Scripts versionados permitem repetir. Valores em milissegundos; benchmarks não usam rede, navegador visual ou hardware de celular.

| Medição | Antes (mediana; mínimo–máximo) | Depois (mediana; mínimo–máximo) | Interpretação |
|---|---|---|---|
| Abertura de modal pré-carregado; 30 orçamentos, happy-dom, 5 warmups + 25 amostras | 19,46; 10,87–33,75 | 19,89; 10,73–35,74 | Sem melhora demonstrada; zero leituras extra em ambos |
| Motor: 100 regras, 2.000 lançamentos, 73 meses; 1 warmup + 7 amostras | 75,78; 70,71–101,40 | 76,03; 65,20–90,88 | Motor inalterado; não foi obtido ganho de CPU |
| EXPLAIN ANALYZE daily_budgets, UUID inexistente, banco real de testes | 0,116 execução / 0,473 planejamento | 0,084 execução / 0,365 planejamento | Índice user_id já existe; zero linhas; variação de aquecimento, sem mudança no banco |
| Gravação até atualização no site publicado, celular autenticado | Não disponível | Não disponível | Não atribuir ganho percentual ou tempo real sem medição ponta a ponta |

Medição inicial exploratória isolada do motor: mediana 75,52 ms; execuções concorrentes da suíte produziram cerca de 94–97ms e não foram usadas para alegar ganho. Nenhuma economia artificial de latência foi simulada. A otimização demonstrada é eliminar o refresh e as leituras redundantes, mantendo o custo real da autenticação + escrita.

## Validação
- 239 testes aprovados em 33 arquivos: regressões financeiras, gestos, autenticação, exclusão, edição, globais, zero/ausência e novo caminho confirmado sem refresh.
- Novos testes cobrem espera e falha sem alteração financeira; cliques duplicados; zero, edição e remoção com igualdade de todos os meses ao motor; add/edit/delete globais; substituição de snapshot de conta; retornos do banco, ausência de registro, RLS simulado e falta de sessão.
- TypeScript e lint do repositório: aprovados. Build Next.js: aprovado.
- TypeScript do source hospedado: aprovado após dois ajustes de compatibilidade com tipos Cloudflare já existentes: appendChild no portal e validação da estrutura JSON do endpoint de login. Nenhuma mudança de fluxo de autenticação. Testes de Auth/portal continuaram aprovados.
- Lint hospedado: sem erros, uma advertência preexistente no login (window.location.assign). Preservado porque o redirecionamento completo fazia parte da correção mobile aprovada.
- Build Vinext/Cloudflare e verificadores de CSS/Auth: aprovados. Endpoint público de testes compilado, cores/modais e login preservados.
- Leitura real das políticas: daily_actuals/daily_budgets com ALL para authenticated, USING e WITH CHECK user_id = auth.uid(); sete tabelas públicas com RLS ativo. Não foi feita nova escrita em dados existentes.
- DOM sintético inclui widths 320/375/390/430 e navegação existente; CSS contempla quebra de valores grandes. Isso não equivale à validação visual de overflow no navegador.

## Limitações e próximo teste real
Sem control-browser disponível no ambiente managed. Conforme fluxo Sites, não foi iniciado servidor de preview nem improvisado outro navegador. Não houve screenshot, teste visual em desktop/Android/iOS, OAuth E2E ou cronômetro da operação autenticada no site publicado. Persistência e isolamento da sessão foram cobertos por testes simulados e inspeção das políticas, não por escrita E2E em navegador nesta sessão. Build e publicação não provam ausência de toda regressão visual.

Conferir no site no celular: centro do título/número/lápis nos três modos, valores grandes sem scroll lateral, salvar/editar/zerar/remover realizado e observar Salvando → confirmação, abrir Diário logo após salvar, adicionar/editar/excluir orçamento e conferir resumo, swipe e rolagem vertical. Para obter latência real comparável é necessário registrar no mesmo dispositivo/rede o intervalo entre confirmar e ver calendário atualizado, ao menos 10 repetições por versão, sem misturar cold start e sessões aquecidas.

## Publicação
Publicação somente no site de testes indicado. Publicação confirmada pelo Sites: **succeeded**, env revision 1 preservada.

- Commit GitHub de implementação: `fa200a3afb612f08e96047c7829a35b0f098ced8`.
- Source Sites: `212a4b59d11d2e234239f682672e10b178e2e9ad`.
- Versão: `appgprj_6acd25d8d4708191b849f052ba7532ba~appgver_721729391aa481919873343ab3a9ce50`.
- Deployment: `appgdep_6acd86d1a550819187fa97ba53aee3c1`.
- O source do site mantém suas configurações Vinext próprias; arquivos funcionais correspondem à implementação GitHub. Este resultado integra um commit documental posterior, sem novo deploy de código.
