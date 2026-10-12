# Horizonte V2 — Sessão 13: usabilidade, exclusão e desempenho

## Continuidade e escopo

GitHub confirmou `fix/horizonte-css-modais-autenticado` em `3192b9665729deac916fc2ffacfd5d4f7429590f`. Lidos AGENTS.md, relatório 12 e integração 11. Nova branch `fix/horizonte-exclusao-desempenho`. Implementação: `c0996237b6b9142bdb2ed2c142c53602dbce00d7`.

Somente Supabase `hsvjkbfpvmtnehjbwtgr` e Site `appgprj_6acd25d8d4708191b849f052ba7532ba`. Main, backup, banco original e produção financeira não foram alterados. Nenhuma migração, ajuste de valores financeiros existentes, reset ou importação. Nenhuma notificação ou WhatsApp.

## Interface e exclusão

- DiarioModal não mostra `(global)`; competência específica permanece indicada. Identidade, persistência e aplicação mensal dos orçamentos preservadas.
- DayDetail não apresenta seção de previsão, realização ou diferença do Diário. Edição de realização continua no lápis da célula. Popup preserva entradas, saídas e acesso às faturas.
- Edição de avulsa oferece **Excluir lançamento**, confirmação de apenas aquele registro, erro legível e sucesso após resposta do banco.
- Recorrência oferece **Excluir regra recorrente**. Confirmação informa que todas as ocorrências geradas, passadas e futuras, desaparecem da projeção e do Resumo Mensal; avulsas permanecem. A ação exige `all-occurrences`. Não há botão nem simulação de exclusão isolada.
- Edição de recorrência continua informando que altera a regra inteira e recalcula ocorrências anteriores. Não foi criado histórico materializado ou mecanismo de exceções.
- Exclusões recebem somente ID, obtêm proprietário por `auth.getUser()`, usam cliente da sessão sujeito a RLS e filtros de ID e user_id, com `select('id')` para confirmar linha afetada. IDs inválidos, zero linhas, usuário ausente e falhas não produzem sucesso. Edição de avulsas/recorrências e edição/exclusão de orçamento também deixam de anunciar sucesso quando nenhuma linha corresponde.
- Exclusão de faturas/cartões permanece individual, com confirmação, RLS e filtros existentes. Cascade de faturas ao excluir cartão não foi modificado.

## Modais e feedback

Detalhes, edição e cartões reutilizam ModalPortal. Somente o portal superior trata Escape e Tab, impedindo fechamento simultâneo do popup inferior. Foco retorna ao gatilho; o fundo fica inert e com rolagem bloqueada. Linhas de eventos não são mais componentes recriados em cada render, preservando o botão que recebe o foco restaurado.

Travas síncronas bloqueiam duplo envio/exclusão, além dos botões desabilitados. Mensagens de falha mantêm o editor e seus valores. Diário mostra confirmação acessível e pequeno check após persistência. Cartões e edição mostram salvamento/atualização; orçamentos usam estado local após edição/exclusão confirmada. O timer de fechamento após cadastro é cancelado ao desmontar o modal, evitando fechar outro popup aberto depois. Temas, quatro colunas e navegação por teclado preservados. Desktop/celular visualmente não validados nesta sessão.

## Desempenho: causa e alterações

Inspecionados Next 16.2.9 instalado e implementação Vinext beta.5. `revalidatePath` em Server Actions pode gerar re-render da página; os componentes ainda solicitavam `router.refresh()`. No Vinext, a marca de revalidação condiciona a reconstrução RSC após a ação. Foram removidas as revalidações duplicadas das mutações financeiras abrangidas; os componentes mantêm **um refresh explícito após confirmação do banco**. Configurações/reset conservam o fluxo anterior, fora dessas mutações. Não há atualização otimista de valores antes do banco.

A projeção fornece também a lista de cartões da sessão. Gerenciador abre com esse snapshot e recebe a lista atualizada quando chega a projeção após refresh. Não faz consulta adicional ao abrir nem após mutação quando está dentro do provider autenticado. Fora do provider há fallback de leitura, inclusive na demonstração existente. Recarregar cartões continua sendo leitura real, sem simular uma mutação bem-sucedida.

`React.cache` memoiza settings e leitura de cartões somente no escopo do render/request; nenhuma cache financeira persistente ou compartilhada, Map global, localStorage ou service role foi criada. RLS continua ativa. Benefício da memoização no runtime hospedado ainda requer medição autenticada.

Logs reais mostraram prefetch de `/configuracoes` junto de refreshes. Desabilitado prefetch desse link; navegação continua funcionando. A página de Configurações lê settings diretamente, em vez de executar outra projeção e todas as consultas financeiras.

Motor: transações/faturas são indexadas uma vez por data, preservando ordem e matemática; regras sem limite por quantidade deixam de contar ocorrências desde o início a cada disparo. Regras com limite continuam usando a contagem existente, inclusive meses curtos e ocorrências anteriores à âncora. Diário, arredondamento, conciliação e saldos não foram reescritos.

## Tempos medidos

| Medição | Antes | Depois | Limite |
| --- | --- | --- | --- |
| Motor local, mesma fixture e processo; 9 execuções após aquecimento | mediana 187,57 ms; 177,66–268,03 ms | mediana 88,03 ms; 84,14–94,17 ms | 73 meses, 100 regras, 2.000 avulsas; não mede rede ou interface |
| Abrir cartões dentro do provider | uma Server Action adicional | zero leituras adicionais | comprovado em teste DOM; dados já vieram da projeção |
| Atualizar Diário/orçamento editado ou excluído | revalidatePath + refresh; orçamento ainda relido | um refresh; orçamento atualizado localmente | contagem do fluxo, não tempo de rede |
| Worker antes: addTransaction | 1.006 e 1.216 ms de wall time | não medido autenticado | dois pedidos reais preexistentes; CPU 265/291 ms |
| Worker antes: refresh principal | 828–1.225 ms | não medido autenticado | amostra de logs; inclui SSR, consultas e serialização |
| Worker antes: getAllDailyBudgets | 688 ms, CPU 32 ms | não medido autenticado | não é tempo isolado do SQL |

