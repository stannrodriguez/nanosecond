import { useEffect, useRef, useState } from 'react'

/**
 * Auto-advances through a fixed array of scripted frames on an interval, then
 * fires onEnd. Used for the "watch the failure unfold" reveals (Find the Flaw
 * today; Interrogation's crystallize sequence next). Unlike useTickRunner the
 * frames already exist — this only paces stepping through them.
 */
export interface FrameStepper {
  /** current frame index (clamped to the last frame) */
  index: number
  running: boolean
  /** begin stepping from frame 0 */
  play: () => void
  /** jump back to idle (index 0, not playing) */
  reset: () => void
}

export function useFrameStepper(
  length: number,
  opts: { intervalMs: number; onEnd?: () => void },
): FrameStepper {
  const { intervalMs } = opts
  const [index, setIndex] = useState(0)
  const [running, setRunning] = useState(false)
  const endRef = useRef(opts.onEnd)
  endRef.current = opts.onEnd

  useEffect(() => {
    if (!running) return
    if (index >= length - 1) {
      const t = setTimeout(() => {
        setRunning(false)
        endRef.current?.()
      }, intervalMs)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setIndex((i) => i + 1), intervalMs)
    return () => clearTimeout(t)
  }, [running, index, length, intervalMs])

  return {
    index: Math.min(index, Math.max(0, length - 1)),
    running,
    play: () => {
      setIndex(0)
      setRunning(true)
    },
    reset: () => {
      setIndex(0)
      setRunning(false)
    },
  }
}
