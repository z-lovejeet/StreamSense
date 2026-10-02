"use client"

import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"
import { Header } from "@/components/shared/header"
import { ResearcherSidebar } from "@/components/shared/researcher-sidebar"
import { ErrorBoundary } from "@/components/shared/error-boundary"

/**
 * Researcher layout — desktop-optimized app shell.
 *
 * Dark sidebar (260px fixed) + header + wide content area.
 * Role guard: redirects non-researchers to volunteer dashboard.
 * Content max-width: 7xl (wider than volunteer's 5xl for dense layouts).
 */
export default function ResearcherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
    if (!loading && user && user.role !== "researcher") {
      router.push("/volunteer/dashboard")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-stream-500" />
          <p className="text-sm text-stone-500">Loading StreamSense...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== "researcher") return null

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar — dark theme */}
      <aside className="hidden lg:flex lg:w-[260px] lg:flex-col lg:fixed lg:inset-y-0">
        <ResearcherSidebar />
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:pl-[260px]">
        <Header user={user} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  )
}
