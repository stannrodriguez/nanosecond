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
        Before you can size anything, you need a body-feel for the latency ladder — the nanoseconds-to-milliseconds spread
        between a CPU cache hit, a RAM fetch, a disk read, and a <T k="request">request</T> that crosses an ocean. That spread
        isn't engineering sloppiness; it's geometry. Light covers 30 cm per nanosecond and nothing signals faster, so{' '}
        <i>where data sits</i> puts a hard floor under how fast anyone can answer. Half of systems design is moving data closer
        before it's asked for.
      </>
    ),
    meetIt: [
      { name: 'CDNs (Cloudflare, CloudFront)', how: <>a business built on geometry: copy content near people, because nobody can make light faster — that's the whole <T k="cdn">CDN</T> pitch</> },
      { name: 'AWS regions', how: '"which region?" really asks how many milliseconds of light-travel your users will tolerate' },
      { name: 'Redis', how: 'answers from RAM specifically to stay on the short rungs of this ladder' },
    ],
    echo: 'The ladder is the whole stack read as distances: L1 to DRAM to disk to cross-region — each rung is just the next floor down (or up), at the end of a longer wire.',
  },
  disk: {
    setting: (
      <>
        A database's speed is mostly a story about where its bytes land. Spinning disks still hold the world's cheap bytes, and
        they have a split personality: stream in order and they're respectable; jump around and they collapse to ~120 operations
        a second, a 1000× penalty enforced by moving metal. Half of storage engineering — the <T k="wal">WAL</T>,{' '}
        <T k="lsm">LSM</T> engines, every <T k="index">index</T> — is scheming to turn random access into sequential.
      </>
    ),
    meetIt: [
      { name: 'Kafka', how: 'an append-only log that never seeks — sequential physics sold as a product' },
      { name: 'PostgreSQL', how: <>commits hit the sequential <T k="wal">write-ahead log</T> first, so the random page work can wait</> },
      { name: 'RocksDB / Cassandra', how: 'LSM engines that batch random writes into sequential flushes (toy 09 races them)' },
    ],
    echo: "Batching to dodge per-item cost is every floor's move: 64-byte cache lines, 4 KB pages, network packets, replication streams — never move one thing when the trip costs more than the cargo.",
  },
  dram: {
    setting: (
      <>
        Your data has exactly two kinds of home: fast-and-forgetful, or slow-and-<T k="durable">durable</T>. RAM is the first
        kind — each bit is a leaking capacitor beside the CPU, readable in ~100 ns and gone moments after power blinks. That
        mortality, not just the speed, is the real dividing line: it's why a <T k="cache">cache</T> is allowed to forget, why a
        database won't say "saved" until disk has the bytes, and why "we keep it in memory" is a durability decision someone
        should make on purpose.
      </>
    ),
    meetIt: [
      { name: 'Redis / memcached', how: 'RAM speed sold as a service — with volatility as the fine print' },
      { name: 'PostgreSQL fsync', how: 'refuses to say "committed" until the bytes survive on disk, not just in RAM' },
      { name: 'Every cache-fleet restart', how: 'a reboot empties RAM, and the database downstream meets every miss at once' },
    ],
  },
  queue: {
    setting: (
      <>
        Every box in an architecture — app server, database, disk, load balancer — is secretly the same object: a server with a
        waiting line. Queueing theory has one cruel result: as <T k="util">utilization</T> climbs toward 100%, waiting doesn't
        rise, it <i>explodes</i>, long before the machine is "full". That's why scale triggers and{' '}
        <T k="autoscaling">autoscaling</T> targets cluster around 70–80%, and why <T k="p99">p99</T> melts while the CPU graph
        still looks reasonable.
      </>
    ),
    meetIt: [
      { name: 'Kubernetes HPA / AWS Auto Scaling', how: 'default CPU targets sit near 70% to keep you left of the knee' },
      { name: 'PostgreSQL under load', how: '"CPU at 90% and latency tripled" is this curve, live in production' },
      { name: 'Load balancers', how: <>spreading requests is really buying lower <T k="util">utilization</T> per server</> },
    ],
    echo: 'Every floor rediscovered the waiting line: instruction buffers in the chip, run queues in the OS, connection pools at the database, Kafka between services — and the knee travels with it.',
  },
  hotpartition: {
    setting: (
      <>
        When one machine can't take the writes, stores like DynamoDB and Cassandra split data across nodes by hashing a
        partition key — a <T k="shard">shard</T> per hash range. The hash spreads <i>keys</i> beautifully and <i>traffic</i> not
        at all: if everyone writes the same key this second ("now", the viral post, the big tenant), one node eats 100% while
        its neighbors idle — a <T k="hotpartition">hot partition</T>. Partition-key choice is a day-one decision with year-three
        consequences.
      </>
    ),
    meetIt: [
      { name: 'DynamoDB', how: 'per-partition write caps (~1,000/s) turn one hot key into a famous pager' },
      { name: 'Kafka', how: 'one hot partition pins one consumer at 100% while the rest of the group naps' },
      { name: 'Cassandra / Bigtable', how: 'timestamp-shaped row keys are the classic self-inflicted hotspot' },
    ],
  },
  replag: {
    setting: (
      <>
        Most systems read far more than they write, so the first scaling move is a <T k="replica">read replica</T>: a live copy
        that answers reads. But replication is a stream the copy must keep up with, not a mirror — every replica lives slightly
        in the past, and under write pressure "slightly" grows into real <T k="replag">lag</T>. The classic casualty is{' '}
        <T k="readyourwrites">read-your-writes</T>: you post a comment, the page refreshes from a stale copy, and your comment
        is "gone".
      </>
    ),
    meetIt: [
      { name: 'RDS / Aurora read replicas', how: 'the checkbox that adds read capacity and replication lag in the same click' },
      { name: 'PostgreSQL streaming replication', how: <>the primary ships its <T k="wal">WAL</T>; replicas replay it as fast as they can</> },
      { name: 'Rails / Django read–write splitting', how: 'frameworks pin your reads to the primary right after you write — this bug is that common' },
    ],
    echo: 'Every copy on every floor drifts: CPU caches need coherence protocols for the same reason replicas need care — a copy is always a bet that the original will hold still.',
  },
  pipe: {
    setting: (
      <>
        A link's advertised bandwidth is a ceiling, not a promise. TCP will only launch one window of unacknowledged bytes
        before it stops to hear back, so a single stream's real <T k="throughput">throughput</T> is window ÷ round-trip —
        distance, not copper, becomes the limit. That's the bandwidth-delay product: the fatter and longer the pipe, the more of
        it sits empty unless someone deliberately keeps it full.
      </>
    ),
    meetIt: [
      { name: 'TCP window scaling', how: "a protocol extension that exists because the original tiny windows drowned on fast long links" },
      { name: 'S3 multipart / aria2', how: 'parallel streams are the standard workaround: many windows in flight at once' },
      { name: 'BBR', how: "Google's congestion control estimates the bandwidth-delay product instead of probing for loss" },
    ],
    echo: "Throughput = in-flight ÷ round-trip is Little's law, and it governs every floor: TCP windows here, outstanding cache misses inside your CPU, replication streams between cities.",
  },
  consensus: {
    setting: (
      <>
        Some facts can't be allowed to fork: who is the <T k="leader">leader</T>, who holds the lock, did this payment commit.
        For those, a <T k="quorum">quorum</T> of machines must agree <i>before</i> anyone answers, and agreement is priced in
        round trips. The protocol is fixed; the map is not — voters in one datacenter agree in about a millisecond, voters
        spread across continents pay the planet tax on every single write. This is the <T k="cap">CAP</T> tradeoff with a
        stopwatch running.
      </>
    ),
    meetIt: [
      { name: 'etcd / ZooKeeper', how: "Kubernetes' and Kafka's control planes — kept inside one datacenter so agreement stays ~1 ms" },
      { name: 'Google Spanner', how: 'pays cross-continent round trips for globally strong writes, and owns the latency honestly' },
      { name: 'Cassandra QUORUM', how: 'a per-query dial trading agreement strength against round trips' },
    ],
  },
  lsmbtree: {
    setting: (
      <>
        A storage engine is an opinion about where bytes go. The <T k="btree">B-tree</T> files every row in its sorted place at
        write time — reads stay cheap, but each write becomes a random disk touch. The <T k="lsm">LSM</T> refuses to seek: it
        appends now and sorts later, buying huge write throughput on credit that reads and compaction repay. Neither is
        "better" — each is a bet on your read/write mix, which is why both run half the internet.
      </>
    ),
    meetIt: [
      { name: 'PostgreSQL / MySQL (InnoDB)', how: 'B-tree families — built for the common case where reads dominate' },
      { name: 'RocksDB / LevelDB', how: 'the LSM inside CockroachDB, TiDB, Kafka Streams, and half of modern infra' },
      { name: 'Cassandra / HBase', how: 'LSM at cluster scale: swallow write firehoses, budget for compaction' },
    ],
  },
  connpool: {
    setting: (
      <>
        To a database, a connection is real memory and scheduling work — a few hundred is already a crowd. To an app fleet,
        connections feel free, and serverless made them multiply overnight. The adapter is the{' '}
        <T k="connpool">connection pool</T>: thousands of clients time-share a small fixed set of connections, which quietly
        creates a second server with its own <T k="backlog">queue</T> and its own knee. "The database is slow" often means the
        wait in <i>front</i> of it.
      </>
    ),
    meetIt: [
      { name: 'PgBouncer', how: 'so essential it ships next to practically every serious Postgres deployment' },
      { name: 'HikariCP', how: "the JVM's default pool — with an entire folk culture around sizing it" },
      { name: 'AWS RDS Proxy', how: 'exists because Lambda multiplied database clients by a thousand overnight' },
    ],
  },
  backpressure: {
    setting: (
      <>
        Chain two stages and arithmetic takes over: if work arrives faster than the slow stage drains, the difference has to go{' '}
        <i>somewhere</i>. A buffer only buys time. The real menu has three items — block the producer (
        <T k="backpressure">backpressure</T>), shed work on purpose (<T k="ratelimit">rate limiting</T>), or let the buffer grow
        until memory ends the debate. Mature systems aren't the ones that never overload; they're the ones that chose their
        answer in advance.
      </>
    ),
    meetIt: [
      { name: 'TCP flow control', how: 'backpressure baked into the internet: the receiver window blocks the sender' },
      { name: 'Kafka consumer lag', how: <>the buffer made visible — a <T k="backlog">backlog</T> on a dashboard with an alarm attached</> },
      { name: 'Envoy / NGINX rate limits', how: 'choosing to drop a little now rather than everything later' },
    ],
    echo: 'Overload has the same three answers on every floor: TCP receiver windows block, load shedders drop, unbounded buffers crash — only the names change between floors.',
  },
  stampede: {
    setting: (
      <>
        A <T k="cache">cache</T> works so well that the database behind it forgets what full traffic feels like. But cached
        answers rot, and the standard fix — a <T k="ttl">TTL</T> — synchronizes the forgetting: the instant a hot key expires,
        every in-flight miss goes to the database <i>at the same moment</i>. That's the <T k="stampede">stampede</T> (the
        dogpile): a database sized for a 1% miss rate meeting 100% of the traffic for one long, expensive moment.
      </>
    ),
    meetIt: [
      { name: 'Redis / memcached', how: 'home of dogpile locks, jittered TTLs, and probabilistic early refresh' },
      { name: "Facebook's memcache leases", how: 'the canonical fix at scale: one miss recomputes, everyone else briefly waits' },
      { name: 'Fastly / Varnish', how: 'request coalescing collapses a thousand identical misses into one origin fetch' },
    ],
  },
  cachecliff: {
    setting: (
      <>
        Your CPU is thousands of times faster than the RAM it reads from, so it hides the gap behind a stack of small, fast
        caches — L1, L2, L3, each bigger and slower than the last. Whether your data fits in one of them decides your program's
        speed far more than how many instructions it runs. And the CPU always moves memory a 64-byte{' '}
        <T k="cacheline">cache line</T> at a time, so data you use together should sit together — that's{' '}
        <T k="locality">locality</T>, the gap between a loop that flies and the identical loop that crawls.
      </>
    ),
    meetIt: [
      { name: 'Arrays vs linked lists', how: 'a contiguous array streams whole cache lines; chasing a linked list misses on nearly every node' },
      { name: 'Column stores (Parquet, ClickHouse)', how: 'lay each column out contiguously so a scan touches only the bytes it needs, all cache-line-friendly' },
      { name: 'Data-oriented design (game engines)', how: 'struct-of-arrays over array-of-structs so the hot fields pack into the lines the CPU actually loads' },
    ],
    echo: <>L1 is to DRAM what Redis is to Postgres what a CDN edge is to your origin — the same bet (small, fast, nearby, allowed to forget) placed on three different floors of the stack. Master one <T k="cache">cache</T> and you've met them all.</>,
  },
  'instruction-loop': {
    setting: (
      <>
        Every program you have ever run is, at the bottom, this loop: the CPU{' '}
        <T k="pipeline">fetches an instruction, decodes it, executes it</T>, and does it again — billions of times a second. A
        pipeline overlaps those steps like an assembly line so a finished result pops out every clock tick. It is the engine
        under every other floor of the stack; everything above is just arranging which instructions to run.
      </>
    ),
    meetIt: [
      { name: 'Every CPU (x86, ARM, RISC-V)', how: 'the fetch-decode-execute pipeline is the common shape beneath every instruction set' },
      { name: 'perf / VTune counters', how: 'IPC — instructions per cycle — is the headline profiler number, a direct read on how full the pipeline runs' },
      { name: 'GPUs', how: 'trade one deep clever pipeline for thousands of simple ones — the same loop, massively parallel' },
    ],
  },
  'heat-wall': {
    setting: (
      <>
        A faster clock is a hotter chip — power climbs like frequency cubed — so cooling puts a hard ceiling near ~4 GHz that
        has barely moved in twenty years. The escape was never a faster core; it was more of them. This wall is the reason your
        laptop has many <T k="core">cores</T> instead of one blazing one, and why parallelism stopped being optional.
      </>
    ),
    meetIt: [
      { name: 'The multicore era (~2005–)', how: 'the industry-wide pivot from selling GHz to selling core count happened the day this wall was hit' },
      { name: 'Laptop / phone thermal throttling', how: 'the same curve live — sustained load heats the die and the clock drops to stay inside budget' },
      { name: 'Data-center power bills', how: 'performance per watt, not per GHz, is what a real fleet is optimized against' },
    ],
  },
  'branch-predictor': {
    setting: (
      <>
        To keep its pipeline full, a CPU cannot wait to learn which way an <span className="mono">if</span> goes — it{' '}
        <T k="speculation">guesses and runs ahead</T>. Right guesses are free; wrong ones flush the pipeline and cost ~15
        cycles. The predictor is uncanny on predictable data and helpless on random data — which is why the very same code can
        run several times faster on sorted input.
      </>
    ),
    meetIt: [
      { name: 'The famous “sorted array” speedup', how: 'the top-voted Stack Overflow question is exactly this — sort first and the branchy loop flies' },
      { name: 'Spectre / Meltdown', how: 'speculative execution left traces in the cache — a whole class of security holes born of this trick' },
      { name: 'Branchless programming', how: 'hot code rewrites if into arithmetic precisely to deny the predictor a branch to miss' },
    ],
    echo: (
      <>
        Speculation is caching's cousin: both spend a cheap resource on a bet about the near future — a <T k="cache">cache</T>{' '}
        bets you'll ask again, a predictor bets the branch goes the way it went last time. Right bets are most of why computers
        feel fast.
      </>
    ),
  },
}
