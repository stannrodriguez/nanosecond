// Engine unit tests — the math contract in docs/architecture.md.

import { describe, expect, it } from 'vitest'
import { CAP, latencyMult, simTick, stackCost, tickDamage, type StackConfig } from '../src/engine/capacity'

const cfg = (over: Partial<StackConfig> = {}): StackConfig => ({
  app: 2,
  cache: 0,
  hitRate: 0.8,
  replicas: 0,
  shards: 1,
  queue: false,
  workers: 2,
  ...over,
})

describe('latency multiplier m(u)', () => {
  it('is 1/(1−u) below saturation and clamps to 20', () => {
    expect(latencyMult(0)).toBeCloseTo(1)
    expect(latencyMult(0.5)).toBeCloseTo(2)
    expect(latencyMult(0.9)).toBeCloseTo(10)
    expect(latencyMult(0.95)).toBeCloseTo(20)
    expect(latencyMult(1)).toBe(20)
    expect(latencyMult(5)).toBe(20)
  })
})

describe('simTick tiers', () => {
  it('reads charge the cache tier the FULL read volume', () => {
    const f = simTick(cfg({ cache: 1, hitRate: 0.9 }), 50_000, 0, 0)
    const cache = f.comps.find((c) => c.id === 'cache')!
    expect(cache.u).toBeCloseTo(0.5) // 50k lookups vs 100k ops
  })

  it('misses flow to replicas when present, else share the primary', () => {
    const withReps = simTick(cfg({ cache: 1, hitRate: 0.8, replicas: 1 }), 50_000, 0, 0)
    expect(withReps.comps.find((c) => c.id === 'dbr')!.u).toBeCloseTo(0.5) // 10k misses vs 20k
    const noReps = simTick(cfg({ cache: 1, hitRate: 0.8 }), 50_000, 1_000, 0)
    const db = noReps.comps.find((c) => c.id === 'db')!
    expect(db.u).toBeCloseTo(10_000 / 20_000 + 1_000 / 10_000) // shared read+write util
  })

  it('p99 = min(5000, 3.2 × p50)', () => {
    const f = simTick(cfg({ app: 4 }), 9_000, 1_000, 0)
    expect(f.p99).toBeCloseTo(Math.min(5000, f.p50 * 3.2))
  })

  it('queue drain is capped by the primary write capacity', () => {
    // 8 workers × 5k = 40k drain, but 1 shard caps at 10k
    const f = simTick(cfg({ queue: true, workers: 8 }), 0, 25_000, 0)
    expect(f.backlog).toBeCloseTo(15_000)
    const f2 = simTick(cfg({ queue: true, workers: 8 }), 0, 5_000, f.backlog)
    // arrivals 5k + 15k backlog = 20k, drain 10k → 10k left
    expect(f2.backlog).toBeCloseTo(10_000)
  })

  it('stack cost matches the price list', () => {
    expect(stackCost(cfg())).toBe(2 * CAP.app.cost + CAP.db.cost)
    expect(stackCost(cfg({ cache: 2, replicas: 1, queue: true, workers: 3 }))).toBe(
      2 * 150 + 2 * 200 + 600 + 400 + 300 + 3 * 100,
    )
  })
})

describe('damage model', () => {
  it('errRate × 30, idempotency discounts the write portion 40%', () => {
    const frame = simTick(cfg({ app: 1 }), 12_000 * 0.5, 12_000 * 0.5, 0) // app overloaded
    const base = tickDamage(frame, 10_000)
    const withIdem = tickDamage(frame, 10_000, { idem: true })
    expect(base).toBeGreaterThan(withIdem)
    // p99 breach adds 1.5, degrade removes it
    const breach = tickDamage(frame, 1)
    const degraded = tickDamage(frame, 1, { degrade: true })
    expect(breach - degraded).toBeCloseTo(1.5)
  })
})
