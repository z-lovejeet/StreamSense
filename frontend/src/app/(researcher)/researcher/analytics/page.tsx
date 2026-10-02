"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { api } from "@/lib/api"
import {
  TimelineChart,
  SpeciesChart,
  ConfidenceChart,
  ValidationDonut,
} from "@/components/researcher/analytics-charts"
import { PageSkeleton } from "@/components/shared/loading-skeleton"
import type { SummaryStats, TimelineEntry, SpeciesEntry } from "@/types"

/**
 * Analytics page — chart dashboard with summary stats.
 *
 * DOC-10 Task 5.11
 */
export default function AnalyticsPage() {
  const [stats, setStats] = useState<SummaryStats | null>(null)
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [species, setSpecies] = useState<SpeciesEntry[]>([])
  const [confidence, setConfidence] = useState<
    Array<{ range: string; count: number }>
  >([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, timelineRes, speciesRes, confRes] = await Promise.all([
          api.get<SummaryStats>("/analytics/summary"),
          api.get<{ data: TimelineEntry[] }>("/analytics/timeline"),
          api.get<{ data: SpeciesEntry[] }>("/analytics/species"),
          api.get<{ data: Array<{ range: string; count: number }> }>(
            "/analytics/confidence",
          ),
        ])
        setStats(statsRes)
        setTimeline(timelineRes.data)
        setSpecies(speciesRes.data)
        setConfidence(confRes.data)
      } catch (err) {
        console.error("Failed to load analytics:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <PageSkeleton />

  const donutData = stats
    ? [
        { name: "Auto-validated", value: stats.auto_validated_count },
        { name: "Expert-validated", value: stats.expert_validated_count },
        { name: "Rejected", value: stats.rejected_count },
        { name: "Pending", value: stats.pending_review },
      ]
    : []

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-2xl text-stone-800">Analytics</h1>
        <p className="mt-1 text-sm text-stone-500 max-w-2xl leading-relaxed">
          Aggregated scientific intelligence across all 5 pilot basins. Explore longitudinal observation timelines, macroinvertebrate biodiversity rankings, AI pipeline confidence calibration histograms, and automated triage vs. expert review proportions.
        </p>
      </motion.div>

      {/* Summary stat row */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <MiniStat
            label="Total Observations"
            value={stats.total_observations}
          />
          <MiniStat
            label="Avg Confidence"
            value={stats.avg_confidence !== null ? `${stats.avg_confidence}%` : "—"}
          />
          <MiniStat
            label="Avg Pipeline"
            value={
              stats.avg_pipeline_time !== null
                ? `${stats.avg_pipeline_time}s`
                : "—"
            }
          />
          <MiniStat
            label="Pending Review"
            value={stats.pending_review}
            accent
          />
        </motion.div>
      )}

      {/* Charts grid — 2 columns on desktop */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <TimelineChart data={timeline} />
        <SpeciesChart data={species} />
        <ConfidenceChart data={confidence} />
        <ValidationDonut data={donutData} />
      </motion.div>
    </div>
  )
}

function MiniStat({
  label,
  value,
  accent,
}: {
  label: string
  value: string | number
  accent?: boolean
}) {
  return (
    <div className="rounded-cozy-lg border border-stone-100 bg-surface p-4 shadow-cozy-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
        {label}
      </p>
      <p
        className={`text-xl font-bold mt-0.5 ${accent ? "text-amber-600" : "text-stone-800"}`}
      >
        {value}
      </p>
    </div>
  )
}
