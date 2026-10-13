# Horizonte V2 — Sessão 15: login hospedado e layout mobile

## Continuidade e isolamento
GitHub consultado antes dos ajustes: inventário completo de branches confirmou `fix/horizonte-mobile-edicao-completa` no commit `8ec3eb4eabaf976823d073509870d66b3c085dc2`, sem branch posterior na listagem. Lidos AGENTS.md e relatório da Sessão 14. Nova branch: `fix/horizonte-login-layout-mobile`.
Commit de implementação remoto: `c2d3ecb04c7281b1bdb3ec2708d9003df84c1320`. Este relatório é um commit posterior. Main, backup, produção financeira e Supabase original não foram alterados. Nenhuma alteração de schema, política RLS, credenciais ou configuração Auth. Motor financeiro sem mudanças.

## Causa confirmada do login preso
Inspeção HTTP do `/login` publicado antes da correção e de 22 módulos JavaScript servidos encontrou literalmente `createBrowserClient({}.NEXT_PUBLIC_SUPABASE_URL,{}.NEXT_PUBLIC_SUPABASE_ANON_KEY)` no bundle. As variáveis públicas não foram incorporadas durante a compilação Vinext; a configuração runtime do Worker não as fornece retrospectivamente ao navegador. O cliente lança exceção ao ser criado sem URL/chave. A tela marcava loading antes da criação e não tinha catch/finally, portanto nunca liberava o botão. Este defeito explica o sintoma sem depender de hipótese sobre cookies mobile, Web Locks ou Server Actions.

Após publicação, a mesma inspeção HTTP não encontrou mais esses nomes/configurações não resolvidas. Verificação local dos bundles também confirmou a URL exata do projeto autorizado. Logs Worker errors_only inicialmente vazios; não se presume que a ausência de erro server-side exclua exceção no navegador.

## Correções de autenticação
- Build hospedado recebeu URL, chave pública anon do projeto de testes e flags via ambiente de processo. Nenhum token/segredo foi gravado no Git. Chave pública do Supabase é configuração de cliente; nenhuma service role foi usada ou incluída.
- `scripts/verify-hosted-auth.mjs` rejeita bundles com configuração Supabase não resolvida, URL de projeto incorreta ou ausência do endpoint de login. A verificação integrou a preparação do pacote publicado.
- Login por senha usa `POST /api/auth/login`, com Supabase SSR/anon e cookies da requisição. Não depende de chamada direta do celular ao domínio Supabase nem de Server Action/RSC para concluir o login.
- Endpoint valida origem, JSON e campos; não aceita login CSRF, não retorna tokens no JSON e não registra senhas. Response no-store; cookies preservam chunking/path/expiração SSR, SameSite=Lax e Secure em HTTPS. Rate limits do Supabase permanecem.
- Deadline de 10 s no servidor, com abort da chamada upstream; 15 s no cliente. Resposta atrasada não publica cookies. Erro de rede/SDK/JSON libera a interface e permite nova tentativa. Trava síncrona impede cliques duplicados.
- Sucesso faz navegação de documento para `/`, enviando os cookies novos e evitando cache RSC anterior ao login.
- Formulário semântico, Enter, autofill e labels associados. Erros em português, sem dados internos. Google mantém PKCE/callback original, com captura de erro e navegação somente após resultado válido. Cadastro, recuperação, redefinição e logout existentes preservados.
- Endpoint foi liberado explicitamente no proxy do GitHub; páginas financeiras continuam protegidas. O proxy hospedado retém sua seleção anterior de rotas, sem interceptar o endpoint novo. Layout confirma usuário no servidor antes de exibir dados de conta. Nome/initials servem somente à apresentação, nunca à autorização.

## Layout mobile e referências
As duas imagens anexadas foram abertas diretamente dos arquivos recebidos. A tela única foi usada como referência principal; mockup de dez telas para navegação e formulários. Não foram adicionados valores de exemplo ao aplicativo.
- Cabeçalho com menu, marca central e avatar da conta real.
- Seletor central com nome completo do mês e setas laterais, acima dos KPIs. Um mês abaixo de 640 px; dois em tablets; quatro a partir de 1024 px. Ano e controles desktop preservados.
- Saldo em toda a largura; entradas verdes e saídas vermelhas lado a lado; cartões suaves, sem ícones grandes/sublabels no mobile.
- Tabela compacta Data/Diário/Saldo, sem repetir cabeçalho do mês e totais; seletor Diário/Entradas/Saídas, status de orçamento esgotado, lápis e toque na data preservados. Previsões cinza e realizados vermelhos no mobile.
- Barra fixa Início/Diário/+ /Cartões/Resumo, com áreas seguras. Botão central abre opções Nova entrada/Nova saída em modal acessível. Drawer fechado por padrão.
- Rolagem da tela mobile inclui todos os dias, sem tabela presa em região muito baixa. Números longos podem quebrar linha; campos do editor usam 16 px. Barra é ocultada ao detectar teclado via visualViewport para edição inline.
- Cartões no celular: lista de nomes/vencimentos reais; Novo cartão abre formulário existente; seleção conserva faturas, edição e exclusão. Não foram inventados logotipos, categorias ou dados.
- Resumo em linhas alinhadas no mobile, mantendo os indicadores/cálculos existentes, sem inventar dados por categoria. ModalPortal unifica foco, Escape, inert e restauração de foco.
- Configurações com largura/rolagem adaptadas; formulários, confirmação de exclusão, recorrências, orçamento e faturas existentes continuam funcionais.
- Tema escuro usa os tokens existentes. CSS novo restrito ao mobile; desktop mantém seus KPIs e quatro colunas.

