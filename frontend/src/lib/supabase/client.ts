"use client"

import { createBrowserClient as createClient } from "@supabase/ssr"

/**
 * Creates a Supabase client for use in Client Components.
 *
 * Used for: OAuth sign-in, onAuthStateChange, Storage uploads.
 * Never use in Server Components — use server.ts instead.
 */
export function createBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
