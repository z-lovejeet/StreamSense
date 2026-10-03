"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, AlertTriangle, ShieldCheck, CheckCircle2 } from "lucide-react"
import { api } from "@/lib/api"
import { DetailedReport } from "@/components/volunteer/detailed-report"
import { PageSkeleton } from "@/components/shared/loading-skeleton"
import type { ObservationDetail } from "@/types"

/**
 * Researcher Validated Observation Report Page.
 *
 * Allows researchers to inspect the full multimodal report,
 * bioindicators, quality scores, and FHIR resource of any validated observation.
 */
export default function ResearcherObservationPage() {
  const params = useParams()
  const router = useRouter()
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
      setError(null)
    } catch (err: any) {
      setError(err?.message || "Failed to load observation details.")
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
      <div className="rounded-cozy-lg border border-danger-500/20 bg-danger-50 p-8 text-center space-y-3">
        <AlertTriangle className="mx-auto h-8 w-8 text-danger-500" />
        <h3 className="font-display text-base font-semibold text-danger-800">
          Observation Not Found
        </h3>
        <p className="text-sm text-danger-700 max-w-md mx-auto">
          {error || "The requested observation could not be retrieved from the research registry."}
        </p>
        <Link
          href="/researcher/validated"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-stream-700 hover:text-stream-800 hover:underline pt-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Validated Data
        </Link>
      </div>
    )
  }

  const obs = detail.observation
  const isValidated =
    obs.status === "auto_validated" || obs.status === "expert_validated"

  return (
    <div className="space-y-6">
      {/* Researcher Navigation Header */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-4"
      >
        <div className="flex items-center gap-3">
          <Link
            href="/researcher/validated"
            className="inline-flex items-center gap-1.5 rounded-cozy border border-stone-200 bg-surface px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-cozy-sm hover:bg-stone-50 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Validated Data
          </Link>
          <div className="h-4 w-px bg-stone-200" />
          <div>
            <span className="font-mono text-xs text-stone-400">
              ID: {obs.id.slice(0, 8)}...
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isValidated ? (
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              {obs.status === "auto_validated" ? "Auto-Validated Bioindicator Record" : "Expert-Validated Research Record"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
              Status: {obs.status.replace(/_/g, " ")}
            </span>
          )}
        </div>
      </motion.div>

      {/* Complete Multimodal Ecological Report */}
      <DetailedReport
        detail={detail}
        onDelete={() => router.push("/researcher/validated")}
      />
    </div>
  )
}
