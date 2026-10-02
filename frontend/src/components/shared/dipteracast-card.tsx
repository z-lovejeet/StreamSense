"use client"

import { Bug, AlertTriangle, Shield, Thermometer } from "lucide-react"

type RiskLevel = "low" | "moderate" | "high"

interface VectorPrediction {
  riskLevel: RiskLevel
  species: string[]
  riskFactors: string[]
  advisory: string
}

const RISK_CONFIG: Record<RiskLevel, { bg: string; text: string; badge: string; label: string }> = {
  low: {
    bg: "bg-success-50",
    text: "text-success-700",
    badge: "bg-success-100 text-success-700",
    label: "Low Risk",
  },
  moderate: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    badge: "bg-amber-100 text-amber-700",
    label: "Moderate Risk",
  },
  high: {
    bg: "bg-danger-50",
    text: "text-danger-700",
    badge: "bg-danger-100 text-danger-700",
    label: "High Risk",
  },
}

/**
 * Derive a mock DipteraCAST prediction from observation data.
 * In production this would call the DipteraCAST API.
 */
export function derivePrediction(
  topSpecies: string | null | undefined,
): VectorPrediction | null {
  if (!topSpecies) return null

  const lower = topSpecies.toLowerCase()
  const isVector =
    lower.includes("culicid") ||
    lower.includes("mosquito") ||
    lower.includes("simulii") ||
    lower.includes("blackfly")
  const isSensitive =
    lower.includes("ephemerop") ||
    lower.includes("mayfly") ||
    lower.includes("plecop") ||
    lower.includes("stonefly") ||
    lower.includes("trichop") ||
    lower.includes("caddis")

  if (isVector) {
    return {
      riskLevel: "high",
      species: ["Culicidae (Mosquito larvae)", "Simuliidae (Blackfly larvae)"],
      riskFactors: [
        "Disease-vector taxa detected",
        "Stagnant water conditions likely",
        "Elevated nutrient levels",
      ],
      advisory:
        "This observation detected disease-carrying insect larvae. The data helps public health authorities forecast vector-borne disease risk in your area.",
    }
  }

  if (isSensitive) {
    return {
      riskLevel: "low",
      species: ["Culicidae — suppressed by competition"],
      riskFactors: [
        "Clean water indicator species present",
        "Healthy macroinvertebrate diversity",
      ],
      advisory:
        "Clean-water indicator species like these suppress disease-vector populations. Your stream appears healthy — great news for community health!",
    }
  }

  return {
    riskLevel: "moderate",
    species: ["Culicidae (potential)", "Chironomidae (tolerant indicator)"],
    riskFactors: [
      "Moderate-tolerance taxa detected",
      "Water quality may fluctuate",
    ],
    advisory:
      "The observed species suggest moderate water quality. Continued monitoring helps track whether conditions favour disease-vector populations.",
  }
}

/**
 * DipteraCAST prediction card — shows vector risk derived from observation data.
 *
 * DOC-10 Task 6.4: DipteraCAST integration with mock predictions
 */
export function DipteraCastCard({
  prediction,
}: {
  prediction: VectorPrediction
}) {
  const config = RISK_CONFIG[prediction.riskLevel]

  return (
    <div
      className={`rounded-cozy-lg border border-stone-100 ${config.bg} p-5 shadow-cozy-sm`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bug className={`h-4 w-4 ${config.text}`} />
          <h4 className="text-sm font-semibold text-stone-800">
            DipteraCAST Vector Forecast
          </h4>
        </div>
        <span
          className={`rounded-pill px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${config.badge}`}
        >
          {config.label}
        </span>
      </div>

      {/* Advisory */}
      <p className="text-xs leading-relaxed text-stone-600 mb-3">
        {prediction.advisory}
      </p>

      {/* Risk factors */}
      <div className="space-y-1.5">
        {prediction.riskFactors.map((factor, i) => (
          <div key={i} className="flex items-start gap-2">
            {prediction.riskLevel === "high" ? (
              <AlertTriangle className="h-3 w-3 mt-0.5 text-danger-500 flex-shrink-0" />
            ) : prediction.riskLevel === "moderate" ? (
              <Thermometer className="h-3 w-3 mt-0.5 text-amber-500 flex-shrink-0" />
            ) : (
              <Shield className="h-3 w-3 mt-0.5 text-success-500 flex-shrink-0" />
            )}
            <span className="text-[11px] text-stone-500">{factor}</span>
          </div>
        ))}
      </div>

      {/* Attribution */}
      <p className="mt-3 text-[10px] text-stone-400">
        Powered by DipteraCAST · OneAquaHealth Consortium
      </p>
    </div>
  )
}
