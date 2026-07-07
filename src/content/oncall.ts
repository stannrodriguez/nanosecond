// On-Call run content (docs/content-pipeline.md §8): patterns (relics),
// encounters, events, and the three-act map. Spec 060 grows this to 3 acts /
// 18 encounters / 12 patterns / 6 events / 3 bosses (Thundering Herd,
// Black Friday, The Region Outage). Escalation per §8: act 1 = capacity,
// act 2 = capacity + one modifier, act 3 = interacting modifiers.

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
  ratelimit: {
    key: 'ratelimit',
    name: 'Rate Limiter',
    price: 300,
    icon: '⚖',
    fx: 'Incoming traffic is capped at 1.5× forecast — spikes above that are shed as instant 429s, dealing no damage.',
    irl: 'Real thing: token-bucket limits per client/route. Sheds the abusive tail so the honest majority stays fast — the load you drop is load you never have to survive.',
  },
  bulkhead: {
    key: 'bulkhead',
    name: 'Bulkhead',
    price: 350,
    icon: '▤',
    fx: 'Isolated resource pools: no single tick can deal more than 4 damage, however bad it gets.',
    irl: 'Real thing: separate thread pools / connection pools per dependency, like a ship’s watertight compartments. One flooded pool can’t sink the rest.',
  },
  dlq: {
    key: 'dlq',
    name: 'Dead-Letter Queue',
    price: 250,
    icon: '⌫',
    fx: 'Failed writes park safely instead of hurting: stranded-backlog penalty never applies and write-failure damage is reduced 30%.',
    irl: 'Real thing: messages that fail processing move to a side queue for later replay instead of blocking or being lost. Turns "dropped forever" into "retried on Monday".',
  },
  readthrough: {
    key: 'readthrough',
    name: 'Read-Through Cache',
    price: 400,
    icon: '⟳',
    fx: 'The cache self-warms: effective hit rate +10%, and a cold-cache event can never drop it below 40%.',
    irl: 'Real thing: the cache loads-on-miss and repopulates itself, so a flush degrades instead of face-planting. No hand-written cache-fill code to get wrong.',
  },
  canary: {
    key: 'canary',
    name: 'Canary Deploys',
    price: 300,
    icon: '◔',
    fx: 'You ramp into every encounter behind a canary: its first 3 ticks deal no damage while you watch the graphs.',
    irl: 'Real thing: ship to 1% of traffic first, watch error rates, then roll forward or back. Most bad deploys die in the canary instead of in production.',
  },
  multiaz: {
    key: 'multiaz',
    name: 'Multi-AZ',
    price: 450,
    icon: '⬡',
    fx: 'Redundancy across availability zones: all error-budget damage reduced 20%.',
    irl: 'Real thing: run in ≥3 zones so one datacenter failing is a shrug, not an outage. The tax is cross-AZ latency and 3× the footprint — redundancy is never free.',
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
  /** boss/flaw post-mortems attach real public incidents (spec 060) */
  happened?: string[]
}

