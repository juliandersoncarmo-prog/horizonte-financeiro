# Refinamentos de Gastos do Diário

Base GitHub: PR #1 integrado em `feat/horizonte-investimentos-cancelamento`, `dcd75a68db415d8dbd4b0f859b805a2456e7d4a6`. Base publicada: Horizonte Testes, versão 21, fonte Sites `f82b7cf9a413f7d312a923938d0af9a1d9de0a43`. Conferidos os arquivos funcionais entre as duas fontes antes das alterações; infraestrutura Vinext e autenticação hospedadas preservadas.

## Comportamento

Os itens de `daily_budgets` passam a alimentar automaticamente `expense_categories` por `budget_expense_categories`. Nomes normalizados evitam duplicatas; renomear mantém identidade/histórico, colisões fundem referências e excluir orçamento mantém a categoria e seus gastos. Orçamentos mensais seguem exatamente o filtro/soma já usado pelo motor. A comparação por categoria é informativa e não alimenta a projeção.

`included_amount` registra quanto de cada despesa já estava no total manual. A parte restante fica em `manual_adjustment`. A decisão incluído/adicional é persistida na mesma transação que o gasto. O pop-up recebe total, restante e acréscimo do banco; a confirmação devolve esses valores e o banco recusa cotações antigas. Itens incluídos consomem o restante; ao ultrapassá-lo, a opção de manter o total fica indisponível e é preciso confirmar o adicional ou corrigir o lançamento. Editar aumenta apenas o acréscimo; reduzir/deletar detalhe incluído devolve sua parcela ao restante, conservando o total informado. Transferência de data devolve a cobertura à origem e exige nova decisão no destino quando pertinente. `updated_at` e UUID mantêm controle de concorrência e repetição de cadastro.

`daily_actuals` continua sendo a única entrada dos realizados no motor original. Nenhum gasto detalhado cria transaction ou desconto adicional. As despesas anteriores recebem cobertura zero, conservando seus valores e totais.

Na interface: etiquetas suaves com cor determinística por ID nos dois temas; resumo simples de detalhes/outros gastos/total somente se houver outros gastos; limites mensais por categoria; quarto atalho no menu do + mobile, sem alterar os cinco ícones; cadastro rápido no modal compartilhado; setas atravessam meses/anos e respeitam campos e modais.

## Desempenho

A leitura paginada dos gastos antes serializada com as outras consultas passou a ocorrer em paralelo com elas. Cache somente na instância da tela (até seis meses, validade 30 segundos), deduplicação das leituras em voo e pré-carregamento dos meses vizinhos. Não há cache de dados financeiros compartilhado no servidor. Invalidação após mutações e alterações do snapshot da projeção; atualização ao retornar à aba, sinal de outra aba e a cada 30 segundos enquanto visível. Mudanças retroativas invalidam todos os meses e respostas antigas não repovoam o cache. O motor de redistribuição não foi modificado. Nenhuma promessa de latência de rede real: não foi medida novamente em aparelho do usuário.

## Banco e recuperação

Somente `hsvjkbfpvmtnehjbwtgr`, horizonte-testes. Migração aditiva `20261026235504_refinamentos_gastos_diario.sql`, criada pelo CLI e validada em PostgreSQL/PGlite antes da aplicação hospedada. Snapshot interno anterior à migração em `recovery_refinamentos_gastos_20261027`: daily_actuals, daily_expenses, daily_expense_days, expense_categories, daily_budgets e definições das funções anteriores. Schema e tabelas sem grants públicos, RLS sem policies, restritos à administração. Não é backup completo de Auth ou de todo o projeto.

Reversão recomendada: desabilitar apenas GASTOS_DIARIO_ENABLED, mantendo DIARIO_INTELIGENTE_ENABLED e os totais consolidados. A versão 21 usa semântica antiga de conciliação e não deve escrever após a migração sem ajuste compatível. Não restaurar snapshots sobre gastos novos. Qualquer reversão de banco requer comparar os dados posteriores por proprietário/data; preservar `included_amount`, coberturas e totais. Não remover tabelas automaticamente. Main, produção antiga, Auth e outros projetos preservados.

## Verificação

334 testes em 46 arquivos passaram: `npm run test -- --maxWorkers=1 --testTimeout=30000`. Inclui 15 novos casos cobrindo confirmação, totais finais, excesso, concorrência, repetição, edição, exclusão, transferência entre anos, categorias/renomeação/colisão/histórico, isolamento, atalhos, cache e calendário. Lint, TypeScript e build Next --webpack passaram.

No pacote hospedado: TypeScript, lint (um warning anterior no login sobre window.location.assign), build Sites/Vinext, verify-hosted-css e verify-hosted-auth passaram. Chave pública e URL compiladas somente para o Supabase de testes. Sem service_role.

SQL hospedado sob role authenticated confirmou incluído/adicional, CRUD, idempotência, transferência entre anos, renomeação/exclusão de categoria e isolamento por proprietário. Fixtures totalmente revertidas por ROLLBACK. Funções SECURITY INVOKER, search_path vazio e execução anônima negada. Advisor sem alerta novo nas tabelas/funções públicas do módulo; avisos informativos dos snapshots restritos são esperados. Proteção de senhas vazadas desabilitada já existia e não foi alterada.

Limite: preview de navegador não ficou saudável no prazo disponível da infraestrutura. Fluxos foram verificados em testes DOM e SQL; geometria em navegador e uso físico iOS/Android não foram revalidados nesta rodada. Publicação e identificação do PR são confirmadas na entrega.
