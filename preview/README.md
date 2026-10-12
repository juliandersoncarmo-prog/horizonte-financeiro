# Demonstração isolada V2

Executar `npm ci --ignore-scripts --no-audit --no-fund` e `npx vite build --config preview/vite.config.ts`. Saída: `preview-dist/` (não versionada). Servir como site estático HTTPS. A hospedagem deve servir index.html no caminho raiz; navegação de configurações usa hash.

Os aliases substituem apenas Server Actions, next/navigation e next/link neste bundle separado. Os componentes do produto, motor de projeção e resumo são os mesmos do aplicativo. O build Next.js habitual continua usando as ações reais; não há bypass da autenticação, flag pública ou rota demo no aplicativo principal.

Os registros são fictícios, guardados sob `hf-v2-demo-v1` no localStorage da origem da demonstração. A demo não possui Supabase, API financeira, service role, login financeiro, RLS ou sincronização entre dispositivos. A privacidade da hospedagem não comprova segurança do aplicativo financeiro. Apenas dados fictícios devem ser usados.

Fluxos disponíveis: saldo inicial, entradas/saídas avulsas e recorrentes, orçamento, realizado do Diário (incluindo zero/edição/exclusão), cartões/faturas CRUD, resumo, navegação mensal, tema e restauração dos exemplos. O produto não possui exclusão individual de avulsas/recorrências nesta versão; não se simula esse recurso. A edição do vencimento/regra/orçamento global recalcula o histórico projetado.

A atualização da projeção ocorre pelo evento local do adaptador, não por router.refresh com banco real. Os testes integration.test.ts exercitam esse adaptador junto ao motor/resumo e verificam serialização/releitura do estado, não E2E de navegador ou persistência Supabase.

Restaurar exemplos apaga apenas os dados fictícios da demo. O armazenamento pode falhar por quota/política do navegador; a mutação retorna falha sem alterar o estado em memória nesse caso. Limpar dados do site remove os exemplos alterados. Não usar esta demonstração como banco pessoal.

Sessão 9: novos dados da demo começam sem cartão fictício. Restaurar exemplos é a ação explícita que inclui o cartão de exemplo. Dados previamente salvos são preservados, inclusive cartões existentes. Confirmação de cadastro indica sucesso do armazenamento local; não representa gravação no Supabase. Diário usa lápis, confirmar/cancelar e somente uma célula ativa.
