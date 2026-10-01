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
  const [timestamp] = useState(new Date())
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get GPS on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("Location not available")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude)
        setLongitude(pos.coords.longitude)
        setLocationStatus(
          `${pos.coords.latitude.toFixed(4)}°, ${pos.coords.longitude.toFixed(4)}°`,
        )
      },
      (err) => {
        console.error("GPS error:", err)
        setLocationStatus("Unable to get location")
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [])

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

      {/* Auto-Captured Metadata */}
      <div className="flex flex-col gap-2 rounded-cozy border border-stone-200 bg-stone-50/50 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-stone-600">
          <MapPin className="h-4 w-4 text-stream-500" />
          <span>{locationStatus}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-stone-600">
          <Clock className="h-4 w-4 text-stream-500" />
          <span>{format(timestamp, "MMM d, yyyy, h:mm a")}</span>
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
