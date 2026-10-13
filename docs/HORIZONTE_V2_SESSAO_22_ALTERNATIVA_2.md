# Sessão 22 — Alternativa 2 da tabela mobile

## Base e escopo

GitHub consultado pelo conector e por git fetch. A branch de desenvolvimento mais recente confirmada foi `fix/horizonte-mobile-tabela-eixo`, HEAD `d3738fec4ba0f251ed4f0028f8353e25ba423e85`, posterior a `574d622`. Nova worktree/branch: `fix/horizonte-mobile-alternativa-2`, criada desse SHA. Lidos AGENTS.md, documentação local Next.js de CSS e relatório da Sessão 21. Main e backup permanecem em `e4ba912f14db49b98b3e9129c27670b7bf050d48`.

Referência aplicada: requisitos explícitos do proprietário para a Alternativa 2 (largura total alinhada aos indicadores e conjunto valor+lápis ligeiramente à direita). A busca de continuidade não recuperou o HTML exato da prévia aprovada; não se declara comparação pixel a pixel com esse HTML.

Única alteração de implementação: último bloco mobile de `app/globals.css`, dentro de `@media (max-width: 639px)`, restrito a `.ledger-months` e descendentes. Nenhuma mudança em componentes, motor, banco, autenticação, gestos, seletores superiores, indicadores, sidebar, barra inferior ou modais. Desktop continua com suas regras e quatro meses.

## Implementação

- Contêiner da tabela: width/max-width 100%, box-sizing border-box, min-width zero, padding horizontal 16px, igual ao padding vigente dos indicadores. Card visível: flex 0 0 100%, width/max-width 100%, margens horizontais zero. Cabeçalho, área de linhas e linhas explicitamente em 100%.
- Distribuição interna mantida em 1fr / 1.8fr / 1fr, gap 2px, padding horizontal 6px. Data à esquerda e Saldo à direita. A largura externa é independente desses tracks.
- Diário: flex sem quebra, valor com largura intrínseca, lápis de 12px imediatamente após o valor com gap de 5px. Eliminadas as reservas fixas de 18px que separavam o lápis dos números curtos. Padding esquerdo 4px produz viés do centro do conjunto de apenas +2px. Mesmo viés aplicado ao conjunto título+seta e aos modos Entradas/Saídas.
- Valores centrais: peso 600, teto 16px; Saldo: peso 600, teto 14px; data 15px e dia da semana 12px. Strings e cores existentes preservadas. Fórmula responsiva existente por comprimento continua, agora com mais espaço útil para o Diário. Valores extensos podem ficar menores que o teto nas telas estreitas.
- Linhas permanecem 40px; conjunto e editor 32px. Lápis em fluxo flex, sem posicionamento inferior ou quebra. Edição e área clicável da linha continuam existentes.

## Comparação geométrica calculada

Os números abaixo são cálculos das regras CSS, NÃO medições de DOM ou screenshots. Supõem largura disponível do ledger igual ao viewport, sem barra de rolagem ocupando largura.

| Viewport | Tabela externa | Indicadores (grupo) | Margem esquerda/direita | Centro do conjunto título e valor+lápis |
|---|---|---|---|---|
|320px|288px|288px|16px / 16px|162px|
|375px|343px|343px|16px / 16px|189,5px|
|390px|358px|358px|16px / 16px|197px|
|430px|398px|398px|16px / 16px|217px|

Tabela e indicadores compartilham o mesmo ancestral e padding simétrico. Mesmo com uma barra de rolagem no ancestral comum, a igualdade das larguras úteis se mantém; as margens em relação ao viewport podem depender da barra.

Estimativa do tamanho do Diário por fórmula CSS (moeda/sinal/centavos mantidos):

|Viewport|−R$ 25,00|−R$ 200,00|−R$ 1.200,00|−R$ 10.000,00|
|---|---|---|---|---|
|320px|16px|16px|13,81px|12,75px|
|375px|16px|16px|16px|15,85px|
|390px|16px|16px|16px|16px|
|430px|16px|16px|16px|16px|

O centro do número isolado não é o centro do grupo: o grupo inclui o lápis, conforme solicitado. Entradas/Saídas sem lápis mantêm o centro do respectivo texto no mesmo eixo do conjunto. O gap de 5px acompanha o comprimento do texto, sem reservar espaço variável até o Saldo.

## Verificações efetivas

- Vitest: 247 testes em 34 arquivos passaram (motor, persistência, edição e controles existentes).
- TypeScript --noEmit: passou no repositório e no checkout hospedado.
- Lint do repositório: passou. Lint do checkout hospedado: zero erros, um warning preexistente no login (`window.location.assign`), preservado pelo escopo.
- Build Next.js: passou.
- Build Vinext: passou. Verificadores do CSS/configuração pública Supabase no pacote: passaram.
- git diff --check: passou.

## Limitação visual

Não há `$control-browser` disponível. O fluxo Sites manda omitir QA de navegador nessa condição, portanto não foi iniciado preview nem improvisado outro navegador. Os 247 testes usam happy-dom, que não mede layout. Não houve validação renderizada em 320/375/390/430px, comparação real de getBoundingClientRect, screenshots, verificação visual de ausência de cortes ou confirmação visual de desktop. Esses critérios seguem pendentes no celular; não se declara aprovação visual ou reprodução pixel a pixel.

## Isolamento e publicação

Destino exclusivo: https://horizonte-testes-autenticado.juliandersoncarmo.chatgpt.site.

Supabase exclusivo: `hsvjkbfpvmtnehjbwtgr`. Nenhum SQL/migração, alteração de dados ou configuração de autenticação. Mantidas configuração pública existente, revisão de runtime e audiência privada do Site. Chave pública lida somente nesse projeto e fornecida em memória ao build, sem persistir credencial em arquivo.

Publicação nativa confirmada com status `succeeded` e revisão de ambiente 1, no destino acima. Source Sites: `79d5603554c0d62292bb05cabadc507011f37c43`. Versão: `appgprj_6acd25d8d4708191b849f052ba7532ba~appgver_53ac4b8ca3a881918eb7958c8e80434f`. Deployment: `appgdep_6ace14d9af7081919bb1d71b328f5e2b`.

O commit final GitHub é o commit da nova branch que contém este relatório. Sua implementação CSS é idêntica à do source Sites compilado e publicado; apenas este registro documental de resultado foi acrescentado após a publicação. A sincronização GitHub usa o conector autenticado, sem escrever em main ou na branch base.
