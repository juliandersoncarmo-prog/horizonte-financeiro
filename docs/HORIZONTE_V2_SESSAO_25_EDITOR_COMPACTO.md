# Sessão 25 — Editor compacto do Diário mobile

## Base e isolamento

GitHub conferido pelo conector (coleção de branches) e git fetch origin com refs ordenadas por committerdate. HEAD de trabalho mais recente confirmado: fix/horizonte-mobile-data-legivel, 94a07efc83f00a56945c01561e3e0439e2458248. Main/backup permanecem e4ba912f14db49b98b3e9129c27670b7bf050d48. Lidos AGENTS.md, guia CSS da instalação Next e relatório da sessão 24. Nova worktree/branch criada diretamente desse SHA: fix/horizonte-mobile-editor-compacto.

Destino exclusivo: https://horizonte-testes-autenticado.juliandersoncarmo.chatgpt.site, Sites appgprj_6acd25d8d4708191b849f052ba7532ba. Acesso privado do proprietário preservado. Supabase exclusivo hsvjkbfpvmtnehjbwtgr: leitura da chave pública existente para build, nenhuma consulta financeira, escrita, SQL, migração ou alteração de autenticação. Main, produção, backup e banco original intocados.

## Causa e correção

InlineDailyActual tinha input w-full e regra mobile width:100% num formulário flex com botões. O input participa do dimensionamento intrínseco do grid max-content/subgrid, permitindo alargar o track central. Corrigidos somente componente do editor e suas regras mobile.

Enquanto edita, o display original continua no DOM com visibility:hidden no mobile e aria-hidden/tabIndex=-1. Isso mantém a mesma contribuição intrínseca que o valor+lápis faziam no track, inclusive se a linha editada tiver o maior valor do mês. No desktop, esse display é display:none e o formulário mantém suas classes originais. Nenhuma mudança em MonthColumn, tracks, margens, fontes de exibição ou Data/Saldo.

O editor mobile usa shell absoluto limitado pelos dois lados ao wrapper da coluna Diário, com container inline-size. Portanto input e botões não participam das larguras intrínsecas da tabela. Formulário com largura min(90px,100%) e input compacto de até 90px, fonte 16px, teclado decimal. Botões 32x32px com gap4px. Quando o espaço real da coluna atinge 162px, container query agrupa input90+botão32+botão32+dois gaps4 numa linha. Abaixo disso, input fica acima dos dois botões, dentro da mesma coluna. Não se força linha única à custa de Data/Saldo. Somente a linha com editor aberto ganha altura mínima76px para comportar os controles. Ao fechar, volta integralmente à altura/layout aprovados.

Mensagens de erro mobile limitadas à largura da coluna com quebra de texto. Persistência, cálculo financeiro, locks, Enter, Esc, cancelar, validação e atualização de projeção permanecem no fluxo existente.

## Verificações executadas

- 254 testes Vitest em 35 arquivos passaram. Adicionados testes de preservação do display de dimensionamento, aria-hidden/tabIndex, teclado decimal, cancelamento e Esc sem persistência, restauração de foco, rejeição de negativo e confirmação de vírgula decimal. Testes existentes comprovam zero/remoção, bloqueio de duplicação, erro de servidor sem atualizar saldo e atualização financeira somente depois de persistência confirmada (ações mockadas).
- TypeScript --noEmit e lint do repositório passaram.
- Build Next production --webpack passou. Webpack escolhido pelo node_modules reutilizado via symlink externo, como na sessão anterior.
- TypeScript do checkout hospedado passou. Lint sem erros; um warning preexistente no login, fora do escopo.
- git diff --check passou.
- Build Sites/Vinext passou. Verificadores de CSS e configuração pública Supabase passaram; bundle contém shell contido, campo compacto e container query normalizada pelo compilador para width>=162px.

## Limites da verificação visual

Não há control-browser disponível nesta sessão. Conforme Sites managed-linux, não foi iniciado preview, instalado navegador ou improvisada outra via de controle. Happy-dom não calcula geometria. Não foram executadas medições renderizadas em 320/375/390/430px, screenshots ou testes com teclado virtual real. A captura mencionada na solicitação não veio como imagem acessível nesta mensagem.

As regras são as mesmas nas quatro larguras solicitadas: até639px, shell limitado ao track aprovado e largura máxima90px; alternância para linha única depende da largura real do Diário, não do viewport. Fonte16px e ausência de unidades ligadas à altura do viewport no editor evitam depender do tamanho vertical do teclado. Isso é inspeção de código, não comprovação em aparelhos. Ausência de sobreposição, deslocamento ou zoom com teclado aberto continua pendente de validação visual.

## Proveniência da entrega

O commit que contém este relatório e a correção está no histórico da branch acima. A publicação do source correspondente no projeto de testes será confirmada pela resposta nativa Sites. Resultado e identificadores finais serão anexados após publicação.

Git push via CLI sem credencial disponível; publicação da branch recuperada pelas operações autenticadas do conector GitHub, sem modificar main.
