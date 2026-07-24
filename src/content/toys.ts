// Lab toy catalog metadata (docs/content-pipeline.md §2). The playable sims
// live in src/modes/lab/ (they are components, not data); everything a test
// or another mode needs to know about a toy lives here.

import type { Channel } from '../theme'

export interface ToyEntry {
  id: string
  n: string
  name: string
  sub: string
  oneLiner: string
  ch: Channel
  /** ids into src/content/numbers.ts */
  targetNumbers: string[]
  /** component id this toy forges (The Forge, spec 070), or null */
  forgeUnlocks: string | null
  simplifies: string
  /** the exit criterion — the recognizable mental event this toy exists to cause. Always "It's clicked when …" */
  click: string
}

export const TOYS: ToyEntry[] = [
  {
    id: 'light',
    n: '01',
    name: 'RACE LIGHT',
    sub: 'latency is distance',
    oneLiner:
      "Latency numbers are hard to feel; distances aren't. This races one operation — a cache hit, a disk read, a cross-region hop — against light itself, so its duration becomes a physical place: the chip, the building, the planet.",
    ch: 'net',
    targetNumbers: ['cpu-cycle', 'l1-hit', 'dram-access', 'nvme-read', 'hdd-seek', 'cross-region-rtt'],
    forgeUnlocks: 'cdn',
    simplifies: 'Uses light in vacuum (30 cm/ns); signals in silicon and fiber travel ~⅓ slower, and every real operation includes software overhead the racetrack ignores.',
    click: "It's clicked when nanoseconds, microseconds, and milliseconds stop being metric prefixes and become places — the chip, the box, the building, the planet.",
  },
  {
    id: 'disk',
    n: '02',
    name: 'THE DISK',
    sub: 'random vs sequential, 1000×',
    oneLiner:
      'A spinning disk reads ~1000× faster in order than at random, because every random jump moves a physical arm and waits for the platter. Two identical drives read the same data — one jumping, one streaming — so you can watch the gap open.',
    ch: 'storage',
    targetNumbers: ['hdd-seek', 'hdd-iops'],
    forgeUnlocks: 'queue',
    simplifies: 'One platter, one head, no OS scheduling or drive cache; real drives reorder requests (elevator algorithms) to soften — never beat — the physics.',
    click: "It's clicked when \"random or sequential?\" becomes your first question about any storage work — asked before any math, because the answer moves everything 1000×.",
  },
  {
    id: 'dram',
    n: '03',
    name: 'LEAKY BITS',
    sub: 'bits are charge, and charge leaks',
    oneLiner:
      'RAM stores each bit as charge in a leaking capacitor, kept alive only by a hardware refresh that rewrites every row, forever. This shows the leak and the refresh — and lets you switch the refresh off to watch your data drain away.',
    ch: 'mem',
    targetNumbers: ['dram-access'],
    forgeUnlocks: null,
    simplifies: 'Time slowed ~10 billion×; real cells leak in ~64 ms not seconds, refresh is per-row DMA the CPU never sees, and ECC quietly fixes single-bit losses.',
    click: "It's clicked when \"in memory\" stops sounding like a place data is safe — and \"does this survive a power cut?\" becomes a reflex you apply to every piece of state.",
  },
  {
    id: 'queue',
    n: '04',
    name: 'THE QUEUE',
    sub: 'why 80% is the real 100%',
    oneLiner:
      'This explains why a server breaks long before 100% busy: as utilization climbs, waiting time explodes while throughput still looks fine. Drag utilization and watch the wait-time curve — the one the CPU graph never shows you.',
    ch: 'compute',
    targetNumbers: ['queue-knee', 'app-server-rps'],
    forgeUnlocks: 'workers',
    simplifies: 'A single M/M/1-flavored server with random service times; real systems have many servers, admission control, and retries that make the knee even sharper.',
    click: "It's clicked when \"the server is only at 85%, we have headroom\" makes you wince — because you can see the wait-time curve bending long before the CPU graph admits anything.",
  },
  {
    id: 'hotpartition',
    n: '05',
    name: 'HOT PARTITION',
    sub: 'every key lands on one node',
    oneLiner:
      'A partitioned database spreads load by hashing the partition key — so when every writer uses the same key ("now", today\'s date, a viral ID), every write lands on the same node. This simulates a timestamp key: watch one node melt while seven idle.',
    ch: 'storage',
    targetNumbers: ['partition-write-cap'],
    forgeUnlocks: 'shards',
    simplifies: 'Eight fixed partitions with equal capacity; real stores split hot partitions adaptively (too late for a per-second spike) and rebalance in the background.',
    click: "It's clicked when you can smell a hot key in a schema — \"partitioned by timestamp?!\" — before it ships, melts one node, and pages you at 3am.",
  },
  {
    id: 'replag',
    n: '06',
    name: 'REPLICATION LAG',
    sub: 'the copy is the recent past',
    oneLiner:
      "A replica replays the primary's writes with a delay, so reading from it is reading the recent past. Push writes faster than the replica can apply them, watch the lag grow — then try to read your own comment back, and lose the race.",
    ch: 'storage',
    targetNumbers: ['pg-writes'],
    forgeUnlocks: 'replicas',
    simplifies: 'One replica applying a perfectly ordered stream; real lag also spikes on big transactions, vacuum, and network hiccups — and failover can lose unreplicated writes.',
    click: "It's clicked when a user's vanished comment stops being spooky and becomes a race you can draw on a napkin: the write went to the primary, the read beat it to the replica.",
  },
  {
    id: 'pipe',
    n: '07',
    name: 'THE PIPE',
    sub: 'bandwidth × RTT',
    oneLiner:
      "A TCP sender may only keep one window of bytes in flight before stopping to wait for acknowledgments to cross back. This shows why a single stream on a big, long link tops out far below the link's bandwidth — distance, not the pipe, sets the ceiling.",
    ch: 'net',
    targetNumbers: ['bdp', 'cross-region-rtt'],
    forgeUnlocks: null,
    simplifies: 'Ignores slow start, congestion control dynamics, and packet loss — all of which make a single real stream even worse than this model.',
    click: "It's clicked when \"the link is huge, why is one transfer slow?\" answers itself: a single stream keeps only one window in flight, so window ÷ round-trip is the real ceiling.",
  },
  {
    id: 'consensus',
    n: '08',
    name: 'CONSENSUS ROUND-TRIPS',
    sub: 'agreement is round trips',
    oneLiner:
      'A strongly-consistent write is not done until a majority of replicas confirm it — and confirmation is a round-trip conversation across real distance. This runs the identical protocol at four replica placements, rack to planet, so you can watch geography alone set the price.',
    ch: 'net',
    targetNumbers: ['cross-region-rtt', 'same-dc-rtt'],
    forgeUnlocks: null,
    simplifies: 'Shows the classic 2-phase happy path; real protocols batch, pipeline, and lease-optimize reads — but the floor per unbatched write is still round trips × distance.',
    click: "It's clicked when you can price a strongly-consistent write straight off a map — count the round trips, look at where the replicas live, done — before anyone tells you the latency.",
  },
  {
    id: 'lsmbtree',
    n: '09',
    name: 'LSM vs B-TREE',
    sub: 'same writes, two engines',
    oneLiner:
      'The two database engine families make opposite bets: a B-tree pays at write time to keep every row in place; an LSM appends now and pays at read time. This races the same write stream through both engines, then compares what a single read costs each afterward.',
    ch: 'storage',
    targetNumbers: ['hdd-seek', 'pg-writes'],
    forgeUnlocks: null,
    simplifies: 'Two-level caricature: real B-trees cache hot pages in RAM, and real LSMs bound read amplification with bloom filters and compaction — the asymmetry survives, softened.',
    click: "It's clicked when \"tuned for reads or for writes?\" is the first thing you ask of any database engine — knowing that whoever answers is paying for it somewhere else.",
  },
  {
    id: 'connpool',
    n: '10',
    name: 'CONNECTION POOL',
    sub: '100 conns vs 10k clients',
    oneLiner:
      'Apps borrow database connections from a fixed-size pool — which puts one more queue, invisible to every dashboard, in front of the database. This shows ten thousand clients contending for one hundred connections while the database itself reports barely any load.',
    ch: 'compute',
    targetNumbers: ['pg-reads', 'queue-knee'],
    forgeUnlocks: null,
    simplifies: 'Fixed-size pool with uniform query times; real pools add health checks, per-statement modes, and the database itself degrades as connection count grows.',
    click: "It's clicked when \"the database is slow\" sends you to check the waiting line in FRONT of the database first — because the queue you can't see is still a queue.",
  },
  {
    id: 'backpressure',
    n: '11',
    name: 'BACKPRESSURE',
    sub: 'drop, block, or blow up',
    oneLiner:
      'When a producer outruns its consumer, the difference has to go somewhere: drop messages, force the producer to slow, or buffer without bound until memory runs out. This lets you set the rates, pick each policy, and watch exactly what it costs.',
    ch: 'net',
    targetNumbers: ['queue-knee'],
    forgeUnlocks: null,
    simplifies: 'One producer and one consumer with a single buffer; real systems chain many stages, and pressure propagates upstream hop by hop with its own dynamics.',
    click: "It's clicked when an unbounded buffer reads as a decision someone refused to make — and \"when we overload, who do we say no to?\" becomes your design-review question.",
  },
  {
    id: 'stampede',
    n: '12',
    name: 'TTL & STAMPEDE',
    sub: 'expiry synchronizes the misses',
    oneLiner:
      'A cache TTL is a synchronized alarm: the instant a hot key expires, every request misses at once and goes to the database together. This shows the stampede forming against a database sized for the cached world — and the dogpile lock that breaks it up.',
    ch: 'mem',
    targetNumbers: ['redis-ops', 'pg-reads'],
    forgeUnlocks: 'cache',
    simplifies: 'One key and one cache node; real stampedes multiply across keys expiring together, and real dogpile locks need their own timeout handling.',
    click: "It's clicked when a pile of keys expiring at the same instant reads as a scheduled outage — and jitter, dogpile locks, or serving stale become the knobs you reach for first.",
  },
  {
    id: 'cachecliff',
    n: '13',
    name: 'THE CACHE CLIFF',
    sub: 'why the same loop is 50× slower',
    oneLiner:
      'The same loop runs up to 100× slower depending on whether its data fits in a CPU cache and is walked in order. Grow the working set past L1, L2, and L3 and watch access time climb the memory ladder — then change the access pattern and watch the cliffs move.',
    ch: 'mem',
    targetNumbers: ['l1-hit', 'l2-hit', 'l3-hit', 'dram-access', 'cache-line'],
    forgeUnlocks: null,
    simplifies:
      'A clean four-level staircase with fixed capacities; real caches are set-associative with eviction policies, hardware prefetchers, and TLB effects, so the cliff is a slope with sub-steps — but the order-of-magnitude spread and the sequential-vs-random gap are real.',
    click: "It's clicked when \"how big is the working set, and do we walk it in order?\" becomes your first performance question — before the profiler, before the algorithm.",
  },
  {
    id: 'instruction-loop',
    n: '14',
    name: 'THE INSTRUCTION LOOP',
    sub: 'one instruction per tick',
    oneLiner:
      'Running code means every instruction is fetched, decoded, and executed in turn — and a pipelined core overlaps those stages like an assembly line instead of finishing one instruction before starting the next. Run the same six instructions both ways and watch overlap, not clock speed, deliver the speedup.',
    ch: 'compute',
    targetNumbers: ['cpu-cycle'],
    forgeUnlocks: null,
    simplifies:
      'A textbook 5-stage pipeline with no hazards, stalls, or forwarding; real cores are 15–20 stages with out-of-order, superscalar issue — the assembly-line idea survives, the tidy diagonal does not.',
    click: "It's clicked when \"the computer runs my code\" stops being a black box and becomes a loop you can see — fetch, decode, execute — pipelined into one result per tick.",
  },
  {
    id: 'heat-wall',
    n: '15',
    name: 'THE HEAT WALL',
    sub: 'why clocks stopped at ~4 GHz',
    oneLiner:
      'A faster clock needs disproportionately more power, but a chip package can only shed a fixed amount of heat. Drag the clock up, watch power hit that ceiling — and see why the multicore era was a thermal decision, not an architectural one.',
    ch: 'compute',
    targetNumbers: ['clock-ceiling', 'cpu-cycle'],
    forgeUnlocks: null,
    simplifies:
      'Pure dynamic power (P ∝ f³) against a fixed budget; ignores leakage, turbo/boost, undervolting, and process shrinks — all of which nudge the wall without moving it.',
    click: "It's clicked when \"just clock it faster\" makes you think of heat first — and \"why do we have so many cores?\" answers itself: heat, cubed.",
  },
  {
    id: 'branch-predictor',
    n: '16',
    name: 'THE BRANCH PREDICTOR',
    sub: 'the CPU guesses the future',
    oneLiner:
      'A pipelined CPU must guess which way every branch goes and start executing the guess; a wrong guess throws that work away. This runs one loop over sorted data, then the same data shuffled — so you can watch predictability, not the code, decide the speed.',
    ch: 'compute',
    targetNumbers: ['mispredict-penalty', 'cpu-cycle'],
    forgeUnlocks: null,
    simplifies:
      'A two-state caricature (right ~always vs coin-flip); real predictors are history-based and ~95%+ accurate — the toy shows the penalty of the branches they still miss, the data-dependent ones.',
    click: "It's clicked when a mysterious speedup from sorting an array makes total sense — a predictable branch is a guess the CPU wins, and a wrong guess flushes the pipeline.",
  },
  {
    id: 'tlb-toll',
    n: '17',
    name: 'THE TLB TOLL',
    sub: 'RAM has a second cliff',
    oneLiner:
      'Every memory access first translates a virtual address to a physical one; the TLB is the small cache that makes translation feel free, and its reach is finite. Grow the working set past it and pay a page walk on nearly every access — past RAM itself, fall into swap.',
    ch: 'mem',
    targetNumbers: ['page-size', 'dram-access', 'hdd-seek'],
    forgeUnlocks: null,
    simplifies:
      'One-level TLB and a single page-walk cost; real CPUs have multi-level TLBs, cached page-table walks, and huge pages — the toll is softer and stepped, but the reach ceiling and the swap cliff are real.',
    click: "It's clicked when \"it fits in RAM\" stops feeling sufficient — you also ask whether it fits in the TLB's reach, and \"the box is swapping\" reads as \"the box is dead.\"",
  },
  {
    id: 'false-sharing',
    n: '18',
    name: 'FALSE SHARING',
    sub: 'adding a thread made it slower',
    oneLiner:
      'Parallel code can get slower as cores are added when threads\' private variables happen to share a 64-byte cache line, because cores exchange memory a whole line at a time. This measures that collision — and the one line of padding that fixes it.',
    ch: 'compute',
    targetNumbers: ['cache-line', 'l1-hit'],
    forgeUnlocks: null,
    simplifies:
      'Idealized coherence (a flat serialize on the shared line); real MESI traffic, store buffers, and NUMA distance make it messier — but the "different variables ≠ different lines" trap is exactly this.',
    click: "It's clicked when a scaling mystery makes you check whether two hot variables share a 64-byte line — and per-core state or padding becomes a reflex.",
  },
]

export const toyById = (id: string): ToyEntry | undefined => TOYS.find((t) => t.id === id)
