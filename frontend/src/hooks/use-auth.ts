"use client"

import { useCallback, useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { api } from "@/lib/api"
import type { User, UserSyncResponse } from "@/types"

/**
 * useAuth hook — manages Supabase auth state and role sync.
 *
 * Listens for auth state changes, syncs user to backend on sign-in,
 * and provides sign-in/sign-out helpers.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const syncUser = useCallback(async () => {
    try {
      const data = await api.post<UserSyncResponse>("/auth/sync")
      setUser(data.user)
      return data.user
    } catch (err) {
      console.error("Failed to sync user:", err)
      return null
    }
  }, [])

  const fetchUser = useCallback(async () => {
    try {
      const data = await api.get<User>("/auth/me")
      setUser(data)
      return data
    } catch {
      setUser(null)
      return null
    }
  }, [])

  useEffect(() => {
    const supabase = createBrowserClient()

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUser().finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        syncUser().finally(() => setLoading(false))
      }
      if (event === "SIGNED_OUT") {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [syncUser, fetchUser])

  const signIn = useCallback(
    async (provider: "google" | "github") => {
      const supabase = createBrowserClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/callback`,
        },
      })
      if (error) throw error
    },
    [],
  )

  const signOut = useCallback(async () => {
    const supabase = createBrowserClient()
    await supabase.auth.signOut()
    setUser(null)
  }, [])

  return {
    user,
    loading,
    signIn,
    signOut,
    syncUser,
    isAuthenticated: !!user,
    isVolunteer: user?.role === "volunteer",
    isResearcher: user?.role === "researcher",
  }
}
