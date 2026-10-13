# Sessão 23 — Reconstrução controlada da tabela mobile

## Continuidade e isolamento

GitHub confirmado pelo conector (branch e relatório) e por `git fetch origin` + refs ordenadas por committerdate. HEAD mais recente: `fix/horizonte-mobile-alternativa-2`, `a3c1f23cab71312cf18300f51073f4b566a4a49a`. Nova branch/worktree: `fix/horizonte-mobile-reconstrucao`, criada diretamente desse commit. Lidos AGENTS.md, guia local Next.js CSS e relatório da Sessão 22.

Destino exclusivo: https://horizonte-testes-autenticado.juliandersoncarmo.chatgpt.site. Projeto Sites: `appgprj_6acd25d8d4708191b849f052ba7532ba`. Audiência owner-private preservada. Supabase exclusivo: `hsvjkbfpvmtnehjbwtgr`. Somente leitura de chave pública já utilizada para compilar configuração; nenhuma consulta de dados, escrita SQL, migração ou alteração de configuração de autenticação. Main/backup/produção e banco original intocados.

## Causa e cascata anterior

O bloco final da Sessão 22, fora das layers Tailwind e com seletores específicos `.ledger-months`, prevalecia sobre os blocos 15/16/19/20 anteriores: grid `1fr 1.8fr 1fr`, tipografia do Diário `min(16px, calc((100cqw - 21px) * var(--money-scale)))`, Saldo `min(14px, calc((100cqw - 6px) * var(--money-scale)))`; escala definida inline por `1.55 / string.length`. O grid destinava só 26,3% ao Saldo. Regras anteriores ainda deixavam propriedades que não eram explicitamente anuladas pelas posteriores. Esta conclusão vem da análise de especificidade, ordem e layers do CSS fonte; não é uma captura de computed styles de navegador.

Removidas as regras mobile da tabela de todos esses blocos, incluindo overrides de 359px: grids de 53/54px, tracks iguais, proporção 1.8, fonts 12/14px, `container-type`, `cqw`, reservas de ícones 18/22px, `position:absolute; bottom:-3px`, quebra de strings/formulário, largura de spans de 100% e padding de viés 4px. Mantidas as regras que atendem outros componentes, inclusive seletor superior, cards, ações de modais e gestos existentes. Inventário literal de seletores/regras substituídos no anexo abaixo.

## Nova estrutura e responsabilidades

MonthColumn tem `month-table-viewport > month-table > (month-table-heading + month-scroll > month-day-row)`. No desktop, os dois novos wrappers usam `display:contents`, preservando os filhos do flex, grid `72px 1fr 96px`, scroll vertical e quatro meses. Sem alteração de classes desktop, dados/cálculos ou controles.

No mobile, `month-table` define uma única distribuição `max-content max-content max-content`, `justify-content:space-between`, gap mínimo 8px. Cabeçalho, month-scroll e cada linha herdam tracks via `subgrid`. A largura necessária é definida pelos valores completos do mês; o espaço excedente é distribuído entre os conjuntos em vez de conceder 1.8 partes ao Diário. Data à esquerda, conjunto Diário centrado em seu track, Saldo à direita. Não se força o centro do Diário ao centro geométrico do card.

Card externo 100% da área útil, padding do ledger 16px, margens simétricas e alinhamento com indicadores. Linhas 40px. Diário/Entradas/Saídas e Saldo 16px semibold; data 15px e semana 12px; números tabulares e cores preservados. Valor+lápis usam flex nowrap, gap 5px e botão de 12px por 32px. Sem margem/transform para deslocar coluna. Removido `--money-scale` de ambos os componentes.

Abaixo de 360px, ambos os valores e seletor usam 15px (redução proporcional de 1px), data/semana ficam em duas linhas e gap mínimo 6px. Se o conteúdo intrínseco ainda ultrapassar a área útil (valores muito longos ou fonte do dispositivo), a rolagem ocorre dentro do card completo, mantendo legibilidade e strings. Esse fallback não é truncamento nem redução por comprimento. Touch da tabela delega navegação normal ao gesto existente quando cabe; somente quando há overflow permite arrastar o conteúdo interno e bloqueia clique acidental após arrasto. Não modifica o hook nem navegação de outras áreas. A necessidade real de scroll para cada caso solicitado não foi medida neste ambiente.

## Verificações executadas

