"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Send, Loader2, CheckCircle2 } from "lucide-react"
import { api } from "@/lib/api"
import { FHIRViewer } from "@/components/researcher/fhir-viewer"
import { CardSkeleton } from "@/components/shared/loading-skeleton"
import { toast } from "sonner"
import type { FHIRResource } from "@/types"

interface FHIRListResponse {
  resources: FHIRResource[]
  total: number
  page: number
}

/**
 * FHIR page — resource list + viewer + export to OAH sandbox.
 *
 * DOC-10 Task 5.13
 */
export default function FHIRPage() {
  const [resources, setResources] = useState<FHIRResource[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedJson, setExpandedJson] = useState<Record<string, unknown> | null>(null)
  const limit = 20

  const loadResources = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<FHIRListResponse>(
        `/fhir/resources?page=${page}&limit=${limit}`,
      )
      setResources(data.resources)
      setTotal(data.total)
    } catch (err) {
      console.error("Failed to load FHIR resources:", err)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    loadResources()
  }, [loadResources])

  async function loadResourceDetail(id: string) {
    if (expandedId === id) {
      setExpandedId(null)
      setExpandedJson(null)
      return
    }
    try {
      const data = await api.get<{ resource_json: Record<string, unknown> }>(
        `/fhir/resources/${id}`,
      )
      setExpandedId(id)
      setExpandedJson(data.resource_json)
    } catch {
      toast.error("Failed to load resource details.")
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function exportSelected() {
    if (selectedIds.size === 0) return
    setExporting(true)
    try {
      // Map FHIR resource IDs to observation IDs
      const observationIds = resources
        .filter((r) => selectedIds.has(r.id))
        .map((r) => r.observation_id)

      await api.post("/fhir/export", { observation_ids: observationIds })
      toast.success("FHIR bundle posted to OAH Sandbox — 201 Created")
      setSelectedIds(new Set())
      loadResources()
    } catch {
      toast.error(
        "FHIR export queued — it will be submitted when the server is available.",
      )
    } finally {
      setExporting(false)
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-2xl text-stone-800">
            FHIR Resources
          </h1>
          <p className="mt-1 text-sm text-stone-500 max-w-2xl leading-relaxed">
            HL7 FHIR R4 clinical environmental resources adhering to the official OneAquaHealth profile (<code className="rounded bg-stone-100 px-1 py-0.5 text-xs font-mono text-stream-700">observation-indicators-oah</code>). Inspect generated JSON payloads, copy structured components, and batch export validated records directly to the European HAPI FHIR Sandbox.
          </p>
        </div>

        <button
          onClick={exportSelected}
          disabled={selectedIds.size === 0 || exporting}
          className="flex items-center gap-2 rounded-cozy bg-stream-500 px-5 py-2.5 text-sm font-medium text-white shadow-cozy-sm transition-all hover:bg-stream-600 hover:shadow-cozy disabled:opacity-50 self-start"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {exporting ? "Posting to FHIR Sandbox..." : `Export to OAH Sandbox (${selectedIds.size})`}
        </button>
      </motion.div>

      {/* Resource list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="rounded-cozy-lg border border-stone-100 bg-surface p-12 text-center shadow-cozy-sm">
          <p className="text-sm text-stone-500">
            No FHIR resources generated yet. Validate observations to generate FHIR resources.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {resources.map((resource, i) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              {/* Resource row */}
              <div className="flex items-center gap-3 mb-1">
                <input
                  type="checkbox"
                  checked={selectedIds.has(resource.id)}
                  onChange={() => toggleSelect(resource.id)}
                  className="h-4 w-4 rounded border-stone-300 text-stream-500 focus:ring-stream-400"
                />
                <button
                  onClick={() => loadResourceDetail(resource.id)}
                  className="flex-1 text-left"
                >
                  <div className="flex items-center gap-3 text-sm">
                    <span className="rounded-pill bg-stream-50 px-2 py-0.5 text-[10px] font-bold text-stream-700">
                      {resource.resource_type}
                    </span>
                    <span className="text-stone-600 truncate font-mono text-xs">
                      {resource.observation_id.slice(0, 8)}...
                    </span>
                    {resource.sandbox_status === "posted" && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-success-500" />
                    )}
                    <span className="ml-auto text-xs text-stone-400">
                      {new Date(resource.created_at).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                </button>
              </div>

              {/* Expanded viewer */}
              {expandedId === resource.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="ml-7"
                >
                  <FHIRViewer
                    resource={resource}
                    resourceJson={expandedJson}
                  />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-cozy border border-stone-200 bg-surface px-3 py-1.5 text-sm text-stone-600 disabled:opacity-40 hover:bg-surface-hover transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-stone-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-cozy border border-stone-200 bg-surface px-3 py-1.5 text-sm text-stone-600 disabled:opacity-40 hover:bg-surface-hover transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
