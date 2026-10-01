"use client"

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import type { TimelineEntry, SpeciesEntry } from "@/types"

/* ── Color palette (from design tokens) ── */
const COLORS = {
  stream: "#2d9079",
  streamLight: "#45ac93",
  moss: "#7f9058",
  amber: "#eca216",
  danger: "#dc4446",
  stone: "#a49a88",
}

const DONUT_COLORS = [COLORS.stream, COLORS.moss, COLORS.danger, COLORS.amber]

const CONFIDENCE_COLORS: Record<string, string> = {
  "90-100": "#22c55e",
  "80-89": "#45ac93",
  "70-79": "#2d9079",
  "50-69": "#f59e0b",
  "<50": "#dc4446",
}

/**
 * Submissions Timeline — area chart with gradient fills.
 */
export function TimelineChart({ data }: { data: TimelineEntry[] }) {
  return (
    <ChartWrapper title="Submissions Over Time">
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="gradStream" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.stream} stopOpacity={0.2} />
              <stop offset="95%" stopColor={COLORS.stream} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradMoss" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.moss} stopOpacity={0.2} />
              <stop offset="95%" stopColor={COLORS.moss} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8e4dc" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#8a7f6e" }}
            tickFormatter={(v) =>
              new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
            }
          />
          <YAxis tick={{ fontSize: 11, fill: "#8a7f6e" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e8e4dc",
              borderRadius: "12px",
              fontSize: "13px",
              boxShadow: "0 4px 12px rgba(82,76,68,0.08)",
            }}
          />
          <Area
            type="monotone"
            dataKey="submissions"
            stroke={COLORS.stream}
            fill="url(#gradStream)"
            strokeWidth={2}
            name="Submissions"
          />
          <Area
            type="monotone"
            dataKey="validated"
            stroke={COLORS.moss}
            fill="url(#gradMoss)"
            strokeWidth={2}
            name="Validated"
          />
          <Legend
            verticalAlign="top"
            height={32}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: "12px" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

/**
 * Species Distribution — horizontal bar chart.
 */
export function SpeciesChart({ data }: { data: SpeciesEntry[] }) {
  return (
    <ChartWrapper title="Species Distribution">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data.slice(0, 8)}
          layout="vertical"
          margin={{ top: 5, right: 20, bottom: 5, left: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e8e4dc" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: "#8a7f6e" }} />
          <YAxis
            type="category"
            dataKey="species"
            tick={{ fontSize: 11, fill: "#8a7f6e" }}
            width={110}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e8e4dc",
              borderRadius: "12px",
              fontSize: "13px",
              boxShadow: "0 4px 12px rgba(82,76,68,0.08)",
            }}
          />
          <Bar
            dataKey="count"
            fill={COLORS.streamLight}
            radius={[0, 6, 6, 0]}
            name="Count"
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

/**
 * Confidence Distribution — histogram bar chart.
 */
export function ConfidenceChart({
  data,
}: {
  data: Array<{ range: string; count: number }>
}) {
  return (
    <ChartWrapper title="Confidence Distribution">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 10, bottom: 5, left: -20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e8e4dc" />
          <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#8a7f6e" }} />
          <YAxis tick={{ fontSize: 11, fill: "#8a7f6e" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e8e4dc",
              borderRadius: "12px",
              fontSize: "13px",
              boxShadow: "0 4px 12px rgba(82,76,68,0.08)",
            }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Observations">
            {data.map((entry) => (
              <Cell
                key={entry.range}
                fill={CONFIDENCE_COLORS[entry.range] || COLORS.stone}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

/**
 * Validation Source — donut chart.
 */
export function ValidationDonut({
  data,
}: {
  data: Array<{ name: string; value: number }>
}) {
  const filteredData = data.filter((d) => d.value > 0)

  return (
    <ChartWrapper title="Validation Source">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={filteredData}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={95}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {filteredData.map((_, i) => (
              <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e8e4dc",
              borderRadius: "12px",
              fontSize: "13px",
              boxShadow: "0 4px 12px rgba(82,76,68,0.08)",
            }}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: "12px" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

/* ── Chart wrapper ── */
function ChartWrapper({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-cozy-lg border border-stone-100 bg-surface p-5 shadow-cozy-sm">
      <h3 className="text-sm font-semibold text-stone-800 mb-4">{title}</h3>
      {children}
    </div>
  )
}
