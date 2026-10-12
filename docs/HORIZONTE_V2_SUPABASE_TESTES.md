# Ambiente isolado — instruções e testes preparados

## Passos indispensáveis do proprietário

1. Entre no painel Supabase usando sua conta. Clique em **New project** e dê o nome `horizonte-testes`. Crie um projeto NOVO, separado do financeiro atual. Guarde a senha no seu gerenciador de senhas. Não copie dados de produção.
2. Quando estiver pronto, em **Project Settings / General** copie o Project ID (project ref). Informe somente esse identificador e que o projeto é de testes. Precisamos também do identificador da produção, somente para impedir que os dois sejam iguais. Não envie senhas ou chaves pelo chat ou GitHub.
3. Em **Connect / API Keys**, obtenha URL, anon key compatível com o aplicativo e service role legada. A service role deve ser configurada somente no servidor Next de testes. A demo estática NÃO recebe nenhuma dessas chaves. Disponibilize acesso administrativo autorizado ao projeto novo para permitir preparar schema e executar SQL; atualmente não há ferramenta Supabase conectada nesta sessão.
4. Será necessário um runtime Next separado (não o site de demonstração). Configure nele `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`, todos do projeto NOVO. Configure as URLs de autenticação para esse runtime. As flags `DIARIO_INTELIGENTE_ENABLED=true` e `CARTOES_ENABLED=true` só entram depois de validar o schema.
5. Em **Authentication / Users**, crie duas contas fictícias com senhas diferentes, sem dados pessoais. Confirme os e-mails somente dessas contas para o ensaio. Não reutilize sua conta financeira real.

O proprietário só precisa criar/autorizar o projeto novo e disponibilizar o acesso seguro. Preparação técnica restante cabe ao agente. Não executar `db:push`, o script legado `test-db.ts`, reset ou seed no projeto financeiro real.

## Schema base: bloqueio explícito

O repositório não contém migrations 001/002. Um projeto Supabase vazio NÃO aceita 003 diretamente: `transactions` e `recurring_rules` ainda não existem. `lib/db/schema.ts` é a referência de estrutura, não prova de policies efetivas. Antes das migrations, preparar SQL base revisado para settings, transactions, recurring_rules e daily_budgets, enums, índices, unicidade de settings.user_id, permissões e RLS owner-only. Validar em projeto descartável. Nenhum schema/export de dados de produção é necessário.

Inventário administrativo (somente no projeto novo): listar colunas/constraints via information_schema, policies via pg_policies, grants via information_schema.role_table_grants e rotina via pg_get_functiondef. Confirmar todas as tabelas base e unicidade settings.user_id. Então aplicar **uma vez** `migrations/003_diario_inteligente.sql` e depois `migrations/004_cartoes.sql` pelo SQL Editor do projeto novo. Cada arquivo já contém BEGIN/COMMIT. Registrar saída e inventário depois. Não considerar arquivos idempotentes: reexecução pode falhar por constraints/tabelas já existentes.

## Teste real executável preparado, não executado

`scripts/validate-isolated-supabase.mjs` não carrega .env do produto, não usa service role, exige identificação de teste/produção diferente e consentimento explícito por variável. No terminal seguro do runtime de testes configurar, sem versionar valores:

- HF_TEST_PROJECT_REF, HF_PRODUCTION_PROJECT_REF
- HF_TEST_CONFIRM = `ISOLATED:` seguido do project ref de testes
- HF_TEST_SUPABASE_URL = `https://PROJECT_REF_DE_TESTES.supabase.co`
- HF_TEST_ANON_KEY
- HF_TEST_A_EMAIL, HF_TEST_A_PASSWORD, HF_TEST_B_EMAIL, HF_TEST_B_PASSWORD

Executar `node scripts/validate-isolated-supabase.mjs`. Usa somente registros marcados HF-TEST e um realizado sintético em 2099-12-31; recusa sobrescrever um realizado existente. Limpa somente IDs criados pelo teste em finally. Em interrupção abrupta, revisar esses registros sintéticos no projeto de testes, nunca resetar toda a base. Rodar uma instância por vez.

Verifica autenticação por senha, sessão nova lendo persistência, criação/edição/exclusão próprias, bloqueio SELECT/UPDATE/DELETE de outro usuário, leitura anônima, insert com proprietário forjado, FK cruzada cartão/fatura, competência única e RPC inválida sem cartão parcial. É teste de API/banco real quando executado, não teste das Server Actions ou navegador. Sua sintaxe foi validada nesta sessão; acesso remoto não executado.

## Matriz restante de migrações, segurança e navegador

| Ensaio | Critério |
| --- | --- |
| Schema 003/004 | Tipos, checks, owner RLS e grants iguais ao SQL; anon sem acesso; rotina SECURITY INVOKER |
| Checks 003 | entrada com incluido_diario=true rejeitada; valores negativos/acima do limite rejeitados; user/data únicos |
| Rollback | Com dados fictícios novos, arquivos rollback devem falhar sem remover tabelas/dados; em segunda base vazia descartável devem passar |
| Restore | Exportar somente base fictícia, restaurar em segunda base e comparar contagens, IDs, valores e projeção |
| Auth Next | registro, senha incorreta, login/logout, recuperação, expiração e OAuth (se configurado); URLs somente de teste |
| Onboarding | conta nova campos vazios, saldo 0/negativo, confirmação/voltar/pular; conta existente não reinicializa; falha de leitura não grava |
| Settings | persistência após reload, unicidade user_id, falha/concorrência sem sobrescrever, isolamento A/B |
| Server Actions | A tenta IDs B, usuário anon/sem sessão, flags desligadas e erro de leitura/escrita; legado service role exige filtros explícitos |
| Diário | Enter, Esc, limpar, zero, rede lenta/Enter repetido, erro recuperável; refresh atualiza calendário/resumo |
| Cartões | quantidade vazia, gerar campos, aumentar/preservar, diminuir/trocar mês com confirmar/cancelar, CRUD e vencimento 31 |
| Resumo | positivo/negativo/zero, mês parcial, início/fim, fatura incluída uma vez nas saídas |
| Visual/a11y | 1440x900 e 390x844, claro/escuro, sem overflow, 4/1 colunas, foco, Tab/Shift+Tab/Escape, leitor de tela e contraste |

Sem um ambiente real isolado, nenhum item dessa matriz deve receber PASS. O teste preparado não substitui validação do legado que usa service role, nem comprova rollback, backup ou primeiro acesso.
