"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { SubmissionForm } from "@/components/volunteer/submission-form"

/**
 * Submit observation page — wraps the submission form with nav.
 */
export default function SubmitPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          href="/volunteer/dashboard"
          className="mt-1 rounded-cozy p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-display text-2xl text-stone-800">
            Submit Observation
          </h1>
          <p className="mt-1 text-sm text-stone-500 max-w-2xl leading-relaxed">
            Upload macroinvertebrate photos from your local stream. Our 7-agent AI pipeline identifies species, validates GPS coordinates, scores ecological water quality, and generates your personal health impact receipt.
          </p>
        </div>
      </div>

      {/* Form */}
      <SubmissionForm />
    </div>
  )
}
