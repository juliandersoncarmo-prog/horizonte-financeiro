# Horizonte V2 — Sessão 14: edição completa, Diário e mobile

## Continuidade e estado
Base verificada duas vezes no GitHub: fix/horizonte-exclusao-desempenho em faf75c2e2392ee0a5b4527475f1747ce2627f46f. Lidos AGENTS.md e relatório da Sessão 13. Nova branch exclusiva: fix/horizonte-mobile-edicao-completa.
Commits remotos de implementação: d4419ebea679326bcd3548c257bbea9f69f44ef5 e 6cf32a27e238ff82fcc3ad7a97d999b36733af47. Este relatório é um commit posterior.
Main, backup, produção financeira e Supabase original não foram modificados. Nenhuma migração ou escrita em dados financeiros reais foi realizada. Motor financeiro sem alterações.

## Implementação
- Lixeira ao lado do lápis em entradas/saídas do popup da data. Confirmação própria, cancelamento, mensagem de erro e sucesso somente após confirmação do banco. Trava síncrona impede envio duplicado.
- Avulsa exclui somente ID; regra informa exclusão de todas as ocorrências, passadas e futuras; fatura chama deleteCardInvoice(cardId, invoiceId), preservando cartão e outras faturas.
- Avulsa: descrição, valor, data e inclusão no Diário para saídas. Datas civis impossíveis rejeitadas no servidor.
- Regra: descrição, valor, frequência, dia, data inicial, término e quantidade/data final; inclusão no Diário para saídas. Preenchimento vem da regra original obtida na projeção autenticada, sem inferir a regra a partir de uma ocorrência. Server Action escreve somente os campos permitidos. Alteração de agenda incompleta, dia inválido, data impossível e término anterior ao início são recusados.
- Confirmação explícita ao salvar uma recorrência informa recálculo de todas as ocorrências, inclusive passadas. Categoria/tipo e demais metadados armazenados permanecem. Sem exceções de ocorrências, sem mudar a semântica quinzenal, semanal ou de meses curtos.
- Faturas continuam editáveis pelo gerenciador existente, preservando competência única e vencimento do cartão.
- Diário: lápis edita nome e valor mensal juntos, confirma impacto nas previsões globais; cancelar mantém dados; realizados existentes e competência do orçamento permanecem.

## Mobile
Breakpoint real abaixo de 640 px; desktop mantém quatro meses a partir de 1024 px e dois em tablets.
Cabeçalho compacto com menu; sidebar desktop oculta no celular, painel lateral fechado por padrão, fundo escurecido, Escape, foco contido e restaurado pelo ModalPortal. Escolher ação fecha o painel e abre o modal correspondente fora dele.
Um mês ocupa a largura disponível. Controles anterior/próximo e seletor Diário/Entradas/Saídas preservados. Não foi adicionado gesto horizontal, para evitar conflito com rolagem e edição.
KPIs em duas colunas, saldo em linha própria; paddings e grades do calendário adaptados; min-width:0 no conteúdo; viewport dinâmico; formulários em coluna no celular e campos com fonte de 16 px para evitar zoom de foco no iOS.
Linhas de eventos quebram a descrição e reservam áreas maiores de toque para lápis/lixeira. Campos de descrição/valor no editor têm rótulos associados.
**Não há aprovação visual mobile nesta sessão.** Testes DOM não medem layout CSS, barras horizontais, teclado virtual nem interação touch. Validar visualmente 320/375/390/430 px e desktop continua sendo requisito pendente.

## Desempenho e dados
A projeção já consultava daily_budgets; agora entrega sua lista sanitizada e regras para os editores. O Diário abre com os dados dessa renderização, sem aguardar outra Server Action. Fallback fora do provider ainda abre imediatamente com carregamento discreto e consulta real.
Estado pertence à árvore autenticada; sem cache global, localStorage financeiro ou cache persistente compartilhada. Refresh após sucesso atualiza projeção, previsões, saldos e Resumo. Alterações de orçamento confirmadas são refletidas localmente enquanto o refresh ocorre.
O cadastro de novo orçamento conserva a leitura de confirmação existente, em vez de inventar ID. Exclusão/edição atualizam itens locais após persistência.

