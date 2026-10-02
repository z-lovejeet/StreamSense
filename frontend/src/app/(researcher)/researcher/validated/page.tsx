"use client"

import { useEffect, useState, useCallback } from "react"
import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import { Table2, Map } from "lucide-react"
import { api } from "@/lib/api"
import { ValidatedTable } from "@/components/researcher/validated-table"
import { PageSkeleton } from "@/components/shared/loading-skeleton"
import type {
  Observation,
  ObservationListResponse,
  GeoJSONFeatureCollection,
} from "@/types"

// Dynamic import for Leaflet (no SSR)
const ObservationMap = dynamic(
  () =>
    import("@/components/researcher/observation-map").then(
      (mod) => mod.ObservationMap,
    ),
  { ssr: false, loading: () => <div className="h-[400px] animate-pulse rounded-cozy-lg bg-stone-100" /> },
)

type ViewMode = "table" | "map"

/**
 * Validated data page — table + map toggle with filters.
 *
 * DOC-10 Task 5.8
 */
export default function ValidatedDataPage() {
  const [view, setView] = useState<ViewMode>("table")
  const [observations, setObservations] = useState<Observation[]>([])
  const [geojson, setGeojson] = useState<GeoJSONFeatureCollection | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  // Filters
  const [species, setSpecies] = useState("")
  const [city, setCity] = useState("")
  const [source, setSource] = useState("")
  const [sortKey, setSortKey] = useState("observed_at")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const limit = 50

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      let tableUrl = `/validated?page=${page}&limit=${limit}`
      let mapUrl = "/validated/map?"
      const filters = []

      if (species) filters.push(`species=${encodeURIComponent(species)}`)
      if (city) filters.push(`city=${encodeURIComponent(city)}`)
      if (source) filters.push(`source=${source}`)

      const filterStr = filters.join("&")
      if (filterStr) {
        tableUrl += `&${filterStr}`
        mapUrl += filterStr
      }

      const [tableRes, mapRes] = await Promise.all([
        api.get<ObservationListResponse>(tableUrl),
        api.get<GeoJSONFeatureCollection>(mapUrl),
      ])

      setObservations(tableRes.observations)
      setTotal(tableRes.total)
      setGeojson(mapRes)
    } catch (err) {
      console.error("Failed to load validated data:", err)
    } finally {
      setLoading(false)
    }
  }, [page, species, city, source])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Client-side sort
  const sorted = [...observations].sort((a, b) => {
    const aVal = a[sortKey as keyof Observation]
    const bVal = b[sortKey as keyof Observation]
    if (aVal === null || aVal === undefined) return 1
    if (bVal === null || bVal === undefined) return -1
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    return sortDir === "asc" ? cmp : -cmp
  })

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  const totalPages = Math.ceil(total / limit)

  if (loading && page === 1) return <PageSkeleton />

  return (
    <div className="space-y-6">
      {/* Header + Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-2xl text-stone-800">
            Validated Data
          </h1>
          <p className="mt-1 text-sm text-stone-500 max-w-2xl leading-relaxed">
            Curated archive of research-grade stream observations verified by AI (score &ge; 70) or certified by expert ecologists. Switch between tabular view with multi-column sorting and geographic Leaflet map view to analyze macroinvertebrate distributions across pilot cities.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex rounded-cozy border border-stone-200 bg-stone-50 p-0.5">
          <button
            onClick={() => setView("table")}
            className={`flex items-center gap-1.5 rounded-cozy px-3 py-1.5 text-sm font-medium transition-colors ${
              view === "table"
                ? "bg-surface text-stone-800 shadow-cozy-sm"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            <Table2 className="h-3.5 w-3.5" />
            Table
          </button>
          <button
            onClick={() => setView("map")}
            className={`flex items-center gap-1.5 rounded-cozy px-3 py-1.5 text-sm font-medium transition-colors ${
              view === "map"
                ? "bg-surface text-stone-800 shadow-cozy-sm"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            <Map className="h-3.5 w-3.5" />
            Map
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Species..."
          value={species}
          onChange={(e) => {
            setSpecies(e.target.value)
            setPage(1)
          }}
          className="rounded-cozy border border-stone-200 bg-surface px-3 py-2 text-sm text-stone-700 placeholder:text-stone-400 focus:border-stream-400 focus:ring-2 focus:ring-stream-100 w-40"
        />
        <input
          type="text"
          placeholder="City..."
          value={city}
          onChange={(e) => {
            setCity(e.target.value)
            setPage(1)
          }}
          className="rounded-cozy border border-stone-200 bg-surface px-3 py-2 text-sm text-stone-700 placeholder:text-stone-400 focus:border-stream-400 focus:ring-2 focus:ring-stream-100 w-36"
        />
        <select
          value={source}
          onChange={(e) => {
            setSource(e.target.value)
            setPage(1)
          }}
          className="rounded-cozy border border-stone-200 bg-surface px-3 py-2 text-sm text-stone-700 focus:border-stream-400 focus:ring-2 focus:ring-stream-100"
        >
          <option value="">All sources</option>
          <option value="auto_validated">AI Validated</option>
          <option value="expert_validated">Expert Validated</option>
        </select>
      </div>

      {/* Content */}
      {view === "table" ? (
        <>
          <ValidatedTable
            observations={sorted}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
          />
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
        </>
      ) : (
        <ObservationMap geojson={geojson} />
      )}

      {/* Map legend */}
      {view === "map" && (
        <div className="flex flex-wrap gap-4 text-xs text-stone-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-success-500 border border-white shadow-sm" />
            Clean water (BMWP ≥7)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-amber-500 border border-white shadow-sm" />
            Moderate (BMWP 4–6)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-danger-500 border border-white shadow-sm" />
            Tolerant / Disease vector (BMWP ≤3)
          </span>
        </div>
      )}
    </div>
  )
}
