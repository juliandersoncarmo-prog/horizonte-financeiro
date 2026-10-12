# Horizonte V2 — Sessão 11: Supabase e integração

## Continuidade e limites

GitHub verificado: base mais recente `fix/horizonte-v2-finais-pre-supabase`, SHA `d47eddd189657d9de5c0ae48b001a1dc6318b3da`. Nova branch `test/horizonte-v2-supabase-real`. Lidos AGENTS.md, plano e relatórios 6–10, além do relatório de correções pré-Supabase que já se chamava Sessão 11. Este arquivo tem nome distinto para preservar aquele relatório. Consultados changelog Supabase, documentação SSR e guia Next instalado sobre Server Functions.

`main` e backup original permanecem em `e4ba912f14db49b98b3e9129c27670b7bf050d48`. Nenhuma consulta ao banco original `aahliptkdexrbqcnnlvt`, restauração daquele projeto, alteração de produção ou merge foi executado. Todas as operações SQL deste trabalho usaram exclusivamente `hsvjkbfpvmtnehjbwtgr`, confirmado como `horizonte-testes`, sa-east-1, ACTIVE_HEALTHY.

## Banco efetivamente preparado

Inventário inicial: public vazio e nenhuma migração. Inspecionados Drizzle, migrations, queries, Server Actions, RPC e flags antes da aplicação. A base não existia nos arquivos 003/004; foi reconstruída em `migrations/000_base_testes.sql`.

| Tabela | Proteção/estrutura principal |
| --- | --- |
| settings | FK auth.users, uma configuração por user_id, saldo negativo/zero permitido |
| transactions | FK auth.users, índices usuário/data, enum entrada/saída, valor não negativo |
| recurring_rules | FK auth.users, enums frequência/término, dia 1–31, índice usuário |
| daily_budgets | FK auth.users, competência opcional válida, orçamento não negativo |
| daily_actuals | FK auth.users, unicidade usuário/data, zero explícito |
| credit_cards | FK auth.users, vencimento 1–31, nome validado, chave composta id/user_id |
| card_invoices | FK composta cartão/proprietário, competência única, cascade de faturas ao excluir cartão |

Todas têm RLS com USING e WITH CHECK por proprietário. `anon` não tem privilégios nessas tabelas. `authenticated` recebe somente SELECT/INSERT/UPDATE/DELETE, sem TRUNCATE/TRIGGER/REFERENCES. A RPC `create_credit_card` permanece SECURITY INVOKER, usa auth.uid(), é inacessível a anon e cria cartão/faturas na mesma transação.

| Histórico Supabase | Nome | Arquivo |
| --- | --- | --- |
| 20261012180955 | horizonte_base_testes | 000_base_testes.sql |
| 20261012181017 | diario_inteligente | 003_diario_inteligente.sql |
| 20261012181026 | cartoes | 004_cartoes.sql |
| 20261012181151 | horizonte_rls_indexes | 005_rls_indexes.sql |
| 20261012182127 | horizonte_least_privilege | 006_least_privilege.sql |

003/004 foram aplicadas conforme o código versionado, após provisionar suas dependências. 005 acrescenta índice da FK de faturas e initplan em RLS. 006 remove privilégios automáticos excessivos, inclusive os de anon em daily_actuals concedidos por defaults do Supabase. Nenhum rollback destrutivo de schema foi aplicado.

Advisors finais: nenhum aviso de RLS/FK; performance mostra somente índices ainda não usados em banco novo. Segurança mostra aviso Auth de proteção contra senhas vazadas desabilitada: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection . Configuração Auth não foi alterada via SQL.

## Aplicativo e segurança legada

As leituras e mutações legadas deixaram de criar um cliente privilegiado. `createUserDataClient` reaproveita `createClient` SSR e seus cookies; mantém filtros explícitos por user_id e agora também obedece RLS. Não há leitura de SUPABASE_SERVICE_ROLE_KEY no runtime financeiro. O script antigo de diagnóstico privilegiado não foi executado.

Validações adicionais no servidor para entradas/saídas e recorrências: valor finito, não negativo, até dois decimais, data civil existente, tipo, descrição, vencimento e número de ocorrências. Não houve alteração do motor nem das correções visuais da última sessão.

`HF_TEST_MODE=true` recusa URL diferente do projeto autorizado no servidor e proxy. Ambiente local ignorado pelo Git usa URL/ chave pública de testes e flags Diário/Cartões, ativadas somente após validar schema e RLS. Nenhuma senha, token OAuth, service role, DATABASE_URL ou conta fictícia foi incluída no GitHub.

## Login original e complemento do proprietário

Reutilizadas as páginas existentes: login, cadastro, recuperação e redefinição, Google OAuth e logout. Não foi criada outra implementação de Auth. A aparência foi preservada. O primeiro acesso continua no layout autenticado após `hasInitialSettings`: apenas ausência real de settings abre o wizard; falha de consulta interrompe o fluxo e registro existente não é sobrescrito.

Callback existente troca código PKCE por sessão. Agora também retorna à redefinição de senha mediante `next=/reset-password`, com destino restrito; nunca aceita origem externa. Recuperação aponta para esse callback; cadastro informa emailRedirectTo explicitamente. Proxy mantém cookies renovados ao redirecionar e trata erro de sessão como não autenticado. Redefinição encerra a sessão local antes de voltar ao login.

Endpoint público de configurações Auth do projeto de testes respondeu 200: Google false, email true, disable_signup false e mailer_autoconfirm false. Portanto Google ainda exige configuração, e cadastro requer confirmar e-mail. Não se enviaram e-mails de teste nem se usaram contas pessoais. Passos do proprietário em `HORIZONTE_V2_TESTES_AUTH_CONFIG.md`.

