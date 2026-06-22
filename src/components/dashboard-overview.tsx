'use client'

import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ChartHistogramIcon,
  AlertCircleIcon,
  InformationCircleIcon,
  CheckmarkCircle02Icon,
} from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'
import { DashboardChart, type ChartPoint } from '@/components/dashboard-chart'
import { DashboardHero } from '@/components/dashboard-hero'
import { SectionHeading } from '@/components/section-heading'
import { formatMoney, type Currency } from '@/lib/currency'
import type { DashboardRow, Insight, CostBreakdown } from '@/app/actions'

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

const idx = (year: number, month: number) => year * 12 + (month - 1)
const idxLabel = (i: number) =>
  `${MONTHS[((i % 12) + 12) % 12]} ${String(Math.floor(i / 12)).slice(2)}`

type Window = { start: number; end: number; prev: { start: number; end: number } | null }

/** Anchor windows to the latest *recorded* month, not the calendar month. */
function resolveWindow(range: RangeId, rows: DashboardRow[]): Window | null {
  if (rows.length === 0) return null
  const all = rows.map((r) => idx(r.year, r.month))
  const anchor = Math.max(...all)

  if (range === '6m' || range === '12m') {
    const span = range === '6m' ? 6 : 12
    return {
      start: anchor - (span - 1),
      end: anchor,
      prev: { start: anchor - (2 * span - 1), end: anchor - span },
    }
  }
  if (range === 'ytd') {
    const year = Math.floor(anchor / 12)
    return {
      start: idx(year, 1),
      end: anchor,
      prev: { start: idx(year - 1, 1), end: anchor - 12 },
    }
  }
  // all
  return { start: Math.min(...all), end: anchor, prev: null }
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

const fullLabel = (i: number) =>
  `${MONTHS[((i % 12) + 12) % 12]} ${Math.floor(i / 12)}`

export function DashboardOverview({
  rows,
  insights,
  breakdown,
  currency,
}: {
  rows: DashboardRow[]
  insights: Insight[]
  breakdown: CostBreakdown
  currency: Currency
}) {
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
      const curP = byProduct.get(r.productId) ?? {
        name: r.productName ?? 'Unknown',
        revenue: 0,
        cost: 0,
      }
      curP.revenue += r.revenue
      curP.cost += r.cost
      byProduct.set(r.productId, curP)
    }
    const products = [...byProduct.entries()]
      .map(([id, p]) => ({
        id,
        name: p.name,
        revenue: p.revenue,
        cost: p.cost,
        profit: p.revenue - p.cost,
        margin: p.revenue > 0 ? ((p.revenue - p.cost) / p.revenue) * 100 : 0,
      }))
      .sort((a, b) => b.profit - a.profit)
    const maxAbsProfit = Math.max(1, ...products.map((p) => Math.abs(p.profit)))

    return {
      cur,
      curMargin,
      anchorLabel: fullLabel(win.end),
      delta: {
        revenue: prev ? pctChange(cur.revenue, prev.revenue) : null,
        cost: prev ? pctChange(cur.cost, prev.cost) : null,
        profit: prev ? pctChange(cur.profit, prev.profit) : null,
        margin: prevMargin === null ? null : curMargin - prevMargin,
      },
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

  if (!view) {
    return (
      <div className="space-y-8">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Overview
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <EmptyState />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <DashboardHero
        currency={currency}
        ranges={RANGES}
        range={range}
        onRangeChange={(id) => setRange(id as RangeId)}
        data={{
          anchorLabel: view.anchorLabel,
          rangeLabel,
          hasData: view.hasData,
          profit: view.cur.profit,
          margin: view.curMargin,
          revenue: view.cur.revenue,
          cost: view.cur.cost,
          delta: view.delta,
          spark: view.monthly,
        }}
      />

      {insights.length > 0 && <InsightsPanel insights={insights} />}

      {view.hasData && (
        <>
          <div className="rounded-2xl border border-border bg-card p-6">
            <SectionHeading
              eyebrow="Trend"
              title="Monthly performance"
              meta={rangeLabel}
              className="mb-5"
            />
            <DashboardChart data={view.monthly} currency={currency} />
          </div>

          {(breakdown.byCategory.length > 0 || breakdown.byService.length > 0) && (
            <div className="grid gap-4 lg:grid-cols-2">
              <BreakdownCard
                title="Cost by category"
                rows={breakdown.byCategory}
                currency={currency}
              />
              <BreakdownCard
                title="Cost by provider"
                rows={breakdown.byService}
                currency={currency}
              />
            </div>
          )}

          <ProfitLeaderboard
            products={view.products}
            maxAbsProfit={view.maxAbsProfit}
            currency={currency}
            rangeLabel={rangeLabel}
          />
        </>
      )}
    </div>
  )
}

type ProductRow = {
  id: number
  name: string
  revenue: number
  cost: number
  profit: number
  margin: number
}

function ProfitLeaderboard({
  products,
  maxAbsProfit,
  currency,
  rangeLabel,
}: {
  products: ProductRow[]
  maxAbsProfit: number
  currency: Currency
  rangeLabel: string
}) {
  const fmtMoney = (v: number) => formatMoney(v, currency, { compact: true })
  const profitable = products.filter((p) => p.profit > 0).length

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <SectionHeading
        eyebrow="Ranked"
        title="Profit by product"
        meta={
          products.length > 0
            ? `${profitable}/${products.length} profitable · ${rangeLabel}`
            : rangeLabel
        }
        className="mb-5"
      />
      {products.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No product activity in this period.
        </p>
      ) : (
        <ol className="space-y-1.5">
          {products.map((p, i) => {
            const loss = p.profit < 0
            return (
              <li
                key={p.id}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-1 rounded-xl px-2.5 py-2.5 hover:bg-muted/40 sm:grid-cols-[auto_minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]"
              >
                <span
                  className={cn(
                    'flex size-6 items-center justify-center rounded-md font-mono text-xs font-semibold tabular-nums',
                    i === 0 && !loss
                      ? 'bg-primary/15 text-primary'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{p.name}</span>
                    {i === 0 && !loss && (
                      <span className="hidden rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary sm:inline">
                        Top
                      </span>
                    )}
                    {loss && (
                      <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-destructive">
                        Loss
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        loss ? 'bg-destructive' : 'bg-primary'
                      )}
                      style={{
                        width: `${(Math.abs(p.profit) / maxAbsProfit) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="hidden text-right text-sm tabular-nums text-muted-foreground sm:block">
                  {fmtMoney(p.revenue)}
                </span>
                <span className="hidden text-right text-sm tabular-nums text-muted-foreground sm:block">
                  {p.margin.toFixed(1)}%
                </span>
                <span
                  className={cn(
                    'text-right text-sm font-semibold tabular-nums',
                    loss ? 'text-destructive' : 'text-foreground'
                  )}
                >
                  {fmtMoney(p.profit)}
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

function InsightsPanel({ insights }: { insights: Insight[] }) {
  const warnings = insights.filter((i) => i.severity === 'warning').length
  const notes = insights.length - warnings
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <SectionHeading
        eyebrow="Signals"
        title="Needs attention"
        accent={warnings > 0 ? 'destructive' : 'primary'}
        meta={
          warnings > 0 ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                <HugeiconsIcon icon={AlertCircleIcon} className="size-3.5" />
                {warnings}
              </span>
              {notes > 0 && (
                <span className="text-xs text-muted-foreground">+{notes} notes</span>
              )}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3.5" />
              On track
            </span>
          )
        }
        className="mb-4"
      />
      <div className="grid gap-2 sm:grid-cols-2">
        {insights.slice(0, 8).map((it) => {
          const warn = it.severity === 'warning'
          return (
            <div
              key={it.id}
              className={cn(
                'flex gap-2.5 rounded-lg border border-l-2 px-3 py-2.5',
                warn
                  ? 'border-destructive/20 border-l-destructive bg-destructive/5'
                  : 'border-border border-l-muted-foreground/40 bg-muted/30'
              )}
            >
              <HugeiconsIcon
                icon={warn ? AlertCircleIcon : InformationCircleIcon}
                className={cn(
                  'mt-0.5 size-4 shrink-0',
                  warn ? 'text-destructive' : 'text-muted-foreground'
                )}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium">{it.title}</p>
                <p className="text-xs text-muted-foreground">{it.detail}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const SEGMENT_COLORS = [
  'var(--chart-1)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-2)',
]
const segColor = (i: number) =>
  i < SEGMENT_COLORS.length ? SEGMENT_COLORS[i] : 'var(--muted-foreground)'

function BreakdownCard({
  title,
  rows,
  currency,
}: {
  title: string
  rows: { key: string; amount: number }[]
  currency: Currency
}) {
  const total = rows.reduce((s, r) => s + r.amount, 0)
  const top = rows.slice(0, 6)
  const rest = total - top.reduce((s, r) => s + r.amount, 0)
  const pct = (v: number) => (total > 0 ? (v / total) * 100 : 0)

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <SectionHeading
        title={title}
        accent="muted"
        meta={total > 0 ? formatMoney(total, currency, { compact: true }) : undefined}
        className="mb-4"
      />
      {top.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">No costs yet.</p>
      ) : (
        <>
          {/* Composition bar — the proportional split at a glance. */}
          <div className="mb-4 flex h-2 w-full overflow-hidden rounded-full bg-muted">
            {top.map((r, i) => (
              <div
                key={r.key}
                style={{ width: `${pct(r.amount)}%`, backgroundColor: segColor(i) }}
                title={`${r.key} · ${pct(r.amount).toFixed(0)}%`}
              />
            ))}
            {rest > 0.005 && (
              <div
                style={{ width: `${pct(rest)}%` }}
                className="bg-muted-foreground/30"
                title={`Other · ${pct(rest).toFixed(0)}%`}
              />
            )}
          </div>
          <div className="space-y-2">
            {top.map((r, i) => (
              <div key={r.key} className="flex items-center gap-2.5 text-sm">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: segColor(i) }}
                />
                <span className="truncate text-muted-foreground">{r.key}</span>
                <span className="ml-auto shrink-0 tabular-nums">
                  {formatMoney(r.amount, currency, { compact: true })}
                </span>
                <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                  {pct(r.amount).toFixed(0)}%
                </span>
              </div>
            ))}
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
