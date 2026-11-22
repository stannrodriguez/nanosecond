// Toy field briefings (docs/content-pipeline.md §2, law L2: brief before test).
// The background layer rendered above each Lab sim: `setting` says what the
// mechanism is, where it lives in a real system, and why it matters — BEFORE
// the player touches anything; `meetIt` names the famous technologies the
// mechanism explains. JSX is copy + <Term> links only (scenarios.tsx pattern).
// The toy's glossary chips and Library cross-links derive from the concept
// registry (concepts.ts) — no second list here to keep in sync.

import type { ReactNode } from 'react'
import { Term as T } from '../ui/Term'

export interface ToyBriefing {
  /** 2–4 plain-language sentences; every jargon word a <Term>. Never a wall of text. */
  setting: ReactNode
  /** where you'll meet it: 2–4 real technologies, each with a one-clause "how" */
  meetIt: { name: string; how: ReactNode }[]
  /**
   * spec 081: the same pattern recurring on OTHER floors of the stack —
   * caching, queues, batching, Little's law. Author only where the echo is
   * TRUE (≥6 exist bank-wide, enforced); never invent one to fill the field.
   */
  echo?: ReactNode
}

/** Keyed by toy id (src/content/toys.ts); tests/schema.test.ts enforces 1:1 coverage. */
export const BRIEFINGS: Record<string, ToyBriefing> = {
  light: {
    setting: (
      <>
        Before sizing any system, it helps to have a physical feel for the latency ladder: the jump from a CPU cache hit to
        a RAM fetch, a disk read, and a <T k="request">request</T> crossing an ocean. That spread is not sloppy
        engineering. It is geometry. Light moves at 30 cm per nanosecond and nothing carries a signal faster, so{' '}
        <i>where data lives</i> sets a hard floor on response time. Half of systems design is placing data closer before
        anyone asks for it.
      </>
    ),
    meetIt: [
      { name: 'CDNs (Cloudflare, CloudFront)', how: <>a business built on geometry: keep copies near users because nobody can speed up light, which is the whole <T k="cdn">CDN</T> pitch</> },
      { name: 'AWS regions', how: '"which region?" is really asking how many milliseconds of light travel your users will accept' },
      { name: 'Redis', how: 'serves directly from RAM to stay on the shortest rungs of this ladder' },
    ],
    echo: 'The latency ladder is the entire stack measured in distance: L1 to DRAM to disk to cross-region, each rung just another floor away at the end of a longer wire.',
  },
  disk: {
    setting: (
      <>
        Database speed comes down to where bytes land on disk. Spinning drives still hold much of the world's cheap
        storage, and they lead a double life: read them in order and they keep up nicely, jump around at random and they
        drop to ~120 operations a second, a 1000× penalty caused by moving metal. A huge chunk of storage design, from the{' '}
        <T k="wal">WAL</T> to <T k="lsm">LSM</T> engines and every <T k="index">index</T>, exists to turn random access into
        sequential work.
      </>
    ),
    meetIt: [
      { name: 'Kafka', how: 'an append-only log that skips seeking altogether, selling sequential disk physics as a product' },
      { name: 'PostgreSQL', how: <>commits land in the sequential <T k="wal">write-ahead log</T> first so random page updates can happen later</> },
      { name: 'RocksDB / Cassandra', how: 'LSM engines that group random writes into sequential flushes (toy 09 races them head to head)' },
    ],
    echo: "Batching to avoid per-item overhead shows up on every floor: 64-byte cache lines, 4 KB pages, network packets, and replication streams all avoid paying a full trip for a single tiny item.",
  },
  dram: {
    setting: (
      <>
        Data has two kinds of home: fast and forgetful, or slower and <T k="durable">durable</T>. RAM is the first kind.
        Each bit sits as charge in a leaking capacitor right next to the CPU, readable in ~100 ns and gone moments after
        power drops. That fragility, not just the speed, is the real divide. It explains why a <T k="cache">cache</T> is
        allowed to forget, why a database waits for disk before calling a write saved, and why keeping state in memory
        should always be a deliberate durability call.
      </>
    ),
    meetIt: [
      { name: 'Redis / memcached', how: 'RAM speed packaged as a service, with volatility printed right in the fine print' },
      { name: 'PostgreSQL fsync', how: 'waits to report "committed" until bytes are safe on disk, not only sitting in RAM' },
      { name: 'Every cache-fleet restart', how: 'a reboot clears RAM completely, sending every miss straight to the database downstream' },
    ],
  },
  queue: {
    setting: (
      <>
        Every box in an architecture, whether app server, database, disk, or load balancer, behaves like the same basic
        thing: a worker with a waiting line. Queueing theory delivers one unforgiving rule. As <T k="util">utilization</T>{' '}
        climbs toward 100%, waiting time does not rise gently; it <i>explodes</i> well before the box looks full. That is
        why scale triggers and <T k="autoscaling">autoscaling</T> targets sit around 70 to 80%, and why <T k="p99">p99</T>{' '}
        spikes while CPU graphs still look calm.
      </>
    ),
    meetIt: [
      { name: 'Kubernetes HPA / AWS Auto Scaling', how: 'default CPU targets sit near 70% to keep fleets comfortably to the left of the knee' },
      { name: 'PostgreSQL under load', how: '"CPU hit 90% and latency tripled" is this exact curve playing out in production' },
      { name: 'Load balancers', how: <>spreading incoming requests is really a way to buy lower <T k="util">utilization</T> per machine</> },
    ],
    echo: 'Every floor has its own waiting line: instruction buffers inside the chip, run queues in the OS, connection pools at the database, and Kafka between services. The knee follows all of them.',
  },
  hotpartition: {
    setting: (
      <>
        When one machine cannot keep up with writes, stores like DynamoDB and Cassandra split data across nodes by hashing a
        partition key, assigning a <T k="shard">shard</T> to each hash range. Hashing spreads <i>keys</i> evenly, not{' '}
        <i>traffic</i>. If every writer hits the same key right now, such as the current timestamp, a viral post, or one
        huge tenant, a single node takes 100% of the load while its neighbors sit idle. That is a{' '}
        <T k="hotpartition">hot partition</T>, and a day-one key choice can haunt you in year three.
      </>
    ),
    meetIt: [
      { name: 'DynamoDB', how: 'per-partition write caps (~1,000/s) turn one popular key into a fast way to get paged' },
      { name: 'Kafka', how: 'a single hot partition pins one consumer at 100% while the rest of the consumer group idles' },
      { name: 'Cassandra / Bigtable', how: 'row keys built around raw timestamps are the classic self-inflicted hotspot' },
    ],
  },
  replag: {
    setting: (
      <>
        Most applications read far more often than they write, so the usual first scaling move is adding a{' '}
        <T k="replica">read replica</T>, a live copy dedicated to reads. Replication is an ongoing stream rather than an
        instant mirror, so every replica trails slightly behind the primary. Under heavy write traffic, "slightly" stretches
        into noticeable <T k="replag">lag</T>. The first thing users feel is broken{' '}
        <T k="readyourwrites">read-your-writes</T>: you post a comment, reload from a stale copy, and your comment looks
        gone.
      </>
    ),
    meetIt: [
      { name: 'RDS / Aurora read replicas', how: 'the checkbox that adds read capacity and replication lag in a single click' },
      { name: 'PostgreSQL streaming replication', how: <>the primary streams its <T k="wal">WAL</T> while replicas replay those changes as fast as they can</> },
      { name: 'Rails / Django read-write splitting', how: 'frameworks route your reads back to the primary right after a write because this bug is so common' },
    ],
    echo: 'Every copy on every floor can drift: CPU caches need coherence protocols for the same reason replicas need care, because any copy bets that the original will hold still.',
  },
  pipe: {
    setting: (
      <>
        A link's advertised bandwidth is a speed limit, not a guarantee. TCP will only send one window of unacknowledged
        bytes before stopping to wait for replies, which caps a single stream's <T k="throughput">throughput</T> at window ÷
        round-trip. Distance, not copper or fiber width, becomes the real limit. That quantity is the bandwidth-delay
        product: the wider and longer the pipe, the more of it sits empty unless something actively keeps it full.
      </>
    ),
    meetIt: [
      { name: 'TCP window scaling', how: 'a protocol extension added because the original small windows starved fast, long-distance links' },
      { name: 'S3 multipart / aria2', how: 'parallel streams solve the cap the practical way by keeping many windows in flight at once' },
      { name: 'BBR', how: "Google's congestion control estimates the bandwidth-delay product directly instead of waiting for packet loss" },
    ],
    echo: "Throughput = in-flight ÷ round-trip is Little's law, and it governs every floor: TCP windows on the wire, outstanding cache misses inside a CPU, and replication streams between cities.",
  },
  consensus: {
    setting: (
      <>
        Some facts cannot split into two versions: who the <T k="leader">leader</T> is, who holds a lock, or whether a
        payment committed. For those, a <T k="quorum">quorum</T> of nodes has to agree <i>before</i> anyone replies, and
        agreement is paid in round trips. The protocol stays the same while the map changes everything. Voters inside one
        datacenter settle in about a millisecond, while voters spread across continents pay the planet tax on every single
        write. This is the <T k="cap">CAP</T> tradeoff with a stopwatch running.
      </>
    ),
    meetIt: [
      { name: 'etcd / ZooKeeper', how: 'control planes for Kubernetes and Kafka, kept inside one datacenter so agreement stays near ~1 ms' },
      { name: 'Google Spanner', how: 'pays cross-continent round trips for globally strong writes and stays honest about the latency cost' },
      { name: 'Cassandra QUORUM', how: 'a per-query dial that trades agreement strength directly against round trips' },
    ],
  },
  lsmbtree: {
    setting: (
      <>
        Every storage engine makes a bet on how bytes should hit disk. A <T k="btree">B-tree</T> puts each row in its sorted
        spot at write time, keeping reads fast while turning writes into random disk touches. An <T k="lsm">LSM</T> refuses
        to seek: it appends sequentially now and sorts in the background later, buying high write throughput on credit that
        reads and compaction pay back. Neither family wins universally. Each fits a different read/write mix, which is why
        both power huge parts of the internet.
      </>
    ),
    meetIt: [
      { name: 'PostgreSQL / MySQL (InnoDB)', how: 'B-tree engines tuned for the common case where reads outweigh writes' },
      { name: 'RocksDB / LevelDB', how: 'the LSM engine embedded inside CockroachDB, TiDB, Kafka Streams, and much of modern infrastructure' },
      { name: 'Cassandra / HBase', how: 'cluster-scale LSM stores built to swallow write firehoses while budgeting for compaction' },
    ],
  },
  connpool: {
    setting: (
      <>
        To a database, every open connection costs real memory and scheduling work, so a few hundred already feel crowded.
        To an application fleet, connections look cheap, and serverless functions multiplied them overnight. A{' '}
        <T k="connpool">connection pool</T> bridges the two: thousands of clients share a small, fixed set of connections.
        That adapter quietly creates a second server with its own <T k="queue">queue</T> and its own knee, which is why
        "the database is slow" often means the line waiting in <i>front</i> of it.
      </>
    ),
    meetIt: [
      { name: 'PgBouncer', how: 'so useful that it runs beside almost every serious Postgres deployment' },
      { name: 'HikariCP', how: "the JVM's standard pool, complete with its own folklore about how to size it" },
      { name: 'AWS RDS Proxy', how: 'exists largely because Lambda multiplied concurrent database clients by a thousand overnight' },
    ],
  },
  backpressure: {
    setting: (
      <>
        Connect a fast stage to a slow one and simple arithmetic takes over: if work arrives faster than the slow stage
        drains it, the surplus has to go <i>somewhere</i>. A buffer only buys breathing room. You really have three choices:
        slow the producer down (<T k="backpressure">backpressure</T>), drop excess work on purpose (
        <T k="ratelimit">rate limiting</T>), or let the buffer grow until memory gives out. Resilient systems are not the
        ones that never overload; they are the ones that picked their answer ahead of time.
      </>
    ),
    meetIt: [
      { name: 'TCP flow control', how: 'backpressure built straight into the internet, using the receiver window to pause the sender' },
      { name: 'Kafka consumer lag', how: <>the buffer made visible, turning a growing <T k="backlog">backlog</T> into a dashboard metric with an alarm</> },
      { name: 'Envoy / NGINX rate limits', how: 'choosing to reject a small slice of traffic now instead of losing everything later' },
    ],
    echo: 'Overload leaves the same three choices on every floor: TCP receiver windows block, load shedders drop, and unbounded buffers crash. Only the names change between layers.',
  },
  stampede: {
    setting: (
      <>
        A good <T k="cache">cache</T> shields the database so well that the database forgets what full traffic feels like.
        Because cached data goes stale, we attach a <T k="ttl">TTL</T>, which accidentally lines up the forgetting: the
        second a hot key expires, every in-flight miss heads to the database <i>together</i>. That surge is a{' '}
        <T k="stampede">stampede</T> (or dogpile), where a database sized for a 1% miss rate suddenly meets 100% of traffic
        in one expensive burst.
      </>
    ),
    meetIt: [
      { name: 'Redis / memcached', how: 'where dogpile locks, jittered TTLs, and probabilistic early refresh get wired up in practice' },
      { name: "Facebook's memcache leases", how: 'the classic large-scale fix where one miss recomputes the value while other callers wait briefly' },
      { name: 'Fastly / Varnish', how: 'request coalescing merges a thousand identical cache misses into a single origin fetch' },
    ],
  },
  cachecliff: {
    setting: (
      <>
        Your CPU runs thousands of times faster than the RAM feeding it, so hardware hides that gap behind a stack of small,
        fast caches: L1, L2, and L3, each larger and slower than the one above it. Whether your data fits inside those tiers
        often shapes runtime far more than instruction count. Because the CPU moves memory a 64-byte{' '}
        <T k="cacheline">cache line</T> at a time, placing data you use together side by side gives you{' '}
        <T k="locality">locality</T>, the difference between a loop that flies and the same loop crawling.
      </>
    ),
    meetIt: [
      { name: 'Arrays vs linked lists', how: 'contiguous arrays stream full cache lines, while walking a linked list misses on nearly every node' },
      { name: 'Column stores (Parquet, ClickHouse)', how: 'pack each column contiguously so analytical scans pull only needed bytes, neatly aligned to cache lines' },
      { name: 'Data-oriented design (game engines)', how: 'favors struct-of-arrays over array-of-structs so hot fields pack cleanly into loaded cache lines' },
    ],
    echo: <>L1 is to DRAM what Redis is to Postgres and what a CDN edge is to an origin: the same bet (small, fast, nearby, allowed to forget) placed on three floors of the stack. Understand one <T k="cache">cache</T> and you recognize all of them.</>,
  },
  'instruction-loop': {
    setting: (
      <>
        At the bottom, every program you have ever written runs as the same tight loop: the CPU{' '}
        <T k="pipeline">fetches an instruction, decodes it, and executes it</T>, repeating billions of times a second. A
        pipeline overlaps those steps like an assembly line so a completed instruction can leave on every clock tick. This
        loop is the engine underneath every higher floor of the stack; everything above it decides which instructions arrive
        next.
      </>
    ),
    meetIt: [
      { name: 'Every CPU (x86, ARM, RISC-V)', how: 'the fetch-decode-execute pipeline is the shared skeleton beneath every instruction set' },
      { name: 'perf / VTune counters', how: 'IPC (instructions per cycle) is the headline profiler metric showing how full your pipeline stays' },
      { name: 'GPUs', how: 'trade one deep, clever pipeline for thousands of simpler ones running the same loop in parallel' },
    ],
  },
  'heat-wall': {
    setting: (
      <>
        Running a clock faster makes a chip dramatically hotter, since dynamic power climbs roughly with frequency cubed.
        Cooling puts a hard cap near ~4 GHz that has barely budged in twenty years. When engineers could no longer build one
        dramatically faster core, they put more of them on the die. That thermal wall is why your laptop ships with many{' '}
        <T k="core">cores</T> instead of one blazingly fast one, and why parallel software stopped being optional.
      </>
    ),
    meetIt: [
      { name: 'The multicore era (since ~2005)', how: 'the industry pivot from selling higher GHz to selling more cores started the moment chips hit this wall' },
      { name: 'Laptop / phone thermal throttling', how: 'the exact same curve in your hands, dropping clock speed as soon as sustained load heats the die' },
      { name: 'Data-center power bills', how: 'real server fleets optimize for performance per watt, not raw GHz' },
    ],
  },
  'branch-predictor': {
    setting: (
      <>
        To keep its pipeline busy, a CPU cannot pause to find out which way an <span className="mono">if</span> statement
        goes. Instead, it <T k="speculation">guesses and runs ahead</T>. Right guesses cost nothing, while wrong ones flush
        the pipeline and burn ~15 cycles. The predictor looks almost psychic on patterned data and helpless on random data,
        which is why the exact same loop can run several times faster once the input is sorted.
      </>
    ),
    meetIt: [
      { name: 'The famous “sorted array” speedup', how: 'one of Stack Overflow’s most-voted questions is this exact effect: sort first and the branchy loop flies' },
      { name: 'Spectre / Meltdown', how: 'speculative work left footprints in the cache, opening an entire class of hardware security bugs' },
      { name: 'Branchless programming', how: 'performance-critical code turns conditionals into arithmetic so the predictor has no branch to miss' },
    ],
    echo: (
      <>
        Speculation is a close cousin of caching. Both spend cheap resources on a bet about the near future: a{' '}
        <T k="cache">cache</T> bets you will ask for the same data again, and a predictor bets a branch goes the way it went
        before. Good bets are why computers feel fast.
      </>
    ),
  },
  'tlb-toll': {
    setting: (
      <>
        Programs never touch raw physical RAM directly. Each gets its own private address space, and the hardware translates
        every lookup through <T k="virtualmemory">virtual memory</T> before fetching a byte. A small cache called the TLB
        keeps recent translations instant, though it only covers a few megabytes. Outgrow that reach and every access pays a
        translation toll on top of the fetch, a cliff the data <T k="cpucache">caches</T> cannot hide.
      </>
    ),
    meetIt: [
      { name: 'Huge pages (2 MB / 1 GB)', how: 'databases and JVMs enable them to stretch TLB reach so large heaps stop paying translation tolls' },
      { name: '"The box started swapping"', how: 'the swap cliff in real life: once pages spill to disk, every touch triggers a fault and latency collapses' },
      { name: 'mmap / page faults', how: 'lazily mapping a file means the first touch on each page pays the translate-and-load hit' },
    ],
  },
  'false-sharing': {
    setting: (
      <>
        Multicore chips promised that adding <T k="core">cores</T> would add throughput, yet cores exchange memory a full
        64-byte <T k="cacheline">cache line</T> at a time. Put two busy variables in the same line and two cores end up
        fighting over ownership even though they never touch each other's data, quietly turning your "parallel" code back
        into a single-file line.
      </>
    ),
    meetIt: [
      { name: 'Java @Contended / Go padding', how: 'runtimes and hot data structures pad fields to a full cache line specifically to avoid this collision' },
      { name: 'Striped counters (LongAdder)', how: 'give each core its own slot on a separate line, then sum the slots only when someone reads the total' },
      { name: 'Any "why won\'t it scale?" profile', how: 'flat throughput as core count rises, paired with climbing coherence-miss counters, is the giveaway' },
    ],
    echo: (
      <>
        This is the coherence tax caches quietly charge. For the same reason a <T k="replica">replica</T> has to stay
        aligned with its primary, a CPU core needs permission before writing a line another core holds. Every copy, on
        every floor, has to be kept honest.
      </>
    ),
  },
}
