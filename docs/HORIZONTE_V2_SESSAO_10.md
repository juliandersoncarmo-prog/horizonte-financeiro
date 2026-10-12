# Horizonte Financeiro — Sessão 10

Base GitHub confirmada: `feat/horizonte-v2-usabilidade`, commit `82f1dd14de8cdd3c143a802e2bac765353c4ee9d`. Nova branch `fix/horizonte-v2-cartoes-diario-teclado`. Lidos AGENTS, guia Next use-client e relatórios 7–9. Componentes editados comparados com base GitHub: idênticos antes da alteração. Main preservada.

Cartões: popup até 512px, formulário até 320px, nome/primeiro mês até 224px e numéricos 80px. Faturas em coluna de largura limitada, com valor de 120px perto do mês completo. Inputs podem encolher no celular. Rótulos, tabulação, foco, CRUD, validações, confirmação, rascunhos e cadastro preservados.

Diário: aviso quando cronograma existente indica que depois de um realizado positivo os pendentes têm previsão zero, com orçamento positivo. Permite continuar registrando gastos adicionais, descontados do saldo, e orienta revisar orçamento no menu Diário, informando efeito global nos meses futuros. Nenhum aumento automático. Helper só lê resultados; motor não modificado.

Setas esquerda/direita navegam um mês dentro dos limites. Ignoram campos, conteúdo editável, modificadores, eventos tratados e popups inclusive legados. Botões/seletor recebem nomes acessíveis. Quantidade visível acompanha breakpoints 4/2/1, permitindo último mês no celular.

145 testes passaram em 15 arquivos. Testes novos verificam setas, limites, campos, popup, remoção do listener, esgotamento, excesso registrado, recuperação após correção, ausência de orçamento e projeção imutável. TypeScript, build Next, build Vite e diff --check passaram. Sem edição de motor, ações, banco, Auth, RLS, schema ou regras de cadastro. Sem acesso a dados reais.

Demo privada atualizada no mesmo Site/endereço, banner Sessão 10: https://horizonte-financeiro-demo-v2.juliandersoncarmo.chatgpt.site . Dados fictícios localStorage preservados. Hospedagem tem histórico separado do GitHub. Sem publicação do aplicativo financeiro real.

QA visual não executada: control-browser indisponível. Conforme skill Sites, não se improvisou navegador/servidor alternativo. DOM não comprova layout/temas visualmente. Supabase real permanece sem teste nesta sessão.

Teste pessoal com dados fictícios: cadastrar 2–3 faturas, conferir mês completo perto do valor; navegar pelas setas fora de campos/popups; registrar gasto superior ao orçamento, conferir aviso e previstos zero; adicionar novo gasto e depois corrigir anterior para conferir recuperação.
