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
    question: 'In a single CPU clock tick (~0.3 ns), how far does light, the fastest thing in the universe, travel?',
    options: ['a hair’s width', '≈9 cm, about a hand span', 'a city block', 'about a mile'],
    correctIx: 1,
    reveal: '≈9 cm: light cannot even cross a large chip in one tick, which is why clock speeds stalled near 3 to 5 GHz.',
  },
  disk: {
    question: 'Same spinning drive, same bytes. How much faster is reading in order compared to jumping around at random?',
    options: ['about 2×', 'about 20×', 'about 1000×', 'no real difference'],
    correctIx: 2,
    reveal: '~1000×: random reads pay an ~8 ms seek every time, while sequential reads pay it once. Half of storage design exists to turn random work into sequential work.',
  },
  dram: {
    question: 'Switch DRAM’s refresh off. How long until your data starts corrupting?',
    options: ['never, RAM holds state', 'milliseconds (~64 ms in real hardware)', 'several minutes', 'only after a reboot'],
    correctIx: 1,
    reveal: 'Milliseconds: each bit is charge leaking off a tiny capacitor, kept alive only by a refresh sweep every 64 ms, nonstop.',
  },
  queue: {
    question: 'As a server’s utilization climbs, where does its waiting time take off?',
    options: ['a steady linear climb', 'it doubles between 40% and 80%', 'it rockets upward past ~80% (the knee)', 'only once it hits 100%'],
    correctIx: 2,
    reveal: 'Past ~80%, waiting time climbs like 1/(1−u), which is why autoscaling triggers cluster near 70 to 80% instead of 95%.',
  },
  hotpartition: {
    question: '8 partitions, 8 nodes, and a partition key set to the current hour. During a traffic burst, how many nodes do the work?',
    options: ['all 8 evenly', 'about half of them', 'just 1, while the other 7 sit idle', 'none, writes just fail'],
    correctIx: 2,
    reveal: 'One node runs at 100% while seven sit idle: hashing spreads keys evenly, not traffic. Partition-key choice decides whether scaling works at all.',
  },
  replag: {
    question: 'You post a comment and immediately reload, hitting a read replica. What can happen?',
    options: ['it can be missing because the replica lags', 'it is always there right away', 'it disappears for several minutes', 'the write gets lost'],
    correctIx: 0,
    reveal: 'It can be missing: the replica lives slightly in the past, so a fresh write may not have arrived yet. That is the read-your-writes anomaly.',
  },
  pipe: {
    question: 'A 1 Gbps link, a single TCP stream, long distance. Does that one stream fill the pipe?',
    options: ['yes, that is what 1 Gbps buys', 'no, window ÷ RTT caps it much lower', 'only if you compress the payload first', 'only over fiber'],
    correctIx: 1,
    reveal: 'No: one TCP stream keeps only one window in flight, so throughput tops out at window ÷ round-trip. Distance, not the link rating, sets the ceiling.',
  },
  consensus: {
    question: 'For a strongly consistent write replicated across US regions, what sets its floor latency?',
    options: ['CPU speed', 'disk speed', 'round trips × distance (~2 RTTs)', 'the database vendor'],
    correctIx: 2,
    reveal: 'Round trips × distance: ~2 RTTs of light between regions comes out to ~140 ms cross-US, the unavoidable price of agreement paid in geography.',
  },
  lsmbtree: {
    question: 'Feed the same write stream into a B-tree and an LSM. Which absorbs writes faster, and who pays later?',
    options: ['LSM absorbs writes faster, then repays on reads and compaction', 'B-tree absorbs writes faster, while LSM pays on writes', 'they cost the same', 'B-tree wins both ways'],
    correctIx: 0,
    reveal: 'The LSM absorbs writes faster by appending sequentially, then pays the tab during reads and compaction. Neither engine wins outright; you are betting on your read/write mix.',
  },
  connpool: {
    question: '10,000 app threads share a pool of 100 database connections. Where does the bottleneck show up?',
    options: ['a hidden queue in front of the pool', 'the database CPU', 'the network card', 'nowhere, pooling eliminates it'],
    correctIx: 0,
    reveal: 'A hidden queue: the pool itself acts like a server with its own knee, so "the database is slow" often describes the wait in front of it.',
  },
  backpressure: {
    question: 'Fast producer, slow consumer, bounded buffer. Once the buffer fills, how many real choices exist?',
    options: ['exactly three: block, drop, or crash', 'one: just add more buffer', 'two: speed up or give up', 'as many as you can tune'],
    correctIx: 0,
    reveal: 'Three: block the producer, drop work intentionally, or let memory run out. Mature systems pick one ahead of time, while an unbounded buffer is just refusing to choose.',
  },
  stampede: {
    question: 'One hot cached key taking 10k req/s hits its TTL and expires. What reaches the database at that instant?',
    options: ['nothing, the cache still absorbs it', '~1 request', 'all 10k at once', 'about half'],
    correctIx: 2,
    reveal: 'All 10k at once: every in-flight miss rushes the database at the same moment, slamming a DB sized for a 1% miss rate with 100% of traffic.',
  },
  cachecliff: {
    question: 'The same loop walks data at random as its size grows from 32 KB to 64 MB. How much does it slow down?',
    options: ['a few percent', 'about 2×', 'up to ~100× (L1 → DRAM)', 'it stays flat'],
    correctIx: 2,
    reveal: 'Up to ~100×: as the working set spills from L1 → L2 → L3 → DRAM, the exact same loop falls off a cliff. Speed depends as much on memory layout as on code.',
  },
  'instruction-loop': {
    question: 'Fetch, decode, execute: turning ON the pipeline at the exact same clock speed does what to total runtime?',
    options: ['no change, same instructions', 'a slight speedup', 'several times faster', 'slower from coordination overhead'],
    correctIx: 2,
    reveal: 'Several times faster: the pipeline overlaps stages like an assembly line, retiring ~one instruction per cycle instead of one every five at the same clock speed.',
  },
  'heat-wall': {
    question: 'Double a CPU’s clock speed. Roughly what happens to the heat it produces?',
    options: ['it doubles', 'it roughly quadruples', 'it roughly octuples (≈8×)', 'it barely changes'],
    correctIx: 2,
    reveal: '≈8×: dynamic power scales like frequency cubed, so a fixed cooling budget caps clocks near ~4 GHz and pushed the industry toward multiple cores instead.',
  },
  'branch-predictor': {
    question: 'Run the exact same branchy loop on the same numbers, once sorted and once shuffled. How do the runtimes compare?',
    options: ['identical, same work either way', 'sorted is a few percent faster', 'sorted is several times faster', 'shuffled is faster'],
    correctIx: 2,
    reveal: 'Several times faster on sorted data: a predictable branch is a guess the CPU wins, while shuffled data turns it into a coin flip where every miss flushes ~15 cycles.',
  },
  'tlb-toll': {
    question: 'Your working set fits comfortably in RAM, yet outgrows what the TLB can map. What happens on each access?',
    options: ['nothing, it still fits in RAM', 'it pays an extra address translation on nearly every access', 'it runs faster', 'the program crashes'],
    correctIx: 1,
    reveal: 'It pays a page walk on nearly every access: the TLB only covers ~6 MB, so beyond that reach translation stops being free, and past physical RAM you fall onto disk (swap).',
  },
  'false-sharing': {
    question: 'Two cores each increment their own separate counter, but both counters land on the same cache line. Add cores and throughput…',
    options: ['scales linearly', 'stays flat or gets worse', 'doubles cleanly', 'stays unaffected'],
    correctIx: 1,
    reveal: 'Stays flat or gets worse: the cores bounce the shared 64-byte line back and forth through the coherence protocol, serializing independent writes until padding puts them on separate lines.',
  },
}
