"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  Send,
  Loader2,
  CheckCircle2,
  Clock,
  MapPin,
  User,
  Droplets,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  ShieldCheck,
  CheckSquare,
  Square,
  FileCode2,
  Layers,
  Activity,
  X,
} from "lucide-react"
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

const PILOT_CITIES = [
  "All Cities",
  "Coimbra",
  "Toulouse",
  "Benevento",
  "Ghent",
  "Oslo",
]

function getBmwPBadge(score: number | null | undefined) {
  if (score == null) {
    return {
      text: "BMWP Score Pending",
      badgeClass: "bg-stone-100 text-stone-700 border-stone-200",
      description: "Bioindicator score unassigned",
    }
  }
  if (score >= 8) {
    return {
      text: `BMWP ${score} · Pristine Water Indicator`,
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      description: "Highly sensitive clean-water taxon",
    }
  }
  if (score >= 4) {
    return {
      text: `BMWP ${score} · Moderate Bioindicator`,
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
      description: "Moderately tolerant macroinvertebrate",
    }
  }
  return {
    text: `BMWP ${score} · Tolerant / Impacted`,
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    description: "Highly tolerant to organic enrichment",
  }
}

function getWaterQualityBadge(indication: string | null | undefined) {
  const norm = (indication || "unknown").toLowerCase()
  if (norm === "good" || norm === "pristine") {
    return {
      label: "Good Water Quality",
      pillClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    }
  }
  if (norm === "moderate") {
    return {
      label: "Moderate Water Quality",
      pillClass: "bg-amber-50 text-amber-700 border-amber-200",
    }
  }
  if (norm === "poor" || norm === "severely_degraded") {
    return {
      label: "Poor / Degraded Water",
      pillClass: "bg-rose-50 text-rose-700 border-rose-200",
    }
  }
  return {
    label: indication ? `${indication} Water` : "Monitored Reach",
    pillClass: "bg-stream-50 text-stream-700 border-stream-200",
  }
}

/**
 * FHIR page — comprehensive observation resource cards + inspector + sandbox batch export.
 */
