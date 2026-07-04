// worstTiers / diagnoseTiers — the shared post-mortem primitive.

import { describe, expect, it } from 'vitest'
import { diagnoseTiers, simTick, worstTiers, type Frame, type StackConfig } from '../src/engine/capacity'

const cfg: StackConfig = { app: 1, cache: 0, hitRate: 0.8, replicas: 0, shards: 1, queue: false, workers: 2 }

// A run where the app tier ramps from calm to saturated.
const run: Frame[] = [2000, 8000, 14000].map((rps) => simTick(cfg, rps * 0.9, rps * 0.1, 0))

describe('worstTiers', () => {
  it('keeps the peak utilization per tier, hottest first', () => {
    const w = worstTiers(run)
    // app is the hottest tier in this single-app run
    expect(w[0].id).toBe('app')
    // it captured the peak (14k on one app = 1.4), not an earlier calm frame
    expect(w[0].u).toBeGreaterThan(1)
    // sorted descending
    for (let i = 1; i < w.length; i++) expect(w[i - 1].u).toBeGreaterThanOrEqual(w[i].u)
  })

  it('is empty for an empty run', () => {
    expect(worstTiers([])).toEqual([])
  })
})

describe('diagnoseTiers', () => {
  it('narrates saturated tiers and stays quiet on healthy ones', () => {
    const calm = [simTick(cfg, 1000, 100, 0)]
    expect(diagnoseTiers(calm)).toEqual([])
    const hot = diagnoseTiers(run)
    expect(hot.some((l) => l.includes('beyond capacity'))).toBe(true)
  })
})