- Vitest: 252 testes em 35 arquivos passaram. Novos testes renderizam MonthColumn em happy-dom nos três modos com valores 25, 200, 1200, 10000, 11958.01 e 125000: strings completas, hierarquia compartilhada, posição do lápis no DOM, ausência de escala inline. Também verificam proprietário único das regras CSS, fonte fixa, wrappers desktop transparentes e distinção entre swipe normal/scroll excepcional e clique após arrasto.
- TypeScript `--noEmit`: passou no repositório e checkout hospedado.
- Lint: passou no repositório; checkout hospedado sem erros, com 1 warning preexistente no login (`window.location.assign`), preservado pelo escopo.
- Next.js production build: passou com `npx next build --webpack`. Tentativa inicial de Turbopack bloqueada pelo node_modules reutilizado via symlink fora da raiz; recuperação com webpack, sem mudar configuração ou dependências.
- `node --check scripts/verify-mobile-table-layout.mjs` e `git diff --check`: passaram.
- Build Vinext e verificadores CSS/configuração pública Supabase: passaram. CSS compilado contém subgrid e não contém `money-scale` ou `1.8fr`.
- Comparação AST do CSS antes/depois: todos os seletores, declarações e condições não relacionados à tabela permanecem idênticos. Não equivale a aprovação visual.

## Matriz renderizada preparada, ainda NÃO executada

`scripts/verify-mobile-table-layout.mjs` cobre viewports 320/375/390/430px, três modos e os seis valores (72 combinações), mais desktop de 1440px com quatro meses. Usa computed styles, getBoundingClientRect, larguras/margens iguais aos indicadores, gaps entre grupos, fonts efetivas, alinhamento vertical e distância 5px do lápis, ausência de overflow do documento, valores acessíveis no fallback, screenshot por modo/largura. Altera apenas textos do DOM de um preview autenticado e não persiste finanças. Executar com BASE_URL e STORAGE_STATE de sessão sintética quando houver browser autorizado.

Não há `$control-browser` nesta sessão. Conforme fluxo Sites gerenciado, não foi iniciado preview, instalado navegador ou improvisado outra via de controle. Happy-dom não calcula layout. NÃO foram verificadas geometricamente as larguras 320/375/390/430px, nem coletados screenshots, nem comprovados equilíbrio visual, fontes efetivas ou ausência renderizada de sobreposição. Desktop protegido por escopo e testes estruturais, sem comparação visual. Não há aprovação visual; os critérios visuais continuam pendentes. O script preparado não é apresentado como teste executado.

## Publicação e proveniência

Publicação nativa confirmada: `succeeded`, revisão de ambiente 1, no site de testes autorizado. GitHub código: `672279e1f3a61308dfc57576f62ffd2e18369b29`; branch `fix/horizonte-mobile-reconstrucao`. Source Sites: `43e4e9960ad24cceaf3908f2b33fc52521db5e0a`. Versão: `appgprj_6acd25d8d4708191b849f052ba7532ba~appgver_29c7e510b7a88191beef62c2bbc327ef`. Deployment: `appgdep_6ace1c601e008191aaa33a3e4f474a17`.

Os três arquivos de implementação publicados são idênticos aos do GitHub; scaffolding Vinext preexistente mantido no Site. Este registro de resultado foi acrescentado em commit documental posterior à publicação, sem mudar a implementação. Commit final é o HEAD da branch que contém este relatório.

## Anexo — regras mobile substituídas (inclui seletores repetidos)

