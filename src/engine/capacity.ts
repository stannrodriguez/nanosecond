// The shared simulation engine (docs/architecture.md · "Simulation engine").
// Pure math only — this module NEVER imports content or UI.
//
// It is a teaching model, not a benchmark: one tick is one unit of scenario
// time, tiers are ideal M/M/1-flavored queues, and errors are modeled as
// overflow at saturated tiers. Content carries the honest fine print.

import type { Channel } from '../theme'

/* ---------- canonical capacities (mirrored in src/content/numbers.ts) ---------- */
export const CAP = {
  app: { rps: 10_000, baseMs: 3, cost: 150 },
  cache: { ops: 100_000, baseMs: 1, cost: 200 },
  db: { writes: 10_000, reads: 20_000, baseMs: 5, cost: 600 },
  replica: { reads: 20_000, cost: 400 },
  queue: { intake: 1_000_000, cost: 300 },
  worker: { drain: 5_000, cost: 100 },
  lb: { baseMs: 1, cost: 0 },
} as const

/* ---------- types ---------- */
export interface StackConfig {
  app: number
  cache: number
  hitRate: number
  replicas: number
  shards: number
  queue: boolean
  workers: number
}

/** Per-tick modifiers; modes translate scenario/encounter effects into these. */
export interface TickMods {
  /** Force the effective cache hit rate (e.g. stampede → 0). */
  hitRateOverride?: number
  /** Cap the effective cache hit rate (e.g. scraper swarm → 0.6). */
  hitRateCap?: number
  /** Effective app-server count override (e.g. autoscaling). */
  appCount?: number
  /** Multiplier on worker drain (e.g. tuned-workers synergy). */
  drainMult?: number
}

export interface TierFrame {
  id: string
  label: string
  ch: Channel
  u: number
  note: string
}

export interface Frame {
  rps: number
  comps: TierFrame[]
  p50: number
  p99: number
  /** total failed-request fraction, 0..1 */
  errRate: number
  /** failed fraction of READ traffic (0..1 of reads) */
  readErr: number
  /** failed fraction of WRITE traffic (0..1 of writes) */
  writeErr: number
  /** queue backlog after this tick (0 when no queue) */
  backlog: number
  /** effective cache hit rate used this tick */
  hit: number
  /** reads / (reads + writes) this tick */
  readShare: number
}

/* ---------- helpers ---------- */
const util = (load: number, cap: number) => (cap <= 0 ? 2 : load / cap)

/** Latency multiplier m(u) = 1/(1−min(u,0.95)), clamped to 20 at u ≥ 1. */
export const latencyMult = (u: number) => (u >= 1 ? 20 : 1 / (1 - Math.min(u, 0.95)))

export const fmtNum = (n: number): string => {
  if (n >= 1e6) return (n / 1e6).toPrecision(3) + 'M'
  if (n >= 1e3) return (n / 1e3).toPrecision(3) + 'k'
  return Math.round(n).toLocaleString()
}

