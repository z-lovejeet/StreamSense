/**
 * StreamSense API client — typed fetch wrapper for all backend calls.
 *
 * Automatically attaches the Supabase JWT as a Bearer token.
 * All calls go to the FastAPI backend directly (no BFF in dev).
 */

import { createBrowserClient } from "@/lib/supabase/client"

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || "http://localhost:8000"

async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createBrowserClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  }

  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`
  }

  return headers
}

class ApiError extends Error {
  code: string
  status: number
  details: Array<{ field: string; issue: string }>

  constructor(data: {
    error: { code: string; message: string; details?: Array<{ field: string; issue: string }> }
  }, status: number) {
    super(data.error.message)
    this.code = data.error.code
    this.status = status
    this.details = data.error.details || []
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => ({
      error: { code: "UNKNOWN", message: res.statusText, details: [] },
    }))
    throw new ApiError(data, res.status)
  }
  return res.json()
}

export const api = {
  get: async <T = unknown>(path: string): Promise<T> => {
    const res = await fetch(`${API_URL}/api/v1${path}`, {
      headers: await getAuthHeaders(),
    })
    return handleResponse<T>(res)
  },

  post: async <T = unknown>(path: string, body?: unknown): Promise<T> => {
    const res = await fetch(`${API_URL}/api/v1${path}`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    })
    return handleResponse<T>(res)
  },

  /**
   * Create an SSE EventSource for real-time pipeline updates.
   * Returns the EventSource — caller must add listeners and close it.
   */
  stream: (path: string): EventSource => {
    return new EventSource(`${API_URL}/api/v1${path}`)
  },
}

export { ApiError }
