// On-Call run content (docs/content-pipeline.md §8): patterns (relics),
// encounters, and the act map. Spec 060 grows this to 3 acts / 18 encounters /
// 12 patterns / 6 events / 3 bosses.

export interface Pattern {
  key: string
  name: string
  price: number
  icon: string
  /** game effect, one line */
  fx: string
  /** real-world explanation, interview-usable */
  irl: string
}

export const PATTERNS: Record<string, Pattern> = {
  autoscale: {
    key: 'autoscale',
    name: 'Autoscaling Group',
    price: 350,
    icon: '⇧',
    fx: 'When traffic exceeds 75% of forecast peak, +2 app servers spin up automatically.',
    irl: 'Real thing: scale-out rules on CPU/queue depth. The catch IRL: new instances take minutes to boot — autoscaling handles ramps, not spikes.',
  },
  cdn: {
    key: 'cdn',
    name: 'CDN Contract',
    price: 450,
    icon: '◍',
    fx: '45% of reads are served at the edge and never reach your stack.',
    irl: 'Real thing: CloudFront/Fastly cache static and cacheable content in 300+ cities. Often the single cheapest capacity you can buy.',
  },
  idem: {
    key: 'idem',
    name: 'Idempotency Keys',
    price: 300,
    icon: '≡',
    fx: 'Failed writes retry safely: error-budget damage from write failures reduced 40%.',
    irl: "Real thing: client sends a unique key per operation; server dedupes. Turns 'scary retry' into 'free retry'. Interviewers love hearing this.",
  },
  breaker: {
    key: 'breaker',
    name: 'Circuit Breaker',
    price: 400,
    icon: '⏻',
    fx: 'Total damage in any single encounter is capped at 30.',
    irl: "Real thing: when a dependency starts failing, stop calling it and fail fast — one sick component can't drag the whole system down with it.",
  },
  degrade: {
    key: 'degrade',
    name: 'Graceful Degradation',
    price: 250,
    icon: '◐',
    fx: 'Slow responses (p99 breaches) deal no damage — users get a stale-but-instant page.',
    irl: "Real thing: serve cached/stale content under load instead of timing out. 'Slightly old' beats 'error 503' almost always.",
  },
  drills: {
    key: 'drills',
    name: 'Chaos Drills',
    price: 200,
    icon: '◎',
    fx: 'Forecasts reveal the hidden mechanics of elite and boss encounters.',
    irl: "Real thing: Netflix-style chaos engineering — break it on purpose in daylight so it can't surprise you at 3am.",
  },
}

export interface EncounterMod {
  hitZero?: boolean
  hitCap?: number
  writeMult?: number
  rpsMult?: number
}

export interface Encounter {
  key: string
  name: string
  rps: number
  readPct: number
  ticks: number
  /** p99 target in ms */
  target: number
  flavor: string
  secret: string | null
  elite?: boolean
  boss?: boolean
  mod?: (t: number) => EncounterMod | null
}

