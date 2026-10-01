"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Code, LayoutList, Copy, Check, ExternalLink } from "lucide-react"
import type { FHIRResource } from "@/types"

type ViewMode = "structured" | "json"

/**
 * FHIR resource viewer — structured card + raw JSON toggle.
 *
 * DOC-10 Task 5.14, DOC-09 Line 185 (JetBrains Mono for JSON)
 */
export function FHIRViewer({
  resource,
  resourceJson,
}: {
  resource: FHIRResource
  resourceJson: Record<string, unknown> | null
}) {
  const [mode, setMode] = useState<ViewMode>("structured")
  const [copied, setCopied] = useState(false)

  const json = resourceJson || resource.resource_json

  // Extract key components from FHIR resource
  const components = ((json?.component || []) as Array<Record<string, unknown>>).map(
    (comp: Record<string, unknown>) => {
      const code = (
        (comp.code as Record<string, unknown>)?.coding as Array<Record<string, string>>
      )?.[0]
      return {
        code: code?.code || "unknown",
        display: code?.display || code?.code || "—",
        value: getComponentValue(comp),
      }
    },
  )

  async function copyJson() {
    await navigator.clipboard.writeText(JSON.stringify(json, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-cozy-lg border border-stone-100 bg-surface shadow-cozy-sm overflow-hidden">
      {/* Header + Toggle */}
      <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="rounded-pill bg-stream-100 px-2.5 py-0.5 text-[10px] font-bold text-stream-700">
            {resource.resource_type}
          </span>
          <StatusDot status={resource.sandbox_status} />
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setMode("structured")}
            className={`rounded-cozy p-1.5 text-xs transition-colors ${
              mode === "structured"
                ? "bg-stone-100 text-stone-800"
                : "text-stone-400 hover:text-stone-600"
            }`}
            title="Structured view"
          >
            <LayoutList className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setMode("json")}
            className={`rounded-cozy p-1.5 text-xs transition-colors ${
              mode === "json"
                ? "bg-stone-100 text-stone-800"
                : "text-stone-400 hover:text-stone-600"
            }`}
            title="JSON view"
          >
            <Code className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {mode === "structured" ? (
          <motion.div
            key="structured"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-5 space-y-3"
          >
            {/* Meta */}
            <div className="grid grid-cols-2 gap-3">
              <MetaRow label="Profile" value={resource.profile_url} isUrl />
              <MetaRow
                label="Validation"
                value={resource.validation_status}
              />
              <MetaRow
                label="Sandbox"
                value={resource.sandbox_status}
              />
              <MetaRow
                label="Created"
                value={
                  new Date(resource.created_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                }
              />
            </div>

            {/* Components */}
            {components.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">
                  Components
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {components.map((comp, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center rounded-cozy bg-stone-50 px-3 py-2"
                    >
                      <span className="text-xs text-stone-500 truncate max-w-[140px]">
                        {comp.display}
                      </span>
                      <span className="text-xs font-medium text-stone-800 ml-2 text-right">
                        {comp.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="json"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative"
          >
            <button
              onClick={copyJson}
              className="absolute top-3 right-3 rounded-cozy bg-stone-100 p-1.5 text-stone-500 hover:text-stone-700 transition-colors z-10"
              title="Copy JSON"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-success-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
            <pre className="p-5 overflow-x-auto text-[13px] leading-relaxed font-mono text-stone-700 bg-stone-50/50 max-h-96">
              {JSON.stringify(json, null, 2)}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Helpers ── */

function getComponentValue(comp: Record<string, unknown>): string {
  if (comp.valueString !== undefined) return String(comp.valueString)
  if (comp.valueBoolean !== undefined) return comp.valueBoolean ? "Yes" : "No"
  const vq = comp.valueQuantity as Record<string, unknown> | undefined
  if (vq) return `${vq.value}${vq.unit ? ` ${vq.unit}` : ""}`
  return "—"
}

function MetaRow({
  label,
  value,
  isUrl,
}: {
  label: string
  value: string
  isUrl?: boolean
}) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wide text-stone-400">
        {label}
      </p>
      {isUrl ? (
        <p className="text-xs text-stream-600 flex items-center gap-1 truncate">
          <ExternalLink className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{value}</span>
        </p>
      ) : (
        <p className="text-xs font-medium text-stone-700 capitalize">
          {value.replace(/_/g, " ")}
        </p>
      )}
    </div>
  )
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "posted"
      ? "bg-success-500"
      : status === "pending"
        ? "bg-amber-500"
        : "bg-stone-300"
  return (
    <span className="flex items-center gap-1.5 text-[10px] text-stone-500">
      <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
      {status.replace(/_/g, " ")}
    </span>
  )
}
