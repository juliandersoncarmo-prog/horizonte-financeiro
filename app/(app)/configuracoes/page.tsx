import ResetButton from '@/components/ResetButton'

export default async function ConfiguracoesPage() {
  return (
    <div className="flex-1 p-8 max-w-lg">
      <h1 className="text-2xl font-bold text-text mb-8">Configurações</h1>

      <div className="bg-surface border border-border rounded-2xl p-6">
        <h2 className="text-base font-semibold text-text mb-1">Resetar sistema</h2>
        <p className="text-sm text-text-2 mb-5">
          Remove todos os dados e volta ao estado inicial.
        </p>
        <ResetButton />
      </div>
    </div>
  )
}
