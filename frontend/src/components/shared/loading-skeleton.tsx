/**
 * Loading skeleton — card-shaped shimmer placeholders.
 *
 * DOC-09 Lines 618–625: bg-stone-100 animate-pulse
 */

export function CardSkeleton() {
  return (
    <div className="rounded-cozy-lg border border-stone-100 bg-surface p-5 shadow-cozy-sm">
      <div className="flex gap-4">
        <div className="h-16 w-16 rounded-cozy bg-stone-100 animate-pulse" />
        <div className="flex-1 space-y-2.5">
          <div className="h-4 w-3/4 rounded bg-stone-100 animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-stone-100 animate-pulse" />
          <div className="h-3 w-1/3 rounded bg-stone-100 animate-pulse" />
        </div>
      </div>
    </div>
  )
}

export function StatSkeleton() {
  return (
    <div className="rounded-cozy-lg border border-stone-100 bg-surface p-5 shadow-cozy-sm">
      <div className="space-y-2">
        <div className="h-3 w-16 rounded bg-stone-100 animate-pulse" />
        <div className="h-8 w-12 rounded bg-stone-100 animate-pulse" />
      </div>
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 rounded bg-stone-100 animate-pulse" />
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatSkeleton key={i} />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
