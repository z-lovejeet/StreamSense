"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import type { GeoJSONFeatureCollection } from "@/types"

interface MapFeatureProperties {
  species?: string | null
  confidence?: number | null
  location_name?: string | null
  pilot_city?: string | null
  observed_at?: string | null
  volunteer_name?: string | null
  [key: string]: unknown
}

/**
 * BMWP-based pin color mapping:
 *   Green (≥7): EPT sensitive (Ephemeroptera, Plecoptera, Trichoptera, Heptageniidae, Leuctridae)
 *   Amber (4-6): Moderate (Gammaridae, Simuliidae, Hydropsychidae, Baetidae)
 *   Red (≤3): Tolerant/vectors (Chironomidae, Culicidae, Asellidae, Oligochaeta, Tubificidae)
 */
const BMWP_SCORES: Record<string, number> = {
  Ephemeroptera: 10,
  Plecoptera: 10,
  Trichoptera: 8,
  Heptageniidae: 10,
  Leuctridae: 10,
  Baetidae: 4,
  Hydropsychidae: 5,
  Gammaridae: 6,
  Simuliidae: 5,
  Asellidae: 3,
  Chironomidae: 2,
  Oligochaeta: 1,
  Tubificidae: 1,
  Culicidae: 0,
  Gastropoda: 3,
}

function getPinColor(species: string | null): string {
  if (!species) return "#a49a88" // stone-500
  const score = BMWP_SCORES[species]
  if (score === undefined) return "#a49a88"
  if (score >= 7) return "#22c55e" // green
  if (score >= 4) return "#f59e0b" // amber
  return "#dc4446" // red
}

function createCircleIcon(color: string) {
  return L.divIcon({
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
    className: "",
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

/**
 * Observation map — Leaflet with species-colored pins.
 *
 * DOC-10 Task 5.10, DOC-09 Line 607
 */
export function ObservationMap({
  geojson,
}: {
  geojson: GeoJSONFeatureCollection | null
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const map = L.map(mapRef.current, {
      center: [40.2, -1.5], // Europe center (covers pilot cities)
      zoom: 5,
      zoomControl: true,
      attributionControl: true,
    })

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    mapInstance.current = map

    return () => {
      map.remove()
      mapInstance.current = null
    }
  }, [])

  // Add markers when geojson changes
  useEffect(() => {
    const map = mapInstance.current
    if (!map || !geojson) return

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) map.removeLayer(layer)
    })

    const bounds: L.LatLngBounds = L.latLngBounds([])

    geojson.features.forEach((feature) => {
      const [lng, lat] = feature.geometry.coordinates
      const props = feature.properties as MapFeatureProperties
      const color = getPinColor(props.species || null)

      const marker = L.marker([lat, lng], {
        icon: createCircleIcon(color),
      })

      marker.bindPopup(
        `<div style="font-family:system-ui;font-size:13px;line-height:1.4">
          <div style="margin-bottom:6px">
            <span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:9999px;background:#dcfce7;color:#166534;border:1px solid #bbf7d0">
              Validated
            </span>
          </div>
          <strong>${props.species || "Unknown"}</strong><br/>
          ${props.volunteer_name ? `<span style="color:#0f766e;font-size:11px;font-weight:600">Submitted by: ${props.volunteer_name}</span><br/>` : ""}
          ${props.confidence !== null ? `<span style="color:#57534e">Confidence: ${props.confidence}%</span><br/>` : ""}
          <span style="color:#44403c">${props.location_name || props.pilot_city || ""}</span><br/>
          <span style="color:#888;font-size:11px">${props.observed_at ? new Date(props.observed_at).toLocaleDateString() : ""}</span>
        </div>`,
        { maxWidth: 220 },
      )

      marker.addTo(map)
      bounds.extend([lat, lng])
    })

    if (geojson.features.length > 0) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 })
    }
  }, [geojson])

  return (
    <div
      ref={mapRef}
      className="w-full h-[300px] lg:h-[500px] rounded-cozy-lg border border-stone-100 shadow-cozy-sm overflow-hidden"
    />
  )
}
