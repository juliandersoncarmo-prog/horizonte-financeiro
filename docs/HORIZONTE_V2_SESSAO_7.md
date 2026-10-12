# Horizonte Financeiro — Sessão 7: refinamentos e primeiro acesso

## Continuidade verificada

Em 12/10/2026, GitHub e `git ls-remote` confirmaram a Sessão 6 em `test/horizonte-v2-integracao-preview`, SHA `8c26b58f32854689d4496553dec97cf2ddeb36d4`. Nova branch exclusiva: `feat/horizonte-v2-refinamentos`, derivada desse commit. O checkout antigo da Sessão 6 ainda tinha alterações staged; ele foi preservado. Esta sessão usa um checkout separado e a versão remota consolidada, sem duplicar aquelas alterações.

Plano, relatórios anteriores, AGENTS.md e documentação instalada do Next.js 16 sobre componentes cliente e error boundary foram consultados. `main` e `backup/horizonte-v1-2026-10-11` permanecem em `e4ba912f14db49b98b3e9129c27670b7bf050d48`.

## Implementação

### Diário

O valor central abre editor dentro da célula, sem modal. Enter salva e Esc cancela antes da gravação. Campo vazio + Enter exclui o realizado; zero é um valor explícito. Tooltip explica os atalhos e a exclusão. Usa `saveDailyActual` existente e `router.refresh`, sem segundo cálculo financeiro. Travamento síncrono impede Enter repetido durante a requisição. Falhas de validação/comunicação ficam junto ao campo, que permanece aberto para correção.

Mantidos grid `72px / 1fr / 96px`, linhas `h-9`, editor `h-7` com `min-w-0`, quatro colunas desktop, seletor intacto e cores por estado: previsto em `text-text-3`, realizado em `text-text`. Data é botão acessível para o modal completo; demais áreas da linha também abrem o modal. Evitada estrutura HTML de botão dentro de botão.

### Cartões

Quantidade inicialmente vazia; campos surgem imediatamente ao informar quantidade válida (1–60), sem “Preparar faturas”. Competências exibidas por extenso, incluindo lista de faturas existentes. Aumento conserva valores por competência; diminuição, limpeza da quantidade ou mudança do primeiro mês pedem confirmação quando descartariam algum valor, inclusive zero. Cancelar mantém o rascunho anterior. Valores novos começam vazios, nunca em zero automaticamente.

Mantidos CRUD e Server Actions, vencimentos, competência única e cálculo existente. Acrescentado bloqueio síncrono de mutações repetidas. Não há cadastro de compras individuais.

Nenhum cartão fictício é importado/inserido automaticamente no produto autenticado: fixtures ficam no seed não executado e na demonstração independente. A remoção de registros já existentes no banco real não foi executada, pois esta sessão proíbe modificar esse banco. Não se inferiu que um cartão real seja fictício apenas pelo nome.

### Resumo Mensal

Mantidos nome, sidebar, popup, foco/Escape e setas entre meses. Indicadores: Saldo no início do mês, Entradas, Saídas, Sobrou no mês/Faltou no mês/Resultado do mês (zero neutro), Saldo previsto para o fim do mês. Ícones discretos e informação complementar em bloco separado. Removida discriminação extensa por origem; somente Faturas de cartões, com indicação explícita de que já estão incluídas nas Saídas. Fonte continua sendo `MonthResult` e `monthSummary`; motor não foi alterado. Aviso discreto de período parcial mantido.

### Primeiro acesso e Configurações

Layout autenticado verifica existência de configuração antes de montar projeção. Sem registro, apresenta fluxo com saldo/data vazios, explicação da regra de abertura e confirmação dos dados antes de salvar. Após salvar, oferece Diário, Entrada, Saída ou começar a usar. As opções usam os modais existentes; não são obrigatórias. Ao concluir, refresh monta o painel normal. As mutações dos modais opcionais também podem atualizar o layout e levar ao painel após o cadastro escolhido.

`initializeSettings` autentica no servidor, valida valor/data, verifica configuração existente e usa **insert**, nunca upsert. Conflito/erro falha sem sobrescrever. A proteção concorrente depende da unicidade `settings.user_id`, já declarada no schema do projeto; sua existência efetiva no banco isolado continua a validar. A criação não revalida imediatamente o layout para permitir a etapa opcional; ao concluir, o wizard atualiza a página.

`getUserSettings` agora usa `maybeSingle` sem limit: somente `data: null` sem erro significa ausência. Erros (inclusive PGRST116), registros duplicados ou inválidos interrompem a leitura, sem abrir onboarding nem substituir valores. Error boundary no nível pai informa falha de leitura e oferece tentar novamente. Registro inválido existente demanda diagnóstico seguro, não correção automática.

