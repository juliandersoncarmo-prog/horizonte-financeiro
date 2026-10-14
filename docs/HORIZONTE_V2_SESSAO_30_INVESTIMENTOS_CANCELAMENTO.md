# Sessão 30 — Investimentos e cancelamento por competência

Data: 14/10/2026. Branch: feat/horizonte-investimentos-cancelamento.

## Continuidade

HEAD real main: e4ba912f14db49b98b3e9129c27670b7bf050d48; branch fix/horizonte-auth-urgente em b2b709314dee4a3a4f8f62995011532c9aa8be41, base desta entrega. Relatórios sessões 28 e 29 lidos. Fonte Sites d50f567a534d3cbcadaee44d1192fbba7b945010, versão 19, deployment succeeded, confirmados antes de editar e novamente ao retomar após interrupção.

Site exclusivo: https://horizonte-testes-autenticado.juliandersoncarmo.chatgpt.site . Projeto Sites appgprj_6acd25d8d4708191b849f052ba7532ba. Supabase exclusivo horizonte-testes / hsvjkbfpvmtnehjbwtgr. Nenhum ambiente alternativo criado; main, backups e produção antiga preservados. Auth, configurações e identidades existentes não foram alterados.

## Investimentos

Terceiro tipo investimento na enum, modelos, validação de cadastro e motor. Avulsos e recorrentes podem ser criados, editados e excluídos/cancelados pelos fluxos existentes. Sidebar e menu + incluem Novo investimento; opções anteriores mantidas. Seletor desktop/mobile contém Investimentos; valores e eventos usam azul/accent. Resumo Mensal mostra a rubrica separada.

Saldo final = abertura + entradas - saídas - investimentos. Investimentos nunca aumentam Saídas do Mês, não são consumo nem conciliação do Diário. Motor desconta todo investimento uma única vez; constraints impedem novo investimento com incluido_diario=true. Cartões, Diário, editor inline, dimensões/tipografia da tabela e gestos preservados. Nenhum lançamento anterior foi reclassificado. Sem carteira, cotação ou rentabilidade.

## Cancelamento

Somente este mês utiliza recurring_exceptions existentes e alcança todas as ocorrências do mês civil, inclusive semanais e quinzenais. Deste mês em diante utiliza recurring_endings, preservando a regra e todos os eventos anteriores à competência de corte. Corte independente de frequências e término editáveis; RPC SECURITY INVOKER faz upsert com least, impedindo que pedidos repetidos com meses posteriores reabram a regra. RLS de leitura/escrita com auth.uid e FK composta verificam o dono. Anônimo não tem acesso. Regra não é excluída no fluxo normal; endpoint antigo de exclusão integral agora recusa clientes antigos com orientação para recarregar.

Diálogo compacto com título Cancelar recorrência?, nome e competência dinâmica, cartões verticais azul/vermelho com área inteira clicável, chevron, Voltar de largura inteira e texto secundário solicitado. Segunda etapa confirma antes da persistência. ModalPortal mantém foco, Tab, Escape e bloqueio do fundo. Loading/erro e lock impedem duplicação; após resultado incerto o diálogo exige recarregar para conferir antes de nova tentativa. Confirmação recebida dispara atualização da projeção.

## Backup e migrações

Backup privado: backup-horizonte-20261014-investimentos.json, 135283 bytes; SHA256 4b04732fa982a6e2c20017c4c8fb75948556fd3788bc77c901fef9e6ec523c24. JSON verificado; contém oito tabelas completas, colunas, constraints, políticas, enums e definições das funções públicas. Persistido antes das migrações. Não contém senhas/tokens; não é dump de Auth/configuração nem ensaio completo de recuperação.

Aplicadas separadamente para respeitar commit da enum:

- 008_investment_type.sql / investment_type: ADD VALUE investimento.
- 009_recurring_endings.sql / recurring_endings: tabela, FK, RLS, grants, RPC e checks NOT VALID sobre novas escritas. Sem atualizar/apagar registros existentes.

Comparação exata após migrações e após limpeza: settings 2, transactions 8, recurring_rules 17, daily_budgets 13, daily_actuals 47, credit_cards 6, card_invoices 20, recurring_exceptions 0. Todos os 113 registros originais idênticos. Zero encerramentos ou identidades de teste restantes. Sem reset ou seed.

## Validação

Vitest cobre aportes avulsos/recorrentes, edição/exclusão, despesas/Diário/faturas sem duplicação, saldos/Resumo, cancelamento mensal e corte, preservação anterior, mensal/semanal/quinzenal, serialização, leitura posterior do banco, confirmação final, botões verticais, foco/Escape, loading, erros e lock. Asserções antigas de exclusão integral e quatro métricas foram atualizadas para o comportamento novo.

TypeScript, lint GitHub, Next build --webpack, TypeScript hospedado, lint hospedado, Sites Vinext build, verify-hosted-css, verify-hosted-auth e diff --check passaram. Lint hospedado conserva um warning anterior sobre window.location.assign do login. Verificador confirma chave pública do Supabase correto no bundle cliente e servidor; ambiente recebido por stdin, sem segredos em argumentos/arquivos. Nenhum service_role no cliente.

SQL real: investimento create/edit/delete, check de conciliação, RPC de corte e replay, preservação após editar frequência; RLS impede leitura cruzada e FK impede encerrar regra de outro dono; tabela/RPC bloqueadas para anon. Fixtures sem senha/sessão; maioria em transação rollback. Uma regra/exceção/corte foi commitada, lida em outra chamada sob RLS, usada em teste do motor, e removida exclusivamente por UUID e descrição técnica. Fixture sanitizada: scripts/fixtures/investment-persisted.json.

O script completo de SQL sofreu erro de transporte requestState e não é alegado como execução integral; verificações foram executadas em blocos menores. Benchmark DOM anterior atingiu timeout de 5s sob carga: rodada final usa limite de 20s, mantendo suas asserções e sem modificar o produto.

Supabase changelog e documentação RLS consultados. Aviso de minor Postgres refere-se a extensões/índices/cifras não alterados nesta entrega. Security advisor não apontou problema de RLS/função; somente aviso existente de proteção de senha vazada desabilitada, sem alteração de Auth.

Limites: control-browser indisponível; não iniciou preview alternativo, não instalou navegador. Responsividade verificada por estrutura/estilos e testes DOM, não por captura visual de dispositivo. Não executou login real com senhas das contas. Builds e SQL não substituem validação visual autenticada.

## Publicação e reversão

Publicação somente no Site atual após os checks. Identificadores finais de commit, versão e deployment são registrados na entrega. Se necessário, restaurar a versão 19 da interface; manter as migrações aditivas e todos os dados. Versão antiga ignora cortes/investimentos e não deve ser utilizada para registrar novos dados após a adoção da funcionalidade.
