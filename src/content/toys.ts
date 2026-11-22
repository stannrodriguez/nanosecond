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
      'Latency numbers are easy to memorize and hard to feel, while physical distance makes instant sense. Race a cache hit, a disk read, or a cross-region hop against light itself and watch its duration map onto a real place: the chip, the building, or the planet.',
    ch: 'net',
    targetNumbers: ['cpu-cycle', 'l1-hit', 'dram-access', 'nvme-read', 'hdd-seek', 'cross-region-rtt'],
    forgeUnlocks: 'cdn',
    simplifies: 'Uses light in a vacuum (30 cm/ns). Signals in silicon and fiber move roughly a third slower, and real operations add software overhead that this track leaves out.',
    click: "It's clicked when nanoseconds, microseconds, and milliseconds stop feeling like metric prefixes and start mapping directly to places: the chip, the box, the building, and the planet.",
  },
  {
    id: 'disk',
    n: '02',
    name: 'THE DISK',
    sub: 'random vs sequential, 1000×',
    oneLiner:
      'A spinning disk reads ~1000× faster in order than at random because every random jump swings a physical arm and waits for the platter to rotate under it. Watch two identical drives read the exact same data, one jumping and one streaming, as the gap opens up.',
    ch: 'storage',
    targetNumbers: ['hdd-seek', 'hdd-iops'],
    forgeUnlocks: 'queue',
    simplifies: 'Models one platter and one head, with no OS scheduler or drive cache. Real drives reorder requests with elevator algorithms to soften the physics, never to escape them.',
    click: 'It\'s clicked when you ask "random or sequential?" before doing any storage math, because that single answer shifts the numbers by 1000×.',
  },
  {
    id: 'dram',
    n: '03',
    name: 'LEAKY BITS',
    sub: 'bits are charge, and charge leaks',
    oneLiner:
      'RAM stores each bit as electrical charge inside a leaky capacitor, kept alive only by a hardware refresh loop that rewrites every row over and over. Watch the charge drain and recharge, then flip refresh off to see your data fade out.',
    ch: 'mem',
    targetNumbers: ['dram-access'],
    forgeUnlocks: null,
    simplifies: 'Slows time down ~10 billion×. Real cells leak in ~64 ms rather than seconds, refresh runs as per-row DMA invisible to the CPU, and ECC quietly repairs single-bit errors.',
    click: 'It\'s clicked when "stored in memory" stops sounding safe, and "does this survive a power cut?" becomes a reflex for every piece of state you design.',
  },
  {
    id: 'queue',
    n: '04',
    name: 'THE QUEUE',
    sub: 'why 80% is the real 100%',
    oneLiner:
      'A server starts hurting long before it hits 100% busy. As utilization climbs, waiting time shoots upward while throughput still looks healthy. Drag utilization across the knee to watch the wait-time curve your CPU graph never shows.',
    ch: 'compute',
    targetNumbers: ['queue-knee', 'app-server-rps'],
    forgeUnlocks: 'workers',
    simplifies: 'Models a single M/M/1-style server with random service times. Real fleets add multiple servers, admission control, and client retries that make the knee even sharper.',
    click: 'It\'s clicked when hearing "the server is only at 85%, we have headroom" makes you wince, because you can picture the wait-time curve bending steeply before the CPU graph admits trouble.',
  },
  {
    id: 'hotpartition',
    n: '05',
    name: 'HOT PARTITION',
    sub: 'every key lands on one node',
    oneLiner:
      'Partitioned databases spread data by hashing the partition key. When every writer picks the same key, like "now", today\'s date, or a viral ID, every write piles onto a single node. Send a timestamp-keyed burst and watch one node melt while seven sit idle.',
    ch: 'storage',
    targetNumbers: ['partition-write-cap'],
    forgeUnlocks: 'shards',
    simplifies: 'Uses eight fixed partitions with equal capacity. Real databases can split hot partitions adaptively, though rarely fast enough for a sudden per-second spike, and they rebalance in the background.',
    click: 'It\'s clicked when you spot a hot key in a schema review, like "partitioned by timestamp", before it ships, melts one node, and pages you at 3am.',
  },
  {
    id: 'replag',
    n: '06',
    name: 'REPLICATION LAG',
    sub: 'the copy is the recent past',
    oneLiner:
      "A read replica replays the primary's writes after a delay, so reading from a replica means reading the recent past. Push writes faster than the replica can keep up, watch the lag widen, and try reading back your own comment before it arrives.",
    ch: 'storage',
    targetNumbers: ['pg-writes'],
    forgeUnlocks: 'replicas',
    simplifies: 'Models one replica replaying a neatly ordered stream. In production, lag also spikes during large transactions, vacuum, and network hiccups, and a failover can drop unreplicated writes.',
    click: "It's clicked when a user's missing comment stops feeling mysterious and turns into a race you can sketch on a napkin: the write hit the primary, and the read reached the replica first.",
  },
  {
    id: 'pipe',
    n: '07',
    name: 'THE PIPE',
    sub: 'bandwidth × RTT',
    oneLiner:
      "A TCP sender can only keep one window of unacknowledged bytes in flight before pausing to wait for replies to travel back. On a fast, long-distance link, a single stream tops out well below the advertised bandwidth because distance, not pipe width, sets the cap.",
    ch: 'net',
    targetNumbers: ['bdp', 'cross-region-rtt'],
    forgeUnlocks: null,
    simplifies: 'Leaves out slow start, congestion-control adjustments, and packet loss. All three make a real single TCP stream perform even worse than this model.',
    click: 'It\'s clicked when "the link is huge, why is this transfer slow?" answers itself: a single stream only keeps one window in flight, so window ÷ round-trip is the real ceiling.',
  },
  {
    id: 'consensus',
    n: '08',
    name: 'CONSENSUS ROUND-TRIPS',
    sub: 'agreement costs round trips',
    oneLiner:
      'A strongly consistent write is not finished until a majority of replicas confirm it, and confirmation requires round-trip messages across physical distance. Run the exact same protocol at four replica layouts, from one rack to the whole planet, and watch geography alone set the latency.',
    ch: 'net',
    targetNumbers: ['cross-region-rtt', 'same-dc-rtt'],
    forgeUnlocks: null,
    simplifies: 'Shows the classic 2-phase happy path. Real consensus systems batch, pipeline, and use leader leases for fast reads, yet an unbatched write still cannot beat round trips × distance.',
    click: "It's clicked when you can estimate a strongly consistent write straight off a map: count the round trips, check where the replicas sit, and know the floor before anyone runs a benchmark.",
  },
  {
    id: 'lsmbtree',
    n: '09',
    name: 'LSM vs B-TREE',
    sub: 'same writes, two engines',
    oneLiner:
      'The two main storage-engine families place opposite bets. A B-tree pays at write time to keep every row filed in place, while an LSM appends sequentially now and pays later during reads and compaction. Feed the same write stream to both and compare what a lookup costs afterward.',
    ch: 'storage',
    targetNumbers: ['hdd-seek', 'pg-writes'],
    forgeUnlocks: null,
    simplifies: 'A simplified two-level comparison. Real B-trees cache hot pages in RAM, and real LSMs curb read amplification with bloom filters and compaction, softening the gap without erasing it.',
    click: 'It\'s clicked when "tuned for reads or for writes?" is the first question you ask about any storage engine, knowing that saving work on one side means paying for it on the other.',
  },
  {
    id: 'connpool',
    n: '10',
    name: 'CONNECTION POOL',
    sub: '100 conns vs 10k clients',
    oneLiner:
      'Application servers borrow database connections from a fixed-size pool, which puts another queue right in front of the database, often invisible on database dashboards. Watch 10,000 clients compete for 100 connections while the database itself reports light load.',
    ch: 'compute',
    targetNumbers: ['pg-reads', 'queue-knee'],
    forgeUnlocks: null,
    simplifies: 'Models a fixed-size pool with uniform query times. Real pools add health checks and transaction or statement pooling modes, and real databases also slow down as open connections multiply.',
    click: 'It\'s clicked when "the database is slow" sends you to check the waiting line in front of the database first, because a queue your dashboard hides is still a queue.',
  },
  {
    id: 'backpressure',
    n: '11',
    name: 'BACKPRESSURE',
    sub: 'drop, block, or blow up',
    oneLiner:
      'When a producer outpaces its consumer, the extra work has to go somewhere: drop messages, force the producer to slow down, or buffer without limit until memory runs out. Dial the rates, switch between the three policies, and see what each one costs.',
    ch: 'net',
    targetNumbers: ['queue-knee'],
    forgeUnlocks: null,
    simplifies: 'Models one producer, one consumer, and a single buffer. Real pipelines chain many stages, and backpressure ripples upstream hop by hop with its own timing quirks.',
    click: 'It\'s clicked when an unbounded buffer looks like a hard decision someone put off, and "when we overload, who do we tell no?" becomes your go-to design-review question.',
  },
  {
    id: 'stampede',
    n: '12',
    name: 'TTL & STAMPEDE',
    sub: 'expiry synchronizes the misses',
    oneLiner:
      'A cache TTL acts like a synchronized alarm. The moment a hot key expires, every incoming request misses together and rushes the database at once. Watch a stampede hit a database sized for cached traffic, then see how a dogpile lock breaks it up.',
    ch: 'mem',
    targetNumbers: ['redis-ops', 'pg-reads'],
    forgeUnlocks: 'cache',
    simplifies: 'Models a single hot key and one cache node. Real stampedes compound when many keys expire together, and real dogpile locks have to handle timeouts if the chosen rebuilder stalls.',
    click: "It's clicked when a batch of keys expiring at the same moment looks like a scheduled outage, and jitter, dogpile locks, or serving stale become the first tools you reach for.",
  },
  {
    id: 'cachecliff',
    n: '13',
    name: 'THE CACHE CLIFF',
    sub: 'why the same loop is 50× slower',
    oneLiner:
      'The exact same loop can run up to 100× slower depending on whether its data fits in a CPU cache and whether you walk it in order. Grow the working set past L1, L2, and L3 to climb the memory ladder, then switch access patterns and watch the cliffs shift.',
    ch: 'mem',
    targetNumbers: ['l1-hit', 'l2-hit', 'l3-hit', 'dram-access', 'cache-line'],
    forgeUnlocks: null,
    simplifies:
      'Shows a clean four-level staircase with fixed capacities. Real caches are set-associative with eviction policies, hardware prefetchers, and TLB effects, turning sharp cliffs into stepped slopes while keeping the order-of-magnitude gap and the sequential-vs-random divide intact.',
    click: 'It\'s clicked when "how big is the working set, and do we walk it in order?" comes out of your mouth before you open a profiler or rewrite the algorithm.',
  },
  {
    id: 'instruction-loop',
    n: '14',
    name: 'THE INSTRUCTION LOOP',
    sub: 'one instruction per tick',
    oneLiner:
      'Running a program means fetching, decoding, and executing every instruction in sequence. A pipelined core overlaps those stages like an assembly line instead of finishing one instruction before starting the next. Run the same six instructions both ways to see overlap, not clock speed, deliver the gain.',
    ch: 'compute',
    targetNumbers: ['cpu-cycle'],
    forgeUnlocks: null,
    simplifies:
      'A textbook 5-stage pipeline with no hazards, stalls, or forwarding. Real cores run 15 to 20 stages with out-of-order, superscalar issue, so the assembly-line principle holds even though the neat diagonal does not.',
    click: 'It\'s clicked when "the computer runs my code" stops being a black box and becomes a visible loop of fetch, decode, and execute, pipelined into one finished result per tick.',
  },
  {
    id: 'heat-wall',
    n: '15',
    name: 'THE HEAT WALL',
    sub: 'why clocks stopped at ~4 GHz',
    oneLiner:
      'Pushing a clock higher demands disproportionately more power, while a chip package can only carry away so much heat. Slide the clock upward until power hits that thermal ceiling and see why the multicore era was forced by heat, not fashion.',
    ch: 'compute',
    targetNumbers: ['clock-ceiling', 'cpu-cycle'],
    forgeUnlocks: null,
    simplifies:
      'Models pure dynamic power (P ∝ f³) against a fixed thermal budget. Real chips also deal with leakage, turbo boost, undervolting, and process shrinks, which nudge the wall without moving it.',
    click: 'It\'s clicked when "just clock it faster" makes you think of heat first, and "why do we have so many cores?" answers itself: power grows with frequency cubed.',
  },
  {
    id: 'branch-predictor',
    n: '16',
    name: 'THE BRANCH PREDICTOR',
    sub: 'the CPU guesses the future',
    oneLiner:
      'To keep its pipeline busy, a CPU guesses which way each branch will go and runs ahead speculatively. A wrong guess throws that work away. Run the same loop on sorted data and then on shuffled data to watch predictability, not the code itself, set the speed.',
    ch: 'compute',
    targetNumbers: ['mispredict-penalty', 'cpu-cycle'],
    forgeUnlocks: null,
    simplifies:
      'Uses a two-state contrast (almost always right vs. a coin flip). Real predictors track branch history and hit ~95%+ accuracy; this toy isolates the cost of the data-dependent branches they still miss.',
    click: "It's clicked when a surprise speedup from sorting an array makes immediate sense: a predictable branch is a guess the CPU wins, while a wrong guess flushes the pipeline.",
  },
  {
    id: 'tlb-toll',
    n: '17',
    name: 'THE TLB TOLL',
    sub: 'RAM has a second cliff',
    oneLiner:
      'Every memory access first translates a virtual address into a physical one. The TLB is the tiny cache that makes translation feel free, and it only reaches so far. Push the working set past that reach to pay a page walk on nearly every access, and push past RAM to drop straight into swap.',
    ch: 'mem',
    targetNumbers: ['page-size', 'dram-access', 'hdd-seek'],
    forgeUnlocks: null,
    simplifies:
      'Models a one-level TLB and a single page-walk cost. Real CPUs use multi-level TLBs, cached page-table walks, and huge pages, making the toll softer and stepped, while the reach ceiling and swap cliff remain real.',
    click: 'It\'s clicked when "it fits in RAM" stops feeling like the whole story: you also ask if it fits in the TLB\'s reach, and "the box is swapping" immediately reads as "the box is dead."',
  },
  {
    id: 'false-sharing',
    n: '18',
    name: 'FALSE SHARING',
    sub: 'adding a thread made it slower',
    oneLiner:
      "Adding cores can actually slow parallel code down when two threads' private variables happen to sit in the same 64-byte cache line, because cores trade memory a full line at a time. Measure that collision here, then add the single line of padding that clears it.",
    ch: 'compute',
    targetNumbers: ['cache-line', 'l1-hit'],
    forgeUnlocks: null,
    simplifies:
      'Models idealized coherence as a flat serialization on the shared line. Real MESI traffic, store buffers, and NUMA distance make the timing messier, yet the "different variables ≠ different lines" trap works the exact same way.',
    click: "It's clicked when a stubborn scaling mystery makes you check whether two hot variables share a 64-byte cache line, and padding or per-core state becomes second nature.",
  },
]

export const toyById = (id: string): ToyEntry | undefined => TOYS.find((t) => t.id === id)
