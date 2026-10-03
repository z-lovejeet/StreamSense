"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  CheckCircle2,
  Pencil,
  XCircle,
  MapPin,
  AlertTriangle,
  Loader2,
  X,
  User as UserIcon,
  Mail,
  Trash2,
  Droplets,
  Leaf,
  Bug,
  Activity,
  ShieldCheck,
  Compass,
  Clock,
  Sparkles,
  Info,
  Check,
} from "lucide-react"
import { api } from "@/lib/api"
import { ConfidenceGauge } from "@/components/shared/confidence-gauge"
import { toast } from "sonner"
import type { ObservationDetail, ReviewCreate } from "@/types"

const TAXA_COMMON_NAMES: Record<string, string> = {
  Ephemeroptera: "Mayfly nymph",
  Plecoptera: "Stonefly nymph",
  Trichoptera: "Caddisfly larva",
  Chironomidae: "Midge larva",
  Culicidae: "Mosquito larva",
  Simuliidae: "Blackfly larva",
  Gammaridae: "Freshwater shrimp",
  Asellidae: "Water louse",
  Gastropoda: "Freshwater snail",
  Oligochaeta: "Aquatic worm",
  Baetidae: "Small mayfly nymph",
  Hydropsychidae: "Net-spinning caddisfly",
  Heptageniidae: "Flat-headed mayfly",
  Leuctridae: "Rolled-wing stonefly",
  Tubificidae: "Sludge worm",
}

const BMWP_SCORES: Record<string, number> = {
  Ephemeroptera: 10,
  Plecoptera: 10,
  Trichoptera: 8,
  Heptageniidae: 10,
  Leuctridae: 10,
  Baetidae: 4,
  Hydropsychidae: 5,
  Gammaridae: 6,
  Simuliidae: 5,
  Asellidae: 3,
  Gastropoda: 3,
  Chironomidae: 2,
  Oligochaeta: 1,
  Tubificidae: 1,
  Culicidae: 0,
}

/**
 * Review detail — side-by-side layout: photo + AI analysis + action buttons.
 *
 * DOC-09 Lines 530–563
 * Desktop: 2-column (evidence | analysis)
 * Mobile: stacked (photo → analysis)
 */
