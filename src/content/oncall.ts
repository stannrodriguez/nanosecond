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
    fx: 'When traffic passes 75% of forecast peak, +2 app servers spin up automatically.',
    irl: 'Scale-out rules watch CPU or queue depth and add capacity as load climbs. The catch in production is boot time: new instances take minutes to come up, so autoscaling handles ramps, not sudden spikes.',
  },
  cdn: {
    key: 'cdn',
    name: 'CDN Contract',
    price: 450,
    icon: '◍',
    fx: '45% of reads are served at the edge and never reach your stack.',
    irl: 'Services like CloudFront and Fastly cache static and cacheable responses in 300+ cities close to users. Pushing reads to the edge is often the cheapest capacity you can buy.',
  },
  idem: {
    key: 'idem',
    name: 'Idempotency Keys',
    price: 300,
    icon: '≡',
    fx: 'Failed writes retry cleanly: error-budget damage from write failures drops by 40%.',
    irl: 'Each client attaches a unique key per operation, and the server deduplicates repeats. Once a retry cannot double-charge or double-insert, retrying stops being risky and becomes safe to automate.',
  },
  breaker: {
    key: 'breaker',
    name: 'Circuit Breaker',
    price: 400,
    icon: '⏻',
    fx: 'Total error-budget damage in any single encounter is capped at 30.',
    irl: 'When a dependency starts failing, a breaker opens and fails fast instead of letting timeouts pile up. One sick component cannot drag the rest of your stack down with it.',
  },
  degrade: {
    key: 'degrade',
    name: 'Graceful Degradation',
    price: 250,
    icon: '◐',
    fx: 'Slow responses (p99 breaches) deal no damage. Users get a stale, instant page instead.',
    irl: 'Under heavy load, you serve cached or trimmed content instead of timing out. A slightly stale page almost always beats an error 503.',
  },
  drills: {
    key: 'drills',
    name: 'Chaos Drills',
    price: 200,
    icon: '◎',
    fx: 'Forecasts reveal the hidden mechanics of elite and boss encounters.',
    irl: 'Netflix-style chaos engineering breaks things on purpose in daylight, while the team is awake to watch. The goal is simple: no failure mode should introduce itself for the first time at 3am.',
  },
  ratelimit: {
    key: 'ratelimit',
    name: 'Rate Limiter',
    price: 300,
    icon: '⚖',
    fx: 'Incoming traffic is capped at 1.5× forecast. Anything above that sheds as instant 429s with no damage.',
    irl: 'Token-bucket limits per client or route shed excess traffic at the door before it saturates your fleet. Dropping the abusive tail keeps the honest majority fast, because load you refuse is load you never have to survive.',
  },
  bulkhead: {
    key: 'bulkhead',
    name: 'Bulkhead',
    price: 350,
    icon: '▤',
    fx: 'Isolated resource pools cap damage from any single tick at 4.',
    irl: 'Separate thread pools and connection pools per dependency work like watertight compartments on a ship. One flooded pool stays contained instead of sinking the whole service.',
  },
  dlq: {
    key: 'dlq',
    name: 'Dead-Letter Queue',
    price: 250,
    icon: '⌫',
    fx: 'Stranded-backlog penalties never apply, and write-failure damage drops by 30%.',
    irl: 'Messages that fail processing move to a side queue for later replay instead of blocking healthy traffic or vanishing. It turns lost data into a Monday-morning replay.',
  },
  readthrough: {
    key: 'readthrough',
    name: 'Read-Through Cache',
    price: 400,
    icon: '⟳',
    fx: 'The cache self-warms: effective hit rate gains +10%, and a cold-cache event never drops it below 40%.',
    irl: 'On a miss, the cache fetches from storage and repopulates itself, so a flush degrades smoothly instead of collapsing. There is no hand-written cache-fill code to drift out of sync.',
  },
  canary: {
    key: 'canary',
    name: 'Canary Deploys',
    price: 300,
    icon: '◔',
    fx: 'Every encounter opens behind a canary: the first 3 ticks deal no damage while you watch the graphs.',
    irl: 'Ship a change to 1% of traffic first, watch error rates, then roll forward or roll back. Most bad deploys get caught in the canary before the rest of production ever sees them.',
  },
  multiaz: {
    key: 'multiaz',
    name: 'Multi-AZ',
    price: 450,
    icon: '⬡',
    fx: 'Redundancy across availability zones cuts all error-budget damage by 20%.',
    irl: 'Running in ≥3 availability zones turns one datacenter going dark into a routine failover. You pay for that margin in cross-AZ latency and 3× the footprint, because redundancy is never free.',
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
    flavor: 'You shipped. A friendly trickle of traffic arrives, mostly reads with a handful of signups.',
    secret: null,
  },
  press: {
    key: 'press',
    name: 'Press Mention',
    rps: 18000,
    readPct: 0.97,
    ticks: 16,
    target: 200,
    flavor: 'A tech blog picked you up. 18k req/s of curious readers are all loading the same few pages.',
    secret: null,
  },
  surge: {
    key: 'surge',
    name: 'Onboarding Surge',
    rps: 24000,
    readPct: 0.7,
    ticks: 16,
    target: 200,
    flavor: 'A partner launch sends a wave of new accounts your way. Signups, profile writes, and uploads wake up the write path.',
    secret: null,
  },
  frontpage: {
    key: 'frontpage',
    name: 'Front Page of the Internet',
    rps: 30000,
    readPct: 0.98,
    ticks: 16,
    target: 200,
    flavor: 'Someone linked you on the big aggregator. A wall of readers arrives, almost all hitting the same three URLs.',
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
    flavor: 'A deploy restarts your cache fleet mid-rush. For several ticks, every single read falls straight through to the database.',
    secret: 'Ticks 8 to 13: cache hit rate drops to 0%. Headroom on the database, or a read-through cache, is the only defense.',
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
      'A mobile-network blip drops half your client fleet. When connectivity returns, every client reconnects at once and flushes everything it queued offline.',
    secret:
      'Ticks 9 to 20: writes ×3 and traffic ×1.3 as the herd reconnects. One primary cannot swallow it. Buy capacity with shards, or buy time with a queue.',
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
    flavor: 'The new feature lands on the homepage. Overall traffic climbs, and writes carry real weight for the first time.',
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
    flavor: 'Bots crawl every page in your catalog. Read volume spikes, and almost every URL is unique.',
    secret: 'Cache hit rate is capped at 60% because scrapers rarely ask for the same page twice. Read replicas carry the load here.',
    mod: () => ({ hitCap: 0.6 }),
  },
  hotkey: {
    key: 'hotkey',
    name: 'Celebrity Hot Key',
    rps: 32000,
    readPct: 0.9,
    ticks: 18,
    target: 200,
    flavor: 'One influencer’s profile is driving 90% of your reads. One key, one shard, one very hot node.',
    secret: 'Ticks 6 to 14: this key cannot spread across shards, and cache hit rate is capped at 70%. Reach for cache and replicas, not more shards.',
    mod: (t) => (t >= 6 && t <= 14 ? { hitCap: 0.7 } : null),
  },
  flashsale: {
    key: 'flashsale',
    name: 'Flash Sale',
    rps: 30000,
    readPct: 0.55,
    ticks: 18,
    target: 200,
    flavor: 'A limited drop opens at noon. Everyone hits "buy" inside the same 30 seconds, turning a browse session into a write storm.',
    secret: 'Ticks 7 to 13: writes ×2 as carts convert at once. Shard the primary or put a queue in front of checkout.',
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
    flavor: 'A clip takes off overnight. Traffic more than doubles in a single tick and keeps climbing, faster than any human can react.',
    secret: 'Ticks 8 to 15: traffic ×2.1. Autoscaling cannot boot fast enough, so you need standing headroom or a rate limiter.',
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
      'The whole year rides on today. Sustained record load meets a doorbuster surge at the top of every hour: heavy reads to browse, heavy writes to buy.',
    secret:
      'Ticks 8 to 19: writes ×2 and traffic ×1.4 on top of a high floor. Shards absorb the writes, cache and replicas carry the reads, and a queue smooths the checkout crush.',
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
    flavor: 'Another region fails over into yours. Traffic jumps and arrives cache-cold, landing two problems on the same tick.',
    secret: 'Ticks 7 to 14: cache hit rate drops to 0% while traffic runs at ×1.4. A read-through cache holds a floor, and database headroom carries the rest.',
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
    flavor: 'A downstream hiccup triggers immediate client retries, and the retries keep the service pinned. A self-feeding write flood.',
    secret: 'Ticks 6 to 15: writes ×2.5 and traffic ×1.3. Idempotency keys take the sting out of retries, and a dead-letter queue parks the overflow.',
    mod: (t) => (t >= 6 && t <= 15 ? { writeMult: 2.5, rpsMult: 1.3 } : null),
  },
  brownout: {
    key: 'brownout',
    name: 'Capacity Brownout',
    rps: 30000,
    readPct: 0.85,
    ticks: 20,
    target: 200,
    flavor: 'A noisy-neighbor tenant evicts your cache keys and starves your reads while write traffic keeps climbing.',
    secret: 'Ticks 7 to 15: cache hit rate is capped at 50% while writes hit ×1.6. Replicas pick up the reads; shards absorb the writes.',
    mod: (t) => (t >= 7 && t <= 15 ? { hitCap: 0.5, writeMult: 1.6 } : null),
  },
  grayfail: {
    key: 'grayfail',
    name: 'Gray Failure',
    rps: 30000,
    readPct: 0.8,
    ticks: 20,
    target: 200,
    flavor: 'Nothing is formally "down", yet one replica is dragging its feet and the cache is quietly thinning. Two soft failures the dashboards barely show.',
    secret: 'Ticks 6 to 14: cache hit rate is capped at 60% while traffic runs at ×1.3, hiding behind green status lights. Replicas and a read-through cache keep reads steady.',
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
    flavor: 'Every timezone is awake at once. No hidden trick this time, just the largest sustained wall of traffic your stack has taken.',
    secret: 'No modifier here, just raw scale. CDN, cache, replicas, and shards all have to pull their weight. Any thin tier will buckle.',
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
      'An entire cloud region goes dark. Every user it served stampedes to yours, cache-cold and retrying blindly at once. Every mechanic hits together.',
    secret:
      'Ticks 9 to 22: cache hit rate 0%, traffic ×1.6, and writes ×2 all at once. No single fix covers it. Pair capacity (shards, replicas, read-through cache) with time (a queue) or blast-radius control (rate limiter, circuit breaker, multi-AZ).',
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
    what: 'A typo in a debugging command removed more capacity servers than intended. Restarting the index subsystem then took hours because it had not been fully restarted in years.',
    lesson: 'Recovery is a code path too. If you never rehearse a restart, the restart becomes the outage. Blast-radius limits like multi-AZ and cells keep one region’s bad day from becoming everyone’s.',
    url: 'https://aws.amazon.com/message/41926/',
  },
  'cloudflare-2019': {
    id: 'cloudflare-2019',
    title: 'Cloudflare global CPU exhaustion',
    when: 'Jul 2, 2019',
    what: 'One regular expression with catastrophic backtracking pinned CPU to 100% across the fleet, taking the proxy offline worldwide.',
    lesson: 'One hot component can eat all of a machine’s capacity. Bulkheads and per-rule CPU budgets keep a single bad line from starving everything around it.',
    url: 'https://blog.cloudflare.com/details-of-the-cloudflare-outage-on-july-2-2019/',
  },
  'github-2018': {
    id: 'github-2018',
    title: 'GitHub 24-hour degradation',
    when: 'Oct 21, 2018',
    what: 'A 43-second network partition triggered an automated MySQL failover. The two coasts diverged (split-brain), and reconciling the data took a full day.',
    lesson: 'Automated failover during a partition can make a brief blip far worse. Idempotency and careful write-fencing decide whether you recover cleanly or spend a day reconciling.',
    url: 'https://github.blog/2018-10-30-oct21-post-incident-analysis/',
  },
  'slack-2021': {
    id: 'slack-2021',
    title: 'Slack new-year outage',
    when: 'Jan 4, 2021',
    what: 'Everyone logged on at once after the holidays. The reconnect surge, an autoscaling shortfall, and provider network saturation cascaded into a full outage.',
    lesson: 'Thundering herds are real: clients reconnecting in unison can dwarf steady-state load. Standing headroom, rate limits, and jittered backoff are the defense, because autoscaling alone reacts too slowly.',
    url: 'https://slack.engineering/slacks-outage-on-january-4th-2021/',
  },
  'facebook-bgp-2021': {
    id: 'facebook-bgp-2021',
    title: 'Facebook / Meta BGP withdrawal',
    when: 'Oct 4, 2021',
    what: 'A faulty config change withdrew the BGP routes to Facebook’s DNS, taking every service offline for ~6 hours, including the internal tools and badge systems needed to fix it.',
    lesson: 'Control-plane and recovery paths must not depend on the system they are meant to recover. Independent break-glass access and staged config rollouts keep one bad push from locking you out.',
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
      'A schema migration has to run before the next launch, and it takes a table lock. The safe path costs cloud budget; the fast path costs trust. This exact tradeoff has ruined a thousand real Tuesdays.',
    choices: [
      { title: 'Run it live tonight', sub: 'The lock stalls writes for 40 seconds. Some users hit errors, then it is over.', hp: -10 },
      { title: 'Blue-green migration', sub: 'Stand up a copy, migrate it cleanly, and switch traffic over. Zero user impact, paid for in cloud bills.', gold: -400 },
    ],
  },
  retro: {
    key: 'retro',
    title: 'INCIDENT REVIEW',
    col: 'mem',
    flavor:
      'Last week’s near-miss is still fresh. The team wants a blameless retro to fix the root cause; the roadmap wants the next feature yesterday.',
    choices: [
      { title: 'Hold the blameless retro', sub: 'Spend an unglamorous afternoon turning one scare into a permanent safeguard. Trust climbs back.', gold: -200, hp: 15 },
      { title: 'Ship the feature instead', sub: 'Take the short-term upside and leave the root cause sitting quietly in production.', gold: 150, hp: -8 },
    ],
  },
  vendor: {
    key: 'vendor',
    title: 'BUILD VS BUY',
    col: 'net',
    flavor:
      'A managed service would take a whole subsystem off your plate, freeing up budget now while adding a dependency you cannot debug at 3am. Or you keep it in-house and own the pager.',
    choices: [
      { title: 'Adopt the managed service', sub: 'Frees up runway immediately, in exchange for one more vendor outage you cannot fix yourself.', gold: 300, hp: -12 },
      { title: 'Keep it in-house', sub: 'Costs engineering budget up front, and buys you full control over the code and its uptime.', gold: -250, hp: 6 },
    ],
  },
  hiring: {
    key: 'hiring',
    title: 'STAFF THE ROTATION',
    col: 'mem',
    flavor:
      'The on-call rotation is three people deep and everyone is running on fumes. Fund a dedicated SRE hire, or ask the current team to hold the line one more quarter.',
    choices: [
      { title: 'Hire an SRE', sub: 'Steadier rotation, better runbooks, fewer 3am pages. Payroll is not cheap, and your uptime shows the difference.', gold: -300, hp: 20 },
      { title: 'Stretch the current crew', sub: 'Cash stays in the bank while burnout compounds and small mistakes start slipping through.', gold: 200, hp: -10 },
    ],
  },
  security: {
    key: 'security',
    title: 'CVE DROPPED',
    col: 'compute',
    flavor:
      'A critical CVE just landed in a dependency you ship. Push an emergency patch tonight, or fund a staging copy for a careful maintenance window.',
    choices: [
      { title: 'Emergency patch tonight', sub: 'The hole closes fast, with the rough edges of a rushed rollout.', hp: -12 },
      { title: 'Scheduled maintenance window', sub: 'Stand up staging, test the patch, and roll out cleanly. Zero drama, higher cloud bill.', gold: -300 },
    ],
  },
  techdebt: {
    key: 'techdebt',
    title: 'DEBT SPRINT',
    col: 'storage',
    flavor:
      'You finally caught a quiet week. Spend it paying down the flaky-retry, missing-timeout debt that keeps biting, or protect the runway and keep moving.',
    choices: [
      { title: 'Pay down the debt', sub: 'Add the timeouts, fix the retries, and remove the footguns. The system gets quietly sturdier.', gold: -250, hp: 18 },
      { title: 'Bank the runway', sub: 'Keep the cash and leave the debt where it is. It will still be waiting at the next incident.', hp: -6 },
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
    tagline: 'Raw capacity. Nothing hides here: if a tier is thin, traffic finds it.',
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
    tagline: 'Capacity plus a twist. Each encounter bends one dial: a spike, a cold cache, or a write flood.',
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
    tagline: 'Modifiers stack and interact. One trick is not enough; your fixes have to compose.',
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
