# Horizonte V2 — Sessão 19: refinamento visual mobile

## Continuidade e isolamento
Em 13/10/2026, consulta direta às branches e commits do GitHub confirmou como base `fix/horizonte-mobile-diario-performance`, commit `d927a8bfd0be2b3597d7cce140e26076842d6a79`. Esse commit sucede os gestos da Sessão 17. Lidos AGENTS.md, relatório da Sessão 18 e guia use-client instalado. Nova branch: `fix/horizonte-mobile-refino-componentes`, worktree separado, sem alterar a branch do checkout anterior.

Site confirmado via get_site: `appgprj_6acd25d8d4708191b849f052ba7532ba`, https://horizonte-testes-autenticado.juliandersoncarmo.chatgpt.site. Source aberto pelo helper Sites no commit `212a4b59d11d2e234239f682672e10b178e2e9ad`, correspondente à Sessão 18. Audiência owner-private preservada. Runtime existente revisão 1; somente Supabase `hsvjkbfpvmtnehjbwtgr`. Nenhuma mudança de banco, migrations, credenciais, RLS, autenticação, motor financeiro, server actions ou flags. Main e backup GitHub intactos.

## Correções
### Coluna central
A regra de CSS da Sessão 16 ainda aplicava `text-align: right` e `padding-right: 28px` aos valores de Entradas/Saídas, apesar da tentativa posterior de centralização. O grid também reservava larguras assimétricas aos lados.

Cabeçalho e linhas agora usam os mesmos três tracks: laterais simétricos `minmax(0, 1fr)` e central `minmax(0, 1.15fr)`. O centro da coluna central coincide com o centro do espaço útil da tabela, com padding simétrico. Data continua à esquerda e Saldo à direita. Removido o recuo de 28px; os três modos compartilham o centro. Título e seta formam um grupo centralizado. Seletor personalizado Diário/Entradas/Saídas preservado.

Número do Diário ocupa a largura inteira do track, sem compartilhar uma grade com o lápis. O lápis fica posicionado no canto inferior direito de uma pequena faixa dentro da célula, sem empurrar horizontalmente o número. Essa faixa pode aumentar discretamente a altura das linhas em modo Diário. Valores extensos quebram naturalmente, sem truncamento nem tracks com largura mínima rígida que force rolagem horizontal. Fonte mantida em 14px nos celulares usuais; 12px apenas abaixo de 360px, como proteção para valores longos no viewport mínimo. Não houve redesenho da tela principal.

### Detalhes dos lançamentos
Descrição sem truncate; ocupa toda a área à esquerda do grupo compacto de ações. Valor aparece logo abaixo da descrição, alinhado à esquerda. Lápis e lixeira ficam juntos à direita, com gap zero e botões de 40×44px no mobile, sem grandes margens. Textos longos podem quebrar naturalmente. Edição desabilitada durante gravação/refresh, além do bloqueio existente para exclusão. Escopos de exclusão mantidos: avulso, regra inteira ou apenas fatura.

### Meses e faturas
MonthField substitui ambos os inputs month dos cartões. Botão mostra o mês e ano completos, com ícone em espaço próprio. Primeiro mês ocupa uma linha no mobile; quantidade fica abaixo em campo estreito. Seletor próprio permite ano anterior/próximo ou digitação de 1000 a 9999 e doze meses com nomes completos; emite exatamente YYYY-MM.

Valores das faturas usam nomes em 14px no mobile, gap de 8px e campo de valor entre 80 e 100px, aproveitando o restante para o mês completo. Meses permanecem associados à competência original. Mudança de mês ou redução da quantidade que descartaria valores exige confirmação; cancelamento preserva mês, quantidade e valores.

### Componentes próprios e foco
ChoiceField substitui selects de mês exibido, ano da projeção, frequência, término e modo desktop. Usa ModalPortal, sem listas gigantes do Android. Mantém opções, seleção atual, Escape, cancelamento por fundo, foco confinado, retorno de foco, ArrowUp/Down, Home/End e opção selecionada ao abrir. O seletor mobile de modos existente foi preservado.

