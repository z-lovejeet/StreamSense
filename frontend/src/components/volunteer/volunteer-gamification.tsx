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
import type { VolunteerStats } from "@/types"

interface VolunteerGamificationProps {
  stats: VolunteerStats
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

export function VolunteerGamification({ stats }: VolunteerGamificationProps) {
  const {
    total_observations,
    validated_count,
    unique_species,
    ept_taxa_found,
    unique_cities,
    high_confidence_validated,
    seasons_observed,
    fhir_count,
    descriptive_observations,
    mean_bmwp,
  } = stats

  // Dynamic XP: 50 per submission + 75 per validated + 100 per EPT taxon + 30 per description
  const currentXP =
    total_observations * 50 +
    validated_count * 75 +
    ept_taxa_found.length * 100 +
    descriptive_observations * 30

  // Leveling thresholds
  const levels = [
    { min: 0, rank: "Bioindicator Scout", next: "River Sentinel" },
    { min: 300, rank: "River Sentinel", next: "Stream Guardian" },
    { min: 800, rank: "Stream Guardian", next: "Master Bioindicator" },
    { min: 1500, rank: "Master Bioindicator", next: "Aquatic Ecologist" },
    { min: 3000, rank: "Aquatic Ecologist", next: "OneHealth Champion" },
  ]
  let currentLevel = 1
  let currentRank = levels[0].rank
  let nextRank = levels[0].next
  let nextLevelXP = levels[1]?.min || 300
  for (let i = levels.length - 1; i >= 0; i--) {
    if (currentXP >= levels[i].min) {
      currentLevel = i + 1
      currentRank = levels[i].rank
      nextRank = levels[i].next
      nextLevelXP = levels[i + 1]?.min || levels[i].min + 500
      break
    }
  }
  const xpPercent = Math.min(Math.round((currentXP / nextLevelXP) * 100), 100)

  // Dynamic badges computed from real data
  const badges: Badge[] = [
    {
      id: "first_ripple",
      title: "First Ripple",
      category: "Field Biomonitoring",
      description: "Submitted your first authenticated stream macroinvertebrate observation.",
      icon: Droplets,
      status: total_observations >= 1 ? "unlocked" : "locked",
      progressText: total_observations >= 1 ? undefined : "0 / 1 Observation",
      progressPercent: total_observations >= 1 ? undefined : 0,
      accentColor: total_observations >= 1
        ? "text-stream-600 bg-stream-50 border-stream-200"
        : "text-stone-400 bg-stone-50 border-stone-200",
    },
    {
      id: "ept_detective",
      title: "EPT Detective",
      category: "Bioindicator Mastery",
      description: "Identified sensitive Ephemeroptera, Plecoptera, or Trichoptera taxa.",
      icon: Sparkles,
      status: ept_taxa_found.length > 0 ? "unlocked" : "locked",
      progressText: ept_taxa_found.length > 0 ? undefined : "0 EPT taxa found",
      progressPercent: ept_taxa_found.length > 0 ? undefined : 0,
      accentColor: ept_taxa_found.length > 0
        ? "text-moss-600 bg-moss-50 border-moss-200"
        : "text-stone-400 bg-stone-50 border-stone-200",
    },
    {
      id: "basin_explorer",
      title: "Basin Explorer",
      category: "Catchment Reach",
      description: "Mapped freshwater quality across 2 or more European pilot stream basins.",
      icon: Compass,
      status: unique_cities.length >= 2 ? "unlocked" : unique_cities.length >= 1 ? "in_progress" : "locked",
      progressText: unique_cities.length < 2 ? `${unique_cities.length} / 2 Basins` : undefined,
      progressPercent: unique_cities.length < 2 ? Math.round((unique_cities.length / 2) * 100) : undefined,
      accentColor: unique_cities.length >= 2
        ? "text-amber-600 bg-amber-50 border-amber-200"
        : "text-stone-600 bg-stone-100 border-stone-200",
    },
    {
      id: "health_sentinel",
      title: "One Health Sentinel",
      category: "Epidemiological Early-Warning",
      description: "Provided detailed environmental descriptions to calibrate DipteraCAST vector models.",
      icon: ShieldCheck,
      status: descriptive_observations >= 3 ? "unlocked" : descriptive_observations >= 1 ? "in_progress" : "locked",
      progressText: descriptive_observations < 3 ? `${descriptive_observations} / 3 Descriptions` : undefined,
      progressPercent: descriptive_observations < 3 ? Math.round((descriptive_observations / 3) * 100) : undefined,
      accentColor: descriptive_observations >= 3
        ? "text-stream-600 bg-stream-50 border-stream-200"
        : "text-stone-600 bg-stone-100 border-stone-200",
    },
    {
      id: "precision_scout",
      title: "Precision Scout",
      category: "Data Quality",
      description: "Achieved 85%+ AI triage confidence across 5 validated field observations.",
      icon: Target,
      status: high_confidence_validated >= 5 ? "unlocked" : high_confidence_validated >= 1 ? "in_progress" : "locked",
      progressText: high_confidence_validated < 5 ? `${high_confidence_validated} / 5 Observations` : undefined,
      progressPercent: high_confidence_validated < 5 ? Math.round((high_confidence_validated / 5) * 100) : undefined,
      accentColor: high_confidence_validated >= 5
        ? "text-stream-600 bg-stream-50 border-stream-200"
        : "text-stone-600 bg-stone-100 border-stone-200",
    },
    {
      id: "four_seasons",
      title: "Seasonal Surveyor",
      category: "Temporal Coverage",
      description: "Record ecological baseline observations across autumn, winter, spring, and summer.",
      icon: Trophy,
      status: seasons_observed.length >= 4 ? "unlocked" : seasons_observed.length >= 1 ? "in_progress" : "locked",
      progressText: seasons_observed.length < 4 ? `${seasons_observed.length} / 4 Seasons` : undefined,
      progressPercent: seasons_observed.length < 4 ? Math.round((seasons_observed.length / 4) * 100) : undefined,
      accentColor: seasons_observed.length >= 4
        ? "text-amber-600 bg-amber-50 border-amber-200"
        : "text-stone-400 bg-stone-50 border-stone-200",
    },
  ]

  const unlockedCount = badges.filter(b => b.status === "unlocked").length

  // Dynamic missions based on actual data
  const missions = [
    {
      id: "mission_species",
      title: "Species Diversity Survey",
      reward: `+${(3 - Math.min(unique_species.length, 3)) * 75} XP`,
      difficulty: unique_species.length >= 2 ? "Intermediate" : "Beginner",
      description: "Identify 3 different macroinvertebrate taxa across your stream observations.",
      progress: `${Math.min(unique_species.length, 3)} / 3 Species`,
      completed: unique_species.length >= 3,
    },
    {
      id: "mission_quality",
      title: "High-Quality Submission Challenge",
      reward: "+100 XP",
      difficulty: "Quick Survey",
      description: "Submit an observation that achieves 80%+ AI confidence with a detailed environmental description.",
      progress: `${Math.min(high_confidence_validated, 3)} / 3 High-Quality`,
      completed: high_confidence_validated >= 3,
    },
    {
      id: "mission_basin",
      title: "Multi-Basin Comparative Survey",
      reward: "+150 XP",
      difficulty: "Field Challenge",
      description: "Contribute observations from 2 different European pilot stream basins.",
      progress: `${Math.min(unique_cities.length, 2)} / 2 Basins`,
      completed: unique_cities.length >= 2,
    },
  ]

  // Dynamic eco-impact stats
  const bmwpLabel =
    mean_bmwp >= 7 ? "Good Ecological Quality" :
    mean_bmwp >= 4 ? "Moderate Ecological Quality" :
    mean_bmwp >= 1 ? "Poor Ecological Quality" :
    "No Data Available"

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
                {currentRank} -- {currentXP} XP
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-500">
            <Flame className="h-4 w-4 text-amber-500" />
            <span>
              Next Rank: <strong className="text-stone-700">{nextRank}</strong> at {nextLevelXP} XP
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

        {/* XP Breakdown */}
        <div className="mt-4 pt-4 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-success-600 flex-shrink-0" />
            <span>+50 XP per Submission ({total_observations} earned)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-success-600 flex-shrink-0" />
            <span>+75 XP per Validated ({validated_count} earned)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-success-600 flex-shrink-0" />
            <span>+100 XP per EPT Taxon ({ept_taxa_found.length} earned)</span>
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
            {unlockedCount} Unlocked / {badges.length} Total
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

      {/* Dynamic Field Missions */}
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
              Biomonitoring objectives to improve your data quality and coverage
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
          {missions.map((mission) => (
            <div
              key={mission.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-cozy border border-stone-100 bg-stone-50/60 hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-cozy text-xs font-bold ${
                    mission.completed
                      ? "bg-success-100 text-success-700"
                      : "bg-stream-100 text-stream-700"
                  }`}
                >
                  {mission.completed ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-semibold text-stone-800">
                      {mission.title}
                    </h4>
                    {!mission.completed && (
                      <span className="rounded-pill bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                        {mission.reward}
                      </span>
                    )}
                    <span className="rounded-pill bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-500">
                      {mission.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    {mission.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 pl-10 sm:pl-0">
                <span className="text-xs font-mono font-medium text-stone-600">
                  {mission.progress}
                </span>
                {mission.completed ? (
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

      {/* Dynamic Eco-Impact Summary */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4 }}
        className="rounded-cozy-lg border border-stone-100 bg-surface p-6 shadow-cozy-sm"
      >
        <div className="mb-4">
          <h2 className="font-display text-lg text-stone-800 flex items-center gap-2">
            <Leaf className="h-4 w-4 text-moss-600" />
            Your Ecological Impact
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            How your field submissions power OneAquaHealth water quality and disease early-warning systems
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-cozy border border-stone-100 bg-stone-50/50 p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
              Basins Monitored
            </p>
            <p className="text-xl font-bold text-stone-800 mt-1">
              {unique_cities.length} {unique_cities.length === 1 ? "Basin" : "Basins"}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              {unique_cities.length > 0 ? unique_cities.join(", ") : "Submit your first observation"}
            </p>
          </div>

          <div className="rounded-cozy border border-stone-100 bg-stone-50/50 p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
              Mean BMWP Health
            </p>
            <p className={`text-xl font-bold mt-1 ${mean_bmwp >= 7 ? "text-moss-700" : mean_bmwp >= 4 ? "text-amber-700" : "text-stone-800"}`}>
              {mean_bmwp > 0 ? `${mean_bmwp} / 10` : "--"}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">{bmwpLabel}</p>
          </div>

          <div className="rounded-cozy border border-stone-100 bg-stone-50/50 p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
              FHIR Records Generated
            </p>
            <p className="text-xl font-bold text-stream-700 mt-1">
              {fhir_count} {fhir_count === 1 ? "Bundle" : "Bundles"}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">Standardized HL7/FHIR R4</p>
          </div>

          <div className="rounded-cozy border border-stone-100 bg-stone-50/50 p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
              Species Identified
            </p>
            <p className="text-xl font-bold text-amber-700 mt-1">
              {unique_species.length} {unique_species.length === 1 ? "Taxon" : "Taxa"}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5 truncate">
              {unique_species.length > 0
                ? unique_species.slice(0, 3).map(s => TAXA_COMMON_NAMES[s] || s).join(", ")
                : "No species identified yet"}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
