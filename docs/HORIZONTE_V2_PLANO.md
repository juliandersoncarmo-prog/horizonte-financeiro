# Horizonte Financeiro — Plano V2 / Sessão 1

## Escopo e referências verificadas

Auditoria em 11/10/2026 (America/Fortaleza). Repositório: juliandersoncarmo-prog/horizonte-financeiro.
Nenhuma das cinco funcionalidades V2 foi implementada nesta sessão.
Nenhum deploy, merge, alteração de main ou acesso ao banco real foi realizado.

- main original: e4ba912f14db49b98b3e9129c27670b7bf050d48.
- Árvore original: 35a4914afca303006fd1fbdf620c4d39a3ffdd70.
- Branch de trabalho: chore/horizonte-v2-auditoria, criada desse SHA.
- Tag LOCAL: backup/horizonte-v1-2026-10-11, apontando para o mesmo SHA.
- Branch de backup REMOTA: backup/horizonte-v1-2026-10-11, apontando para o mesmo SHA.
- Pendência: publicar a tag no GitHub. O push HTTPS falhou por ausência de credencial no terminal; o conector GitHub disponível cria branches/commits, mas não tags. A branch remota de backup preserva o código enquanto essa pendência permanece.
- O commit desta sessão contém este documento e apenas três inclusões de transactions: [] nas fixtures dos testes. Seu SHA é consultável no histórico da branch; não é embutido aqui para evitar referência circular.

Histórico encontrado (mais recente primeiro):
e4ba912 validação de variáveis Supabase; b071b06 proxy Next.js 16 e anon key;
760aee3 sidebar; cd6b5ec autenticação; bfbd095 saldo inicial e recorrentes;
c798919 navegação de cinco anos; 0d4db0d integração banco/motor;
d6b93bf motor e interface; e8bc203 inicialização.

A API informou repositório público e main sem proteção. Não alteramos visibilidade ou proteções.
Não há workflows versionados de CI ou configuração Vercel específica nesta árvore.
Não se pode concluir quais automações externas existem; antes de futuros pushes de código, verificar se branches de preview têm variáveis/credenciais isoladas.

## Arquitetura real

Next.js 16.2.9, React 19.2.4, TypeScript estrito, Tailwind 4 e Vitest 4.
Node local 24.19.0 / npm 11.9.0. package-lock.json preservado.

- app/(app)/page.tsx carrega a projeção; layout monta sidebar; /configuracoes contém apenas reset.
- app/actions.ts autentica por auth.getUser(), consulta dados e executa mutações.
- lib/engine/projection.ts é motor puro; tipos de entrada/saída em types/index.ts.
- lib/db/schema.ts define quatro tabelas e enums via Drizzle, mas as queries em execução usam Supabase JS, não Drizzle.
- lib/supabase/server.ts e client.ts usam @supabase/ssr com cookies.
- proxy.ts atualiza sessão e restringe rotas; callback troca código por sessão.
- Login, registro, recuperação, redefinição e OAuth Google estão presentes no código.
- lib/supabase/service.ts usa service role e ignora RLS; toda autorização depende do servidor obter user_id da sessão e filtrar cada operação.
- scripts/test-db.ts lê dados de todos os usuários com service role: não executar no banco real durante desenvolvimento.
- lib/db/seed.ts apenas exporta fixtures; não contém execução de inserções.
- Não há migrations SQL ou políticas RLS versionadas. Schema Drizzle não comprova schema/policies efetivos do Supabase.
- Variáveis necessárias: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY; DATABASE_URL apenas para ferramentas Drizzle. Valores não foram obtidos nem registrados.

## Interface a preservar

LedgerView define VISIBLE = 4: quatro cartões mensais no desktop, dois em sm e um abaixo de sm.
MonthColumn mantém grid Data / seletor Diário-Entradas-Saídas / Saldo.
Seletor é sincronizado pelo estado mode no LedgerView.
Preservar essas estruturas, tokens claro/escuro, cores dos saldos, dimensões, navegação por mês/ano e modal diário.
Novos gerenciadores devem abrir em popup pela sidebar. Não substituir a página principal por outra organização.
Não houve alterações em componentes ou CSS nem validação visual autenticada nesta sessão.

## Motor: achados e decisões propostas

