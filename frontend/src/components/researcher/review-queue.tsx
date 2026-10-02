"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Camera, User as UserIcon } from "lucide-react"
import { StatusBadge } from "@/components/shared/status-badge"
import { formatDistanceToNow } from "date-fns"
import type { Observation } from "@/types"

/**
 * Review queue card list — thumbnails, scores, flags, species guess.
 *
 * DOC-09 Lines 511–518
 */
export function ReviewQueue({
  observations,
}: {
  observations: Observation[]
}) {
  return (
    <div className="space-y-2">
      {observations.map((obs, i) => (
        <motion.div
          key={obs.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04, duration: 0.3 }}
        >
          <Link href={`/researcher/review/${obs.id}`}>
            <div className="flex items-center gap-4 rounded-cozy-lg border border-stone-100 bg-surface p-4 shadow-cozy-sm transition-all hover:shadow-cozy hover:-translate-y-0.5 cursor-pointer">
              {/* Thumbnail */}
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-cozy bg-stone-100">
                {obs.image_url ? (
                  <img
                    src={obs.image_thumbnail_url || obs.image_url}
                    alt={obs.top_species || "Observation"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-stone-400">
                    <Camera className="h-6 w-6" />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-stone-800">
                    {obs.top_species ? `${obs.top_species}?` : "Unknown species"}
                  </span>
                  {/* Score badge */}
                  {obs.confidence_score !== null && (
                    <span
                      className={`rounded-pill px-2 py-0.5 text-[10px] font-bold ${
                        obs.confidence_score >= 70
                          ? "bg-success-50 text-success-700"
                          : obs.confidence_score >= 50
                            ? "bg-amber-50 text-amber-700"
                            : "bg-danger-50 text-danger-700"
                      }`}
                    >
                      Score: {obs.confidence_score}
                    </span>
                  )}
                </div>

                {/* Anomaly flags */}
                {obs.routing === "expert_review" && (
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    {obs.confidence_score !== null && obs.confidence_score < 50 && (
                      <span className="rounded-pill bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-500">
                        Low confidence
                      </span>
                    )}
                    {obs.top_confidence !== null &&
                      obs.top_confidence < 0.5 && (
                        <span className="rounded-pill bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-500">
                          Low vision conf
                        </span>
                      )}
                  </div>
                )}

                <div className="mt-1 flex items-center gap-1.5 text-xs text-stone-500 truncate flex-wrap">
                  <span className="inline-flex items-center gap-1 font-medium text-stone-700">
                    <UserIcon className="h-3 w-3 text-stream-600" />
                    {obs.volunteer_name || "Volunteer"}
                  </span>
                  <span className="text-stone-300">·</span>
                  <span className="text-stone-500">{obs.pilot_city || obs.location_name || "Unknown location"}</span>
                  <span className="text-stone-300">·</span>
                  <span className="text-stone-400">
                    {formatDistanceToNow(new Date(obs.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>

              <StatusBadge status={obs.status} />
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}