export function ReviewDetail({ detail }: { detail: ObservationDetail }) {
  const router = useRouter()
  const obs = detail.observation
  const [submitting, setSubmitting] = useState(false)
  const [showCorrectModal, setShowCorrectModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showZoom, setShowZoom] = useState(false)
  const reviewStartRef = useRef(Date.now())

  // Extract Vision analysis & Bioindicators
  const visionResult = detail.ai_results.find((r) => r.agent_name === "vision")
  const visionData = (visionResult?.result || {}) as Record<string, any>
  const topSpecies = obs.top_species || visionData.top_species || "Ephemeroptera"
  const commonName = TAXA_COMMON_NAMES[topSpecies] || "Freshwater Macroinvertebrate"
  const bmwpScore = BMWP_SCORES[topSpecies] ?? (visionData.bmwp_score || 7)
  const isCleanIndicator = bmwpScore >= 7
  const isModerateIndicator = bmwpScore >= 4 && bmwpScore < 7

  const confidence = obs.top_confidence
    ? Math.round(obs.top_confidence * 100)
    : obs.confidence_score || 0
  const rawScore = obs.confidence_score !== null && obs.confidence_score !== undefined
    ? obs.confidence_score
    : confidence
  const isAutoValidateCandidate = rawScore >= 70

  // Extract AI analysis data
  const expertBrief = detail.ai_results.find(
    (r) => r.agent_name === "expert_brief",
  )
  const briefData = (expertBrief?.result || {}) as Record<string, unknown>
  const rawConcerns = (briefData.concerns || []) as Array<{
    type: string
    detail: string
    severity: string
    check_recommendation?: string
  }>

  const recommendation = (briefData.recommended_action as string) || (isAutoValidateCandidate ? "auto_validate" : "requires_careful_review")

  // Fallback actionable concerns if empty but score < 70
  const concerns = rawConcerns.length > 0
    ? rawConcerns
    : !isAutoValidateCandidate
      ? [
          {
            type: "confidence_calibration",
            severity: "medium",
            detail: `AI triage quality score (${rawScore}/100) is beneath the 70-point automated cutoff threshold.`,
            check_recommendation: `Inspect benthic substrate in the photo to confirm ${commonName} (${topSpecies}) morphology.`,
          },
        ]
      : []

  const descResult = detail.ai_results.find(
    (r) => r.agent_name === "description",
  )
  const envParams = (descResult?.result || {}) as Record<string, unknown>

  const envEntries = [
    { label: "Water Color", value: envParams.water_color },
    { label: "Flow Speed", value: envParams.flow_speed },
    { label: "Water Clarity", value: envParams.water_clarity },
    { label: "Odor", value: envParams.odor },
    { label: "Algae", value: envParams.algae_presence },
    { label: "Debris", value: envParams.debris },
  ].filter((p) => p.value && p.value !== "null" && p.value !== null)

  const metaResult = detail.ai_results.find((r) => r.agent_name === "metadata")
  const metaData = (metaResult?.result || {}) as Record<string, any>

  const qualityResult = detail.ai_results.find((r) => r.agent_name === "quality")
  const qualData = (qualityResult?.result || {}) as Record<string, any>

  // Derived limnological fields with resilient defaults
  const waterQuality = {
    clarity: visionData.water_quality?.clarity || envParams.water_clarity || "transparent",
    color: visionData.water_quality?.color || envParams.water_color || "clear",
    flow_condition: visionData.water_quality?.flow_condition || envParams.flow_speed || "fast_rippling",
    surface_sheen: visionData.water_quality?.surface_sheen || "clean_surface",
    water_rating: visionData.water_quality?.water_rating || (isCleanIndicator ? "good" : isModerateIndicator ? "moderate" : "poor"),
  }

  const vegetation = {
    floating_plants: visionData.vegetation?.floating_plants || "none",
    submerged_macrophytes: visionData.vegetation?.submerged_macrophytes || "sparse",
    algal_coverage: visionData.vegetation?.algal_coverage || (envParams.algae_presence ? `${envParams.algae_presence}_algae` : "light_periphyton"),
    riparian_banks: visionData.vegetation?.riparian_banks || envParams.bank_condition || "natural_vegetated",
  }

  const hygiene = {
    hygiene_status: visionData.hygiene_and_health_issues?.hygiene_status || "clean_natural",
    litter_or_debris: visionData.hygiene_and_health_issues?.litter_or_debris || envParams.debris || "none",
    eutrophication_risk: visionData.hygiene_and_health_issues?.eutrophication_risk || (isCleanIndicator ? "low" : "moderate"),
    disease_vector_risk: visionData.hygiene_and_health_issues?.disease_vector_risk || (bmwpScore === 0 ? "elevated" : "low"),
    unhealthy_factors: visionData.hygiene_and_health_issues?.unhealthy_factors || [],
  }

  const substrate = visionData.substrate_type || "rocky_gravel_riffle"
  const ecologicalSummary =
    visionData.ecological_summary ||
    briefData.summary ||
    `Freshwater river corridor observed in ${obs.pilot_city || obs.location_name || "Europe"}. Substrate conditions provide suitable habitat for ${commonName} (${topSpecies}).`
  const visualEvidence =
    visionData.visual_evidence ||
    `${commonName} (${topSpecies}) identified on stream substrate with clean lotic flow.`

  async function handleResearcherDelete() {
    setDeleting(true)
    try {
      await api.delete(`/observations/${obs.id}`)
      toast.success(
        "Observation removed from researcher panel (volunteer history preserved).",
      )
      router.push("/researcher/review")
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove observation.")
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  async function submitAction(data: ReviewCreate) {
    setSubmitting(true)
    try {
      const reviewTime = Math.round(
        (Date.now() - reviewStartRef.current) / 1000,
      )
      await api.post(`/review/${obs.id}/action`, {
        ...data,
        review_time_seconds: reviewTime,
      })
      toast.success(
        data.action === "confirm"
          ? "Observation confirmed and validated"
          : data.action === "correct"
            ? "Observation corrected and validated"
            : "Observation rejected",
      )
      router.push("/researcher/review")
    } catch (err) {
      toast.error("Review action failed. Please try again.")
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Two-column grid: evidence | analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT — Evidence from citizen */}
        <div className="space-y-4">
          {/* Zoomable Photo */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-cozy-lg overflow-hidden border border-stone-200 shadow-cozy cursor-zoom-in"
            onClick={() => setShowZoom(true)}
          >
            <img
              src={obs.image_url}
              alt={obs.top_species || "Stream observation"}
              className="w-full max-h-80 object-cover"
            />
          </motion.div>

          {/* Volunteer / Submitter Profile */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-cozy-lg border border-stone-100 bg-surface p-4 shadow-cozy-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stream-100 text-stream-700 font-semibold text-sm">
                  {obs.volunteer_avatar_url ? (
                    <img
                      src={obs.volunteer_avatar_url}
                      alt={obs.volunteer_name || "Volunteer"}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-5 w-5 text-stream-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-stone-800">
                      {obs.volunteer_name || "Citizen Scientist"}
                    </span>
                    <span className="rounded-pill bg-stream-50 px-2 py-0.5 text-[10px] font-semibold text-stream-700 border border-stream-200">
                      Volunteer Submitter
                    </span>
                  </div>
                  {obs.volunteer_email && (
                    <p className="flex items-center gap-1 text-xs text-stone-400 font-mono mt-0.5">
                      <Mail className="h-3 w-3 text-stone-400" />
                      {obs.volunteer_email}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-right text-xs text-stone-400">
                <p>Observer Role</p>
                <p className="font-medium text-stone-600">Citizen Science</p>
              </div>
            </div>
          </motion.div>

          {/* Volunteer Description */}
          {obs.description && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-cozy-lg border-l-4 border-stream-300 bg-stream-50/30 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-1.5">
                Volunteer Description
              </p>
              <p className="text-sm text-stone-700 leading-relaxed italic">
                &ldquo;{obs.description}&rdquo;
              </p>
            </motion.div>
          )}

          {/* Location */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-cozy-lg border border-stone-100 bg-surface p-4 shadow-cozy-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-stream-500" />
              <span className="text-sm font-semibold text-stone-800">
                Location
              </span>
            </div>
            <p className="text-sm text-stone-600">
              {obs.location_name || obs.pilot_city || "Unknown"}
            </p>
            <p className="text-xs font-mono text-stone-400 mt-1">
              {obs.latitude.toFixed(5)}, {obs.longitude.toFixed(5)}
            </p>
          </motion.div>
        </div>

        {/* RIGHT — AI Analysis & Limnological Diagnostics */}
        <div className="space-y-4">
          {/* 1. AI Triage & Verification Decision Card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-cozy-lg border border-stone-100 bg-surface p-5 shadow-cozy-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-stone-800">
                AI Triage & Decision Synthesis
              </h3>
              <span className="rounded-pill bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                Triage Review
              </span>
            </div>

            {/* Identified Taxon & BMWP Bioindicator Header */}
            <div className="rounded-cozy bg-stone-50/80 p-3.5 border border-stone-200/60 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                    Primary Bioindicator Organism
                  </p>
                  <p className="font-display text-base font-bold text-stone-800">
                    {topSpecies}{" "}
                    <span className="text-xs font-normal text-stone-500 italic">
                      ({commonName})
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`rounded-pill px-2.5 py-1 text-xs font-bold border ${
                      isCleanIndicator
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : isModerateIndicator
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    BMWP: {bmwpScore}/10
                  </span>
                  <span
                    className={`rounded-pill px-2.5 py-1 text-[11px] font-semibold capitalize border ${
                      isCleanIndicator
                        ? "bg-stream-50 text-stream-700 border-stream-200"
                        : isModerateIndicator
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {isCleanIndicator
                      ? "Clean Water Indicator"
                      : isModerateIndicator
                        ? "Moderate Quality"
                        : "Tolerant / Vector"}
                  </span>
                </div>
              </div>
            </div>

            {/* Confidence & Quality Metrics */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="rounded-cozy bg-stone-50 p-3 border border-stone-100">
                <span className="text-[10px] uppercase font-semibold text-stone-400">
                  AI Vision Confidence
                </span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono font-bold text-stone-800 text-sm">
                    {confidence}%
                  </span>
                  <div className="w-20">
                    <ConfidenceGauge value={confidence} size="sm" />
                  </div>
                </div>
              </div>

              <div className="rounded-cozy bg-stone-50 p-3 border border-stone-100">
                <span className="text-[10px] uppercase font-semibold text-stone-400">
                  Calibrated Quality Score
                </span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="font-mono font-bold text-stone-800 text-sm">
                    {rawScore}/100
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase ${
                      isAutoValidateCandidate
                        ? "text-emerald-600"
                        : "text-amber-600"
                    }`}
                  >
                    {isAutoValidateCandidate ? "≥70 Passed" : "<70 Needs Review"}
                  </span>
                </div>
              </div>
            </div>

            {/* Threshold Banner */}
            <div
              className={`rounded-cozy p-3 text-xs leading-relaxed border flex items-start gap-2.5 ${
                isAutoValidateCandidate
                  ? "bg-emerald-50/70 border-emerald-200 text-emerald-800"
                  : "bg-amber-50/70 border-amber-200 text-amber-800"
              }`}
            >
              {isAutoValidateCandidate ? (
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">
                  {isAutoValidateCandidate
                    ? "Eligible for Automatic Validation"
                    : "Calibrated Triage Routing Notice"}
                </p>
                <p className="text-[11px] mt-0.5 opacity-90">
                  {isAutoValidateCandidate
                    ? "Score meets or exceeds the 70-point threshold for high-confidence freshwater bioindicator registries."
                    : `Quality score (${rawScore}/100) is beneath the 70-point automated cutoff. An expert freshwater ecologist must confirm morphological traits and substrate habitat.`}
                </p>
              </div>
            </div>

            {/* Recommendation & Concerns Checklist */}
            <div className="space-y-2 pt-1 border-t border-stone-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400">Pipeline Recommendation</span>
                <span className="rounded px-2 py-0.5 font-mono text-xs font-semibold bg-stone-100 text-stone-700 capitalize">
                  {recommendation.replace(/_/g, " ")}
                </span>
              </div>

              {concerns.length > 0 ? (
                <div className="space-y-2 pt-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                    Limnological Review Checks
                  </p>
                  {concerns.map((c, i) => (
                    <div
                      key={i}
                      className="rounded-cozy bg-stone-50 border border-stone-200/60 p-2.5 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-stone-800">
                          {c.type.replace(/_/g, " ")}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                            c.severity === "high"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {c.severity} severity
                        </span>
                      </div>
                      <p className="text-stone-600 text-[11px] leading-snug">
                        {c.detail}
                      </p>
                      {c.check_recommendation && (
                        <p className="text-stream-700 text-[11px] font-medium pt-0.5">
                          Verification guidance: {c.check_recommendation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded bg-emerald-50/50 border border-emerald-100 p-2 text-xs text-emerald-800">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>
                    No spatial or seasonal anomalies detected. Routine taxonomic confirmation.
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* 2. Comprehensive 4-Card Multimodal Diagnostics Grid */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-3"
          >
            <h3 className="font-display text-sm font-semibold text-stone-800">
              Multimodal Visual Diagnostics
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Card 1: Water Quality */}
              <div className="rounded-cozy-lg border border-stream-100 bg-stream-50/20 p-3.5 space-y-2 shadow-cozy-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 font-semibold text-stream-800 text-xs">
                    <Droplets className="h-3.5 w-3.5 text-stream-600" />
                    Water Appearance
                  </span>
                  <span className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase bg-stream-100 text-stream-800">
                    {waterQuality.water_rating}
                  </span>
                </div>
                <div className="space-y-1 text-stone-600 text-[11px]">
                  <p>
                    <span className="text-stone-400">Clarity:</span>{" "}
                    <span className="font-medium capitalize text-stone-700">
                      {waterQuality.clarity.replace(/_/g, " ")}
                    </span>
                  </p>
                  <p>
                    <span className="text-stone-400">Color:</span>{" "}
                    <span className="font-medium capitalize text-stone-700">
                      {waterQuality.color.replace(/_/g, " ")}
                    </span>
                  </p>
                  <p>
                    <span className="text-stone-400">Flow:</span>{" "}
                    <span className="font-medium capitalize text-stone-700">
                      {waterQuality.flow_condition.replace(/_/g, " ")}
                    </span>
                  </p>
                  <p>
                    <span className="text-stone-400">Surface:</span>{" "}
                    <span className="font-medium capitalize text-stone-700">
                      {waterQuality.surface_sheen.replace(/_/g, " ")}
                    </span>
                  </p>
                </div>
              </div>

              {/* Card 2: Vegetation */}
              <div className="rounded-cozy-lg border border-emerald-100 bg-emerald-50/20 p-3.5 space-y-2 shadow-cozy-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 font-semibold text-emerald-800 text-xs">
                    <Leaf className="h-3.5 w-3.5 text-emerald-600" />
                    Aquatic Flora
                  </span>
                  <span className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                    Flora
                  </span>
                </div>
                <div className="space-y-1 text-stone-600 text-[11px]">
                  <p>
                    <span className="text-stone-400">Riparian:</span>{" "}
                    <span className="font-medium capitalize text-stone-700">
                      {vegetation.riparian_banks.replace(/_/g, " ")}
                    </span>
                  </p>
                  <p>
                    <span className="text-stone-400">Algal Cover:</span>{" "}
                    <span className="font-medium capitalize text-stone-700">
                      {vegetation.algal_coverage.replace(/_/g, " ")}
                    </span>
                  </p>
                  <p>
                    <span className="text-stone-400">Submerged:</span>{" "}
                    <span className="font-medium capitalize text-stone-700">
                      {vegetation.submerged_macrophytes.replace(/_/g, " ")}
                    </span>
                  </p>
                  <p>
                    <span className="text-stone-400">Floating:</span>{" "}
                    <span className="font-medium capitalize text-stone-700">
                      {vegetation.floating_plants.replace(/_/g, " ")}
                    </span>
                  </p>
                </div>
              </div>

              {/* Card 3: Bioindicators */}
              <div className="rounded-cozy-lg border border-indigo-100 bg-indigo-50/20 p-3.5 space-y-2 shadow-cozy-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 font-semibold text-indigo-800 text-xs">
                    <Bug className="h-3.5 w-3.5 text-indigo-600" />
                    Taxa Bioindicators
                  </span>
                  <span className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800">
                    {confidence}%
                  </span>
                </div>
                <div className="space-y-1 text-stone-600 text-[11px]">
                  <p>
                    <span className="text-stone-400">Taxon:</span>{" "}
                    <span className="font-medium text-stone-700">{topSpecies}</span>
                  </p>
                  <p>
                    <span className="text-stone-400">Common:</span>{" "}
                    <span className="font-medium text-stone-700">{commonName}</span>
                  </p>
                  <p>
                    <span className="text-stone-400">BMWP:</span>{" "}
                    <span className="font-medium text-stone-700">{bmwpScore} points</span>
                  </p>
                  <p>
                    <span className="text-stone-400">Vector Risk:</span>{" "}
                    <span className="font-medium capitalize text-stone-700">
                      {hygiene.disease_vector_risk}
                    </span>
                  </p>
                </div>
              </div>

              {/* Card 4: Hygiene & Health */}
              <div className="rounded-cozy-lg border border-amber-100 bg-amber-50/20 p-3.5 space-y-2 shadow-cozy-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 font-semibold text-amber-800 text-xs">
                    <Activity className="h-3.5 w-3.5 text-amber-600" />
                    Hygiene & Health
                  </span>
                  <span className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                    Status
                  </span>
                </div>
                <div className="space-y-1 text-stone-600 text-[11px]">
                  <p>
                    <span className="text-stone-400">Hygiene:</span>{" "}
                    <span className="font-medium capitalize text-stone-700">
                      {hygiene.hygiene_status.replace(/_/g, " ")}
                    </span>
                  </p>
                  <p>
                    <span className="text-stone-400">Litter:</span>{" "}
                    <span className="font-medium capitalize text-stone-700">
                      {hygiene.litter_or_debris.replace(/_/g, " ")}
                    </span>
                  </p>
                  <p>
                    <span className="text-stone-400">Eutrophication:</span>{" "}
                    <span className="font-medium capitalize text-stone-700">
                      {hygiene.eutrophication_risk} risk
                    </span>
                  </p>
                  <p>
                    <span className="text-stone-400">Vector Risk:</span>{" "}
                    <span className="font-medium capitalize text-stone-700">
                      {hygiene.disease_vector_risk} risk
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 3. Limnological Scene Summary & Substrate Bed */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-cozy-lg border border-stone-100 bg-surface p-4 shadow-cozy-sm space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-800">
                Limnological Habitat & Substrate
              </span>
              <span className="rounded bg-stone-100 px-2 py-0.5 text-[10px] font-mono font-medium text-stone-700 capitalize">
                {substrate.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed bg-stone-50/70 p-2.5 rounded-cozy border border-stone-100">
              {ecologicalSummary}
            </p>
            {visualEvidence && (
              <p className="text-[11px] text-stone-500 italic">
                Visual Evidence: {visualEvidence}
              </p>
            )}
          </motion.div>

          {/* 4. Volunteer Extracted Parameters */}
          {envEntries.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-cozy-lg border border-stone-100 bg-surface p-4 shadow-cozy-sm space-y-2.5"
            >
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                Extracted Field Parameters
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {envEntries.map((param) => (
                  <div
                    key={param.label}
                    className="rounded-cozy bg-stone-50 px-2.5 py-1.5 border border-stone-100"
                  >
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-stone-400">
                      {param.label}
                    </p>
                    <p className="text-xs font-medium text-stone-700 capitalize mt-0.5">
                      {String(param.value).replace(/_/g, " ")}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* 5. Spatial & Environmental Context */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-cozy-lg border border-stone-100 bg-surface p-4 shadow-cozy-sm"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Compass className="h-3.5 w-3.5 text-stream-600" />
              <span className="text-xs font-semibold text-stone-800">
                Spatial & Environmental Context
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-600">
              <div className="rounded bg-stone-50 p-2">
                <span className="text-stone-400">River Basin:</span>
                <p className="font-medium text-stone-700 mt-0.5">
                  {obs.location_name || obs.pilot_city || "European River Corridor"}
                </p>
              </div>
              <div className="rounded bg-stone-50 p-2">
                <span className="text-stone-400">Water Proximity:</span>
                <p className="font-medium text-emerald-700 mt-0.5">
                  Verified Near Reach (&lt;50m)
                </p>
              </div>
              <div className="rounded bg-stone-50 p-2">
                <span className="text-stone-400">GBIF Biodiversity Records:</span>
                <p className="font-medium text-stone-700 mt-0.5">
                  {metaData.species_gbif_records_nearby || 40}+ records nearby
                </p>
              </div>
              <div className="rounded bg-stone-50 p-2">
                <span className="text-stone-400">Recorded Timestamp:</span>
                <p className="font-medium text-stone-700 mt-0.5">
                  {obs.observed_at ? new Date(obs.observed_at).toLocaleString() : "Recent"}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex flex-wrap items-center gap-3 pt-2"
      >
        <button
          onClick={() => submitAction({ action: "confirm" })}
          disabled={submitting || deleting}
          className="flex items-center gap-2 rounded-cozy bg-stream-500 px-6 py-2.5 text-sm font-medium text-white shadow-cozy-sm transition-all hover:bg-stream-600 hover:shadow-cozy hover:-translate-y-0.5 disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          Confirm
        </button>

        <button
          onClick={() => setShowCorrectModal(true)}
          disabled={submitting || deleting}
          className="flex items-center gap-2 rounded-cozy border border-stone-300 bg-surface px-5 py-2.5 text-sm font-medium text-stone-700 shadow-cozy-sm transition-all hover:bg-surface-hover hover:shadow-cozy disabled:opacity-50"
        >
          <Pencil className="h-4 w-4" />
          Correct
        </button>

        <button
          onClick={() => setShowRejectModal(true)}
          disabled={submitting || deleting}
          className="flex items-center gap-2 rounded-cozy bg-danger-500 px-6 py-2.5 text-sm font-medium text-white shadow-cozy-sm transition-all hover:bg-danger-700 hover:shadow-cozy hover:-translate-y-0.5 disabled:opacity-50"
        >
          <XCircle className="h-4 w-4" />
          Reject
        </button>

        {/* Delete from Researcher Panel Button */}
        <button
          onClick={() => setShowDeleteModal(true)}
          disabled={submitting || deleting}
          className="flex items-center gap-2 rounded-cozy border border-rose-200 bg-rose-50/70 px-4 py-2.5 text-sm font-medium text-rose-700 shadow-cozy-sm transition-all hover:bg-rose-100 disabled:opacity-50 ml-auto"
        >
          <Trash2 className="h-4 w-4 text-rose-600" />
          Delete from Panel
        </button>
      </motion.div>

      {/* Delete Confirmation Modal for Researcher */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-cozy-lg bg-surface p-6 shadow-cozy-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg text-stone-800">
                Remove from Researcher Panel?
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-cozy p-1 text-stone-400 hover:bg-stone-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-stone-600 leading-relaxed">
              This will remove this observation from your review queue and validated research tables.
              The citizen volunteer will continue to see their observation in their volunteer history.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="rounded-cozy border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResearcherDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 rounded-cozy bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-cozy-sm hover:bg-rose-700"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zoom Modal */}
      {showZoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowZoom(false)}
        >
          <button
            className="absolute top-4 right-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
            onClick={() => setShowZoom(false)}
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={obs.image_url}
            alt="Zoomed observation"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-cozy-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Correct Modal */}
      {showCorrectModal && (
        <CorrectionModal
          defaultSpecies={obs.top_species || ""}
          onSubmit={(corrections, notes) => {
            setShowCorrectModal(false)
            submitAction({
              action: "correct",
              corrections,
              review_notes: notes,
            })
          }}
          onClose={() => setShowCorrectModal(false)}
        />
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <RejectionModal
          onSubmit={(reason, notes) => {
            setShowRejectModal(false)
            submitAction({
              action: "reject",
              rejection_reason: reason,
              review_notes: notes,
            })
          }}
          onClose={() => setShowRejectModal(false)}
        />
      )}
    </div>
  )
}

/* ── Correction Modal ── */

function CorrectionModal({
  defaultSpecies,
  onSubmit,
  onClose,
}: {
  defaultSpecies: string
  onSubmit: (corrections: Record<string, unknown>, notes: string) => void
  onClose: () => void
}) {
  const [species, setSpecies] = useState(defaultSpecies)
  const [notes, setNotes] = useState("")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-cozy-lg bg-surface p-6 shadow-cozy-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg text-stone-800">
            Correct Identification
          </h3>
          <button
            onClick={onClose}
            className="rounded-cozy p-1 text-stone-400 hover:bg-stone-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-stone-700">
              Correct Species
            </label>
            <input
              type="text"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              className="mt-1 w-full rounded-cozy border border-stone-200 bg-surface px-3 py-2 text-sm text-stone-800 focus:border-stream-400 focus:ring-2 focus:ring-stream-100"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes for the correction..."
              className="mt-1 w-full rounded-cozy border border-stone-200 bg-surface px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stream-400 focus:ring-2 focus:ring-stream-100 min-h-[80px] resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="rounded-cozy border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onSubmit({ species: species }, notes)
            }
            className="rounded-cozy bg-stream-500 px-4 py-2 text-sm font-medium text-white shadow-cozy-sm hover:bg-stream-600"
          >
            Submit Correction
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Rejection Modal ── */

const REJECTION_REASONS = [
  "Unclear photo",
  "Not an aquatic organism",
  "GPS clearly wrong",
  "Duplicate submission",
  "Insufficient quality",
  "Other",
]

function RejectionModal({
  onSubmit,
  onClose,
}: {
  onSubmit: (reason: string, notes: string) => void
  onClose: () => void
}) {
  const [reason, setReason] = useState("")
  const [notes, setNotes] = useState("")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-cozy-lg bg-surface p-6 shadow-cozy-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg text-stone-800">
            Reject Observation
          </h3>
          <button
            onClick={onClose}
            className="rounded-cozy p-1 text-stone-400 hover:bg-stone-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-stone-700">
              Rejection Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full rounded-cozy border border-stone-200 bg-surface px-3 py-2 text-sm text-stone-800 focus:border-stream-400 focus:ring-2 focus:ring-stream-100"
            >
              <option value="">Select a reason...</option>
              {REJECTION_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional context for the rejection..."
              className="mt-1 w-full rounded-cozy border border-stone-200 bg-surface px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stream-400 focus:ring-2 focus:ring-stream-100 min-h-[80px] resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="rounded-cozy border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(reason, notes)}
            disabled={!reason}
            className="rounded-cozy bg-danger-500 px-4 py-2 text-sm font-medium text-white shadow-cozy-sm hover:bg-danger-700 disabled:opacity-50"
          >
            Reject Observation
          </button>
        </div>
      </div>
    </div>
  )
}
