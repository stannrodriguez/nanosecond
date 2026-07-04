import { useEffect, useRef } from 'react'

/** requestAnimationFrame loop with dt in seconds (clamped to 50 ms). */
export function useRaf(cb: (dt: number) => void, running: boolean) {
  const cbRef = useRef(cb)
  cbRef.current = cb
  useEffect(() => {
    if (!running) return
    let id: number
    let last = performance.now()
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000)
      last = t
      cbRef.current(dt)
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [running])
}
