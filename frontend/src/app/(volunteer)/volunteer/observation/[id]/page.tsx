"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Search, AlertTriangle } from "lucide-react"
import { api } from "@/lib/api"
import { ProcessingAnimation } from "@/components/volunteer/processing-animation"
import { DetailedReport } from "@/components/volunteer/detailed-report"
import { PageSkeleton } from "@/components/shared/loading-skeleton"
import type { ObservationDetail } from "@/types"

/**
 * Observation detail page — shows processing or results.
 *
 * If status=processing → ProcessingAnimation
 * If status=auto_validated/expert_validated → AIFeedback + ImpactReceipt
 * If status=pending_review → Under Review message
 * If status=rejected → Rejection info
 */
export default function ObservationDetailPage() {
  const params = useParams()
  const observationId = params.id as string
  const [detail, setDetail] = useState<ObservationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDetail = useCallback(async () => {
    try {
      const data = await api.get<ObservationDetail>(
        `/observations/${observationId}?scope=volunteer`,
      )
      setDetail(data)
      setError(null)
    } catch (err) {
      setError("Failed to load observation details.")
      console.error(err)
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
        <p className="text-sm text-danger-700">{error || "Observation not found"}</p>
        <Link
          href="/volunteer/dashboard"
          className="mt-3 inline-flex items-center gap-1 text-sm text-stream-600 hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to dashboard
        </Link>
      </div>
    )
  }

  const obs = detail.observation
  const isProcessing = obs.status === "processing"
  const isValidated =
    obs.status === "auto_validated" || obs.status === "expert_validated"
  const isPendingReview = obs.status === "pending_review"
  const isRejected = obs.status === "rejected"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/volunteer/dashboard"
          className="rounded-cozy p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-display text-2xl text-stone-800">
          {isProcessing
            ? "Processing..."
            : isValidated
              ? "Observation Results"
              : isPendingReview
                ? "Under Review"
                : "Observation"}
        </h1>
      </div>

      {/* Processing State */}
      {isProcessing && (
        <ProcessingAnimation
          observationId={observationId}
          imageUrl={obs.image_url}
          onComplete={loadDetail}
        />
      )}

      {/* Completed States — Full Detailed Multi-Domain Report */}
      {!isProcessing && (
        <div className="space-y-6">
          {/* Photo Showcase */}
          <div className="rounded-cozy-lg overflow-hidden border border-stone-200 shadow-cozy bg-stone-900/5">
            <img
              src={obs.image_url}
              alt={obs.top_species || "Stream observation"}
              className="w-full max-h-80 object-cover"
            />
          </div>

          {/* Full Multimodal AI Ecological Report */}
          <DetailedReport
            detail={detail}
            onDelete={() => {
              // Redirect to history after deletion
              window.location.href = "/volunteer/history"
            }}
          />

          {isRejected && (
            <div className="rounded-cozy-lg border border-danger-200 bg-danger-50/50 p-5 text-center">
              <h3 className="font-display text-base font-semibold text-stone-800">
                Observation Not Validated by Researcher
              </h3>
              <p className="mt-1 text-xs text-stone-600 max-w-sm mx-auto">
                {detail.review?.rejection_reason ||
                  "The observation could not be verified against regional monitoring criteria."}
              </p>
              <Link
                href="/volunteer/submit"
                className="mt-3 inline-flex items-center gap-1.5 rounded-cozy bg-stream-500 px-4 py-2 text-xs font-semibold text-white hover:bg-stream-600 transition-colors shadow-cozy-sm"
              >
                Submit New Observation
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
