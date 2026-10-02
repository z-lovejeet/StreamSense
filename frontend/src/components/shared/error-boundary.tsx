"use client"

import React from "react"
import { Waves, RefreshCw } from "lucide-react"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * React Error Boundary — catches render errors and shows a friendly fallback.
 *
 * DOC-10 Task 6.5: Graceful error handling
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("ErrorBoundary caught:", error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex min-h-[60vh] items-center justify-center p-8">
          <div className="max-w-sm text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-cozy-xl bg-stream-50">
              <Waves className="h-7 w-7 text-stream-400" />
            </div>
            <h2 className="font-display text-xl text-stone-800">
              Something went wrong
            </h2>
            <p className="text-sm text-stone-500 leading-relaxed">
              An unexpected error occurred. Try refreshing the page or go back
              to the dashboard.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 rounded-cozy border border-stone-200 bg-surface px-4 py-2 text-sm font-medium text-stone-700 shadow-cozy-sm transition-all hover:bg-surface-hover hover:shadow-cozy"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
              <button
                onClick={() => { window.location.href = "/" }}
                className="flex items-center gap-2 rounded-cozy bg-stream-500 px-4 py-2 text-sm font-medium text-white shadow-cozy-sm transition-all hover:bg-stream-600 hover:shadow-cozy"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
