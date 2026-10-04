"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  LayoutDashboard,
  Search,
  CheckCircle2,
  BarChart3,
  HeartPulse,
} from "lucide-react"
import { api } from "@/lib/api"

const navItems = [
  { href: "/researcher/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/researcher/review", label: "Review", icon: Search, showBadge: true },
  { href: "/researcher/validated", label: "Validated", icon: CheckCircle2 },
  { href: "/researcher/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/researcher/fhir", label: "FHIR", icon: HeartPulse },
]

/**
 * Researcher sidebar — dark background, information-dense nav.
 *
 * DOC-09 Lines 229, 503–511
 * Background: bg-stone-900 (dark forest)
 * Active: bg-stone-800 text-white
 * Default: text-stone-400
 */
export function ResearcherSidebar() {
  const pathname = usePathname()
  const [queueCount, setQueueCount] = useState(0)

  // Poll review queue count every 30s
  useEffect(() => {
    async function fetchCount() {
      try {
        const data = await api.get<{ count: number }>("/review/queue/count")
        setQueueCount(data.count)
      } catch {
        // silently ignore
      }
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex h-full flex-col bg-stone-900">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-stone-700/50">
        <img
          src="/logo.png"
          alt="StreamSense logo"
          className="h-9 w-9 object-contain"
        />
        <span className="font-display text-lg text-stone-100">
          StreamSense
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-cozy px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-stone-800 text-white"
                  : "text-stone-400 hover:bg-stone-800/60 hover:text-stone-200"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              <span className="flex-1">{item.label}</span>
              {item.showBadge && queueCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-pill bg-amber-500 px-1.5 text-[10px] font-bold text-white">
                  {queueCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Switch to Volunteer Portal */}
      <div className="px-3 pb-3">
        <Link
          href="/volunteer/dashboard"
          className="flex items-center justify-between rounded-cozy bg-stone-800 border border-stone-700/60 px-3 py-2.5 text-xs font-semibold text-stone-200 shadow-cozy-sm transition-all hover:bg-stone-700/80"
        >
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-stream-400 animate-pulse" />
            Volunteer Portal
          </span>
          <span className="text-[10px] text-stone-400">&rarr;</span>
        </Link>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-stone-700/50">
        <p className="text-[11px] text-stone-600 text-center">
          Researcher Panel
        </p>
      </div>
    </div>
  )
}
