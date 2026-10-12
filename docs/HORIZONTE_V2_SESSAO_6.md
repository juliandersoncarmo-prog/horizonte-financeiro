# Horizonte Financeiro — Sessão 6: integração e demonstração

## Continuidade verificada

Base remota `feat/horizonte-v2-resumo` = `6f0bd1fc22c4f59a0e3e80a784b1e54a303f8b6b`. `main` e backup remoto = `e4ba912f14db49b98b3e9129c27670b7bf050d48`. Nova branch: `test/horizonte-v2-integracao-preview`. Plano, relatórios 2–5, AGENTS.md e guia instalado Next.js de componentes cliente lidos. Sem alteração de main, merge, deploy do sistema financeiro, conexão ao banco real ou alteração de dados reais.

## Entrega navegável separada

Demonstração privada: https://horizonte-financeiro-demo-v2.juliandersoncarmo.chatgpt.site

Site novo e independente (`appgprj_6acc352b0a1c8191876eb16ef2012943`). A hospedagem Sites publica esse site privado separado; não é deployment do ambiente atual de Horizonte nem de uma branch Vercel. Source commit da hospedagem: `752dca1bed34127914fb89633be346cf96bdee90`. Fonte reproduzível em `preview/`, com build Vite separado e dependências/lockfile preservados.

Componentes reais Sidebar, LedgerView, modais, SettingsForm, ProjectionProvider; motor e monthSummary reais. Somente ações e navegação Next são substituídas no bundle demo por adaptador local. O produto Next não recebe bypass de autenticação nem rota pública demo. Banner permanente informa dados fictícios e armazenamento no navegador. Perfil da demo é fictício; removida identificação pessoal fixa da sidebar do produto e adicionada prop opcional de perfil. Ignorado preview-dist no Git/ESLint por ser saída compilada.

Cadastro/edição de avulsas e recorrências, saldo inicial, orçamento global, realizado do Diário (inclusive zero, edição e exclusão), cartões/faturas CRUD, resumo, navegação, temas e restauração de exemplos estão disponíveis. Não foi inventada exclusão individual de avulsas/recorrências, ausente na interface do produto. Adapter local não é validação das Server Actions ou do router.refresh autenticado. Dados não sincronizam entre dispositivos e devem continuar fictícios.

## Verificações

| Verificação | Resultado |
| --- | --- |
| npm ci --ignore-scripts --no-audit --no-fund | 441 pacotes; lockfile preservado |
| npm test | 112/112 em 10 arquivos, incluindo 5 cenários integrados novos |
| npx tsc --noEmit | Passou |
| npm run lint | Passou sem erros/warnings ESLint após excluir saída gerada |
| npm run build | Passou, Next.js 16.2.9 |
| Build estático demo | Passou, 61 módulos; aproximadamente 252 KB JS antes de gzip |
| git diff --check | Passou |
| Busca no bundle por Supabase/identificação pessoal fixa | Nenhuma ocorrência de URL Supabase, service_role, email/nome anteriormente fixos |
| Recuperação de código original | git archive do backup extraído em diretório temporário; motor recuperado idêntico ao blob original; refs verificadas |
| Navegador desktop/mobile, screenshots, temas interativos | Não executados nesta sessão |
| Supabase isolado, auth, SQL/RLS e isolamento de usuários | Não executados: indisponíveis |
| Backup/restauração de banco e E2E autenticado | Não executados: indisponíveis |

Novos testes combinam motor/resumo com mutações locais: zero/edição/exclusão do realizado e reversibilidade; serialização/releitura do estado fictício e falha de armazenamento; criação atômica, duplicata, edição e exclusão de cartão/fatura; âncora parcial, exclusão de movimentos anteriores, fevereiro bissexto/dia 31, recorrências e inclusão explícita no Diário; saldo negativo. Para todos os meses verificam continuidade, fechamento igual ao último saldo diário e discriminação igual ao total de saídas. Os 107 testes anteriores permanecem, incluindo mocks de autenticação/ownership/flags/queries/Server Actions; mocks não provam RLS efetiva.

