"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Camera,
  ImageIcon,
  X,
  MapPin,
  Clock,
  Loader2,
  Upload,
  Navigation,
  Search,
  SlidersHorizontal,
  Check,
} from "lucide-react"
import { format } from "date-fns"
import { createBrowserClient } from "@/lib/supabase/client"
import { api } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import type { ObservationCreateResponse } from "@/types"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const COMPRESS_THRESHOLD = 5 * 1024 * 1024 // 5MB
const MAX_DIMENSION = 1920
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

interface PilotCity {
  name: string
  country: string
  lat: number
  lon: number
}

const EU_PILOT_CITIES: PilotCity[] = [
  { name: "Coimbra", country: "Portugal", lat: 40.2033, lon: -8.4103 },
  { name: "Toulouse", country: "France", lat: 43.6047, lon: 1.4442 },
  { name: "Benevento", country: "Italy", lat: 41.1297, lon: 14.7826 },
  { name: "Ghent", country: "Belgium", lat: 51.0543, lon: 3.7174 },
  { name: "Oslo", country: "Norway", lat: 59.9139, lon: 10.7522 },
]

const COMMON_CITIES: Record<string, { lat: number; lon: number; name: string }> = {
  coimbra: { lat: 40.2033, lon: -8.4103, name: "Coimbra, Portugal" },
  toulouse: { lat: 43.6047, lon: 1.4442, name: "Toulouse, France" },
  benevento: { lat: 41.1297, lon: 14.7826, name: "Benevento, Italy" },
  ghent: { lat: 51.0543, lon: 3.7174, name: "Ghent, Belgium" },
  gent: { lat: 51.0543, lon: 3.7174, name: "Ghent, Belgium" },
  oslo: { lat: 59.9139, lon: 10.7522, name: "Oslo, Norway" },
  munich: { lat: 48.1371, lon: 11.5754, name: "Munich, Germany" },
  münchen: { lat: 48.1371, lon: 11.5754, name: "Munich, Germany" },
  berlin: { lat: 52.5200, lon: 13.4050, name: "Berlin, Germany" },
  paris: { lat: 48.8566, lon: 2.3522, name: "Paris, France" },
  lyon: { lat: 45.7640, lon: 4.8357, name: "Lyon, France" },
  marseille: { lat: 43.2965, lon: 5.3698, name: "Marseille, France" },
  madrid: { lat: 40.4168, lon: -3.7038, name: "Madrid, Spain" },
  barcelona: { lat: 41.3851, lon: 2.1734, name: "Barcelona, Spain" },
  valencia: { lat: 39.4699, lon: -0.3763, name: "Valencia, Spain" },
  seville: { lat: 37.3891, lon: -5.9845, name: "Seville, Spain" },
  rome: { lat: 41.9028, lon: 12.4964, name: "Rome, Italy" },
  milan: { lat: 45.4642, lon: 9.1900, name: "Milan, Italy" },
  florence: { lat: 43.7696, lon: 11.2558, name: "Florence, Italy" },
  venice: { lat: 45.4408, lon: 12.3155, name: "Venice, Italy" },
  naples: { lat: 40.8518, lon: 14.2681, name: "Naples, Italy" },
  lisbon: { lat: 38.7223, lon: -9.1393, name: "Lisbon, Portugal" },
  porto: { lat: 41.1579, lon: -8.6291, name: "Porto, Portugal" },
  brussels: { lat: 50.8503, lon: 4.3517, name: "Brussels, Belgium" },
  antwerp: { lat: 51.2194, lon: 4.4025, name: "Antwerp, Belgium" },
  amsterdam: { lat: 52.3676, lon: 4.9041, name: "Amsterdam, Netherlands" },
  rotterdam: { lat: 51.9244, lon: 4.4777, name: "Rotterdam, Netherlands" },
  vienna: { lat: 48.2082, lon: 16.3738, name: "Vienna, Austria" },
  zurich: { lat: 47.3769, lon: 8.5417, name: "Zurich, Switzerland" },
  geneva: { lat: 46.2044, lon: 6.1432, name: "Geneva, Switzerland" },
  london: { lat: 51.5074, lon: -0.1278, name: "London, UK" },
  oxford: { lat: 51.7520, lon: -1.2577, name: "Oxford, UK" },
  cambridge: { lat: 52.2053, lon: 0.1218, name: "Cambridge, UK" },
  edinburgh: { lat: 55.9533, lon: -3.1883, name: "Edinburgh, UK" },
  dublin: { lat: 53.3498, lon: -6.2603, name: "Dublin, Ireland" },
  stockholm: { lat: 59.3293, lon: 18.0686, name: "Stockholm, Sweden" },
  copenhagen: { lat: 55.6761, lon: 12.5683, name: "Copenhagen, Denmark" },
  helsinki: { lat: 60.1699, lon: 24.9384, name: "Helsinki, Finland" },
  warsaw: { lat: 52.2297, lon: 21.0122, name: "Warsaw, Poland" },
  prague: { lat: 50.0755, lon: 14.4378, name: "Prague, Czech Republic" },
  budapest: { lat: 47.4979, lon: 19.0402, name: "Budapest, Hungary" },
  athens: { lat: 37.9838, lon: 23.7275, name: "Athens, Greece" },
}

