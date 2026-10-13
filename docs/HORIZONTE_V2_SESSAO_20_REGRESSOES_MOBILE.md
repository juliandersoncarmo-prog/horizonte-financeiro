# Sessão 20 — recuperação localizada do mobile

## Base e isolamento
Git ls-remote e histórico completo confirmados em 13/10/2026. HEAD padrão/main: e4ba912f14db49b98b3e9129c27670b7bf050d48. Versão de desenvolvimento mais recente: fix/horizonte-mobile-refino-componentes, 349771f9ea699819ab481972dd7d964a15aec02e. Lidos AGENTS.md e relatório da Sessão 19. Branch nova: fix/horizonte-mobile-regressoes, criada desse commit. Source Sites aberto pelo helper: ade78fe61e59f4ba3a1f5933a8afe6d3e59bce2e.

Somente app/globals.css alterado funcionalmente, em media queries abaixo de 640px. Desktop, indicadores, barra inferior, sidebar, gestos, modais, autenticação, motor e recorrências sem alteração de implementação. Main, backup e banco original intocados. Runtime revisão 1 e audiência owner-private mantidos. Destino exclusivo: https://horizonte-testes-autenticado.juliandersoncarmo.chatgpt.site (appgprj_6acd25d8d4708191b849f052ba7532ba), Supabase hsvjkbfpvmtnehjbwtgr. Nenhuma operação SQL ou mudança de configuração externa.

## Quatro correções
1. A regra genérica posterior .choice-trigger {display:flex} anulava display:none de .ledger-year. Regra mobile específica agora oculta esse controle. Navegação usa 44px / minmax(0,1fr) / 44px, mês e ano sem quebra. O botão central existente abre a lista de meses de todos os anos da projeção; setas e swipe intactos.
2. Cabeçalho e linhas compartilham repeat(3,minmax(0,1fr)), padding lateral 8px e gap simétrico. Seletor tem largura total do track e grupo texto/seta centralizado. Valores têm box de 100% do track; lápis continua absoluto na faixa inferior, fora do fluxo horizontal. Sem margens negativas ou transforms. Números extensos podem quebrar centralizados; fonte preexistente de 12px abaixo de 360px preservada, 14px nos demais. Não há largura mínima de track que force overflow.
3. Dois alvos adjacentes 40x44px; primeiro ícone alinhado à direita com 4px internos, segundo à esquerda com 4px internos: 8px entre as caixas SVG de 14px. Descrição e valor mantêm a disposição anterior. Confirmações e rótulos acessíveis preservados.
4. A partir de 390px, Primeiro mês e Quantidade ficam lado a lado com track numérico de 80px e gap 8px. Rótulo Quantidade pode ocupar duas linhas, alinhando o campo com Primeiro mês. Mês completo sem quebra e ícone em espaço próprio. Em 320/375px mantém empilhamento por legibilidade. Valores de faturas e competências intocados.

## Comprovação geométrica disponível
Se W é a largura interna da tabela, p=8 e g é o gap, cada track c=(W−2p−2g)/3. Centro do segundo track = p+c+g+c/2 = W/2. Vale nos três modos e com qualquer comprimento de valor; lápis fora do fluxo. Cabeçalho e linhas usam exatamente a mesma regra. Considerando margens de 16px e bordas de 1px por lado:

| Viewport | W | Track c | Centro do track | W/2 | Diferença |
|---:|---:|---:|---:|---:|---:|
|320|286|87,3333|143|143|0|
|375|341|104,3333|170,5|170,5|0|
|390|356|109,3333|178|178|0|
|430|396|122,6667|198|198|0|

Tabela obtida por cálculo, NÃO por getBoundingClientRect. A identidade vale para qualquer W, independentemente dessas estimativas. Caixa do seletor e caixas de valor ocupam o mesmo track. Inspeção de CSS confirma ausência de recuo horizontal específico por modo.

## Verificações
247 testes em 34 arquivos aprovados, incluindo testes DOM dos viewports e gestos existentes. Primeira execução encontrou happy-dom ausente nas dependências locais copiadas; dependências de teste disponíveis no workspace foram recuperadas e toda a suíte repetida sem erros. TypeScript, lint e build Next.js aprovados. TypeScript hospedado aprovado; lint hospedado sem erros e com uma advertência preexistente do login. git diff --check aprovado.

Build Vinext inicial compilou, mas verificador detectou configuração pública Supabase não incorporada: pacote NÃO publicado. Build repetido com as variáveis existentes da revisão 1 fornecidas apenas em memória/stdin, sem alterar código, arquivos de credenciais ou runtime.

## Limitação de aceitação visual
Sem control-browser disponível no ambiente managed. A skill Sites impede improvisar outro navegador/preview nessa situação. Não houve capturas antes/depois, medição real de caixas, inspeção de overflow ou confirmação em Android. As capturas do usuário foram usadas como referência. O alinhamento está demonstrado algebricamente na estrutura CSS, mas o critério de coincidência de centros renderizados ainda depende de medição em navegador. Não declarar validação visual concluída ou garantia definitiva sem essa etapa.

## Publicação
Resultado e SHA source serão acrescentados após confirmação do Sites. Nenhuma publicação em produção original.
