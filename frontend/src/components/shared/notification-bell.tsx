"use client"

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { api } from "@/lib/api"

/**
 * Notification bell — polls review queue count every 30s.
 * Shows red dot badge for unread count > 0.
 *
 * DOC-10 Task 5.15
 */
export function NotificationBell() {
  const [count, setCount] = useState(0)
  const [showDrop, setShowDrop] = useState(false)

  useEffect(() => {
    async function poll() {
      try {
        const data = await api.get<{ count: number }>("/review/queue/count")
        setCount(data.count)
      } catch {
        // silently ignore
      }
    }
    poll()
    const interval = setInterval(poll, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative">
      <button
        onClick={() => setShowDrop((v) => !v)}
        className="relative rounded-cozy p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors"
        title="Notifications"
        aria-label={count > 0 ? `${count} pending notifications` : "Notifications"}
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger-500 px-1 text-[9px] font-bold text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {showDrop && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDrop(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-cozy-lg border border-stone-100 bg-surface p-4 shadow-cozy-lg">
            <h4 className="text-sm font-semibold text-stone-800 mb-2">
              Notifications
            </h4>
            {count > 0 ? (
              <p className="text-xs text-stone-500 leading-relaxed">
                <span className="font-bold text-amber-600">{count}</span>{" "}
                observation{count !== 1 ? "s" : ""} pending expert review.
              </p>
            ) : (
              <p className="text-xs text-stone-500">
                All caught up! No pending reviews.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
