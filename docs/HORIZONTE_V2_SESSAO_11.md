# Horizonte Financeiro — Sessão 11: correções antes do Supabase

Base remota verificada por fetch e branches GitHub: Sessão 10, `a1fa336`, branch `fix/horizonte-v2-cartoes-diario-teclado`. Último relatório e AGENTS lidos. Nova branch: `fix/horizonte-v2-finais-pre-supabase`. Main e backup permanecem em `e4ba912`.

Diário: removido o bloco laranja; indicador acessível pequeno posicionado dentro do título existente, sem espaço adicional no fluxo. Previsão presente de valor zero aparece como −R$ 0,00 em cinza; realizado zero permanece escuro e abre editor com 0; previsão zero abre editor vazio; ausência de previsão/realizado mantém travessão. Motor e persistência não foram alterados; gastos adicionais continuam permitidos e descontados.

Cartões: campos com larguras limitadas; grupos flexíveis quebram entre campos em telas estreitas. Quantidade de faturas tem rótulo sem quebra independente do input de 80px. Meses completos e valores em duas colunas limitadas de até 160px/112px, com intervalo de 8px. Textos simplificados. Estado, CRUD, validação, confirmação de redução, rascunhos e teclado preservados.

Validação: 147 testes passaram em 15 arquivos; TypeScript, lint e build Next passaram. Build inicial falhou por symlink de dependências fora da raiz Turbopack; repetido com dependências locais, aprovado. Testes novos cobrem previsão ausente/zero, realizado zero, conteúdo inicial do editor, indicador dentro do cabeçalho e gasto adicional após esgotamento. Testes anteriores de cartões validam preservação de valores e rascunhos.

Limitação: capturas não reproduzidas em navegador e QA visual desktop/celular não realizada. O control-browser exigido pelo fluxo Sites está indisponível; não se iniciou servidor nem navegador alternativo. Testes DOM não comprovam layout. Responsividade foi ajustada no código, mas cortes/sobreposições e altura final precisam de verificação visual posterior.

Demonstração segura: mesmo Site privado, dados fictícios locais e sem Supabase; atualização separada do aplicativo financeiro real. Nenhuma migração, consulta ou modificação de Supabase, Auth, RLS ou dados financeiros. Nenhuma alteração de produção financeira.
