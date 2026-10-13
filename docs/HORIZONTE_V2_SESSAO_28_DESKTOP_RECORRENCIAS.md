# Sessão 28 — Desktop, cartões e cancelamento mensal de recorrências

Data: 13/10/2026. Repositório: juliandersoncarmo-prog/horizonte-financeiro.
Branch: fix/horizonte-desktop-recorrencias.

## Continuidade e ambiente

- GitHub consultado e fetch real concluído. Base: audit/horizonte-liberacao-oficial, f9d787447e7f5506945c8ce16235d9ba18c83f57.
- Relatório mais recente: sessão 27, lido integralmente. Runtime da base corresponde à versão mobile aprovada; diferenças de auditoria são documentação e testes.
- Fonte publicada inicial: versão 17, 6932101b0e01495fca8b6d99775002e8b3cb3dde. Checkout aberto do repositório Sites correspondente antes de editar.
- Site único: https://horizonte-testes-autenticado.juliandersoncarmo.chatgpt.site.
- Sites ID: appgprj_6acd25d8d4708191b849f052ba7532ba. Acesso somente ao proprietário, preservado.
- Supabase único: horizonte-testes, hsvjkbfpvmtnehjbwtgr.
- Main e backup do GitHub mantidos em e4ba912f14db49b98b3e9129c27670b7bf050d48.
- Configuração de ambiente Sites revisão 1 preservada. Não houve alteração de Auth, políticas existentes, site alternativo, banco alternativo, reset, limpeza geral ou seed.

## Alterações

### Seletor desktop

ChoiceField recebe opção explícita anchored apenas no título da coluna desktop de MonthColumn. Menu compacto abaixo do título, sem ModalPortal, camada escura ou inert na página. Mantém menuitemradio, estado selecionado, foco inicial, setas/Home/End, Escape, Tab e clique externo. CSS próprio desktop-choice-anchor/menu.

MobileColumnMode, estrutura Data/Diário/Saldo, editor inline, gestos, indicadores e barra inferior não foram alterados. Os demais ChoiceField continuam com o comportamento anterior.

### Cartões: evidência e limites

Defeito identificado por inspeção e testes: quando havia snapshot da projeção, a atualização local pós-mutation era pulada por if (!seed). A lista ficava dependente de router.refresh e podia permanecer desatualizada. A lista agora é consultada após cada mutation confirmada, com sequência de leituras para descartar respostas antigas; falha nessa leitura é explicitamente “Alteração salva, mas a lista não pôde ser atualizada”, sem sugerir novo cadastro.

Logs Supabase mostram consultas de cartões e RPC create_credit_card com status 200 nos eventos observados. Existe refresh_token com HTTP 400 em 13/10/2026 17:45:17 UTC, e Worker GET / com stack incompleta no mesmo intervalo. Isso é indício de falha de sessão, NÃO prova de que causou o erro relatado em Cartões. Não foram observados erros de schema/RLS de cartões nos logs disponíveis. A causa histórica da primeira falha de carga/cadastro não pôde ser reproduzida nem atribuída com certeza.

Não houve mudança geral da autenticação nem retry cego de escrita. Erros de consultas registram somente código, sem payload financeiro. Falha de mutation distingue resultado incerto, bloqueia o formulário até recarregar e mantém a possibilidade de reconciliação. Locks impedem submits concorrentes.

Cadastro usa create_credit_card_once, com UUID estável por tentativa. Um digest do payload e o UUID são mantidos em sessionStorage; não se armazenam campos financeiros nesse mecanismo. Uma tentativa sem confirmação repetida com o mesmo payload, inclusive após fechar/reabrir na mesma sessão da aba, reutiliza o UUID. A função SQL serializa o mesmo usuário/UUID, retorna o cartão existente e chama a RPC atômica anterior apenas uma vez. Nome igual em cartões diferentes continua permitido. A proteção não garante deduplicação entre abas/aparelhos nem após perder sessionStorage: nessas situações é necessário conferir a lista após resultado incerto.

Faturas continuam com unicidade por usuário/cartão/competência. Resultado confirmado pela RPC deve trazer UUID válido; ausência dessa confirmação é tratada como incerta.

### Cancelamento mensal

Nova recurring_exceptions: chave primária (user_id, rule_id, mes_referencia), mês civil YYYY-MM, FK composta para regra do mesmo usuário, RLS com USING e WITH CHECK. Anônimo sem acesso. FK impede associar cancelamento a regra de outro dono, mesmo com user_id próprio.

Diálogo do Horizonte: “Somente este mês”, “Toda a recorrência” e “Cancelar”. Disponível nas lixeiras de entradas/saídas e na exclusão a partir do editor de regra. Toda a recorrência mantém a confirmação explícita e a exclusão integral existente. Excluir a regra remove suas exceções por cascade.

“Somente este mês” cancela todas as ocorrências da regra naquela competência. Em frequência mensal há uma ocorrência; em semanal/quinzenal, todas daquele mês são canceladas, como informa o diálogo. A competência continua cancelada ao editar vencimento, data inicial/final, quantidade ou frequência. Cancelamentos não são removidos por essas edições; se o período voltar a incluir o mês, ele permanece cancelado.

Exceções são carregadas do banco na projeção e incluídas no inputSnapshot. O motor as aplica antes de contabilizar o evento, afetando saldos, indicadores e Resumo Mensal a partir de uma única fonte. Não há filtro meramente visual, alteração de avulsas, extensão indevida de regras limitadas ou mudança de eventos dos meses adjacentes. Os saldos posteriores naturalmente refletem a ausência do valor cancelado.

