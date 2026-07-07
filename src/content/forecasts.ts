// Lab forecasts (spec 084, law L3: predict before run). One bet per toy: the
// player calls the outcome BEFORE touching the sim, then the sim proves or
// embarrasses the call, and a wrong call lands in the Scar Journal. Bets, not
// quizzes — one line, options one-tap, numbers from numbers.ts. Keyed by toy
// id; tests/schema.test.ts enforces 1:1 coverage.

export interface Forecast {
  /** the bet, one line — "Where does waiting explode?", not "Which is true?" */
  question: string
  /** 3–4 one-tap options */
  options: string[]
  /** index into options of the answer the sim will demonstrate */
  correctIx: number
  /** one sentence said once the sim settles it */
  reveal: string
}

export const FORECASTS: Record<string, Forecast> = {
  light: {
    question: 'In a single CPU clock tick (~0.3 ns), how far does light — the fastest thing there is — travel?',
    options: ['a hair’s width', '≈9 cm, a hand span', 'a city block', 'about a mile'],
    correctIx: 1,
    reveal: '≈9 cm — light cannot even cross a large chip in one tick, which is exactly why clock speeds stalled near 3–5 GHz.',
  },
  disk: {
    question: 'Same drive, same bytes — how much faster is reading them in order vs. jumping around at random?',
    options: ['about 2×', 'about 20×', 'about 1000×', 'no real difference'],
    correctIx: 2,
    reveal: '~1000×: random access pays an ~8 ms seek every time, sequential pays it once. Half of storage design is turning random into sequential.',
  },
  dram: {
    question: 'Switch DRAM’s refresh off. How long until your data starts corrupting?',
    options: ['never — RAM is stable', 'milliseconds (~64 ms in reality)', 'several minutes', 'only on reboot'],
    correctIx: 1,
    reveal: 'Milliseconds: each bit is charge leaking off a tiny capacitor, held onto only by a refresh sweep every 64 ms, forever.',
  },
  queue: {
    question: 'As a server’s utilization climbs, where does its waiting time explode?',
    options: ['a smooth linear rise', 'it doubles from 40% to 80%', 'it rockets up past ~80% (the knee)', 'only at 100%'],
    correctIx: 2,
    reveal: 'Past ~80% waiting rockets up like 1/(1−u) — which is why every scale trigger sits near 70–80%, not 95%.',
  },
  hotpartition: {
    question: '8 partitions, 8 nodes, and a key that’s the current hour. During a burst, how many nodes do the work?',
    options: ['all 8, evenly', 'about half of them', 'exactly 1 — the rest idle', 'none, it just drops writes'],
    correctIx: 2,
    reveal: 'One node runs at 100% while seven idle: the hash spreads keys perfectly and traffic not at all. Partition-key choice is the whole game.',
  },
  replag: {
    question: 'You post a comment, then immediately reload — served by a read replica. What happens?',
    options: ['it can be missing — the replica lags', 'always there instantly', 'gone for several minutes', 'the write is lost'],
    correctIx: 0,
    reveal: 'It can be missing: the replica lives slightly in the past, so a just-written value may not have arrived — the read-your-writes anomaly.',
  },
  pipe: {
    question: 'A 1 Gbps link, one TCP stream, long distance. Does that single stream fill the pipe?',
    options: ['yes — that’s what Gbps means', 'no — window ÷ RTT caps it far lower', 'only if you compress first', 'only over fiber'],
    correctIx: 1,
    reveal: 'No: one stream keeps just one window in flight, so throughput = window ÷ round-trip. Distance, not the link rating, is the ceiling.',
  },
  consensus: {
    question: 'A strongly-consistent write across US regions — what sets its floor latency?',
    options: ['CPU speed', 'disk speed', 'round trips × distance (~2 RTTs)', 'the database vendor'],
    correctIx: 2,
    reveal: 'Round trips × distance: ~2 RTTs of light between regions, ~140 ms cross-US — the price of agreement, paid in geography.',
  },
  lsmbtree: {
    question: 'Same write stream into a B-tree and an LSM — which takes the writes faster, and who pays later?',
    options: ['LSM takes them faster; it repays on reads/compaction', 'B-tree; the LSM pays on writes', 'identical cost', 'B-tree always wins'],
    correctIx: 0,
    reveal: 'The LSM swallows writes by appending sequentially, then repays it on reads and compaction. Neither wins — it’s a bet on your read/write mix.',
  },
  connpool: {
    question: '10,000 app threads share a pool of 100 database connections. Where is the bottleneck?',
    options: ['a hidden queue in front of the pool', 'the database CPU', 'the network card', 'there isn’t one'],
    correctIx: 0,
    reveal: 'A hidden queue: the pool is itself a server with a knee. “The database is slow” is often the wait in front of it.',
  },
  backpressure: {
    question: 'Fast producer, slow consumer, bounded buffer. When the buffer fills, how many real options exist?',
    options: ['exactly three: block, drop, or crash', 'one — just buffer more', 'two — speed up or give up', 'unlimited'],
    correctIx: 0,
    reveal: 'Three: block the producer, drop work on purpose, or let memory run out. Mature systems choose one in advance — an unbounded buffer is a refusal to choose.',
  },
  stampede: {
    question: 'One hot cached key, 10k req/s, its TTL expires. What hits the database the instant it does?',
    options: ['nothing — the cache absorbs it', '~1 request', 'all 10k at once', 'about half'],
    correctIx: 2,
    reveal: 'All of them: every in-flight miss races to the DB at the same instant — the stampede. A DB sized for a 1% miss rate meets 100% of traffic.',
  },
  cachecliff: {
    question: 'The same loop walks data that grows from 32 KB to 64 MB, at random. How much does it slow down?',
    options: ['a few percent', 'about 2×', 'up to ~100× (L1 → DRAM)', 'it stays constant'],
    correctIx: 2,
    reveal: 'Up to ~100×: as the working set spills L1 → L2 → L3 → DRAM the identical loop falls off a cliff. Speed is a layout decision, not a constant.',
  },
  'instruction-loop': {
    question: 'Fetch, decode, execute… switching ON the pipeline (same clock) does what to how long the program takes?',
    options: ['no change — same instructions', 'a little faster', 'several times faster', 'slower — more overhead'],
    correctIx: 2,
    reveal: 'Several times faster: the pipeline overlaps the steps like an assembly line, retiring ~one instruction per cycle instead of one every five — same clock, far more work.',
  },
  'heat-wall': {
    question: 'You double a CPU’s clock speed. Roughly what happens to the heat it makes?',
    options: ['it doubles', 'it roughly quadruples', 'it roughly octuples (≈8×)', 'no change'],
    correctIx: 2,
    reveal: '≈8×: power scales like frequency cubed, so a fixed cooling budget caps clocks near ~4 GHz — which is why chips went multi-core instead of faster.',
  },
  'branch-predictor': {
    question: 'The same loop over the same numbers, sorted vs shuffled — how different is the runtime?',
    options: ['identical — same work', 'sorted is a few % faster', 'sorted is several times faster', 'shuffled is faster'],
    correctIx: 2,
    reveal: 'Several times faster on sorted data: a predictable branch is a guess the CPU wins, while random data makes it a coin flip and every wrong guess flushes ~15 cycles.',
  },
  'tlb-toll': {
    question: 'Your working set fits in RAM but outgrows what the TLB can map. What happens to each access?',
    options: ['nothing — it fits in RAM', 'it pays an extra translation on nearly every access', 'it gets faster', 'it fails'],
    correctIx: 1,
    reveal: 'It pays a page-walk on nearly every access: the TLB covers only ~6 MB, so beyond it translation stops being free — and past physical RAM you fall onto disk (swap).',
  },
  'false-sharing': {
    question: 'Two cores each increment their OWN counter — but both counters share one cache line. Add cores and throughput…',
    options: ['scales up, linearly', 'stays flat or gets worse', 'doubles exactly', 'is unaffected'],
    correctIx: 1,
    reveal: 'Stays flat or worse: the cores ping-pong the shared 64-byte line through the coherence protocol, serializing writes meant to be independent. Padding onto separate lines fixes it.',
  },
}