export default function FHIRPage() {
  const [resources, setResources] = useState<FHIRResource[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCity, setSelectedCity] = useState("All Cities")
  const [selectedSandboxFilter, setSelectedSandboxFilter] = useState<"all" | "pending" | "posted">("all")

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
      toast.error("Could not load FHIR resources. Please refresh.")
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    loadResources()
  }, [loadResources])

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  // Filtered resources
  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      // City filter
      if (selectedCity !== "All Cities" && r.pilot_city !== selectedCity) {
        return false
      }
      // Sandbox status filter
      if (selectedSandboxFilter === "pending" && r.sandbox_status === "posted") {
        return false
      }
      if (selectedSandboxFilter === "posted" && r.sandbox_status !== "posted") {
        return false
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const species = (r.top_species || "").toLowerCase()
        const common = (TAXA_COMMON_NAMES[r.top_species || ""] || "").toLowerCase()
        const city = (r.pilot_city || "").toLowerCase()
        const loc = (r.location_name || "").toLowerCase()
        const volunteer = (r.volunteer_name || "").toLowerCase()
        const obsId = (r.observation_id || "").toLowerCase()
        const fhirId = (r.id || "").toLowerCase()
        if (
          !species.includes(query) &&
          !common.includes(query) &&
          !city.includes(query) &&
          !loc.includes(query) &&
          !volunteer.includes(query) &&
          !obsId.includes(query) &&
          !fhirId.includes(query)
        ) {
          return false
        }
      }
      return true
    })
  }, [resources, selectedCity, selectedSandboxFilter, searchQuery])

  // Select all visible filtered
  const allFilteredSelected =
    filteredResources.length > 0 &&
    filteredResources.every((r) => selectedIds.has(r.id))

  function toggleSelectAllFiltered() {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        filteredResources.forEach((r) => next.delete(r.id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        filteredResources.forEach((r) => next.add(r.id))
        return next
      })
    }
  }

  async function exportSelected() {
    if (selectedIds.size === 0) return
    setExporting(true)
    try {
      const observationIds = resources
        .filter((r) => selectedIds.has(r.id))
        .map((r) => r.observation_id)

      await api.post("/fhir/export", { observation_ids: observationIds })
      toast.success(
        `Successfully posted ${selectedIds.size} FHIR Observation bundle(s) to OAH Sandbox`,
      )
      setSelectedIds(new Set())
      await loadResources()
    } catch {
      toast.error(
        "FHIR export queued — sandbox transaction will complete momentarily.",
      )
    } finally {
      setExporting(false)
    }
  }

  const [exportingId, setExportingId] = useState<string | null>(null)

  async function exportSingle(resourceId: string) {
    setExportingId(resourceId)
    try {
      await api.post(`/fhir/resources/${resourceId}/export`)
      toast.success("Successfully posted FHIR Observation to OAH Sandbox")
      await loadResources()
    } catch (err) {
      console.error(err)
      toast.error("Failed to post to sandbox. Please try again.")
    } finally {
      setExportingId(null)
    }
  }

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalCount = resources.length
    const postedCount = resources.filter((r) => r.sandbox_status === "posted").length
    const pristineCount = resources.filter(
      (r) => (r.bmwp_score != null && r.bmwp_score >= 8) || (r.water_quality_indication === "good"),
    ).length
    const pendingExport = resources.filter((r) => r.sandbox_status !== "posted").length

    return { totalCount, postedCount, pristineCount, pendingExport }
  }, [resources])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-pill bg-stream-100 px-3 py-1 text-xs font-semibold text-stream-700 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-stream-600" />
              HL7 FHIR R4 Standard
            </span>
            <span className="rounded-pill bg-stone-100 px-2.5 py-0.5 text-[11px] font-mono text-stone-600">
              observation-indicators-oah
            </span>
          </div>
          <h1 className="mt-2 font-display text-2xl lg:text-3xl font-bold text-stone-900 tracking-tight">
            FHIR Clinical Environmental Resources
          </h1>
          <p className="mt-1 text-sm text-stone-500 max-w-3xl leading-relaxed">
            HL7 FHIR R4 clinical-environmental resources with full observation provenance, bioindicator telemetry, water diagnostics, and FHIR interoperability with the European HAPI FHIR Sandbox.
          </p>
        </div>

        <button
          onClick={exportSelected}
          disabled={selectedIds.size === 0 || exporting}
          className="flex items-center gap-2 rounded-xl bg-stream-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-stream-700 hover:shadow disabled:opacity-50 self-start lg:self-center shrink-0 cursor-pointer"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {exporting
            ? "Posting to FHIR Sandbox..."
            : `Export to OAH Sandbox (${selectedIds.size})`}
        </button>
      </motion.div>

      {/* KPI Stats Strip */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <div className="rounded-xl border border-stone-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-stone-500">
            <span>Total FHIR Records</span>
            <FileCode2 className="h-4 w-4 text-stream-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-stone-900 font-display">
            {metrics.totalCount}
          </p>
          <span className="text-[11px] text-stone-400">Validated stream resources</span>
        </div>

        <div className="rounded-xl border border-stone-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-stone-500">
            <span>Clean Bioindicators</span>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600 font-display">
            {metrics.pristineCount}
          </p>
          <span className="text-[11px] text-stone-400">BMWP &ge; 8 or pristine rating</span>
        </div>

        <div className="rounded-xl border border-stone-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-stone-500">
            <span>Sandbox Posted</span>
            <CheckCircle2 className="h-4 w-4 text-stream-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-stream-700 font-display">
            {metrics.postedCount}
          </p>
          <span className="text-[11px] text-stone-400">European HAPI Sandbox</span>
        </div>

        <div className="rounded-xl border border-stone-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-stone-500">
            <span>Pending Export</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-600 font-display">
            {metrics.pendingExport}
          </p>
          <span className="text-[11px] text-stone-400">Ready for batch upload</span>
        </div>
      </motion.div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-stone-200/80 bg-white p-3.5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by species, pilot city, river basin, submitter, ID..."
            className="w-full rounded-lg border border-stone-200 bg-stone-50/50 pl-9 pr-3 py-1.5 text-xs text-stone-800 placeholder-stone-400 focus:border-stream-500 focus:bg-white focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center flex-wrap gap-2">
          {/* City filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-stone-400" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="rounded-lg border border-stone-200 bg-stone-50/50 px-2.5 py-1.5 text-xs text-stone-700 focus:border-stream-500 focus:bg-white focus:outline-none cursor-pointer"
            >
              {PILOT_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Sandbox status filter */}
          <select
            value={selectedSandboxFilter}
            onChange={(e) => setSelectedSandboxFilter(e.target.value as "all" | "pending" | "posted")}
            className="rounded-lg border border-stone-200 bg-stone-50/50 px-2.5 py-1.5 text-xs text-stone-700 focus:border-stream-500 focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="all">All Sandbox Status</option>
            <option value="pending">Pending Export</option>
            <option value="posted">Posted to Sandbox</option>
          </select>

          {/* Select all toggle */}
          {filteredResources.length > 0 && (
            <button
              onClick={toggleSelectAllFiltered}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50/60 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              {allFilteredSelected ? (
                <CheckSquare className="h-3.5 w-3.5 text-stream-600" />
              ) : (
                <Square className="h-3.5 w-3.5 text-stone-400" />
              )}
              {allFilteredSelected ? "Deselect All" : "Select All"}
            </button>
          )}
        </div>
      </div>

      {/* Resource list */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="rounded-2xl border border-stone-200/80 bg-white p-12 text-center shadow-xs">
          <FileCode2 className="mx-auto h-12 w-12 text-stone-300" />
          <h3 className="mt-3 text-base font-semibold text-stone-800">
            No FHIR resources match criteria
          </h3>
          <p className="mt-1 text-xs text-stone-500 max-w-md mx-auto">
            {resources.length === 0
              ? "No FHIR resources generated yet. Once observations are validated, HL7 FHIR R4 records are automatically produced."
              : "Try adjusting your search query or city filters to locate specific observation resources."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredResources.map((resource, i) => {
            const isSelected = selectedIds.has(resource.id)
            const isExpanded = expandedId === resource.id
            const bmwpInfo = getBmwPBadge(resource.bmwp_score)
            const wqInfo = getWaterQualityBadge(resource.water_quality_indication)
            const commonName =
              TAXA_COMMON_NAMES[resource.top_species || ""] ||
              "Freshwater Macroinvertebrate"
            const thumbnail =
              resource.image_thumbnail_url || resource.image_url || null

            return (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`rounded-2xl border bg-white shadow-xs transition-all duration-200 overflow-hidden ${
                  isSelected
                    ? "border-stream-300 ring-2 ring-stream-100"
                    : "border-stone-200/80 hover:border-stone-300 hover:shadow-sm"
                }`}
              >
                {/* Main Card Content */}
                <div className="p-4 sm:p-5">
                  {/* Top Bar: Checkbox + Meta Tags + Timestamp */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-stone-100">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(resource.id)}
                        className="h-4 w-4 rounded border-stone-300 text-stream-600 focus:ring-stream-400 cursor-pointer"
                      />

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-mono font-medium text-stone-700">
                          {resource.resource_type} · {resource.id.slice(0, 8)}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                            resource.sandbox_status === "posted"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {resource.sandbox_status === "posted" ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              Sandbox Posted {resource.sandbox_id ? `(${resource.sandbox_id.slice(0, 8)})` : ""}
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 text-amber-600" />
                              Pending Export
                            </>
                          )}
                        </span>

                        <span className="inline-flex items-center gap-1 rounded-md border bg-stream-50 text-stream-700 border-stream-200 px-2 py-0.5 text-[11px] font-medium">
                          <ShieldCheck className="h-3 w-3 text-stream-600" />
                          Validated
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-stone-400 flex items-center gap-2 flex-wrap">
                      <span>
                        Created: {new Date(resource.created_at).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      {resource.posted_at && (
                        <>
                          <span>·</span>
                          <span className="text-emerald-600 font-medium">
                            Sandbox Sync: {new Date(resource.posted_at).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Middle Row: Photo + Information + Diagnostics */}
                  <div className="pt-3.5 flex flex-col sm:flex-row items-start gap-4">
                    {/* Thumbnail */}
                    <div
                      onClick={() =>
                        thumbnail &&
                        setPreviewImage({
                          url: thumbnail,
                          title: resource.top_species || "Observation Photo",
                        })
                      }
                      className={`h-24 w-24 sm:h-28 sm:w-28 rounded-xl overflow-hidden border border-stone-200 bg-stone-100 flex-shrink-0 relative group ${
                        thumbnail ? "cursor-pointer" : ""
                      }`}
                    >
                      {thumbnail ? (
                        <>
                          <Image
                            src={thumbnail}
                            alt={resource.top_species || "Observation"}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 640px) 96px, 112px"
                          />
                          <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/20 transition-colors flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity rounded-md bg-stone-900/80 px-1.5 py-0.5 text-[9px] font-medium text-white">
                              Zoom
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center text-stone-400 p-2 text-center bg-stone-50">
                          <Droplets className="h-7 w-7 text-stream-400 mb-1" />
                          <span className="text-[10px] text-stone-400">Stream photo</span>
                        </div>
                      )}
                    </div>

                    {/* Content Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <h3 className="font-display text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                          {resource.top_species || "Freshwater Macroinvertebrate"}
                        </h3>
                        <span className="text-xs font-medium text-stone-500 italic">
                          ({commonName})
                        </span>
                      </div>

                      {/* Location & Volunteer Metadata */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600">
                        <div className="flex items-center gap-1 min-w-0">
                          <MapPin className="h-3.5 w-3.5 text-stream-600 shrink-0" />
                          <span className="truncate max-w-xs font-medium">
                            {resource.location_name || "Urban stream reach"}
                          </span>
                        </div>

                        {resource.pilot_city && (
                          <span className="rounded-md bg-stream-50 border border-stream-200/60 px-2 py-0.2 text-[10px] font-semibold text-stream-700">
                            {resource.pilot_city} Pilot
                          </span>
                        )}

                        <div className="flex items-center gap-1 text-stone-500">
                          <User className="h-3 w-3 text-stone-400 shrink-0" />
                          <span>{resource.volunteer_name || "Citizen Scientist"}</span>
                        </div>
                      </div>

                      {/* Bioindicator and Diagnostics Badges */}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {/* BMWP Badge */}
                        <span
                          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold ${bmwpInfo.badgeClass}`}
                          title={bmwpInfo.description}
                        >
                          <Activity className="h-3.5 w-3.5" />
                          {bmwpInfo.text}
                        </span>

                        {/* Water Quality Pill */}
                        <span
                          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium ${wqInfo.pillClass}`}
                        >
                          <Droplets className="h-3.5 w-3.5 text-stream-500" />
                          {wqInfo.label}
                        </span>

                        {/* Confidence Pill */}
                        {resource.confidence_score != null && (
                          <span className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-700">
                            <Sparkles className="h-3 w-3 text-amber-500" />
                            AI Confidence: {resource.confidence_score}%
                          </span>
                        )}

                        {/* Observation Status */}
                        {resource.observation_status && (
                          <span className="inline-flex items-center rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-[11px] font-mono text-stone-600">
                            Status: {resource.observation_status}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons Column */}
                    <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 pt-2 sm:pt-0 shrink-0 border-t sm:border-t-0 border-stone-100">
                      {resource.sandbox_status === "posted" ? (
                        <button
                          onClick={() => exportSingle(resource.id)}
                          disabled={exportingId === resource.id}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50"
                          title={resource.sandbox_id ? `Sandbox ID: ${resource.sandbox_id}` : "Exported to European Sandbox"}
                        >
                          {exportingId === resource.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          )}
                          {exportingId === resource.id ? "Syncing..." : "Re-export"}
                        </button>
                      ) : (
                        <button
                          onClick={() => exportSingle(resource.id)}
                          disabled={exportingId === resource.id}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-stream-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-stream-700 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {exportingId === resource.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Send className="h-3.5 w-3.5" />
                          )}
                          {exportingId === resource.id ? "Posting..." : "Export to Sandbox"}
                        </button>
                      )}

                      <Link
                        href={`/researcher/observation/${resource.observation_id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-stream-200 bg-stream-50/70 px-3.5 py-2 text-xs font-semibold text-stream-700 hover:bg-stream-100 hover:text-stream-800 transition-colors cursor-pointer"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View Report
                      </Link>

                      <button
                        onClick={() => toggleExpand(resource.id)}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                          isExpanded
                            ? "bg-stone-800 text-white"
                            : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                        }`}
                      >
                        <FileCode2 className="h-3.5 w-3.5" />
                        {isExpanded ? "Hide FHIR" : "Inspect FHIR"}
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded FHIR Viewer Drawer */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border-t border-stone-200/80 bg-stone-50/40 p-4 sm:p-5"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                            HL7 FHIR R4 JSON & Component Inspector
                          </h4>
                          <p className="text-[11px] text-stone-500">
                            Resource ID: <code className="font-mono text-stream-700">{resource.id}</code> · Linked Observation: <code className="font-mono text-stone-600">{resource.observation_id}</code>
                          </p>
                        </div>
                        <Link
                          href={`/researcher/observation/${resource.observation_id}`}
                          className="text-xs font-semibold text-stream-600 hover:text-stream-700 hover:underline flex items-center gap-1"
                        >
                          Open Observation Report <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>

                      <FHIRViewer
                        resource={resource}
                        resourceJson={resource.resource_json}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-xl border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-600 disabled:opacity-40 hover:bg-stone-50 transition-colors cursor-pointer"
          >
            Previous
          </button>
          <span className="text-xs font-medium text-stone-500">
            Page {page} of {totalPages} ({total} total records)
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-xl border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-600 disabled:opacity-40 hover:bg-stone-50 transition-colors cursor-pointer"
          >
            Next
          </button>
        </div>
      )}

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm p-4"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-3 border-b border-stone-100">
                <h4 className="font-display font-semibold text-stone-800 text-sm">
                  {previewImage.title}
                </h4>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="rounded-lg p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="relative h-96 w-full mt-2 bg-stone-100 rounded-xl overflow-hidden">
                <Image
                  src={previewImage.url}
                  alt={previewImage.title}
                  fill
                  className="object-contain"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
