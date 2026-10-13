import SettingsForm from '@/components/SettingsForm'
import { getInitialSettings } from '@/app/actions'
import ResetButton from '@/components/ResetButton'

export default async function ConfiguracoesPage() {
  const settings = await getInitialSettings()
  if (!settings) return null
  return (
    <div className="settings-page flex-1 p-8 max-w-lg overflow-y-auto">
      <h1 className="text-2xl font-bold text-text mb-8">Configurações</h1>

      <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
        <h2 className="text-base font-semibold text-text mb-4">Saldo inicial</h2>
        <SettingsForm key={`${settings.data_ancora}:${settings.saldo_abertura}`} saldoAtual={settings.saldo_abertura} dataAncora={settings.data_ancora} />
      </div>
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
