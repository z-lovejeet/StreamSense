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
} from "lucide-react"
import { api } from "@/lib/api"
import { ConfidenceGauge } from "@/components/shared/confidence-gauge"
import { toast } from "sonner"
import type { ObservationDetail, ReviewCreate } from "@/types"

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
  const [showZoom, setShowZoom] = useState(false)
  const reviewStartRef = useRef(Date.now())

  // Extract AI analysis data
  const expertBrief = detail.ai_results.find(
    (r) => r.agent_name === "expert_brief",
  )
  const briefData = (expertBrief?.result || {}) as Record<string, unknown>
  const concerns = (briefData.concerns || []) as Array<{
    type: string
    detail: string
    severity: string
  }>
  const recommendation = (briefData.recommended_action as string) || "—"

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

  const confidence = obs.top_confidence
    ? Math.round(obs.top_confidence * 100)
    : obs.confidence_score || 0

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

        {/* RIGHT — AI Analysis */}
        <div className="space-y-4">
          {/* AI Analysis Summary */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-cozy-lg border border-stone-100 bg-surface p-5 shadow-cozy-sm space-y-3"
          >
            <h3 className="text-sm font-semibold text-stone-800">
              AI Analysis Summary
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Species</span>
                <span className="font-medium text-stone-800">
                  {obs.top_species || "Unidentified"}
                </span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-stone-500">Confidence</span>
                <div className="w-32">
                  <ConfidenceGauge value={confidence} size="sm" />
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Quality Score</span>
                <span className="font-mono font-bold text-stone-800">
                  {obs.confidence_score ?? "—"}/100
                </span>
              </div>
            </div>

            {/* Concerns */}
            {concerns.length > 0 && (
              <div className="rounded-cozy border border-amber-200 bg-amber-50/50 p-3 mt-2">
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                  <span className="text-xs font-semibold text-amber-700">
                    Concerns
                  </span>
                </div>
                <ul className="space-y-1">
                  {concerns.map((c, i) => (
                    <li key={i} className="text-xs text-stone-600 flex gap-1.5">
                      <span className="text-stone-400">•</span>
                      {c.detail}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-between text-xs pt-1 border-t border-stone-100">
              <span className="text-stone-400">Recommendation</span>
              <span className="font-mono font-medium text-stone-600">
                {recommendation.replace(/_/g, " ")}
              </span>
            </div>
          </motion.div>

          {/* Extracted Parameters */}
          {envEntries.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-cozy-lg border border-stone-100 bg-surface p-5 shadow-cozy-sm"
            >
              <h3 className="text-sm font-semibold text-stone-800 mb-3">
                Extracted Parameters
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {envEntries.map((param) => (
                  <div
                    key={param.label}
                    className="rounded-cozy bg-stone-50 px-3 py-2"
                  >
                    <p className="text-[10px] font-medium uppercase tracking-wide text-stone-400">
                      {param.label}
                    </p>
                    <p className="text-sm font-medium text-stone-700 capitalize">
                      {String(param.value).replace(/_/g, " ")}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex flex-wrap gap-3"
      >
        <button
          onClick={() => submitAction({ action: "confirm" })}
          disabled={submitting}
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
          disabled={submitting}
          className="flex items-center gap-2 rounded-cozy border border-stone-300 bg-surface px-5 py-2.5 text-sm font-medium text-stone-700 shadow-cozy-sm transition-all hover:bg-surface-hover hover:shadow-cozy disabled:opacity-50"
        >
          <Pencil className="h-4 w-4" />
          Correct
        </button>

        <button
          onClick={() => setShowRejectModal(true)}
          disabled={submitting}
          className="flex items-center gap-2 rounded-cozy bg-danger-500 px-6 py-2.5 text-sm font-medium text-white shadow-cozy-sm transition-all hover:bg-danger-700 hover:shadow-cozy hover:-translate-y-0.5 disabled:opacity-50"
        >
          <XCircle className="h-4 w-4" />
          Reject
        </button>
      </motion.div>

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