export const ENCOUNTERS: Record<string, Encounter> = {
  launch: {
    key: 'launch',
    name: 'Launch Day',
    rps: 3000,
    readPct: 0.95,
    ticks: 14,
    target: 200,
    flavor: 'You shipped. A friendly trickle arrives — reads mostly, a few signups.',
    secret: null,
  },
  press: {
    key: 'press',
    name: 'Press Mention',
    rps: 18000,
    readPct: 0.97,
    ticks: 16,
    target: 200,
    flavor: 'A tech blog covered you. 18k req/s of curious readers, all loading the same pages.',
    secret: null,
  },
  stampede: {
    key: 'stampede',
    name: 'ELITE · Cache Stampede',
    rps: 15000,
    readPct: 0.92,
    ticks: 18,
    target: 200,
    elite: true,
    flavor: 'A deploy restarts your cache fleet mid-rush. For a while, EVERY read goes straight to the database.',
    secret: 'Ticks 8–13: cache hit rate forced to 0%. Capacity headroom on the DB is the only defense.',
    mod: (t) => (t >= 8 && t <= 13 ? { hitZero: true } : null),
  },
  feature: {
    key: 'feature',
    name: 'Feature Launch',
    rps: 26000,
    readPct: 0.85,
    ticks: 16,
    target: 200,
    flavor: 'The new feature lands on the homepage. Heavier traffic, and real write volume for the first time.',
    secret: null,
  },
  bots: {
    key: 'bots',
    name: 'ELITE · Scraper Swarm',
    rps: 34000,
    readPct: 0.99,
    ticks: 18,
    target: 200,
    elite: true,
    flavor: 'Bots crawl every page in your catalog. Huge read volume — but each URL is different.',
    secret: 'Cache hit rate is capped at 60% — bots never ask for the same thing twice. Replicas shine here.',
    mod: () => ({ hitCap: 0.6 }),
  },
  surge: {
    key: 'surge',
    name: 'Onboarding Surge',
    rps: 24000,
    readPct: 0.7,
    ticks: 16,
    target: 200,
    flavor: 'A partnership dumps new users on you. Signups, profile writes, uploads — the write side wakes up.',
    secret: null,
  },
  herd: {
    key: 'herd',
    name: 'BOSS · THE THUNDERING HERD',
    rps: 15000,
    readPct: 0.75,
    ticks: 26,
    target: 250,
    boss: true,
    flavor:
      'IPO eve. A mobile-network blip disconnects half your client fleet. They will ALL come back at once, resending everything they queued offline.',
    secret:
      'Ticks 9–20: writes ×3 and traffic ×1.3 as the herd reconnects. One primary cannot absorb it — buy capacity (shards) or buy time (queue).',
    mod: (t) => (t >= 9 && t <= 20 ? { writeMult: 3, rpsMult: 1.3 } : null),
  },
}

export type NodeKind = 'fight' | 'elite' | 'boss' | 'shop' | 'rest' | 'event'

export interface MapNode {
  kind: NodeKind
  enc?: string
}

export const LAYERS: MapNode[][] = [
  [{ kind: 'fight', enc: 'launch' }],
  [{ kind: 'fight', enc: 'press' }],
  [{ kind: 'rest' }, { kind: 'shop' }],
  [{ kind: 'elite', enc: 'stampede' }],
  [{ kind: 'event' }],
  [{ kind: 'fight', enc: 'feature' }],
  [{ kind: 'elite', enc: 'bots' }, { kind: 'fight', enc: 'surge' }],
  [{ kind: 'shop' }],
  [{ kind: 'rest' }],
  [{ kind: 'boss', enc: 'herd' }],
]

export const NODE_META: Record<NodeKind, { label: string; icon: string; colKey: 'net' | 'storage' | 'alert' | 'gold' | 'mem' | 'compute' }> = {
  fight: { label: 'Traffic', icon: '▲', colKey: 'net' },
  elite: { label: 'Elite', icon: '◆', colKey: 'storage' },
  boss: { label: 'Boss', icon: '☠', colKey: 'alert' },
  shop: { label: 'Vendor', icon: '$', colKey: 'gold' },
  rest: { label: 'Sprint break', icon: '☕', colKey: 'mem' },
  event: { label: 'Page at 3am', icon: '?', colKey: 'compute' },
}

/** Run economy (reference prototype). */
export const RUN = {
  startHp: 100,
  startGold: 900,
  fightReward: 700,
  eliteReward: 1100,
  draftGold: 400,
  restHp: 30,
  restGold: 500,
  eventHpCost: 10,
  eventGoldCost: 400,
  shopHealCost: 250,
  shopHealAmount: 20,
  sellRefund: 0.6,
  /** stranded-backlog penalty at encounter end */
  strandedLagThreshold: 2000,
  strandedLagDamage: 8,
  /** 3+ workers drain synergy */
  workerSynergyCount: 3,
  workerSynergyMult: 1.25,
  /** autoscale pattern trigger + bonus */
  autoscaleTrigger: 0.75,
  autoscaleBonus: 2,
  /** cdn pattern effects */
  cdnReadMult: 0.55,
  cdnHitBonus: 0.05,
} as const
