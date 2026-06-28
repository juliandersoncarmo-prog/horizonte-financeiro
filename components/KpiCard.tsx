import type { BalanceColor } from '@/lib/engine/projection'

type Color = BalanceColor | 'accent'

const BAR: Record<Color, string> = {
  green:        'bg-green',
  'green-light':'bg-green-light',
  yellow:       'bg-yellow',
  orange:       'bg-orange',
  red:          'bg-red',
  accent:       'bg-accent',
}
const VALUE_COLOR: Record<Color, string> = {
  green:        'text-green',
  'green-light':'text-green-light',
  yellow:       'text-yellow',
  orange:       'text-orange',
  red:          'text-red',
  accent:       'text-accent',
}

interface KpiCardProps {
  label: string
  value: string
  sublabel?: string
  color?: Color
}

export default function KpiCard({ label, value, sublabel, color = 'accent' }: KpiCardProps) {
  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-border flex overflow-hidden">
      <div className={`w-1 flex-none ${BAR[color]}`} />
      <div className="flex-1 px-4 py-3 min-w-0">
        <p className="text-[11px] text-text-3 font-semibold uppercase tracking-wider">{label}</p>
        <p className={`text-lg font-bold mt-1 num truncate ${VALUE_COLOR[color]}`}>{value}</p>
        {sublabel && <p className="text-[11px] text-text-3 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  )
}