Skill Sites exige control-browser no ambiente managed-linux; essa capacidade não estava disponível. Não foi iniciado servidor alternativo ou instalado navegador. Desktop mantém VISIBLE=4 e seletor central sincronizado; breakpoints existentes preservados. Demo acrescenta menu lateral recolhível no mobile. Claro/escuro usam tokens existentes. Inspeção estrutural e build não substituem validação visual/interativa. As verificações visuais das sessões anteriores não foram declaradas novamente como testes atuais.

Avisos informativos npm http-proxy, dependências transitivas antigas e plugin vite-tsconfig-paths permanecem; nenhuma atualização especulativa.

## Banco isolado e segurança: bloqueios concretos

Nenhuma variável SUPABASE/DATABASE/VERCEL, configuração isolada no checkout ou ferramenta Supabase conectada foi encontrada. Migrações 003/004 NÃO APLICADAS. Flags de servidor NÃO HABILITADAS. Não se consultaram credenciais de produção como alternativa. A demo estática não usa credenciais.

Para completar validação real falta um projeto Supabase explicitamente separado de produção, URL/project ref verificáveis, anon key, service role do projeto de testes (o legado ainda a exige), acesso administrativo para migrations/inventário e contas fictícias de dois usuários. Segredos devem ser configurados no ambiente seguro, nunca em Git ou no relatório. Falta um runtime Next isolado apontando somente para esse projeto.

Pendências reais: login/registro/recuperação/OAuth, reload com servidor, router.refresh/projection provider, CRUD com RLS, usuário A tentando IDs do B, anon, FK cruzada, unicidade e atomicidade RPC, SQL rollback com e sem dados, restore do banco e E2E de desktop/mobile/temas. Legado usa service role e algumas mutações não verificam linhas afetadas; reset segue sem transação global. A demo não resolve essas limitações e não há declaração de aptidão para uso real.

## Backup e rollback: preparação validada e limites

O backup remoto conserva somente código. Verificado que coincide com main original; arquivo do backup extraído e motor comparado com original. Recuperação segura em checkout separado: `git fetch origin` e `git switch -c recovery/horizonte-v1 origin/backup/horizonte-v1-2026-10-11`. Não executar reset/force push na main. Branch de Sessão 5 permanece referência para reverter somente esta sessão. Tag remota continua opcionalmente pendente; branch de backup já é permanente.

Rollbacks 003/004 revisados: BEGIN/COMMIT e bloqueios de remoção com registros novos. Não executados em PostgreSQL. Não desligar flags com realizações/faturas/marcações existentes: alteraria os saldos. Código V1 ignora semântica nova e não é rollback financeiro válido sem conciliação.

Ensaio obrigatório no projeto isolado: exportar schema/policies/rotinas e dados fictícios; registrar contagens e totais por usuário; restaurar em segunda base descartável; comparar IDs, referências, valores e projeções; aplicar 003/004 uma vez, testar bloqueio de rollback com registros e ausência de alterações após exceção. Depois testar rollback vazio em base descartável. Não usar resetAllData ou db:push como recuperação.

## Plano de publicação futura, dependente de aprovação do proprietário

1. Provisionar ambiente isolado e comprovar separação. Inventariar schema base e policies; guardar backup fora de Git e validar restauração.
2. Aplicar 003/004 apenas em testes; habilitar flags somente ali. Executar matriz de dois usuários/anon, E2E autenticado e regressão visual/financeira. Resolver falhas e limites do legado.
3. Revisar explicitamente conciliação de avulsas/regras antigas versus faturas e totais do Diário, sem associação automática por nome. Conferir efeito no histórico da data âncora, vencimentos e orçamento.
4. Preparar pacote exato com SHA, inventário de alterações e verificações antes/depois; obter aprovação explícita antes de qualquer implantação financeira real.
5. Após aprovação futura: backup de produção com restauração comprovada, janela e responsáveis definidos; schema aditivo, código com flags controladas, validação e habilitação gradual. Não ativar features antes do schema correto.
6. Se divergirem totais, aparecer acesso cruzado ou falhar persistência, suspender novas escritas e investigar. Recuperar por snapshot/restore ou código compatível com semântica V2 validado; preservar registros novos. Não ocultar despesas desligando flags.

Esta sessão autoriza somente desenvolvimento/testes e a demonstração fictícia separada. Produção financeira continua intocada.
