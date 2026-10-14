# Sessão 29 — Autenticação urgente

Data local: 13/10/2026. Branch: fix/horizonte-auth-urgente.

## Continuidade

GitHub HEAD real main: e4ba912f14db49b98b3e9129c27670b7bf050d48. Fetch concluído. Relatório sessão 28 lido integralmente. Base GitHub cd1796499ce5abe15eb5d655d204dae8c1e4bc2b, runtime correspondente à publicação 18. Fonte Sites aberta pelo helper: 61f643c7c88c04040bb45e68afdcbf67e09b5232. Site único appgprj_6acd25d8d4708191b849f052ba7532ba; Supabase único hsvjkbfpvmtnehjbwtgr, horizonte-testes, ACTIVE_HEALTHY. Nenhum outro site/projeto criado. Main/backup preservados.

## Causa comprovada do login

As duas contas existem, possuem senha e e-mail confirmado, somente identidade email, sem deleted_at/banned_until. Nenhum hash/senha/token foi extraído.

Worker recebeu POST /api/auth/login com 401. Logs gateway Supabase para esses POST /auth/v1/token mostram UNAUTHORIZED_INVALID_API_KEY e prefixo null, incluindo 19:06:54 UTC, 23:24:33 UTC e 00:11:14 UTC. Não são rejeições de senha: gateway recusa antes de Auth. Endpoint convertia qualquer erro HTTP <500 em credenciais incorretas.

Probe usando endereço inexistente (sem contas reais) reproduziu gateway inválido. A chave anon ativa do projeto autorizado retornou settings 200 diretamente; e-mail/senha habilitado, signup habilitado, autoconfirm habilitado, Google desabilitado. Estado individual das duas contas confirmado por SQL.

A variável pública Sites foi corrigida para chave anon ativa do projeto, revisão 2. Republicar a versão 18 com revisão 2 NÃO corrigiu o probe: UNAUTHORIZED_INVALID_API_KEY persistiu. Portanto o defeito também estava compilado no servidor. Novo build recebeu URL/chave corretas por stdin, sem arquivos/argumentos com credenciais. Verificação confirmou chave pública autorizada no bundle do navegador E servidor. Chave anon é pública, nunca service_role. Nenhuma rotação de chaves ocorreu.

## Alterações

- Somente invalid_credentials recebe mensagem de senha incorreta; falha de gateway/configuração passa a 503. Logs registram só código/status, sem mensagem/payload de usuário.
- Callback PKCE mantém destinos / e /reset-password; erros de recovery voltam a /forgot-password com indicador fixo, sem expor parâmetros. Erros de rede tratados e cache private/no-store.
- Login/recuperação exibem mensagem fixa para link inválido/expirado; parâmetros são removidos da barra.
- Recuperação trata falha de transporte e libera loading; mantém callback PKCE existente.
- Reset valida usuário/sessão antes de permitir salvar, mantém logout local após atualização feita pelo próprio usuário.
- Verificador de bundle hospedado agora exige a chave autorizada também no servidor, prevenindo repetição da regressão.

Sem mudança de layout, motor, dados financeiros, tabelas, RLS, senhas, contas ou identidades.

## Testes

279 testes / 39 arquivos passaram; TypeScript, lint GitHub e build Next --webpack passaram. Build Sites Vinext passou; TypeScript hospedado passou; lint hospedado sem erros e um warning preexistente sobre navegação documental pós-login. Regressões cobrem erro API key não tratado como senha, callback recovery expirado, exceção PKCE, redirecionamento externo bloqueado. Verificador confirma chave pública correta em ambos os bundles.

Sem control-browser disponível: não foi iniciado preview nem instalado navegador. Sem senhas dos usuários: login real das duas contas, dados após login, logout/relogin e OAuth não foram executados. Não foram enviados e-mails nem redefinidas senhas pelo agente.

## Intervenção externa indispensável

Conector Supabase não expõe leitura/alteração de Auth URL configuration nem provedor OAuth. localhost relatado é compatível com Site URL/allowlist incorretas, mas configuração administrativa atual não foi lida. Log /verify de 00:10:25 UTC informa One-time token not found; pode ser link consumido, substituído ou expirado, sem prova de uma única causa histórica.

Abrir https://supabase.com/dashboard/project/hsvjkbfpvmtnehjbwtgr/auth/url-configuration . Site URL: https://horizonte-testes-autenticado.juliandersoncarmo.chatgpt.site . Adicionar Redirect URLs exatas:

- https://horizonte-testes-autenticado.juliandersoncarmo.chatgpt.site/auth/callback
- https://horizonte-testes-autenticado.juliandersoncarmo.chatgpt.site/auth/callback?next=/reset-password

Salvar. Solicitar NOVO link pelo Site, abrir uma vez no mesmo navegador/perfil. Links antigos não são recuperáveis. Não desligar PKCE nem confirmação para contornar.

Google: usar projeto Google Cloud existente apropriado, sem criar ambiente alternativo. Google Auth Platform > Branding/Audience: app e e-mail de suporte; se Testing, incluir conta autorizada. Clients > Web application. Origin: https://horizonte-testes-autenticado.juliandersoncarmo.chatgpt.site . Redirect URI Google: https://hsvjkbfpvmtnehjbwtgr.supabase.co/auth/v1/callback . Copiar Client ID/Secret diretamente para Authentication > Sign In / Providers > Google do MESMO Supabase; habilitar/salvar. Não enviar segredo pelo chat nem commitá-lo.

Usar Google do MESMO e-mail confirmado da conta existente para linking automático documentado pelo Supabase. Conta Google de outro e-mail não corresponde à conta antiga; não testar com outro endereço esperando os mesmos registros. Conferir UUID original e dados após primeiro OAuth. Nenhuma vinculação/desvinculação manual executada.

## Publicação

Fonte hospedada de correção: d50f567a534d3cbcadaee44d1192fbba7b945010. Publicação independente da configuração Google. Resultado nativo e probe pós-publicação registrados na entrega.
