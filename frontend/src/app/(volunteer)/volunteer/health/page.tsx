"use client"

import { motion } from "framer-motion"
import {
  ShieldCheck,
  Droplets,
  Bug,
  AlertTriangle,
  CheckCircle2,
  Camera,
  FileText,
  MapPin,
  Sparkles,
  HeartPulse,
  Leaf,
  ThermometerSun,
  Wind,
  Eye,
  ArrowUpRight,
} from "lucide-react"
import Link from "next/link"

/**
 * Health & Precautions page for volunteers.
 *
 * Provides field safety guidance, health advisories related to freshwater
 * monitoring, and tips for improving submission acceptance rates.
 */

const HEALTH_ADVISORIES = [
  {
    id: "waterborne",
    title: "Waterborne Pathogen Awareness",
    severity: "high" as const,
    icon: Droplets,
    description: "Urban streams may carry Leptospira, E. coli, and other pathogens. Never swallow stream water and always wash hands after fieldwork.",
    precautions: [
      "Wear waterproof gloves when handling specimens or stream substrate",
      "Use hand sanitizer (60%+ alcohol) after every sampling session",
      "Cover any open cuts or wounds before fieldwork",
      "Do not touch your face, eyes, or mouth during sampling",
    ],
  },
  {
    id: "vectors",
    title: "Disease Vector Exposure",
    severity: "high" as const,
    icon: Bug,
    description: "Mosquitoes (Culicidae) and blackflies (Simuliidae) near streams can transmit diseases. Protect yourself during fieldwork.",
    precautions: [
      "Apply DEET-based insect repellent before visiting stream sites",
      "Wear long sleeves and trousers during dawn/dusk sampling",
      "Avoid standing near stagnant pools — prime mosquito breeding zones",
      "Report any unusual insect swarms in your observation description",
    ],
  },
  {
    id: "terrain",
    title: "Terrain & Slip Hazards",
    severity: "moderate" as const,
    icon: AlertTriangle,
    description: "Stream banks and riverbeds are often slippery. Falls near water can be dangerous, especially when alone.",
    precautions: [
      "Wear sturdy, non-slip footwear with ankle support",
      "Never wade into water deeper than knee height",
      "Tell someone your sampling location and expected return time",
      "Do not sample during flooding, heavy rain, or storms",
    ],
  },
  {
    id: "chemical",
    title: "Chemical & Industrial Runoff",
    severity: "moderate" as const,
    icon: ThermometerSun,
    description: "Urban streams may receive industrial discharge, agricultural runoff, or sewage overflow, especially after rain events.",
    precautions: [
      "If water has an unusual chemical odor, do not touch it — photograph from a safe distance",
      "Report any discolored water (reddish, foamy, or oily sheen) in your description",
      "Avoid sampling downstream of visible outfall pipes",
      "Wash all equipment and clothing after fieldwork",
    ],
  },
]

