"use client"

import { useState } from "react"
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

const DONUT_COLORS = [COLORS.stream, COLORS.moss, COLORS.amber, COLORS.danger]

const CONFIDENCE_COLORS: Record<string, string> = {
  "90-100": "#10b981",
  "80-89": "#0d9488",
  "70-79": "#0284c7",
  "50-69": "#f59e0b",
  "<50": "#ef4444",
}

const SPECIES_TAXA_META: Record<
  string,
  { common: string; bmwp: number; category: "clean" | "moderate" | "tolerant" }
> = {
  Ephemeroptera: { common: "Mayfly nymph", bmwp: 10, category: "clean" },
  Plecoptera: { common: "Stonefly nymph", bmwp: 10, category: "clean" },
  Trichoptera: { common: "Caddisfly larva", bmwp: 8, category: "clean" },
  Heptageniidae: { common: "Flat-headed mayfly", bmwp: 10, category: "clean" },
  Leuctridae: { common: "Rolled-wing stonefly", bmwp: 10, category: "clean" },
  Baetidae: { common: "Small mayfly nymph", bmwp: 4, category: "moderate" },
  Gammaridae: { common: "Freshwater shrimp", bmwp: 6, category: "moderate" },
  Simuliidae: { common: "Blackfly larva", bmwp: 5, category: "moderate" },
  Hydropsychidae: { common: "Net-spinning caddisfly", bmwp: 5, category: "moderate" },
  Chironomidae: { common: "Midge larva", bmwp: 2, category: "tolerant" },
  Asellidae: { common: "Water louse", bmwp: 3, category: "tolerant" },
  Gastropoda: { common: "Freshwater snail", bmwp: 3, category: "tolerant" },
  Oligochaeta: { common: "Aquatic worm", bmwp: 1, category: "tolerant" },
  Tubificidae: { common: "Sludge worm", bmwp: 1, category: "tolerant" },
  Culicidae: { common: "Mosquito larva", bmwp: 0, category: "tolerant" },
}

/**
 * Submissions Timeline — area chart with gradient fills.
 * Preserved per user instruction ("first is already good").
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
 * Species Distribution — upgraded executive bioindicator ranking with toggle.
 */
