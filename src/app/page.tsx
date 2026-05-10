import { getDashboardData, getCurrentMonthSummary } from '@/app/actions'
import { DashboardChart } from '@/components/dashboard-chart'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Dollar01Icon,
  ReceiptTextIcon,
  ProfitIcon,
  ArrowDown01Icon,
  PiggyBankIcon,
} from '@hugeicons/core-free-icons'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [chartData, summary] = await Promise.all([
    getDashboardData(),
    getCurrentMonthSummary(),
  ])

  const fmt = (v: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(v)

  const margin =
    summary.revenue > 0
      ? ((summary.profit / summary.revenue) * 100).toFixed(1)
      : '0'

  const stats = [
    {
      label: 'Revenue',
      value: fmt(summary.revenue),
      icon: Dollar01Icon,
      accent: 'teal',
      gradient: 'from-teal-500/20 to-teal-600/5',
      ring: 'ring-teal-500/20',
      iconBg: 'bg-teal-500/10',
      iconColor: 'text-teal-400',
    },
    {
      label: 'Costs',
      value: fmt(summary.cost),
      icon: ReceiptTextIcon,
      accent: 'rose',
      gradient: 'from-rose-500/20 to-rose-600/5',
      ring: 'ring-rose-500/20',
      iconBg: 'bg-rose-500/10',
      iconColor: 'text-rose-400',
    },
    {
      label: 'Profit',
      value: fmt(summary.profit),
      sub: `${margin}% margin`,
      icon: summary.profit >= 0 ? ProfitIcon : ArrowDown01Icon,
      accent: summary.profit >= 0 ? 'violet' : 'rose',
      gradient:
        summary.profit >= 0
          ? 'from-violet-500/20 to-violet-600/5'
          : 'from-rose-500/20 to-rose-600/5',
      ring:
        summary.profit >= 0
          ? 'ring-violet-500/20'
          : 'ring-rose-500/20',
      iconBg:
        summary.profit >= 0
          ? 'bg-violet-500/10'
          : 'bg-rose-500/10',
      iconColor:
        summary.profit >= 0 ? 'text-violet-400' : 'text-rose-400',
    },
  ]

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
          Overview
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${s.gradient} ring-1 ${s.ring} p-6`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold tracking-tight">{s.value}</p>
                {s.sub && (
                  <p className="text-xs text-muted-foreground">{s.sub}</p>
                )}
              </div>
              <div
                className={`flex items-center justify-center size-10 rounded-xl ${s.iconBg}`}
              >
                <HugeiconsIcon icon={s.icon} className={`size-5 ${s.iconColor}`} />
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 size-24 rounded-full bg-white/[0.02] blur-2xl" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent ring-1 ring-white/[0.06] p-6">
        <div className="flex items-center gap-2 mb-6">
          <HugeiconsIcon icon={PiggyBankIcon} className="size-4 text-muted-foreground" />
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.2em]">
            Monthly Comparison
          </h2>
        </div>
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex items-center justify-center size-16 rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.04] mb-4">
              <HugeiconsIcon icon={ProfitIcon} className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No data yet. Add entries to populate the chart.
            </p>
          </div>
        ) : (
          <DashboardChart data={chartData} />
        )}
      </div>
    </div>
  )
}