**Fidelidade visual não aprovada em navegador.** Implementação seguiu as referências, mas fontes, espaçamentos, safe areas, teclado virtual e ausência de overflow precisam de inspeção real. Não foram fabricadas capturas nem transformados testes DOM em aprovação visual.

## Validação
| Verificação | Resultado |
| --- | --- |
| npm test | 215/215, 28 arquivos |
| TypeScript | npx tsc --noEmit aprovado |
| lint | npm run lint aprovado |
| Next build | aprovado, 16.2.9 |
| Vinext/Cloudflare build | aprovado, beta.5 |
| Bundle público Auth e CSS | verificadores aprovados |
| DOM 320/375/390/430 px | um mês, seletor e navegação preservados |
| DOM tablet 768 / desktop 1280 | dois / quatro meses |
| HTTP hospedado: senha incorreta | 401 e mensagem clara, 1093 ms nesta execução |
| HTTP hospedado: origem externa | 403 |
| HTTP hospedado: sem sessão | 307 para /login |
| HTTP hospedado: login válido | 200, success=true, dois cookies, nenhum token no JSON |
| HTTP hospedado: nova requisição com cookies | 200, sem redirect para login, primeiro acesso exibido |
| RLS real | sete tabelas continuam com relrowsecurity=true |

Testes novos cobrem exceção, retry, envio duplicado, SDK pendente, abort, resultados/cookies tardios, origem externa, entrada inválida, erros do Supabase sem vazamento, POST same-origin e navegação do botão central. Suíte anterior mantém exclusão, edição, propriedade, saldo e cálculo. Nenhum teste de dois logins reais/isolamento de dados foi acrescentado; políticas não foram alteradas.

A prova HTTP usou uma conta descartável com endereço `example.invalid`, criada exclusivamente no Auth de testes com senha aleatória. Após login e leitura de primeiro acesso, tokens de refresh, sessões e usuário dessa conta foram removidos; consulta confirmou zero contas remanescentes com seu ID. Nenhum e-mail foi enviado e nenhum dado financeiro foi criado. Isso comprova transporte de autenticação/cookies no Worker, **não interação de um navegador mobile ou do usuário real**.

## Publicação
Somente site `appgprj_6acd25d8d4708191b849f052ba7532ba`, audiência owner-private preservada, env revision 1.
Source Sites: `2a00baa754c389a902d0aeb0589dff950dbe3c37`.
Versão: `appgprj_6acd25d8d4708191b849f052ba7532ba~appgver_6cf5617d54008191bb676e298e031463`.
Deployment: `appgdep_6acd76d27ec88191a0d224222d286271`, succeeded.
URL: https://horizonte-testes-autenticado.juliandersoncarmo.chatgpt.site
Os arquivos funcionais publicados correspondem ao commit de implementação GitHub; o source Sites mantém seu starter/configuração Vinext próprios. Push GitHub CLI sem credencial foi recusado; gravação ocorreu via conector GitHub tree/commit/ref, sem force-push. Source Sites foi salvo/publicado pelo helper oficial.

## Limitações e teste pelo proprietário
Não havia `$control-browser` disponível. Conforme Sites: “If $control-browser is unavailable, skip browser QA: do not start a preview server, install a browser, or improvise another browser-control path.” Não foi iniciado preview nem instalado navegador.
Pendentes: login no celular do proprietário; revisão visual 320/375/390/430 e desktop; teclado virtual/safe areas; fluxos touch de edição/exclusão/faturas; E2E com dois usuários. Código de Google/cadastro/recuperação preservado, mas execução OAuth e envio de e-mail não comprovados; configuração de provedor continua sob as orientações já existentes em `HORIZONTE_V2_TESTES_AUTH_CONFIG.md`.
Para testar: fechar a aba antiga, abrir novamente a URL de testes e entrar com a conta já criada. Em caso de falha, agora deve aparecer mensagem em vez do carregamento indefinido. Enviar somente essa mensagem, sem senha.
