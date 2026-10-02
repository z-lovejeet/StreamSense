"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Search } from "lucide-react"
import { api } from "@/lib/api"
import { ReviewQueue } from "@/components/researcher/review-queue"
import { CardSkeleton } from "@/components/shared/loading-skeleton"
import type { Observation, ObservationListResponse } from "@/types"

/**
 * Review queue page — filterable list of pending observations.
 *
 * DOC-10 Task 5.3, DOC-09 Lines 508, 631
 */
export default function ReviewQueuePage() {
  const [observations, setObservations] = useState<Observation[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [speciesFilter, setSpeciesFilter] = useState("")
  const [minScore, setMinScore] = useState("")
  const [maxScore, setMaxScore] = useState("")
  const limit = 20

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        let url = `/review/queue?page=${page}&limit=${limit}`
        if (speciesFilter) url += `&species=${encodeURIComponent(speciesFilter)}`
        if (minScore) url += `&min_score=${minScore}`
        if (maxScore) url += `&max_score=${maxScore}`

        const data = await api.get<ObservationListResponse>(url)
        setObservations(data.observations)
        setTotal(data.total)
      } catch (err) {
        console.error("Failed to load review queue:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [page, speciesFilter, minScore, maxScore])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-display text-2xl text-stone-800">Review Queue</h1>
        <p className="mt-1 text-sm text-stone-500 max-w-2xl leading-relaxed">
          Triage queue for observations flagged by AI quality scoring (confidence &lt; 70 or environmental anomalies). Inspect the side-by-side macro photo, verify species taxonomy against BioCLIP predictions, confirm accurate IDs, or correct observations to maintain scientific dataset integrity.
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="flex flex-wrap gap-3"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Filter by species..."
            value={speciesFilter}
            onChange={(e) => {
              setSpeciesFilter(e.target.value)
              setPage(1)
            }}
            className="rounded-cozy border border-stone-200 bg-surface pl-9 pr-4 py-2 text-sm text-stone-700 placeholder:text-stone-400 focus:border-stream-400 focus:ring-2 focus:ring-stream-100 transition-colors w-48"
          />
        </div>
        <input
          type="number"
          placeholder="Min score"
          value={minScore}
          onChange={(e) => {
            setMinScore(e.target.value)
            setPage(1)
          }}
          className="rounded-cozy border border-stone-200 bg-surface px-3 py-2 text-sm text-stone-700 placeholder:text-stone-400 focus:border-stream-400 focus:ring-2 focus:ring-stream-100 transition-colors w-28"
        />
        <input
          type="number"
          placeholder="Max score"
          value={maxScore}
          onChange={(e) => {
            setMaxScore(e.target.value)
            setPage(1)
          }}
          className="rounded-cozy border border-stone-200 bg-surface px-3 py-2 text-sm text-stone-700 placeholder:text-stone-400 focus:border-stream-400 focus:ring-2 focus:ring-stream-100 transition-colors w-28"
        />
        <span className="flex items-center text-xs text-stone-400">
          {total} result{total !== 1 ? "s" : ""}
        </span>
      </motion.div>

      {/* Queue List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : observations.length === 0 ? (
        <div className="rounded-cozy-lg border border-stone-100 bg-surface p-12 text-center shadow-cozy-sm">
          <p className="text-sm text-stone-500">
            🎉 All caught up! No observations need review.
          </p>
        </div>
      ) : (
        <ReviewQueue observations={observations} />
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
