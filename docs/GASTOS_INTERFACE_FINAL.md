# Ajustes finais de interface — Gastos do Diário

Base verificada em 26/10/2026 (America/Fortaleza): publicação Sites versão 24, source `863153990dbed648a5c3b9b565cf865709e61c95`, deployment `appgdep_6adff7d3b2e8819187590dec0e51bf98` concluído. Componente DailyExpenses idêntico ao GitHub `0f93a00`, integrado por PR #4 em `feat/refinamentos-gastos-diario` (`0859e7a`). Main não foi utilizada.

Alterações limitadas ao cabeçalho, total diário e menu de opções. Mobile: título, mês, registrar gasto. Desktop mantém título e botão na primeira linha, mês abaixo. Botão Hoje removido; destaque da data atual preservado. Total com rótulo Total gasto no dia, 20 px, peso 650, alinhamento à direita e separador. Menu não modal de 144 × 98 px, sem overlay, portal no body, limitado ao viewport e à barra inferior; fecha por clique fora, Esc, Tab ou seleção e oferece navegação por setas. Formulários e confirmação continuam no ModalPortal original.

Validação: 47 arquivos/349 testes passaram com maxWorkers=2 e timeout=30000 (primeira execução paralela teve timeouts em benchmarks e expectativa antiga de modal). Após acrescentar cobertura de setas, Escape, clique fora e Tab, 17 testes de DailyExpenses passaram. TypeScript e lint aprovados. Next build aprovado com --webpack: Turbopack rejeitou o symlink local de node_modules, sem defeito do aplicativo. Build de publicação Vinext aprovado.

QA no navegador com o componente real e ações fictícias isoladas, sem gravação no Supabase: larguras 320, 375, 390 e 1280 px; ordem do cabeçalho, total integral em 20 px, menu dentro do viewport/acima da barra inferior e formulários de edição/exclusão conferidos. Esc fecha o menu. Dados reais e fluxos financeiros não foram alterados. Nenhuma migração ou configuração Supabase foi executada.

Reversão: versão Sites 24 permanece disponível. GitHub preserva a branch de desenvolvimento `fix/gastos-interface-final`; o PR integrado pode ser revertido na branch de continuidade. Publicação no domínio Horizonte Testes existente.
