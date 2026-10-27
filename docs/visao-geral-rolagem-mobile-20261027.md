# Rolagem mobile da Visão Geral — Alternativa 1

Base publicada: Horizonte Testes v27, source Sites 4a3e17230aee392c5416a17ced1f6ac6cc60dbeb, branch de publicação Sites main. Base GitHub: feat/refinamentos-gastos-diario, 6e67f52133fcbaf78fb33fbece85bbc9bb7338d9 (merge PR #7). Os dois arquivos de produção desta correção eram idênticos nas duas bases. Main do GitHub não foi utilizada.

## Alterações

- Removido o limite de 42dvh e a rolagem vertical interna dos dias no mobile. Indicadores e tabela usam a rolagem existente da página Início.
- Apenas o cabeçalho da tabela usa sticky, top 0 dentro da área abaixo da barra superior. Os ancestrais intermediários não criam contêineres de overflow. O limite do sticky é a própria tabela.
- Mantidos subgrid, larguras intrínsecas, tipografia e os três cartões. Overflow horizontal excepcional usa o contêiner da página, evitando um ancestral que impediria o sticky.
- Posicionamento inicial procura a linha já marcada isToday e movimenta a página no mobile. Respeita a altura do cabeçalho, não movimenta uma linha já visível, executa uma vez e cancela após touch, roda, ponteiro ou teclado em qualquer região da página. Atualizações financeiras não reposicionam.
- Desktop preserva a rolagem por coluna; cabeçalho superior, menu, seletor e barra inferior permanecem iguais. O shell já reserva 76px mais safe area para a barra inferior.
- Sem alterações no Supabase, consultas, autenticação, dados ou motor financeiro.

## Validação

- ESLint e TypeScript aprovados no GitHub; ESLint Sites sem erros, com aviso preexistente na navegação do login. TypeScript Sites aprovado.
- Build Next.js com webpack e build de publicação Vinext aprovados.
- 13 testes novos: 320/375/390/430px, cancelamento por quatro tipos de interação, linha já visível, mês sem hoje, 640/768/1280px e ausência de reposicionamento após atualização. Teste anterior de posicionamento explicitamente preservado como desktop.
- Os testes específicos, de usabilidade e benchmark passaram isoladamente (33 testes). Execuções concorrentes da suíte apresentaram timeout do benchmark e falha transitória de formulário de cartão; repetição serial registrada na entrega.
- QA visual em navegador não concluído: a prévia inicialmente recusou conexão; após corrigir o perfil local de execução, a política do navegador bloqueou a navegação. Não houve teste em Android físico ou Safari. Nenhuma sessão financeira autenticada foi exercitada.

## Integração e reversão

Branch fix/visao-geral-rolagem-mobile; integrar por PR em feat/refinamentos-gastos-diario. Publicar no mesmo projeto Sites, preservando variáveis e acesso. A versão Sites 27 e o PR anterior permanecem disponíveis para reversão.
