// The balance suite (docs/architecture.md) — executable assertions that the
// game teaches TRUE things. A content or engine change that breaks these is a
// content bug, not a test bug.

import { describe, expect, it } from 'vitest'
import { simTick, stackCost, tickDamage, BREAKER_CAP, type StackConfig } from '../src/engine/capacity'
import { PREDICT_ROUNDS } from '../src/content/predict'
import { firstPast80 } from '../src/modes/review/PredictRun'
import { ENCOUNTERS, RUN } from '../src/content/oncall'
import { oncallTick } from '../src/modes/oncall'

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

describe('balance: capacity truths', () => {
  it('2 app servers at 25k req/s → error rate > 20%', () => {
    const f = simTick(cfg({ app: 2 }), 25000 * 0.9, 25000 * 0.1, 0)
    expect(f.errRate).toBeGreaterThan(0.2)
  })

  it('45k req/s, 90% reads, no cache → primary tier fails', () => {
    const f = simTick(cfg({ app: 5 }), 45000 * 0.9, 45000 * 0.1, 0)
    const db = f.comps.find((c) => c.id === 'db')!
    expect(db.u).toBeGreaterThan(1)
    expect(f.errRate).toBeGreaterThan(0.005)
  })

  it('45k req/s with 2 cache @85% + 2 replicas → passes', () => {
    const f = simTick(cfg({ app: 5, cache: 2, hitRate: 0.85, replicas: 2 }), 45000 * 0.9, 45000 * 0.1, 0)
    expect(f.errRate).toBeLessThanOrEqual(0.005)
    for (const c of f.comps) expect(c.u).toBeLessThan(1)
  })
})

describe('balance: the firehose burst (queue buys time)', () => {
  const READS = 1000
  const STEADY_WRITES = 6000
  const BURST_WRITES = STEADY_WRITES * 2.2
  const TICKS = 30
  const writesAt = (t: number) => (t >= 10 && t <= 19 ? BURST_WRITES : STEADY_WRITES)

  it('with queue + 3 workers → passes with backlog drained', () => {
    const c = cfg({ app: 2, queue: true, workers: 3 })
    let backlog = 0
    let worstErr = 0
    for (let t = 0; t < TICKS; t++) {
      const f = simTick(c, READS, writesAt(t), backlog)
      backlog = f.backlog
      worstErr = Math.max(worstErr, f.errRate)
    }
    expect(worstErr).toBeLessThanOrEqual(0.005)
    expect(backlog).toBeLessThan(1000)
  })

  it('without queue on 1 shard → fails', () => {
    const c = cfg({ app: 2 })
    let worstErr = 0
    for (let t = 0; t < TICKS; t++) {
      const f = simTick(c, READS, writesAt(t), 0)
      worstErr = Math.max(worstErr, f.errRate)
    }
    expect(worstErr).toBeGreaterThan(0.005)
  })
})

describe('balance: predict rounds teach the right bottleneck', () => {
  it('read-heavy round: first tier past 80% is APP, not DB', () => {
    const r = PREDICT_ROUNDS[0]
    expect(r.readPct).toBeGreaterThanOrEqual(0.9)
    expect(firstPast80(r)).toBe(0) // App servers
    expect(r.q1.ans).toBe(firstPast80(r)) // stored answer matches the math
  })

  it('write-mix flip: first tier past 80% is PRIMARY', () => {
    const r = PREDICT_ROUNDS[1]
    expect(firstPast80(r)).toBe(3) // DB primary (writes)
    expect(r.q1.ans).toBe(firstPast80(r))
  })
})

describe('balance: queueing curve honesty', () => {
  it('p99 monotonically increases with utilization', () => {
    const c = cfg({ app: 1 })
    let prev = 0
    for (let load = 500; load <= 12000; load += 500) {
      const f = simTick(c, load * 0.9, load * 0.1, 0)
      expect(f.p99).toBeGreaterThanOrEqual(prev - 1e-9)
      prev = f.p99
    }
  })

  it('errors are 0 below 80% everywhere', () => {
    // sweep several stacks and loads keeping every tier under 0.8
    const stacks: StackConfig[] = [
      cfg({ app: 4 }),
      cfg({ app: 4, cache: 1 }),
      cfg({ app: 4, cache: 1, replicas: 2 }),
      cfg({ app: 4, queue: true, workers: 4, shards: 2 }),
    ]
    for (const c of stacks) {
      for (let load = 1000; load <= 15000; load += 1000) {
        const f = simTick(c, load * 0.85, load * 0.15, 0)
        const allUnder = f.comps.every((t) => t.u < 0.8)
        if (allUnder) expect(f.errRate).toBe(0)
      }
    }
  })
})

describe('balance: the boss is beatable ≥2 distinct ways, affordably', () => {
  const herd = ENCOUNTERS.herd

  /** Run the full herd encounter, return total damage. */
  const runHerd = (c: StackConfig, pats: string[] = []) => {
    let backlog = 0
    let dmg = 0
    for (let t = 0; t <= herd.ticks; t++) {
      const f = oncallTick(c, herd, t, pats, backlog)
      backlog = f.backlog
      dmg += tickDamage(f, herd.target, { idem: pats.includes('idem'), degrade: pats.includes('degrade') })
    }
    if (pats.includes('breaker')) dmg = Math.min(BREAKER_CAP, dmg)
    if (backlog > RUN.strandedLagThreshold) dmg += RUN.strandedLagDamage
    return dmg
  }

  // Strategy A — buy capacity: shard the primary, no queue.
  const capacityBuild = cfg({ app: 4, cache: 1, hitRate: 0.8, replicas: 1, shards: 2 })
  // Strategy B — buy time: keep 1 shard, absorb the herd in a queue.
  const queueBuild = cfg({ app: 4, cache: 1, hitRate: 0.9, replicas: 1, queue: true, workers: 3 })

  it('capacity strategy (shards) survives', () => {
    expect(runHerd(capacityBuild)).toBeLessThan(RUN.startHp)
  })

  it('time strategy (queue + workers) survives', () => {
    expect(runHerd(queueBuild)).toBeLessThan(RUN.startHp)
  })

  it('cheapest winning build ≤ starting gold + act income', () => {
    const income =
      RUN.startGold + RUN.fightReward * 3 + RUN.eliteReward + RUN.restGold
    const cheapest = Math.min(stackCost(capacityBuild), stackCost(queueBuild))
    expect(cheapest).toBeLessThanOrEqual(income)
  })
})
