"use client"

import { motion, useSpring, useTransform } from "framer-motion"
import { useEffect } from "react"

/**
 * Animated confidence gauge — horizontal bar with spring count-up.
 *
 * DOC-09 Line 581: useSpring from 0 to final value
 */
export function ConfidenceGauge({
  value,
  size = "default",
}: {
  value: number
  size?: "default" | "sm"
}) {
  const spring = useSpring(0, { stiffness: 50, damping: 15 })
  const display = useTransform(spring, (v) => Math.round(v))

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  const barHeight = size === "sm" ? "h-1.5" : "h-2"
  const textSize = size === "sm" ? "text-xs" : "text-sm"

  return (
    <div className="flex items-center gap-2.5">
      {/* Bar */}
      <div className={`flex-1 ${barHeight} rounded-pill bg-stone-100 overflow-hidden`}>
        <motion.div
          className={`${barHeight} rounded-pill bg-stream-500`}
          initial={{ width: "0%" }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      {/* Percentage */}
      <motion.span className={`font-mono ${textSize} font-medium text-stone-700 tabular-nums min-w-[3ch]`}>
        {display}
      </motion.span>
      <span className={`${textSize} text-stone-400`}>%</span>
    </div>
  )
}
