# Sessão 26 — Editor inline final mobile (implementação pendente de validação e publicação)

## Continuidade e isolamento
Base conferida no GitHub: fix/horizonte-mobile-editor-compacto, HEAD bf65775f220b8d07e03d24f436474f1cf2c06c6f, data 2026-10-13T12:47:25Z. Pai 3365b454493a36c38807a59e5e56bab831c3b57f. Relatório da sessão 25 e AGENTS.md lidos. Branch isolada: fix/horizonte-mobile-editor-final. Main e backup continuam e4ba912f14db49b98b3e9129c27670b7bf050d48.

Somente componentes/estilos do editor e este relatório foram alterados. Nenhum acesso ou mudança em bancos, autenticação, regras financeiras ou produção. Destino autorizado permanece Sites appgprj_6acd25d8d4708191b849f052ba7532ba, Supabase hsvjkbfpvmtnehjbwtgr. Nenhuma publicação nesta sessão.

## Implementação
InlineDailyActual.tsx: confirmação limpa automaticamente após 1200ms, com cancelamento do timer na desmontagem ou ao editar novamente. O mesmo botão continua acionando a edição durante a confirmação. O timer começa somente depois do sucesso real da action existente. Mantidos lock contra duplicação, estado ocupado, erros, Enter/Escape, inputMode decimal, atualização local após persistência e refresh somente como fallback.

app/globals.css: apenas o bloco mobile de edição mudou. Formulário em grid com duas colunas e duas linhas internas; input ocupa as duas linhas à esquerda, confirmar na primeira e cancelar na segunda à direita. Shell absoluto e display invisível de dimensionamento preservados. Largura total máxima126px, input até90px e reduzido conforme o espaço do track. Removidos fallback de botões abaixo e regra que aumentava a linha para76px. Nenhuma regra de layout normal ou desktop alterada.

## Investigação da primeira alteração
Inspeção de app/actions.ts e ProjectionProvider.tsx: uma chamada saveDailyActual, validação, autenticação com getUser, criação do cliente de dados, upsert com retorno de data/valor (ou delete), depois atualização local da projeção. Não há consulta de projeção redundante no fluxo normal com inputSnapshot. Não foi implementada otimização especulativa ou confirmação antecipada. Sem medição HTTP/servidor não é possível concluir que a demora é predominantemente de rede, cold start ou infraestrutura.

## Validação e limitações
Revisão textual de escopo e fluxo realizada; isso não equivale a executar testes.
Nesta sessão não existem terminal, filesystem de projeto ou ferramenta de navegador. Não foram executados Vitest, TypeScript, lint, build, validação de geometria em320/375/390/430px, teclado Android/iOS, salvar/cancelar/editar novamente ou tratamento de erros em runtime. Os resultados da sessão25 são históricos e não validam esta mudança.
AGENTS.md exige consultar o guia da instalação Next; a instalação local está inacessível nesta sessão. Tentativas de recuperar o guia versionado remotamente retornaram404. Nenhuma API Next foi modificada.

Limite de toque: a linha aprovada tem40px, com padding vertical de2px. Para caber sem aumentar altura, os botões nesta proposta ficam32x18px; portanto NÃO se declara que alvos de toque acessíveis foram preservados. Dois alvos de pelo menos24px de altura não cabem empilhados nessa linha. A geometria e usabilidade precisam ser revisadas antes de aceitar/publicar. Também não é comprovado se o input terá85–95px nos quatro viewports, pois o track é intrínseco e pode exigir largura menor.

## Estado de entrega
Código preparado em branch isolada, sem merge. Não publicado: não há runtime para gerar e empacotar o build conforme o fluxo Sites. A versão16 já publicada permanece intacta. Critérios de aceitação ainda não comprovados; entrega parcial.
