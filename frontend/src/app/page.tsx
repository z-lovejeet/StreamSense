export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="text-center space-y-4 max-w-lg">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 rounded-cozy-lg bg-stream-100 flex items-center justify-center">
            <span className="text-3xl">🌊</span>
          </div>
        </div>

        <h1 className="font-display text-5xl text-stone-900 tracking-tight">
          StreamSense
        </h1>

        <p className="text-lg text-stone-500 leading-relaxed">
          AI-powered citizen science for urban stream health monitoring.
          Healthy waters, healthy communities.
        </p>

        <div className="flex gap-3 justify-center pt-6">
          <button className="px-6 py-2.5 bg-stream-500 text-white rounded-cozy text-sm font-medium shadow-cozy hover:bg-stream-600 transition-colors">
            I&apos;m a Volunteer
          </button>
          <button className="px-6 py-2.5 bg-surface text-stone-700 rounded-cozy text-sm font-medium border border-stone-200 shadow-cozy-sm hover:bg-surface-hover transition-colors">
            I&apos;m a Researcher
          </button>
        </div>

        <p className="text-xs text-stone-400 pt-4">
          OneAquaHealth IEEE Global Hackathon 2026
        </p>
      </div>
    </main>
  )
}