1. Saldo inicial: runProjection extrai apenas ano/mês da data_ancora e começa no dia 1. Isso aplica gastos/eventos anteriores à âncora. getProjectionData recebe startDate, mas não usa essa data para selecionar a janela do motor; o horizonte é contado desde a âncora. Recalcular o fim do horizonte desde a âncora para não truncar a navegação quando ela for antiga.
2. SettingsForm existe, mas não está montado em nenhuma página. Data é readOnly e valor exige mínimo zero, impedindo saldo inicial negativo. saveSettings faz upsert de settings.
3. Recorrências mensais exigem day === dia_do_mes: dia 31 desaparece em fevereiro/abril. modo ocorrencias conta meses, não disparos reais, incorreto para semanal/quinzenal/unico e meses sem disparo. Quinzenal usa dia e dia+15; segunda ocorrência além do fim do mês desaparece. modo horizonte não tem tratamento específico.
4. Diário: soma todos os daily_budgets em todos os meses, ignorando mes_referencia. Coluna nullable no schema diverge do tipo string. Modal divide por 30, motor pelo número real de dias.
5. Não existe vínculo entre orçamento diário e transação realizada: registrar despesa pode somar gasto real e previsto. Não existe status de realização, confirmação de zero gasto ou conciliação de ocorrência.
6. Edição da regra altera também projeções passadas quando recalculadas. Não existe snapshot do histórico realizado.
7. Cartões não têm tabela/identidade/fatura: são descrições genéricas de despesas.
8. MonthResult já calcula totais e saldos necessários para o resumo; evitar um segundo motor para o popup.
9. Datas misturam horário local e UTC; isToday depende do relógio. Valores são number com precisão binária, apesar de numeric no banco. Prever relógio injetável, datas civis determinísticas e cálculos em centavos antes de ampliar o motor.

Decisões de produto para implementação, sujeitas a validação com exemplos:
- Saldo de abertura significa saldo imediatamente anterior aos movimentos do dia da âncora. Dias anteriores não recebem saldo inferido a partir desse valor. Não converter configurações existentes silenciosamente.
- Mensal em dia inexistente vence no último dia válido, voltando ao dia original no mês seguinte. Ex.: 31/01, 28/02, 31/03; em ano bissexto, 29/02.
- Contar ocorrências desde data_inicio, inclusive quando anteriores à janela visual. Aplicar início/fim à data efetiva ajustada. Não alterar frequência semanal/quinzenal sem explicitar e testar sua regra.
- Orçamentos sem mes_referencia são padrões globais; orçamentos com referência valem só naquele mês. Não somar registros de meses diferentes. A regra de sobreposição global/mensal deverá ser expressa, sem inferir identidade apenas pela descrição.
- Diário realizado deve ser confirmado explicitamente, inclusive valor zero. Data passada sem confirmação não significa realização. Previsto cinza; realizado escuro com contraste em ambos os temas.

## Proteção de dados e rollback

Backup de código não é backup de dados. A tag/branch preserva somente a versão do repositório.
Nesta sessão não se leu/exportou o banco financeiro real, não se executou reset, seed, db:push, generate ou migrate.
Antes de qualquer migração futura, realizar backup com meios adequados do ambiente de banco, validar restauração em ambiente isolado e inventariar schema, constraints, RLS e volumes, sem inserir dados financeiros em Git.
Usar fixtures sintéticas e Supabase de desenvolvimento separado. Nunca ligar preview ao banco real com service role.

- Preservar IDs, user_id, datas, valores e descrições existentes.
- Migrações aditivas e compatíveis: novas tabelas/campos nullable ou default seguro; evitar DROP, TRUNCATE, renomeações e reinterpretação automática.
- Servidor valida valores finitos, datas válidas, tipo, limites e identidade. user_id vem da sessão, nunca do formulário.
- Testar isolamento com dois usuários em banco de teste. RLS real permanece NÃO VERIFICADO.
- Remover logs de saldos/regras/dados pessoais antes de evoluir rotas; queries atualmente transformam falhas em null/[], confundindo indisponibilidade com ausência de dados.
- resetAllData ignora erros retornados e faz quatro deletes sem atomicidade. Não usar como rotina de desenvolvimento; corrigir separadamente quando necessário.
- Manter frontend antigo apto a ler o schema após migração; funcionalidades novas sob flags até validação.
- Diário realizado e faturas devem persistir de modo compatível com saldo antigo ou com procedimento explícito de conciliação. Só desligar flags não garante rollback financeiro se a versão antiga ignorar novas tabelas.
- Não converter despesas/cartões existentes automaticamente. Mapear por ação explícita, com referência de origem e proteção contra cobrança duplicada.

Recuperação do código em checkout separado:
git fetch origin
git switch -c recovery/horizonte-v1 origin/backup/horizonte-v1-2026-10-11

Após publicação da tag, também será possível checkout pelo nome da tag.
Não usar reset --hard na main nem force push. Voltar produção exige uma sessão específica de deploy autorizada; não é ação desta auditoria.
Publicar tag quando houver canal Git autenticado:
git tag backup/horizonte-v1-2026-10-11 e4ba912f14db49b98b3e9129c27670b7bf050d48
git push origin refs/tags/backup/horizonte-v1-2026-10-11
Se já existir, verificar SHA antes de prosseguir; não sobrescrever tag.

## Plano por sessões

### Sessão 2 — base de cálculo: saldo inicial e recorrências