const ACCEPTANCE_TIPS = [
  {
    id: "photo_quality",
    title: "High-Quality Photo",
    icon: Camera,
    impact: "Critical",
    description: "The AI vision agent analyzes your photo to identify macroinvertebrates. A clear, well-lit, focused image dramatically increases confidence.",
    tips: [
      "Use natural daylight — avoid flash, which creates harsh reflections on wet specimens",
      "Place specimen on a light-colored surface (white paper, light rock) for contrast",
      "Get as close as possible — fill at least 50% of the frame with the organism",
      "Keep the camera steady — use both hands or rest your phone on a surface",
      "Take multiple photos and submit the clearest one",
    ],
  },
  {
    id: "description",
    title: "Detailed Environment Description",
    icon: FileText,
    impact: "High",
    description: "The description agent extracts water quality parameters from your text. More detail means higher confidence and richer reports.",
    tips: [
      "Describe water color (clear, brown, green) and clarity (transparent, cloudy, murky)",
      "Note flow speed (still, slow, moderate, fast) and water level",
      "Mention any odor (none, earthy, chemical, sewage)",
      "Report algae presence and color if visible",
      "Describe bank condition (natural, eroded, concrete, vegetated)",
      "Note weather conditions (sunny, cloudy, rainy) and approximate temperature",
    ],
  },
  {
    id: "location",
    title: "Accurate Location Data",
    icon: MapPin,
    impact: "High",
    description: "The metadata agent validates your GPS coordinates against known water bodies. Accurate location helps verify species plausibility.",
    tips: [
      "Enable GPS on your phone before visiting the site",
      "Use the GPS auto-detect button at the sampling point, not at home",
      "If GPS is inaccurate, manually type the city name, river name, or full address",
      "Select one of the 5 pilot cities (Coimbra, Toulouse, Benevento, Ghent, Oslo) when applicable",
      "Observations near known water bodies score higher in metadata validation",
    ],
  },
  {
    id: "specimen",
    title: "Specimen Identification Clarity",
    icon: Eye,
    impact: "Moderate",
    description: "The AI scores higher confidence when key morphological features are visible in the photo.",
    tips: [
      "For mayflies (Ephemeroptera): show the 3 tail cerci and gill plates along the abdomen",
      "For caddisflies (Trichoptera): include the case/tube if present — it is diagnostic",
      "For stoneflies (Plecoptera): show the 2 tail cerci and thoracic wing pads",
      "For mosquito larvae (Culicidae): capture the siphon tube at the tail end",
      "For midge larvae (Chironomidae): show the red/pink coloration if visible",
      "Include a size reference (coin, ruler, finger) near the specimen",
    ],
  },
  {
    id: "timing",
    title: "Optimal Sampling Timing",
    icon: Wind,
    impact: "Moderate",
    description: "When you sample affects what you find. Different conditions favor different species visibility.",
    tips: [
      "Early morning or late afternoon sampling avoids midday glare for better photos",
      "Sample at least 48 hours after heavy rain — turbidity settles and organisms return",
      "Spring (March-May) and autumn (Sept-Nov) show highest macroinvertebrate diversity",
      "Riffle zones (fast, shallow water over gravel) host the most sensitive EPT taxa",
      "Check under rocks and submerged logs — that is where most organisms hide",
    ],
  },
]

const CONFIDENCE_BREAKDOWN = [
  {
    component: "Vision Agent",
    weight: "40%",
    description: "Species identification confidence from your photo",
    color: "bg-stream-500",
  },
  {
    component: "Metadata Agent",
    weight: "35%",
    description: "GPS, timestamp, and contextual plausibility",
    color: "bg-moss-500",
  },
  {
    component: "Description Agent",
    weight: "25%",
    description: "Environmental parameters from your text description",
    color: "bg-amber-500",
  },
]

