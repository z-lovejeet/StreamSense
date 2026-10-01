"use client"

import { motion } from "framer-motion"
import { ConfidenceGauge } from "@/components/shared/confidence-gauge"
import { SpeciesCard } from "@/components/volunteer/species-card"
import type { Observation, AIResult } from "@/types"

/**
 * AI Feedback card — species identification + environmental parameters.
 *
 * DOC-09 Lines 452–472
 */
export function AIFeedbackCard({
  observation,
  aiResults,
}: {
  observation: Observation
  aiResults: AIResult[]
}) {
  const confidence = observation.top_confidence
    ? Math.round(observation.top_confidence * 100)
    : observation.confidence_score || 0

  // Extract environmental params from description agent result
  const descResult = aiResults.find((r) => r.agent_name === "description")
  const params = (descResult?.result as Record<string, unknown>) || {}

  // Extract quality info
  const qualityResult = aiResults.find((r) => r.agent_name === "quality")
  const qualityData = (qualityResult?.result as Record<string, unknown>) || {}

  // Environmental parameters to display
  const envParams = [
    { label: "Water Color", value: params.water_color },
    { label: "Flow Speed", value: params.flow_speed },
    { label: "Water Clarity", value: params.water_clarity },
    { label: "Odor", value: params.odor },
    { label: "Algae", value: params.algae_presence },
    { label: "Debris", value: params.debris },
  ].filter((p) => p.value && p.value !== "null")

  return (
    <div className="space-y-4">
      {/* Species Identification */}
      {observation.top_species && (
        <SpeciesCard
          species={observation.top_species}
          confidence={confidence}
          qualityData={qualityData}
        />
      )}

      {/* Environmental Observations */}
      {envParams.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="rounded-cozy-lg border border-stone-100 bg-surface p-5 shadow-cozy-sm"
        >
          <h3 className="text-sm font-semibold text-stone-800 mb-3">
            Environmental Observations
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            {envParams.map((param) => (
              <div
                key={param.label}
                className="rounded-cozy bg-stone-50 px-3 py-2"
              >
                <p className="text-[11px] font-medium uppercase tracking-wide text-stone-400">
                  {param.label}
                </p>
                <p className="text-sm font-medium text-stone-700 capitalize mt-0.5">
                  {String(param.value).replace(/_/g, " ")}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quality Score */}
      {observation.confidence_score !== null && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="rounded-cozy-lg border border-stone-100 bg-surface p-5 shadow-cozy-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-stone-800">
              Quality Score
            </h3>
            <span className="font-mono text-lg font-bold text-stream-600">
              {observation.confidence_score}/100
            </span>
          </div>
          <ConfidenceGauge value={observation.confidence_score} />
          {typeof qualityData.reasoning === "string" && (
            <p className="mt-2.5 text-xs text-stone-500 leading-relaxed">
              {qualityData.reasoning}
            </p>
          )}
        </motion.div>
      )}
    </div>
  )
}
