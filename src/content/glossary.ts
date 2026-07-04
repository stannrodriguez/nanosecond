// Global glossary — every dotted <Term> everywhere resolves here.
// Contract (docs/content-pipeline.md §1): def is 2–4 plain-language sentences,
// always contains the WHY, ends with the practical consequence. Never circular.
// v1 target is ~60 entries (spec 020); this is the seed set from the prototypes.

export interface GlossaryEntry {
  name: string
  def: string
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  request: {
    name: 'Request',
    def: "One message from a client ('give me this page', 'save this comment') and the reply to it. Everything in systems design is counting requests, pricing what each one costs, and deciding which machine handles it.",
  },
  read: {
    name: 'Read',
    def: "A request that only LOOKS AT data ('show me the post'). Reads are the easy kind: the answer can be copied to many places (caches, replicas) and served from any of them, because looking doesn't change anything.",
  },
  write: {
    name: 'Write',
    def: "A request that CHANGES data ('save my comment', 'record this GPS ping'). Writes are the hard kind: they must survive a crash (hit disk, not just RAM), and every copy of the data must eventually agree about them. You can't cache your way out of writes.",
  },
  rps: {
    name: 'RPS / QPS / TPS',
    def: "Requests, Queries, or Transactions Per Second — the pulse rate of a system. Same idea, different organs: RPS at the web tier, QPS at the database, TPS when writes/transactions are what's counted.",
  },
  iot: {
    name: 'IoT device',
    def: "'Internet of Things' — a small physical gadget with a network connection: a GPS tracker in a truck, a smart thermostat, a factory sensor. No human behind it; it generates traffic on a timer, relentlessly, 24/7.",
  },
  phonehome: {
    name: 'Phones home',
    def: "The device initiates contact with YOUR servers on a schedule ('here's my location, again') — you never call it. So traffic volume = number of devices × how often each reports. Predictable, machine-like, and almost all writes: the device has data to deposit and nothing to ask.",
  },
  burst: {
    name: 'Burst / spike',
    def: "A short period where traffic jumps far above normal. Classic causes: everyone acts at once (sale opens at noon, all trucks start at 8am), or a 'thundering herd' — a network blip disconnects thousands of devices and they ALL reconnect and resend at the same moment.",
  },
  cache: {
    name: 'Cache',
    def: "A small, very fast memory (RAM) holding copies of recently-used answers, sitting in front of the database. If the answer is there (a 'hit'), you skip the database entirely — ~1ms instead of ~5–50ms, and 10× the capacity per dollar. Only helps reads.",
  },
  hitrate: {
    name: 'Hit rate',
    def: "The % of lookups the cache can answer itself. 80% hit rate = only 20% of reads reach the database. Driven by how often people ask for the SAME thing: a viral post → 99%+; random user profiles → much lower. This one percentage decides your database's fate.",
  },
  replica: {
    name: 'Read replica',
    def: 'A live copy of the database that receives every write from the primary and serves reads. Scaling reads = photocopying the data. Each replica adds ~20k reads/s. The catch: copies lag slightly behind — a just-written comment might not appear on a replica for a moment.',
  },
  shard: {
    name: 'Shard',
    def: "Splitting data across multiple independent databases — users A–M on box 1, N–Z on box 2. It's the only way to scale WRITES (copies don't help; every copy must apply every write). Powerful and painful: queries crossing shards get hard, so it's the last resort, not the first.",
  },
  queue: {
    name: 'Queue',
    def: "A durable waiting line (Kafka, SQS) between 'accept the write' and 'process the write'. The app appends the message in ~1ms and answers 'got it!' — workers drain the line into the database at a pace the database can survive. Absorbs bursts by buying TIME instead of capacity.",
  },
  worker: {
    name: 'Worker',
    def: 'A background process that pulls messages off the queue and does the real work (write to DB, resize the image). Not serving users directly, so it can run steadily at its own pace. More workers = faster drain.',
  },
  backlog: {
    name: 'Backlog / lag',
    def: 'Messages waiting in the queue because they arrive faster than workers drain them. A backlog during a burst is the queue doing its job. A backlog that never shrinks means your STEADY rate exceeds drain capacity — the queue is just delaying the funeral.',
  },
  p99: {
    name: 'p99 latency',
    def: 'The response time your 99th-slowest-of-100 users experiences. Averages lie — 99 fast requests hide 1 awful one. If p99 is 2 seconds, then 1 in every 100 clicks feels broken, and your heaviest users (who click most) hit it daily. Interviewers and SLAs live at p99.',
  },
  sla: {
    name: 'SLA',
    def: "Service Level Agreement — the promise you're held to: 'p99 under 200ms, 99.9% of requests succeed.' Your design isn't done when it works; it's done when it keeps the promise at peak, at acceptable cost.",
  },
  durable: {
    name: 'Durability (fsync)',
    def: "A write is durable when it's physically on disk and survives a power cut. Forcing bytes to disk (fsync) is slow compared to RAM — this is THE reason a database handles ~10k writes/s but ~10× more reads/s. Reads live in memory; writes must touch the truth.",
  },
  lb: {
    name: 'Load balancer',
    def: 'The front-door traffic cop: takes every incoming request and spreads them across your app servers. Lets you have 6 interchangeable servers behind one address, so any one can die without anyone noticing. Adds ~1ms.',
  },
  appserver: {
    name: 'App server',
    def: 'The machine running YOUR code: checks the login, validates input, asks cache/DB for data, builds the response. Stateless (remembers nothing between requests), which is why you can add more like lego bricks. ~10k simple requests/s each.',
  },
  util: {
    name: 'Utilization',
    def: "How busy a component is: load ÷ capacity. The trap: waiting time explodes near full — at 95% busy, queueing delay is ~10× worse than at 50%, because random arrivals clump and there's no slack to absorb a clump. Healthy systems cruise at 60–70%. (Play THE QUEUE toy in the Intuition Lab.)",
  },
  readpct: {
    name: 'Read/write mix',
    def: 'What fraction of traffic is reads vs writes. THE first question to ask about any system — it decides the whole architecture. Read-heavy (social feeds, blogs: 90%+ reads) → caches and replicas. Write-heavy (telemetry, logging, chat ingest) → queues and shards. Different problems, different tools.',
  },
  errorbudget: {
    name: 'Error budget',
    def: "A real SRE concept: the amount of failure your users forgive before trust collapses, written down as a number (99.9% success = 0.1% budget). Spend it on launches and experiments on purpose, or lose it to outages by accident. When it's gone, you stop shipping and fix reliability.",
  },
  idempotent: {
    name: 'Idempotent',
    def: "An operation that is safe to repeat: doing it twice has the same effect as doing it once ('set status = PAID' vs 'add $10'). At-least-once delivery guarantees occasional duplicates, so retries are only safe when every side effect is idempotent — usually via a unique operation ID the receiver remembers.",
  },
  stampede: {
    name: 'Cache stampede',
    def: "A hot key expires (or a cache restarts) and thousands of concurrent misses race to recompute the same answer against the database at once — the cache's absence IS the load spike. Defenses: dogpile locks (one flier recomputes, the rest wait), staggered TTLs with jitter, and serving stale content while refreshing.",
  },
}

export type GlossaryKey = keyof typeof GLOSSARY
