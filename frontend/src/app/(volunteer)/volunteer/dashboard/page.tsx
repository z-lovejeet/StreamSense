"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Camera, ClipboardList, MapPin, TrendingUp, CheckCircle2, Clock, BarChart3 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { api } from "@/lib/api"
import { ObservationCard } from "@/components/shared/observation-card"
import { PageSkeleton } from "@/components/shared/loading-skeleton"
import { VolunteerGamification } from "@/components/volunteer/volunteer-gamification"
import type { Observation, ObservationListResponse } from "@/types"

/**
 * Volunteer Dashboard — welcome + stats + recent observations + CTA.
 *
 * DOC-09 Lines 330–369
 */
export default function VolunteerDashboard() {
  const { user } = useAuth()
  const [observations, setObservations] = useState<Observation[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get<ObservationListResponse>(
          "/observations?page=1&limit=5",
        )
        setObservations(data.observations)
        setTotal(data.total)
      } catch (err) {
        console.error("Failed to load observations:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <PageSkeleton />

  // Compute stats from user's observations
  const validated = observations.filter(
    (o) => o.status === "auto_validated" || o.status === "expert_validated",
  ).length
  const pending = observations.filter(
    (o) => o.status === "pending_review" || o.status === "processing",
  ).length
  const autoRate =
    total > 0
      ? Math.round(
          (observations.filter((o) => o.status === "auto_validated").length /
            Math.max(observations.length, 1)) *
            100,
        )
      : 0

  const firstName = user?.full_name?.split(" ")[0] || "Explorer"

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-display text-2xl md:text-3xl text-stone-800">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-sm text-stone-500 max-w-2xl leading-relaxed">
          Your citizen science portal. Track your macroinvertebrate submissions, view real-time AI validation metrics, explore community stream health, and see how your data protects local urban ecosystems.
        </p>
      </motion.div>

      {/* Primary CTA */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div className="rounded-cozy-lg border border-stone-100 bg-surface p-6 shadow-cozy">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-stone-800">
                Ready to observe?
              </h2>
              <p className="text-sm text-stone-500 mt-0.5">
                Head to your nearest stream and snap a photo of what you find.
              </p>
            </div>
            <Link
              href="/volunteer/submit"
              className="inline-flex items-center justify-center gap-2 rounded-cozy bg-stream-500 px-6 py-3 text-sm font-semibold text-white shadow-cozy-sm transition-all hover:bg-stream-600 hover:shadow-cozy hover:-translate-y-0.5"
            >
              <Camera className="h-4 w-4" />
              Submit New Observation
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total"
            value={total}
            icon={<BarChart3 className="h-4 w-4 text-stream-500" />}
          />
          <StatCard
            label="Validated"
            value={validated}
            icon={<CheckCircle2 className="h-4 w-4 text-success-500" />}
            accent="success"
          />
          <StatCard
            label="Pending"
            value={pending}
            icon={<Clock className="h-4 w-4 text-amber-500" />}
            accent="amber"
          />
          <StatCard
            label="Auto-rate"
            value={`${autoRate}%`}
            icon={<TrendingUp className="h-4 w-4 text-stream-500" />}
          />
        </div>
      </motion.div>

      {/* Gamification, Badges & Field Challenges */}
      <VolunteerGamification
        totalObservations={total}
        validatedObservations={validated}
      />

      {/* Recent Observations */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg text-stone-800">
                Recent Observations
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Your latest stream macroinvertebrate submissions and AI triage statuses
              </p>
            </div>
            {observations.length > 0 && (
              <Link
                href="/volunteer/history"
                className="text-xs font-semibold text-stream-600 hover:text-stream-700 transition-colors"
              >
                View all ({total})
              </Link>
            )}
          </div>

          {observations.length === 0 ? (
            <div className="rounded-cozy-lg border border-stone-100 bg-surface p-8 text-center shadow-cozy-sm">
              <div className="mx-auto mb-3 h-12 w-12 rounded-cozy-lg bg-stream-50 flex items-center justify-center">
                <Camera className="h-6 w-6 text-stream-400" />
              </div>
              <p className="text-sm font-medium text-stone-700">
                No observations yet
              </p>
              <p className="mt-1 text-xs text-stone-400">
                Head to a stream and submit your first observation!
              </p>
              <Link
                href="/volunteer/submit"
                className="mt-4 inline-flex items-center gap-1.5 rounded-cozy bg-stream-500 px-4 py-2 text-sm font-medium text-white shadow-cozy-sm hover:bg-stream-600 transition-colors"
              >
                <Camera className="h-3.5 w-3.5" />
                Start Observing
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {observations.map((obs, i) => (
                <ObservationCard key={obs.id} observation={obs} index={i} />
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Quick Links */}
      {observations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="flex gap-3"
        >
          <Link
            href="/volunteer/map"
            className="flex items-center gap-2 rounded-cozy border border-stone-200 bg-surface px-4 py-2.5 text-sm font-medium text-stone-700 shadow-cozy-sm transition-all hover:bg-surface-hover hover:shadow-cozy"
          >
            <MapPin className="h-4 w-4" />
            View Map
          </Link>
          <Link
            href="/volunteer/history"
            className="flex items-center gap-2 rounded-cozy border border-stone-200 bg-surface px-4 py-2.5 text-sm font-medium text-stone-700 shadow-cozy-sm transition-all hover:bg-surface-hover hover:shadow-cozy"
          >
            <ClipboardList className="h-4 w-4" />
            Full History
          </Link>
        </motion.div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string
  value: number | string
  icon: React.ReactNode
  accent?: "success" | "amber"
}) {
  const valueColor =
    accent === "success"
      ? "text-success-700"
      : accent === "amber"
        ? "text-amber-700"
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
