# Gastos do Diário

## Base verificada

Implementação em `feat/gastos-do-diario`, a partir de `feat/horizonte-investimentos-cancelamento`, commit `de70f337d10374709ae1f67b3fee3324dd753a99` (14/10/2026). Foram inspecionados os heads de todas as branches remotas, o histórico e as sessões técnicas 28–30. A `main` continua em `e4ba912` (29/06/2026). A única branch remota não ancestral da base é `fix/horizonte-desktop-recorrencias`: sua divergência acrescenta somente documentação de publicação, e a correção funcional `cd17964` já está na base. Preservados auth, cartões, investimentos, cancelamento de recorrências e tabela/editor mobile.

O esquema de `horizonte-testes` (`hsvjkbfpvmtnehjbwtgr`, atualmente usado pelo usuário) foi consultado somente por SELECT em `information_schema.columns`. Confirmadas as estruturas até a sessão 30. Nenhuma migração, escrita, seed, conta, configuração de Auth ou alteração de dados foi executada nesse projeto ou em produção. Todo teste novo de SQL ocorreu em PostgreSQL isolado via PGlite.

## Implementação

- Rota autenticada `/gastos-do-diario`, no layout existente, com entrada no menu lateral e no drawer mobile. O dashboard e a barra inferior existente não foram redesenhados.
- CRUD de gastos com UUID, proprietário, descrição, moeda decimal, categoria, data civil e timestamps. Cadastro usa hoje no fuso do navegador, editável; primeira renderização usa uma data estável do servidor para evitar divergência de hidratação.
- Calendário com navegação mensal/anual, seleção diária, indicação de compras e totais manuais; histórico diário e mensal, totais por categoria e comparação do previsto com realizado nas datas confirmadas.
- Formulário no `ModalPortal` existente: foco, Tab/Escape, bloqueio de fundo e de cliques duplicados; confirmação de exclusão, loading, erro, vazio e tratamento de respostas incertas.
- Categorias próprias por usuário, criação durante cadastro e isolamento por FK composta. Histórico paginado em lotes de 500, sem truncar a lista no limite padrão de 1.000 registros da API.
- Tokens e temas atuais; calendário e histórico lado a lado no desktop e empilhados no celular. Valores em linhas compactas até 400 px para evitar quebra dos centavos. Inputs de 16 px, alvos de ações de 44 px e modal rolável com `dvh`.

## Fonte única e compatibilidade

`daily_actuals` continua sendo a única entrada de realizados do motor `dailySchedule`. Nenhum item cria `transactions` e nenhum cálculo do motor foi substituído. A soma dos itens é persistida no total pelo banco na mesma transação.

`daily_expense_days` guarda um ajuste manual residual, opcional, e uma cópia `legacy_actual` do total anterior à primeira conciliação. Ao detalhar um dia que já possui realizado, a RPC recusa a escrita até a pessoa escolher:

1. **Preservar**: o valor anterior vira ajuste separado; novos itens são despesas adicionais.
2. **Usar somente itens**: o total passa a ser calculado pelos itens; o valor anterior fica arquivado na conciliação e visível na tela.

Não há opção preselecionada nem soma automática de valores antigos. A escolha é transacional e protegida contra concorrência. A reconciliação e a inserção podem ser repetidas com o mesmo UUID sem duplicar a compra. Edição/exclusão verificam `updated_at` para não sobrescrever outra versão silenciosamente.

Depois da conciliação, editar o realizado no editor antigo altera apenas o ajuste residual. Um total menor que a soma dos itens é recusado com orientação para editar os gastos. Limpar o total de um dia que ainda possui itens também é recusado; é necessário editar/excluir os itens. Isso protege os detalhes sem desativar o editor antigo. Ao excluir o último item, sem ajuste manual, o dia volta a **sem realizado**; zero manual preservado permanece **zero confirmado**.

Mudanças retroativas e transferências entre datas/meses atualizam origem e destino na mesma transação. O motor existente refaz a redistribuição cronológica em centavos, respeita realizados posteriores, piso zero e fechamento mensal. O reset existente foi integrado à ordem de exclusão de itens, conciliações e categorias antes das tabelas antigas.

## Banco e segurança