export default function HealthPrecautionsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-display text-2xl md:text-3xl text-stone-800 flex items-center gap-3">
          <HeartPulse className="h-7 w-7 text-stream-600" />
          Health & Precautions
        </h1>
        <p className="mt-2 text-sm text-stone-500 max-w-3xl leading-relaxed">
          Field safety guidelines for stream biomonitoring, health advisories for freshwater
          environments, and evidence-based tips to improve your submission acceptance rate.
        </p>
      </motion.div>

      {/* Section 1: Health & Safety Advisories */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-danger-600" />
          <h2 className="font-display text-xl text-stone-800">Field Safety Advisories</h2>
        </div>
        <p className="text-xs text-stone-500 -mt-2">
          Essential health and safety precautions when conducting freshwater biomonitoring fieldwork
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {HEALTH_ADVISORIES.map((advisory) => {
            const Icon = advisory.icon
            return (
              <div
                key={advisory.id}
                className={`rounded-cozy-lg border p-5 shadow-cozy-sm ${
                  advisory.severity === "high"
                    ? "border-danger-200 bg-danger-50/30"
                    : "border-amber-200 bg-amber-50/30"
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-cozy border ${
                      advisory.severity === "high"
                        ? "bg-danger-100 text-danger-700 border-danger-200"
                        : "bg-amber-100 text-amber-700 border-amber-200"
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-stone-800">
                        {advisory.title}
                      </h3>
                      <span
                        className={`rounded-pill px-2 py-0.5 text-[10px] font-bold border ${
                          advisory.severity === "high"
                            ? "bg-danger-100 text-danger-700 border-danger-200"
                            : "bg-amber-100 text-amber-700 border-amber-200"
                        }`}
                      >
                        {advisory.severity === "high" ? "High Risk" : "Moderate Risk"}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      {advisory.description}
                    </p>
                  </div>
                </div>

                <ul className="space-y-1.5 pl-12">
                  {advisory.precautions.map((precaution, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-stone-600">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success-600 mt-0.5 flex-shrink-0" />
                      <span>{precaution}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Section 2: How AI Scores Your Observation */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="rounded-cozy-lg border border-stone-100 bg-surface p-6 shadow-cozy"
      >
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-stream-600" />
          <h2 className="font-display text-xl text-stone-800">How AI Scores Your Observation</h2>
        </div>
        <p className="text-xs text-stone-500 mb-5">
          The quality scoring agent combines three signals to produce your confidence score. Observations scoring 70+ are auto-validated; below 70 goes to expert review.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          {CONFIDENCE_BREAKDOWN.map((item) => (
            <div key={item.component} className="rounded-cozy border border-stone-150 p-4 bg-stone-50/50">
              <div className="flex items-center gap-2 mb-2">
                <div className={`h-3 w-3 rounded-full ${item.color}`} />
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  {item.weight} Weight
                </span>
              </div>
              <h4 className="text-sm font-semibold text-stone-800">{item.component}</h4>
              <p className="text-xs text-stone-500 mt-1">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Score bar visualization */}
        <div className="space-y-1.5">
          <div className="flex text-[10px] font-mono font-semibold text-stone-400">
            <span className="w-[40%]">Vision (40%)</span>
            <span className="w-[35%]">Metadata (35%)</span>
            <span className="w-[25%]">Description (25%)</span>
          </div>
          <div className="h-3 w-full rounded-pill overflow-hidden flex">
            <div className="h-full bg-stream-500" style={{ width: "40%" }} />
            <div className="h-full bg-moss-500" style={{ width: "35%" }} />
            <div className="h-full bg-amber-500" style={{ width: "25%" }} />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-stone-400">
            <span>0</span>
            <span className="text-amber-600 font-bold">70 = Auto-Validate Threshold</span>
            <span>100</span>
          </div>
        </div>
      </motion.div>

      {/* Section 3: Tips to Increase Acceptance */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2">
          <Leaf className="h-5 w-5 text-moss-600" />
          <h2 className="font-display text-xl text-stone-800">
            How to Increase Acceptance Chances
          </h2>
        </div>
        <p className="text-xs text-stone-500 -mt-2">
          Follow these evidence-based tips to maximize your observation confidence score and get more auto-validations
        </p>

        <div className="space-y-4">
          {ACCEPTANCE_TIPS.map((tip, index) => {
            const Icon = tip.icon
            const impactColor =
              tip.impact === "Critical"
                ? "bg-danger-100 text-danger-700 border-danger-200"
                : tip.impact === "High"
                  ? "bg-amber-100 text-amber-700 border-amber-200"
                  : "bg-stone-100 text-stone-600 border-stone-200"

            return (
              <div
                key={tip.id}
                className="rounded-cozy-lg border border-stone-150 bg-surface p-5 shadow-cozy-sm"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-cozy bg-stream-50 text-stream-600 border border-stream-200">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-stone-800">
                        {index + 1}. {tip.title}
                      </h3>
                      <span
                        className={`rounded-pill px-2 py-0.5 text-[10px] font-bold border ${impactColor}`}
                      >
                        {tip.impact} Impact
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      {tip.description}
                    </p>
                  </div>
                </div>

                <ul className="space-y-1.5 pl-12">
                  {tip.tips.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-stone-600">
                      <CheckCircle2 className="h-3.5 w-3.5 text-stream-500 mt-0.5 flex-shrink-0" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="rounded-cozy-lg border border-stream-200 bg-stream-50/50 p-6 shadow-cozy-sm text-center"
      >
        <h3 className="font-display text-lg text-stone-800 mb-2">
          Ready to submit a high-quality observation?
        </h3>
        <p className="text-xs text-stone-500 mb-4 max-w-lg mx-auto">
          Apply these tips during your next field visit. A detailed description, clear photo, and accurate GPS can boost your confidence score by 20-30 points.
        </p>
        <Link
          href="/volunteer/submit"
          className="inline-flex items-center gap-2 rounded-cozy bg-stream-500 px-6 py-3 text-sm font-semibold text-white shadow-cozy-sm transition-all hover:bg-stream-600 hover:shadow-cozy hover:-translate-y-0.5"
        >
          <Camera className="h-4 w-4" />
          Submit New Observation
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </motion.div>
    </div>
  )
}