```css
.ledger-months { padding: 0 12px 12px; flex: none; overflow: visible }
.month-card { height: auto; box-shadow: none; border-radius: 13px }
.month-heading { padding: 0; border: 0; height: 0 }
.month-heading h2 { height: 0; overflow: visible; font-size: 0; padding: 0 }
.month-heading h2 > span { right: 4px; top: 8px; z-index: 1 }
.month-heading > div { display: none }
.month-scroll { overflow: visible; flex: none }
.ledger-months .grid { grid-template-columns: 53px minmax(0, 1fr) minmax(100px, 1.08fr); padding-left: 9px; padding-right: 9px; gap: 2px }
.month-table-heading { min-height: 38px; background: var(--surface-3) }
.month-table-heading > span { font-size: 13px; color: var(--text-2); text-transform: none; letter-spacing: 0 }
.month-table-heading select { font-size: 13px; color: var(--text-2); text-transform: none; letter-spacing: 0 }
.month-table-heading select { max-width: 100%; padding: 4px 0; min-height: 32px }
.month-day-row { min-height: 40px; height: auto; padding-top: 3px; padding-bottom: 3px; border-bottom: 1px solid var(--border) }
.month-day-row:last-child { border: 0 }
.month-day-row > button { min-height: 34px; align-items: center }
.ledger-months .grid .num { font-size: 12px }
.month-day-row > button .num { font-size: 13px; font-weight: 500 }
.month-day-row > button > span:last-child { font-size: 11px }
.day-balance { min-width: 0 }
.day-balance > span { display: inline-block; max-width: 100%; padding: 5px 6px; border-radius: 7px; white-space: normal; overflow-wrap: anywhere }
.month-day-row .daily-actual { color: var(--red) }
.month-day-row form { flex-wrap: wrap; height: auto; justify-content: center }
.month-day-row input { flex-basis: 100%; height: 32px; font-size: 16px }
.month-day-row form button { min-height: 32px; min-width: 32px }
.month-day-row .relative > div { gap: 0; height: auto; flex-wrap: wrap }
.month-day-row .relative > div > span { white-space: normal; overflow-wrap: anywhere }
.month-day-row .relative > div > button { min-height: 32px; width: 22px }
.ledger-months { padding-left: 16px; padding-right: 16px }
.ledger-months .month-table-heading { grid-template-columns: 54px minmax(0, 1fr) minmax(96px, 1.08fr); padding-left: 10px; padding-right: 10px; gap: 4px }
.ledger-months .month-day-row { grid-template-columns: 54px minmax(0, 1fr) minmax(96px, 1.08fr); padding-left: 10px; padding-right: 10px; gap: 4px }
.month-table-heading { min-height: 46px }
.month-table-heading > span:last-child { padding-right: 6px }
.month-table-heading .desktop-column-mode { display: none }
.mobile-column-mode { display: block; position: relative; min-width: 0; max-width: 100% }
.column-mode-trigger { display: inline-grid; grid-template-columns: 14px auto 14px; align-items: center; justify-content: center; gap: 5px; min-height: 44px; max-width: 100%; padding: 0 3px; color: var(--text-2); font-size: 13px; font-weight: 600; border-radius: 8px }
.column-mode-trigger::before { content: "" }
.column-mode-trigger svg { flex-shrink: 0; transition: transform .15s }
.column-mode-trigger[aria-expanded="true"] { color: var(--accent) }
.column-mode-trigger[aria-expanded="true"] svg { transform: rotate(180deg) }
.column-mode-trigger:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px }
.column-mode-menu button:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px }
.column-mode-menu { position: absolute; z-index: 30; top: 100%; left: 50%; transform: translateX(-50%); width: 140px; padding: 5px; border: 1px solid var(--border); border-radius: 12px; background: var(--surface); box-shadow: 0 8px 24px #10204020 }
.column-mode-menu button { display: flex; align-items: center; justify-content: space-between; width: 100%; min-height: 44px; padding: 10px; border-radius: 8px; color: var(--text); font-size: 13px; text-align: left }
.column-mode-menu button[aria-checked="true"] { background: var(--accent-soft); color: var(--accent); font-weight: 600 }
.month-day-row .daily-display { display: grid; grid-template-columns: 22px minmax(0, 1fr) 22px; gap: 0; align-items: center }
.month-day-row .daily-display > span { grid-column: 2; text-align: center; min-width: 0 }
.month-day-row .daily-display > button { grid-column: 3; width: 22px; min-height: 36px; justify-self: end }
.month-day-row > div:nth-child(2) > span { display: block; text-align: right; padding-right: 28px; white-space: normal; overflow-wrap: anywhere }
.month-day-row { min-height: 44px }
.month-heading h2 > span { right: 4px; top: 15px; pointer-events: none }
.ledger-months .month-day-row .day-mid-value > span.num { font-size: 14px }
.ledger-months .month-day-row .daily-display > span.num { font-size: 14px }
.ledger-months .month-day-row .day-balance .num { font-size: 14px }
.day-mid-value > span { display: inline-block; max-width: 100%; white-space: normal; overflow-wrap: anywhere }
.ledger-months .month-table-heading { grid-template-columns: repeat(3, minmax(0, 1fr)); padding-left: 8px; padding-right: 8px; gap: 6px }
.ledger-months .month-day-row { grid-template-columns: repeat(3, minmax(0, 1fr)); padding-left: 8px; padding-right: 8px; gap: 6px }
.month-day-row > div:nth-child(2) > span { display: block; text-align: center; padding: 0; max-width: 100%; white-space: normal; overflow-wrap: anywhere }
.ledger-months .month-day-row .day-mid-value > span.num { display: block; text-align: center; padding: 0; max-width: 100%; white-space: normal; overflow-wrap: anywhere }
.month-table-heading > div { min-width: 0 }
.column-mode-trigger { display: flex; gap: 4px; padding: 0 }
.column-mode-trigger::before { content: none }
.column-mode-trigger svg { width: 12px }
.month-day-row .daily-display { position: relative; display: flex; justify-content: center; min-height: 46px; padding-bottom: 14px }
.month-day-row .daily-display > span { display: block; width: 100%; text-align: center }
.month-day-row .daily-display > button { position: absolute; right: 0; bottom: -3px; width: 24px; min-height: 24px }
.month-day-row .day-balance .num { padding: 5px 4px }
.choice-trigger.desktop-column-mode { display: none }
.ledger-months .month-table-heading { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px }
.ledger-months .month-day-row { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px }
.ledger-months .month-day-row .day-mid-value > span.num { font-size: 12px }
.ledger-months .month-day-row .daily-display > span.num { font-size: 12px }
.ledger-months .month-day-row .day-balance .num { font-size: 12px }
.column-mode-trigger { font-size: 12px; gap: 2px }
.ledger-months .day-mid-value { width: 100%; justify-self: stretch }
.ledger-months .day-mid-value > span.num { width: 100% }
.ledger-months .daily-display > span.num { width: 100% }
.month-table-heading .mobile-column-mode { width: 100% }
.month-table-heading .column-mode-trigger { width: 100%; justify-content: center }
.ledger-months { box-sizing: border-box; width: 100%; min-width: 0; max-width: 100%; align-self: stretch; padding-left: 16px; padding-right: 16px }
.ledger-months > .month-card { box-sizing: border-box; flex: 0 0 100%; width: 100%; min-width: 0; max-width: 100%; margin-left: 0; margin-right: 0 }
.ledger-months .month-scroll { box-sizing: border-box; width: 100%; min-width: 0 }
.ledger-months .month-table-heading { box-sizing: border-box; width: 100%; min-width: 0 }
.ledger-months .month-day-row { box-sizing: border-box; width: 100%; min-width: 0 }
.ledger-months .month-table-heading { grid-template-columns: minmax(0, 1fr) minmax(0, 1.8fr) minmax(0, 1fr); padding-left: 6px; padding-right: 6px; gap: 2px }
.ledger-months .month-day-row { grid-template-columns: minmax(0, 1fr) minmax(0, 1.8fr) minmax(0, 1fr); padding-left: 6px; padding-right: 6px; gap: 2px }
.ledger-months .month-table-heading { min-height: 40px; padding-top: 0; padding-bottom: 0 }
.ledger-months .month-table-heading > span { font-size: 13px }
.ledger-months .month-table-heading > span:last-child { padding-right: 0 }
.ledger-months .column-mode-trigger { min-height: 40px; font-size: 13px; gap: 4px; flex-wrap: nowrap; padding-left: 4px; padding-right: 0 }
.ledger-months .column-mode-trigger > span { white-space: nowrap }
.ledger-months .column-mode-trigger > svg { flex-shrink: 0 }
.ledger-months .month-day-row { height: 40px; min-height: 40px; padding-top: 2px; padding-bottom: 2px }
.ledger-months .month-day-row > button { min-width: 0; gap: 4px }
.ledger-months .month-day-row > button .num { font-size: 15px; font-weight: 600 }
.ledger-months .month-day-row > button > span:last-child { font-size: 12px; margin-left: 0; color: var(--text-2) }
.ledger-months .day-mid-value { container-type: inline-size; min-width: 0 }
.ledger-months .day-balance { container-type: inline-size; min-width: 0 }
.ledger-months .month-day-row .day-mid-value > span.num { width: 100%; padding: 0 0 0 4px; text-align: center; font-weight: 600; font-size: min(16px, calc((100cqw - 4px) * var(--money-scale))); line-height: 20px; white-space: nowrap; overflow-wrap: normal }
.ledger-months .month-day-row .daily-display { display: flex; justify-content: center; align-items: center; gap: 5px; width: 100%; height: 32px; min-height: 32px; padding: 0 0 0 4px; flex-wrap: nowrap }
.ledger-months .month-day-row .daily-display > span.num { flex: 0 1 auto; width: auto; min-width: 0; max-width: calc(100% - 17px); padding: 0; font-weight: 600; font-size: min(16px, calc((100cqw - 21px) * var(--money-scale))); line-height: 20px; white-space: nowrap; overflow-wrap: normal; text-align: center }
.ledger-months .month-day-row .daily-display > button { position: static; flex: 0 0 12px; width: 12px; height: 32px; min-height: 32px; padding: 0 }
.ledger-months .month-day-row .day-balance > span.num { max-width: 100%; padding: 4px 3px; white-space: nowrap; overflow-wrap: normal; font-size: min(14px, calc((100cqw - 6px) * var(--money-scale))); line-height: 20px }
.ledger-months .month-day-row form { flex-wrap: nowrap; height: 32px; gap: 0 }
.ledger-months .month-day-row input { flex-basis: auto; min-width: 0; height: 32px }
.ledger-months .month-day-row form button { width: 22px; min-width: 22px; min-height: 32px }
```
