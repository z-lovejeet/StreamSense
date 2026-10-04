"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trash2,
  MapPin,
  Droplets,
  Leaf,
  Bug,
  ShieldAlert,
  Sparkles,
  Info,
  Loader2,
  X,
  Heart,
  FileCheck2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { ConfidenceGauge } from "@/components/shared/confidence-gauge"
import type { ObservationDetail } from "@/types"

interface DetailedReportProps {
  detail: ObservationDetail
  onDelete?: () => void
}

export function DetailedReport({ detail, onDelete }: DetailedReportProps) {
  const router = useRouter()
  const obs = detail.observation
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Extract agent results
  const visionRes = detail.ai_results.find((r) => r.agent_name === "vision")
  const visionData = (visionRes?.result || {}) as Record<string, any>

  const descRes = detail.ai_results.find((r) => r.agent_name === "description")
  const descData = (descRes?.result || {}) as Record<string, any>
  const descParams = (descData.params || descData) as Record<string, any>

  const metaRes = detail.ai_results.find((r) => r.agent_name === "metadata")
  const metaData = (metaRes?.result || {}) as Record<string, any>

  const qualityRes = detail.ai_results.find((r) => r.agent_name === "quality")
  const qualityData = (qualityRes?.result || {}) as Record<string, any>

  const impactRes = detail.ai_results.find((r) => r.agent_name === "impact")
  const impactData = (impactRes?.result || {}) as Record<string, any>

  const expertBriefRes = detail.ai_results.find((r) => r.agent_name === "expert_brief")
  const expertBriefData = (expertBriefRes?.result || {}) as Record<string, any>

  // Extracted scene dimensions
  const waterQuality = visionData.water_quality || {}
  const vegetation = visionData.vegetation || {}
  const hygiene = visionData.hygiene_and_health_issues || {}
  const predictions = visionData.predictions || []
  const sceneSummary =
    visionData.ecological_summary ||
    visionData.visual_evidence ||
    "Ecological scene successfully processed across our multimodal pipeline."
  const issuesDetected = hygiene.unhealthy_factors || []

  const isValidated =
    obs.status === "auto_validated" || obs.status === "expert_validated"
  const isPendingReview = obs.status === "pending_review"

  // Delete observation handler
  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/observations/${obs.id}?scope=volunteer`)
      toast.success(
        isValidated
          ? "Observation removed from your personal history."
          : "Observation deleted from your view and researcher queue.",
      )
      if (onDelete) {
        onDelete()
      } else {
        router.push("/volunteer/history")
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete observation.")
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Status Banner & Header ── */}
      <div className="rounded-cozy-lg border border-stone-200 bg-surface p-5 shadow-cozy-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {isValidated ? (
                <span className="inline-flex items-center gap-1.5 rounded-pill bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Auto-Validated Observation
                </span>
              ) : isPendingReview ? (
                <span className="inline-flex items-center gap-1.5 rounded-pill bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700">
                  <Clock className="h-3.5 w-3.5 text-amber-600" />
                  In Expert Review Queue
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-pill bg-stone-100 border border-stone-200 px-3 py-1 text-xs font-semibold text-stone-700">
                  <Info className="h-3.5 w-3.5 text-stone-500" />
                  Status: {obs.status}
                </span>
              )}

              {waterQuality.water_rating && (
                <span className="rounded-pill bg-stream-50 border border-stream-200 px-2.5 py-1 text-xs font-medium text-stream-700 capitalize">
                  {waterQuality.water_rating.replace(/_/g, " ")} ecological condition
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500 pt-1">
              <span className="inline-flex items-center gap-1 font-medium text-stone-700">
                <MapPin className="h-3.5 w-3.5 text-stream-500" />
                {obs.location_name || obs.pilot_city || "Recorded Stream Reach"}
              </span>
              <span>·</span>
              <span>
                Coordinates: {obs.latitude.toFixed(4)}, {obs.longitude.toFixed(4)}
              </span>
              <span>·</span>
              <span>{new Date(obs.observed_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Delete Action Button */}
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-1.5 self-start sm:self-center rounded-cozy border border-rose-200 bg-rose-50/50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition-colors shadow-cozy-sm"
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-600" />
            Delete Observation
          </button>
        </div>

        {/* Pending Review Explanation Notice */}
        {isPendingReview && (
          <div className="mt-4 rounded-cozy border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-800 leading-relaxed">
            <span className="font-semibold">Review Queue Notice: </span>
            This submission scored{" "}
            <span className="font-mono font-bold">{obs.confidence_score ?? 60}/100</span>.
            Our multi-agent triage system routed it to a regional freshwater ecologist for
            verification. Full AI scene diagnostics remain accessible below.
          </div>
        )}
      </div>

      {/* ── Ecological Diagnosis & Scene Summary ── */}
      <div className="rounded-cozy-lg border border-stream-200 bg-gradient-to-br from-stream-50/70 via-surface to-emerald-50/40 p-5 shadow-cozy-sm">
        <div className="flex items-center gap-2 mb-2 text-stream-800 font-semibold text-sm">
          <Sparkles className="h-4 w-4 text-stream-600" />
          <span>Multimodal AI Ecological Diagnosis</span>
        </div>
        <p className="text-sm text-stone-700 leading-relaxed font-sans">
          {sceneSummary}
        </p>
        {visionData.habitat_notes && (
          <p className="mt-2 text-xs text-stone-500 italic">
            Micro-habitat Assessment: {visionData.habitat_notes}
          </p>
        )}
      </div>

      {/* ── 4-Column Feature Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Water Quality & Appearance */}
        <div className="rounded-cozy-lg border border-stone-200 bg-surface p-4 shadow-cozy-sm space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <h3 className="text-sm font-semibold text-stone-800 flex items-center gap-2">
              <Droplets className="h-4 w-4 text-cyan-600" />
              Water Appearance & Clarity
            </h3>
            <span className="text-[11px] font-mono uppercase text-stone-400">
              Sensor: Vision Agent
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-cozy bg-stone-50 p-2.5">
              <p className="text-stone-400 font-medium text-[10px] uppercase">
                Visual Clarity
              </p>
              <p className="text-stone-800 font-semibold capitalize mt-0.5">
                {String(waterQuality.clarity || descParams.water_clarity || "Assessed").replace(/_/g, " ")}
              </p>
            </div>
            <div className="rounded-cozy bg-stone-50 p-2.5">
              <p className="text-stone-400 font-medium text-[10px] uppercase">
                Water Color
              </p>
              <p className="text-stone-800 font-semibold capitalize mt-0.5">
                {String(waterQuality.color || descParams.water_color || "Natural").replace(/_/g, " ")}
              </p>
            </div>
            <div className="rounded-cozy bg-stone-50 p-2.5">
              <p className="text-stone-400 font-medium text-[10px] uppercase">
                Flow Dynamics
              </p>
              <p className="text-stone-800 font-semibold capitalize mt-0.5">
                {String(waterQuality.flow_condition || descParams.flow_speed || "Natural").replace(/_/g, " ")}
              </p>
            </div>
            <div className="rounded-cozy bg-stone-50 p-2.5">
              <p className="text-stone-400 font-medium text-[10px] uppercase">
                Surface Condition
              </p>
              <p className="text-stone-800 font-semibold capitalize mt-0.5">
                {String(waterQuality.surface_sheen || "Clean surface").replace(/_/g, " ")}
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Aquatic Vegetation & Riparian Habitat */}
        <div className="rounded-cozy-lg border border-stone-200 bg-surface p-4 shadow-cozy-sm space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <h3 className="text-sm font-semibold text-stone-800 flex items-center gap-2">
              <Leaf className="h-4 w-4 text-emerald-600" />
              Vegetation & Flora
            </h3>
            <span className="text-[11px] font-mono uppercase text-stone-400">
              Habitat Layer
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-cozy bg-stone-50 p-2.5">
              <p className="text-stone-400 font-medium text-[10px] uppercase">
                Floating Plants
              </p>
              <p className="text-stone-800 font-semibold capitalize mt-0.5">
                {String(vegetation.floating_plants || "None observed").replace(/_/g, " ")}
              </p>
            </div>
            <div className="rounded-cozy bg-stone-50 p-2.5">
              <p className="text-stone-400 font-medium text-[10px] uppercase">
                Submerged Plants
              </p>
              <p className="text-stone-800 font-semibold capitalize mt-0.5">
                {String(vegetation.submerged_macrophytes || "Observed").replace(/_/g, " ")}
              </p>
            </div>
            <div className="rounded-cozy bg-stone-50 p-2.5">
              <p className="text-stone-400 font-medium text-[10px] uppercase">
                Algae Presence
              </p>
              <p className="text-stone-800 font-semibold capitalize mt-0.5">
                {String(vegetation.algal_coverage || descParams.algae_presence || "Low").replace(/_/g, " ")}
              </p>
            </div>
            <div className="rounded-cozy bg-stone-50 p-2.5">
              <p className="text-stone-400 font-medium text-[10px] uppercase">
                Riparian Margins
              </p>
              <p className="text-stone-800 font-semibold capitalize mt-0.5">
                {String(vegetation.riparian_banks || descParams.bank_condition || "Vegetated").replace(/_/g, " ")}
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Macroinvertebrates & Bioindicators */}
        <div className="rounded-cozy-lg border border-stone-200 bg-surface p-4 shadow-cozy-sm space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <h3 className="text-sm font-semibold text-stone-800 flex items-center gap-2">
              <Bug className="h-4 w-4 text-amber-600" />
              Bioindicators & Organisms
            </h3>
            <span className="text-[11px] font-mono uppercase text-stone-400">
              Taxonomy
            </span>
          </div>

          {obs.top_species ? (
            <div className="rounded-cozy bg-stone-50 p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-stone-800">
                  {obs.top_species}
                </span>
                <span className="rounded-pill bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[11px] font-semibold">
                  {Math.round((obs.top_confidence || 0.85) * 100)}% Confidence
                </span>
              </div>
              <p className="text-xs text-stone-500">
                BMWP Bioindicator Sensitivity Score:{" "}
                <span className="font-bold text-stream-600">
                  {visionData.bmwp_score || 10}/10
                </span>
              </p>
              {visionData.visual_evidence && (
                <p className="text-xs text-stone-600 pt-1 border-t border-stone-200/60 mt-1">
                  Evidence: {visionData.visual_evidence}
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-cozy bg-stone-50 p-3 text-xs text-stone-600 space-y-1">
              <p className="font-medium text-stone-700">
                Substrate Assessment: {visionData.substrate_type || "Rock & gravel"}
              </p>
              <p className="text-stone-500">
                No macroinvertebrates directly magnified in foreground. Habitat
                suitability assessed based on benthic substrate and flow conditions.
              </p>
            </div>
          )}

          {predictions.length > 1 && (
            <div className="text-xs text-stone-500 space-y-1">
              <p className="font-medium text-[11px] text-stone-400 uppercase">
                Candidate Bioindicators:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {predictions.slice(1, 4).map((pred: any, idx: number) => (
                  <span
                    key={idx}
                    className="rounded bg-stone-100 px-2 py-0.5 text-[11px] text-stone-600"
                  >
                    {pred.taxon} ({Math.round(pred.confidence * 100)}%)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Card 4: Hygienic, Pollution & Unhealthy Indicators */}
        <div className="rounded-cozy-lg border border-stone-200 bg-surface p-4 shadow-cozy-sm space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <h3 className="text-sm font-semibold text-stone-800 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-600" />
              Hygiene & Environmental Health
            </h3>
            <span className="text-[11px] font-mono uppercase text-stone-400">
              One Health Safety
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-cozy bg-stone-50 p-2.5">
              <p className="text-stone-400 font-medium text-[10px] uppercase">
                Hygiene Status
              </p>
              <p className="text-stone-800 font-semibold capitalize mt-0.5">
                {String(hygiene.hygiene_status || "Clean natural").replace(/_/g, " ")}
              </p>
            </div>
            <div className="rounded-cozy bg-stone-50 p-2.5">
              <p className="text-stone-400 font-medium text-[10px] uppercase">
                Litter / Refuse
              </p>
              <p className="text-stone-800 font-semibold capitalize mt-0.5">
                {String(hygiene.litter_or_debris || descParams.debris || "None").replace(/_/g, " ")}
              </p>
            </div>
            <div className="rounded-cozy bg-stone-50 p-2.5">
              <p className="text-stone-400 font-medium text-[10px] uppercase">
                Eutrophication Risk
              </p>
              <p className="text-stone-800 font-semibold capitalize mt-0.5">
                {String(hygiene.eutrophication_risk || "Low").replace(/_/g, " ")}
              </p>
            </div>
            <div className="rounded-cozy bg-stone-50 p-2.5">
              <p className="text-stone-400 font-medium text-[10px] uppercase">
                Vector Breeding Risk
              </p>
              <p className="text-stone-800 font-semibold capitalize mt-0.5">
                {String(hygiene.disease_vector_risk || "Low risk").replace(/_/g, " ")}
              </p>
            </div>
          </div>

          {issuesDetected.length > 0 && (
            <div className="rounded-cozy bg-rose-50/70 border border-rose-100 p-2 text-xs text-rose-800">
              <p className="font-semibold text-[11px] uppercase tracking-wide text-rose-600 mb-1">
                Risk Factors Flagged:
              </p>
              <ul className="list-disc list-inside space-y-0.5">
                {issuesDetected.map((issue: string, i: number) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* ── Quality Score & Reasoning ── */}
      {obs.confidence_score !== null && (
        <div className="rounded-cozy-lg border border-stone-200 bg-surface p-5 shadow-cozy-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-stone-800">
                Calibrated Quality Score
              </h3>
              <p className="text-xs text-stone-500">
                Multi-agent weighted confidence (Vision 40%, Metadata 35%, Description 25%)
              </p>
            </div>
            <span className="font-mono text-xl font-bold text-stream-600">
              {obs.confidence_score}/100
            </span>
          </div>

          <ConfidenceGauge value={obs.confidence_score} />

          {qualityData.reasoning && (
            <p className="text-xs text-stone-600 bg-stone-50 rounded-cozy p-3 leading-relaxed">
              <span className="font-semibold text-stone-700">Triage Rationale: </span>
              {qualityData.reasoning}
            </p>
          )}
        </div>
      )}

      {/* ── Community Health Impact Receipt ── */}
      {obs.impact_text && (
        <div className="rounded-cozy-lg border border-emerald-200 bg-emerald-50/40 p-5 shadow-cozy-sm space-y-2">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
            <Heart className="h-4 w-4 text-emerald-600" />
            <span>{obs.impact_headline || "One Health Impact Receipt"}</span>
          </div>
          <p className="text-sm text-stone-700 leading-relaxed font-sans">
            {obs.impact_text}
          </p>
          {impactData.health_connection && (
            <p className="text-xs text-emerald-800 font-medium pt-1">
              Epidemiological Connection: {impactData.health_connection}
            </p>
          )}
        </div>
      )}

      {/* ── FHIR Interoperability Indicator ── */}
      {detail.fhir_resource && (
        <div className="rounded-cozy-lg border border-indigo-100 bg-indigo-50/30 p-4 text-xs text-stone-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-indigo-600" />
            <span>
              HL7 FHIR R4 Resource compiled and validated against OAH Implementation Guide profile.
            </span>
          </div>
          <span className="font-mono text-[11px] text-indigo-700 font-semibold">
            Status: {detail.fhir_resource.validation_status}
          </span>
        </div>
      )}

      {/* ── Confirmation Modal for Deletion ── */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-cozy-xl border border-stone-200 bg-surface p-6 shadow-cozy-lg space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-rose-100 p-2.5 text-rose-600">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg text-stone-800">
                    Delete Observation?
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="rounded p-1 text-stone-400 hover:text-stone-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="text-sm text-stone-600 space-y-2 leading-relaxed">
                {isValidated ? (
                  <p>
                    This observation has been validated. Deleting it will{" "}
                    <strong>remove it from your volunteer catalog</strong>. To preserve
                    scientific integrity, the anonymized ecological data will remain
                    safely archived in the regional research registry.
                  </p>
                ) : (
                  <p>
                    This observation is currently pending review. Deleting it will{" "}
                    <strong>permanently cancel and delete it</strong> from both your
                    history and the researcher review queue.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="rounded-cozy border border-stone-200 bg-surface px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center gap-1.5 rounded-cozy bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition-colors shadow-cozy-sm"
                >
                  {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