export const ENCOUNTERS: Record<string, Encounter> = {
  /* ============ ACT 1 — STARTUP · capacity only ============ */
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
  frontpage: {
    key: 'frontpage',
    name: 'Front Page of the Internet',
    rps: 30000,
    readPct: 0.98,
    ticks: 16,
    target: 200,
    flavor: 'Someone posted you to the big aggregator. A wall of read traffic, all hitting the same three URLs.',
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
    secret: 'Ticks 8–13: cache hit rate forced to 0%. Capacity headroom on the DB (or a read-through cache) is the only defense.',
    mod: (t) => (t >= 8 && t <= 13 ? { hitZero: true } : null),
  },
  herd: {
    key: 'herd',
    name: 'BOSS · THE THUNDERING HERD',
    rps: 15000,
    readPct: 0.75,
    ticks: 26,
    target: 250,
    boss: true,
    happened: ['slack-2021'],
    flavor:
      'A mobile-network blip disconnects half your client fleet. They will ALL come back at once, resending everything they queued offline.',
    secret:
      'Ticks 9–20: writes ×3 and traffic ×1.3 as the herd reconnects. One primary cannot absorb it — buy capacity (shards) or buy time (queue).',
    mod: (t) => (t >= 9 && t <= 20 ? { writeMult: 3, rpsMult: 1.3 } : null),
  },

  /* ============ ACT 2 — SCALE · capacity + one modifier ============ */
  feature: {
    key: 'feature',
    name: 'Feature Launch',
    rps: 28000,
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
  hotkey: {
    key: 'hotkey',
    name: 'Celebrity Hot Key',
    rps: 32000,
    readPct: 0.9,
    ticks: 18,
    target: 200,
    flavor: 'One influencer’s profile is 90% of your reads. A single key, a single shard, one very hot node.',
    secret: 'Ticks 6–14: this key can’t spread across shards — hit rate capped at 70%. Cache and replicas, not more shards.',
    mod: (t) => (t >= 6 && t <= 14 ? { hitCap: 0.7 } : null),
  },
  flashsale: {
    key: 'flashsale',
    name: 'Flash Sale',
    rps: 30000,
    readPct: 0.55,
    ticks: 18,
    target: 200,
    flavor: 'A limited drop goes live at noon. Everyone hits "buy" in the same 30 seconds — writes, not reads.',
    secret: 'Ticks 7–13: writes ×2 as carts convert. Shard the primary or queue the checkouts.',
    mod: (t) => (t >= 7 && t <= 13 ? { writeMult: 2 } : null),
  },
  viral: {
    key: 'viral',
    name: 'ELITE · The Viral Spike',
    rps: 26000,
    readPct: 0.94,
    ticks: 20,
    target: 200,
    elite: true,
    flavor: 'A clip explodes overnight. Traffic doubles in a single tick and keeps climbing — faster than any human can react.',
    secret: 'Ticks 8–15: traffic ×2.1. Autoscaling can’t boot fast enough; you need standing headroom or a rate limiter.',
    mod: (t) => (t >= 8 && t <= 15 ? { rpsMult: 2.1 } : null),
  },
  blackfriday: {
    key: 'blackfriday',
    name: 'BOSS · BLACK FRIDAY',
    rps: 30000,
    readPct: 0.6,
    ticks: 28,
    target: 250,
    boss: true,
    happened: ['cloudflare-2019', 'github-2018'],
    flavor:
      'The whole year rides on today. Sustained record load with a doorbuster spike at the top of every hour — reads to browse, writes to buy.',
    secret:
      'Ticks 8–19: writes ×2 AND traffic ×1.4 together — a capacity floor with a spike riding on it. Shards handle the writes; cache + replicas handle the reads; a queue smooths the checkout crush.',
    mod: (t) => (t >= 8 && t <= 19 ? { writeMult: 2, rpsMult: 1.4 } : null),
  },

  /* ============ ACT 3 — GLOBAL · interacting modifiers ============ */
  coldstart: {
    key: 'coldstart',
    name: 'Cold-Start Cascade',
    rps: 26000,
    readPct: 0.9,
    ticks: 20,
    target: 200,
    flavor: 'A region fails over to you. Traffic jumps AND arrives cache-cold — two problems landing on the same tick.',
    secret: 'Ticks 7–14: hit rate 0% and traffic ×1.4 at once. A read-through cache keeps a floor; DB headroom carries the rest.',
    mod: (t) => (t >= 7 && t <= 14 ? { hitZero: true, rpsMult: 1.4 } : null),
  },
  retrywar: {
    key: 'retrywar',
    name: 'ELITE · Retry Storm',
    rps: 24000,
    readPct: 0.5,
    ticks: 20,
    target: 200,
    elite: true,
    flavor: 'A downstream hiccup makes every client retry — and their retries make it worse. A self-reinforcing write flood.',
    secret: 'Ticks 6–15: writes ×2.5 and traffic ×1.3. Idempotency keys defang the retries; a dead-letter queue parks the overflow.',
    mod: (t) => (t >= 6 && t <= 15 ? { writeMult: 2.5, rpsMult: 1.3 } : null),
  },
  brownout: {
    key: 'brownout',
    name: 'Capacity Brownout',
    rps: 30000,
    readPct: 0.85,
    ticks: 20,
    target: 200,
    flavor: 'A noisy-neighbor tenant steals your cache and starves your reads while writes keep climbing.',
    secret: 'Ticks 7–15: hit rate capped at 50% while writes ×1.6. Replicas absorb the reads; shards absorb the writes.',
    mod: (t) => (t >= 7 && t <= 15 ? { hitCap: 0.5, writeMult: 1.6 } : null),
  },
  grayfail: {
    key: 'grayfail',
    name: 'Gray Failure',
    rps: 30000,
    readPct: 0.8,
    ticks: 20,
    target: 200,
    flavor: 'Nothing is “down” — but one replica is quietly slow and the cache is quietly thinning. Two soft failures the dashboards barely show.',
    secret: 'Ticks 6–14: hit rate capped at 60% while traffic ×1.3 — a brownout hiding behind green status lights. Replicas and a read-through cache keep the reads honest.',
    mod: (t) => (t >= 6 && t <= 14 ? { hitCap: 0.6, rpsMult: 1.3 } : null),
  },
  peak: {
    key: 'peak',
    name: 'ELITE · Global Peak',
    rps: 44000,
    readPct: 0.93,
    ticks: 20,
    target: 200,
    elite: true,
    flavor: 'Every timezone awake at once. No trick here — just the largest sustained wall of traffic you have ever taken.',
    secret: 'No modifier — this is raw scale. Everything on: CDN, cache, replicas, shards. If any one tier is thin, it buckles.',
  },
  region: {
    key: 'region',
    name: 'BOSS · THE REGION OUTAGE',
    rps: 28000,
    readPct: 0.7,
    ticks: 30,
    target: 250,
    boss: true,
    happened: ['s3-2017', 'facebook-bgp-2021'],
    flavor:
      'An entire cloud region goes dark. Every user it served stampedes to yours — cache-cold, retrying blindly, all at once. This is every mechanic at the same time.',
    secret:
      'Ticks 9–22: hit rate 0%, traffic ×1.6, AND writes ×2 — simultaneously. No single fix covers it: pair capacity (shards + replicas + read-through) with time (queue) or blast-radius control (rate limiter, breaker, multi-AZ).',
    mod: (t) => (t >= 9 && t <= 22 ? { hitZero: true, rpsMult: 1.6, writeMult: 2 } : null),
  },
}

/* --------- "This Actually Happened": official public post-mortems only --------- */
export interface RealIncident {
  id: string
  title: string
  when: string
  /** one-line what-broke, in the game's failure vocabulary */
  what: string
  /** the lesson that maps back to a pattern the player just used */
  lesson: string
  /** official writeup only */
  url: string
}

export const HAPPENED: Record<string, RealIncident> = {
  's3-2017': {
    id: 's3-2017',
    title: 'Amazon S3 outage',
    when: 'Feb 28, 2017',
    what: 'A typo in a debugging command removed too many capacity servers; restarting the index subsystem took hours because it had not been fully restarted in years.',
    lesson: 'Recovery is a code path too — if you never rehearse the restart, the restart is the outage. Blast-radius limits (multi-AZ, cells) keep one region’s bad day from becoming everyone’s.',
    url: 'https://aws.amazon.com/message/41926/',
  },
  'cloudflare-2019': {
    id: 'cloudflare-2019',
    title: 'Cloudflare global CPU exhaustion',
    when: 'Jul 2, 2019',
    what: 'One regular expression with catastrophic backtracking pinned CPU to 100% across the fleet, taking the proxy down worldwide.',
    lesson: 'A single hot component can eat all your capacity. Bulkheads and CPU budgets per rule keep one bad line from starving everything else.',
    url: 'https://blog.cloudflare.com/details-of-the-cloudflare-outage-on-july-2-2019/',
  },
  'github-2018': {
    id: 'github-2018',
    title: 'GitHub 24-hour degradation',
    when: 'Oct 21, 2018',
    what: 'A 43-second network partition triggered an automated MySQL failover; the two coasts diverged (split-brain) and reconciling the data took a full day.',
    lesson: 'Automated failover under a partition can make things worse. Idempotency and careful write-fencing decide whether a blip becomes a day-long reconciliation.',
    url: 'https://github.blog/2018-10-30-oct21-post-incident-analysis/',
  },
  'slack-2021': {
    id: 'slack-2021',
    title: 'Slack new-year outage',
    when: 'Jan 4, 2021',
    what: 'Everyone logged on at once after the holidays; the reconnect load plus an autoscaling shortfall and provider network saturation cascaded into a full outage.',
    lesson: 'The thundering herd is real: clients reconnecting in unison can dwarf steady-state load. Standing headroom, rate limits, and jittered backoff are the defense — autoscaling alone is too slow.',
    url: 'https://slack.engineering/slacks-outage-on-january-4th-2021/',
  },
  'facebook-bgp-2021': {
    id: 'facebook-bgp-2021',
    title: 'Facebook / Meta BGP withdrawal',
    when: 'Oct 4, 2021',
    what: 'A faulty config change withdrew the BGP routes to Facebook’s DNS, disconnecting every service — and the tools and badge systems needed to fix it — for ~6 hours.',
    lesson: 'Control-plane and recovery paths must not depend on the thing they recover. Independent break-glass access and staged config rollout keep a bad push from locking you out.',
    url: 'https://engineering.fb.com/2021/10/04/networking-traffic/outage/',
  },
}

/* --------------------------- events (6) --------------------------- */
export interface EventChoice {
  title: string
  sub: string
  hp?: number
  gold?: number
}
export interface OnCallEvent {
  key: string
  title: string
  col: 'compute' | 'net' | 'mem' | 'storage'
  flavor: string
  choices: [EventChoice, EventChoice]
}

export const EVENTS: Record<string, OnCallEvent> = {
  migration: {
    key: 'migration',
    title: 'PAGE AT 3AM',
    col: 'compute',
    flavor:
      'A schema migration must run before the next launch, and it takes a table lock. The safe way costs money; the fast way costs trust. (This exact tradeoff has ruined a thousand real Tuesdays.)',
    choices: [
      { title: 'Run it live tonight', sub: 'The lock stalls writes for 40 seconds. Some users see errors. It’s over quickly.', hp: -10 },
      { title: 'Blue-green migration', sub: 'Stand up a copy, migrate it, switch traffic over. Zero user impact — paid for in cloud bills.', gold: -400 },
    ],
  },
  retro: {
    key: 'retro',
    title: 'INCIDENT REVIEW',
    col: 'mem',
    flavor:
      'Last week’s near-miss is still fresh. The team wants a blameless retro to actually fix the root cause; the roadmap wants the next feature yesterday.',
    choices: [
      { title: 'Hold the blameless retro', sub: 'A boring afternoon that turns one outage into a permanent safeguard. Trust rebuilds.', gold: -200, hp: 15 },
      { title: 'Ship the feature instead', sub: 'Velocity now, latent risk later. The root cause is still there, waiting.', gold: 150, hp: -8 },
    ],
  },
  vendor: {
    key: 'vendor',
    title: 'BUILD VS BUY',
    col: 'net',
    flavor:
      'A managed service would take a whole subsystem off your plate — for a price, and a new dependency you don’t control. Or you keep it in-house and keep the pager.',
    choices: [
      { title: 'Adopt the managed service', sub: 'Cash up front and one more thing that can page you at 3am, but real capacity relief.', gold: 300, hp: -12 },
      { title: 'Keep it in-house', sub: 'You own the code and the uptime. Costs engineering time; buys you control.', gold: -250, hp: 6 },
    ],
  },
  hiring: {
    key: 'hiring',
    title: 'STAFF THE ROTATION',
    col: 'mem',
    flavor:
      'The on-call rotation is three people deep and everyone is tired. You can fund a real SRE hire, or ask the team to hold the line one more quarter.',
    choices: [
      { title: 'Hire an SRE', sub: 'A steadier rotation, better runbooks, fewer 3am pages. Payroll isn’t cheap.', gold: -300, hp: 20 },
      { title: 'Push the current crew', sub: 'Money stays in the bank; burnout compounds and mistakes creep in.', gold: 200, hp: -10 },
    ],
  },
  security: {
    key: 'security',
    title: 'CVE DROPPED',
    col: 'compute',
    flavor:
      'A critical CVE just landed in a dependency you ship. Patch it tonight in a rush, or schedule a careful maintenance window that costs you a paid stand-up environment.',
    choices: [
      { title: 'Emergency patch tonight', sub: 'Rushed rollout, some fallout, but the hole is closed fast.', hp: -12 },
      { title: 'Scheduled maintenance window', sub: 'Stand up a staging copy, test, roll out clean. Paid for in cloud bills.', gold: -300 },
    ],
  },
  techdebt: {
    key: 'techdebt',
    title: 'DEBT SPRINT',
    col: 'storage',
    flavor:
      'There’s a quiet week. You can spend it paying down the flaky-retry, missing-timeout debt that keeps biting — or bank the runway and keep moving.',
    choices: [
      { title: 'Pay down the debt', sub: 'Add the timeouts, fix the retries, delete the footguns. The system gets quietly sturdier.', gold: -250, hp: 18 },
      { title: 'Bank the runway', sub: 'Keep the cash; keep the debt. It’ll still be here next incident.', hp: -6 },
    ],
  },
}

export type NodeKind = 'fight' | 'elite' | 'boss' | 'shop' | 'rest' | 'event'

export interface MapNode {
  kind: NodeKind
  enc?: string
  /** event key (for kind === 'event') */
  event?: string
}

export interface Act {
  name: string
  tagline: string
  layers: MapNode[][]
}

export const ACTS: Act[] = [
  {
    name: 'ACT I · STARTUP',
    tagline: 'Raw capacity. Nothing hides here — if a tier is thin, the traffic finds it.',
    layers: [
      [{ kind: 'fight', enc: 'launch' }],
      [{ kind: 'fight', enc: 'press' }],
      [{ kind: 'rest' }, { kind: 'shop' }],
      [{ kind: 'elite', enc: 'stampede' }],
      [{ kind: 'event', event: 'migration' }],
      [{ kind: 'fight', enc: 'surge' }, { kind: 'fight', enc: 'frontpage' }],
      [{ kind: 'shop' }],
      [{ kind: 'boss', enc: 'herd' }],
    ],
  },
  {
    name: 'ACT II · SCALE',
    tagline: 'Capacity plus a twist. Each fight bends one dial — a spike, a cold cache, a write flood.',
    layers: [
      [{ kind: 'fight', enc: 'feature' }],
      [{ kind: 'elite', enc: 'viral' }, { kind: 'fight', enc: 'flashsale' }],
      [{ kind: 'event', event: 'retro' }],
      [{ kind: 'shop' }, { kind: 'rest' }],
      [{ kind: 'fight', enc: 'hotkey' }],
      [{ kind: 'elite', enc: 'bots' }],
      [{ kind: 'event', event: 'vendor' }],
      [{ kind: 'boss', enc: 'blackfriday' }],
    ],
  },
  {
    name: 'ACT III · GLOBAL',
    tagline: 'Modifiers stack and interact. One trick isn’t enough — the fixes have to compose.',
    layers: [
      [{ kind: 'fight', enc: 'coldstart' }],
      [{ kind: 'elite', enc: 'retrywar' }, { kind: 'fight', enc: 'brownout' }],
      [{ kind: 'event', event: 'security' }],
      [{ kind: 'shop' }, { kind: 'rest' }],
      [{ kind: 'elite', enc: 'peak' }, { kind: 'fight', enc: 'grayfail' }],
      [{ kind: 'event', event: 'techdebt' }],
      [{ kind: 'shop' }],
      [{ kind: 'boss', enc: 'region' }],
    ],
  },
]

/** Flat layer list across all acts (the run's spine). Each entry knows its act. */
export const RUN_LAYERS: { act: number; layer: MapNode[] }[] = ACTS.flatMap((act, ai) =>
  act.layers.map((layer) => ({ act: ai, layer })),
)

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
  fightReward: 550,
  eliteReward: 850,
  bossReward: 1000,
  draftGold: 400,
  restHp: 30,
  restGold: 500,
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
  /** rate limiter: cap intake at 1.5× forecast peak */
  rateLimitCap: 1.5,
  /** bulkhead: max damage from any single tick */
  bulkheadCap: 4,
  /** dead-letter queue: write-failure damage multiplier */
  dlqWriteMult: 0.7,
  /** read-through cache: hit-rate bonus + cold-cache floor */
  readthroughBonus: 0.1,
  readthroughFloor: 0.4,
  /** canary: first N ticks of every encounter deal no damage */
  canaryTicks: 3,
  /** multi-AZ: all damage multiplier */
  multiazMult: 0.8,
} as const

/* ----------------------------- score formula ----------------------------- */
/** A run's final score (docs/product-spec §3.7). Deterministic, derivable:
 *  each act cleared is worth 1000, every point of error budget you kept is 5,
 *  each $100 of unspent cloud budget is 10, each pattern mastered is 40, and
 *  surviving to IPO is a flat +2000. Losing zeros the survival bonus, not the
 *  progress you made getting there. */
export const SCORE = {
  perAct: 1000,
  perHp: 5,
  perGoldHundred: 10,
  perPattern: 40,
  survival: 2000,
} as const

export function runScore(input: { actsCleared: number; hp: number; gold: number; patterns: number; won: boolean }): number {
  return Math.round(
    input.actsCleared * SCORE.perAct +
      Math.max(0, input.hp) * SCORE.perHp +
      Math.floor(Math.max(0, input.gold) / 100) * SCORE.perGoldHundred +
      input.patterns * SCORE.perPattern +
      (input.won ? SCORE.survival : 0),
  )
}
