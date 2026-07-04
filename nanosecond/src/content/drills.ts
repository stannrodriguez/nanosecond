// Drill bank (docs/content-pipeline.md §5). Seed set of 8 from the prototype;
// spec 040 grows this to 60 with Leitner-box scheduling.

export interface Drill {
  q: string
  unit: string
  ans: number
  /** log10 slider bounds */
  loExp: number
  hiExp: number
  derive: [string, string, string]
  /** ids into src/content/numbers.ts */
  numbersRefs: string[]
}

export const DRILLS: Drill[] = [
  {
    q: 'One modern app server (16 cores) serving a simple JSON API over HTTP. How many requests/second before it saturates?',
    unit: 'req/s',
    ans: 10000,
    loExp: 2,
    hiExp: 6,
    derive: [
      'A simple request costs ~1–2 ms of CPU (parse, validate, serialize).',
      'One core: 1000 ms ÷ 1.5 ms ≈ 700 req/s.',
      '16 cores × 700 ≈ 11k — call it 10k req/s per box.',
    ],
    numbersRefs: ['app-server-rps'],
  },
  {
    q: 'A single Postgres primary on good hardware, indexed point reads, working set cached in RAM. Reads per second?',
    unit: 'reads/s',
    ans: 30000,
    loExp: 2,
    hiExp: 6.5,
    derive: [
      'A cached point read is a few B-tree hops in RAM + protocol overhead ≈ 0.1–0.5 ms of work.',
      'Across cores with connection overhead: tens of thousands/s — 20–50k is the honest band.',
      "Uncached (touching disk) divides this by 10×: now you're paying SSD latency per read.",
    ],
    numbersRefs: ['pg-reads'],
  },
  {
    q: 'Same Postgres primary — durable WRITES per second (each must hit the write-ahead log)?',
    unit: 'writes/s',
    ans: 8000,
    loExp: 2,
    hiExp: 5.5,
    derive: [
      "Every commit must fsync the write-ahead log — you're bounded by sequential SSD flushes, not CPU.",
      'Group commit batches many transactions per flush, buying you thousands, not millions.',
      '5–10k TPS is the classic single-primary ceiling. Past it: shard, or buffer through a queue.',
    ],
    numbersRefs: ['pg-writes'],
  },
  {
    q: 'One Redis node (single-threaded core doing the work). GET operations per second?',
    unit: 'ops/s',
    ans: 100000,
    loExp: 3,
    hiExp: 7,
    derive: [
      'A GET is a hash lookup in RAM: ~1 µs of actual work → in theory 1M/s per core.',
      'Network syscalls eat most of it; pipelining wins some back.',
      "~100k ops/s per node is the planning number — it's 10× a database because it skips the disk and the query engine entirely.",
    ],
    numbersRefs: ['redis-ops'],
  },
  {
    q: 'One Kafka broker on modern hardware. Messages per second (small ~1 KB messages)?',
    unit: 'msgs/s',
    ans: 1000000,
    loExp: 4,
    hiExp: 7.5,
    derive: [
      "Kafka's trick: it ONLY appends sequentially — remember the HDD rung: sequential I/O is ~1000× cheaper than random.",
      '1 KB × 1M/s = 1 GB/s, within reach of NVMe sequential bandwidth.',
      "~1M msgs/s per broker. It's fast because it refuses to do random I/O, not because of magic.",
    ],
    numbersRefs: ['kafka-msgs'],
  },
  {
    q: '10 million daily active users, each writing 5 events of 1 KB per day. Storage accumulated per day?',
    unit: 'bytes/day',
    ans: 5e10,
    loExp: 8,
    hiExp: 13,
    derive: [
      '10M × 5 × 1 KB = 50M KB = 50 GB/day.',
      'Sanity check the shape: users × actions × size. Interviewers care that you decompose, not that you nail digits.',
      '≈ 18 TB/year — fits a handful of drives. Storage is rarely the bottleneck; access patterns are.',
    ],
    numbersRefs: ['req-per-day-rule'],
  },
  {
    q: 'Those 10M DAU each make 50 requests/day. Average requests per second — and know your peak multiplier.',
    unit: 'req/s (average)',
    ans: 5800,
    loExp: 2,
    hiExp: 6,
    derive: [
      '10M × 50 = 500M requests/day ÷ 86,400 s ≈ 5,800 req/s average.',
      'Shortcut worth memorizing: 1M/day ≈ 12/s.',
      'Peak is 2–5× average for consumer traffic. Design for ~15–25k req/s, quote both numbers.',
    ],
    numbersRefs: ['req-per-day-rule', 'peak-multiplier'],
  },
  {
    q: 'Round-trip time between US East and US West datacenters?',
    unit: 'ms',
    ans: 70,
    loExp: 0,
    hiExp: 3.5,
    derive: [
      '~4,700 km of fiber, light at 200,000 km/s in glass → ~24 ms one way, ~48 ms floor.',
      "Real routing isn't straight: 60–80 ms in practice.",
      'Derived from the speed of light — which is why you can trust it forever.',
    ],
    numbersRefs: ['cross-region-rtt'],
  },
]
