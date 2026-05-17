'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState, Suspense } from 'react'

/**
 * NavigationProgress
 * Shows a thin blue bar + corner spinner during route transitions.
 * Must be rendered inside a <Suspense> boundary because useSearchParams()
 * requires it in Next.js App Router — the outer component handles this.
 */
function ProgressBarInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [visible, setVisible] = useState(false)
  const [width, setWidth] = useState(0)

  // Track whether this is the first render — we do NOT want to fire on mount
  const initialized = useRef(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  useEffect(() => {
    // Skip initial mount — we only want to animate on subsequent navigations
    if (!initialized.current) {
      initialized.current = true
      return
    }

    clearTimers()
    setVisible(true)
    setWidth(10)

    const t1 = setTimeout(() => setWidth(35), 100)
    const t2 = setTimeout(() => setWidth(60), 350)
    const t3 = setTimeout(() => setWidth(80), 700)
    const t4 = setTimeout(() => {
      setWidth(100)
      const t5 = setTimeout(() => {
        setVisible(false)
        setWidth(0)
      }, 300)
      timers.current.push(t5)
    }, 1100)

    timers.current.push(t1, t2, t3, t4)

    return clearTimers
  }, [pathname, searchParams])

  if (!visible) return null

  return (
    <>
      {/* Top progress bar */}
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 z-[9999] h-[2px] overflow-hidden"
        style={{ background: 'rgba(59,130,246,0.15)' }}
      >
        <div
          className="h-full transition-all duration-300 ease-out"
          style={{
            width: `${width}%`,
            background: 'var(--color-blue)',
            boxShadow: '0 0 12px 2px rgba(59,130,246,0.6)',
          }}
        />
      </div>

      {/* Spinner — top-right corner */}
      <div
        aria-label="Loading page…"
        className="fixed top-3 right-4 z-[9999]"
      >
        <svg
          className="animate-spin h-4 w-4"
          style={{ color: 'var(--color-blue)' }}
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
            className="opacity-20"
          />
          <path
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            fill="currentColor"
            className="opacity-80"
          />
        </svg>
      </div>
    </>
  )
}

/**
 * Exported component — wrap ProgressBarInner in Suspense so the
 * entire layout doesn't de-opt to client-side rendering.
 */
export default function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <ProgressBarInner />
    </Suspense>
  )
}