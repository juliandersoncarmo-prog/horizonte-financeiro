# Horizonte Financeiro — Sessão 8

## Continuidade e entrega

Confirmado GitHub/ls-remote: Sessão 7 `0a212f3b255b38a21ef438fd2b1ae1f910725840`. Branch exclusiva `test/horizonte-v2-validacao-final`, checkout novo. Lidos AGENTS, guia Next instalado, plano e relatórios 2–7. main/backup preservados em `e4ba912f14db49b98b3e9129c27670b7bf050d48`. Sem banco real, merge ou deploy do aplicativo financeiro. Sem novas funcionalidades.

Demonstração privada atualizada: https://horizonte-financeiro-demo-v2.juliandersoncarmo.chatgpt.site

Site existente `appgprj_6acc352b0a1c8191876eb16ef2012943`, acesso somente proprietário preservado. Sites confirmou succeeded: source commit da hospedagem `66b5f1684d60d10c2cda0dab33773246f8bbddd9`, deployment `appgdep_6acce30149b481918be3375328756890`. Hospedagem tem histórico próprio. A publicação Sites é exclusivamente da demo fictícia autorizada, não da produção financeira.

Bundle inclui Sessão 7: Diário na célula, campos automáticos das faturas, resumo refinado e Configurações. Correções desta sessão: nome acessível do seletor mensal e aria-label/expanded/controls do menu da demo. Banner identifica Sessão 8. localStorage fictício preservado; Restaurar exemplos reinicia somente a demo após confirmação. Bundle sem URL Supabase, service_role e email pessoal fixo.

## O que testar e diferenças

Testar Diário: zero+Enter, editar, Esc, limpar+Enter; clicar data para modal completo. Cartões: 2 faturas, aumentar para 3, reduzir/trocar mês e confirmar/cancelar, editar/excluir. Resumo: navegar meses e conferir atualização/saídas de cartões contadas uma vez. Configurações: alterar saldo/data; testar temas, mobile e avulsas/recorrências/orçamento. Usar somente valores fictícios.

| Área | Demo | Next real |
| --- | --- | --- |
| Motor/resumo/componentes | Compartilhados | Compartilhados |
| Escrita/persistência | Adapter localStorage da origem/navegador | Server Actions/Supabase por usuário |
| Refresh/navegação | Evento local/hash | router.refresh/App Router |
| Auth/OAuth/recuperação | Ausentes | Código presente, teste real pendente |
| Primeiro acesso | Não simulado | Wizard/initializeSettings, teste real pendente |
| RLS/RPC/concorrência banco | Não exercitados | Teste real pendente |

Privacidade da hospedagem não prova auth/RLS do produto. Sem sincronização entre dispositivos. Histórico permanece projetado, sem snapshots.

## Verificações após ajustes

| Verificação | Resultado |
| --- | --- |
| npm test | 134/134 em 13 arquivos |
| npx tsc --noEmit | Passou |
| npm run lint | Passou |
| npm run build | Passou, Next 16.2.9 |
| Build Vite demo | Passou, 63 módulos; JS 254,96 KB / gzip 77,16 KB |
| node --check script de integração preparado | Passou |
| git diff --check | Passou |
| Busca no bundle por URL Supabase/service role/email fixo | Nenhuma ocorrência |
| Publicação privada | Sites confirmou succeeded |
| Browser/responsividade/temas/a11y interativa | NÃO EXECUTADOS |
| Supabase auth/persistência/RLS/migrations/restore | NÃO EXECUTADOS |

Inspeção estrutural preserva VISIBLE=4, breakpoints 4/2/1, grid diário e tokens. Não equivale a aprovação visual, contraste, teclado ou fluxos interativos. Ambiente managed-linux exige control-browser para QA Sites; capacidade indisponível. Conforme skill Sites, não se improvisou servidor/navegador alternativo nem instalou browser. Sem screenshots atuais. Avisos npm http-proxy/vite-tsconfig-paths existentes permanecem; lockfile/dependências preservados.

## Supabase isolado e próximos passos indispensáveis

Não há ferramenta Supabase conectada ou configuração isolada no checkout novo. Não se procurou credencial de produção como substituto. Migrations 003/004 não aplicadas; flags não ativadas. Projeto vazio necessita schema base: migrations 001/002 não versionadas; 003/004 sozinhas não provisionam base vazia.

`docs/HORIZONTE_V2_SUPABASE_TESTES.md` descreve passos do proprietário, schema/policies e matriz. Script opt-in `scripts/validate-isolated-supabase.mjs` exige ref de teste diferente da produção, URL exata e confirmação específica; não carrega .env financeiro nem service role. Preparado para dois usuários fictícios: senha, sessão nova/persistência, owner CRUD, anon/acesso cruzado, FK/unicidade/RPC atômica. Limpa somente IDs criados; recusa sobrescrever realizado existente. Sintaxe passou, execução remota pendente. Não substitui Server Actions/onboarding, legado service role, migrations/rollback/restore ou browser E2E.

Passo manual: criar/autorizar novo projeto `horizonte-testes`, fornecer refs de teste/produção (identificadores, sem segredos) e acesso administrativo seguro. Credenciais devem ficar somente em runtime Next separado, nunca na demo/Git/chat. Detalhes no guia. Produto não declarado apto para uso real.

## Commits

Implementação local `f82de77`; push HTTPS falhou por falta de credencial. Branch publicada pelo conector GitHub com conteúdo equivalente mais este relatório; SHA remoto informado na entrega. Hospedagem tem SHA independente acima. main/backup e checkout anterior preservados. Backup de código não equivale a backup de dados.
