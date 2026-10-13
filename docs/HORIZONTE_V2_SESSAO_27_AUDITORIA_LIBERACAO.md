# Sessão 27 — Auditoria final e preparação para uso oficial

Data: 13/10/2026. Parecer: **NÃO APTO para liberação oficial neste momento**, por falta de evidência ponta a ponta de autenticação e de uma estratégia operacional de backup com recuperação completa ensaiada. Não foi comprovado vazamento entre usuários nem defeito nos cálculos avaliados. Limitação da auditoria não equivale a vulnerabilidade comprovada.

## Continuidade confirmada

- HEAD real GitHub da versão aprovada: fix/horizonte-mobile-editor-final, 667bf7de2ef2cd7add8db55e9b5368009dde0e1c.
- Relatório técnico mais recente lido: sessão 26, incluindo confirmação de publicação.
- Nova branch, criada no GitHub e em worktree separada: audit/horizonte-liberacao-oficial, baseada exatamente nesse HEAD.
- Main e backup: e4ba912f14db49b98b3e9129c27670b7bf050d48, preservados.
- Site de testes: appgprj_6acd25d8d4708191b849f052ba7532ba.
- Versão 17, source SHA 6932101b0e01495fca8b6d99775002e8b3cb3dde.
- Deployment appgdep_6ace49e2e58c8191b80819819e5cb822, status nativo succeeded reconfirmado.
- URL: https://horizonte-testes-autenticado.juliandersoncarmo.chatgpt.site.
- Supabase exclusivo: horizonte-testes, hsvjkbfpvmtnehjbwtgr, ACTIVE_HEALTHY, Postgres 17.
- Site com acesso custom restrito ao único proprietário; revisão de ambiente 1 preservada.
- Código publicado de CSS, editor inline, actions financeiras, actions de cartões, motor, resumo, cliente de sessão e endpoint de login comparado com a branch: idêntico.
- Adapter de hospedagem usa Vinext/Cloudflare e matcher específico no proxy; GitHub usa Next 16.2.9. Build local não comprova runtime hospedado.
- Nenhum deploy, mudança de configuração/Auth/RLS/schema, merge, importação de dados reais ou acesso ao banco original foi executado.

## Verificações e resultados desta sessão

| Verificação | Evidência atual |
| --- | --- |
| Vitest | 257 testes em 36 arquivos passaram |
| TypeScript | npx tsc --noEmit passou |
| Lint | npm run lint passou, sem erros de código |
| Next build --webpack | passou com configuração pública exclusiva de testes |
| Build após nova fixture/teste | código de runtime permaneceu idêntico; TypeScript/lint/suíte repetidos |
| Bundle hospedado | verify-hosted-auth e verify-hosted-css passaram no checkout do source publicado |
| Diff | git diff --check passou |
| Policies e grants | inspeção real de catálogo em todas as sete tabelas |
| SQL real com dois proprietários fictícios | leitura/edição cruzadas bloqueadas nas sete tabelas |
| Acesso anônimo | leitura das sete tabelas e RPC bloqueadas |
| Proprietário forjado/reatribuição | bloqueados nas tentativas exercitadas |
| Fatura em cartão de outro proprietário | FK composta rejeitou |
| RPC cartão + faturas | duplicação de competência aborta criação inteira; nenhum cartão parcial |
| Alterações financeiras | entrada/saída, mudança de data e valor da saída, vencimento de recorrência e edição da fatura gravados/lidos na transação |
| Exportação/restauração parcial | JSON das sete tabelas restaurado exatamente em tabelas temporárias descartáveis |
| Dois logins reais HTTP por senha | NÃO executados: acesso à API pública indisponível no executor |
| Cadastro/confirmação/recuperação por e-mail | NÃO comprovados ponta a ponta |
| Renovação/expiração/logout reais | NÃO comprovados; testes locais e inspeção de código |
| Reload/login novo e persistência entre sessões | NÃO comprovados nesta sessão |
| Exclusões reais e restauração em tabelas financeiras originais | NÃO comprovadas nesta sessão: ferramenta falhou antes de retornar evidência |
| Navegação/interação hospedada | sem control-browser; não executada |
| Recuperação completa de banco/Auth | NÃO validada |

