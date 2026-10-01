"use client"

import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"
import { Header } from "@/components/shared/header"
import { Sidebar } from "@/components/shared/sidebar"

/**
 * Volunteer layout — app shell with sidebar + header.
 *
 * Desktop: fixed 260px sidebar + content area.
 * Mobile: hamburger → Sheet drawer from left.
 * Redirects non-authenticated users to /login.
 */
export default function VolunteerLayout({
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
    if (!loading && user && user.role === "researcher") {
      router.push("/researcher/dashboard")
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

  if (!user) return null

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-[260px] lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:border-stone-200 lg:bg-stone-50">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:pl-[260px]">
        <Header user={user} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
