# Configurar o login no ambiente de testes

Este guia se aplica **somente** ao projeto Supabase `horizonte-testes`, ID `hsvjkbfpvmtnehjbwtgr`. Não abra nem altere o projeto original pausado. As tabelas e migrações já foram preparadas; não é necessário executar SQL manual.

Endereço preparado para o Site de testes: https://horizonte-testes-autenticado.juliandersoncarmo.chatgpt.site . A confirmação de publicação está no relatório da sessão. Esse Site é privado para o proprietário, separado da demonstração localStorage e da produção.

## 1. URLs de retorno do Supabase

1. Abra https://supabase.com/dashboard/project/hsvjkbfpvmtnehjbwtgr/auth/url-configuration . Confira no topo o nome **horizonte-testes**.
2. Em **Site URL**, informe:
   `https://horizonte-testes-autenticado.juliandersoncarmo.chatgpt.site`
3. Em **Redirect URLs**, adicione estas duas URLs:
   - `https://horizonte-testes-autenticado.juliandersoncarmo.chatgpt.site/auth/callback`
   - `https://horizonte-testes-autenticado.juliandersoncarmo.chatgpt.site/auth/callback?next=/reset-password`
4. Salve. Se a interface validar por padrão de caminho em vez de query completa, permita apenas `https://horizonte-testes-autenticado.juliandersoncarmo.chatgpt.site/auth/callback**`; não use wildcard de domínio.

A primeira URL atende Google e confirmação de cadastro. A segunda atende recuperação: o callback troca o código pela sessão e abre a página de nova senha já existente. A lista de URLs autorizadas pode ser gerenciada independentemente dos dados e tabelas. As ferramentas conectadas usadas nesta sessão não expõem alteração dessa configuração Auth.

## 2. Habilitar Google sem modificar o aplicativo original

O endpoint Auth do projeto de testes informou Google desabilitado. O botão e a implementação original continuam presentes. Não copie nem substitua o segredo do OAuth da produção.

1. Abra https://console.cloud.google.com/ e selecione/crie um projeto para testes. Criar uma credencial Web para testes evita alterar a credencial usada no Horizonte original.
2. Entre em **Google Auth Platform** (em interfaces antigas: APIs e serviços → Credenciais). Configure o nome do aplicativo de teste, e-mail de suporte e contato. Em modo de testes, inclua sua conta Google na lista de usuários de teste da tela de consentimento. Caso seu projeto exija domínio autorizado, confira `supabase.co` nas configurações de marca/domínios.
3. Em **Clients/Clientes**, crie um **OAuth client ID**, tipo **Web application/Aplicativo da Web**. Nome sugerido: `Horizonte testes`.
4. Em **Authorized JavaScript origins**, coloque:
   `https://horizonte-testes-autenticado.juliandersoncarmo.chatgpt.site`
5. Em **Authorized redirect URIs**, coloque exatamente:
   `https://hsvjkbfpvmtnehjbwtgr.supabase.co/auth/v1/callback`
6. Salve e copie o **Client ID** e o **Client secret**. Guarde-os diretamente nos painéis, sem colocar no GitHub, chat ou variáveis NEXT_PUBLIC.
7. Abra https://supabase.com/dashboard/project/hsvjkbfpvmtnehjbwtgr/auth/providers . Confira **horizonte-testes**. Abra o provedor **Google**, habilite-o e preencha o Client ID e Client secret criados acima.
8. Confira que o callback mostrado pelo Supabase é `https://hsvjkbfpvmtnehjbwtgr.supabase.co/auth/v1/callback`. Salve.
9. No Site de testes, clique **Continuar com Google**. Após consentir, você deve voltar ao mesmo Site. Sem configuração inicial, deve aparecer o primeiro acesso; com configuração, deve abrir o painel.

Existem dois retornos diferentes: Google retorna para o **Supabase**; o Supabase retorna para **/auth/callback do Site**. Trocar esses endereços causa erro de redirect. Nenhum client secret Google é necessário no código Next: ele fica somente no provedor Google do Supabase de testes.

## 3. E-mail/senha, cadastro e recuperação

E-mail/senha e cadastro estão habilitados. Confirmação por e-mail também está habilitada; foi preservada. Para testar, use uma conta que você controle para receber a mensagem de confirmação, com dados financeiros inteiramente fictícios.

1. Abra **Criar conta** na página de login original. Preencha nome de teste, e-mail e senha.
2. Abra o e-mail de confirmação e confira que o retorno vai ao Site de testes. Nenhum envio de mensagem foi realizado pelo agente nesta sessão.
3. Entre com e-mail/senha. Antes de qualquer movimentação financeira, confirme que o endereço pertence ao Site de testes.
4. Preencha o primeiro acesso com saldo e data fictícios. Recarregue: ele não deve reaparecer.
5. Saia pelo botão existente. A página financeira deve voltar ao login. Voltar/recarregar não deve permitir acessar dados sem sessão.
6. Use **Esqueci minha senha**, abra o e-mail, escolha nova senha e entre novamente. O callback deve abrir a página original de redefinição; ao salvar, a sessão local é encerrada antes de retornar ao login.

Se e-mails não chegarem ou houver limite de envios, verifique **Authentication → Emails/SMTP** somente no projeto de testes. Não desabilite RLS para resolver e-mail. SMTP e proteção de senhas vazadas não foram configurados pelas ferramentas conectadas.

## 4. Teste de isolamento pela interface

Use duas contas descartáveis separadas, em perfis/janelas independentes do navegador. Na primeira, cadastre saldo, uma entrada, saída, recorrência, orçamento, realizado zero e cartão com duas faturas. Na segunda, confirme que nenhum desses registros aparece e que o primeiro acesso tem campos vazios. Volte à primeira e recarregue para conferir persistência e Resumo Mensal. Os testes SQL de isolamento já passaram; este roteiro valida a aplicação completa e seus cookies.

No desktop/celular, confira login Google e senha, modais compactos, meses completos perto dos valores, setas fora dos campos/popups, Enter/Esc, saldo após edição e ausência de rolagem horizontal. Essa verificação visual ainda não foi executada pelo agente.

As contas descartáveis técnicas usadas na suíte SQL já foram removidas. Não há senha de teste compartilhada neste guia. Não envie senhas ou segredos; se surgir falha, informe a mensagem e a etapa, ocultando dados pessoais.
