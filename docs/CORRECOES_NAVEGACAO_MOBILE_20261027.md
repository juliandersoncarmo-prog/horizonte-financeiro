# Correções de navegação mobile — 27/10/2026

Base: Horizonte Testes versão 26, source Sites e7c35f08047b51997a7a7983c9f473088b5d0be7, deployment appgdep_6ae05e0eba88819196ff3df7f2fd34d9 confirmado como succeeded. GitHub: feat/refinamentos-gastos-diario em 8ecde5b, após PR #6 (de6f832). Os seis arquivos de produção alterados eram idênticos entre essas duas bases. Main não foi utilizada.

## Alterações

- O gesto compartilhado estava ligado somente à seção do calendário. Agora está na raiz de Gastos, com touch-action pan-y e pinch-zoom, mantendo bloqueios para formulários, menus, modais e controles. Dias do calendário aceitam deslize; toques normais continuam selecionando datas. Limite de distância, direção e cancelamento vertical continuam no hook compartilhado. O clique residual é bloqueado somente na origem do gesto, permitindo tocar imediatamente nas setas.
- As setas e o seletor mensal forçavam o primeiro dia. Agora preservam o dia válido, limitam ao último dia do mês e retornam ao dia atual no mês vigente. Escolhas manuais são lembradas por mês durante a sessão; uma nova visita começa em hoje. A data de abertura é resolvida no fuso local do navegador, com fallback SSR estável.
- O calendário possui mês e ano discretos à direita, sem controles novos, com quebra responsiva quando necessária.
- No mobile, a lista de dias da Visão Geral usa rolagem própria limitada a 42dvh (200–420px), preservando indicadores acima e barra inferior. Uma única posição inicial coloca hoje dentro da lista; interação manual cancela o posicionamento pendente. Desktop mantém seu layout e usa sua rolagem interna existente. Atualizações de valores não reposicionam a lista.
- Configurações estava fora de nav, portanto escapava do fechamento delegado. Todos os links do drawer agora fecham o menu. Fechar, Esc, clique fora e desktop foram preservados.

## Validação

- ESLint GitHub aprovado; TypeScript aprovado em ambos os checkouts. Lint Sites sem erros, com aviso preexistente no login sobre window.location.assign.
- Suíte completa: 47 arquivos, 364 testes aprovados. Teste adicional da resolução local da data aprovado na execução focada de DailyExpenses (26 testes).
- Build Next.js com webpack aprovado; build de publicação Vinext aprovado.
- Cobertura: gestos em cartões, calendário, histórico e raiz; controles, scroll vertical, cancelamento, um mês por gesto; setas após gesto; ano novo; fevereiro bissexto; escolha explícita e nova visita; menu mobile incluindo Configurações; posicionamento interno único sem reposicionar após atualização.
- QA visual em Chromium com viewport real de iframe de 390x844 e dados fictícios: mês/ano legível, dia 27 visível com KPIs superiores e barra inferior, sem overflow horizontal na lista; Configurações fecha drawer. Testes DOM existentes cobrem 320,375,390,430,768,1280px. Não houve dispositivo Android ou iPhone físico disponível nem validação em Safari/WebKit.
- O domínio publicado exige login neste navegador, portanto a sessão financeira autenticada não foi exercitada. Nenhum dado foi criado/alterado no Supabase. Motor, consultas, políticas, migrações e dados não foram modificados.

## Publicação e reversão

Integrar por PR em feat/refinamentos-gastos-diario e publicar no mesmo projeto Sites appgprj_6acd25d8d4708191b849f052ba7532ba. Preservar acesso e variáveis existentes. Versão Sites 26 permanece disponível para reversão; PR pode ser revertido no GitHub.
