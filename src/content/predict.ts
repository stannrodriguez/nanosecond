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
      prompt: 'Which tier crosses the 80% danger line FIRST as traffic ramps?',
      opts: ['App servers', 'Cache', 'Read replicas', 'DB primary (writes)'],
      ans: 0,
    },
    q2: { prompt: 'At roughly what req/s do ERRORS begin?', lo: 10000, hi: 60000, ans: 30000 },
    lesson:
      'Most people accuse the database — it feels like the fragile one. But do the per-tier arithmetic: replicas see only the 15% cache misses (≈6k r/s at peak vs 40k capacity — loafing), the primary sees 4.5k writes vs 10k. The app tier hits its 30k ceiling first. Bottlenecks live where the MATH says, not where the fear says.',
  },
  {
    name: 'Round 2 · The mix flips',
    stack: 'Same stack: 3 app · 2 cache @85% · 1 primary · 2 replicas',
    traffic: 'a bulk-import feature ships — ramps to 35k req/s · 60% reads / 40% writes',
    peak: 35000,
    readPct: 0.6,
    app: 3,
    cacheNodes: 2,
    cacheHit: 0.85,
    replicas: 2,
    shards: 1,
    q1: {
      prompt: 'Same stack, new mix. Which tier crosses 80% FIRST now?',
      opts: ['App servers', 'Cache', 'Read replicas', 'DB primary (writes)'],
      ans: 3,
    },
    q2: { prompt: 'At roughly what req/s do ERRORS begin?', lo: 10000, hi: 60000, ans: 25000 },
    lesson:
      "Identical hardware, different answer: 40% writes means the primary's 10k w/s ceiling is hit at just 25k total rps — before the app tier's 30k. This is why the read/write mix is the FIRST question you ask in any interview: it decides which wall you hit and therefore which architecture you need. Caches were useless here; they only ever help reads.",
  },
  {
    name: 'Round 3 · Bound your uncertainty',
    stack: '4 app · 4 cache @92% hit · 1 primary · 2 replicas',
    traffic: 'read-heavy launch — ramps to 60k req/s · 80% reads / 20% writes',
    peak: 60000,
    readPct: 0.8,
    app: 4,
    cacheNodes: 4,
    cacheHit: 0.92,
    replicas: 2,
    shards: 1,
    ci: true,
    q1: {
      prompt: 'With a fat cache soaking up reads, which tier crosses 80% FIRST?',
      opts: ['App servers', 'Cache', 'Read replicas', 'DB primary (writes)'],
      ans: 0,
    },
    q2: { prompt: 'Give an 80%-confidence BRACKET for where errors begin (req/s):', lo: 10000, hi: 90000, ans: 40000 },
    lesson:
      "A 92% cache means replicas see almost nothing and the writes are a trickle — so the humble app tier is the wall, at its 40k ceiling. The real skill here is calibration: a point guess is bravado, a bracket is honesty. A tight bracket that CONTAINS the truth beats both a lucky point and a mile-wide 'anywhere from 10k to 90k' that can't be wrong because it never committed.",
  },
  {
    name: 'Round 4 · More app servers won\'t save you',
    stack: '5 app · 2 cache @85% · 2 shards · 2 replicas',
    traffic: 'write-leaning — ramps to 45k req/s · 40% reads / 60% writes',
    peak: 45000,
    readPct: 0.4,
    app: 5,
    cacheNodes: 2,
    cacheHit: 0.85,
    replicas: 2,
    shards: 2,
    q1: {
      prompt: 'Five app servers, sixty-percent writes. Which tier crosses 80% FIRST?',
      opts: ['App servers', 'Cache', 'Read replicas', 'DB primary (writes)'],
      ans: 3,
    },
    q2: { prompt: 'At roughly what req/s do ERRORS begin?', lo: 10000, hi: 70000, ans: 33000 },
    lesson:
      "The instinct is to add app servers, but they idle here (50k ceiling, never reached): with 60% writes across 2 shards the primary caps at ~33k total rps and dies first. Write-bound workloads scale by SHARDING the write path or cutting write volume — never by adding stateless app boxes in front of the same overloaded primary.",
  },
  {
    name: 'Round 5 · The hit rate is the design',
    stack: '10 app · 2 cache @70% hit · 1 primary · 1 replica',
    traffic: 'read-heavy — ramps to 90k req/s · 90% reads / 10% writes',
    peak: 90000,
    readPct: 0.9,
    app: 10,
    cacheNodes: 2,
    cacheHit: 0.7,
    replicas: 1,
    shards: 1,
    q1: {
      prompt: 'Same read-heavy shape, but the cache only hits 70%. First past 80%?',
      opts: ['App servers', 'Cache', 'Read replicas', 'DB primary (writes)'],
      ans: 2,
    },
    q2: { prompt: 'At roughly what req/s do ERRORS begin?', lo: 20000, hi: 140000, ans: 74000 },
    lesson:
      "At 90% reads a 70% cache still leaks 30% of reads to the replica — and one replica caps at 20k reads/s, so it saturates near 74k total rps while 10 app servers loaf. The cache HIT RATE, a single number, moves the wall by tens of thousands of req/s. This is why 'assume 80% hit' is never a throwaway line in an interview — it silently sets the whole capacity plan.",
  },
  {
    name: 'Round 6 · A small number that kills',
    stack: '4 app · 2 cache @85% · 1 primary · 2 replicas',
    traffic: 'a batch job floods writes — ramps to 30k req/s · 30% reads / 70% writes',
    peak: 30000,
    readPct: 0.3,
    app: 4,
    cacheNodes: 2,
    cacheHit: 0.85,
    replicas: 2,
    shards: 1,
    q1: {
      prompt: 'Only 30k req/s total — but 70% writes. Which tier crosses 80% FIRST?',
      opts: ['App servers', 'Cache', 'Read replicas', 'DB primary (writes)'],
      ans: 3,
    },
    q2: { prompt: 'At roughly what req/s do ERRORS begin?', lo: 5000, hi: 45000, ans: 14000 },
    lesson:
      "30k req/s sounds trivial — but 70% of it is writes, and a single primary caps at 10k writes/s, so errors begin around 14k TOTAL rps. Low aggregate traffic is not safety; the write fraction is. A 'small' batch job that flips the mix to write-heavy can topple a system that shrugs off 10× the read traffic.",
  },
]