export function SpeciesChart({ data }: { data: SpeciesEntry[] }) {
  const [view, setView] = useState<"ranking" | "bars">("ranking")

  const totalCount = data.reduce((acc, d) => acc + d.count, 0)
  const maxCount = Math.max(...data.map((d) => d.count), 1)

  const cleanCount = data
    .filter((d) => SPECIES_TAXA_META[d.species]?.category === "clean")
    .reduce((acc, d) => acc + d.count, 0)
  const cleanPercentage = totalCount > 0 ? Math.round((cleanCount / totalCount) * 100) : 0

  return (
    <div className="rounded-cozy-lg border border-stone-100 bg-surface p-5 shadow-cozy-sm space-y-4">
      {/* Header + Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-stone-800">
            Species Biodiversity & Bioindicators
          </h3>
          <p className="text-xs text-stone-500">
            Freshwater taxa ranked by occurrence & BMWP rating
          </p>
        </div>

        <div className="flex items-center gap-2">
          {totalCount > 0 && (
            <span className="hidden sm:inline-block rounded-pill bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
              Clean Taxa: {cleanPercentage}%
            </span>
          )}
          <div className="flex rounded-cozy border border-stone-200 bg-stone-50 p-0.5">
            <button
              onClick={() => setView("ranking")}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                view === "ranking"
                  ? "bg-surface text-stone-800 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              Ranking
            </button>
            <button
              onClick={() => setView("bars")}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                view === "bars"
                  ? "bg-surface text-stone-800 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              Bars
            </button>
          </div>
        </div>
      </div>

      {view === "ranking" ? (
        <div className="space-y-2.5 min-h-[220px]">
          {data.slice(0, 5).map((entry, idx) => {
            const meta = SPECIES_TAXA_META[entry.species] || {
              common: entry.common_name || "Freshwater macroinvertebrate",
              bmwp: 5,
              category: "moderate" as const,
            }
            const commonTitle = entry.common_name || meta.common
            const pct = totalCount > 0 ? Math.round((entry.count / totalCount) * 100) : 0

            return (
              <div
                key={entry.species}
                className="rounded-cozy bg-stone-50/70 p-2.5 border border-stone-100 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface border border-stone-200 font-mono text-[10px] font-bold text-stone-600">
                      #{idx + 1}
                    </span>
                    <span className="font-semibold text-stone-800">
                      {entry.species}
                    </span>
                    <span className="text-[11px] text-stone-500 italic hidden sm:inline">
                      ({commonTitle})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold border ${
                        meta.category === "clean"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : meta.category === "moderate"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      BMWP {meta.bmwp}
                    </span>
                    <span className="font-mono text-xs font-bold text-stone-700">
                      {entry.count}{" "}
                      <span className="text-[10px] font-normal text-stone-400">
                        ({pct}%)
                      </span>
                    </span>
                  </div>
                </div>

                {/* Styled Gradient Progress Bar */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200/60">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      meta.category === "clean"
                        ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                        : meta.category === "moderate"
                          ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                          : "bg-gradient-to-r from-rose-500 to-orange-400"
                    }`}
                    style={{
                      width: `${Math.max((entry.count / maxCount) * 100, 10)}%`,
                    }}
                  />
                </div>
              </div>
            )
          })}

          {data.length === 0 && (
            <p className="text-center text-xs text-stone-400 py-10">
              No species observations recorded yet.
            </p>
          )}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={data.slice(0, 6)}
            layout="vertical"
            margin={{ top: 5, right: 25, bottom: 5, left: 15 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ece1" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: "#78716c" }}
              allowDecimals={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="species"
              tick={{ fontSize: 11, fill: "#78716c" }}
              width={110}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload as SpeciesEntry
                  const meta = SPECIES_TAXA_META[d.species]
                  return (
                    <div className="rounded-cozy bg-surface p-2.5 shadow-cozy-lg border border-stone-200 text-xs space-y-1">
                      <p className="font-bold text-stone-800">{d.species}</p>
                      {meta && <p className="text-stone-500 italic">{meta.common}</p>}
                      <div className="flex items-center gap-2 pt-1 font-mono">
                        <span className="text-stream-700 font-semibold">
                          {d.count} observations
                        </span>
                        {meta && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 font-bold">
                            BMWP: {meta.bmwp}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar dataKey="count" radius={[0, 8, 8, 0]}>
              {data.slice(0, 6).map((entry) => {
                const cat = SPECIES_TAXA_META[entry.species]?.category
                const fill =
                  cat === "clean" ? "#10b981" : cat === "moderate" ? "#f59e0b" : "#e11d48"
                return <Cell key={entry.species} fill={fill} />
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

/**
 * Confidence Distribution — histogram with clear triage cutoff & subtle hover.
 */
export function ConfidenceChart({
  data,
}: {
  data: Array<{ range: string; count: number }>
}) {
  const totalObs = data.reduce((acc, d) => acc + d.count, 0)
  const autoValidatedCount = data
    .filter((d) => d.range === "90-100" || d.range === "80-89" || d.range === "70-79")
    .reduce((acc, d) => acc + d.count, 0)
  const autoRate = totalObs > 0 ? Math.round((autoValidatedCount / totalObs) * 100) : 0

  return (
    <ChartWrapper title="Confidence Calibration" badge="70% Auto Cutoff">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          margin={{ top: 15, right: 10, bottom: 5, left: -20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0ece1" vertical={false} />
          <XAxis
            dataKey="range"
            tick={{ fontSize: 11, fill: "#78716c", fontWeight: 500 }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#78716c" }}
            allowDecimals={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(45, 144, 121, 0.05)", radius: 6 }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload as { range: string; count: number }
                const isAuto =
                  d.range === "90-100" || d.range === "80-89" || d.range === "70-79"
                return (
                  <div className="rounded-cozy bg-surface p-2.5 shadow-cozy-lg border border-stone-200 text-xs space-y-1">
                    <p className="font-bold text-stone-800">
                      Confidence Band: {d.range}%
                    </p>
                    <p className="font-mono text-stone-700">
                      Observations: <span className="font-bold">{d.count}</span>
                    </p>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        isAuto
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {isAuto ? "Auto-Validated (≥70)" : "Expert Review (<70)"}
                    </span>
                  </div>
                )
              }
              return null
            }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.range}
                fill={CONFIDENCE_COLORS[entry.range] || COLORS.stone}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend & Calibration Policy */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3 text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="text-stone-600 font-medium">
            ≥70 Auto-Validated ({autoRate}%)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          <span className="text-stone-600 font-medium">&lt;70 Expert Queue</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
          <span className="text-stone-600 font-medium">&lt;50 Flagged</span>
        </div>
      </div>
    </ChartWrapper>
  )
}

/**
 * Validation Source — executive donut chart with center KPI and structured breakdown.
 */
export function ValidationDonut({
  data,
}: {
  data: Array<{ name: string; value: number }>
}) {
  const filteredData = data.filter((d) => d.value > 0)
  const total = data.reduce((acc, d) => acc + d.value, 0)

  const DONUT_COLOR_MAP: Record<string, string> = {
    "Auto-validated": "#2d9079",
    "Expert-validated": "#7f9058",
    Pending: "#f59e0b",
    "Pending review": "#f59e0b",
    Rejected: "#dc4446",
  }

  return (
    <ChartWrapper title="Validation & Triage Source">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        {/* Left: Donut Chart with Centered KPI */}
        <div className="relative h-[220px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={
                  filteredData.length > 0 ? filteredData : [{ name: "None", value: 1 }]
                }
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={92}
                paddingAngle={4}
                cornerRadius={6}
                dataKey="value"
                strokeWidth={0}
              >
                {filteredData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={DONUT_COLOR_MAP[entry.name] || COLORS.stone}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as { name: string; value: number }
                    const pct = total > 0 ? Math.round((d.value / total) * 100) : 0
                    return (
                      <div className="rounded-cozy bg-surface p-2.5 shadow-cozy-lg border border-stone-200 text-xs">
                        <p className="font-bold text-stone-800">{d.name}</p>
                        <p className="font-mono text-stone-600 mt-0.5">
                          {d.value} records ({pct}%)
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center KPI text inside donut hole */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-display text-2xl font-bold text-stone-800">
              {total}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
              Records
            </span>
          </div>
        </div>

        {/* Right: Structured Legend List */}
        <div className="space-y-2">
          {data.map((item) => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
            const color = DONUT_COLOR_MAP[item.name] || "#78716c"

            return (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-cozy bg-stone-50/70 px-3 py-2 border border-stone-100 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-medium text-stone-700">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-stone-800">
                    {item.value}
                  </span>
                  <span className="rounded bg-surface px-1.5 py-0.5 font-mono text-[10px] text-stone-500 border border-stone-200">
                    {pct}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </ChartWrapper>
  )
}

/* ── Chart wrapper ── */
function ChartWrapper({
  title,
  badge,
  children,
}: {
  title: string
  badge?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-cozy-lg border border-stone-100 bg-surface p-5 shadow-cozy-sm space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-800">{title}</h3>
        {badge && (
          <span className="rounded-pill bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}
