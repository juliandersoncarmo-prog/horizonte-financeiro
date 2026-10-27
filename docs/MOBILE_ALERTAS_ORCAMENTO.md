# Mobile e alertas de orçamento

Base GitHub: `feat/refinamentos-gastos-diario`, commit `60c60c6`.
Base publicada: versão 23, fonte Sites `ff2dbafce27a6f8c7f07e1019e974e3b608441e0`.
Os cinco arquivos de aplicação alterados eram idênticos na hospedagem e no GitHub antes da edição. A main do GitHub foi preservada.

## Alterações

- Navegação mobile: Início, Diário, +, Gastos, Resumo. Cartões permanece no menu lateral.
- Modal +: quatro opções em grid com ícones fixos, alvos de toque e área segura.
- Histórico: grid compacto, ações diretas no desktop e diálogo de opções no mobile.
- Mês do histórico: nome visível completo sobre o seletor nativo. Navegação mensal da projeção permite quebra legível do texto.
- Alerta informativo após salvar: orçamento, total e excedente; quick add só fecha após Entendi.
- Nova RPC `save_daily_expense_with_budget_alert`: usa a trava transacional por usuário existente, calcula antes/depois da categoria/mês de destino e delega a gravação à RPC original. As rotinas de conciliação, cobertura e projeção não foram alteradas.

Não há marcadores de alertas em cache/localStorage nem backfill. Uma leitura de histórico não gera alerta. O total real atual determina o rearme após edição/exclusão/mudança de categoria/data/orçamento. Categorias sem orçamento não alertam. Limite zero é orçamento definido. Orçamentos gerais e mensais da mesma categoria são somados como nas barras existentes.

## Recuperação

A migração é aditiva e não modifica registros existentes. A versão 23 continua disponível para rollback da publicação; o commit base continua na branch de integração. Para recuperar a interface, republicar a versão 23. A nova função pode permanecer sem efeito, pois a versão anterior usa a RPC original. Depois do rollback de todas as instâncias, caso necessário, remover somente `public.save_daily_expense_with_budget_alert(uuid,text,numeric,uuid,date,text,timestamptz)`. Nenhuma restauração de dados é necessária.

## Validação

- Testes de banco em PGlite: limite exato, ultrapassagem, repetição, retry idempotente, edição para dentro/fora, exclusão, mudança de mês/categoria, sem orçamento, orçamento zero, soma de orçamentos e isolamento/anon.
- Testes DOM: aviso após salvar, quick add aguarda Entendi, ausência de avisos históricos e ações compactas preservando confirmação de exclusão.
- Smoke transacional no Supabase autorizado: 100 + 10 gera excedente 10, retry não duplica, ROLLBACK ao final. Nenhum dado de QA persistido.
- Nova função SECURITY INVOKER, search_path vazio, execução negada a anon e permitida a authenticated. Políticas existentes preservadas.
- TypeScript, ESLint, Next.js production build e Vinext/Sites production build.
- A prévia gerenciada falhou na inicialização; a fixture isolada também não pôde acessar dependências pelo daemon. O navegador da publicação exige autenticação. Inspeção visual renderizada desktop/mobile e E2E autenticado não foram concluídos. Revisão CSS/DOM e build não substituem essa inspeção.
