"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Circle, Loader2 } from "lucide-react"
import { api } from "@/lib/api"

type StepStatus = "waiting" | "processing" | "complete" | "error"

interface AgentStep {
  id: string
  label: string
  status: StepStatus
  summary?: string
}

const INITIAL_STEPS: AgentStep[] = [
  { id: "vision", label: "Identifying species...", status: "waiting" },
  { id: "description", label: "Reading your description...", status: "waiting" },
  { id: "metadata", label: "Checking location...", status: "waiting" },
  { id: "quality", label: "Calculating quality score...", status: "waiting" },
  { id: "impact", label: "Generating impact & FHIR...", status: "waiting" },
]

/**
 * Processing animation — SSE-driven 5-step agent progress.
 *
 * DOC-09 Lines 416–444
 * DOC-11 Lines 595–625 (SSE consumption pattern)
 */
export function ProcessingAnimation({
  observationId,
  imageUrl,
  onComplete,
}: {
  observationId: string
  imageUrl: string
  onComplete: () => void
}) {
  const [steps, setSteps] = useState<AgentStep[]>(INITIAL_STEPS)
  const [progressPercent, setProgressPercent] = useState(0)

  useEffect(() => {
    // Map agent names from SSE to our step IDs
    const agentMap: Record<string, string> = {
      vision: "vision",
      description: "description",
      metadata: "metadata",
      quality: "quality",
      fhir: "impact",
      impact: "impact",
      expert_brief: "impact",
    }

    let completedCount = 0

    // Poll status as fallback since SSE needs auth headers
    const pollInterval = setInterval(async () => {
      try {
        const data = await api.get<{ status: string; agent_statuses: Array<{ agent: string; status: string }> }>(
          `/observations/${observationId}/status`,
        )

        const newSteps = [...INITIAL_STEPS]
        data.agent_statuses.forEach((agentStatus) => {
          const stepId = agentMap[agentStatus.agent]
          if (!stepId) return
          const step = newSteps.find((s) => s.id === stepId)
          if (step) {
            if (agentStatus.status === "success" || agentStatus.status === "complete") {
              step.status = "complete"
            } else if (agentStatus.status === "error") {
              step.status = "error"
            } else if (agentStatus.status !== "pending") {
              step.status = "processing"
            }
          }
        })

        // Set first non-complete step to processing
        const firstPending = newSteps.find((s) => s.status === "waiting")
        if (firstPending && data.status === "processing") {
          firstPending.status = "processing"
        }

        completedCount = newSteps.filter((s) => s.status === "complete").length
        setProgressPercent(Math.round((completedCount / newSteps.length) * 100))
        setSteps(newSteps)

        // Pipeline complete
        if (
          data.status !== "processing" &&
          data.status !== "submitted"
        ) {
          clearInterval(pollInterval)
          // Small delay for the final animation
          setTimeout(onComplete, 800)
        }
      } catch {
        // Silently retry
      }
    }, 1500)

    return () => clearInterval(pollInterval)
  }, [observationId, onComplete])

  const completedSteps = steps.filter((s) => s.status === "complete").length
  const currentStep = completedSteps + 1

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center">
        <h2 className="font-display text-2xl text-stone-800">
          Analyzing your observation...
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Our AI agents are processing your submission
        </p>
      </div>

      {/* Photo (blurred) */}
      <div className="relative rounded-cozy-lg overflow-hidden border border-stone-200 shadow-cozy">
        <img
          src={imageUrl}
          alt="Your stream observation"
          className="w-full max-h-48 object-cover"
          style={{ filter: "blur(2px) brightness(0.9)" }}
        />
        <div className="absolute inset-0 bg-stone-900/10" />
      </div>

      {/* Agent Steps */}
      <div className="space-y-2">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className="flex items-center gap-3 rounded-cozy border border-stone-100 bg-surface px-4 py-3 shadow-cozy-sm"
          >
            {/* Status Icon */}
            <AnimatePresence mode="wait">
              {step.status === "complete" ? (
                <motion.div
                  key="done"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <CheckCircle2 className="h-5 w-5 text-success-500" />
                </motion.div>
              ) : step.status === "processing" ? (
                <motion.div key="loading">
                  <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
                </motion.div>
              ) : step.status === "error" ? (
                <motion.div key="error">
                  <Circle className="h-5 w-5 text-danger-500" />
                </motion.div>
              ) : (
                <Circle className="h-5 w-5 text-stone-300" />
              )}
            </AnimatePresence>

            {/* Label + Summary */}
            <div className="flex-1">
              <p
                className={`text-sm ${
                  step.status === "complete"
                    ? "text-stone-700 font-medium"
                    : step.status === "processing"
                      ? "text-stone-800 font-medium"
                      : "text-stone-400"
                }`}
              >
                {step.label}
              </p>
              {step.summary && (
                <p className="text-xs text-stream-600 mt-0.5">
                  {step.summary}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-stone-500">
          <span>
            Agent {Math.min(currentStep, steps.length)} of {steps.length}
          </span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-2 rounded-pill bg-stone-100 overflow-hidden">
          <motion.div
            className="h-full rounded-pill bg-stream-500"
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  )
}