Configurações continua permitindo alterar saldo/data pelo formulário existente; agora trata exceções de comunicação, impede requisição repetida e atualiza a projeção após salvar. Dados financeiros não são apagados ou recriados. Nenhum exemplo de R$ 5.000/12-10-2026 foi convertido em padrão de novos usuários.

## Verificações

| Verificação | Resultado |
| --- | --- |
| Testes automatizados | 134/134, 13 arquivos |
| TypeScript (`npx tsc --noEmit`) | Passou |
| Lint | Passou |
| Build Next.js (`npm run build`) | Passou |
| Build da demo (`npx vite build --config preview/vite.config.ts`) | Passou; 63 módulos |
| `git diff --check` | Passou |
| Banco isolado, login real e RLS | Não executados: ambiente não configurado |
| Interação Enter/Esc, dimensões desktop/mobile, temas, screenshots | Pendentes: navegador indisponível |

22 testes novos: onboarding com usuário novo/existente, zero, ausência de login, dados inválidos, erro de leitura, conflito concorrente; leitura que separa ausência/erros/registros inválidos; rascunho de faturas com aumento, diminuição, zero, troca de competência, quantidades inválidas e meses por extenso. Os 112 testes anteriores mantêm cobertura do motor, resumo, ações do Diário, cartões e integração do adaptador fictício.

Testes de Server Actions usam mocks; não comprovam autenticação real, RLS ou persistência. Testes do rascunho não comprovam interação com o diálogo de confirmação. Inspeção do grid/classes confirma preservação estrutural, mas não substitui medição no navegador. A edição de zero/erro e atualização do saldo continuam cobertas nas operações/motor anteriores; teclado e prevenção de duplicação no componente necessitam E2E.

Tentativa de iniciar Chromium via Playwright falhou por executável ausente. Tentativa de instalar Chromium falhou: downloads retornaram conteúdo sem ZIP válido, mesmo após retries automáticos. Não foram produzidas screenshots nem declarados testes visuais como aprovados. A primeira tentativa de build falhou devido a symlink externo de node_modules; dependências foram copiadas para o checkout e o build padrão passou sem mudar configuração/lockfile.

## Infraestrutura e limites

Não há Supabase isolado configurado neste checkout; nenhuma migração, acesso ao banco real, seed, reset ou alteração de flags. Migrações 003/004 e validação SQL/RLS permanecem pendentes da Sessão 6. Não foi publicado deploy, sequer atualizada a demonstração hospedada da Sessão 6. `preview-dist` é somente saída local gerada e não versionada. Demo recompilada inclui os refinamentos do Diário/cartões/resumo/Configurações; não simula login nem primeiro acesso com banco.

Menus/identidade, KPIs, navegação, quatro colunas e tokens claro/escuro preservados. Sem futura página de Indicadores, próximos compromissos ou gráficos avançados. Main, backup e produção preservados. Backup original é de código; rollback financeiro continua sujeito às limitações documentadas na Sessão 6.

## Roteiro de validação no ambiente isolado

1. Disponibilizar runtime Next e Supabase separados de produção, com schema/policies e flags validados conforme Sessão 6. Verificar unicidade settings.user_id. Usar contas sintéticas nova e existente.
2. Usuário novo: conferir campos vazios; informar saldo zero, positivo ou negativo e data; voltar da confirmação e editar; confirmar; testar etapa opcional e pular. Reload deve abrir painel e conservar dados. Usuário existente nunca recebe fluxo. Indisponibilidade de leitura deve mostrar erro, sem gravar configuração.
3. Configurações: alterar saldo e data; verificar movimentos anteriores excluídos e os da data aplicados uma vez. Nenhuma entrada/saída/cartão deve ser removida.
4. Diário: clicar no valor; zero + Enter; editar; Esc sem alteração; limpar + Enter para voltar ao previsto; repetir Enter durante rede lenta; simular falha de gravação. Verificar saldo e resumo após refresh. Clicar na data abre modal completo.
5. Cartões: quantidade vazia; informar 2 faturas, preencher novembro/dezembro; aumentar para 3 e conferir janeiro vazio; reduzir e cancelar/confirmar; trocar primeiro mês; editar/excluir fatura. Conferir uma única saída no vencimento.
6. Resumo: navegar anterior/posterior, verificar períodos parciais, resultado positivo/negativo/zero e saldo final; cartões permanecem incluídos uma vez em Saídas.
7. Desktop 1440x900 e mobile 390x844, claro/escuro: medir linhas/células antes/durante edição, conferir quatro colunas desktop, seletor intacto, acessibilidade por teclado, popup sem overflow e legibilidade dos estados.

Para a demo fictícia local: `npx vite --config preview/vite.config.ts --host 127.0.0.1`. Não conectar esse adaptador ao Supabase. A atualização de um preview hospedado não foi feita nesta sessão; produção exige aprovação explícita futura.

Os SHAs finais constam no histórico e na entrega; não são embutidos neste relatório para evitar referência circular.
