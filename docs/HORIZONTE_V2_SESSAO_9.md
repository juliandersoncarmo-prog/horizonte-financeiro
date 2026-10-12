# Horizonte Financeiro — Sessão 9: correções visuais e de usabilidade

## Continuidade

GitHub confirmado via ls-remote: Sessão 8 `7fa61fc7bcf0881e54010615c06a82ad60fd4eaa`. Branch exclusiva `feat/horizonte-v2-usabilidade`, derivada desse SHA. Lidos AGENTS.md, documentação Next.js 16 instalada sobre use client e relatórios 7/8. `main` e `backup/horizonte-v1-2026-10-11` confirmados em `e4ba912f14db49b98b3e9129c27670b7bf050d48` e preservados.

## Alterações

- Diário: valor com lápis discreto; editor compacto de altura h-7 dentro da linha h-9 e grid original. Um controlador na ProjectionProvider limita a edição a uma data por vez, inclusive entre meses. Confirmar/check, cancelar/X, Enter e Esc; vazio remove realizado, zero permanece explícito. Sucesso/exclusão/cancelamento fecha; erro mantém campo e mensagem. Bloqueio síncrono impede requisições repetidas e troca da célula durante gravação. Trocar célula antes de salvar descarta o rascunho anterior. Erros aparecem somente na célula ativa.
- Modal do dia: removidos formulário e mutação do Diário. Preservados previsto, realizado, diferença, alerta de saídas incluídas, movimentos, saldo e Entrada/Saída. Diário é editado pelo lápis no calendário.
- Resumo: quatro cartões em grid 2x2, ícones próprios, valores destacados; saldo final em bloco maior. Faturas em informação complementar, explicitamente já incluídas nas Saídas. Navegação/cálculos/nomes e aviso de mês parcial preservados. Tokens claro/escuro, min-w-0 e quebra de valores mantêm estrutura compacta.
- Cartões: nome, vencimento e quantidade vazios no novo cadastro. Campos automáticos, meses por extenso, valores mais baixos e compactos, duas colunas de faturas a partir de sm e uma no celular. Primeiro mês continua atual. Valores preservados por competência; confirmações de descarte inclusive para zero continuam presentes. Rótulo R$ visível no grupo.
- Após confirmação da ação de armazenamento: “Cartão cadastrado!” e “As faturas foram incluídas na projeção.”, com Cadastrar outro (limpa formulário) e Fechar (refresh/fecha). Durante requisição não mostra sucesso nem permite novo envio. Falhas preservam rascunho. Falha de leitura da lista após gravação tem mensagem distinta, sem sugerir que o cadastro falhou ou oferecer novo envio duplicado. CRUD de existentes preservado.
- Demo: fixture inicial sem cartão. Restaurar exemplos inclui cartão somente por ação explícita e confirmação. Dados já salvos sob a chave existente são preservados, inclusive eventual cartão de exemplo de sessões anteriores; não se apagam registros automaticamente. Nenhuma conta real foi consultada ou alterada.

Componentes compartilhados entre Next e Vite; aplicativo usa Server Actions/Supabase e demo usa adapter localStorage. Confirmação na demo é exclusivamente de armazenamento local, identificada pelo banner. Nenhuma mudança no motor, schema, RLS, Auth, migrations, flags ou Supabase de produção.

## Verificações

| Verificação | Resultado |
| --- | --- |
| Testes automatizados | 143/143, 14 arquivos |
| TypeScript | npx tsc --noEmit passou; também passou no build Next |
| Lint | npm run lint passou |
| Build aplicativo | npm run build passou, Next 16.2.9 |
| Build demo | Vite passou, 66 módulos, JS 257,43 KB / gzip 77,90 KB |
| git diff --check | Passou |
| Bundle Supabase URL/service_role/email fixo | Nenhuma ocorrência |
| Publicação demo privada | succeeded |
| Browser real, dimensões, mobile/desktop, temas | Pendentes |
| Persistência/auth/RLS reais em Supabase isolado | Pendentes; produção não usada |

Oito testes DOM novos em happy-dom (dependência de desenvolvimento fixada 21.0.1 e lockfile): edição exclusiva, Esc/cancelar, zero/Enter, vazio/check/exclusão, erro mantendo campo, repetição e troca durante gravação, quatro cartões/navegação do resumo, preservação/cancelamento de redução de faturas, sucesso após armazenamento/sem duplicação/limpar formulário e erro/fechar. Um novo teste do adapter verifica fixture sem cartão versus restauração explícita. Os testes anteriores cobrem recálculo, competência única, armazenamento local com falha, ações e motor. DOM com mocks não comprova CSS/layout real ou persistência Supabase.

Navegador control-browser não disponível neste ambiente managed-linux. Conforme skill Sites (`sites/SKILL.md`): “If `$control-browser` is unavailable, skip browser QA: do not start a preview server, install a browser, or improvise another browser-control path.” Não se instalou nem iniciou navegador alternativo. Testes DOM são independentes dessa QA e não foram apresentados como validação visual. Avisos npm http-proxy e vite-tsconfig-paths existentes permanecem.

## Entrega hospedada

URL: https://horizonte-financeiro-demo-v2.juliandersoncarmo.chatgpt.site

Mesmo Site privado `appgprj_6acc352b0a1c8191876eb16ef2012943`, somente proprietário; nenhuma mudança de público. Fonte hospedada commit `ed20c288fc1c3430e8697600ff35fafd6c756dda`, deployment `appgdep_6acce8a5250c8191b88cebbbcf0efb07`, status succeeded. Histórico da hospedagem separado do GitHub. Archive estático contém a demo compilada; não é deploy do aplicativo financeiro real. Banner Sessão 9.

Para testar: lápis em duas datas (somente a segunda aberta), zero+Enter, vazio+check, Esc/X; abrir data sem formulário Diário; conferir resumo e meses; novo cartão com campos vazios, quantidade 2→3→1 cancelando descarte, cadastro, Cadastrar outro e Fechar. Conferir desktop/mobile/temas pessoalmente na URL, usando dados fictícios. Cartões previamente salvos na demo permanecem; para uma primeira abertura sem exemplos, usar um navegador/perfil sem dados anteriores dessa origem.

Relatório versionado nesta branch. SHA GitHub final consta na entrega. Sem merge, deploy real, mensagens, WhatsApp ou funcionalidades fora do escopo.
