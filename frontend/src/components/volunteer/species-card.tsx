"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Bug } from "lucide-react"
import { ConfidenceGauge } from "@/components/shared/confidence-gauge"

// BMWP scores and common names from DOC-05
const TAXA_INFO: Record<
  string,
  { common: string; bmwp: number; quality: string; description: string }
> = {
  Ephemeroptera: {
    common: "Mayfly nymph",
    bmwp: 10,
    quality: "Good",
    description:
      "Mayfly nymphs are highly sensitive to pollution and are one of the most reliable indicators of clean, well-oxygenated water. Their presence suggests excellent ecological conditions. They live in streams for 1-3 years before emerging as adult mayflies for their famous brief winged life.",
  },
  Plecoptera: {
    common: "Stonefly nymph",
    bmwp: 10,
    quality: "Good",
    description:
      "Stonefly nymphs require the cleanest water with high dissolved oxygen levels. They are among the first organisms to disappear when water quality declines, making them a gold-standard bioindicator.",
  },
  Trichoptera: {
    common: "Caddisfly larva",
    bmwp: 8,
    quality: "Good",
    description:
      "Caddisfly larvae are fascinating builders — many construct portable cases from sand, pebbles, or plant material. They need clean, flowing water and are important indicators of good stream health.",
  },
  Chironomidae: {
    common: "Midge larva",
    bmwp: 2,
    quality: "Poor",
    description:
      "Midge larvae (bloodworms) are tolerant of pollution and low oxygen. While their presence isn't necessarily bad, high numbers without other insects suggests degraded water quality.",
  },
  Culicidae: {
    common: "Mosquito larva",
    bmwp: 0,
    quality: "Disease Vector",
    description:
      "Mosquito larvae breed in stagnant water. Their presence is a public health concern as mosquitoes can transmit diseases like malaria and dengue. This data feeds directly into community health monitoring.",
  },
  Simuliidae: {
    common: "Blackfly larva",
    bmwp: 5,
    quality: "Moderate",
    description:
      "Blackfly larvae attach to rocks in flowing water. While they indicate moderate water quality, they are also disease vectors in some regions. Your observation helps track their population.",
  },
  Gammaridae: {
    common: "Freshwater shrimp",
    bmwp: 6,
    quality: "Moderate",
    description:
      "Freshwater shrimp are important recyclers in stream ecosystems, breaking down leaf litter and organic material. They indicate moderate to good water quality.",
  },
  Asellidae: {
    common: "Water louse",
    bmwp: 3,
    quality: "Poor",
    description:
      "Water lice are fairly tolerant of pollution. They feed on decaying organic matter and can survive in water with lower oxygen levels than most stream invertebrates.",
  },
  Gastropoda: {
    common: "Freshwater snail",
    bmwp: 3,
    quality: "Poor",
    description:
      "Freshwater snails are moderately tolerant of pollution. Different species have different tolerances, so their presence alone gives a partial picture of water quality.",
  },
  Oligochaeta: {
    common: "Aquatic worm",
    bmwp: 1,
    quality: "Poor",
    description:
      "Aquatic worms are very tolerant of pollution and low oxygen. Large numbers typically indicate organic enrichment from sewage or agricultural runoff.",
  },
}

const qualityColors: Record<string, string> = {
  Good: "text-success-700 bg-success-50",
  Moderate: "text-amber-700 bg-amber-50",
  Poor: "text-danger-700 bg-danger-50",
  "Disease Vector": "text-danger-700 bg-danger-50",
}

/**
 * Species educational card — expandable accordion with bioindicator info.
 *
 * DOC-09 Lines 452–463, 586
 */
export function SpeciesCard({
  species,
  confidence,
}: {
  species: string
  confidence: number
  qualityData?: Record<string, unknown>
}) {
  const [expanded, setExpanded] = useState(false)

  const info = TAXA_INFO[species] || {
    common: species,
    bmwp: 0,
    quality: "Unknown",
    description: `${species} was identified in your stream observation. This organism serves as a biological indicator of water quality conditions.`,
  }

  const qualityColor = qualityColors[info.quality] || "text-stone-600 bg-stone-50"

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
      className="rounded-cozy-lg border border-stone-100 bg-surface shadow-cozy-sm overflow-hidden"
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="h-10 w-10 rounded-cozy bg-stream-50 flex items-center justify-center flex-shrink-0 text-stream-600">
            <Bug className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-xs uppercase tracking-wider text-stone-400">
              {species}
            </p>
            <p className="font-display text-xl text-stone-900">
              {info.common}
            </p>
          </div>
        </div>

        {/* Confidence */}
        <div className="mb-3">
          <ConfidenceGauge value={confidence} />
        </div>

        {/* Ecological Metrics */}
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <span className="font-mono text-stone-500">
            BMWP Score: <span className="font-semibold text-stone-700">{info.bmwp}</span>
          </span>
          <span className="text-stone-300">·</span>
          <span className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 font-semibold ${qualityColor}`}>
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                info.quality === "Good"
                  ? "bg-emerald-500"
                  : info.quality === "Moderate"
                    ? "bg-amber-500"
                    : info.quality === "Disease Vector"
                      ? "bg-rose-500"
                      : "bg-red-500"
              }`}
            />
            Water Quality: {info.quality}
          </span>
        </div>

        {/* Expand Toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-xs font-medium text-stream-600 hover:text-stream-700 transition-colors"
        >
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </motion.span>
          {expanded ? "Hide details" : "Learn about this species"}
        </button>
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-stone-100 bg-stone-50/50 px-5 py-4">
              <p className="text-sm text-stone-600 leading-relaxed">
                {info.description}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
