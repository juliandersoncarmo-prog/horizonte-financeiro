import type { LucideIcon } from 'lucide-react'
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
  icon?: LucideIcon
  iconBg?: string
  iconColor?: string
}

export default function KpiCard({
  label, value, sublabel,
  color = 'accent',
  icon: Icon,
  iconBg,
  iconColor,
}: KpiCardProps) {
  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-border flex overflow-hidden">
      <div className={`w-1 flex-none ${BAR[color]}`} />
      <div className="flex-1 px-4 py-3 min-w-0 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-text-3">{label}</p>
          <p className={`text-3xl font-bold mt-1 num truncate ${VALUE_COLOR[color]}`}>{value}</p>
          {sublabel && <p className="text-sm text-text-3 mt-1">{sublabel}</p>}
        </div>
        {Icon && (
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center flex-none"
            style={{ background: iconBg }}
          >
            <Icon className="w-5 h-5" style={{ color: iconColor }} />
          </div>
        )}
      </div>
    </div>
  )
}
