"use client"

import { motion } from "framer-motion"
import {
  Award,
  Trophy,
  Target,
  Compass,
  ShieldCheck,
  Sparkles,
  Droplets,
  Flame,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ChevronRight,
  Leaf,
} from "lucide-react"
import Link from "next/link"

interface VolunteerGamificationProps {
  totalObservations: number
  validatedObservations: number
}

interface Badge {
  id: string
  title: string
  category: string
  description: string
  icon: typeof Award
  status: "unlocked" | "in_progress" | "locked"
  progressText?: string
  progressPercent?: number
  accentColor: string
}

export function VolunteerGamification({
  totalObservations,
  validatedObservations,
}: VolunteerGamificationProps) {
  // Compute dynamic XP and rank based on observations
  const currentXP = 240 + totalObservations * 65 + validatedObservations * 40
  const nextLevelXP = 600
  const xpPercent = Math.min(Math.round((currentXP / nextLevelXP) * 100), 100)
  const currentRank = totalObservations >= 5 ? "Stream Guardian" : totalObservations >= 2 ? "River Sentinel" : "Bioindicator Scout"
  const currentLevel = totalObservations >= 5 ? 3 : totalObservations >= 2 ? 2 : 1

  const badges: Badge[] = [
    {
      id: "first_ripple",
      title: "First Ripple",
      category: "Field Biomonitoring",
      description: "Submitted your first authenticated stream macroinvertebrate observation.",
      icon: Droplets,
      status: "unlocked",
      accentColor: "text-stream-600 bg-stream-50 border-stream-200",
    },
    {
      id: "ept_detective",
      title: "EPT Detective",
      category: "Bioindicator Mastery",
      description: "Identified sensitive Ephemeroptera, Plecoptera, or Trichoptera taxa.",
      icon: Sparkles,
      status: "unlocked",
      accentColor: "text-moss-600 bg-moss-50 border-moss-200",
    },
    {
      id: "basin_explorer",
      title: "Basin Explorer",
      category: "Catchment Reach",
      description: "Mapped freshwater quality across 2 or more European pilot stream basins.",
      icon: Compass,
      status: "unlocked",
      accentColor: "text-amber-600 bg-amber-50 border-amber-200",
    },
    {
      id: "health_sentinel",
      title: "One Health Sentinel",
      category: "Epidemiological Early-Warning",
      description: "Recorded water clarity and flow speed data to calibrate DipteraCAST vector models.",
      icon: ShieldCheck,
      status: "unlocked",
      accentColor: "text-stream-600 bg-stream-50 border-stream-200",
    },
    {
      id: "precision_scout",
      title: "Precision Scout",
      category: "Data Quality",
      description: "Achieved 85%+ AI triage confidence across 5 validated field observations.",
      icon: Target,
      status: "in_progress",
      progressText: "4 / 5 Observations",
      progressPercent: 80,
      accentColor: "text-stone-600 bg-stone-100 border-stone-200",
    },
    {
      id: "four_seasons",
      title: "Seasonal Surveyor",
      category: "Temporal Coverage",
      description: "Record ecological baseline observations across autumn, winter, spring, and summer.",
      icon: Trophy,
      status: "locked",
      progressText: "1 / 4 Seasons",
      progressPercent: 25,
      accentColor: "text-stone-400 bg-stone-50 border-stone-200",
    },
  ]

  const quests = [
    {
      id: "quest_1",
      title: "Akerselva & Calore Coldwater Run",
      reward: "+75 XP",
      difficulty: "Intermediate",
      description: "Sample shaded riffles or fast-flowing gravel beds to calibrate BioCLIP mayfly models.",
      progress: "2 / 2 Completed",
      completed: true,
    },
    {
      id: "quest_2",
      title: "Water Clarity & Algae Bloom Assessment",
      reward: "+45 XP",
      difficulty: "Quick Survey",
      description: "Log water transparency and algae presence in warm weather pool margins.",
      progress: "1 / 1 Completed",
      completed: true,
    },
    {
      id: "quest_3",
      title: "Multi-Basin Comparative Survey",
      reward: "+100 XP",
      difficulty: "Field Challenge",
      description: "Contribute an observation from an urban pilot stream outside your primary catchment.",
      progress: "1 / 2 Basins",
      completed: false,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Level & XP Progress Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="rounded-cozy-lg border border-stone-100 bg-surface p-6 shadow-cozy"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-cozy bg-stream-50 text-stream-600 border border-stream-100">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-stream-600">
                  Citizen Science Level {currentLevel}
                </span>
                <span className="rounded-pill bg-stream-100/70 px-2 py-0.5 text-[10px] font-bold text-stream-800">
                  {currentRank}
                </span>
              </div>
              <h3 className="font-display text-lg text-stone-800 mt-0.5">
                {currentRank} · {currentXP} XP
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-500">
            <Flame className="h-4 w-4 text-amber-500" />
            <span>
              Next Rank: <strong className="text-stone-700">Master Bioindicator</strong> at {nextLevelXP} XP
            </span>
          </div>
        </div>

        {/* XP Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-stone-400 mb-1.5 font-mono">
            <span>Progress to Level {currentLevel + 1}</span>
            <span>{currentXP} / {nextLevelXP} XP ({xpPercent}%)</span>
          </div>
          <div className="h-2.5 w-full rounded-pill bg-stone-100 overflow-hidden">
            <motion.div
              className="h-full rounded-pill bg-gradient-to-r from-stream-500 to-moss-500"
              initial={{ width: "0%" }}
              animate={{ width: `${xpPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Milestone perks */}
        <div className="mt-4 pt-4 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-success-600 flex-shrink-0" />
            <span>+100 XP per BioCLIP Validated Taxon</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-success-600 flex-shrink-0" />
            <span>+50 XP for Sensitive Bioindicators (EPT)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-success-600 flex-shrink-0" />
            <span>+30 XP for Complete Hydro-Parameters</span>
          </div>
        </div>
      </motion.div>

      {/* Badges & Achievements Shelf */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg text-stone-800 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Achievements & Badges
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Recognizing your scientific rigor and freshwater stewardship
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-pill bg-stone-100 text-stone-600">
            4 Unlocked / 6 Total
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {badges.map((badge) => {
            const Icon = badge.icon
            const isUnlocked = badge.status === "unlocked"
            const isInProgress = badge.status === "in_progress"

            return (
              <div
                key={badge.id}
                className={`relative flex flex-col justify-between rounded-cozy-lg border p-4 shadow-cozy-sm transition-all hover:shadow-cozy ${
                  isUnlocked
                    ? "bg-surface border-stone-150"
                    : isInProgress
                      ? "bg-surface border-stone-200"
                      : "bg-stone-50/70 border-stone-200/80 opacity-75"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-cozy border ${badge.accentColor}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    {isUnlocked ? (
                      <span className="inline-flex items-center gap-1 rounded-pill bg-success-50 px-2 py-0.5 text-[10px] font-semibold text-success-700 border border-success-200">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        Unlocked
                      </span>
                    ) : isInProgress ? (
                      <span className="inline-flex items-center gap-1 rounded-pill bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
                        <Clock className="h-2.5 w-2.5" />
                        In Progress
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-pill bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-400">
                        Locked
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                    {badge.category}
                  </p>
                  <h4 className="text-sm font-semibold text-stone-800 mt-0.5">
                    {badge.title}
                  </h4>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                    {badge.description}
                  </p>
                </div>

                {(isInProgress || badge.status === "locked") && badge.progressText && (
                  <div className="mt-3 pt-3 border-t border-stone-100">
                    <div className="flex justify-between text-[11px] text-stone-400 font-mono mb-1">
                      <span>Progress</span>
                      <span>{badge.progressText}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-pill bg-stone-100 overflow-hidden">
                      <div
                        className="h-full rounded-pill bg-stream-400"
                        style={{ width: `${badge.progressPercent || 0}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Biomonitoring Field Missions / Challenges */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="rounded-cozy-lg border border-stone-100 bg-surface p-6 shadow-cozy-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="font-display text-lg text-stone-800 flex items-center gap-2">
              <Target className="h-4 w-4 text-stream-600" />
              Active Field Missions
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Weekly biomonitoring objectives targeted to fill regional watershed sampling gaps
            </p>
          </div>
          <Link
            href="/volunteer/map"
            className="inline-flex items-center gap-1 text-xs font-semibold text-stream-600 hover:text-stream-700 transition-colors"
          >
            Explore Sampling Map
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="space-y-3">
          {quests.map((quest) => (
            <div
              key={quest.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-cozy border border-stone-100 bg-stone-50/60 hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-cozy text-xs font-bold ${
                    quest.completed
                      ? "bg-success-100 text-success-700"
                      : "bg-stream-100 text-stream-700"
                  }`}
                >
                  {quest.completed ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-semibold text-stone-800">
                      {quest.title}
                    </h4>
                    <span className="rounded-pill bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                      {quest.reward}
                    </span>
                    <span className="rounded-pill bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-500">
                      {quest.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    {quest.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 pl-10 sm:pl-0">
                <span className="text-xs font-mono font-medium text-stone-600">
                  {quest.progress}
                </span>
                {quest.completed ? (
                  <span className="rounded-cozy bg-success-50 px-2.5 py-1 text-xs font-medium text-success-700">
                    Done
                  </span>
                ) : (
                  <Link
                    href="/volunteer/submit"
                    className="inline-flex items-center gap-1 rounded-cozy bg-stream-500 px-2.5 py-1 text-xs font-medium text-white shadow-cozy-sm hover:bg-stream-600 transition-colors"
                  >
                    Survey
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Community Eco-Impact Summary Grid */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4 }}
        className="rounded-cozy-lg border border-stone-100 bg-surface p-6 shadow-cozy-sm"
      >
        <div className="mb-4">
          <h2 className="font-display text-lg text-stone-800 flex items-center gap-2">
            <Leaf className="h-4 w-4 text-moss-600" />
            Ecological Protection Impact
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            How your field submissions power OneAquaHealth water quality and disease early-warning systems
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-cozy border border-stone-100 bg-stone-50/50 p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
              Catchments Monitored
            </p>
            <p className="text-xl font-bold text-stone-800 mt-1">4 Pilot Basins</p>
            <p className="text-[11px] text-stone-400 mt-0.5">Mondego, Midi, Calore, Akerselva</p>
          </div>

          <div className="rounded-cozy border border-stone-100 bg-stone-50/50 p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
              Mean BMWP Health
            </p>
            <p className="text-xl font-bold text-moss-700 mt-1">7.4 / 10</p>
            <p className="text-[11px] text-stone-400 mt-0.5">Good Ecological Quality</p>
          </div>

          <div className="rounded-cozy border border-stone-100 bg-stone-50/50 p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
              FHIR Records Generated
            </p>
            <p className="text-xl font-bold text-stream-700 mt-1">4 Bundles</p>
            <p className="text-[11px] text-stone-400 mt-0.5">Standardized HL7/FHIR R4</p>
          </div>

          <div className="rounded-cozy border border-stone-100 bg-stone-50/50 p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
              Community Standing
            </p>
            <p className="text-xl font-bold text-amber-700 mt-1">Top 10%</p>
            <p className="text-[11px] text-stone-400 mt-0.5">Citizen Scientist Rank</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
