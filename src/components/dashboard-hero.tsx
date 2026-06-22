'use client'

import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowUpRight01Icon,
  ArrowDownRight01Icon,
} from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/logo'
import { ProfitSparkline, type ChartPoint } from '@/components/dashboard-chart'
import { formatMoney, type Currency } from '@/lib/currency'

export type Range = { id: string; label: string }

export type HeroData = {
  anchorLabel: string
  rangeLabel: string
  hasData: boolean
  profit: number
  margin: number
  revenue: number
  cost: number
  delta: {
    profit: number | null
    margin: number | null
    revenue: number | null
    cost: number | null
  }
  spark: ChartPoint[]
}

export function DashboardHero({
  data,
  currency,
  ranges,
  range,
  onRangeChange,
}: {
  data: HeroData
  currency: Currency
  ranges: readonly Range[]
  range: string
  onRangeChange: (id: string) => void
}) {
  const fmt = (v: number) => formatMoney(v, currency, { compact: true })

  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card">
      {/* Cockpit bar — portfolio context + time range */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-3.5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <Logo className="size-5" />
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Portfolio
            <span className="mx-2 text-border">/</span>
            <span className="text-foreground">{data.anchorLabel}</span>
          </p>
        </div>
        <RangeControl ranges={ranges} value={range} onChange={onRangeChange} />
      </div>

      {!data.hasData ? (
        <div className="px-6 py-10 text-sm text-muted-foreground sm:px-8">
          No activity recorded in the {data.rangeLabel}. Try a wider time range.
        </div>
      ) : (
        <div className="grid gap-8 px-6 py-7 sm:px-8 lg:grid-cols-[1.6fr_auto] lg:gap-10">
          {/* Headline: net profit */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="size-2 rounded-full bg-primary" />
              <span>Net profit</span>
              <span className="text-muted-foreground/70">· {data.rangeLabel}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-1">
              <span
                className={cn(
                  'text-[2.75rem] font-bold leading-none tracking-tight tabular-nums',
                  data.profit < 0 && 'text-destructive'
                )}
              >
                {fmt(data.profit)}
              </span>
              <span className="pb-0.5 text-sm">
                <Delta value={data.delta.profit} goodWhenUp />
                <span className="ml-1.5 text-muted-foreground">vs prev period</span>
              </span>
            </div>

            <div className="mt-4 h-12">
              <ProfitSparkline data={data.spark} />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <Stat
                label="Revenue"
                tone="bg-success"
                value={fmt(data.revenue)}
                delta={data.delta.revenue}
                goodWhenUp
              />
              <Stat
                label="Costs"
                tone="bg-destructive"
                value={fmt(data.cost)}
                delta={data.delta.cost}
                goodWhenUp={false}
              />
            </div>
          </div>

          {/* Margin health gauge */}
          <div className="flex flex-col items-center justify-center lg:border-l lg:border-border lg:pl-10">
            <MarginGauge value={data.margin} />
            <p className="mt-1 text-xs text-muted-foreground">
              <Delta value={data.delta.margin} goodWhenUp suffix=" pts" /> vs prev
            </p>
          </div>
        </div>
      )}
    </section>
  )
}

function RangeControl({
  ranges,
  value,
  onChange,
}: {
  ranges: readonly Range[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <div className="inline-flex w-fit items-center rounded-lg border border-border bg-background/60 p-0.5">
      {ranges.map((r) => (
        <button
          key={r.id}
          type="button"
          onClick={() => onChange(r.id)}
          aria-pressed={value === r.id}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            value === r.id
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}

function Stat({
  label,
  value,
  tone,
  delta,
  goodWhenUp,
}: {
  label: string
  value: string
  tone: string
  delta: number | null
  goodWhenUp: boolean
}) {
  return (
    <div className="rounded-xl border border-border bg-background/40 px-4 py-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className={cn('size-1.5 rounded-full', tone)} />
        {label}
      </div>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs">
        <Delta value={delta} goodWhenUp={goodWhenUp} />
      </p>
    </div>
  )
}

/**
 * Bespoke semicircular gauge for profit margin — a "health" read that handles
 * losses gracefully. Pure SVG so it's crisp and theme-safe in both modes.
 */
function MarginGauge({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value))
  const loss = value < 0
  const healthy = value >= 20
  const color = loss
    ? 'var(--destructive)'
    : healthy
      ? 'var(--success)'
      : 'var(--primary)'
  const word = loss
    ? 'Operating at a loss'
    : healthy
      ? 'Healthy margin'
      : 'Thin margin'

  return (
    <div className="relative w-[184px]">
      <svg viewBox="0 0 120 66" className="w-full" role="img" aria-label="Profit margin">
        <path
          d="M 10 60 A 50 50 0 0 1 110 60"
          fill="none"
          stroke="var(--muted)"
          strokeWidth={11}
          strokeLinecap="round"
          pathLength={100}
        />
        <path
          d="M 10 60 A 50 50 0 0 1 110 60"
          fill="none"
          stroke={color}
          strokeWidth={11}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${pct} 100`}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
        <span
          className={cn(
            'text-3xl font-bold tracking-tight tabular-nums',
            loss && 'text-destructive'
          )}
        >
          {value.toFixed(1)}%
        </span>
      </div>
      <p
        className="mt-1.5 text-center text-xs font-medium"
        style={{ color }}
      >
        {word}
      </p>
      <p className="text-center text-[0.7rem] uppercase tracking-wider text-muted-foreground">
        Profit margin
      </p>
    </div>
  )
}

function Delta({
  value,
  goodWhenUp,
  suffix = '%',
}: {
  value: number | null
  goodWhenUp: boolean
  suffix?: string
}) {
  if (value === null || !Number.isFinite(value)) {
    return <span className="text-muted-foreground">No prior data</span>
  }
  const up = value >= 0
  const good = up === goodWhenUp
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 font-medium tabular-nums',
        Math.abs(value) < 0.05
          ? 'text-muted-foreground'
          : good
            ? 'text-success'
            : 'text-destructive'
      )}
    >
      <HugeiconsIcon
        icon={up ? ArrowUpRight01Icon : ArrowDownRight01Icon}
        className="size-3.5"
      />
      {Math.abs(value).toFixed(1)}
      {suffix}
    </span>
  )
}
