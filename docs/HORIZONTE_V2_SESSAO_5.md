# Horizonte Financeiro — Sessão 5: Resumo Mensal

## Continuidade e proteção

Estado remoto verificado: Sessão 4 `feat/horizonte-v2-cartoes` em `860ee6a0e07b18af1daad0d9c0334a7f8766e050`, implementação `03e5855`. `main` e `backup/horizonte-v1-2026-10-11` continuam em `e4ba912f14db49b98b3e9129c27670b7bf050d48`. Plano e relatórios 2/3/4 lidos, junto a AGENTS.md e documentação instalada Next.js de componentes servidor/cliente.

Nova branch `feat/horizonte-v2-resumo`, criada exatamente do SHA da Sessão 4. Nenhum merge, deploy, alteração de main, banco real, flags, credenciais, dependências ou lockfile. Push HTTPS indisponível por ausência de credenciais; publicação dos arquivos/commit feita pelo conector GitHub. Os SHAs são informados na entrega e no histórico, evitando referência circular neste arquivo.

## Implementação

- Item **Resumo Mensal** na sidebar abre popup, sem mudar a rota.
- Mês/ano com setas independentes das quatro colunas do calendário. Abre no mês atual de America/Fortaleza, ou no primeiro mês disponível. Navegação limitada à mesma projeção do calendário; anterior/posterior desabilitados nos limites.
- Saldo de abertura, entradas, saídas, resultado mensal e saldo final projetado. Resultado positivo verde, negativo vermelho e zero neutro. Texto explica que saldo final também inclui abertura.
- Mês da âncora no meio do mês identificado como parcial, com data inicial e definição da abertura. Não se inventa saldo anterior à referência.
- Saídas discriminadas em avulsas, recorrentes, cartões, Diário previsto e Diário realizado. O Diário realizado (inclusive zero) substitui o previsto. Eventos declarados incluídos no Diário são excluídos do detalhamento separado.
- Avulsas, recorrentes e faturas não têm status de pagamento no modelo; são rotuladas sem inventar confirmação de realização. Faturas são totais informados.
- Escape, contenção de Tab/Shift+Tab, foco inicial/restauração, labels das setas e anúncio do mês. Popup limitado à tela, rolagem vertical, temas existentes.

## Fonte única e atualização

A carga já existente de `getProjectionData` foi movida da página para o layout autenticado. `ProjectionProvider` distribui **o mesmo objeto ProjectionResult** ao calendário e popup. O motor financeiro não foi alterado. As quatro colunas, seletor, KPIs, controles, CSS e navegação principal não foram redesenhados.

A janela continua até dezembro do ano atual + 5; a data inicial usa America/Fortaleza. Todos os meses anteriores desde a âncora continuam calculados para continuidade. Configurações agora também depende dessa leitura financeira do layout; erro de consulta interrompe a renderização em vez de mostrar saldos vazios. Não foi adicionada consulta financeira no browser nem segunda Server Action.

`monthSummary` somente agrega em centavos os eventos e parcelas **já calculados** para apresentar a discriminação. Totais, abertura e fechamento são diretamente MonthResult; resultado é a diferença dos dois totais fornecidos. Não reaplica recorrências, âncora, vencimentos ou redistribuição do Diário. `router.refresh` existente após mutações atualiza o provider do layout, mantendo a seleção por competência no popup quando disponível. Essa atualização real com banco/auth permanece pendente de E2E isolado.

Duplicações legadas continuam exigindo conciliação explícita: o resumo não identifica automaticamente avulsa e fatura iguais, nem remove registros antigos. Histórico segue projetado, sem snapshots.

## Banco isolado

Não foram encontradas configurações/credenciais isoladas no checkout ou variáveis disponíveis, nem ferramentas Supabase conectadas. Não se procurou banco real como substituto. `003_diario_inteligente.sql` e `004_cartoes.sql` continuam preparadas e **não aplicadas**. Nenhuma flag foi ativada.

SQL, RLS, autenticação real e persistência integrada continuam **NÃO VALIDADOS**. As regressões de Server Actions com Supabase simulado das sessões anteriores continuam passando; não equivalem a testes no banco.

## Validação

| Verificação | Resultado |
| --- | --- |
| npm test | 107/107, 9 arquivos (99 anteriores + 8 cenários novos) |
| npx tsc --noEmit | Passou |
| npm run lint | Passou |
| npm run build | Passou, Next.js 16.2.9 |
| git diff --check | Passou |
| Chromium com fixtures sintéticas | Desktop 1440x900 e mobile 390x844; temas claro/escuro passaram |
| Supabase isolado / E2E autenticado | Pendente: ambiente indisponível |

Testes novos: resultado positivo/negativo/zero, resultado distinto do saldo final, continuidade abertura/fechamento, fechamento igual ao último saldo diário, soma por origem igual ao total de saídas e ao calendário, previsto/realizado/zero, faturas, exclusão de avulsas/recorrentes incluídas no Diário, centavos, fevereiro normal/bissexto, mês parcial e virada anual.

Fixture temporária Vite renderizou Sidebar, provider, calendário e popup reais, substituindo Server Actions/router por stubs sem rede financeira. Verificados abertura pela sidebar, setas anterior/posterior, dezembro/janeiro, Escape, retorno de foco, dimensões do dialog dentro da viewport e ausência de erros JavaScript. Screenshots desktop claro e mobile escuro inspecionados visualmente; ambas as combinações de dimensão/tema capturadas. Fixture removida antes do commit. Não é prova de autenticação/persistência nem E2E de produção. Avisos npm http-proxy e Vite tsconfigPaths preexistentes permanecem.

## Sessão 6 — validação integrada e implantação segura

1. Verificar HEAD remoto desta branch, ler plano e relatórios 2–5. Preservar main e backup. Revisar automações externas de preview e credenciais antes de eventual deploy.
2. Disponibilizar Supabase separado, comprovar separação por project ref/URL e credenciais, inventariar schema/policies. Aplicar 003/004 somente nele com fixtures e backups restauráveis; habilitar flags somente no servidor de testes.
3. Testar dois usuários/anon: autenticação, RLS de CRUD, vínculo cruzado de faturas, unicidade e atomicidade da RPC. Testar persistência após reload e recuperação de falhas.
4. E2E Diário + cartões + avulsas/recorrências + resumo/calendário: criar/editar/excluir, zero, atualização do provider após refresh, mudança de configurações, temas/mobile e limites de navegação. Revisar conciliação do legado com o proprietário.
5. Validar exportação/restauração e rollback em testes. Não desligar flags com realizações/faturas existentes: ocultaria despesas. Rollbacks SQL bloqueiam descarte com dados novos. Código antigo ignora tabelas novas e requer conciliação para manter equivalência financeira.
6. Preparar plano concreto de implantação: backup de dados, checklist de migração, verificações financeiras antes/depois, ordem de schema/código/flags e gatilhos de recuperação. **Implantação em produção depende de aprovação explícita do proprietário.**

O backup remoto é de código, não de dados. A tag remota segue opcionalmente pendente; a branch permanente preserva a versão original.
