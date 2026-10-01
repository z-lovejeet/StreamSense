"use client"

import { useState } from "react"
import { Menu, LogOut, Waves } from "lucide-react"
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
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-stone-200 bg-surface/80 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
      {/* Left: Hamburger (mobile) + Brand */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger
            render={
              <button className="lg:hidden rounded-cozy p-2 text-stone-600 hover:bg-stone-100 transition-colors">
                <Menu className="h-5 w-5" />
              </button>
            }
          />
          <SheetContent side="left" className={`w-[260px] p-0 ${user.role === "researcher" ? "bg-stone-900" : "bg-stone-50"}`} showCloseButton={false}>
            {user.role === "researcher" ? <ResearcherSidebar /> : <Sidebar />}
          </SheetContent>
        </Sheet>

        {/* Brand — only on mobile (sidebar has it on desktop) */}
        <div className="flex items-center gap-2 lg:hidden">
          <Waves className="h-5 w-5 text-stream-600" />
          <span className="font-display text-base text-stone-900">
            StreamSense
          </span>
        </div>
      </div>

      {/* Right: Notifications + User + Sign out */}
      <div className="flex items-center gap-3">
        {user.role === "researcher" && <NotificationBell />}
        <div className="flex items-center gap-2.5">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.full_name}
              className="h-8 w-8 rounded-full object-cover ring-2 ring-stone-100"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-stream-100 flex items-center justify-center text-stream-700 text-xs font-semibold">
              {user.full_name?.charAt(0)?.toUpperCase() || "?"}
            </div>
          )}
          <span className="hidden text-sm font-medium text-stone-700 sm:block">
            {user.full_name}
          </span>
        </div>

        <button
          onClick={signOut}
          className="rounded-cozy p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
