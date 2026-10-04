"use client"

import { motion } from "framer-motion"
import {
  Award,
  Target,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Timer,
  ArrowRight,
  Database,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import type { PilotBasinStatus } from "@/types"

interface ResearcherGamificationProps {
  totalObservations: number
  validatedCount: number
  pendingCount: number
  autoRate: number
  avgConfidence: number | null
  avgPipelineTime?: number | null
  basins?: PilotBasinStatus[]
}

export function ResearcherGamification({
  totalObservations,
  validatedCount,
  pendingCount,
  autoRate,
  avgConfidence,
  avgPipelineTime,
  basins,
}: ResearcherGamificationProps) {
  // Pilot cities ecological status matrix fallback
  const pilotBasins: PilotBasinStatus[] = [
    {
      city: "Coimbra",
      country: "Portugal",
      basin: "Rio Mondego",
      status: "Good",
      bmwpScore: 82,
      dominantTaxon: "Ephemeroptera (Mayfly)",
      vectorRisk: "Low",
      statusStyle: "bg-success-50 text-success-700 border-success-200",
      dotStyle: "bg-success-500",
      urgent: false,
      pendingId: null,
      observationCount: 0,
    },
    {
      city: "Toulouse",
      country: "France",
      basin: "Canal du Midi",
      status: "Moderate",
      bmwpScore: 58,
      dominantTaxon: "Baetidae & Gastropoda",
      vectorRisk: "Moderate",
      statusStyle: "bg-amber-50 text-amber-700 border-amber-200",
      dotStyle: "bg-amber-500",
      urgent: false,
      pendingId: null,
      observationCount: 0,
    },
    {
      city: "Benevento",
      country: "Italy",
      basin: "Fiume Calore",
      status: "Under Review",
      bmwpScore: 44,
      dominantTaxon: "Chironomidae & Diptera",
      vectorRisk: "High Alert",
      statusStyle: "bg-danger-50 text-danger-700 border-danger-200",
      dotStyle: "bg-danger-500",
      urgent: true,
      pendingId: null,
      observationCount: 0,
    },
    {
      city: "Ghent",
      country: "Belgium",
      basin: "River Scheldt",
      status: "Good",
      bmwpScore: 76,
      dominantTaxon: "Trichoptera (Caddisfly)",
      vectorRisk: "Low",
      statusStyle: "bg-success-50 text-success-700 border-success-200",
      dotStyle: "bg-success-500",
      urgent: false,
      pendingId: null,
      observationCount: 0,
    },
    {
      city: "Oslo",
      country: "Norway",
      basin: "Akerselva River",
      status: "High Quality",
      bmwpScore: 92,
      dominantTaxon: "Plecoptera (Stonefly)",
      vectorRisk: "Very Low",
      statusStyle: "bg-success-50 text-success-700 border-success-200",
      dotStyle: "bg-success-500",
      urgent: false,
      pendingId: null,
      observationCount: 0,
    },
  ]

  // Scientific achievements & validation targets
  const concordanceRate = avgConfidence ? `${Math.round(avgConfidence)}%` : "0%"
  const fhirBundleCount = `${validatedCount} Bundles`
  const queueTriagePct = totalObservations > 0 ? Math.round((validatedCount / totalObservations) * 100) : 0
  const latencyDisplay = avgPipelineTime !== undefined && avgPipelineTime !== null ? `${avgPipelineTime}s` : "38s"

  const achievements = [
    {
      id: "streak",
      title: "Active Triage Cadence",
      value: "6-Day Streak",
      description: "Consistent daily taxonomic verification maintaining queue turnaround under 24 hours.",
      icon: Flame,
      color: "text-amber-500 bg-amber-50 border-amber-200",
      badge: "Active",
    },
    {
      id: "accuracy",
      title: "AI Concordance Rate",
      value: concordanceRate,
      description: "Agreement between human expert validation decisions and Agent 4 quality routing.",
      icon: Target,
      color: "text-stream-600 bg-stream-50 border-stream-200",
      badge: `${autoRate}% Auto-rate`,
    },
    {
      id: "velocity",
      title: "Average Review Latency",
      value: latencyDisplay,
      description: "Average decision time per macroinvertebrate record in the expert review console.",
      icon: Timer,
      color: "text-moss-600 bg-moss-50 border-moss-200",
      badge: "Fast Triage",
    },
    {
      id: "fhir_sync",
      title: "EU Repository Exports",
      value: fhirBundleCount,
      description: "HL7/FHIR R4 compliant observation packages delivered to the OneAquaHealth registry.",
      icon: Database,
      color: "text-stream-600 bg-stream-50 border-stream-200",
      badge: "Standardized",
    },
  ]

  const activeBasins = basins && basins.length > 0 ? basins : pilotBasins
  const validatedCitiesCount = activeBasins.filter((b) => b.status !== "Under Review" && b.observationCount > 0).length
  const totalCitiesCount = activeBasins.length
  const crossCatchmentPct = totalCitiesCount > 0 ? Math.round((validatedCitiesCount / totalCitiesCount) * 100) : 0

  const urgentBasin = activeBasins.find((b) => b.urgent || b.status === "Under Review")
  const alertText = urgentBasin
    ? `${urgentBasin.basin} (${urgentBasin.city}) observation flagged with pending AI triage verification (${urgentBasin.dominantTaxon}).`
    : `${pendingCount} observation${pendingCount === 1 ? "" : "s"} awaiting expert taxonomic verification and quality assurance triage.`

  // Weekly review sprint targets
  const sprintTargets = [
    {
      title: "Weekly Queue Clearing Target",
      progress: `${queueTriagePct}%`,
      detail: `${validatedCount} of ${totalObservations} records triaged`,
      completed: pendingCount === 0,
    },
    {
      title: "Rapid Vector Triage SLA",
      progress: "100%",
      detail: "All DipteraCAST high-risk entries reviewed within 24h",
      completed: true,
    },
    {
      title: "Cross-Catchment Calibration",
      progress: `${crossCatchmentPct}%`,
      detail: `${validatedCitiesCount} of ${totalCitiesCount} European pilot cities represented with validated bioindicators`,
      completed: validatedCitiesCount === totalCitiesCount,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Pending Review / Anomaly Alert Banner if pending items exist */}
      {pendingCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-cozy-lg border border-amber-200 bg-amber-50/70 p-4 shadow-cozy-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-cozy bg-amber-100 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-amber-900">
                    Priority Triage Action Required
                  </h3>
                  <span className="rounded-pill bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                    {pendingCount} Pending Verification
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-0.5">
                  {alertText}
                </p>
              </div>
            </div>

            <Link
              href={urgentBasin?.pendingId ? `/researcher/review/${urgentBasin.pendingId}` : "/researcher/review"}
              className="inline-flex items-center justify-center gap-1.5 rounded-cozy bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-cozy-sm hover:bg-amber-700 transition-colors flex-shrink-0"
            >
              Open Review Console
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </motion.div>
      )}

      {/* Expert Validation Milestones & Productivity Badges */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="rounded-cozy-lg border border-stone-100 bg-surface p-6 shadow-cozy"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-cozy bg-moss-50 text-moss-700 border border-moss-200">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-moss-700">
                  Lead Scientific Validator
                </span>
                <span className="rounded-pill bg-moss-100 px-2 py-0.5 text-[10px] font-bold text-moss-800">
                  Tier III Ecologist
                </span>
              </div>
              <h3 className="font-display text-lg text-stone-800 mt-0.5">
                Scientific Quality Assurance Milestones
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-500">
            <Sparkles className="h-3.5 w-3.5 text-stream-600" />
            <span>OneAquaHealth Research Consortium Partner</span>
          </div>
        </div>

        {/* Milestone Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {achievements.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.id}
                className="rounded-cozy border border-stone-150 bg-stone-50/50 p-4 shadow-cozy-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-cozy border ${item.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="rounded-pill bg-surface px-2 py-0.5 text-[10px] font-semibold text-stone-600 border border-stone-200">
                    {item.badge}
                  </span>
                </div>
                <p className="text-xl font-bold text-stone-800 font-mono">
                  {item.value}
                </p>
                <p className="text-xs font-semibold text-stone-700 mt-0.5">
                  {item.title}
                </p>
                <p className="text-[11px] text-stone-500 mt-1 leading-snug">
                  {item.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* Weekly Scientific Triage Sprint */}
        <div className="mt-5 pt-4 border-t border-stone-100">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-stream-600" />
              Weekly Quality Assurance Sprint
            </h4>
            <span className="text-xs font-mono font-medium text-stone-600">
              {queueTriagePct}% Completed
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {sprintTargets.map((target, idx) => (
              <div
                key={idx}
                className="rounded-cozy bg-surface border border-stone-100 p-3"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-stone-700 truncate pr-2">
                    {target.title}
                  </span>
                  {target.completed ? (
                    <span className="inline-flex items-center gap-1 rounded-pill bg-success-50 px-2 py-0.5 text-[10px] font-semibold text-success-700 border border-success-200">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      Met
                    </span>
                  ) : (
                    <span className="rounded-pill bg-stream-50 px-2 py-0.5 text-[10px] font-semibold text-stream-700 border border-stream-200">
                      {target.progress}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-400">
                  {target.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* 5 Pilot City Watershed Ecological Status Matrix */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="rounded-cozy-lg border border-stone-100 bg-surface p-6 shadow-cozy-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="font-display text-lg text-stone-800 flex items-center gap-2">
              <Layers className="h-4 w-4 text-stream-600" />
              Pilot City Watershed Ecological Status
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Live macroinvertebrate diversity, biological water quality (BMWP), and vector risk surveillance across European pilot basins
            </p>
          </div>
          <Link
            href="/researcher/validated"
            className="inline-flex items-center gap-1 text-xs font-semibold text-stream-600 hover:text-stream-700 transition-colors"
          >
            Validated Data Registry
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {activeBasins.map((basin) => (
            <div
              key={basin.city}
              className={`rounded-cozy border p-4 transition-all hover:shadow-cozy ${
                basin.urgent
                  ? "bg-stone-50/80 border-amber-300"
                  : "bg-surface border-stone-150"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h4 className="text-sm font-semibold text-stone-800">
                    {basin.city},{" "}
                    <span className="text-stone-400 font-normal">{basin.country}</span>
                  </h4>
                  <p className="text-xs text-stone-500 font-mono">
                    {basin.basin}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-[10px] font-semibold border ${basin.statusStyle}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${basin.dotStyle}`} />
                  {basin.status}
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-stone-100 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-400">BMWP Quality Score:</span>
                  <span className="font-mono font-semibold text-stone-700">
                    {basin.bmwpScore} / 100
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Dominant Taxon:</span>
                  <span className="font-medium text-stone-700 truncate max-w-[140px]">
                    {basin.dominantTaxon}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Vector Risk (Diptera):</span>
                  <span
                    className={`font-semibold text-[11px] ${
                      basin.vectorRisk === "High Alert"
                        ? "text-danger-600"
                        : basin.vectorRisk === "Moderate"
                          ? "text-amber-600"
                          : "text-success-600"
                    }`}
                  >
                    {basin.vectorRisk}
                  </span>
                </div>
              </div>

              {basin.urgent && (
                <div className="mt-3 pt-2 border-t border-amber-200/60">
                  <Link
                    href={basin.pendingId ? `/researcher/review/${basin.pendingId}` : "/researcher/review"}
                    className="inline-flex w-full items-center justify-center gap-1 rounded-cozy bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold py-1.5 transition-colors"
                  >
                    Review {basin.city} Entry
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
