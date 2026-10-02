"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  BarChart3,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  TrendingUp,
  Zap,
  Timer,
  Bug,
  Camera,
  Database,
  FileCheck,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { api } from "@/lib/api"
import { StatusBadge } from "@/components/shared/status-badge"
import { PageSkeleton } from "@/components/shared/loading-skeleton"
import { ResearcherGamification } from "@/components/researcher/researcher-gamification"
import { formatDistanceToNow } from "date-fns"
import type { SummaryStats, Observation, ObservationListResponse } from "@/types"

/**
 * Researcher Dashboard — stats + queue preview + activity.
 *
 * DOC-09 Lines 499–528
 */
export default function ResearcherDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<SummaryStats | null>(null)
  const [queueItems, setQueueItems] = useState<Observation[]>([])
  const [queueCount, setQueueCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [summaryRes, queueRes, countRes] = await Promise.all([
          api.get<SummaryStats>("/analytics/summary"),
          api.get<ObservationListResponse>("/review/queue?page=1&limit=3"),
          api.get<{ count: number }>("/review/queue/count"),
        ])
        setStats(summaryRes)
        setQueueItems(queueRes.observations)
        setQueueCount(countRes.count)
      } catch (err) {
        console.error("Failed to load dashboard:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <PageSkeleton />

  const firstName = user?.full_name?.split(" ")[0] || "Researcher"
  const totalValidated =
    (stats?.auto_validated_count || 0) + (stats?.expert_validated_count || 0)
  const autoRate =
    stats && stats.total_observations > 0
      ? Math.round(
          ((stats.auto_validated_count || 0) / stats.total_observations) * 100,
        )
      : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-display text-2xl md:text-3xl text-stone-800">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-stone-500 max-w-2xl leading-relaxed">
          Welcome back, {firstName}. Real-time monitoring dashboard for the OneAquaHealth consortium. Track automated pipeline triage, review priority verification queues, inspect DipteraCAST disease-vector alerts, and verify incoming stream macroinvertebrates.
        </p>
      </motion.div>

      {/* Stat Cards */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <DashStatCard
          label="Total"
          value={stats?.total_observations ?? 0}
          icon={<BarChart3 className="h-4 w-4 text-stream-500" />}
        />
        <DashStatCard
          label="Validated"
          value={totalValidated}
          icon={<CheckCircle2 className="h-4 w-4 text-success-500" />}
          accent="success"
        />
        <DashStatCard
          label="Pending"
          value={stats?.pending_review ?? 0}
          icon={<Clock className="h-4 w-4 text-amber-500" />}
          accent="amber"
        />
        <DashStatCard
          label="Rejected"
          value={stats?.rejected_count ?? 0}
          icon={<XCircle className="h-4 w-4 text-danger-500" />}
          accent="danger"
        />
      </motion.div>

      {/* Scientific Validation Milestones, Pilot Basins & Weekly QA Sprint */}
      <ResearcherGamification
        totalObservations={stats?.total_observations ?? 0}
        validatedCount={totalValidated}
        pendingCount={stats?.pending_review ?? 0}
        autoRate={autoRate}
        avgConfidence={stats?.avg_confidence ?? null}
      />

      {/* Review Queue Preview */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-stone-800">
            Review Queue{" "}
            {queueCount > 0 && (
              <span className="ml-1 text-sm font-mono font-normal text-amber-600">
                ({queueCount} pending)
              </span>
            )}
          </h2>
          <Link
            href="/researcher/review"
            className="flex items-center gap-1 text-sm font-medium text-stream-600 hover:text-stream-700 transition-colors"
          >
            View All
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {queueItems.length === 0 ? (
          <div className="rounded-cozy-lg border border-stone-100 bg-surface p-8 text-center shadow-cozy-sm">
            <p className="flex items-center justify-center gap-1.5 text-sm text-stone-500">
              <CheckCircle2 className="h-4 w-4 text-success-600" />
              All caught up! No observations need review.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {queueItems.map((obs, i) => (
              <Link
                key={obs.id}
                href={`/researcher/review/${obs.id}`}
              >
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.05, duration: 0.3 }}
                  className="flex items-center gap-4 rounded-cozy-lg border border-stone-100 bg-surface p-3.5 shadow-cozy-sm transition-all hover:shadow-cozy hover:-translate-y-0.5 cursor-pointer"
                >
                  {/* Thumbnail */}
                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-cozy bg-stone-100">
                    {obs.image_url ? (
                      <img
                        src={obs.image_thumbnail_url || obs.image_url}
                        alt={obs.top_species || "Observation"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-stone-300">
                        <Camera className="h-5 w-5 text-stone-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-stone-800 truncate">
                        {obs.top_species ? `${obs.top_species}?` : "Unknown species"}
                      </span>
                      {obs.confidence_score !== null && (
                        <span
                          className={`rounded-pill px-2 py-0.5 text-[10px] font-bold ${
                            obs.confidence_score >= 70
                              ? "bg-success-50 text-success-700"
                              : obs.confidence_score >= 50
                                ? "bg-amber-50 text-amber-700"
                                : "bg-danger-50 text-danger-700"
                          }`}
                        >
                          {obs.confidence_score}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400 truncate">
                      {obs.pilot_city || obs.location_name || "Unknown"} ·{" "}
                      {formatDistanceToNow(new Date(obs.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>

                  <StatusBadge status={obs.status} />
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
        <h2 className="font-display text-lg text-stone-800 mb-3">
          Recent Activity
        </h2>
        <div className="rounded-cozy-lg border border-stone-100 bg-surface p-5 shadow-cozy-sm space-y-4">
          <ActivityRow
            icon={<TrendingUp className="h-4 w-4 text-stream-500" />}
            label="Auto-validation rate"
            value={`${autoRate}%`}
            barPercent={autoRate}
          />
          <ActivityRow
            icon={<Zap className="h-4 w-4 text-amber-500" />}
            label="Avg confidence"
            value={stats?.avg_confidence !== null ? `${stats?.avg_confidence}` : "—"}
            barPercent={stats?.avg_confidence ?? 0}
          />
          <ActivityRow
            icon={<Timer className="h-4 w-4 text-moss-500" />}
            label="Avg pipeline time"
            value={
              stats?.avg_pipeline_time !== null
                ? `${stats?.avg_pipeline_time}s`
                : "—"
            }
          />
        </div>
      </motion.div>

      {/* DipteraCAST Vector Risk Summary */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4 }}
      >
        <h2 className="font-display text-lg text-stone-800 mb-3">
          <span className="flex items-center gap-2">
            <Bug className="h-4 w-4 text-amber-500" />
            DipteraCAST Vector Forecast
          </span>
        </h2>
        <div className="rounded-cozy-lg border border-stone-100 bg-surface p-5 shadow-cozy-sm">
          <p className="text-xs text-stone-500 mb-4">
            Mock disease-vector risk predictions across pilot cities
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { city: "Coimbra", risk: "Low", color: "bg-success-50 text-success-700 border-success-200" },
              { city: "Toulouse", risk: "Moderate", color: "bg-amber-50 text-amber-700 border-amber-200" },
              { city: "Benevento", risk: "High", color: "bg-danger-50 text-danger-700 border-danger-200" },
              { city: "Ghent", risk: "Low", color: "bg-success-50 text-success-700 border-success-200" },
              { city: "Oslo", risk: "Low", color: "bg-success-50 text-success-700 border-success-200" },
            ].map(({ city, risk, color }) => (
              <div
                key={city}
                className={`rounded-cozy border p-3 ${color}`}
              >
                <p className="text-xs font-semibold">{city}</p>
                <p className="text-lg font-bold">{risk}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10px] text-stone-400">
            Powered by DipteraCAST · OneAquaHealth Consortium · Mock data for demonstration
          </p>
        </div>
      </motion.div>

      {/* Consortium Scientific Operations Hub */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.4 }}
        className="space-y-3"
      >
        <h2 className="font-display text-lg text-stone-800">
          Scientific Operations Hub
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href="/researcher/review"
            className="flex items-center justify-between rounded-cozy-lg border border-stone-100 bg-surface p-4 shadow-cozy-sm hover:shadow-cozy hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-cozy bg-amber-50 text-amber-600 border border-amber-200">
                <Clock className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-800">Review Console</p>
                <p className="text-[11px] text-stone-400">Triage pending observations</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-stone-300" />
          </Link>

          <Link
            href="/researcher/validated"
            className="flex items-center justify-between rounded-cozy-lg border border-stone-100 bg-surface p-4 shadow-cozy-sm hover:shadow-cozy hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-cozy bg-stream-50 text-stream-600 border border-stream-200">
                <Database className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-800">Validated Registry</p>
                <p className="text-[11px] text-stone-400">GIS map & export table</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-stone-300" />
          </Link>

          <Link
            href="/researcher/analytics"
            className="flex items-center justify-between rounded-cozy-lg border border-stone-100 bg-surface p-4 shadow-cozy-sm hover:shadow-cozy hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-cozy bg-moss-50 text-moss-600 border border-moss-200">
                <TrendingUp className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-800">Catchment Analytics</p>
                <p className="text-[11px] text-stone-400">BMWP trends & AI metrics</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-stone-300" />
          </Link>

          <Link
            href="/researcher/fhir"
            className="flex items-center justify-between rounded-cozy-lg border border-stone-100 bg-surface p-4 shadow-cozy-sm hover:shadow-cozy hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-cozy bg-stream-50 text-stream-600 border border-stream-200">
                <FileCheck className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-800">HL7 / FHIR R4</p>
                <p className="text-[11px] text-stone-400">Interoperability sandbox</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-stone-300" />
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

function DashStatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string
  value: number
  icon: React.ReactNode
  accent?: "success" | "amber" | "danger"
}) {
  const valueColor =
    accent === "success"
      ? "text-success-700"
      : accent === "amber"
        ? "text-amber-700"
        : accent === "danger"
          ? "text-danger-700"
          : "text-stone-900"

  return (
    <div className="rounded-cozy-lg border border-stone-100 bg-surface p-4 shadow-cozy-sm">
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
          {label}
        </span>
      </div>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
    </div>
  )
}

function ActivityRow({
  icon,
  label,
  value,
  barPercent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  barPercent?: number
}) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-stone-600">{label}</span>
          <span className="font-mono text-sm font-semibold text-stone-800">
            {value}
          </span>
        </div>
        {barPercent !== undefined && (
          <div className="h-1.5 rounded-pill bg-stone-100 overflow-hidden">
            <motion.div
              className="h-full rounded-pill bg-stream-400"
              initial={{ width: "0%" }}
              animate={{ width: `${Math.min(barPercent, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
