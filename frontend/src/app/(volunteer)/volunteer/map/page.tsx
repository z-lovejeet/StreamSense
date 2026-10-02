"use client"

import { useEffect, useState, useCallback } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { motion } from "framer-motion"
import { MapPin, Camera, Filter } from "lucide-react"
import { api } from "@/lib/api"
import type { GeoJSONFeatureCollection } from "@/types"

// Dynamic import for Leaflet (client-side only, no SSR)
const ObservationMap = dynamic(
  () =>
    import("@/components/researcher/observation-map").then(
      (mod) => mod.ObservationMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[450px] w-full animate-pulse rounded-cozy-lg bg-stone-100 flex items-center justify-center text-sm text-stone-400">
        Loading stream map...
      </div>
    ),
  },
)

const PILOT_CITIES = [
  "All Cities",
  "Coimbra",
  "Toulouse",
  "Benevento",
  "Ghent",
  "Oslo",
]

/**
 * Volunteer Map Page — displays community stream observations on an interactive map.
 *
 * DOC-01 PRD V-06, DOC-02 FEATURE MATRIX Line 162
 */
export default function VolunteerMapPage() {
  const [geojson, setGeojson] = useState<GeoJSONFeatureCollection | null>(null)
  const [selectedCity, setSelectedCity] = useState("All Cities")
  const [loading, setLoading] = useState(true)

  const loadMapData = useCallback(async () => {
    setLoading(true)
    try {
      const cityParam =
        selectedCity !== "All Cities"
          ? `?city=${encodeURIComponent(selectedCity)}`
          : ""
      const data = await api.get<GeoJSONFeatureCollection>(
        `/validated/map${cityParam}`,
      )
      setGeojson(data)
    } catch (err) {
      console.error("Failed to load map data:", err)
    } finally {
      setLoading(false)
    }
  }, [selectedCity])

  useEffect(() => {
    loadMapData()
  }, [loadMapData])

  const featureCount = geojson?.features?.length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-2xl md:text-3xl text-stone-800">
            Stream Observation Map
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Explore validated bioindicator observations across European urban streams
          </p>
        </div>

        <Link
          href="/volunteer/submit"
          className="inline-flex items-center gap-2 rounded-cozy bg-stream-500 px-4 py-2.5 text-sm font-semibold text-white shadow-cozy-sm transition-all hover:bg-stream-600 hover:shadow-cozy hover:-translate-y-0.5 self-start sm:self-auto"
        >
          <Camera className="h-4 w-4" />
          Add Observation
        </Link>
      </motion.div>

      {/* City Filters + Total Badge */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="flex flex-wrap items-center justify-between gap-3 rounded-cozy-lg border border-stone-100 bg-surface p-3 shadow-cozy-sm"
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1 text-xs font-semibold text-stone-500 mr-1.5">
            <Filter className="h-3.5 w-3.5 text-stone-400" />
            Filter:
          </div>
          {PILOT_CITIES.map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`rounded-pill px-3 py-1 text-xs font-medium transition-all ${
                selectedCity === city
                  ? "bg-stream-500 text-white shadow-cozy-sm"
                  : "bg-stone-50 text-stone-600 hover:bg-stone-100"
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-stone-500 px-2">
          <MapPin className="h-3.5 w-3.5 text-stream-500" />
          <span>
            <strong className="text-stone-800 font-mono">{featureCount}</strong>{" "}
            verified locations
          </span>
        </div>
      </motion.div>

      {/* Map Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="overflow-hidden rounded-cozy-lg border border-stone-100 bg-surface shadow-cozy"
      >
        <div className="p-1">
          <ObservationMap geojson={geojson} />
        </div>

        {/* Legend */}
        <div className="border-t border-stone-100 bg-stone-50/70 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600">
            <span className="font-semibold text-stone-700">BMWP Bioindicators:</span>
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white shadow-sm inline-block" />
                Good Quality (Sensitive: Mayfly, Stonefly, Caddisfly)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-amber-500 ring-2 ring-white shadow-sm inline-block" />
                Moderate (Shrimp, Blackfly)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-rose-500 ring-2 ring-white shadow-sm inline-block" />
                Degraded / Vector risk (Midges, Mosquito larvae)
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
