# Sessão 24 — Data mobile mais legível

## Continuidade

GitHub real confirmado por git ls-remote --heads origin e git fetch, ordenando refs por committerdate. Último HEAD confirmado: fix/horizonte-mobile-reconstrucao, 0a1c87b0a66cfb72c48ce8bc9a84235259feef3f. Lidos AGENTS.md, guia CSS local do Next e relatório da sessão 23. Nova branch: fix/horizonte-mobile-data-legivel, criada desse SHA.

## Alteração restrita

app/globals.css: somente duas regras da Data, dentro de max-width:639px. Número: 15 → 17px, peso 600 preservado, line-height 20px explícito. Semana: 12 → 14px, cor secundária preservada, line-height 16px explícito. A altura explícita impede que o line-height relativo de text-sm/text-xs cresça junto com a fonte e exceda a linha compacta em 320px. Gap 4px horizontal mantido; abaixo de 360px permanece a composição vertical sem gap, com 36px de caixas de texto dentro da linha de 40px.

Nenhuma mudança em componentes, motor, seletor de meses, indicadores, sidebar, barra inferior, formulários, gestos ou regras desktop. Script de validação renderizada existente atualizado para esperar 17/14px.

## Distribuição responsiva

Preservados max-content nos três tracks, subgrid e justify-content:space-between. Quando a Data aumenta o primeiro track em delta, o espaço livre entre os três tracks perde delta/2 em cada um dos dois intervalos, enquanto as bordas externas permanecem ancoradas. O conjunto central pode se mover delta/2 pela própria distribuição; não foram aplicados offsets ou margens artificiais. Cabeçalho e linhas continuam compartilhando tracks. Fontes financeiras, lápis inline, gaps mínimos 8px (6px em 320px), padding e largura total inalterados.

## Verificações

- 252 testes Vitest em 35 arquivos passaram.
- TypeScript --noEmit e lint do repositório passaram.
- Build Next production com --webpack passou após a alteração final.
- TypeScript do checkout hospedado passou; lint sem erros, com um warning preexistente no login.
- Build Sites/Vinext passou. Verificadores do CSS e configuração pública Supabase passaram.
- git diff --check passou. Comparação literal com CSS base confirma somente font-size/line-height das duas regras de Data modificados.
- Inspeção das condições CSS em 320/375/390/430px: 17px e 14px se aplicam nas quatro; estrutura e regras financeiras mantidas. Isso é validação de fonte, não geometria renderizada.

## Limitação visual

Não há control-browser disponível nesta sessão. Pelo fluxo Sites gerenciado, não foi iniciado preview, instalado navegador ou improvisada outra via. Não foram executadas medições renderizadas em 320/375/390/430px nem screenshots. Não foi comprovada ausência de colisões ou scroll horizontal, nem determinado o maior tamanho seguro por viewport. O fallback de scroll interno preexistente foi preservado. A matriz scripts/verify-mobile-table-layout.mjs está preparada, mas NÃO foi executada. Não apresentar esses critérios como aprovados.

## Isolamento e publicação

Somente site de testes https://horizonte-testes-autenticado.juliandersoncarmo.chatgpt.site, projeto appgprj_6acd25d8d4708191b849f052ba7532ba, audiência owner-private preservada. Supabase exclusivo hsvjkbfpvmtnehjbwtgr: apenas obtida chave pública existente para compilação. Nenhum acesso a dados, SQL, migração ou alteração no banco/configuração. Main, produção e backup intocados.

Publicação nativa confirmada: succeeded, deployment appgdep_6ace220ea5e88191939f128ce129bc24, revisão de ambiente 1. Commit Sites publicado: b0484732d8a9d36711479133db211edf6e3bd55a. A branch GitHub contém o mesmo CSS e script validados, com este registro final adicional. Seu SHA final pode ser consultado no HEAD da branch.