/* ---------- the tick ---------- */
export function simTick(
  cfg: StackConfig,
  reads: number,
  writes: number,
  backlogIn: number,
  mods: TickMods = {},
): Frame {
  const rps = reads + writes
  const comps: TierFrame[] = []
  let readErr = 0
  let writeErr = 0

  // App tier — every request passes through.
  const appCount = mods.appCount ?? cfg.app
  const uApp = util(rps, appCount * CAP.app.rps)
  if (uApp > 1 && rps > 0) {
    const drop = (rps - appCount * CAP.app.rps) / rps
    readErr += drop
    writeErr += drop
  }
  comps.push({
    id: 'app',
    label: `App servers ×${appCount}${appCount > cfg.app ? ' (autoscaled)' : ''}`,
    ch: 'compute',
    u: uApp,
    note: `${fmtNum(rps)} req/s vs ${fmtNum(appCount * CAP.app.rps)} cap`,
  })

  // Cache tier — reads charge the cache the FULL read volume; misses go on.
  let hit = 0
  let dbReads = reads
  if (cfg.cache > 0) {
    hit = mods.hitRateOverride ?? Math.min(cfg.hitRate, mods.hitRateCap ?? 1)
    const uCache = util(reads, cfg.cache * CAP.cache.ops)
    if (uCache > 1 && reads > 0) readErr += ((reads - cfg.cache * CAP.cache.ops) / reads) * 0.5
    dbReads = reads * (1 - hit)
    const tag = mods.hitRateOverride !== undefined ? ' — STAMPEDE' : mods.hitRateCap !== undefined && cfg.hitRate > (mods.hitRateCap ?? 1) ? ' — capped' : ''
    comps.push({
      id: 'cache',
      label: `Cache ×${cfg.cache} (${Math.round(hit * 100)}% hit${tag})`,
      ch: 'mem',
      u: uCache,
      note: `${fmtNum(reads)} lookups/s · ${fmtNum(dbReads)} miss → DB`,
    })
  }

  // Queue tier — buys TIME, not capacity: drain is capped by the primary.
  let writesToDb = writes
  let backlog = backlogIn
  if (cfg.queue) {
    const drain = Math.min(cfg.workers * CAP.worker.drain * (mods.drainMult ?? 1), CAP.db.writes * cfg.shards)
    const arriving = writes + backlogIn
    writesToDb = Math.min(arriving, drain)
    backlog = Math.max(0, arriving - writesToDb)
    comps.push({
      id: 'queue',
      label: `Queue + ${cfg.workers} workers`,
      ch: 'net',
      u: util(writesToDb, drain),
      note: backlog > 0 ? `backlog ${fmtNum(backlog)} msgs` : `draining ${fmtNum(writesToDb)}/s`,
    })
  } else {
    backlog = 0
  }

  // DB tier — replicas take the misses if present, else the primary shares.
  const uDbW = util(writesToDb, CAP.db.writes * cfg.shards)
  let uDbR: number
  if (cfg.replicas > 0) {
    uDbR = util(dbReads, cfg.replicas * CAP.replica.reads)
    comps.push({
      id: 'dbw',
      label: `DB primary ×${cfg.shards} shard${cfg.shards > 1 ? 's' : ''}`,
      ch: 'storage',
      u: uDbW,
      note: `${fmtNum(writesToDb)} writes/s`,
    })
    comps.push({
      id: 'dbr',
      label: `Read replicas ×${cfg.replicas}`,
      ch: 'storage',
      u: uDbR,
      note: `${fmtNum(dbReads)} reads/s`,
    })
    if (uDbR > 1 && reads > 0) readErr += (dbReads - cfg.replicas * CAP.replica.reads) / reads
  } else {
    // No replicas: misses hit the primary. The primary has SEPARATE budgets
    // (10k writes/s AND 20k reads/s); the bar displays their shared total so
    // the player sees one saturating component, but overflow is per budget.
    uDbR = util(dbReads, CAP.db.reads * cfg.shards)
    comps.push({
      id: 'db',
      label: `DB primary ×${cfg.shards} (reads + writes)`,
      ch: 'storage',
      u: uDbW + uDbR,
      note: `${fmtNum(dbReads)} r/s + ${fmtNum(writesToDb)} w/s`,
    })
    if (uDbR > 1 && reads > 0) readErr += (dbReads - CAP.db.reads * cfg.shards) / reads
  }
  // Writes overflow the primary only on the direct path — a queue never loses
  // writes (that is its whole job); an undersized drain shows up as backlog.
  if (!cfg.queue && uDbW > 1) writeErr += Math.min(1, uDbW - 1)

  readErr = Math.min(1, readErr)
  writeErr = Math.min(1, writeErr)

  // Latency chain: LB → app → (cache →) db, mix-weighted.
  const appLat = CAP.app.baseMs * latencyMult(uApp)
  const cacheU = cfg.cache > 0 ? util(reads, cfg.cache * CAP.cache.ops) : 0
  const cacheLat = cfg.cache > 0 ? CAP.cache.baseMs * latencyMult(cacheU) : 0
  const dbLat = CAP.db.baseMs * latencyMult(cfg.replicas > 0 ? Math.max(uDbR, uDbW) : uDbR + uDbW)
  const readLat = CAP.lb.baseMs + appLat + hit * cacheLat + (1 - hit) * (cacheLat + dbLat)
  const writeLat = CAP.lb.baseMs + appLat + (cfg.queue ? 2 : CAP.db.baseMs * latencyMult(uDbW))
  const readShare = rps > 0 ? reads / rps : 0
  const p50 = readShare * readLat + (1 - readShare) * writeLat
  const p99 = Math.min(5000, p50 * 3.2)

  const errRate = Math.min(1, readErr * readShare + writeErr * (1 - readShare))
  return { rps, comps, p50, p99, errRate, readErr, writeErr, backlog, hit, readShare }
}

