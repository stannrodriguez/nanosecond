import { useEffect, useRef, useState } from 'react'

/**
 * Drives a discrete, timed simulation run: ticks 0..ticks-1 fire on an interval,
 * each producing a frame; when the run ends, onDone gets every frame.
 *
 * This replaces the hand-rolled `tick`/`frame`/`histRef` + setTimeout loops that
 * Builder and On-Call each duplicated (both with an exhaustive-deps escape
 * hatch). Cross-tick state (backlog, running damage totals) is derived from the
 * `frames` array passed to `step` and exposed on the runner — no external refs.
 */
export interface TickRunner<F> {
  running: boolean
  /** −1 when idle; 0..ticks-1 while a tick's frame is on screen */
  tick: number
  frame: F | null
  frames: F[]
  start: () => void
  reset: () => void
}

export function useTickRunner<F>(opts: {
  ticks: number
  intervalMs: number
  /** produce the frame for tick t; `frames` holds every prior frame this run */
  step: (t: number, frames: F[]) => F
  /** fired once after the final tick, with the full frame history */
  onDone?: (frames: F[]) => void
  /** fired synchronously when start() is called, before the first tick */
  onStart?: () => void
}): TickRunner<F> {
  const { ticks, intervalMs, step, onStart } = opts
  const [tick, setTick] = useState(-1)
  const [frame, setFrame] = useState<F | null>(null)
  const [frames, setFrames] = useState<F[]>([])

  // Keep the latest callbacks without making them effect dependencies.
  const stepRef = useRef(step)
  stepRef.current = step
  const doneRef = useRef(opts.onDone)
  doneRef.current = opts.onDone

  useEffect(() => {
    if (tick < 0) return
    if (tick >= ticks) {
      doneRef.current?.(frames)
      setTick(-1)
      return
    }
    const id = setTimeout(() => {
      const f = stepRef.current(tick, frames)
      setFrames((prev) => [...prev, f])
      setFrame(f)
      setTick(tick + 1)
    }, intervalMs)
    return () => clearTimeout(id)
    // `frames` is intentionally omitted: it is appended in lockstep with `tick`,
    // so gating on `tick` alone is correct and avoids a double-fire.
  }, [tick, ticks, intervalMs]) // eslint-disable-line react-hooks/exhaustive-deps

  const start = () => {
    onStart?.()
    setFrames([])
    setFrame(null)
    setTick(0)
  }
  const reset = () => {
    setFrames([])
    setFrame(null)
    setTick(-1)
  }

  return { running: tick >= 0, tick, frame, frames, start, reset }
}
