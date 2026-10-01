"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { StatusBadge } from "@/components/shared/status-badge"
import { formatDistanceToNow } from "date-fns"
import type { Observation } from "@/types"

/**
 * Observation card — reusable card for dashboard + history.
 *
 * Shows photo thumbnail, species, confidence, status badge,
 * location + relative time. Links to detail page.
 */
export function ObservationCard({
  observation,
  index = 0,
}: {
  observation: Observation
  index?: number
}) {
  const confidence = observation.top_confidence
    ? Math.round(observation.top_confidence * 100)
    : observation.confidence_score

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link href={`/volunteer/observation/${observation.id}`}>
        <div className="flex items-center gap-4 rounded-cozy-lg border border-stone-100 bg-surface p-4 shadow-cozy-sm transition-all hover:shadow-cozy hover:-translate-y-0.5 cursor-pointer">
          {/* Thumbnail */}
          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-cozy bg-stone-100">
            {observation.image_url ? (
              <img
                src={observation.image_thumbnail_url || observation.image_url}
                alt={observation.top_species || "Stream observation"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-stone-300">
                <span className="text-xl">📷</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-stone-800 truncate">
                  {observation.top_species || "Identifying..."}
                </p>
                {confidence !== null && confidence !== undefined && (
                  <p className="text-xs font-mono text-stone-500">
                    {confidence}% confidence
                  </p>
                )}
              </div>
              <StatusBadge status={observation.status} />
            </div>
            <p className="mt-1 text-xs text-stone-400 truncate">
              {observation.location_name || observation.pilot_city || "Unknown location"}
              {" · "}
              {formatDistanceToNow(new Date(observation.created_at), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
