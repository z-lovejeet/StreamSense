"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Camera } from "lucide-react"
import { api } from "@/lib/api"
import { ObservationCard } from "@/components/shared/observation-card"
import { CardSkeleton } from "@/components/shared/loading-skeleton"
import type { Observation, ObservationListResponse } from "@/types"

/**
 * History page — past observations list with status badges.
 *
 * DOC-09 Lines 350–357, 620–634
 * DOC-10 Line 219
 */
export default function HistoryPage() {
  const [observations, setObservations] = useState<Observation[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const limit = 20

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await api.get<ObservationListResponse>(
          `/observations?scope=volunteer&page=${page}&limit=${limit}`,
        )
        setObservations(data.observations)
        setTotal(data.total)
      } catch (err) {
        console.error("Failed to load history:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [page])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl text-stone-800">
          Observation History
        </h1>
        <p className="mt-1 text-sm text-stone-500 max-w-2xl leading-relaxed">
          Your complete catalog of submitted stream observations. Check AI identification confidence scores, verification status (Auto-Validated or Expert-Reviewed), and click any observation to inspect species details and disease-vector risk insights.
        </p>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : observations.length === 0 ? (
        /* Empty State */
        <div className="rounded-cozy-lg border border-stone-100 bg-surface p-12 text-center shadow-cozy-sm">
          <div className="mx-auto mb-4 h-16 w-16 rounded-cozy-xl bg-stream-50 flex items-center justify-center">
            <Camera className="h-8 w-8 text-stream-400" />
          </div>
          <h3 className="font-display text-lg text-stone-800">
            No observations yet
          </h3>
          <p className="mt-2 text-sm text-stone-500 max-w-xs mx-auto">
            Head to your nearest stream and submit your first observation
            to start contributing to water quality research.
          </p>
          <Link
            href="/volunteer/submit"
            className="mt-5 inline-flex items-center gap-2 rounded-cozy bg-stream-500 px-5 py-2.5 text-sm font-semibold text-white shadow-cozy-sm transition-all hover:bg-stream-600 hover:shadow-cozy hover:-translate-y-0.5"
          >
            <Camera className="h-4 w-4" />
            Start Observing
          </Link>
        </div>
      ) : (
        /* Observation List */
        <div className="space-y-3">
          {observations.map((obs, i) => (
            <ObservationCard key={obs.id} observation={obs} index={i} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-cozy border border-stone-200 bg-surface px-3 py-1.5 text-sm text-stone-600 disabled:opacity-40 hover:bg-surface-hover transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-stone-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-cozy border border-stone-200 bg-surface px-3 py-1.5 text-sm text-stone-600 disabled:opacity-40 hover:bg-surface-hover transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
