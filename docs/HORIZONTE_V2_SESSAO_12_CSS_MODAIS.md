# Horizonte V2 — Sessão 12: CSS hospedado e modais

## Continuidade e limites

GitHub verificado na branch `test/horizonte-v2-supabase-real`, HEAD `dc4f5392e747bebf1979bf5d5d07e40385b803aa`. Nova branch `fix/horizonte-css-modais-autenticado`, em worktree separado para preservar alterações locais anteriores. Lidos AGENTS.md, relatório da Sessão 11 e guia CSS do Next instalado. Nenhuma alteração em main, backup, produção financeira, variáveis de ambiente, autenticação ou Supabase. Nenhuma migração ou operação em dados executada.

## Causa comprovada do CSS

O checkout efetivamente publicado (`da19f42bfb76bec69ebe833a854207c49d40becd`) tinha `app/globals.css` e `app/layout.tsx` do starter, não do Horizonte. O CSS do starter definia fundo #0a0a0a por prefers-color-scheme e não definia tokens como --bg, --surface e --text. Isso explica fundo preto, textos e campos sem classes esperadas, além de metadados Starter Project e lang=en. O layout importava CSS, mas importava o arquivo errado: não era ausência do PostCSS ou falha de importação.

Restaurados integralmente globals.css e layout.tsx originais no checkout Sites, preservando `@import "tailwindcss"`, `@theme inline`, temas por data-theme, título, pt-BR e classes do body. Starter build/Vinext/Cloudflare e manifest mantidos. Sem cores pontuais ou tema automático substituindo a preferência do usuário.

`scripts/verify-hosted-css.mjs <checkout Sites>` compara os dois arquivos com a fonte GitHub e inspeciona CSS final para tokens de ambos os temas e utilitários dos formulários/modais. Executar depois de cada preparação/build; copiar arquivos do app após qualquer setup do starter, pois setup não deve substituir arquivos finais do produto.

## Modais

DiarioModal e AddTransactionModal usam ModalPortal compartilhado, fora da hierarquia do primeiro acesso, diretamente no body. Camada z-[100], fundo preto a 50%, centralização no viewport, largura max-w-md e altura limitada por 100dvh com rolagem interna. Mantidos cores, campos e ações originais. Fechamento por backdrop, botões e Escape afeta apenas onClose do modal; estado do wizard permanece no componente pai.

Dialog com aria-modal e nome acessível, foco inicial, ciclo Tab/Shift+Tab, fundo inert, bloqueio de rolagem e restauração do foco ao gatilho. Tema é definido no elemento html, portanto o portal herda os mesmos tokens. Três testes DOM parametrizados confirmam portal, isolamento do fundo, foco, Escape e limpeza; não equivalem a E2E dos três formulários autenticados.

## Checks

- npm test: 164/164, 20 arquivos.
- npx tsc --noEmit: aprovado.
- npm run lint: aprovado.
- npm run build (Next 16.2.9): aprovado.
- Build Sites/Vinext beta.5: aprovado, sete rotas.
- Verificação do CSS compilado e igualdade da fonte: aprovada; asset index.BH-l9IvI.css.
- Primeiro Next build falhou por symlink node_modules fora da raiz; resolvido com dependências locais, segundo build aprovado. Sem alteração de código para contornar a falha.

## Limitações e teste manual

Navegador automatizado control-browser indisponível. A skill Sites instrui: “If `$control-browser` is unavailable, skip browser QA: do not start a preview server, install a browser, or improvise another browser-control path.” Portanto não se declara validação visual ou E2E concluída. Builds e testes DOM não comprovam Server Actions/cookies ou aparência no navegador.

Abrir o site autenticado de testes, recarregar com Ctrl+F5, verificar login/cadastro/recuperação, temas claro e escuro, principal e formulários. Com conta fictícia sem configuração, preencher etapa 1 e abrir/fechar Diário, Entrada e Saída na etapa 2: fundo deve escurecer; popup central; Tab contido; Escape/botão/backdrop fecham somente popup; foco retorna à origem. Repetir em celular, incluindo formulário recorrente e rolagem. Não apagar dados existentes para reproduzir primeiro acesso.

URL exclusiva: https://horizonte-testes-autenticado.juliandersoncarmo.chatgpt.site

## Publicação e entrega HTTP confirmadas

Atualizado somente o projeto autenticado de testes, preservando acesso owner-private e revisão de ambiente 1. Source Sites `25613f99ab761622d91f7bdfa131802d4053019f`; deployment `appgdep_6acd2acd0ccc8191831dd19979c9337c`, status succeeded; versão 2. O relatório técnico fica no GitHub, não no starter da hospedagem.

Verificação HTTP após publicar, com autorização Sites existente mantida somente em memória: `/login` retornou 200 text/html e referenciou `/_next/static/css/index.BH-l9IvI.css`; esse asset retornou 200 text/css, contendo --bg, --surface, --text, --accent, tema escuro por data-theme e utilitários bg-accent/bg-surface/bg-green/bg-red/fixed. Portanto entrega do CSS comprovada, sem erro de carregamento nessas requisições. Não é validação visual, login Supabase real nem fluxo autenticado de primeiro acesso. Sem criação/rotação de token, credenciais persistidas ou conta de usuário alterada.
