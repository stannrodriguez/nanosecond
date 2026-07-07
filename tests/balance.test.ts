// The balance suite (docs/architecture.md) — executable assertions that the
// game teaches TRUE things. A content or engine change that breaks these is a
// content bug, not a test bug.

import { describe, expect, it } from 'vitest'
import { simTick, stackCost, type StackConfig } from '../src/engine/capacity'
import { PREDICT_ROUNDS } from '../src/content/predict'
import { firstPast80 } from '../src/modes/review/PredictRun'
import { ENCOUNTERS, RUN } from '../src/content/oncall'
import { encounterDamage, oncallTick } from '../src/modes/oncall/engine'

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

describe('balance: every boss is beatable ≥2 distinct ways', () => {
  /** Run a full boss encounter to completion, return total error-budget damage. */
  const runBoss = (encKey: string, c: StackConfig, pats: string[] = []) => {
    const enc = ENCOUNTERS[encKey]
    const frames = []
    let backlog = 0
    for (let t = 0; t <= enc.ticks; t++) {
      const f = oncallTick(c, enc, t, pats, backlog)
      backlog = f.backlog
      frames.push(f)
    }
    const { dmg, strandedLag } = encounterDamage(frames, enc, pats)
    return Math.round(dmg) + strandedLag
  }

  // Two distinct strategy families per boss: buy CAPACITY (shards/replicas) or
  // buy TIME (queue + workers). Every boss must survive both.
  const bosses: { key: string; capacity: StackConfig; time: StackConfig }[] = [
    {
      key: 'herd',
      capacity: cfg({ app: 5, cache: 2, hitRate: 0.85, replicas: 2, shards: 2 }),
      time: cfg({ app: 6, cache: 3, hitRate: 0.9, replicas: 3, shards: 2, queue: true, workers: 4 }),
    },
    {
      key: 'blackfriday',
      capacity: cfg({ app: 6, cache: 3, hitRate: 0.88, replicas: 3, shards: 3 }),
      time: cfg({ app: 6, cache: 3, hitRate: 0.9, replicas: 3, shards: 2, queue: true, workers: 4 }),
    },
    {
      key: 'region',
      capacity: cfg({ app: 6, cache: 3, hitRate: 0.88, replicas: 3, shards: 3 }),
      time: cfg({ app: 6, cache: 3, hitRate: 0.9, replicas: 3, shards: 2, queue: true, workers: 4 }),
    },
  ]

  for (const b of bosses) {
    const name = ENCOUNTERS[b.key].name
    it(`${name}: capacity strategy (shards + replicas) survives`, () => {
      expect(runBoss(b.key, b.capacity)).toBeLessThan(RUN.startHp)
    })
    it(`${name}: time strategy (queue + workers) survives`, () => {
      expect(runBoss(b.key, b.time)).toBeLessThan(RUN.startHp)
    })
  }

  it('act-1 boss (Thundering Herd) cheapest win ≤ starting gold + act-1 income', () => {
    const herd = bosses[0]
    // Guaranteed act-1 income: three fights, one elite, one sprint break.
    const income = RUN.startGold + RUN.fightReward * 3 + RUN.eliteReward + RUN.restGold
    const cheapest = Math.min(stackCost(herd.capacity), stackCost(herd.time))
    expect(runBoss('herd', herd.capacity)).toBeLessThan(RUN.startHp)
    expect(cheapest).toBeLessThanOrEqual(income)
  })
})

describe('balance: the on-call run is completable end-to-end', () => {
  // Every non-boss encounter must be survivable with an affordable, adapted
  // build — otherwise a run can dead-end. (Bosses covered above.)
  const runEnc = (encKey: string, c: StackConfig, pats: string[] = []) => {
    const enc = ENCOUNTERS[encKey]
    const frames = []
    let backlog = 0
    for (let t = 0; t <= enc.ticks; t++) {
      const f = oncallTick(c, enc, t, pats, backlog)
      backlog = f.backlog
      frames.push(f)
    }
    const { dmg, strandedLag } = encounterDamage(frames, enc, pats)
    return Math.round(dmg) + strandedLag
  }

  const bigBuild = cfg({ app: 6, cache: 3, hitRate: 0.9, replicas: 3, shards: 3, queue: true, workers: 4 })
  it('every encounter is survivable with a fully-scaled build + idempotency', () => {
    for (const key of Object.keys(ENCOUNTERS)) {
      expect(runEnc(key, bigBuild, ['idem', 'readthrough', 'ratelimit']), ENCOUNTERS[key].name).toBeLessThan(RUN.startHp)
    }
  })
})
