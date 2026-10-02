"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Sparkles, HeartPulse, Camera, ClipboardList, CheckCircle2 } from "lucide-react"
import { DipteraCastCard, derivePrediction } from "@/components/shared/dipteracast-card"
import type { Observation } from "@/types"

/**
 * Impact receipt — ecological narrative + health connection.
 *
 * DOC-09 Lines 474–492
 * Entrance: scale + fade reveal
 */
export function ImpactReceipt({
  observation,
}: {
  observation: Observation
}) {
  const isValidated =
    observation.status === "auto_validated" ||
    observation.status === "expert_validated"

  const vectorPrediction = derivePrediction(
    observation.top_species,
  )

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-4"
    >
      {/* Validation Status Banner */}
      {isValidated && (
        <div className="flex items-center gap-2 rounded-cozy bg-success-50 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 text-success-600" />
          <p className="text-sm font-semibold text-success-700">
            Observation Validated
          </p>
        </div>
      )}

      {/* Impact Text */}
      {observation.impact_text && (
        <div className="rounded-cozy-xl border border-amber-100 bg-amber-50/40 p-6 shadow-cozy-sm">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-amber-600" />
            <h3 className="font-display text-lg text-amber-900">
              Your Impact
            </h3>
          </div>
          <p className="text-sm text-stone-700 leading-relaxed">
            {observation.impact_text}
          </p>
        </div>
      )}

      {/* Impact Headline */}
      {observation.impact_headline && (
        <div className="rounded-cozy border border-stone-100 bg-surface px-5 py-4 shadow-cozy-sm">
          <div className="flex items-center gap-2 mb-2">
            <HeartPulse className="h-5 w-5 text-stream-500" />
            <h4 className="text-sm font-semibold text-stone-800">
              Health Connection
            </h4>
          </div>
          <p className="text-sm text-stone-600 leading-relaxed">
            {observation.impact_headline}
          </p>
        </div>
      )}

      {/* DipteraCAST Vector Forecast */}
      {vectorPrediction && (
        <DipteraCastCard prediction={vectorPrediction} />
      )}

      {/* Footer — Quality + FHIR */}
      <div className="flex items-center justify-between rounded-cozy bg-stone-50 px-4 py-3">
        {observation.confidence_score !== null && (
          <span className="text-xs text-stone-500">
            Quality Score:{" "}
            <span className="font-mono font-semibold text-stone-700">
              {observation.confidence_score}/100
            </span>
          </span>
        )}
        {isValidated && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-success-600">
            <CheckCircle2 className="h-3 w-3" />
            FHIR: Posted
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          href="/volunteer/submit"
          className="flex flex-1 items-center justify-center gap-2 rounded-cozy border border-stone-200 bg-surface px-4 py-2.5 text-sm font-medium text-stone-700 shadow-cozy-sm transition-all hover:bg-surface-hover hover:shadow-cozy"
        >
          <Camera className="h-4 w-4" />
          Submit Another
        </Link>
        <Link
          href="/volunteer/history"
          className="flex flex-1 items-center justify-center gap-2 rounded-cozy bg-stream-500 px-4 py-2.5 text-sm font-medium text-white shadow-cozy-sm transition-all hover:bg-stream-600 hover:shadow-cozy hover:-translate-y-0.5"
        >
          <ClipboardList className="h-4 w-4" />
          View History
        </Link>
      </div>
    </motion.div>
  )
}
