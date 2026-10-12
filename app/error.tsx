'use client'
export default function Error({ unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  return <main className="p-6 text-text bg-surface"><h1 className="text-lg font-semibold">Não foi possível carregar o Horizonte</h1><p className="my-3 text-sm text-text-2">A leitura dos dados falhou. Isso não significa que sua configuração esteja ausente. Nenhum dado foi sobrescrito.</p><button className="rounded-xl bg-accent text-white px-4 py-2" onClick={unstable_retry}>Tentar novamente</button></main>
}