useConfirmation substitui todos os window.confirm da aplicação: salvar regra recorrente, editar/excluir orçamento e descartar valores de faturas. Cancela ao desmontar o proprietário e resolve cada solicitação uma única vez. Nenhum window.confirm/alert ou input month permanece no código de interface. Confirmações próprias existentes de exclusão seguem preservadas. ResetButton passa a usar o mesmo ModalPortal e ganha trava síncrona contra envio duplicado e mensagem de falha de comunicação. Esse fluxo não foi executado contra dados reais.

Controles de data diária, number, checkbox e radio continuam nativos onde apropriado, com estilos existentes; não foi criado calendário diário novo nem alterada validação de datas. Apenas os seletores de mês/opções e confirmações problemáticos foram substituídos.

### Modais, menu e configurações
Cabeçalhos sticky com botão de fechar visível nos cartões, detalhes do dia, resumo e formulários de lançamento. Removida rolagem interna duplicada dos painéis de cartões/resumo/detalhes; rolagem fica no viewport ModalPortal. Diário mantém cabeçalho/rodapé e conteúdo com min-height zero para rolar. Menu lateral mantém a largura aprovada; fechamento fica sticky no topo. Configurações ganham campos mobile em 16px e áreas de toque de 44px. Barra inferior, tema, navegação por setas e swipe preservados.

## Verificações
- 247 testes em 34 arquivos: aprovados. Incluem todos os 239 anteriores atualizados para interagir com componentes próprios, mais 8 casos novos.
- Novos casos: opções por teclado e retorno de foco; mês/ano e competência exata nos quatro viewports 320/375/390/430 (DOM); ano inválido; Escape e confirmação sem alert nativo; preservação de valores em troca de competência; salvar recorrente somente após confirmar, cancelar intacto e travar duplicação.
- Testes existentes verificam contagem de meses e navegação em 320/375/390/430/768/1280px e gestos. Nenhum desses testes usa motor de layout de navegador.
- TypeScript do repositório e lint: aprovados.
- Build Next.js: aprovado. Primeira tentativa falhou por node_modules simbólico fora do root do Turbopack; corrigida somente a disposição local das dependências e repetido o build com sucesso, sem alterar configuração de aplicação.
- TypeScript hospedado: aprovado.
- Lint hospedado: zero erros; uma advertência preexistente em window.location.assign no login, preservada para manter a experiência mobile já corrigida.
- Build Vinext/Cloudflare e verificadores de CSS/configuração Supabase: aprovados. URL do projeto de testes incorporada ao bundle; login e CSS verificados. Runtime revisão 1 preservada.

## Limitações
Sem control-browser disponível no ambiente managed. Skill Sites determina não iniciar preview nem improvisar navegador nesse caso. Não houve screenshots ou inspeção visual real, medições de geometria/overflow, validação com teclado virtual Android/iOS, autenticação E2E ou escrita no banco. Capturas fornecidas foram usadas como referência e diagnóstico, não como prova visual da versão corrigida. Não é possível declarar alinhamento visual definitivo confirmado em dispositivo apenas pelos testes DOM. O desktop preserva tracks e shell anteriores; ausência de regressão visual precisa de revisão no navegador.

Pendente conferir no site no celular: centro nos três modos, valores grandes e longas descrições, faturas com Novembro/Dezembro, seletores, confirmações, rolagem/fechamento com teclado aberto, menu e swipe. Fonte e quebra podem exigir ajuste após observar o resultado em dispositivo real.

## Publicação
Publicação confirmada pelo Sites: **succeeded**, somente no endereço de testes acima, runtime revisão 1 preservada.

- Commit local de implementação: `a95efcc46d45301f1738fdc0d7f8f22adfe25d2b`.
- Source Sites publicado: `ade78fe61e59f4ba3a1f5933a8afe6d3e59bce2e`.
- Versão: `appgprj_6acd25d8d4708191b849f052ba7532ba~appgver_4ef992f789ec8191a0885550266b5f4d`.
- Deployment: `appgdep_6ace01c399b481918eaf241700737b2d`.
- O source hospedado mantém suas configurações Vinext e compatibilidade Cloudflare específicas, além do login aprovado.
- Push Git HTTPS local indisponível por falta de credencial; sincronização GitHub realizada pelo conector oficial, em branch nova originada do commit confirmado. O SHA GitHub pode diferir do commit local, mas os arquivos funcionais são os mesmos. Nenhuma atualização de main, backup ou outra branch.
- Este resultado documental foi acrescentado após a publicação, sem mudança adicional de código.