| Medida | Antes | Depois | O que realmente mede |
| --- | --- | --- | --- |
| Abertura do Diário hospedado | getAllDailyBudgets: 804 ms wall, 12 ms CPU | zero chamadas adicionais ao abrir dentro do provider | antes: log real; depois: teste DOM/fluxo, não tempo ponta a ponta |
| Tempo percebido de abertura | 3–5 s relatados pelo proprietário | não medido em navegador hospedado | sem comparação real após publicação |
| Refresh hospedado anterior | 519 e 672 ms wall; 150/153 ms CPU | não medido após publicação | duas requisições reais anteriores |
| Motor local, fixture 100 regras/2000 avulsas/73 meses | relatório anterior: mediana 88,03 ms | execução final: mediana 79,01 ms; 68,11–124,52 ms | motor inalterado; não atribuir ganho a esta sessão |

Logs mostram que a maior parte dos 804 ms da consulta não foi CPU; isso sugere espera por chamadas externas. Não foi isolado o tempo SQL nem a rede do cliente; não se atribui toda a demora ao Supabase. Sem trace de navegador, não há conclusão quantitativa sobre React, runtime e rede separadamente.

## Verificação
- npm test: 190/190, 25 arquivos, no estado final.
- npx tsc --noEmit: aprovado.
- npm run lint: aprovado.
- npm run build: aprovado, Next 16.2.9.
- Build hospedado: aprovado, Vinext beta.5/Cloudflare, após os últimos ajustes.
- Testes novos: data de avulsa e mudança entre competências com saldos/resumos consistentes; atualização da agenda recorrente completa e rejeição de valores/data/término inválidos; lixeira confirmar/cancelar; nome e valor juntos; Diário sem consulta adicional; seleção de um mês e navegação em 320/375/390/430 px (somente DOM).
- Regressões existentes: erro, envio duplicado, sessão ausente, propriedade, zero linhas afetadas, regras inteiras, fatura individual, foco/Escape, saldos e Diário.
- Consulta read-only real confirmou políticas auth.uid() com USING e WITH CHECK nas cinco tabelas abrangidas. Nenhuma política foi alterada. RLS e constraints já existentes continuam sendo usadas; constraint recurring_diario_saida impede conciliação de entradas.
- Propriedade foi testada localmente com Supabase simulado e políticas reais inspecionadas. Não houve E2E com dois usuários reais ou mutações no banco de testes nesta sessão.
- Changelog Supabase Markdown recusado pelo leitor web por content-type; consultada documentação oficial RLS. Sem troca de SDK.

## Publicação exclusiva de testes
Site: appgprj_6acd25d8d4708191b849f052ba7532ba. Acesso owner-private preservado; ambiente revisão 1.
Source final: 0efcb000063ed40dfc312a31f45be7de779a1af6.
Deployment final: appgdep_6acd6e0d74f08191aa829c49af3b07de, succeeded.
Versão final: appgprj_6acd25d8d4708191b849f052ba7532ba~appgver_d18432e2e12481918c2d427f8ca93e19.
URL: https://horizonte-testes-autenticado.juliandersoncarmo.chatgpt.site
Git push direto do GitHub não tinha credencial CLI; os arquivos exatos foram publicados pelo conector GitHub via tree/commit e nova branch. Os commits remotos acima são os canônicos. Source Sites foi preparado e publicado pelo helper oficial, preservando starter e configuração.

## Pendências obrigatórias
Sessão implementada e publicada para teste, **não integralmente validada**.
1. Browser mobile real/emulado: layout, ausência de overflow, teclado virtual, edição completa, navegação e foco nas quatro larguras; desktop com quatro colunas.
2. E2E autenticado com dados fictícios e duas contas, verificando persistência e isolamento real.
3. Medição ponta a ponta antes/depois do popup hospedado e tempo de refresh após mutações.

Regra da skill Sites: “If $control-browser is unavailable, skip browser QA: do not start a preview server, install a browser, or improvise another browser-control path.” Nenhuma habilidade/ferramenta control-browser está disponível nesta sessão; portanto não foi iniciado preview ou instalado navegador, e não foram fabricadas capturas ou aprovação visual.
