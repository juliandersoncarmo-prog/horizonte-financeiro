# Horizonte Financeiro — Sessão 2

Base verificada: `623d53b3567a9cda077519e19606aa5c17fbd0d3`, branch `chore/horizonte-v2-auditoria`. Desenvolvimento: `feat/horizonte-v2-motor`.

## Backup e limites

Antes das implementações, `git ls-remote` confirmou `main` e a referência remota permanente `backup/horizonte-v1-2026-10-11` em `e4ba912f14db49b98b3e9129c27670b7bf050d48`. Essa branch resolve a necessidade de recuperação remota. A tag homônima foi criada localmente; publicação por HTTPS falhou por ausência de credencial no terminal. Não houve sobrescrita de referência ou force push. A tag remota permanece opcionalmente pendente; a branch de backup já existe.

Nenhum acesso ao Supabase real, migração, reset, seed, deploy ou modificação da main. Preservados IDs e dados existentes. Não há mudança de schema. A interpretação das configurações passa a seguir a regra abaixo; nenhuma configuração armazenada é convertida automaticamente.

## Comportamento implementado

- Saldo inicial é o saldo imediatamente **antes** dos movimentos da data de referência. Movimentos avulsos, recorrências e diário dessa data são aplicados uma vez. Dias anteriores não são gerados na projeção, pois não se pode inferir seu saldo a partir do saldo informado.
- Exemplo: saldo R$ 1.000 em 15/01, entrada R$ 100 e diário R$ 10 nessa data resultam em R$ 1.090; uma saída em 10/01 não é descontada novamente. O primeiro mês contém apenas o período desde a referência; seus totais são parciais.
- Configurações monta o formulário já existente, com data editável, saldo zero/negativo e explicação da regra. Salvamento valida valor finito e data civil existente. Nenhuma configuração foi salva nesta sessão.
- Horizonte da Server Action considera a distância entre a referência e o mês solicitado. Ex.: referência dezembro/2024 e solicitação janeiro/2026 com quatro meses requerem 17 meses desde a referência, terminando abril/2026. Meses anteriores à janela visual ainda são calculados para continuidade do saldo.
- Mensal: dias 29/30/31 são limitados ao último dia válido do mês, sem deriva. Dia 31: 31/01, 28/02, 31/03, 30/04; em 2024, 29/02.
- Início e término por data são inclusivos e comparados com o vencimento efetivo. Quantidade conta disparos reais desde data_inicio, inclusive os anteriores à referência. Não se reinicia ao navegar.
- Semanal mantém intervalos de sete dias desde data_inicio, com aritmética civil UTC. Único dispara uma vez. Quinzenal preserva o comportamento existente: dia cadastrado e dia + 15 dentro de cada mês; não vira intervalo móvel e não ajusta o segundo disparo além do fim do mês. Agora conta cada disparo para término por ocorrências.
- `horizonte` e `nunca` são limitados pela janela de cálculo; não há persistência de um término ao mudar o horizonte.
- Relógio do motor aceita todayISO para testes; padrão usa a data civil de America/Fortaleza.
- Valores são arredondados a centavos nas operações. O orçamento é dividido em centavos inteiros, distribuindo o resto nos primeiros dias do mês. R$ 10 em fevereiro/2026: 20 dias de R$ 0,36 e 8 de R$ 0,35. Em mês parcial só entram as parcelas desde a referência.
- Removidos logs financeiros da projeção e da página. O catch da projeção repropaga sinais internos do Next conforme documentação instalada.
- Lint corrigido sem desligar regras: efeito do carregamento inicial do modal, assinatura de tema por useSyncExternalStore, callback de useMemo e export nomeado do Tailwind.

## Validação

| Verificação | Resultado |
| --- | --- |
| npm ci --ignore-scripts --no-audit --no-fund | 441 pacotes; lockfile preservado |
| npm test | 34/34 passaram: 17 existentes + 17 regressões |
| npx tsc --noEmit | Passou |
| npm run lint | Passou, sem erros ou warnings ESLint |
| npm run build | Passou |
| git diff --check | Passou |
| Supabase/autenticação reais | Não exercitados |
| Validação visual autenticada | Não exercitada; estrutura inspecionada no código |

Regressões: âncora no meio do mês com abertura zero/negativa/positiva; movimentos antes/na/depois da referência; continuidade; dias 28–31; fevereiro normal/bissexto; dezembro/janeiro; início/fim inclusivos; contagem mensal/semanal/quinzenal/única; limite zero; horizonte antigo; primeiro saldo negativo; relógio e conservação de centavos.
Avisos informativos npm de http-proxy e Vite de plugin redundante permanecem; nenhuma atualização de dependência especulativa.

## Pendências e Sessão 3

Diário inteligente, cartões e Resumo Mensal não implementados. O orçamento global/mensal e divisor de 30 no modal seguem o comportamento antigo, exceto pela distribuição monetária do motor; normalizar na Sessão 3. Falhas de queries ainda podem parecer ausência de dados: tratar em etapa própria, sem banco real. RLS real e rollback de dados não foram verificados. Testar interface e autenticação em ambiente isolado antes de qualquer publicação.

Continuar de `feat/horizonte-v2-motor`, verificando seu HEAD remoto e lendo este documento e HORIZONTE_V2_PLANO.md. Criar uma branch da Sessão 3 sem alterar main. Definir realizado substituindo previsto, zero confirmado e prevenção de duplicação. A orientação mais recente do proprietário é assumir o valor previsto para dias passados sem registro, permitindo edição posterior; isso diverge da proposta inicial do plano e deve orientar o desenho da Sessão 3. Preparar qualquer persistência em ambiente de teste separado, com backup de dados antes de migração. Preservar quatro colunas e seletor.

Rollback de código: checkout separado da branch de backup. Nenhuma restauração de banco é necessária para estas mudanças de código; não fazer deploy ou reset da main nesta sessão.
