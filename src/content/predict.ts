// Predict & Run rounds. The stack is described in engine terms so the mode
// can compute tier utilizations with the shared engine constants.

export interface PredictRound {
  name: string
  stack: string
  traffic: string
  peak: number
  readPct: number
  app: number
  cacheNodes: number
  cacheHit: number
  replicas: number
  shards: number
  q1: { prompt: string; opts: string[]; ans: number }
  q2: { prompt: string; lo: number; hi: number; ans: number }
  /** confidence-interval round: q2 is answered as an [low, high] bracket,
   *  scored on containment AND tightness (calibration, not a point guess). */
  ci?: boolean
  lesson: string
}

export const PREDICT_ROUNDS: PredictRound[] = [
  {
    name: 'Round 1 · Read-heavy launch',
    stack: '3 app servers (10k rps ea) · 2 cache nodes @ 85% hit · 1 DB primary (10k w/s) · 2 read replicas (20k r/s ea)',
    traffic: 'ramps to 45k req/s · 90% reads / 10% writes',
    peak: 45000,
    readPct: 0.9,
    app: 3,
    cacheNodes: 2,
    cacheHit: 0.85,
    replicas: 2,
    shards: 1,
    q1: {
      prompt: 'Which tier crosses the 80% danger line first as traffic ramps?',
      opts: ['App servers', 'Cache', 'Read replicas', 'DB primary (writes)'],
      ans: 0,
    },
    q2: { prompt: 'At roughly what req/s do errors begin?', lo: 10000, hi: 60000, ans: 30000 },
    lesson:
      'Most people point at the database first because it feels fragile, yet the app tier hits its 30k ceiling before anything else breaks a sweat. Do the per-tier arithmetic: replicas see only the 15% cache misses (roughly 6k r/s at peak against 40k capacity), and the primary takes 4.5k writes against 10k. Bottlenecks live where the math says, not where instinct points.',
  },
  {
    name: 'Round 2 · The mix flips',
    stack: 'Same stack: 3 app · 2 cache @85% · 1 primary · 2 replicas',
    traffic: 'bulk-import feature ships, ramping to 35k req/s · 60% reads / 40% writes',
    peak: 35000,
    readPct: 0.6,
    app: 3,
    cacheNodes: 2,
    cacheHit: 0.85,
    replicas: 2,
    shards: 1,
    q1: {
      prompt: 'Same stack, new traffic mix. Which tier crosses 80% first now?',
      opts: ['App servers', 'Cache', 'Read replicas', 'DB primary (writes)'],
      ans: 3,
    },
    q2: { prompt: 'At roughly what req/s do errors begin?', lo: 10000, hi: 60000, ans: 25000 },
    lesson:
      "Same hardware, different culprit: at 40% writes, the primary hits its 10k w/s ceiling at just 25k total rps, well ahead of the app tier's 30k limit. That is why the read/write mix is the first question to ask in a design interview: it picks which wall you hit and which architecture you actually need. The cache could not help here because caches only absorb reads.",
  },
  {
    name: 'Round 3 · Bound your uncertainty',
    stack: '4 app · 4 cache @92% hit · 1 primary · 2 replicas',
    traffic: 'read-heavy launch, ramping to 60k req/s · 80% reads / 20% writes',
    peak: 60000,
    readPct: 0.8,
    app: 4,
    cacheNodes: 4,
    cacheHit: 0.92,
    replicas: 2,
    shards: 1,
    ci: true,
    q1: {
      prompt: 'With a big cache soaking up reads, which tier crosses 80% first?',
      opts: ['App servers', 'Cache', 'Read replicas', 'DB primary (writes)'],
      ans: 0,
    },
    q2: { prompt: 'Set an 80% confidence bracket for where errors begin (req/s):', lo: 10000, hi: 90000, ans: 40000 },
    lesson:
      "A 92% cache leaves the replicas nearly idle and writes are still light, so the app tier hits its 40k ceiling first. The deeper skill here is calibration: a point estimate is bravado, while a bracket is honest about what you know. A tight range that contains the truth beats both a lucky guess and a mile-wide '10k to 90k' range that never risked being wrong.",
  },
  {
    name: "Round 4 · More app servers won't save you",
    stack: '5 app · 2 cache @85% · 2 shards · 2 replicas',
    traffic: 'write-leaning load, ramping to 45k req/s · 40% reads / 60% writes',
    peak: 45000,
    readPct: 0.4,
    app: 5,
    cacheNodes: 2,
    cacheHit: 0.85,
    replicas: 2,
    shards: 2,
    q1: {
      prompt: 'Five app servers, 60% writes. Which tier crosses 80% first?',
      opts: ['App servers', 'Cache', 'Read replicas', 'DB primary (writes)'],
      ans: 3,
    },
    q2: { prompt: 'At roughly what req/s do errors begin?', lo: 10000, hi: 70000, ans: 33000 },
    lesson:
      'With 60% writes across 2 shards, the primary caps out near 33k total rps while five app servers sit well below their 50k ceiling. The reflex is to add more app boxes, which does nothing when the bottleneck is downstream. Write-bound workloads scale by sharding the write path or cutting write volume, never by piling stateless servers in front of an overloaded primary.',
  },
  {
    name: 'Round 5 · The hit rate is the design',
    stack: '10 app · 2 cache @70% hit · 1 primary · 1 replica',
    traffic: 'read-heavy load, ramping to 90k req/s · 90% reads / 10% writes',
    peak: 90000,
    readPct: 0.9,
    app: 10,
    cacheNodes: 2,
    cacheHit: 0.7,
    replicas: 1,
    shards: 1,
    q1: {
      prompt: 'Same read-heavy mix, but the cache only hits 70%. Which tier crosses 80% first?',
      opts: ['App servers', 'Cache', 'Read replicas', 'DB primary (writes)'],
      ans: 2,
    },
    q2: { prompt: 'At roughly what req/s do errors begin?', lo: 20000, hi: 140000, ans: 74000 },
    lesson:
      "At 90% reads, a 70% cache still leaks 30% of reads to the single replica, saturating its 20k reads/s limit around 74k total rps while 10 app servers cruise along. One number, the cache hit rate, shifts the breaking point by tens of thousands of req/s. That is why saying 'assume 80% hit' is never throwaway filler in an interview; it quietly sets the entire capacity plan.",
  },
  {
    name: 'Round 6 · A small number that kills',
    stack: '4 app · 2 cache @85% · 1 primary · 2 replicas',
    traffic: 'batch job floods writes, ramping to 30k req/s · 30% reads / 70% writes',
    peak: 30000,
    readPct: 0.3,
    app: 4,
    cacheNodes: 2,
    cacheHit: 0.85,
    replicas: 2,
    shards: 1,
    q1: {
      prompt: 'Only 30k req/s total, but 70% of it is writes. Which tier crosses 80% first?',
      opts: ['App servers', 'Cache', 'Read replicas', 'DB primary (writes)'],
      ans: 3,
    },
    q2: { prompt: 'At roughly what req/s do errors begin?', lo: 5000, hi: 45000, ans: 14000 },
    lesson:
      "30k req/s looks modest on paper, yet at 70% writes a single primary's 10k writes/s ceiling triggers errors around 14k total rps. Low aggregate traffic does not guarantee headroom when the write share climbs. One 'small' batch job that tips the mix toward writes can knock over a stack that shrugs off 10× the read load.",
  },
]