Warnings de ferramentas: npm registra configuração http-proxy futura e Vite informa resolução nativa de aliases; a suíte passou. Não são falhas financeiras.

## Segurança: o que foi comprovado

Tabelas settings, transactions, recurring_rules, daily_budgets, daily_actuals, credit_cards e card_invoices: RLS ativo; policies ALL TO authenticated com USING e WITH CHECK vinculados a auth.uid() = user_id. Grants de authenticated limitados a SELECT/INSERT/UPDATE/DELETE. Sem grants financeiros para anon/PUBLIC. Não existem views públicas no inventário.

A única função pública encontrada, create_credit_card, é SECURITY INVOKER, search_path=public, obtém dono de auth.uid(), valida nome/dia/faturas e é atômica. EXECUTE é concedido a authenticated e service_role, sem PUBLIC/anon. A aplicação não utiliza service_role.

As fixtures Auth foram criadas SOMENTE dentro de BEGIN/ROLLBACK, sem senha, sessão ou confirmação de e-mail. Operações financeiras trocaram explicitamente para ROLE authenticated ou anon. O papel administrativo foi usado apenas para provisionar as referências de Auth, não para executar/mascarar testes financeiros. Isto é teste real do PostgreSQL/RLS com dois proprietários simulados, NÃO dois logins reais.

Tentativas com DELETE/restauração na suíte completa retornaram Invalid or expired requestState. Não houve mensagem de rejeição de aprovação com motivo de segurança; não se inventa aprovação/rejeição nem sucesso de execução. Alternativa materialmente mais restrita, sem DELETE, passou. Ao final das suítes bem-sucedidas, consulta confirmou ZERO contas técnicas remanescentes. UUIDs novos, inserts que recusam conflito e rollback impedem reutilizar registros existentes.

## Autenticação, credenciais e Server Actions

Inspeção atual:
- Actions financeiras obtêm usuário com auth.getUser(), usam cliente da sessão e filtros de proprietário, além de RLS.
- Validam valores/datas/agendamento e verificam linhas retornadas em alterações/exclusões individuais.
- Nenhuma chave administrativa é necessária no runtime financeiro.
- Configuração Sites contém somente URL/chave pública do projeto autorizado e flags de testes, Diário e Cartões.
- Login HTTP exige Origin igual à origem da requisição, JSON, limites de entrada, resposta no-store e timeout; cookies de login usam sameSite=lax e secure em HTTPS.
- Proxy verifica usuário e encaminha cookies renovados; isso não prova expiração real.
- Callback restringe destino alternativo a /reset-password; não aceita redirect externo.
- Redefinição usa updateUser e encerra sessão local ao concluir.
- Claims user_metadata não são usadas nas policies para autorização.
- Revisão de código/variáveis atuais não encontrou exposição de service_role. Não foi feita uma auditoria forense de todo o histórico Git ou de dependências.

Teste HTTP tentou consultar /auth/v1/settings com chave pública do projeto de testes: timeout no transporte curl. Consulta ao changelog por curl também falhou no CONNECT do proxy. O fluxo de signup não chegou a ser executado, pois a primeira chamada falhou. Não foram enviados e-mails pelo agente. Não foram desabilitados confirmação de e-mail, autenticação ou RLS.

Cadastro e recuperação existentes precisam de entrega de e-mail, URLs de retorno e troca de código PKCE testados. Configuração Auth atual completa não é exposta pelos conectores disponíveis. O relatório antigo sobre Google desabilitado/confirmar e-mail é histórico, não foi reconfirmado pela API nesta sessão. Google é opcional para começar com e-mail/senha.

