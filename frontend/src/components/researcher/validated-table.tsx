"use client"

import { motion } from "framer-motion"
import { StatusBadge } from "@/components/shared/status-badge"
import type { Observation } from "@/types"

const columns = [
  { key: "observed_at", label: "Date" },
  { key: "location_name", label: "Location" },
  { key: "top_species", label: "Species" },
  { key: "confidence_score", label: "Confidence" },
  { key: "status", label: "Source" },
] as const

/**
 * Validated data table — sortable, dense, horizontally scrollable on mobile.
 *
 * DOC-10 Task 5.9, DOC-09 Line 608
 */
export function ValidatedTable({
  observations,
  sortKey,
  sortDir,
  onSort,
}: {
  observations: Observation[]
  sortKey: string
  sortDir: "asc" | "desc"
  onSort: (key: string) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-cozy-lg border border-stone-100 bg-surface shadow-cozy-sm overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-stone-500 cursor-pointer hover:text-stone-800 transition-colors first:sticky first:left-0 first:z-10 first:bg-stone-50"
                  onClick={() => onSort(col.key)}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key && (
                      <span className="text-stream-500">
                        {sortDir === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {observations.map((obs) => (
              <tr
                key={obs.id}
                className="hover:bg-stone-50/60 transition-colors"
              >
                <td className="px-4 py-3 text-stone-600 whitespace-nowrap sticky left-0 bg-surface">
                  {obs.observed_at
                    ? new Date(obs.observed_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </td>
                <td className="px-4 py-3 text-stone-700 max-w-[160px] truncate">
                  {obs.pilot_city || obs.location_name || "—"}
                </td>
                <td className="px-4 py-3 font-medium text-stone-800">
                  {obs.top_species || "—"}
                </td>
                <td className="px-4 py-3">
                  {obs.confidence_score !== null ? (
                    <span
                      className={`rounded-pill px-2 py-0.5 text-[10px] font-bold ${
                        obs.confidence_score >= 70
                          ? "bg-success-50 text-success-700"
                          : obs.confidence_score >= 50
                            ? "bg-amber-50 text-amber-700"
                            : "bg-danger-50 text-danger-700"
                      }`}
                    >
                      {obs.confidence_score}%
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={obs.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {observations.length === 0 && (
        <div className="p-10 text-center">
          <p className="text-sm text-stone-500">
            No validated observations yet. Review pending items to get started.
          </p>
        </div>
      )}
    </motion.div>
  )
}
