# Navegação e Gastos do Diário — 27/10/2026

## Base e escopo

Horizonte Testes autenticado, versão 25, fonte Sites `e281462e29cf8237dc70c043a45f5f3e4ebe3a75`, confrontada com a branch GitHub `feat/refinamentos-gastos-diario` em `2d9de1b`. Componentes Sidebar e DailyExpenses eram idênticos. Conferidas todas as branches remotas por data e ancestralidade. Main permanece desatualizada e não foi usada nem alterada. Desenvolvimento: `feat/navegacao-interface-final`.

Preservados o cabeçalho mobile aprovado, o mês nativo acessível, a ausência de Hoje, o calendário/data atual, os formulários compartilhados, as quatro ações do +, o cache, as conciliações e o motor financeiro.

Alterações: navegação lateral ordenada, seção Novo lançamento compartilhando o seletor do +; Configurações/Sair na mesma linha após perfil/tema, com alvos de 44 px e fallback por container query; ícones acima das legendas mobile; hook existente de swipe no calendário, bloqueado em carregamento, formulários, menus e controles interativos; remoção da contagem visual; cabeçalho desktop em duas linhas; capitalização apenas inicial; rótulo do total de 16 px; menu compacto nos dois tamanhos; progresso mensal do total consolidado com valores disponíveis/excedidos, percentuais decimais e preenchimento limitado; etiquetas por identidade, estáveis entre meses, renomeações e ordenações, com variação contínua de matiz/saturação/luminosidade e tokens próprios de tema. A seleção nativa recebe uma etiqueta correspondente abaixo do campo, pois cores nas opções nativas variam conforme o sistema operacional.

O progresso usa `summary.actualCents`, já consolidado, em vez de somar novamente despesas detalhadas e valores manuais. Não há nova fonte financeira nem migração/escrita no Supabase. O projeto continua `hsvjkbfpvmtnehjbwtgr`.

## Validação

- 357 testes em 47 arquivos passaram: `npm run test -- --maxWorkers=1 --testTimeout=30000`.
- Lint, TypeScript, Next.js webpack build e diff check passaram.
- Pacote hospedado: TypeScript, lint (somente aviso preexistente no login), build Vinext/Sites, verify-hosted-css e verify-hosted-auth passaram.
- Testes novos: swipe integrado nas duas direções/ano, exclusão de rolagem vertical e botões, setas; orçamento abaixo/acima/sem definição; 200 identidades de categoria distintas; estabilidade; ordem dos destinos, links e seletor compartilhado.
- Navegador via prévia estática isolada, componentes reais e dados fictícios: 320, 375, 390 e desktop de 1348 px; claro/escuro; menu lateral, rodapé, +, cabeçalho, total, progresso e categorias. Medição DOM confirmou ausência de overflow horizontal nas quatro larguras. A prévia inicial de desenvolvimento falhou por resolução de arquivos no daemon; empacotar a mesma fixture como estática resolveu o problema sem alterar o produto.

Limites: não houve login nem escrita com a sessão financeira do usuário; os testes de banco usam PostgreSQL isolado. Gestos foram exercitados em testes de eventos de toque; a prévia desktop inspecionou o layout em viewports reais de iframe, sem emulação de hardware Android/iOS. A identidade cromática não usa uma paleta de oito entradas: pares distintos foram verificados para 200 IDs, mas categorias numerosas podem inevitavelmente ter tonalidades próximas.

## Publicação e reversão

Fonte Sites preparada: `e7c35f08047b51997a7a7983c9f473088b5d0be7`, somente quatro arquivos funcionais alterados, mantendo a infraestrutura hospedada. A versão anterior 25 permanece disponível para reversão de interface, sem necessidade de restaurar/remover tabelas ou dados. Não alterar outros ambientes nem usar versões antigas anteriores às migrações de conciliação como rollback de escrita.
