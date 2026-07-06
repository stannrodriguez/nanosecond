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
}

export const TOYS: ToyEntry[] = [
  {
    id: 'light',
    n: '01',
    name: 'RACE LIGHT',
    sub: 'where latency comes from',
    oneLiner: 'Pick an operation. Watch how far light gets before it ends.',
    ch: 'net',
    targetNumbers: ['cpu-cycle', 'l1-hit', 'dram-access', 'nvme-read', 'hdd-seek', 'cross-region-rtt'],
    forgeUnlocks: 'cdn',
    simplifies: 'Uses light in vacuum (30 cm/ns); signals in silicon and fiber travel ~⅓ slower, and every real operation includes software overhead the racetrack ignores.',
  },
  {
    id: 'disk',
    n: '02',
    name: 'THE DISK',
    sub: 'random vs sequential, 1000×',
    oneLiner: 'Two identical drives race for the same data; one refuses to move its head.',
    ch: 'storage',
    targetNumbers: ['hdd-seek', 'hdd-iops'],
    forgeUnlocks: 'queue',
    simplifies: 'One platter, one head, no OS scheduling or drive cache; real drives reorder requests (elevator algorithms) to soften — never beat — the physics.',
  },
  {
    id: 'dram',
    n: '03',
    name: 'LEAKY BITS',
    sub: 'what RAM actually is',
    oneLiner: 'RAM is billions of leaking buckets, refreshed forever. Turn the refresh off.',
    ch: 'mem',
    targetNumbers: ['dram-access'],
    forgeUnlocks: null,
    simplifies: 'Time slowed ~10 billion×; real cells leak in ~64 ms not seconds, refresh is per-row DMA the CPU never sees, and ECC quietly fixes single-bit losses.',
  },
  {
    id: 'queue',
    n: '04',
    name: 'THE QUEUE',
    sub: 'why 80% is the real 100%',
    oneLiner: 'One server, random arrivals. Drag utilization and watch waiting — not throughput.',
    ch: 'compute',
    targetNumbers: ['queue-knee', 'app-server-rps'],
    forgeUnlocks: 'workers',
    simplifies: 'A single M/M/1-flavored server with random service times; real systems have many servers, admission control, and retries that make the knee even sharper.',
  },
  {
    id: 'hotpartition',
    n: '05',
    name: 'HOT PARTITION',
    sub: 'keys are hash buckets',
    oneLiner: 'Watch "now" as a partition key melt one node while seven idle.',
    ch: 'storage',
    targetNumbers: ['partition-write-cap'],
    forgeUnlocks: 'shards',
    simplifies: 'Eight fixed partitions with equal capacity; real stores split hot partitions adaptively (too late for a per-second spike) and rebalance in the background.',
  },
  {
    id: 'replag',
    n: '06',
    name: 'REPLICATION LAG',
    sub: 'the copy is the recent past',
    oneLiner: "Push writes past the replica's apply rate, then try to read your own comment.",
    ch: 'storage',
    targetNumbers: ['pg-writes'],
    forgeUnlocks: 'replicas',
    simplifies: 'One replica applying a perfectly ordered stream; real lag also spikes on big transactions, vacuum, and network hiccups — and failover can lose unreplicated writes.',
  },
  {
    id: 'pipe',
    n: '07',
    name: 'THE PIPE',
    sub: 'bandwidth × RTT',
    oneLiner: 'Why one TCP stream cannot fill a fat, long link — the ACK has to come back.',
    ch: 'net',
    targetNumbers: ['bdp', 'cross-region-rtt'],
    forgeUnlocks: null,
    simplifies: 'Ignores slow start, congestion control dynamics, and packet loss — all of which make a single real stream even worse than this model.',
  },
  {
    id: 'consensus',
    n: '08',
    name: 'CONSENSUS ROUND-TRIPS',
    sub: 'agreement is round trips',
    oneLiner: 'One strongly-consistent write = 2 round trips × wherever your replicas live.',
    ch: 'net',
    targetNumbers: ['cross-region-rtt', 'same-dc-rtt'],
    forgeUnlocks: null,
    simplifies: 'Shows the classic 2-phase happy path; real protocols batch, pipeline, and lease-optimize reads — but the floor per unbatched write is still round trips × distance.',
  },
  {
    id: 'lsmbtree',
    n: '09',
    name: 'LSM vs B-TREE',
    sub: 'same writes, two engines',
    oneLiner: 'Race the same write stream through both engines, then pay the read bill.',
    ch: 'storage',
    targetNumbers: ['hdd-seek', 'pg-writes'],
    forgeUnlocks: null,
    simplifies: 'Two-level caricature: real B-trees cache hot pages in RAM, and real LSMs bound read amplification with bloom filters and compaction — the asymmetry survives, softened.',
  },
  {
    id: 'connpool',
    n: '10',
    name: 'CONNECTION POOL',
    sub: '100 conns vs 10k clients',
    oneLiner: 'Ten thousand app threads, one hundred database connections. Find the hidden queue.',
    ch: 'compute',
    targetNumbers: ['pg-reads', 'queue-knee'],
    forgeUnlocks: null,
    simplifies: 'Fixed-size pool with uniform query times; real pools add health checks, per-statement modes, and the database itself degrades as connection count grows.',
  },
  {
    id: 'backpressure',
    n: '11',
    name: 'BACKPRESSURE',
    sub: 'drop, block, or blow up',
    oneLiner: 'A fast producer, a slow consumer, and a buffer that has to choose.',
    ch: 'net',
    targetNumbers: ['queue-knee'],
    forgeUnlocks: null,
    simplifies: 'One producer and one consumer with a single buffer; real systems chain many stages, and pressure propagates upstream hop by hop with its own dynamics.',
  },
  {
    id: 'stampede',
    n: '12',
    name: 'TTL & STAMPEDE',
    sub: 'the dogpile',
    oneLiner: 'One hot key expires; ten thousand misses race to the database at once.',
    ch: 'mem',
    targetNumbers: ['redis-ops', 'pg-reads'],
    forgeUnlocks: 'cache',
    simplifies: 'One key and one cache node; real stampedes multiply across keys expiring together, and real dogpile locks need their own timeout handling.',
  },
  {
    id: 'cachecliff',
    n: '13',
    name: 'THE CACHE CLIFF',
    sub: 'why the same loop is 50× slower',
    oneLiner: 'Grow the working set past each cache. Watch identical work fall off a cliff — then move the cliff with locality.',
    ch: 'mem',
    targetNumbers: ['l1-hit', 'l2-hit', 'l3-hit', 'dram-access', 'cache-line'],
    forgeUnlocks: null,
    simplifies:
      'A clean four-level staircase with fixed capacities; real caches are set-associative with eviction policies, hardware prefetchers, and TLB effects, so the cliff is a slope with sub-steps — but the order-of-magnitude spread and the sequential-vs-random gap are real.',
  },
]

export const toyById = (id: string): ToyEntry | undefined => TOYS.find((t) => t.id === id)