Migração aditiva: `supabase/migrations/20261026213250_gastos_do_diario.sql`, nome gerado pelo CLI. O repositório anterior usa migrações SQL manuais em `migrations/`; **não executar `supabase db reset` ou um push cego**: o diretório novo contém somente a extensão e pressupõe o esquema 000–009 já existente. Aplicar o SQL em uma cópia isolada desse esquema e revisar antes de levar ao projeto ativo.

Tabelas novas: `expense_categories`, `daily_expenses`, `daily_expense_days`. Índices por proprietário/data/categoria; FK composta de categoria e de dia, RLS em todas, grants explícitos, funções `SECURITY INVOKER` e acesso anônimo revogado. Funções derivam o usuário de `auth.uid()`; o cliente não escolhe o proprietário. Triggers também mantêm a consistência em escritas diretas pela Data API. Escritas por proprietário usam advisory lock transacional; operações que excedem o limite do realizado falham integralmente. Não há `service_role` no navegador ou no módulo.

O modelo Drizzle acompanha as tabelas; SQL é a fonte dos checks, FKs de Auth, RLS e triggers, como nas migrações existentes.

## Ativação e revisão

1. Revisar este PR e aplicar a migração primeiro em ambiente isolado com esquema 000–009.
2. Conferir policies/grants/triggers e advisors nesse ambiente, e testar duas sessões autenticadas.
3. Habilitar `GASTOS_DIARIO_ENABLED=true` e manter `DIARIO_INTELIGENTE_ENABLED=true`; usar as mesmas variáveis e Auth da aplicação atual.
4. Publicar a branch revisada no ambiente aprovado, testar login, calendário, cadastro e editor do Diário com duas abas.
5. Somente após essa revisão planejar a ativação no ambiente real. Não foi feito merge ou deploy nesta entrega.

Não desabilitar o Diário Inteligente enquanto houver gastos detalhados: esse flag desliga o consumo de realizados no motor antigo. Para retirar temporariamente a tela, desabilitar apenas `GASTOS_DIARIO_ENABLED`; os totais consolidados continuam compatíveis com a projeção anterior. Manter a migração e seus dados na reversão de interface; não há rollback destrutivo automático.

## Validação

- 27 testes novos: validação, ações autenticadas, paginação, tela/fluxos, SQL real no PGlite, CRUD, idempotência, conflitos de edição, categorias, RLS/anon, conciliação, manual/zero/ausência, mudança entre meses, rollback e redistribuição via motor original.
- Suíte integral: **319 testes, 45 arquivos**, passou com `npm run test -- --maxWorkers=1 --testTimeout=30000`. Rodadas com paralelismo e limite padrão de 5 s tiveram timeouts em testes antigos e falhas temporais de DOM; a rodada serial passou sem modificar asserções nem limites no código do projeto.
- `npm run lint`, `npx tsc --noEmit`, `npm run build -- --webpack` e `git diff --check`.
- `scripts/verify-daily-expenses.mjs`: Chromium real, dados fictícios em memória e a tela de produção. Larguras 320/375/390/768/1440, claro/escuro, cadastro, criação de categoria, edição, exclusão, geometria sem overflow horizontal e alvos do calendário. Capturas inspecionadas; o teste visual levou à correção da quebra monetária em telas estreitas.

O harness de navegador fica exclusivamente em `tests/expenses-browser`; não é importado pelas rotas do produto. Pode ser repetido com `node scripts/verify-daily-expenses.mjs` após instalar Chromium do Playwright, ou fornecendo `CHROMIUM_EXECUTABLE`. Capturas vão para `/tmp/hf-expenses-screens` por padrão. No ambiente desta execução, o download padrão do Playwright veio truncado; o navegador foi disponibilizado por um pacote npm temporário fora do projeto, sem nova dependência de produção.

Limites: não foi realizado teste com sessão real do usuário nem instalação da migração no Supabase hospedado. PGlite valida PostgreSQL/RLS/transações, mas não substitui PostgREST, advisors do projeto migrado, concorrência de conexões reais ou teclado físico de iOS/Android. A verificação visual isolou a tela nova; navegação/sidebar preservadas foram verificadas pelo código e testes existentes, sem refazer login de uma conta real.