Comparação diferencial temporária executou fonte do commit base e fonte nova com fixture idêntica e verificou igualdade profunda de toda a projeção. O teste comparativo passou; arquivos temporários foram removidos. Benchmark novo reproduz a fixture em `scripts/benchmark-projection.test.ts`. Não usar execuções concorrentes da suíte/build para comparar CPU. Ganho na mediana comparável: aproximadamente 53%.

Logs consultados não tinham erros na amostra. Estatísticas Supabase disponíveis não separavam adequadamente consultas financeiras HTTP; não se atribui o atraso exclusivamente ao banco, nem se inventam tempos SQL ou resultados pós-publicação. Ainda existe custo de renderizar/serializar o horizonte completo; janela/streaming seria uma alteração maior e não foi adicionada.

## Consistência financeira

Quando hoje existe na projeção, Saldo Hoje usa exatamente o saldo desse dia no calendário. Antes, se hoje não existisse (por exemplo, âncora futura), o indicador utilizava saldo inicial como se fosse saldo de hoje. Agora mostra `—` e a data de referência; saldo inicial e lançamentos existentes permanecem intactos. Sem leitura dos valores pessoais para tentar corrigi-los, não se afirma que o R$ 0,00 da captura correspondia a esse caso específico.

Regressões verificam entrada recorrente de R$ 0,01, exclusão de uma avulsa mantendo outra, exclusão da regra em dois meses, remoção de cartão/fatura, saldos seguintes e composição das saídas no Resumo Mensal. Coberturas anteriores de edição, orçamento esgotado, zero explícito, âncora, conciliação e ausência de dupla contabilização continuam passando. Resumo agrega a mesma projeção atualizada, sem executar outro motor.

## Segurança e validação

Consulta real a pg_policies confirmou RLS por auth.uid(), USING e WITH CHECK nas sete tabelas. Nenhuma política foi alterada. Consulta posterior confirmou zero contas com os UUIDs exclusivos da fixture desta sessão.

A tentativa de regressão SQL transacional (fixtures novas, BEGIN/ROLLBACK, nenhum alvo financeiro existente) retornou **Invalid or expired requestState** no conector. Portanto esse teste **não é declarado aprovado**; a consulta posterior não comprova execução da suíte. Não houve tentativa de contornar a falha com credencial privilegiada. Isolamento e exclusão estão cobertos nas regressões locais com Supabase simulado, além da inspeção real de RLS; dois logins reais continuam sem validação nesta sessão.

| Check | Resultado |
| --- | --- |
| npm test | 181/181 em 24 arquivos |
| npx tsc --noEmit | aprovado |
| npm run lint | aprovado sem avisos no estado final |
| npm run build | aprovado, Next 16.2.9 |
| Build hospedado | aprovado, Vinext beta.5/Cloudflare |
| CSS hospedado | aprovado; fontes layout/globals iguais e tokens/utilitários nos assets |
| Testes DOM adicionais | exclusão/confirmar/cancelar, falha, duplo clique, regra inteira, Escape/foco e cartões com snapshot |
| Navegador autenticado/mobile e latência pós-publicação | não executados |

A skill Sites determina: “If `$control-browser` is unavailable, skip browser QA: do not start a preview server, install a browser, or improvise another browser-control path.” Control-browser não está disponível. Testes DOM, HTTP e publicação não substituem E2E autenticado. O changelog Supabase em Markdown foi solicitado, mas o leitor web recusou o content-type; documentação oficial RLS consultada, sem upgrade de SDK.

## Publicação exclusiva de testes

Source Sites: `7fe2e799ab7e03a9e53887dc409527023b224b66`.
Deployment: `appgdep_6acd3abf1eb08191bc1e9d2f37fa788d`, **succeeded**.
Versão: `appgprj_6acd25d8d4708191b849f052ba7532ba~appgver_4d8596d989e481919baa3a94d3777a51`.
Ambiente revisão 1, acesso owner-private preservado.
URL: https://horizonte-testes-autenticado.juliandersoncarmo.chatgpt.site

Checkout Sites preservou starter/Vinext e matcher hospedado. Installer foi corrigido para o helper pnpm existente: packageManager era pnpm, mas install:ci ainda chamava script npm e falhava por flags/lockfile incompatíveis. Nenhuma alteração de dependências do projeto financeiro. Credencial temporária de source foi renovada após expirar; sem persistência no código.

Para continuidade: usar esta branch e o HEAD mais recente (commit do relatório posterior ao commit de implementação). Validar na própria conta fictícia com dados novos: cadastrar pequena avulsa, editar, excluir confirmando/cancelando; regra nova com pequeno valor e exclusão inteira; fatura nova excluída individualmente; conferir calendário e resumo antes/depois. Não excluir dados preexistentes para testar. Recarregar a página após publicação para obter o bundle novo.

Verificação HTTP posterior: `/login` retornou 401, “Sign in required”, em 5,49 s, usando a autorização Sites mantida em memória desde o início. É a barreira externa Sites; não prova falha do login Supabase nem entrega do HTML/CSS nessa requisição. Nenhuma credencial do usuário foi solicitada ou sessão Supabase reutilizada. A publicação succeeded foi confirmada pela ferramenta nativa; E2E autenticado permanece pendente.
