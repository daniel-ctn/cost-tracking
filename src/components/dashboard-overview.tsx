'use client'

import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Dollar01Icon,
  ReceiptTextIcon,
  ProfitIcon,
  PercentIcon,
  ArrowUpRight01Icon,
  ArrowDownRight01Icon,
  ChartHistogramIcon,
  PackageIcon,
} from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'
import { DashboardChart, type ChartPoint } from '@/components/dashboard-chart'
import type { DashboardRow } from '@/app/actions'

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const RANGES = [
  { id: '6m', label: '6M' },
  { id: '12m', label: '12M' },
  { id: 'ytd', label: 'YTD' },
  { id: 'all', label: 'All' },
] as const

type RangeId = (typeof RANGES)[number]['id']

const fmtMoney = (v: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v)

const idx = (year: number, month: number) => year * 12 + (month - 1)
const idxLabel = (i: number) =>
  `${MONTHS[((i % 12) + 12) % 12]} ${String(Math.floor(i / 12)).slice(2)}`

type Window = { start: number; end: number; prev: { start: number; end: number } | null }

function resolveWindow(range: RangeId, rows: DashboardRow[]): Window | null {
  const now = new Date()
  const anchor = idx(now.getFullYear(), now.getMonth() + 1)

  if (range === '6m' || range === '12m') {
    const span = range === '6m' ? 6 : 12
    return {
      start: anchor - (span - 1),
      end: anchor,
      prev: { start: anchor - (2 * span - 1), end: anchor - span },
    }
  }
  if (range === 'ytd') {
    const start = idx(now.getFullYear(), 1)
    return {
      start,
      end: anchor,
      prev: { start: idx(now.getFullYear() - 1, 1), end: anchor - 12 },
    }
  }
  // all
  if (rows.length === 0) return null
  const all = rows.map((r) => idx(r.year, r.month))
  return { start: Math.min(...all), end: Math.max(...all), prev: null }
}

function sumRange(rows: DashboardRow[], start: number, end: number) {
  let revenue = 0
  let cost = 0
  for (const r of rows) {
    const i = idx(r.year, r.month)
    if (i >= start && i <= end) {
      revenue += r.revenue
      cost += r.cost
    }
  }
  return { revenue, cost, profit: revenue - cost }
}

function buildMonthly(rows: DashboardRow[], start: number, end: number): ChartPoint[] {
  const buckets = new Map<number, { revenue: number; cost: number }>()
  for (let i = start; i <= end; i++) buckets.set(i, { revenue: 0, cost: 0 })
  for (const r of rows) {
    const i = idx(r.year, r.month)
    const b = buckets.get(i)
    if (b) {
      b.revenue += r.revenue
      b.cost += r.cost
    }
  }
  return [...buckets.entries()].map(([i, b]) => {
    const profit = b.revenue - b.cost
    return {
      label: idxLabel(i),
      revenue: b.revenue,
      cost: b.cost,
      profit,
      margin: b.revenue > 0 ? Number(((profit / b.revenue) * 100).toFixed(1)) : null,
    }
  })
}

