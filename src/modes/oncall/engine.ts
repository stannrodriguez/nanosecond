// On-Call encounter math, factored out of the screen (spec 060). Pure: the
// balance suite runs these directly, and the tick runner drives oncallTick.

import { BREAKER_CAP, CAP, simTick, tickDamage, type Frame, type StackConfig } from '../../engine/capacity'
import { RUN, type Encounter } from '../../content/oncall'

export const PRICE = {
  app: CAP.app.cost,
  cache: CAP.cache.cost,
  shard: CAP.db.cost,
  replica: CAP.replica.cost,
  queue: CAP.queue.cost,
  worker: CAP.worker.cost,
}

export interface DraftOption {
  kind: 'pat' | 'gold'
  k?: string
  amt?: number
}

export interface GameState {
  phase: 'map' | 'encounter' | 'shop' | 'rest' | 'event'
  layer: number
  node: import('../../content/oncall').MapNode | null
  hp: number
  gold: number
  cfg: StackConfig
  pats: string[]
  draft: DraftOption[] | null
  /** how many acts (0..3) the player has fully cleared this run */
  actsCleared: number
  over: { win: boolean; why?: string } | null
}

export const freshGame = (): GameState => ({
  phase: 'map',
  layer: 0,
  node: null,
  hp: RUN.startHp,
  gold: RUN.startGold,
  cfg: { app: 2, cache: 0, hitRate: 0.8, replicas: 0, shards: 1, queue: false, workers: 2 },
  pats: [],
  draft: null,
  actsCleared: 0,
  over: null,
})

/** One encounter tick through the shared engine, with pattern effects applied. */
export function oncallTick(cfg: StackConfig, enc: Encounter, t: number, pats: string[], backlog: number): Frame {
  const m = enc.mod ? enc.mod(t) ?? {} : {}
  const ramp = Math.min(1, t / 6)
  let rps0 = enc.rps * ramp * (m.rpsMult ?? 1)
  // Rate Limiter: shed everything above 1.5× forecast peak as instant 429s.
  if (pats.includes('ratelimit')) rps0 = Math.min(rps0, enc.rps * RUN.rateLimitCap)

  let reads = rps0 * enc.readPct
  const writes = rps0 * (1 - enc.readPct) * (m.writeMult ?? 1)
  if (pats.includes('cdn')) reads *= RUN.cdnReadMult

  // Cache hit bonuses (CDN edge warmth + Read-Through self-warming).
  let hitRate = cfg.hitRate
  if (pats.includes('cdn') && cfg.cache > 0) hitRate += RUN.cdnHitBonus
  if (pats.includes('readthrough')) hitRate += RUN.readthroughBonus
  const effCfg: StackConfig = { ...cfg, hitRate: Math.min(0.95, hitRate) }

  // Cold-cache events: Read-Through keeps a floor instead of face-planting to 0.
  const hitZeroValue = pats.includes('readthrough') ? RUN.readthroughFloor : 0

  return simTick(effCfg, reads, writes, backlog, {
    hitRateOverride: m.hitZero ? hitZeroValue : undefined,
    hitRateCap: pats.includes('readthrough') && m.hitCap !== undefined ? Math.max(m.hitCap, RUN.readthroughFloor) : m.hitCap,
    appCount: pats.includes('autoscale') && rps0 > RUN.autoscaleTrigger * enc.rps ? cfg.app + RUN.autoscaleBonus : undefined,
    drainMult: cfg.workers >= RUN.workerSynergyCount ? RUN.workerSynergyMult : 1,
  })
}

/** Total error-budget damage for a full encounter, all pattern effects applied.
 *  The single source of truth for the runner AND the balance suite. */
export function encounterDamage(frames: Frame[], enc: Encounter, pats: string[]): { dmg: number; strandedLag: number } {
  const writeDamageMult = pats.includes('dlq') ? RUN.dlqWriteMult : 1
  let dmg = 0
  frames.forEach((f, i) => {
    // Canary: the first few ticks ramp behind a canary and deal no damage.
    if (pats.includes('canary') && i < RUN.canaryTicks) return
    let d = tickDamage(f, enc.target, {
      idem: pats.includes('idem'),
      degrade: pats.includes('degrade'),
      writeDamageMult,
    })
    // Bulkhead: isolated pools cap the blast of any single tick.
    if (pats.includes('bulkhead')) d = Math.min(d, RUN.bulkheadCap)
    dmg += d
  })
  // Multi-AZ: redundancy shaves total damage.
  if (pats.includes('multiaz')) dmg *= RUN.multiazMult
  // Circuit Breaker: cap the whole encounter.
  if (pats.includes('breaker')) dmg = Math.min(BREAKER_CAP, dmg)

  const strandedBacklog = frames.length ? frames[frames.length - 1].backlog : 0
  const strandedLag =
    strandedBacklog > RUN.strandedLagThreshold && !pats.includes('dlq') ? RUN.strandedLagDamage : 0

  return { dmg, strandedLag }
}
