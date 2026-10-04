"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, LogOut } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { Sidebar } from "@/components/shared/sidebar"
import { ResearcherSidebar } from "@/components/shared/researcher-sidebar"
import { NotificationBell } from "@/components/shared/notification-bell"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { User } from "@/types"

/**
 * Header component — mobile hamburger + brand + user avatar.
 *
 * Desktop: user avatar + name + sign-out.
 * Mobile: hamburger triggers Sheet sidebar from left.
 */
export function Header({ user }: { user: User }) {
  const { signOut } = useAuth()
  const pathname = usePathname()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const isResearcherRoute = pathname?.startsWith("/researcher")

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-stone-200 bg-surface/80 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
      {/* Left: Hamburger (mobile) + Brand */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger
            render={
              <button className="lg:hidden rounded-cozy p-2 text-stone-600 hover:bg-stone-100 transition-colors" aria-label="Open navigation menu">
                <Menu className="h-5 w-5" />
              </button>
            }
          />
          <SheetContent side="left" className={`w-[260px] p-0 ${isResearcherRoute ? "bg-stone-900" : "bg-stone-50"}`} showCloseButton={false}>
            {isResearcherRoute ? <ResearcherSidebar /> : <Sidebar />}
          </SheetContent>
        </Sheet>

        {/* Brand — only on mobile (sidebar has it on desktop) */}
        <div className="flex items-center gap-2.5 lg:hidden">
          <img
            src="/logo.png"
            alt="StreamSense logo"
            className="h-7 w-7 object-contain"
          />
          <span className="font-display text-base text-stone-900">
            StreamSense
          </span>
        </div>
      </div>

      {/* Right: Portal Switcher + Notifications + User + Sign out */}
      <div className="flex items-center gap-3">
        {/* Portal Switcher Button */}
        {isResearcherRoute ? (
          <Link
            href="/volunteer/dashboard"
            className="flex items-center gap-1.5 rounded-pill border border-stream-200 bg-stream-50 px-3 py-1 text-xs font-semibold text-stream-700 shadow-cozy-sm transition-all hover:bg-stream-100 hover:shadow-cozy hover:-translate-y-0.5"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-stream-500 animate-pulse" />
            Volunteer View &rarr;
          </Link>
        ) : (
          <Link
            href="/researcher/dashboard"
            className="flex items-center gap-1.5 rounded-pill border border-stone-800 bg-stone-900 px-3 py-1 text-xs font-semibold text-stone-100 shadow-cozy-sm transition-all hover:bg-stone-800 hover:shadow-cozy hover:-translate-y-0.5"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Researcher Portal &rarr;
          </Link>
        )}

        {isResearcherRoute && <NotificationBell />}

        <div className="flex items-center gap-2">
          {user.avatar_url && !imageError ? (
            <img
              src={user.avatar_url}
              alt={user.full_name || "User avatar"}
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              onError={() => setImageError(true)}
              className="h-8 w-8 rounded-full object-cover ring-2 ring-stone-100"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-stream-100 flex items-center justify-center text-stream-700 text-xs font-semibold ring-2 ring-stone-100">
              {user.full_name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          )}
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-medium text-stone-800 leading-tight">
              {user.full_name}
            </span>
            <span className="text-[10px] text-stone-400 capitalize">
              {user.role}
            </span>
          </div>
        </div>

        <button
          onClick={signOut}
          className="rounded-cozy p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
