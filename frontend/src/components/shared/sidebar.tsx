"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Camera,
  ClipboardList,
  MapPin,
  Waves,
} from "lucide-react"

const navItems = [
  { href: "/volunteer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/volunteer/submit", label: "Submit", icon: Camera },
  { href: "/volunteer/history", label: "History", icon: ClipboardList },
  { href: "/volunteer/map", label: "Map", icon: MapPin },
]

/**
 * Sidebar navigation — used in desktop layout and mobile Sheet drawer.
 *
 * Active state: bg-stream-50 text-stream-700
 * Hover: bg-stone-100
 */
export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-stone-200">
        <div className="h-9 w-9 rounded-cozy bg-stream-100 flex items-center justify-center">
          <Waves className="h-5 w-5 text-stream-600" />
        </div>
        <span className="font-display text-lg text-stone-900">
          StreamSense
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-cozy px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-stream-50 text-stream-700"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-stone-200">
        <p className="text-[11px] text-stone-400 text-center">
          OneAquaHealth 2026
        </p>
      </div>
    </div>
  )
}