/**
 * Submission form — photo upload + description + GPS + submit.
 *
 * DOC-09 Lines 370–415
 * DOC-04 Lines 484–520 (image upload flow)
 */
export function SubmissionForm() {
  const router = useRouter()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [description, setDescription] = useState("")
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [locationStatus, setLocationStatus] = useState("Getting your location...")
  const [detectingLocation, setDetectingLocation] = useState(false)
  const [cityInput, setCityInput] = useState("")
  const [searchingCity, setSearchingCity] = useState(false)
  const [cityError, setCityError] = useState<string | null>(null)
  const [showManualCoordinates, setShowManualCoordinates] = useState(false)
  const [timestamp] = useState(new Date())
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-detect device GPS
  const detectDeviceLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus("Location not supported by device")
      return
    }
    setDetectingLocation(true)
    setLocationStatus("Detecting GPS...")
    setCityError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude)
        setLongitude(pos.coords.longitude)
        setLocationStatus(
          `${pos.coords.latitude.toFixed(4)}°, ${pos.coords.longitude.toFixed(4)}° (Device GPS)`,
        )
        setDetectingLocation(false)
      },
      (err) => {
        console.error("GPS error:", err)
        setLocationStatus("Unable to get device location")
        setDetectingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [])

  // Quick select an EU Pilot Site
  const selectPilotCity = useCallback((city: PilotCity) => {
    setCityInput(`${city.name}, ${city.country}`)
    setCityError(null)
    setLatitude(city.lat)
    setLongitude(city.lon)
    setLocationStatus(`${city.name}, ${city.country} (${city.lat}, ${city.lon})`)
  }, [])

  // Resolve city name to coordinates
  const handleCitySearch = useCallback(
    async (customName?: string) => {
      const query = (customName ?? cityInput).trim()
      if (!query) return

      setSearchingCity(true)
      setCityError(null)

      const normalized = query.toLowerCase()
      if (COMMON_CITIES[normalized]) {
        const item = COMMON_CITIES[normalized]
        setLatitude(item.lat)
        setLongitude(item.lon)
        setLocationStatus(`${item.name} (${item.lat.toFixed(4)}°, ${item.lon.toFixed(4)}°)`)
        setCityInput(item.name)
        setSearchingCity(false)
        return
      }

      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`)
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || "City not found. Please try another name.")
        }
        const data = await res.json()
        setLatitude(data.latitude)
        setLongitude(data.longitude)
        const displayName = data.display_name.split(",").slice(0, 2).join(",")
        setLocationStatus(`${displayName} (${data.latitude.toFixed(4)}°, ${data.longitude.toFixed(4)}°)`)
        setCityInput(displayName)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to locate city"
        setCityError(msg)
      } finally {
        setSearchingCity(false)
      }
    },
    [cityInput],
  )

  // Initial attempt to get GPS on mount
  useEffect(() => {
    detectDeviceLocation()
  }, [detectDeviceLocation])

  // Compress image via Canvas if needed
  const compressImage = useCallback(
    async (file: File): Promise<Blob> => {
      if (file.size <= COMPRESS_THRESHOLD) return file

      return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement("canvas")
          let { width, height } = img

          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            if (width > height) {
              height = (height / width) * MAX_DIMENSION
              width = MAX_DIMENSION
            } else {
              width = (width / height) * MAX_DIMENSION
              height = MAX_DIMENSION
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext("2d")!
          ctx.drawImage(img, 0, 0, width, height)
          canvas.toBlob(
            (blob) => resolve(blob || file),
            "image/jpeg",
            0.85,
          )
        }
        img.src = URL.createObjectURL(file)
      })
    },
    [],
  )

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      setError(null)

      // Validate type
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("Please select a JPG, PNG, or WebP image.")
        return
      }

      // Validate size
      if (file.size > MAX_FILE_SIZE) {
        setError("Image must be under 10MB.")
        return
      }

      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    },
    [],
  )

  const handleRemoveImage = useCallback(() => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (cameraInputRef.current) cameraInputRef.current.value = ""
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageFile || !user || latitude === null || longitude === null) return

    setSubmitting(true)
    setError(null)
    setUploadProgress(0)

    try {
      // 1. Compress if needed
      setUploadProgress(10)
      const blob = await compressImage(imageFile)

      // 2. Upload to Supabase Storage
      setUploading(true)
      setUploadProgress(20)
      const supabase = createBrowserClient()
      const ext = imageFile.name.split(".").pop() || "jpg"
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from("observations")
        .upload(path, blob, {
          contentType: "image/jpeg",
          upsert: false,
        })

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)
      setUploadProgress(70)

      // 3. Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("observations").getPublicUrl(path)

      setUploadProgress(80)

      // 4. Submit observation to backend
      const data = await api.post<ObservationCreateResponse>("/observations", {
        image_url: publicUrl,
        description: description || undefined,
        latitude,
        longitude,
        timestamp: timestamp.toISOString(),
      })

      setUploadProgress(100)

      // 5. Navigate to observation detail (shows processing animation)
      router.push(`/volunteer/observation/${data.observation.id}`)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Submission failed. Please try again."
      setError(message)
      setSubmitting(false)
      setUploading(false)
    }
  }

  const canSubmit =
    imageFile && latitude !== null && longitude !== null && !submitting

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Photo Upload */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-stone-800">
          Stream Photo
        </label>

        <AnimatePresence mode="wait">
          {imagePreview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative rounded-cozy-lg overflow-hidden border border-stone-200 shadow-cozy-sm"
            >
              <img
                src={imagePreview}
                alt="Stream observation preview"
                className="w-full max-h-72 object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-3 right-3 rounded-full bg-stone-900/60 p-1.5 text-white backdrop-blur-sm hover:bg-stone-900/80 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-cozy-lg border-2 border-dashed border-stone-300 bg-stone-50/50 p-8 text-center transition-colors hover:bg-stone-50 hover:border-stream-300"
            >
              <div className="mx-auto mb-3 h-12 w-12 rounded-cozy-lg bg-stone-100 flex items-center justify-center">
                <Camera className="h-6 w-6 text-stone-400" />
              </div>
              <p className="text-sm text-stone-600 mb-4">
                Tap to take a photo or select from gallery
              </p>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-cozy border border-stone-200 bg-surface px-4 py-2.5 text-sm font-medium text-stone-700 shadow-cozy-sm transition-all hover:bg-surface-hover hover:shadow-cozy"
                >
                  <Camera className="h-4 w-4" />
                  Camera
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-cozy border border-stone-200 bg-surface px-4 py-2.5 text-sm font-medium text-stone-700 shadow-cozy-sm transition-all hover:bg-surface-hover hover:shadow-cozy"
                >
                  <ImageIcon className="h-4 w-4" />
                  Gallery
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hidden file inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label
          htmlFor="description"
          className="text-sm font-semibold text-stone-800"
        >
          What did you see?
        </label>
        <div className="relative">
          <textarea
            id="description"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value.slice(0, 1000))
            }
            placeholder="Describe the stream conditions — water color, flow, any organisms you noticed, smells, anything unusual..."
            className="w-full rounded-cozy border border-stone-200 bg-surface px-4 py-3 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stream-400 focus:ring-2 focus:ring-stream-100 transition-colors min-h-[120px] resize-none"
          />
          <span className="absolute bottom-2.5 right-3 text-xs text-stone-400">
            {description.length}/1000
          </span>
        </div>
      </div>

      {/* Location Selection & Metadata */}
      <div className="space-y-3 rounded-cozy border border-stone-200 bg-stone-50/50 p-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-stone-800 flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-stream-500" />
            Location & City
          </label>
          <button
            type="button"
            onClick={detectDeviceLocation}
            disabled={detectingLocation}
            className="inline-flex items-center gap-1.5 rounded-cozy border border-stone-200 bg-surface px-2.5 py-1 text-xs font-medium text-stone-700 shadow-cozy-sm hover:bg-surface-hover hover:border-stream-300 transition-colors disabled:opacity-50"
          >
            {detectingLocation ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-stream-500" />
            ) : (
              <Navigation className="h-3.5 w-3.5 text-stream-500" />
            )}
            Auto-Detect GPS
          </button>
        </div>

        {/* Enter City Name Manually */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-stone-700 block">
            Enter City Name (Manual):
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={cityInput}
              onChange={(e) => {
                setCityInput(e.target.value)
                setCityError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleCitySearch()
                }
              }}
              placeholder="Type any city or river name (e.g. Munich, Lyon, Oxford, Venice, Porto)..."
              className="flex-1 rounded-cozy border border-stone-200 bg-surface px-3 py-2 text-xs text-stone-800 placeholder:text-stone-400 focus:border-stream-400 focus:ring-1 focus:ring-stream-400"
            />
            <button
              type="button"
              onClick={() => handleCitySearch()}
              disabled={searchingCity || !cityInput.trim()}
              className="inline-flex items-center gap-1.5 rounded-cozy bg-stream-500 px-3.5 py-2 text-xs font-semibold text-white shadow-cozy-sm hover:bg-stream-600 disabled:opacity-50 transition-colors shrink-0"
            >
              {searchingCity ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Search className="h-3.5 w-3.5" />
              )}
              Set City
            </button>
          </div>
          {cityError && (
            <p className="text-xs text-danger-600 mt-1">{cityError}</p>
          )}
        </div>

        {/* Pilot Cities Quick Select */}
        <div className="space-y-1.5 pt-1">
          <span className="text-xs font-medium text-stone-500 block">
            Or Quick-Select EU Pilot Basin:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {EU_PILOT_CITIES.map((city) => {
              const isSelected =
                latitude !== null &&
                longitude !== null &&
                Math.abs(latitude - city.lat) < 0.001 &&
                Math.abs(longitude - city.lon) < 0.001

              return (
                <button
                  key={city.name}
                  type="button"
                  onClick={() => selectPilotCity(city)}
                  className={`rounded-cozy px-2.5 py-1 text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-stream-500 text-white shadow-cozy-sm"
                      : "border border-stone-200 bg-surface text-stone-700 hover:bg-stone-100"
                  }`}
                >
                  {city.name}, {city.country}
                </button>
              )
            })}
          </div>
        </div>

        {/* Optional Coordinate Toggle */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowManualCoordinates((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 transition-colors"
          >
            <SlidersHorizontal className="h-3 w-3 text-stone-400" />
            <span>
              {showManualCoordinates
                ? "Hide coordinates"
                : "Show exact GPS coordinates (optional)"}
            </span>
          </button>
        </div>

        {/* Manual Latitude & Longitude Inputs (Optional) */}
        {showManualCoordinates && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-xs text-stone-500 block mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={latitude ?? ""}
                onChange={(e) => {
                  const val = e.target.value === "" ? null : parseFloat(e.target.value)
                  setLatitude(val)
                  if (val !== null && longitude !== null) {
                    setLocationStatus(`${val.toFixed(4)}°, ${longitude.toFixed(4)}° (Manual)`)
                  }
                }}
                placeholder="e.g. 40.2033"
                className="w-full rounded-cozy border border-stone-200 bg-surface px-3 py-1.5 text-xs text-stone-800 placeholder:text-stone-400 focus:border-stream-400 focus:ring-1 focus:ring-stream-400"
              />
            </div>
            <div>
              <label className="text-xs text-stone-500 block mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={longitude ?? ""}
                onChange={(e) => {
                  const val = e.target.value === "" ? null : parseFloat(e.target.value)
                  setLongitude(val)
                  if (latitude !== null && val !== null) {
                    setLocationStatus(`${latitude.toFixed(4)}°, ${val.toFixed(4)}° (Manual)`)
                  }
                }}
                placeholder="e.g. -8.4103"
                className="w-full rounded-cozy border border-stone-200 bg-surface px-3 py-1.5 text-xs text-stone-800 placeholder:text-stone-400 focus:border-stream-400 focus:ring-1 focus:ring-stream-400"
              />
            </div>
          </div>
        )}

        {/* Active Status Display */}
        <div className="flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-200/60">
          <span className="truncate">
            Target: <strong className="text-stone-700">{locationStatus}</strong>
          </span>
          <div className="flex items-center gap-1 shrink-0 text-stone-400">
            <Clock className="h-3 w-3" />
            <span>{format(timestamp, "MMM d, yyyy, h:mm a")}</span>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Uploading and processing...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-2 rounded-pill bg-stone-100 overflow-hidden">
            <motion.div
              className="h-full rounded-pill bg-stream-500"
              initial={{ width: "0%" }}
              animate={{ width: `${uploadProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-cozy bg-danger-50 px-4 py-3 text-sm text-danger-700">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="flex w-full items-center justify-center gap-2 rounded-cozy bg-stream-500 py-3.5 text-base font-semibold text-white shadow-cozy-sm transition-all hover:bg-stream-600 hover:shadow-cozy hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        {submitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Upload className="h-5 w-5" />
            Submit Observation
          </>
        )}
      </button>
    </form>
  )
}
