"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import { api } from "@/lib/api"
import { ReviewDetail } from "@/components/researcher/review-detail"
import { PageSkeleton } from "@/components/shared/loading-skeleton"
import type { ObservationDetail } from "@/types"

/**
 * Review detail page — full observation + AI brief + action buttons.
 *
 * DOC-10 Task 5.5
 */
export default function ReviewDetailPage() {
  const params = useParams()
  const observationId = params.id as string
  const [detail, setDetail] = useState<ObservationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDetail = useCallback(async () => {
    try {
      const data = await api.get<ObservationDetail>(
        `/observations/${observationId}`,
      )
      setDetail(data)
    } catch {
      setError("Failed to load observation details.")
    } finally {
      setLoading(false)
    }
  }, [observationId])

  useEffect(() => {
    loadDetail()
  }, [loadDetail])

  if (loading) return <PageSkeleton />

  if (error || !detail) {
    return (
      <div className="rounded-cozy-lg border border-danger-500/20 bg-danger-50 p-6 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-danger-500 mb-2" />
        <p className="text-sm text-danger-700">
          {error || "Observation not found"}
        </p>
        <Link
          href="/researcher/review"
          className="mt-3 inline-flex items-center gap-1 text-sm text-stream-600 hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to review queue
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/researcher/review"
          className="rounded-cozy p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-display text-2xl text-stone-800">
            Review Observation
          </h1>
          <p className="text-xs font-mono text-stone-400">
            {observationId.slice(0, 8)}...
          </p>
        </div>
      </div>

      <ReviewDetail detail={detail} />
    </div>
  )
}