Advisors de segurança atuais: apenas Leaked Password Protection Disabled, repetido no encerramento. Organização confirmada Free. A documentação atual informa que proteção contra senhas vazadas é Pro ou superior; não é uma opção que possa ser simplesmente habilitada no Free. Para uso pessoal no Free, senha longa, aleatória e exclusiva reduz esse risco residual; não equivale à proteção HIBP habilitada. Não houve contratação ou mudança de plano.
Remediação: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

A tela atual aceita mínimo de 6 caracteres em cadastro/redefinição; recomenda-se exigir pelo menos 12 no Auth do ambiente oficial e usar senha gerada pelo gerenciador. Validação apenas no navegador não é suficiente.

Risco operacional identificado: resetAllData usa exclusões paralelas independentes; uma falha pode deixar limpeza parcial. A interface confirma e mostra erro, mas a operação não é atômica nem recuperável sem backup. Não foi acionada nem modificada. Não usar essa função em dados reais antes de haver backup recuperável.

## Auditoria financeira

Fixture obtida do banco real, sob RLS, em scripts/fixtures/release-audit-financial.json. Nenhum dado pessoal nela:
- Saldo inicial 1000 em 01/01/2099.
- Entrada 500 em 02/01.
- Saída inicialmente 50 em 03/01, editada para 60 em 04/01.
- Recorrência de saída 100, dia 5 editado para 6, limitada a duas ocorrências.
- Diário mensal 310; realizado zero no primeiro dia.
- Cartão com fatura janeiro inicialmente 200, editada para 210; fevereiro 150.

Novo teste aplica motor/resumo à fixture real exportada: primeiro dia mantém saldo 1000; dia 04 saldo 1408,98; janeiro entradas 500, saídas 680, fechamento 820; fevereiro abre em 820 e fecha em 260. Resumo janeiro: avulsas 60 + recorrentes 100 + cartões 210 + Diário 310 = 680; resultado mensal -180. Realizado zero não é confundido com ausência de dado.

Suíte existente também cobre centavos, dias inexistentes, fevereiro/bissexto, recorrências, limite de ocorrências, diário previsto/realizado, edição/exclusão, cartões/faturas, resumo e atualização local após confirmação. Onde actions são mockadas, estes testes não são evidência de persistência HTTP.

Nenhum defeito comprovado no motor financeiro avaliado. Não houve reescrita, correção de runtime ou alteração visual.

## Backup e recuperação: estado e procedimento preparado

Organização Free: documentação recomenda exportações regulares e cópias externas. Backups diários acessíveis de 7 dias são recurso do Pro; PITR é adicional e não é necessário por padrão para uso pessoal. Não foi possível listar backups reais, acessar conexão direta/pg_dump ou testar restore completo com as ferramentas atuais. Não se afirma que existe backup recuperável configurado.
Referência: https://supabase.com/docs/guides/platform/backups

Teste parcial bem-sucedido: JSON das sete tabelas fictícias restaurado em tabelas TEMP criadas com LIKE INCLUDING ALL, comparado exatamente inclusive IDs, valores, datas e timestamps. Tabelas temporárias e fixtures desapareceram no rollback. Este ensaio inclui colunas/checks/índices únicos, mas NÃO recria FKs, Auth, configuração de ambiente, dados entre sessões, arquivo externo ou recuperação completa de projeto. Portanto recuperação completa continua NÃO validada.

Procedimento seguro para preparar a liberação, executado por quem administra o ambiente:
1. Escolher Free com backup externo automatizado ou Pro com backup diário; decidir antes de dados reais.
2. Versionar esquema/migrações e guardar configuração de Auth/URLs sem segredos.
3. Criar dump consistente com ferramenta oficial/pg_dump, incluindo dados financeiros e dependências Auth necessárias à estratégia escolhida. Exportar só CSV de transações é insuficiente.
4. Guardar cópia criptografada fora do projeto, com data, hash e retenção; segredos ficam em cofre separado. Validar conclusão e avisar falhas. Meta pessoal sugerida: backup diário e antes de mudanças, até 24h de perda aceitável; o proprietário pode exigir menos.
5. Restaurar primeiro em banco NOVO descartável autorizado, com dados fictícios. Nunca sobrescrever banco existente. Conferir contagens, valores, vínculos cartão/fatura, políticas/grants e usuário/login. Comparar saldos/resumos antes e depois.
6. Registrar origem/hash, destino, comandos/versões, horário e resultados. Somente um restore efetivamente bem-sucedido autoriza a expressão “recuperação validada”.
7. Em incidente real, parar novas gravações, preservar uma cópia do estado afetado e restaurar para novo destino; validar antes de trocar a configuração do Site. Mudança de destino exige autorização. Manter o original para análise.

