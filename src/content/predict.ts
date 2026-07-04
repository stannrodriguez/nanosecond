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
]