## Backup e migração

Backup financeiro anterior à migração: backup-horizonte-20261013.json, salvo persistentemente, com sete tabelas completas, colunas, constraints, policies e definição da RPC anterior. Sem senhas/tokens. Contém dados pessoais financeiros e deve permanecer privado. É backup adequado às alterações aditivas desta sessão; não é dump completo de Auth/configuração nem ensaio de recuperação completa do projeto.

Migração aplicada com sucesso: migrations/007_recurring_exceptions_card_requests.sql, nome recurring_exceptions_card_requests. Incremental:

1. Índice único de identidade regra/proprietário.
2. Tabela recurring_exceptions, RLS, grants e FK.
3. Coluna nullable creation_request_id em credit_cards, índice único usuário/request e função SECURITY INVOKER create_credit_card_once. A RPC anterior foi preservada.

Nenhuma linha existente foi atualizada/deletada pela migração. Comparação exata contra o backup após testes: settings 2/2, transactions 8/8, recurring_rules 17/17, daily_budgets 13/13, daily_actuals 47/47, credit_cards 6/6 e card_invoices 20/20. Total: 113/113 preservados; em cartões a comparação considera as colunas originais.

## Validação

- Vitest: 277 testes em 39 arquivos passaram.
- TypeScript: tsc --noEmit passou.
- Lint GitHub: passou sem erros.
- Next 16.2.9 build --webpack: passou.
- Build Sites Vinext/Cloudflare: passou; runtime e adapter preservados.
- verify-hosted-auth e verify-hosted-css: passaram. Projeto público compilado é exclusivamente hsvjkbfpvmtnehjbwtgr.
- TypeScript do checkout hospedado: passou. Lint hospedado sem erros, um warning preexistente de navegação no login; autenticação não foi alterada.
- git diff --check: passou.
- DOM: menu desktop com teclado/foco/clique externo/Tab/Escape e ausência de modal/inert; seletor mobile anterior; diálogo mensal/integral; atualização da lista após salvar; sucesso + falha de leitura; resultado incerto; reaproveitamento do request UUID.
- Motor: entradas e saídas; outubro e dezembro preservados como eventos; novembro cancelado; Resumo e saldos; duplicação de exceções; edição de frequência/dia/período; regras limitadas sem extensão.
- SQL real sob ROLE authenticated, com identidades técnicas sem senha/sessão: dedup de exceções, persistência após editar regra, FK entre donos, leitura/exclusão cruzada bloqueadas, reatribuição bloqueada, anônimo bloqueado, replay idempotente de cartão, edição de fatura, atomicidade da RPC e exclusão integral/cascade. Suíte em scripts/validate-recurring-exceptions.sql, terminada com rollback.
- Persistência real entre chamadas: uma fixture nova foi commitada, lida em outra chamada SQL sob RLS e removida exclusivamente por UUID. Fixture retornada em scripts/fixtures/recurring-persisted.json; teste do motor confirma entradas [1200,0,1200] e saldos [1200,1200,2400].
- Encerramento de dados sintéticos: zero identidades técnicas restantes e zero exceções de teste.

Limites: não há control-browser disponível nesta sessão; nenhuma validação visual/interação no navegador autenticado ou novo login real foi executada. Tentativa de executar o antigo verify-mobile-table-layout encontrou Playwright ausente; não foi instalado nem foi iniciado servidor alternativo. Tests de DOM, build e SQL não substituem navegação real/relogin HTTP. Changelog Supabase em Markdown não pôde ser lido pela ferramenta web; documentação RLS atual foi consultada pelo conector.

## Publicação

Publicação autorizada exclusivamente no site atual, após os checks acima. Os identificadores finais de commit/version/deployment e o resultado nativo são registrados na entrega e no complemento final deste relatório.

Reversão de interface, se necessária: republicar a versão 17. A migração é compatível com a versão anterior e pode permanecer; não aplicar DROP de tabelas/colunas com dados nem apagar cancelamentos para reverter o front-end.

### Resultado final

- Publicação nativa: succeeded em 13/10/2026 19:02:02 UTC (16:02:02 em Fortaleza).
- Versão publicada: 18.
- Commit GitHub da implementação: cd1796499ce5abe15eb5d655d204dae8c1e4bc2b.
- Commit da fonte hospedada: 61f643c7c88c04040bb45e68afdcbf67e09b5232. Os arquivos de runtime alterados foram comparados byte a byte com a branch GitHub, sem diferenças; adapters de hospedagem são mantidos separados.
- Deployment: appgdep_6ace8013e118819180a5e4c55e7c8681.
- Version ID: appgprj_6acd25d8d4708191b849f052ba7532ba~appgver_e9ab03686dc081918103d4b9573f5c8c.
- Ambiente publicado: revisão 1, inalterada.
- URL publicada: https://horizonte-testes-autenticado.juliandersoncarmo.chatgpt.site.
- Push Git por linha de comando não tinha credencial de escrita GitHub; a mesma árvore validada foi sincronizada pelo conector GitHub. Tree SHA 202713589f465fb8b87e9af382f91fcd03391333 corresponde exatamente à árvore do commit local.
- O complemento de publicação é um commit apenas documental na mesma branch. Não exige novo build/deploy e não altera o runtime validado.
