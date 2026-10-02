import Link from "next/link"
import {
  Camera,
  Bot,
  HeartPulse,
  Droplets,
  Shield,
  Globe,
  ArrowRight,
  Waves,
  Microscope,
  Activity,
} from "lucide-react"

const PILOT_CITIES = [
  "Coimbra",
  "Toulouse",
  "Benevento",
  "Ghent",
  "Oslo",
]

const STEPS = [
  {
    icon: Camera,
    step: "01",
    title: "Snap a photo",
    description:
      "Photograph aquatic macroinvertebrates in your local stream. Our mobile-first form captures GPS and timestamp automatically.",
  },
  {
    icon: Bot,
    step: "02",
    title: "AI identifies & scores",
    description:
      "Seven specialised AI agents identify species, validate metadata, score water quality, and generate a FHIR health record — in under 5 seconds.",
  },
  {
    icon: HeartPulse,
    step: "03",
    title: "Protect community health",
    description:
      "Your data flows to researchers who track disease-vector populations. Healthy streams mean fewer mosquito-borne illnesses in your neighbourhood.",
  },
]

const FEATURES = [
  {
    icon: Microscope,
    title: "7-Agent AI Pipeline",
    description:
      "BioCLIP vision model + Gemini + Groq LLMs work in parallel to identify species, extract environmental parameters, and validate your observation.",
    color: "bg-stream-100 text-stream-700",
  },
  {
    icon: Shield,
    title: "FHIR R4 Interoperability",
    description:
      "Every validated observation becomes a standards-compliant HL7 FHIR resource, posted to the OneAquaHealth European sandbox.",
    color: "bg-moss-100 text-moss-700",
  },
  {
    icon: Activity,
    title: "One Health Early Warning",
    description:
      "DipteraCAST integration links stream macroinvertebrate data to disease-vector forecasts — turning ecology into public health intelligence.",
    color: "bg-amber-100 text-amber-700",
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden px-6 pt-16 pb-20 sm:px-8 md:pt-24 md:pb-28">
        {/* Subtle gradient background */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-stream-50/40 via-transparent to-transparent" />

        <div className="relative mx-auto max-w-3xl text-center">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-cozy-xl bg-stream-100 shadow-cozy-sm">
              <Waves className="h-8 w-8 text-stream-600" />
            </div>
          </div>

          {/* Title */}
          <h1 className="font-display text-4xl tracking-tight text-stone-900 sm:text-5xl md:text-6xl">
            AI-Powered Citizen Science{" "}
            <span className="text-stream-600">for Urban Stream Health</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-stone-500">
            Snap a photo of stream life. Our multi-agent AI identifies species,
            scores water quality, and sends the data to health researchers —
            all in seconds.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-cozy bg-stream-500 px-7 py-3 text-sm font-semibold text-white shadow-cozy transition-all hover:bg-stream-600 hover:shadow-cozy-lg hover:-translate-y-0.5"
            >
              I&apos;m a Volunteer
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-cozy border border-stone-200 bg-surface px-7 py-3 text-sm font-semibold text-stone-700 shadow-cozy-sm transition-all hover:bg-surface-hover hover:shadow-cozy"
            >
              I&apos;m a Researcher
            </Link>
          </div>

          {/* Pilot Cities */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            <span className="mr-1 text-xs font-medium uppercase tracking-wider text-stone-400">
              Pilot cities
            </span>
            {PILOT_CITIES.map((city) => (
              <span
                key={city}
                className="rounded-pill bg-stream-50 px-3 py-1 text-xs font-medium text-stream-700"
              >
                {city}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="bg-surface border-y border-stone-100 px-6 py-16 sm:px-8 md:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="font-display text-2xl text-stone-900 sm:text-3xl">
              How It Works
            </h2>
            <p className="mt-3 text-sm text-stone-500">
              From stream bank to health dashboard in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, step, title, description }) => (
              <div key={step} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-cozy-lg bg-stream-50">
                  <Icon className="h-6 w-6 text-stream-600" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-stream-400">
                  Step {step}
                </span>
                <h3 className="mt-1 text-base font-semibold text-stone-800">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="px-6 py-16 sm:px-8 md:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="font-display text-2xl text-stone-900 sm:text-3xl">
              Built for Impact
            </h2>
            <p className="mt-3 text-sm text-stone-500">
              Every feature connects citizen observations to real health outcomes
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description, color }) => (
              <div
                key={title}
                className="rounded-cozy-lg border border-stone-100 bg-surface p-6 shadow-cozy-sm transition-all hover:shadow-cozy hover:-translate-y-0.5"
              >
                <div
                  className={`mb-4 flex h-10 w-10 items-center justify-center rounded-cozy ${color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-stone-800">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ONE HEALTH CONNECTION ─── */}
      <section className="border-t border-stone-100 bg-stone-50/50 px-6 py-16 sm:px-8 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-cozy-xl bg-amber-100">
            <Globe className="h-7 w-7 text-amber-600" />
          </div>
          <h2 className="font-display text-2xl text-stone-900 sm:text-3xl">
            The One Health Connection
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-stone-600">
            Freshwater macroinvertebrates are early warning sentinels. When
            mayflies disappear, mosquito larvae thrive — and disease risk rises.
            StreamSense closes the loop between ecological monitoring and
            public health early warning.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-sm text-stone-500">
            <span className="flex items-center gap-1.5 rounded-cozy bg-surface px-4 py-2 border border-stone-100 shadow-cozy-sm">
              <Droplets className="h-4 w-4 text-stream-500" />
              Stream Ecology
            </span>
            <ArrowRight className="h-4 w-4 text-stone-300" />
            <span className="flex items-center gap-1.5 rounded-cozy bg-surface px-4 py-2 border border-stone-100 shadow-cozy-sm">
              <Microscope className="h-4 w-4 text-moss-500" />
              Species Data
            </span>
            <ArrowRight className="h-4 w-4 text-stone-300" />
            <span className="flex items-center gap-1.5 rounded-cozy bg-surface px-4 py-2 border border-stone-100 shadow-cozy-sm">
              <Activity className="h-4 w-4 text-amber-500" />
              Vector Forecasts
            </span>
            <ArrowRight className="h-4 w-4 text-stone-300" />
            <span className="flex items-center gap-1.5 rounded-cozy bg-surface px-4 py-2 border border-stone-100 shadow-cozy-sm">
              <HeartPulse className="h-4 w-4 text-danger-500" />
              Public Health
            </span>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="px-6 py-16 sm:px-8 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl text-stone-900">
            Ready to protect your waterways?
          </h2>
          <p className="mt-3 text-sm text-stone-500">
            Join volunteers across Europe monitoring urban stream health
          </p>
          <div className="mt-8">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-cozy bg-stream-500 px-8 py-3 text-sm font-semibold text-white shadow-cozy transition-all hover:bg-stream-600 hover:shadow-cozy-lg hover:-translate-y-0.5"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-stone-100 px-6 py-8 sm:px-8">
        <div className="mx-auto max-w-4xl flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <Waves className="h-4 w-4 text-stream-500" />
            <span className="text-sm font-medium text-stone-700">
              StreamSense
            </span>
          </div>
          <p className="text-xs text-stone-400 text-center">
            OneAquaHealth IEEE Global Hackathon 2026 · Built for healthy urban stream communities
          </p>
        </div>
      </footer>
    </main>
  )
}
