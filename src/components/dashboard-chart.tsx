"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

type ChartData = {
  label: string
  revenue: number
  cost: number
  profit: number
}

const formatter = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(value)

export function DashboardChart({ data }: { data: ChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="label" className="text-xs" />
        <YAxis
          className="text-xs"
          tickFormatter={formatter}
        />
        <Tooltip
          formatter={(value) => [formatter(Number(value ?? 0)), ""]}
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
          }}
        />
        <Legend />
        <Bar dataKey="revenue" name="Revenue" fill="oklch(0.627 0.194 149.214)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="cost" name="Cost" fill="oklch(0.577 0.245 27.325)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="profit" name="Profit" fill="oklch(0.488 0.243 264.376)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