function pctChange(cur: number, prev: number): number | null {
  if (prev === 0) return null
  return ((cur - prev) / Math.abs(prev)) * 100
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

export function DashboardOverview({ rows }: { rows: DashboardRow[] }) {
  const [range, setRange] = useState<RangeId>('12m')

  const view = useMemo(() => {
    const win = resolveWindow(range, rows)
    if (!win) return null

    const cur = sumRange(rows, win.start, win.end)
    const prev = win.prev ? sumRange(rows, win.prev.start, win.prev.end) : null
    const curMargin = cur.revenue > 0 ? (cur.profit / cur.revenue) * 100 : 0
    const prevMargin =
      prev && prev.revenue > 0 ? (prev.profit / prev.revenue) * 100 : null

    const monthly = buildMonthly(rows, win.start, win.end)

    const byProduct = new Map<
      number,
      { name: string; revenue: number; cost: number }
    >()
    for (const r of rows) {
      const i = idx(r.year, r.month)
      if (i < win.start || i > win.end) continue
      const cur = byProduct.get(r.productId) ?? {
        name: r.productName ?? 'Unknown',
        revenue: 0,
        cost: 0,
      }
      cur.revenue += r.revenue
      cur.cost += r.cost
      byProduct.set(r.productId, cur)
    }
    const products = [...byProduct.entries()]
      .map(([id, p]) => ({
        id,
        name: p.name,
        revenue: p.revenue,
        cost: p.cost,
        profit: p.revenue - p.cost,
        margin: p.revenue > 0 ? (p.revenue - p.cost) / p.revenue * 100 : 0,
      }))
      .sort((a, b) => b.profit - a.profit)
    const maxAbsProfit = Math.max(1, ...products.map((p) => Math.abs(p.profit)))

    return {
      cur,
      curMargin,
      delta: {
        revenue: prev ? pctChange(cur.revenue, prev.revenue) : null,
        cost: prev ? pctChange(cur.cost, prev.cost) : null,
        profit: prev ? pctChange(cur.profit, prev.profit) : null,
        margin: prevMargin === null ? null : curMargin - prevMargin,
      },
      hasPrev: !!prev,
      monthly,
      products,
      maxAbsProfit,
      hasData: monthly.some((m) => m.revenue !== 0 || m.cost !== 0),
    }
  }, [range, rows])

  const rangeLabel =
    range === 'ytd'
      ? 'year to date'
      : range === 'all'
        ? 'all time'
        : `last ${range === '6m' ? 6 : 12} months`

  const kpis = view
    ? [
        {
          key: 'revenue',
          label: 'Revenue',
          icon: Dollar01Icon,
          value: fmtMoney(view.cur.revenue),
          delta: view.delta.revenue,
          goodWhenUp: true,
          suffix: '%',
          tone: 'text-chart-3 bg-chart-3/10',
        },
        {
          key: 'cost',
          label: 'Costs',
          icon: ReceiptTextIcon,
          value: fmtMoney(view.cur.cost),
          delta: view.delta.cost,
          goodWhenUp: false,
          suffix: '%',
          tone: 'text-destructive bg-destructive/10',
        },
        {
          key: 'profit',
          label: 'Profit',
          icon: ProfitIcon,
          value: fmtMoney(view.cur.profit),
          delta: view.delta.profit,
          goodWhenUp: true,
          suffix: '%',
          tone: 'text-primary bg-primary/10',
        },
        {
          key: 'margin',
          label: 'Profit margin',
          icon: PercentIcon,
          value: `${view.curMargin.toFixed(1)}%`,
          delta: view.delta.margin,
          goodWhenUp: true,
          suffix: ' pts',
          tone: 'text-chart-5 bg-chart-5/10',
        },
      ]
    : []

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Overview
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <div className="inline-flex w-fit items-center rounded-lg border border-border bg-card p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRange(r.id)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                range === r.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {!view || !view.hasData ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((k) => (
              <div
                key={k.key}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{k.label}</span>
                  <span
                    className={cn(
                      'flex size-9 items-center justify-center rounded-xl',
                      k.tone
                    )}
                  >
                    <HugeiconsIcon icon={k.icon} className="size-4.5" />
                  </span>
                </div>
                <p className="mt-3 text-2xl font-bold tracking-tight tabular-nums">
                  {k.value}
                </p>
                <p className="mt-1.5 flex items-center gap-1.5 text-xs">
                  <Delta
                    value={k.delta}
                    goodWhenUp={k.goodWhenUp}
                    suffix={k.suffix}
                  />
                  {k.delta !== null && (
                    <span className="text-muted-foreground">vs prev period</span>
                  )}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-5 flex items-center gap-2">
              <HugeiconsIcon
                icon={ChartHistogramIcon}
                className="size-4 text-muted-foreground"
              />
              <h2 className="text-sm font-semibold">Monthly performance</h2>
              <span className="text-xs text-muted-foreground">· {rangeLabel}</span>
            </div>
            <DashboardChart data={view.monthly} />
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-5 flex items-center gap-2">
              <HugeiconsIcon
                icon={PackageIcon}
                className="size-4 text-muted-foreground"
              />
              <h2 className="text-sm font-semibold">Profit by product</h2>
              <span className="text-xs text-muted-foreground">· {rangeLabel}</span>
            </div>
            {view.products.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No product activity in this period.
              </p>
            ) : (
              <div className="space-y-1">
                <div className="grid grid-cols-[1fr_auto] items-center gap-4 px-2 pb-2 text-xs uppercase tracking-wider text-muted-foreground sm:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))]">
                  <span>Product</span>
                  <span className="hidden text-right sm:block">Revenue</span>
                  <span className="hidden text-right sm:block">Cost</span>
                  <span className="text-right">Profit</span>
                  <span className="hidden text-right sm:block">Margin</span>
                </div>
                {view.products.map((p) => (
                  <div
                    key={p.id}
                    className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-lg px-2 py-2.5 hover:bg-muted/50 sm:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))]"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{p.name}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            p.profit >= 0 ? 'bg-primary' : 'bg-destructive'
                          )}
                          style={{
                            width: `${(Math.abs(p.profit) / view.maxAbsProfit) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="hidden text-right text-sm tabular-nums text-muted-foreground sm:block">
                      {fmtMoney(p.revenue)}
                    </span>
                    <span className="hidden text-right text-sm tabular-nums text-muted-foreground sm:block">
                      {fmtMoney(p.cost)}
                    </span>
                    <span
                      className={cn(
                        'text-right text-sm font-semibold tabular-nums',
                        p.profit >= 0 ? 'text-foreground' : 'text-destructive'
                      )}
                    >
                      {fmtMoney(p.profit)}
                    </span>
                    <span className="hidden text-right text-sm tabular-nums text-muted-foreground sm:block">
                      {p.margin.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted">
        <HugeiconsIcon
          icon={ChartHistogramIcon}
          className="size-6 text-muted-foreground"
        />
      </div>
      <h3 className="text-base font-medium">No data in this range</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Add monthly entries or widen the time range to see revenue, costs, and
        profit trends here.
      </p>
    </div>
  )
}