Nenhum job de backup ou cobrança foi ativado. Escolher Pro sozinho não dispensa verificar que há backup disponível e testar recuperação. A estratégia Free também é viável após exportação/restauração completa validada e rotina operacional funcionando.

## Impedimentos reais para a liberação

1. Falta de teste completo com duas contas reais no Site: cadastro/confirmação, login, logout, recuperação, sessão e persistência entre acessos. SQL não substitui isso.
2. Falta de backup operacional definido e recuperação completa validada. O teste temporário parcial é útil, mas insuficiente.
3. Ambiente oficial separado e limpo ainda não existe e não está autorizado a ser criado/publicado.

Alerta HIBP e tamanho dos alvos mobile são ressalvas; não foram tratados como prova de vazamento ou motivo isolado para bloquear uso pessoal. Visual aprovado mantido.

## Caminho mínimo para começar

Antes de solicitar criação/publicação:
- No Site atual, duas contas de teste com e-mails controlados pelo proprietário e dados fictícios: conta A salva saldo/entrada/saída/recorrência/Diário/cartão; recarrega, sai e entra; conta B deve permanecer vazia. Validar recuperação de senha e rejeição de sessão sem login. Não compartilhar senhas.
- Medir renovação após expiração do access token conforme configuração atual; distinguir renovação válida de sessão revogada.
- Definir opção de backup e autorizar somente um destino descartável para ensaio completo, quando for necessário criá-lo.
- Resolver qualquer defeito que esse teste revele apenas na branch e nos testes.

Depois desses critérios, plano oficial sujeito à autorização EXPRESSA:
1. Criar Supabase separado “horizonte-oficial”, limpo, na organização/plano escolhido, sem copiar dados de testes ou banco original.
2. Aplicar somente migrações revisadas e confirmar policies/grants/constraints/advisors.
3. Configurar Auth: confirmação de e-mail, senha forte no servidor, URLs exatas de callback/recuperação, entrega de e-mail testada; HIBP se Pro. Google apenas se desejado.
4. Criar Site separado privado do proprietário, com a versão visual aprovada e credenciais públicas do novo banco. Não copiar identidade do Site de testes; HF_TEST_MODE não deve bloquear o novo projeto. Preservar Diário/Cartões habilitados.
5. Configurar e ensaiar backup/restauração e executar smoke test fictício no novo ambiente antes de usá-lo.
6. Após validação, remover SOMENTE fixtures oficiais, criar conta pessoal pelo cadastro, confirmar e-mail e configurar data/saldo inicial. Registrar saldo do início da data de referência; evitar contar novamente movimentações já incluídas nesse saldo.
7. Conferir um lançamento real pequeno, recarregar e verificar resumo/saldo antes de registrar o restante.
8. Manter ambiente de testes intacto para próximos ajustes; não é necessário alterar main para iniciar um Site oficial baseado em commit revisado.

## Entrega e commit

Mudanças somente de documentação, suíte SQL reproduzível, fixture fictícia e novo teste de regressão; zero arquivo de runtime/layout alterado. Branch audit/horizonte-liberacao-oficial. SHA final é o commit do relatório informado na entrega e no HEAD desta branch (evita referência circular). Nenhuma nova versão foi publicada.

A solicitação não está integralmente cumprida quanto a dois logins reais, exclusões HTTP, persistência/expiração reais e restauração completa: estão explicitamente pendentes por limites das ferramentas/acesso, não marcadas como sucesso.