Continuar do HEAD de chore/horizonte-v2-auditoria, verificando main e backup antes de criar feat/horizonte-v2-motor.
Resolver pendência da tag se existir ferramenta autenticada; branch remota de backup já fornece recuperação.

1. Criar cenários de regressão ANTES das correções: âncora no meio do mês, saldo negativo/zero, movimentos antes/na/depois da âncora, continuidade entre meses e horizonte com âncora antiga.
2. Fixar semântica da âncora e ajustar motor/horizonte; integrar formulário existente sem remodelar o painel. Evitar migração para essas duas correções.
3. Implementar ajuste de vencimento mensal e contagem por ocorrências reais; testar dias 28–31, fevereiro normal/bissexto, dezembro/janeiro, início/fim e frequências existentes.
4. Introduzir datas civis determinísticas/relógio de teste e política de arredondamento que conserve centavos.
5. Sanear logs e tratamento de erros relevantes; corrigir lint preexistente sem desligar regras.
6. Executar testes, tipos, lint, build e verificação visual com fixtures; documentar exemplos antes/depois. Commit por alteração coesa. Não publicar em produção nem modificar banco real.

### Sessão 3 — diário inteligente

Normalizar orçamento global versus mensal; alinhar divisor do modal ao mês.
Proposta: tabela de realização diária com user_id, data, valor em numeric, confirmação explícita e vínculo opcional a transações.
Definir uma única origem de contabilização: realizado substitui previsto para o dia confirmado; não somar novamente transação vinculada. Não vincular despesas por texto.
Testar dias sem gasto, zero confirmado, gasto acima/abaixo do previsto, edição, exclusão e mudança de mês.
Manter coluna central e seletor; diferenciar apenas valor/estado/cor. Persistência será preparada/testada em banco isolado.

### Sessão 4 — cartões por faturas mensais

Proposta: cards e card_invoices com user_id, card_id, competência YYYY-MM, vencimento, valor previsto/real e status.
Unicidade por usuário/cartão/competência; integridade entre proprietários. Uma fatura gera uma saída na data de vencimento, uma única vez.
Gerenciador simples em modal: cartão + competência + vencimento + total, sem compras item a item ou parcelas automáticas nesta fase.
Não interpretar qualquer transação contendo “cartão” como fatura. A conciliação de registros antigos deve preservar origem e prevenir duplicação.
Testar várias faturas/cartões, meses curtos, confirmação, edição, cancelamento e compatibilidade da versão antiga.

### Sessão 5 — Resumo Mensal

Adicionar ícone/botão na sidebar e popup com mês anterior/seguinte independente da janela das quatro colunas.
Compartilhar dados de projeção via provider na área autenticada ou uma Server Action existente, sem duplicar fórmulas ou abrir queries no browser.
Mostrar saldo inicial/final, entradas, saídas e separação previsto/realizado quando disponível; totais conciliam com o motor.
Testar fronteiras do horizonte, loading/erro/vazio, atualização após mutação, Escape, foco, labels acessíveis e temas.

### Sessão 6 — validação integrada

Teste ponta a ponta em ambiente separado: autenticação, isolamento, cadastro/edição, conciliação, resumo, regressão visual e recuperação do código/dados.
Revisar rollout e rollback em ambiente de teste antes de qualquer decisão de produção.

## Verificações desta sessão

| Verificação | Resultado |
| --- | --- |
| npm ci --ignore-scripts --no-audit --no-fund | 441 pacotes instalados; lockfile sem alteração |
| npm test, original | 5 passaram / 12 falharam: fixtures sem transactions |
| npx tsc --noEmit, original | 3 erros nas mesmas fixtures |
| Correção preparatória | Apenas transactions: [] nas três entradas de teste incompletas |
| npm test, corrigido | 17/17 passaram |
| npx tsc --noEmit, corrigido | Passou |
| npm run lint | 3 erros e 1 warning preexistentes; não foram desativadas regras |
| npm run build | Passou; rota / dinâmica; mensagens de tentativa de prerender capturadas pelo catch |
| Banco/Auth reais | Não exercitados; nenhuma credencial real usada |
| Layout em navegador autenticado | Não exercitado; inspeção estrutural apenas |

Lint pendente: DiarioModal.tsx:39 e Sidebar.tsx:21 (set-state-in-effect); LedgerView.tsx:27 (use-memo); tailwind.config.ts:3 (warning de export anônimo).
Build usa mensagens Dynamic server usage porque o catch de getProjectionData intercepta a sinalização do Next; sucesso de build não comprova autenticação nem integração Supabase.
Testes atuais cobrem continuidade, eventos, dias de fevereiro, regra única, término por data e faixas de cores; não cobrem os defeitos auditados. Portanto 17/17 não significa que as novas regras estejam implementadas.
Avisos locais: configuração npm http-proxy; dependências transitivas obsoletas; plugin vite-tsconfig-paths redundante. Nenhum upgrade especulativo feito.