## Validação: evidência e limitações

| Verificação | Resultado |
| --- | --- |
| npm test | 161/161, 19 arquivos |
| TypeScript | npx tsc --noEmit aprovado |
| Lint | npm run lint aprovado |
| Next build | aprovado, Next 16.2.9, sem service role |
| SQL real com dois proprietários | aprovado em sete tabelas |
| Anon/acesso cruzado/reatribuição | bloqueados no SQL real |
| Unicidade settings/realizado/fatura | aprovada no SQL real |
| FK entre proprietários | bloqueada no SQL real |
| RPC cartão/faturas | aprovada; duplicata reverte toda a criação |
| Gravação/leitura/edição do realizado | aprovadas no SQL real |
| Login por senha, sessão nova, reload HTTP | execução não concluída |
| Google OAuth real/cadastro/confirmação/recuperação | pendentes |
| Onboarding/Server Actions em navegador | pendentes; testes locais usam mocks |
| Desktop/celular/temas/teclado/overflow visual | pendentes |

Teste SQL `scripts/validate-rls-test.sql` usa SET LOCAL ROLE authenticated/anon e claims de dois usuários descartáveis; é um teste de RLS no PostgreSQL, **não prova dois logins HTTP reais**. Insere configurações, avulsa, recorrência, orçamento, realizado, cartão e fatura, testa leitura/mutação cruzada, proprietário forjado, FK e atomicidade. Tudo dentro de BEGIN/ROLLBACK. As contas descartáveis foram provisionadas só no Auth de testes; suas sessões foram removidas e as contas apagadas ao final. Consulta final confirmou zero registros em todas as sete tabelas e zero contas descartáveis remanescentes.

O script HTTP preparado foi ampliado para as tabelas originais e sessão nova. Tentativas com transporte Node e curl tiveram timeouts; uma execução anterior retornou sessão inexistente, sem concluir a suíte. Não se declara login ou persistência HTTP aprovados. Há timeout e trava de project ref exclusivo no script. Não foram desabilitadas autenticação, RLS ou confirmação de e-mail para contornar esse limite.

Novos testes locais verificam cliente de sessão sem chave privilegiada, recusa de outro banco, callback Google/e-mail/recuperação, rejeição de redirect externo, rotas públicas/protegidas, erro de sessão e cookies renovados. Os testes anteriores continuam cobrindo motor, saldos, resumo, recorrências, Diário e cartões.

## Recuperação dos dados fictícios

Nenhum dado real foi importado. A base de testes termina vazia e não precisa de restauração de valores. As fixtures SQL são reprodutíveis pelo script e revertidas automaticamente; ele exige dois UUIDs de usuários exclusivamente de teste. O script HTTP limpa somente IDs criados por sua execução e recusa reutilizar conta com settings inicial. Não usar resetAllData, TRUNCATE ou backups de produção para repetir a suíte.

Para repetir testes técnicos: provisionar dois usuários descartáveis no Auth do projeto autorizado, substituir os placeholders da suíte SQL e executar exclusivamente nesse project ID; não registrar senhas em migrações/Git. Após o teste, encerrar sessões e apagar somente essas contas descartáveis. Para testar pela interface, cadastrar conta no ambiente separado, confirmar e-mail e preencher saldo inicial com valores fictícios; a configuração não importa exemplos automaticamente.

Para recuperar código: criar checkout separado a partir desta branch ou do backup original; nunca force-push nem reset de main. Arquivos SQL versionados e migration history Supabase permitem reconstruir uma base **vazia de testes** em sequência 000→003→004→005→006, mediante novo inventário e autorização explícita do destino. Não aplicar essa base ao banco original.

## Hospedagem

Site separado `appgprj_6acd25d8d4708191b849f052ba7532ba`, owner-private, com env apontando exclusivamente para o banco de testes. Publicação confirmada **succeeded**: https://horizonte-testes-autenticado.juliandersoncarmo.chatgpt.site . Source SHA da hospedagem `da19f42bfb76bec69ebe833a854207c49d40becd`; deployment `appgdep_6acd274d81c881919fe4a87671ad25a3`; revisão de ambiente 1.

Sites usa Vinext/Cloudflare Workers: preparação separada mantém os componentes, páginas e ações do Next; o repositório GitHub continua Next.js 16.2.9. O pacote hospedado usa o starter com Next 16.3.4/React 19.2.6/Vinext beta.5 e as dependências Supabase fixadas, com lockfile. O matcher do proxy no pacote de hospedagem usa as rotas existentes para compatibilidade com Vinext. Build Vinext passou após resolver lockfiles, matcher e preservar helpers obrigatórios do starter. O comportamento das Server Actions, SSR/cookies e RLS nesse runtime ainda exige E2E. Não houve atualização da demonstração localStorage nem publicação na produção original.

As variáveis Sites foram configuradas pela integração, sem service role ou senhas de contas. Google e Site URL/Redirect URLs são ajustes Auth separados, sem ferramenta de configuração disponível nesta sessão: seguir `HORIZONTE_V2_TESTES_AUTH_CONFIG.md` antes de declarar cadastro/recuperação/Google aprovados. Não se afirma que todas as rotas navegadas funcionam por ter somente status de deployment aprovado.

QA Sites não iniciou navegador/preview: control-browser indisponível. A skill Sites exige: “If `$control-browser` is unavailable, skip browser QA: do not start a preview server, install a browser, or improvise another browser-control path.” Build e publicação, se aprovados, não comprovam interação autenticada ou aparência.

O SHA GitHub final consta na entrega e no histórico da branch; não é embutido neste commit para evitar referência circular.