/* ---------- diagnosis (shared by Builder, On-Call post-mortems) ---------- */

/**
 * The worst (highest-utilization) frame of each tier across a whole run,
 * sorted hottest-first. Pure — the narration copy lives in diagnoseTiers so
 * modes can substitute their own voice.
 */
export function worstTiers(frames: Frame[]): TierFrame[] {
  const worst: Record<string, TierFrame> = {}
  for (const f of frames) {
    for (const c of f.comps) {
      if (!worst[c.id] || c.u > worst[c.id].u) worst[c.id] = c
    }
  }
  return Object.values(worst).sort((a, b) => b.u - a.u)
}

/** Standard post-mortem lines: which tiers saturated (≥1) or crossed the knee (≥0.8). */
export function diagnoseTiers(frames: Frame[]): string[] {
  const lines: string[] = []
  for (const c of worstTiers(frames)) {
    if (c.u >= 1) lines.push(`${c.label} hit ${(c.u * 100).toFixed(0)}% — beyond capacity, requests queue then die. (${c.note})`)
    else if (c.u >= 0.8)
      lines.push(
        `${c.label} peaked at ${(c.u * 100).toFixed(0)}% — past the ~80% knee, waiting time grows nonlinearly. It held, but one clump of traffic from failing.`,
      )
  }
  return lines
}

/* ---------- cost ---------- */
export const stackCost = (cfg: StackConfig): number =>
  cfg.app * CAP.app.cost +
  cfg.cache * CAP.cache.cost +
  cfg.shards * CAP.db.cost +
  cfg.replicas * CAP.replica.cost +
  (cfg.queue ? CAP.queue.cost + cfg.workers * CAP.worker.cost : 0)

/* ---------- On-Call damage model (docs/architecture.md) ---------- */
export interface DamageMods {
  /** Idempotency Keys: write-failure damage ×0.6 */
  idem?: boolean
  /** Graceful Degradation: p99 breaches deal no damage */
  degrade?: boolean
  /** Extra multiplier on write-failure damage (e.g. Dead-Letter Queue ×0.7). */
  writeDamageMult?: number
}

/** Damage per tick: errRate × 30 (write portion ×0.6 with idem) + 1.5 per p99 breach. */
export function tickDamage(frame: Frame, p99Target: number, mods: DamageMods = {}): number {
  const readPart = frame.readErr * frame.readShare
  const writePart = frame.writeErr * (1 - frame.readShare) * (mods.idem ? 0.6 : 1) * (mods.writeDamageMult ?? 1)
  let dmg = Math.min(1, readPart + writePart) * 30
  if (frame.p99 > p99Target && !mods.degrade) dmg += 1.5
  return dmg
}

/** Circuit Breaker caps per-encounter total damage at 30. */
export const BREAKER_CAP = 30

