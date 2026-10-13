# Sessão 21 — tabela financeira mobile

## Continuidade e isolamento

Git fetch e git ls-remote confirmaram HEAD padrão/main em e4ba912f14db49b98b3e9129c27670b7bf050d48. A versão de desenvolvimento mais recente era fix/horizonte-mobile-regressoes, 574d6224f6ff0684ec2840d56a203c18597595af. Foram lidos AGENTS.md e o relatório da Sessão 20. Nova branch: fix/horizonte-mobile-tabela-eixo, derivada desse commit em worktree separado.

Alteração funcional restrita a app/globals.css, components/MonthColumn.tsx e components/InlineDailyActual.tsx. CSS novo somente abaixo de 640px e dentro de .ledger-months. JSX mantém a estrutura e acrescenta apenas variáveis de dimensionamento do texto e reaproveitamento das strings formatadas. Nenhuma alteração em seletor superior, indicadores, barra inferior, menu, modais, gestos, autenticação, cálculo financeiro ou recorrências. Nenhum SQL, migração ou alteração de configuração externa. Main, backup, produção original e banco original preservados.

## Implementação

- Cabeçalho e linhas usam 1fr / 1.8fr / 1fr, padding lateral simétrico de 6px e gap de 2px. Data à esquerda e Saldo à direita; a coluna central recebe mais espaço sem deslocar seu eixo.
- Diário usa grid de 18px / minmax(0,1fr) / 18px, com valor e lápis explicitamente na linha 1. O lápis deixa de ter posicionamento absoluto inferior e participa do grid. A reserva esquerda tem a mesma largura do botão direito. Entradas/Saídas têm padding simétrico de 18px, mantendo a mesma área de texto.
- Título e seta permanecem um grupo flex sem quebra, centralizado na mesma coluna.
- Dia: 13→15px, peso 600. Dia da semana: 11→13px, cor secundária mais legível. Valores centrais: teto 16px; Saldo: teto 15px. O tamanho efetivo diminui para valores extensos conforme largura da célula e comprimento da string completa, preservando moeda, sinal e centavos. Portanto, não se promete aumento em todos os valores/grandes montantes no viewport estreito.
- Linhas: 40px, padding vertical de 2px. Diário e edição inline: 32px, sem quebra do formulário. Cabeçalho: 40px. Não foram usados margens negativas, transforms ou recuos específicos por modo.

## Geometria: demonstração, não medição visual

Para largura interna W, padding p=6 e gap g=2, seja a=(W−2p−2g)/3.8. Centro da coluna intermediária: p+a+g+0.9a = p+g+1.9a = W/2. As reservas de 18px também são simétricas, então o eixo do texto não depende do comprimento ou da presença do lápis.

Essa identidade vale para 320, 375, 390 e 430px, mas não substitui getBoundingClientRect, captura ou avaliação da fonte renderizada. Unidades cqw são relativas à célula, não ao viewport. O dimensionamento pelo comprimento é uma estimativa conservadora de largura de texto; ausência de corte/sobreposição depende de confirmação com a fonte real no navegador.

| Critério | Evidência efetiva nesta sessão |
|---|---|
|1. Título/seletor no eixo|Estrutura CSS simétrica; não medido no navegador|
|2. Valores no mesmo eixo|Estrutura compartilhada e reservas simétricas; não medido no navegador|
|3. Lápis na mesma linha|Grid-row:1 explícito para valor e botão; confirmação visual pendente|
|4. Data legível|Fontes 15/13px e cor secundária implementadas; avaliação visual pendente|
|5. Valores maiores|Tetos 16/15px implementados, com redução adaptativa; avaliação visual pendente|
|6. Altura consistente|40px em todas as linhas e Diário 32px definidos no CSS; medição pendente|
|7. Sem corte/sobreposição/scroll horizontal|Prevenção estrutural implementada; NÃO comprovado visualmente|
|8. Três modos alinhados|Mesma coluna e área simétrica de texto; medição visual pendente|
|9. Desktop preservado|Diff confirma ausência de CSS novo para ≥640px e nenhuma mudança de estrutura desktop; comparação visual pendente|

## Verificações

- 247 testes existentes em 34 arquivos: aprovados. Incluem edição, persistência, motor e controles mobile; testes happy-dom não têm motor de layout e não comprovam os critérios geométricos.
- TypeScript --noEmit: aprovado no repositório e no checkout hospedado.
- Lint do repositório: aprovado. Lint hospedado: zero erros e uma advertência preexistente do login, com dist/** excluído por ser saída gerada. A tentativa inicial percorreu bundles de dist e falhou; comando corrigido sem alterações de código.
- Build Next.js: aprovado. A tentativa inicial com node_modules simbólico falhou por restrição do Turbopack; dependências foram copiadas localmente e o build foi concluído.
- Build Vinext: aprovado. Verificadores do CSS e da configuração pública Supabase no bundle: aprovados.
- git diff --check: aprovado.

## Limitação obrigatória

Não houve navegador de QA suportado, screenshots ou medições renderizadas. O [skill Sites](skill://plugin_connector_1p_689987207de08191979cf68eca2941c6/sites/SKILL.md) determina: “If `$control-browser` is unavailable, skip browser QA”. Não foi iniciado preview nem improvisado outro caminho de navegador. A tarefa foi implementada e publicada, mas a aceitação visual nas quatro larguras permanece pendente; não chamar a correção de visualmente validada ou definitiva.

## Publicação confirmada

Destino exclusivo: https://horizonte-testes-autenticado.juliandersoncarmo.chatgpt.site.

Supabase autorizado: hsvjkbfpvmtnehjbwtgr. A configuração pública existente foi fornecida em memória ao build, sem criar/rotacionar chaves e sem alterar runtime revisão 1 ou audiência owner-private. Consulta Supabase limitada à leitura das chaves públicas desse projeto.

Source Sites: 8e96271cbc78b9d22aa0bfb3e02985a42ef6bf90. Versão: appgprj_6acd25d8d4708191b849f052ba7532ba~appgver_649a452743888191a71861c5e7d31742. Deployment: appgdep_6ace0c3920708191a375581ce3c91abc. Resultado nativo: succeeded.

O push Git por HTTPS não tinha credencial no terminal. A publicação da branch GitHub usa o conector autenticado, com os mesmos arquivos locais testados e o relatório, a partir da base confirmada. SHA final disponível no histórico da branch; nenhuma alteração em main.
