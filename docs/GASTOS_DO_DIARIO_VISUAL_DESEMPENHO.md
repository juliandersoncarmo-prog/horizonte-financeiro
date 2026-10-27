# Refinamento visual e desempenho

Base publicada: Horizonte Testes versão 22, fonte Sites ae5de62c7ccef7c7276aeafaa4bede8ca75a8e80. Código funcional conferido com feat/refinamentos-gastos-diario, ec537510950d778ac83fcb8ea0596703714575b5 (PR #2). Main não foi usada. Infraestrutura de publicação mantida separada do repositório Next, como na versão anterior.

## Alterações

Indicadores Orçamento do dia / Gasto no dia / Saldo do Diário, saldo negativo com sinal e cor, progresso acessível do consumo diário e por categoria (percentual real acima de 100% e excedente). Totais mensais idênticos aparecem uma vez; valores sem registro individual mantêm a distinção. Tipografia somente do módulo, indicadores em coluna no celular, formulários com campos de 16 px e alvos de toque de pelo menos 44 px. Confirmação de exclusão com quebra de palavras, mensagem curta e botão vermelho. Registrar gasto mantém a data selecionada no histórico.

## Causa e solução do carregamento

Antes: cache local de 30 segundos, perdido ao desmontar; focus e timer invalidavam todos os meses, incluindo vizinhos pré-carregados. Cada atualização substituía toda a tela por carregamento, mesmo com dados presentes.

Agora: cache volátil no layout autenticado já identificado por user.id, sem localStorage de dados financeiros e sem cache compartilhado de servidor. Até seis meses e 60 segundos de validade. Leituras simultâneas são deduplicadas. Retornar à página/aba reutiliza dados válidos; dados expirados permanecem visíveis durante revalidação e falhas mostram um aviso. Eventos entre abas invalidam o cache. Alterações do orçamento invalidam todos os meses; alterações dos realizados invalidam somente meses divergentes do snapshot já consultado. Inclusão/edição/exclusão invalida origem/destino e recarrega o mês exibido quando necessário; meses não afetados continuam válidos. O mês afetado é lido do servidor para preservar a conciliação autoritativa, sem calcular totais financeiros otimistas no cliente. Respostas iniciadas antes da invalidação são recusadas.

## Medição controlada antes/depois

Mesma tela, happy-dom, action mensal simulada com latência fixa de 100 ms. Após leitura inicial e pré-carregamento dos vizinhos:

| Operação | Antes | Depois |
| --- | --- | --- |
| Voltar o foco à aba com mês válido | 3 chamadas mensais | 0 chamadas |
| Histórico oculto ao recuperar foco | sim | não |
| Sair e retornar à página no mesmo layout | 3 chamadas mensais | 0 chamadas |

Esses números medem chamadas reais à action no harness; não são medições de latência da rede Supabase em produção. A primeira visita continua dependendo da rede. Não se atribui uma redução percentual de latência à primeira visita com base neste ensaio.

## Validação e reversão

Suíte completa com conciliação SQL/PGlite, motor Diário Inteligente, ações e DOM; testes de cache com expiração, concorrência, invalidação seletiva e respostas antigas. TypeScript, lint e builds Next/Vinext; verificadores de CSS original e configuração Supabase compilada. O lint hospedado possui um warning anterior no login (window.location.assign).

Limitação visual: sites-preview informa http://terminal.local:4173/, mas o navegador retorna ERR_CONNECTION_REFUSED. Não foi possível revalidar geometria/renderização em desktop e mobile nesta infraestrutura; testes DOM e revisão dos breakpoints não equivalem à inspeção visual.

Nenhuma migração ou escrita nos dados financeiros existentes. Motor, regras de conciliação, sidebar, navegação mobile e Auth preservados. Para reversão, republicar a versão 22 do mesmo Site, compatível com o banco atual; no GitHub, reverter somente os commits deste refinamento. Não usar versões anteriores à conciliação atual para escrita.
