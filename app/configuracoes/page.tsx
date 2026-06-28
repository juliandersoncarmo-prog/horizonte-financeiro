import { createServiceClient } from '@/lib/supabase/service'
import SettingsForm from '@/components/SettingsForm'
import ResetButton from '@/components/ResetButton'

async function getCurrentSettings() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('settings')
    .select('saldo_abertura, data_ancora')
    .eq('user_id', '00000000-0000-0000-0000-000000000001')
    .limit(1)
    .single()
  return data ?? null
}

export default async function ConfiguracoesPage() {
  const settings = await getCurrentSettings()
  const today    = new Date().toISOString().split('T')[0]

  return (
    <div className="flex-1 p-8 max-w-lg">
      <h1 className="text-2xl font-bold text-text mb-8">Configurações</h1>

      {/* Saldo inicial */}
      <div className="bg-surface border border-border rounded-2xl p-6 mb-4">
        <h2 className="text-base font-semibold text-text mb-1">Quanto você tem hoje?</h2>
        <p className="text-sm text-text-2 mb-5">
          Informe o saldo atual da sua conta. Este é o ponto de partida da projeção.
        </p>
        <SettingsForm
          saldoAtual={settings ? Number(settings.saldo_abertura) : undefined}
          dataAncora={settings?.data_ancora ?? today}
        />
      </div>

      {/* Reset */}
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
