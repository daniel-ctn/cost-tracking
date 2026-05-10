'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

type ChartData = {
  label: string
  revenue: number
  cost: number
  profit: number
}

const fmt = (v: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(v)

function CustomTooltip(props: Record<string, unknown>) {
  const { active, payload, label } = props
  if (!active || !payload || !Array.isArray(payload) || !payload.length) return null

  return (
    <div className="rounded-xl bg-[#1a1a1e] border border-white/[0.06] shadow-2xl shadow-black/40 px-4 py-3">
      <p className="text-xs text-muted-foreground mb-2 font-mono">
        {label as string}
      </p>
      {(payload as Array<Record<string, unknown>>).map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <div
            className="size-2 rounded-full"
            style={{ backgroundColor: entry.color as string }}
          />
          <span className="text-muted-foreground">
            {entry.name as string}:
          </span>
          <span className="font-medium text-foreground">
            {fmt(Number(entry.value ?? 0))}
          </span>
        </div>
      ))}
    </div>
  )
}

export function DashboardChart({ data }: { data: ChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart
        data={data}
        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        barGap={6}
        barCategoryGap={14}
      >
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.60 0.16 185)" stopOpacity={0.95} />
            <stop offset="100%" stopColor="oklch(0.60 0.16 185)" stopOpacity={0.25} />
          </linearGradient>
          <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.55 0.22 15)" stopOpacity={0.95} />
            <stop offset="100%" stopColor="oklch(0.55 0.22 15)" stopOpacity={0.25} />
          </linearGradient>
          <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.62 0.22 288)" stopOpacity={0.95} />
            <stop offset="100%" stopColor="oklch(0.62 0.22 288)" stopOpacity={0.25} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="oklch(1 0 0 / 0.04)"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'oklch(0.55 0.01 285)', fontSize: 11, fontFamily: 'var(--font-geist-mono)' }}
          dy={8}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'oklch(0.55 0.01 285)', fontSize: 11, fontFamily: 'var(--font-geist-mono)' }}
          tickFormatter={fmt}
          width={60}
        />
        <Tooltip
          content={(props) => <CustomTooltip {...(props as Record<string, unknown>)} />}
          cursor={{ fill: 'oklch(1 0 0 / 0.03)' }}
        />
        <Legend
          wrapperStyle={{
            fontSize: 12,
            color: 'oklch(0.55 0.01 285)',
          }}
          iconType="circle"
          iconSize={8}
        />
        <Bar
          dataKey="revenue"
          name="Revenue"
          fill="url(#revenueGrad)"
          radius={[6, 6, 0, 0]}
          maxBarSize={40}
        />
        <Bar
          dataKey="cost"
          name="Cost"
          fill="url(#costGrad)"
          radius={[6, 6, 0, 0]}
          maxBarSize={40}
        />
        <Bar
          dataKey="profit"
          name="Profit"
          fill="url(#profitGrad)"
          radius={[6, 6, 0, 0]}
          maxBarSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
