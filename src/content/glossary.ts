// Global glossary — every dotted <Term> everywhere resolves here.
// Contract (docs/content-pipeline.md §1): def is 2–4 plain-language sentences,
// always contains the WHY, ends with the practical consequence. Never circular.
// v1 target is ~60 entries (spec 020); this is the seed set from the prototypes.

export interface GlossaryEntry {
  name: string
  def: string
  /* ---- Speakable fields (spec 065, contract in docs/content-pipeline.md §1).
     Optional today: authored for the Networking group, which the schema test
     holds to all three. `def` teaches the term; these three teach how to SAY
     it out loud in an interview. */
  /** ONE interview-ready sentence in the player's voice. If you can't say it
   *  in a breath, the entry is wrong. */
  say?: string
  /** When to pick it — the situations that make this the right answer. */
  reachFor?: string
  /** The wrong sentence people say, and what to say instead. */
  trap?: string
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  request: {
    name: 'Request',
    def: "A single client-to-server exchange: one message asking for work ('give me this page', 'save this comment') and the reply that answers it. Capacity planning starts by counting them: how many arrive per second, what each one costs to serve, and which machine serves it.",
  },
  read: {
    name: 'Read',
    def: "A request that returns stored data without modifying it (loading a post). Because the result doesn't depend on who asks or when, it can be copied to caches and replicas and served from whichever one is closest. Read capacity therefore scales by adding copies.",
  },
  write: {
    name: 'Write',
    def: 'A request that modifies stored data (saving a comment, recording a GPS ping). A write is not complete when it lands in RAM — it has to reach durable storage, and every replica has to converge on the same value. Both costs grow with the number of copies you keep, which is why adding replicas speeds up reads and slows down writes.',
  },
  rps: {
    name: 'RPS / QPS / TPS',
    def: 'Requests, Queries, or Transactions Per Second — the rate a component handles demand, measured at its own boundary: RPS counts HTTP requests at the web tier, QPS queries at the database, TPS transactions where writes are what matters. One user action can fan out into several queries, so the three rates differ for the same traffic.',
  },
  iot: {
    name: 'IoT device',
    def: "'Internet of Things' — a small physical device with a network connection (a GPS tracker in a truck, a smart thermostat, a factory sensor). It generates traffic on a timer rather than on human action, so load runs around the clock and grows with the device count, not with user engagement.",
  },
  phonehome: {
    name: 'Phones home',
    def: "The device initiates contact with the server on a schedule ('here's my location, again'); the server never calls the device. Traffic volume is therefore the number of devices times each one's reporting rate, and it is almost all writes — the device has data to deposit and nothing to ask.",
  },
  burst: {
    name: 'Burst / spike',
    def: "A short period where traffic jumps far above its steady rate. The common causes are synchronized action — a sale opens at noon, every truck in a fleet starts at 8am — and a 'thundering herd', where a network blip disconnects thousands of devices that then reconnect and resend at the same moment. Capacity has to be planned against the burst peak, not the average.",
  },
  cache: {
    name: 'Cache',
    def: "A small, fast store (RAM) holding copies of recently-used answers in front of the database. A lookup that finds its answer there (a 'hit') skips the database entirely — ~1ms instead of ~5–50ms, at roughly 10× the capacity per dollar. It accelerates only reads: a write still has to reach the database.",
  },
  hitrate: {
    name: 'Hit rate',
    def: 'The percentage of lookups the cache answers itself; an 80% hit rate means only 20% of reads reach the database. It is driven by how concentrated requests are on the same keys: a viral post read by everyone can exceed 99%, while random user-profile lookups sit far lower. The database only has to survive the miss traffic, so this percentage sets its required read capacity.',
  },
  virtualmemory: {
    name: 'Virtual memory',
    def: 'Per-process address translation: each program addresses its own private, contiguous memory space, and the hardware maps every access to a physical location one 4 KB page at a time. The mapping is what lets many programs share one RAM safely. The mappings themselves must be looked up on every access — the CPU caches them in the TLB — so "it fits in RAM" only performs well when the working set also fits in the TLB\'s reach.',
  },
  pipeline: {
    name: 'Pipeline',
    def: "Overlapped instruction execution: while one instruction is being decoded, the next is already being fetched, so the core retires roughly one instruction per clock tick instead of waiting for each to finish. To keep the overlap going, the core must guess which instruction follows every branch — and a wrong guess flushes the partially finished work.",
  },
  speculation: {
    name: 'Speculative execution',
    def: "The CPU running instructions before it knows they are needed — guessing which way a branch goes and executing ahead of the answer. A correct guess costs nothing; a wrong one discards the speculative work. Almost all modern CPU performance depends on it, and its side effects are what leaked in Spectre.",
  },
  core: {
    name: 'Core',
    def: "One independent processor on a chip, with its own pipeline, able to run a program by itself. When heat capped clock speeds near ~4 GHz, chipmakers stopped making a single core faster and started adding cores instead. Single-thread speed has been roughly flat since, so further speedups have to come from using several cores at once.",
  },
  cacheline: {
    name: 'Cache line',
    def: "The fixed 64-byte block the CPU moves between RAM and cache — it never fetches a lone byte. Touching one byte brings its 63 neighbours along at no extra cost, so fields that are accessed together benefit from being stored together. This is why a contiguous array can be an order of magnitude faster than a linked list of the same fields: each line delivers eight useful values from the array and one from the list.",
  },
  cpucache: {
    name: 'CPU cache (L1/L2/L3)',
    def: "The staircase of small, fast memories on the chip — L1, L2, L3 — holding recently-used data so the core rarely pays the full ~100 ns trip to RAM. Each level trades capacity for closeness: roughly 1 ns for L1, 4 ns for L2, 12 ns for L3. Whether the working set fits a level often moves performance more than any code change — miss every level and the same loop runs ~100× slower.",
  },
  coherence: {
    name: 'Cache coherence',
    def: "The hardware protocol that keeps every core's private cache telling one story: before a core may write a memory location, it must take exclusive ownership of that location's whole 64-byte cache line, pulling it out of every other core's cache. Correctness is never lost — but two cores writing the same line take turns, even when they touch different bytes of it. That forced turn-taking is why adding cores can slow a perfectly parallel loop (false sharing).",
  },
  locality: {
    name: 'Locality',
    def: "The two access patterns that make caches work. Temporal locality is reusing the same data soon, while it is still cached; spatial locality is using data adjacent to what was just touched, because it arrived on the same cache line. Code with good locality can run 10× faster than identical code without it — same instructions, same data, different memory layout.",
  },
  replica: {
    name: 'Read replica',
    def: "A live copy of the database that receives every write from the primary and serves reads. Each replica adds read capacity — on the order of ~20k reads/s — without touching the write path. The copies lag slightly behind the primary, so a just-written comment may not appear on a replica for a moment.",
    say: "A read replica applies every write from the primary and serves reads, so each one adds read capacity without touching the write path at all.",
    reachFor:
      "Read-heavy workloads with diverse keys that a cache would not concentrate — reporting, browse pages, anything with a long tail.",
    trap: "Wrong: 'add replicas to scale.' Replicas scale reads only, and every copy still applies every write. Say 'replicas add read capacity and a failover target, and the write ceiling is exactly where it was.'",
  },
  shard: {
    name: 'Shard',
    def: "Splitting data across multiple independent databases — users A–M on box 1, N–Z on box 2. It is how write capacity scales: replicas don't help writes, because every copy must apply every write, while each shard takes only its own share. The cost is that queries crossing shards become joins across machines, so sharding usually comes after caching and replication are exhausted.",
    say: "Sharding splits data across independent databases so each one takes only its share of the writes, which is the single thing replicas cannot do for you.",
    reachFor:
      "A write rate genuinely past one primary's ceiling, or a dataset past one node's disk — after caching and replicas are exhausted.",
    trap: "Wrong: 'we'll shard so it scales.' Sharding buys write capacity and costs cross-shard queries, distributed transactions, and a rebalancing project. Say 'at this many writes a second I'm past one primary, so I shard on a key that spreads' — with the number said out loud.",
  },
  queue: {
    name: 'Queue',
    def: "A durable waiting line (Kafka, SQS) between accepting a write and processing it. The app appends a message in ~1ms and replies immediately; workers drain the line into the database at a rate the database can sustain. A burst then costs processing delay instead of capacity — the messages wait rather than overload the database.",
    say: "A queue is a durable waiting line between accepting a write and processing it, so a burst costs processing delay instead of costing you capacity.",
    reachFor:
      "Work that can be asynchronous — email, image resizing, report generation — and bursts you would rather absorb than provision for.",
    trap: "Wrong: 'we'll add a queue so it scales.' A queue smooths bursts; it does not raise throughput. Say 'it absorbs the spike, but if the steady arrival rate exceeds drain capacity the backlog grows forever and we've only delayed the failure.'",
  },
  worker: {
    name: 'Worker',
    def: "A background process that pulls messages off the queue and does the deferred work (writing to the database, resizing the image). It serves no user directly, so it can run steadily at its own pace. Drain rate scales with the number of workers, which makes backlog recovery a provisioning knob rather than a redesign.",
    say: "A worker pulls messages off the queue and does the deferred work at its own pace, which makes drain rate a provisioning knob rather than a redesign.",
    reachFor:
      "Any async pipeline, and any backlog incident where the first question is whether more workers would actually help.",
    trap: "Wrong: 'add workers to clear the backlog.' They help only if the workers are the bottleneck rather than the database behind them. Say 'I'd check what the workers are waiting on first, because doubling them against a saturated database just relocates the queue.'",
  },
  backlog: {
    name: 'Backlog / lag',
    def: "Messages waiting in the queue because they arrive faster than workers drain them. A backlog that grows during a burst and shrinks afterward is the queue absorbing the burst. A backlog that never shrinks means the steady arrival rate exceeds drain capacity — the queue is then only deferring the overload, and either the workers or the downstream bottleneck have to grow.",
    say: "A backlog is messages waiting because they arrive faster than workers drain them — healthy when it shrinks after the burst, terminal when it never does.",
    reachFor:
      "The most diagnostic queue metric there is: it tells you whether you have a burst problem or a capacity problem.",
    trap: "Wrong: 'the queue is deep, add workers.' Depth alone does not say which problem you have. Say 'I'd look at whether the backlog is shrinking — steady growth means arrival rate exceeds drain rate, and no amount of buffering fixes that.'",
  },
  p99: {
    name: 'p99 latency',
    def: "The response time at the 99th percentile — 1 request in 100 is slower than this. An average hides the tail: 99 fast requests can mask 1 that takes 2 seconds, and the heaviest users, who make the most requests, meet the tail most often. SLAs are written at p99 because queueing problems appear there long before they move the average.",
  },
  sla: {
    name: 'SLA',
    def: "Service Level Agreement — a written performance promise: 'p99 under 200ms, 99.9% of requests succeed.' A design meets its SLA only if it keeps the promise at peak load and at acceptable cost, so the SLA, not the demo, is the pass/fail line for an architecture.",
  },
  durable: {
    name: 'Durability (fsync)',
    def: "A write is durable when it is physically on disk and survives a power cut. Forcing bytes to disk (fsync) is orders of magnitude slower than writing to RAM, which is the reason a database handles ~10k writes/s but ~10× more reads/s. Reads can be served from memory; every durable write pays the flush.",
    say: "A write isn't durable until it is physically on disk, and that fsync is exactly why one primary does thousands of writes a second while reads run ten times faster out of memory.",
    reachFor:
      "Any write-throughput ceiling question, and any moment someone proposes writing faster without naming what the flush costs.",
    trap: "Wrong: 'the write is saved once the database returns.' It is saved once the log is fsynced — which is what the return was waiting on, and what a fsync-relaxing config quietly removes. Say 'durability costs a flush per commit, which is what bounds one primary to ~8,000 writes a second.'",
  },
  lb: {
    name: 'Load balancer',
    def: "The component that receives every incoming request and spreads the requests across the app servers. It makes the servers interchangeable behind one address, so any one of them can die or be replaced without clients noticing. It adds ~1ms per request.",
  },
  appserver: {
    name: 'App server',
    def: "The machine running the application code: it checks the login, validates input, asks the cache or database for data, and builds the response. It is stateless — nothing is remembered between requests — which is why capacity scales by adding more of them. One server handles ~10k simple requests/s.",
  },
  util: {
    name: 'Utilization',
    def: "How busy a component is: load ÷ capacity. Waiting time explodes near full — at 95% busy, queueing delay is ~10× worse than at 50%, because random arrivals clump and there is no slack left to absorb a clump. Healthy systems cruise at 60–70% for exactly this reason. (Play THE QUEUE toy in the Lab.)",
  },
  readpct: {
    name: 'Read/write mix',
    def: "What fraction of traffic reads data versus writes it — the first question to ask about any system, because it selects the architecture. Read-heavy traffic (social feeds, blogs: often 90%+ reads) is served by caches and replicas, which multiply read capacity. Write-heavy traffic (telemetry, logging, chat ingest) needs queues and shards, because copies do nothing for writes.",
  },
  errorbudget: {
    name: 'Error budget',
    def: "The amount of failure users tolerate before trust erodes, written down as a number: a 99.9% success target leaves a 0.1% budget. Teams spend it deliberately on launches and experiments, or lose it accidentally to outages; when it runs out, feature work stops until reliability is restored. It converts 'how reliable is enough' from an argument into arithmetic.",
    say: "An error budget writes down the failure users tolerate as a number — a 99.9% target leaves 0.1% to spend — so how-reliable-is-enough becomes arithmetic instead of an argument.",
    reachFor:
      "Reliability-versus-velocity conversations, and justifying the moment feature work should stop.",
    trap: "Wrong: 'we aim for zero downtime.' Zero is unpriced, and each extra nine costs roughly ten times the last. Say 'we target 99.9%, which is 43 minutes a month, and we spend that budget deliberately on launches.'",
  },
  idempotent: {
    name: 'Idempotent',
    def: "An operation that is safe to repeat: doing it twice has the same effect as doing it once ('set status = PAID', unlike 'add $10'). At-least-once delivery guarantees occasional duplicates, so a retried operation is only safe when every side effect is idempotent — usually arranged with a unique operation ID the receiver remembers.",
    say: "An idempotent operation is safe to repeat — set status to PAID rather than add ten dollars — which is what makes retries and at-least-once delivery survivable.",
    reachFor:
      "Every retry path, every queue consumer, every payment endpoint — anywhere a duplicate is a matter of when rather than if.",
    trap: "Wrong: 'we retry on failure.' Retrying a non-idempotent operation double-charges the customer. Say 'the consumer dedupes on an operation id it remembers, so the second delivery has no second effect.'",
  },
  stampede: {
    name: 'Cache stampede',
    def: "A hot key expires (or a cache restarts) and thousands of concurrent misses recompute the same answer against the database at once — the load spike is created by the cache's absence. The standard defenses all break the synchronization: a dogpile lock so one request recomputes while the rest wait, random jitter added to TTLs, and serving stale content while a refresh runs.",
  },
  consistency: {
    name: 'Consistency',
    def: "Whether every reader sees the same data at the same moment. Strong consistency means a read after a write always shows the write, which requires the copies to coordinate before answering — and coordination costs round trips. Eventual consistency answers immediately from whatever a copy has, and the copies converge later. The choice trades latency and availability against staleness, one operation at a time.",
    say: "Strong consistency means a read after a write always shows that write, which requires the copies to coordinate before answering — and coordination is round trips.",
    reachFor:
      "Deciding which operations pay for coordination, and pricing that decision in milliseconds across zones or regions.",
    trap: "Wrong: 'we need the data to be consistent.' Consistency is a spectrum with a price per rung. Say 'this read must see its own write and that one can be a second stale' — naming the operations rather than the system.",
  },
  consensus: {
    name: 'Consensus',
    def: "The protocol family (Raft, Paxos) by which several machines agree on one value — who is leader, what order writes happened in — even while some of them crash. Agreement takes multiple round trips among a majority of nodes, which is why a strongly-consistent cross-region write costs ~150ms: two rounds × ~70ms of geography. Consensus prices are paid only where two conflicting truths would be catastrophic.",
    say: "Consensus is how several machines agree on one value — who leads, what order writes happened in — while some of them are crashed, and agreement costs round trips among a majority.",
    reachFor:
      "Leader election, distributed locks, and anywhere two conflicting truths would be catastrophic rather than merely untidy.",
    trap: "Wrong: 'we'll use consensus for consistency.' It is expensive — one cross-region round trip is ~70 ms and a write needs more than one. Say 'consensus for the metadata and the leader, cheaper replication for the bulk data.'",
  },
  failover: {
    name: 'Failover',
    def: "Promoting a replica to primary when the primary dies. It is never instant: detection takes seconds — a dead node and a slow node look alike at first — promotion takes more, and clients must rediscover the new primary. Writes fail during the gap, and writes the dead primary had not yet replicated are lost or need reconciling, which is why failover is rehearsed rather than assumed.",
    say: "Failover promotes a replica when the primary dies, and it is never instant, because detection alone takes seconds — a dead node and a slow node look identical at first.",
    reachFor:
      "Availability questions, and stating honestly what a database outage looks like measured in seconds of failed writes.",
    trap: "Wrong: 'we have a replica, so failover is automatic.' Automatic is not the same as fast or lossless — writes the dead primary had not replicated can be gone. Say 'writes fail for the detection plus promotion window, and I'd rehearse it rather than assume it.'",
  },
  ttl: {
    name: 'TTL (time to live)',
    def: "An expiry stamp on a cached value: after this long, the cache discards it and the next lookup refetches. Short TTLs keep data fresher at the cost of more misses reaching the database; long TTLs invert the trade. Many keys expiring in the same second produce a synchronized miss storm, which is why real systems add random jitter to TTLs.",
  },
  wal: {
    name: 'Write-ahead log (WAL)',
    def: "The database's crash-recovery log: before changing any data structure, it appends the intended change to a sequential log and fsyncs it, so a crash mid-write is repaired by replaying the log. This works because sequential appends are the one thing disks do fast. It is also why every durable write costs a sequential flush, bounding a primary to thousands — not millions — of writes per second.",
    say: "Every change is appended to a sequential log and fsynced before any data page moves, so a crash is repaired by replaying the log — sequential appends being the one thing disks do fast.",
    reachFor:
      "Explaining crash recovery, why a commit costs a flush, or where replication and change-data-capture streams physically come from.",
    trap: "Wrong: 'the WAL is our backup.' It is a recovery log with a retention horizon, not an archive. Say 'the log makes a half-finished write repairable and is what replicas and CDC consume — backups are a separate thing with a separate retention.'",
  },
  lsm: {
    name: 'LSM-tree',
    def: "A storage engine (Cassandra, RocksDB, LevelDB) that never overwrites in place: writes go to a memory buffer, then flush as sorted immutable files that background jobs merge. Writes become pure sequential appends, which are fast; reads may have to check several files (read amplification). It is the engine that fits when writes dominate reads.",
    say: "An LSM never overwrites in place — writes buffer in memory and flush as immutable sorted files that merge in the background — so writes become sequential appends and reads pay by checking more files.",
    reachFor:
      "Write-heavy workloads: time series, event ingestion, anything on Cassandra or a RocksDB-backed store.",
    trap: "Wrong: 'LSM engines are just faster.' Faster at writes, slower at reads, and the deferred merge lands on your disk bandwidth later. Say 'it converts random writes into sequential ones and pays for that in compaction and read amplification.'",
  },
  btree: {
    name: 'B-tree',
    def: "The classic database index (Postgres, MySQL): a wide, shallow tree in which each node is one disk page, so any row is ~3–4 page reads away. Reads are fast and predictable; writes must find and update pages in place, paying random I/O. The B-tree/LSM choice is the read-optimized versus write-optimized fork — same data, opposite physics.",
    say: "A B-tree is a wide, shallow tree of page-sized nodes, so any row is three or four page reads away — predictable reads bought with random writes that update pages in place.",
    reachFor:
      "The default index choice, and any question about why a lookup stays fast as the table grows.",
    trap: "Wrong: 'the table got big, so the index got slow.' Fan-out is in the hundreds, so depth barely moved. Say 'depth went from three page reads to four — what actually changed is the buffer-cache hit rate or the maintenance window.'",
  },
  gsi: {
    name: 'Secondary index (GSI)',
    def: "An extra copy of the table sorted by a different key, so queries can address something other than the primary key. In distributed stores (DynamoDB's Global Secondary Index) it is literally a second table the system keeps in sync: every write now costs two writes, and the index copy can lag. Indexes are paid for with write amplification, not conjured for free.",
    say: "A secondary index is a second copy of the table sorted by a different key, so querying a non-primary attribute costs another write on every insert and a copy that can lag.",
    reachFor:
      "DynamoDB and Cassandra modeling, and the moment a requirement appears that the partition key cannot serve.",
    trap: "Wrong: 'we'll add a secondary index so we can query that.' It is an entire extra table the system maintains asynchronously. Say 'that doubles the write cost and the index is eventually consistent, so read-after-write against it can miss.'",
  },
  cdc: {
    name: 'Change data capture (CDC)',
    def: "Tapping the database's own replication log and streaming every committed change to other systems — search indexes, caches, warehouses. It beats dual-writing from the app because the log is authoritative: nothing is missed, order is preserved, and consumers can replay history. The cost is that downstream systems are eventually consistent by construction.",
    say: "Change data capture taps the database's own replication log and streams every committed change downstream, so search indexes and caches update from an authoritative, ordered, replayable feed.",
    reachFor:
      "Keeping a search index, cache, or warehouse in sync — instead of dual-writing from application code and hoping.",
    trap: "Wrong: 'the app writes to the database and to the search index.' A dual write fails halfway and nothing tells you which half. Say 'I'd drive the index off CDC so the log is the single ordered source, and accept that the index is eventually consistent.'",
  },
  fanout: {
    name: 'Fan-out',
    def: "One incoming event triggering many outgoing operations — one tweet written to a million follower timelines, one request calling six microservices. Fan-out multiplies load invisibly: 1k posts/s × 500 followers = 500k timeline writes/s. Every feed design chooses between fan-out-on-write (pay when posting) and fan-out-on-read (pay when reading), priced by the follower distribution.",
  },
  backpressure: {
    name: 'Backpressure',
    def: "What a system does when a producer outruns a consumer and the buffer between them is full: block the producer, shed work, or degrade output. The alternative — an unbounded buffer — converts overload into memory exhaustion and a later, larger crash. Where to refuse work, and whose work to refuse, is a design decision; leaving it unmade is choosing the crash.",
    say: "Backpressure is what a system does when a producer outruns its consumer — block, shed, or degrade — because the alternative is an unbounded buffer and a larger crash later.",
    reachFor:
      "Every producer-consumer boundary: an ingestion pipeline, a stream job, a write path in front of a database.",
    trap: "Wrong: 'we'll just buffer it.' An unbounded buffer converts overload into memory exhaustion. Say 'I'd bound the buffer and decide explicitly whose work we refuse — leaving that decision unmade is choosing the crash.'",
  },
  ratelimit: {
    name: 'Rate limiting',
    def: "Refusing requests beyond a quota (per user, per IP, per API key) before they consume real capacity, usually with token buckets. It converts unbounded abuse and retry storms into a clean, predictable 429. Protecting the write path with a limiter is often cheaper than provisioning for the worst client the system will ever meet.",
    say: "Rate limiting refuses requests past a quota before they consume real capacity, converting abuse and retry storms into a clean, predictable 429.",
    reachFor:
      "Any public API, any expensive endpoint, and the write path in front of a database you cannot cheaply scale.",
    trap: "Wrong: 'we'll scale to handle the load.' You would be provisioning for the worst client you will ever meet. Say 'I'd rate-limit per key with a token bucket, which is far cheaper than sizing the fleet for abuse.'",
  },
  dns: {
    name: 'DNS',
    def: "The naming system that turns a hostname (api.example.com) into IP addresses, resolved through a hierarchy of caches with TTLs. It adds a lookup — ~1–100ms when not cached — to first connections. It is also a control surface: changing a DNS answer is how traffic gets steered between regions, at the speed of cache expiry rather than instantly.",
    say: 'DNS turns the name into an address before anything else happens, and because every resolver on the path caches that answer for its TTL, changing it steers traffic at the speed of cache expiry rather than instantly.',
    reachFor:
      "Region steering, disaster failover, and first-connection latency budgets — plus any rollback plan whose story is 'we'll just repoint DNS'.",
    trap: "Wrong: 'we'll fail over with DNS.' Say how fast instead: 'resolvers hold the old answer until the TTL expires, and some ignore it entirely, so DNS failover is minutes — which is why per-request failure belongs to the load balancer, not DNS.'",
  },
  tls: {
    name: 'TLS handshake',
    def: "The certificate-and-key exchange that upgrades a TCP connection to encrypted HTTPS. It costs 1–2 extra round trips before the first byte of the request — 100–200ms for a far-away user. That per-connection tax is why connections are reused (keep-alive, HTTP/2) and why TLS is terminated at a nearby edge.",
    say: 'TLS costs one to two round trips per new connection before a single request byte moves, so I terminate it at an edge near the user and reuse connections rather than pay it on every call.',
    reachFor:
      "First-byte latency for distant users, connection-churn problems, and any tier that can't hold warm keep-alive pools (serverless, short-lived clients).",
    trap: "Wrong: 'encryption will cost us CPU.' The per-byte symmetric encryption is nearly free; the per-connection handshake is the bill. Say 'the tax is 1–2 round trips per new connection, so the fix is keep-alive and edge termination — not less encryption.'",
  },
  connpool: {
    name: 'Connection pool',
    def: "A small set of pre-opened database connections that many app threads share, because connections are expensive for the database — each one costs memory and a process or thread, and Postgres degrades past a few hundred. 10,000 concurrent users do not get 10,000 connections; they queue briefly for ~100 pooled ones. An exhausted pool is a queue, with all the queue math attached.",
    say: "A connection pool shares a small set of pre-opened database connections across many app threads, because the database charges memory and a process per connection and degrades past a few hundred.",
    reachFor:
      "Any 'the database is slow' investigation, and any autoscaling design where each new app instance multiplies the connection count.",
    trap: "Wrong: 'we'll raise the pool size.' More connections on the same cores buys contention, not throughput, and the waiting just moves inside the database. Say 'the pool is a queue — I'd measure wait time at the pool before blaming the database.'",
  },
  herd: {
    name: 'Thundering herd',
    def: "Thousands of clients acting in perfect sync — reconnecting after a network blip, retrying on the same backoff schedule, or hammering one just-expired cache key. Each client behaves reasonably; the synchronization is what overloads the target. Every defense breaks the sync: random jitter on retries and TTLs, staggered reconnects, dogpile locks.",
    say: "A thundering herd is thousands of clients acting in perfect sync — reconnecting, retrying, or missing the same expired key — where every client is individually reasonable and the synchronization is what kills you.",
    reachFor:
      "Reconnect storms after a blip, cache stampedes on a hot key, and any device fleet sharing a schedule.",
    trap: "Wrong: 'each client only makes one request.' Ten thousand simultaneous single requests IS the outage. Say 'every defense breaks the synchronization — jitter on retries and TTLs, staggered reconnects, a dogpile lock on the miss.'",
  },
  breaker: {
    name: 'Circuit breaker',
    def: "A wrapper that watches calls to a dependency and, after enough failures, opens: further calls fail instantly instead of waiting out timeouts. That frees the caller’s threads, sheds load off the failing dependency so it can recover, and periodically lets a probe through to test for recovery. It converts \"one slow service drags down everything\" into \"one feature degrades\".",
    say: "A circuit breaker opens after enough failures so calls fail instantly instead of waiting out timeouts, freeing the caller's threads and shedding load off the dependency so it can recover.",
    reachFor:
      "Any dependency whose failure should degrade one feature rather than take the whole service down with it.",
    trap: "Wrong: 'the timeout handles it.' A timeout still costs you the full wait on every single request. Say 'the breaker opens so we stop paying the timeout at all, and it lets a probe through periodically to test for recovery.'",
  },
  bulkhead: {
    name: 'Bulkhead',
    def: "Giving each dependency or tenant its own bounded pool — threads, connections, queue slots — so exhaustion in one cannot spread to the rest. Without bulkheads, one slow payments API quietly consumes every thread in the service and takes checkout, search, and login down with it. The isolation costs a little capacity fragmentation; shared-everything failure costs the whole service.",
    say: "A bulkhead gives each dependency or tenant its own bounded pool of threads and connections, so exhaustion in one cannot spread into the rest.",
    reachFor:
      "A service with several downstream dependencies of differing reliability, or a multi-tenant system where one tenant must not sink the others.",
    trap: "Wrong: 'a shared thread pool is more efficient.' It is, right up until one slow payments API consumes every thread and takes checkout, search, and login with it. Say 'I'd bound each dependency's pool and trade a little capacity fragmentation for containment.'",
  },
  bluegreen: {
    name: 'Blue-green deploy',
    def: "Running two identical environments: blue serves traffic while the new version deploys to green, then the router flips. Rollback is flipping back — seconds, not a re-deploy. The costs are double hardware during the window and a shared database, so schema changes must stay compatible with both versions at once.",
    say: "Blue-green runs two identical environments and flips the router between them, so rollback is a flip back in seconds rather than a re-deploy under pressure.",
    reachFor:
      "Releases where fast rollback matters more than the cost of doubled capacity during the switch window.",
    trap: "Wrong: 'blue-green makes deploys safe.' Both halves share one database, so a schema change only the new version understands breaks the rollback path. Say 'the flip is safe exactly when the migration is compatible with both versions at once.'",
  },
  canary: {
    name: 'Canary deploy',
    def: "Shipping a new version to a small slice (1–5%) of traffic, watching error rates and latency, then widening or rolling back. It bounds the blast radius of a bad release to the slice. The limit is representativeness: a 1% canary can miss bugs that appear only at full load or only for specific user cohorts.",
    say: "A canary ships the new version to a small slice of traffic and watches error rate and latency before widening, which bounds the blast radius of a bad release to that slice.",
    reachFor:
      "Any risky release whose failure mode you expect to show up in metrics rather than in tests.",
    trap: "Wrong: 'the canary was clean, so ship it.' One percent of traffic can easily miss a bug that only appears at full load or for one cohort. Say 'the canary bounds the blast radius; it does not prove correctness at scale.'",
  },
  cap: {
    name: 'CAP theorem',
    def: "During a network partition, a distributed system must choose: refuse some requests (consistency) or answer with possibly-stale data (availability). It is a proof, not a slogan, and in practice a statement about geography — partitions between regions are a matter of when, not if. The working question is per-operation: which requests may return stale data, and which must never?",
    say: "During a network partition a distributed system must choose, per operation, between refusing requests it cannot confirm and answering with possibly-stale data.",
    reachFor:
      "Any multi-region or replicated design — and it is really a statement about geography, since partitions between regions are a matter of when.",
    trap: "Wrong: 'we're a CP system.' CAP applies per operation, not per system. Say 'checkout has to be consistent and the browse page can be stale — which requests may return old data is the actual design question.'",
  },
  quorum: {
    name: 'Quorum',
    def: "Requiring a majority (2 of 3, 3 of 5) of replicas to acknowledge a write or serve a read, so that any two majorities overlap in at least one node holding the latest value. The overlap is what keeps the system consistent while a minority of nodes is down. It is why replica counts are odd, and why every quorum write waits on the slowest member of its majority.",
    say: "A quorum requires a majority of replicas to answer, so any two majorities must overlap in at least one node holding the latest value — and that overlap is the entire guarantee.",
    reachFor:
      "Explaining tunable consistency, why replica counts are odd, and how split brain is actually prevented.",
    trap: "Wrong: 'quorum means most of them agreed.' It means the read set and the write set are forced to intersect. Say 'W plus R greater than N is what makes the read see the write — pigeonhole arithmetic, not a vote.'",
  },
  leader: {
    name: 'Leader election',
    def: "Picking exactly one node to accept writes, so ordering has a single source of truth; the election is done with consensus so a network split cannot crown two leaders (split-brain). During an election — triggered precisely when the system is already failing — there is no leader, and writes stall. Leader-based systems are therefore engineered around how short that gap can be made.",
    say: "Leader election picks exactly one node to accept writes so ordering has a single source of truth, and it runs on consensus precisely so a network split cannot crown two.",
    reachFor:
      "Any single-writer design — a primary database, a partition leader, a cron that must run exactly once across a fleet.",
    trap: "Wrong: 'the leader keeps things consistent.' There is a window with no leader at all, triggered exactly when the system is already failing. Say 'writes stall during the election, so the design question is how short that gap can be made.'",
  },
  exactlyonce: {
    name: 'Exactly-once',
    def: "A message delivered and processed precisely one time — the guarantee no network can natively provide, because acknowledgements themselves can be lost. Real systems compose it honestly: at-least-once delivery plus idempotent processing, deduplicating by operation ID, so duplicates arrive but have no second effect. A vendor claiming exactly-once is describing that composition, and the load-bearing part is where the idempotency key lives.",
    say: "Exactly-once is not a delivery guarantee any network can provide — it is at-least-once delivery plus idempotent processing that dedupes on an operation id.",
    reachFor:
      "Correcting a vendor claim, or explaining how Kafka transactions and Flink checkpoints actually achieve what they advertise.",
    trap: "Wrong: 'the broker gives us exactly-once.' Acknowledgements can be lost, so redelivery is unavoidable. Say 'exactly-once is composed from at-least-once plus deduplication, and the load-bearing question is where the idempotency key lives.'",
  },
  atleastonce: {
    name: 'At-least-once',
    def: "The workhorse delivery guarantee: keep retrying until acknowledged, so nothing is lost — but the same message may arrive twice, because the acknowledgement, not the message, may be what got lost. Accepting at-least-once makes duplicates a promise rather than a bug, so every consumer must be idempotent. The alternative, at-most-once, trades duplicates for silent loss.",
    say: "At-least-once keeps retrying until acknowledged, so nothing is lost and the same message may arrive twice — because it is usually the acknowledgement, not the message, that got lost.",
    reachFor:
      "The default and correct choice for nearly every queue, paired with an idempotent consumer.",
    trap: "Wrong: 'we'll use at-most-once to avoid duplicates.' You just traded visible duplicates for silent loss. Say 'I take at-least-once and make the consumer idempotent, because a duplicate I can dedupe beats a message I never knew about.'",
  },
  visibility: {
    name: 'Visibility timeout',
    def: "A queue's crash-recovery window: receiving a message hides it, rather than deleting it, while a worker processes it. If the worker finishes, it deletes the message; if it crashes, the timeout expires and the message reappears for another worker. The timeout has to exceed the slowest processing time, or healthy work reappears mid-flight and gets processed twice.",
    say: "A visibility timeout hides a message rather than deleting it while a worker processes it, so a crashed worker's message simply reappears for someone else.",
    reachFor:
      "SQS-style queues, and explaining how at-least-once delivery is actually implemented rather than just asserted.",
    trap: "Wrong: 'set a short visibility timeout so failures recover quickly.' Shorter than your slowest processing time and healthy work reappears mid-flight and runs twice. Say 'the timeout has to exceed p99 processing time, and the consumer must be idempotent regardless.'",
  },
  dlq: {
    name: 'Dead-letter queue',
    def: "Where messages go after failing N processing attempts, so one poison message — malformed, or triggering a bug — cannot clog the queue with endless retries while healthy work backs up behind it. The DLQ doubles as the forensic record: it converts 'processing kept crashing all night' into 'these 14 exact messages failed — replay them after the fix'.",
    say: "A dead-letter queue catches messages that failed N attempts, so one poison message cannot clog the pipeline with endless retries while healthy work backs up behind it.",
    reachFor:
      "Every production queue — it is the operational answer to what happens to the messages you cannot process.",
    trap: "Wrong: 'failed messages get retried.' Retried forever is how one malformed message takes down the night shift. Say 'after N attempts it goes to a DLQ, which doubles as the forensic record — these fourteen messages failed, replay them after the fix.'",
  },
  hotpartition: {
    name: 'Hot partition',
    def: "One shard receiving far more traffic than its siblings because many writers compute the same partition key — a timestamp bucket, today's date, a viral post's ID. The cluster is large and mostly idle while one node saturates: total capacity means nothing when per-key capacity is the limit. The defense is salting or composing keys so concurrent writers spread across partitions.",
    say: "A hot partition is one shard taking most of the traffic because many writers compute the same key, so the cluster sits mostly idle while a single node saturates.",
    reachFor:
      "Any partition-key review, and any incident where total capacity looks healthy while one node throttles.",
    trap: "Wrong: 'we'll provision more capacity.' Per-partition limits are per key range, so a hot key gets exactly one partition no matter what the table is provisioned for. Say 'I'd salt or compose the key so concurrent writers land on different partitions.'",
  },
  readyourwrites: {
    name: 'Read-your-own-writes',
    def: "The consistency promise users actually notice: after saving, the author's own next read shows the change — even if strangers see stale data a moment longer. Replication lag breaks it: write to the primary, read from a lagging replica, and the new comment has 'vanished'. The standard fixes pin a user's reads to the primary briefly after their write, or route reads by session.",
    say: "Read-your-own-writes is the promise that after saving, the author's own next read shows the change, even while strangers may see stale data a moment longer.",
    reachFor:
      "Any post, comment, or edit flow — it is the consistency guarantee users actually notice, and the cheapest one to provide.",
    trap: "Wrong: 'we need strong consistency.' Usually you need this much weaker and much cheaper thing. Say 'I'd pin the author's reads to the primary for a few seconds after their write, rather than making every read in the system coordinate.'",
  },
  replag: {
    name: 'Replication lag',
    def: "The delay between a write committing on the primary and appearing on a replica — milliseconds normally, unbounded under load, because lag is a queue and queues explode past the knee. It is the fine print on 'just add replicas': every read from a replica is a read of the recent past. The design question is which reads tolerate that and which must not.",
    say: "Replication lag is the delay between a write committing on the primary and appearing on a replica — milliseconds normally, unbounded under load, because lag is a queue.",
    reachFor:
      "Any design that reads from replicas, and the inevitable follow-up about what a user sees immediately after they post.",
    trap: "Wrong: 'lag is only a few milliseconds.' It is a queue, so it is a few milliseconds right up until it is not. Say 'reads that must see their own write go to the primary, and every replica read is a read of the recent past.'",
  },
  cdn: {
    name: 'CDN',
    def: "Servers in hundreds of cities that cache content near users — a round trip is bounded by distance, so serving from 50 km away beats any optimization applied from 2,000 km away. A CDN can absorb most read traffic before it reaches the origin, often the cheapest capacity available. It helps only cacheable responses; personalized and write traffic still travels the full distance.",
  },
  autoscaling: {
    name: 'Autoscaling',
    def: "Rules that add or remove servers based on load signals — CPU, queue depth, request rate. It tracks gradual ramps well and misses spikes: new instances take minutes to boot and warm, and a 10-second surge is over before help arrives. That gap is why queues, caches, and headroom still exist in autoscaled systems.",
  },
  index: {
    name: 'Index',
    def: "A sorted copy of chosen columns that turns \"scan a billion rows\" into \"walk a tree in a few page reads\". The price is paid on the write path: every insert must also update every index, and each index is more storage and more write amplification. An index is the read-versus-write trade taken one table at a time.",
    say: "An index is a sorted copy that turns scanning a billion rows into a few page reads, paid for on every single write that has to maintain it.",
    reachFor:
      "Any slow-query conversation, and any schema review where someone proposes the fourth or fifth index on one table.",
    trap: "Wrong: 'add an index, it can only help.' Each index is storage plus one more write per insert, and on a small or low-selectivity table the planner will not even use it. Say 'I'd index the column this query filters on, and accept one extra write per insert.'",
  },
  throughput: {
    name: 'Throughput vs latency',
    def: "Throughput is how much work per second; latency is how long one request takes. They are different axes and they fight: batching raises throughput while adding waiting, and pushing utilization toward 100% maximizes throughput while queueing destroys latency. A requirement that says 'fast' has not yet said which one it means.",
  },
  timeout: {
    name: 'Timeout',
    def: "How long a caller waits on a dependency before giving up. Without one, a slow dependency silently holds the caller's threads until everything upstream is stuck — slowness propagates farther than errors do. Timeouts must shrink as calls go deeper, because the caller's budget bounds the callee's, and every timeout needs a decided fallback: retry, degrade, or fail.",
    say: "A timeout is how long a caller waits before giving up, and without one a slow dependency silently holds your threads until everything upstream is stuck too.",
    reachFor:
      "Every network call without exception, and any incident whose symptom is everything got slow rather than something returned an error.",
    trap: "Wrong: 'we set a generous timeout to be safe.' Generous means your threads are held longer during precisely the failure you were protecting against. Say 'timeouts shrink as calls go deeper, because the caller's budget bounds the callee's, and each one has a decided fallback.'",
  },
  retry: {
    name: 'Retry (with backoff + jitter)',
    def: "Repeating a failed call, waiting exponentially longer each time, with randomness added so thousands of clients do not retry in lockstep — a synchronized retry wave is a self-inflicted thundering herd. Transient failures are common enough that retries are load-bearing, and two rules make them safe: the operation must be idempotent, and retries must be budgeted so they cannot multiply load during an outage.",
    say: "Retries repeat a failed call with exponentially growing waits plus jitter, because a synchronized retry wave is a thundering herd you inflicted on yourself.",
    reachFor:
      "Transient failures — a blip, a brief overload, a failover — where the second attempt genuinely has a different outcome.",
    trap: "Wrong: 'we retry three times.' Without jitter every client retries in lockstep, and without a budget retries multiply load during the outage. Say 'exponential backoff with jitter, a retry budget, and an idempotent operation — otherwise retries are an amplifier, not a fix.'",
  },
  rest: {
    name: 'REST API',
    def: "A convention for HTTP APIs in which URLs name resources (/users/42) and verbs (GET, POST, PUT, DELETE) name the action, so the protocol itself carries meaning. The discipline matters at scale: GETs are cacheable and safe to repeat, PUT and DELETE are idempotent by design — precisely the properties that let caches, retries, and CDNs operate without corrupting data.",
  },
  pagination: {
    name: 'Pagination',
    def: "Returning a long list in bounded pages instead of all at once, so no single request can drag back a million rows and blow out latency and memory. Cursor-based pagination (a pointer to the last item seen) beats offset-based (LIMIT/OFFSET): offsets re-scan everything they skip, and they duplicate or drop rows when the data changes between pages.",
  },
  normalization: {
    name: 'Normalization',
    def: "Storing each fact exactly once and referencing it by key, so an update touches one row and the data cannot contradict itself. The cost is paid at read time: assembling a view requires joining several tables, and joins grow more expensive as data grows. Read-heavy systems therefore often denormalize on top of a normalized core.",
    say: "Normalizing stores each fact exactly once and reassembles it with a join, so an update touches one row and the data cannot contradict itself.",
    reachFor:
      "Write-heavy and correctness-critical models — ledgers, inventory, anything where two copies disagreeing is a page at 3am.",
    trap: "Wrong: 'normalize everything, it's correct.' Correct and fast are different axes, and a read-heavy feed pays the join on every single request. Say 'I normalize the source of truth and denormalize the read path on top of it.'",
  },
  denormalization: {
    name: 'Denormalization',
    def: "Deliberately duplicating data — pre-joining it into the shape a screen needs — so a read becomes a single lookup instead of a multi-table join. It trades write cost and consistency risk for read speed: every copy must be updated, and copies can drift. The trade is right when reads vastly outnumber writes, and wrong otherwise.",
    say: "Denormalizing pre-joins data into the shape the screen needs so a read is one lookup, at the cost of updating every copy on every write.",
    reachFor:
      "Read-heavy screens with a fixed shape — a feed, a profile, a product listing — where reads outnumber writes by orders of magnitude.",
    trap: "Wrong: 'denormalize for performance.' Performance for whom — the cost moved to the write path and the copies can now drift. Say 'reads outnumber writes a hundred to one here, so I duplicate and eat the write fan-out.'",
  },
  join: {
    name: 'Join',
    def: "Combining rows from multiple tables on a shared key at query time. Joins are what let data stay normalized — stored once — but they cost CPU and I/O that grow with table size, and they become hard or impossible once data is sharded across machines. That limit is a major reason NoSQL stores drop them.",
    say: "A join combines rows on a shared key at query time, which is what lets data stay stored once — and what stops working cleanly once the tables live on different machines.",
    reachFor:
      "Relational modeling, and explaining precisely what NoSQL gave up in order to scale horizontally.",
    trap: "Wrong: 'joins are slow.' A well-indexed join of a few tables is fast; what is slow is a join across shards, or one the planner can no longer order well. Say 'joins are cheap until the data is distributed, which is the point where you denormalize.'",
  },
  acid: {
    name: 'ACID',
    def: "The transactional guarantees of a classic database: Atomicity (all-or-nothing), Consistency (declared rules always hold), Isolation (concurrent transactions don't see each other's partial work), Durability (committed data survives a crash). They are why a bank transfer cannot lose money in the middle — and why every commit pays an fsync, bounding write throughput to thousands per second.",
    say: "ACID is atomicity, consistency, isolation and durability — all-or-nothing, declared rules always hold, concurrent transactions don't see partial work, and a commit survives a crash.",
    reachFor:
      "Justifying a relational store for money, inventory, or bookings — anywhere a half-applied operation is a real-world problem.",
    trap: "Wrong: 'it's ACID, so concurrency is handled.' The I is a dial, and it ships set to read committed. Say 'ACID gives me atomicity and durability outright; isolation is a level I have to choose and pay for.'",
  },
  nosql: {
    name: 'NoSQL',
    def: "A family of non-relational databases — key-value, document, wide-column, graph — that drop joins and strict ACID in exchange for horizontal scale and a data model shaped to one access pattern. The queries must be known up front, because the partition key is designed first and everything else follows from it. The fit is real when the access pattern is fixed and the scale demands it.",
    say: "NoSQL trades joins and strict ACID for horizontal scale and a model shaped to one access pattern, which means the queries have to be known before the schema is.",
    reachFor:
      "Fixed, well-understood access patterns at scale — a session store, a feed, a device-telemetry table.",
    trap: "Wrong: 'NoSQL scales better.' It scales differently, by making you commit to the access pattern up front. Say 'I'd use it because I know the query and can pick a partition key that spreads — not because relational ran out of road.'",
  },
  blob: {
    name: 'Blob / object storage',
    def: "Large binary objects — images, video, backups — stored in a flat key→bytes service (S3, GCS) at ~$0.02/GB/mo, far cheaper and more scalable than block storage. Blobs stay out of the database because a multi-megabyte row bloats indexes, evicts useful cache, and costs several times more. The object lives in blob storage; only its key lives in the database.",
    say: "Blob storage keeps large binaries in a flat key-to-bytes service at around two cents per gigabyte-month, so the object lives there and only its key lives in the database.",
    reachFor:
      "Images, video, PDFs, backups — anything measured in megabytes rather than bytes.",
    trap: "Wrong: 'we'll store the file in the database.' A multi-megabyte row bloats indexes, evicts useful cache, and costs several times more per byte. Say 'the bytes go to object storage and the row carries the key plus the metadata I actually query on.'",
  },
  presigned: {
    name: 'Presigned URL',
    def: "A time-limited, permission-scoped link that lets a client read or write one specific object in blob storage directly, without the bytes passing through the application servers. It exists because a 2 GB upload would otherwise pin an app-server thread and its memory for minutes. The API issues the ticket; the heavy transfer runs between client and storage.",
    say: "A presigned URL is a time-limited, permission-scoped link that lets the client move bytes straight to object storage, so a two-gigabyte upload never occupies an app server.",
    reachFor:
      "Any large upload or download path — user media, data exports, backups — where proxying would pin threads and memory for minutes.",
    trap: "Wrong: 'the upload goes through our API.' That pins a thread and its buffers for the whole transfer and turns your app tier into a bandwidth bill. Say 'the API issues a presigned URL, the client uploads directly, and then calls back with the key.'",
  },
  invertedindex: {
    name: 'Inverted index',
    def: "The data structure behind search: a map from each word to the list of documents containing it, so a text query becomes a lookup and a merge instead of a scan of every row. It is built at write time by tokenizing and indexing each document. Search therefore lives in a separate, eventually-consistent system fed from the database, rather than inside the primary store.",
    say: "An inverted index maps each word to the documents containing it, so full-text search becomes a lookup and a merge instead of a scan of every row.",
    reachFor:
      "Any search requirement — product search, log search, autocomplete — where a wildcard LIKE would be a full scan.",
    trap: "Wrong: 'we'll add a search index to the database and be done.' Search is a separate, eventually-consistent system fed from your database. Say 'I'd run a search cluster fed by change-data-capture, and say out loud that it lags the source of truth.'",
  },
  apigateway: {
    name: 'API gateway',
    def: "A single front service in front of many backends that handles cross-cutting concerns once: TLS termination, authentication, rate limiting, routing, sometimes aggregating several backend calls into one reply. Centralizing them keeps every service from re-implementing auth and limiting. The gateway sits on the critical path of every request, so it stays thin and highly available.",
  },
  stream: {
    name: 'Stream (event log)',
    def: "An ordered, retained, replayable log of events (Kafka) that many independent consumers read at their own offset — unlike a queue, consuming a message does not delete it. A broker sustains ~1M msgs/s because it only ever appends sequentially. Retention plus offsets mean a new consumer can be added later and reprocess all of history.",
    say: "A stream is an ordered retained log that many consumers read at their own offset, so consuming does not delete and a new consumer added next year can replay all of history.",
    reachFor:
      "Multiple independent consumers of the same events, audit requirements, or any need to reprocess history after fixing a bug.",
    trap: "Wrong: 'a stream is basically a queue.' A queue deletes on consume; a log deletes on retention. Say 'the log keeps events for the retention window, which is exactly what makes replay and independent consumers possible.'",
  },
  eventsourcing: {
    name: 'Event sourcing',
    def: "Storing the sequence of changes (events) as the source of truth and deriving current state by replaying them, instead of storing only the latest state. It yields a complete audit log and the ability to rebuild any view — or fix a bug retroactively — by replaying. The costs are more storage and the obligation to keep old event schemas replayable forever.",
    say: "Event sourcing stores the sequence of changes as the source of truth and derives current state by replaying them, which buys a complete audit log and the ability to rebuild any view.",
    reachFor:
      "Domains where history IS the requirement — ledgers, order lifecycles, compliance — or where you need to fix a bug retroactively.",
    trap: "Wrong: 'we'll event-source it for flexibility.' You have signed up to keep every old event schema replayable forever. Say 'I'd use it where the audit trail is a hard requirement, and treat schema evolution as the permanent tax.'",
  },
  distlock: {
    name: 'Distributed lock',
    def: "A lock shared across machines so only one worker performs a critical action at a time (charging a card once, running one cron). A holder can pause or crash, so correct locks are time-bounded leases carrying a fencing token that the protected resource checks. Because the lock is agreement among machines, robust implementations sit on a consensus store (etcd, ZooKeeper) rather than a lone Redis key.",
    say: "A distributed lock lets only one worker across many machines perform a critical action, and because a holder can pause or crash it has to be a time-bounded lease carrying a fencing token.",
    reachFor:
      "Charging a card once, running one cron across a fleet, or any side effect that must not happen twice.",
    trap: "Wrong: 'we use a Redis key as a lock.' A lone key gives you neither consensus nor fencing. Say 'a lock is agreement among machines — I'd put it on etcd or ZooKeeper and have the resource itself check the fencing token.'",
  },
  lease: {
    name: 'Lease',
    def: "A lock granted for a bounded time that must be renewed to keep, so a crashed holder's lock expires on its own instead of deadlocking the system. The subtlety: a paused holder can lose its lease while still believing it owns the resource. That stale writer is rejected by a fencing token — a monotonically rising number the resource validates on every operation.",
    say: "A lease is a lock granted for a bounded time that must be renewed to keep, so a crashed holder's lock expires on its own instead of deadlocking the system.",
    reachFor:
      "Distributed locks, leader terms, and session-based coordination where the holder might simply vanish mid-operation.",
    trap: "Wrong: 'the lease expired, so the old holder stopped.' The old holder was paused and has no idea. Say 'expiry bounds the deadlock, and a fencing token is what actually stops the stale writer at the resource.'",
  },
  websocket: {
    name: 'WebSocket',
    def: "A persistent, full-duplex connection over a single TCP socket: server and client can each send at any time with minimal latency, which fits chat, multiplayer, and trading. The cost is statefulness — every open connection is memory pinned to one specific server. Realtime systems get hard exactly at the tier that routes each message to whichever server holds the right connection.",
    say: 'A WebSocket is one full-duplex connection either side can write to at any moment, which is right for chat or trading — but every open socket is memory pinned to one specific server, so the hard part becomes routing a message to whichever server holds that connection.',
    reachFor:
      'Bidirectional low-latency traffic where the client sends about as often as the server: chat, multiplayer, collaborative editing, live trading, presence.',
    trap: "Wrong: 'we'll use WebSockets for live updates.' If the traffic is one-way you bought statefulness for nothing. Say 'updates only go server→client here, so SSE gives us push over plain HTTP with automatic reconnect and no sticky-routing tier.'",
  },
  sse: {
    name: 'Server-sent events',
    def: "A long-lived one-way stream from server to client over plain HTTP, with automatic reconnection built in — a fit for feeds, notifications, and live dashboards. It is simpler than a WebSocket and traverses proxies and firewalls as ordinary HTTP. It only pushes server→client, so client actions still travel as ordinary requests.",
    say: 'Server-sent events give me one-way server→client push over ordinary HTTP with reconnection built in, which covers feeds and notifications without the sticky-connection routing a WebSocket forces on me.',
    reachFor:
      'Anything where the client only ever reads: feeds, notification streams, live dashboards, job-progress bars, streaming model output.',
    trap: "Wrong: 'SSE is just a worse WebSocket.' It is a narrower one on purpose. Say 'it is one-way over plain HTTP, so it crosses proxies unchanged and reconnects itself — I only pay for duplex when the client actually needs to push.'",
  },
  polling: {
    name: 'Polling',
    def: "The client repeatedly asks \"anything new?\" on a timer, because plain HTTP cannot let the server speak first. It works everywhere and is trivial to operate, but most responses carry nothing when updates are rare, and staleness averages half the polling interval. Long-polling and push protocols exist to eliminate exactly those two costs.",
    say: "Polling is the client asking on a timer because HTTP won't let the server speak first — it works everywhere, and its two costs are mostly-empty requests and staleness averaging half the interval.",
    reachFor:
      'Rare updates, huge or untrusted client populations, and any place where operational simplicity is worth a few seconds of staleness.',
    trap: "Wrong: 'polling doesn't scale.' The interval decides, not the technique. Say 'at a 10-second interval a million clients is 100k requests a second of mostly nothing, so push wins here — at one poll an hour it wouldn't.'",
  },
  saga: {
    name: 'Saga',
    def: "A transaction spanning several services, run as a sequence of local steps, each paired with a compensating action that undoes it if a later step fails. It trades atomicity for availability: there is a window where some steps are done and others are not. Every step must therefore be idempotent, and a failure that cannot be compensated goes to a human via a dead-letter queue.",
    say: "A saga runs a cross-service transaction as a sequence of local steps, each paired with a compensating action, trading atomicity for availability.",
    reachFor:
      "Workflows spanning services with separate databases — booking, checkout, onboarding — where two-phase commit would block.",
    trap: "Wrong: 'the saga rolls back on failure.' Each step already committed; there is nothing to roll back. Say 'each step ships with a compensating action, and I'd order the steps so the hardest one to compensate runs last.'",
  },
  '2pc': {
    name: 'Two-phase commit (2PC)',
    def: "A protocol in which a coordinator asks every participant to prepare, then — if all agree — to commit, yielding atomicity across separate databases. It blocks: participants hold locks while they wait, and a coordinator crash can leave them stuck holding those locks. It is reserved for a few fast steps that truly must be atomic; at scale, sagas are preferred.",
    say: "Two-phase commit has a coordinator ask every participant to prepare and then to commit, buying atomicity across separate databases at the price of participants holding locks while they wait.",
    reachFor:
      "A small number of fast steps that genuinely must be atomic, inside one trust and latency domain.",
    trap: "Wrong: 'we'll use 2PC across the services.' It blocks, and a coordinator crash leaves participants holding locks with nobody to tell them what happened. Say 'past a couple of fast local participants I use a saga and design the compensations.'",
  },
  optimistic: {
    name: 'Optimistic concurrency',
    def: "Handling contention by letting writers race without locks: read a version number, and commit only if it has not changed (compare-and-set), otherwise retry. With rare conflicts it is the fastest scheme, because no one waits on a lock. Under heavy contention it thrashes on repeated retries — there, a pessimistic lock or a single serialized owner wins.",
    say: "Optimistic concurrency lets writers race without locks and commits only if the version is unchanged, which is fastest exactly when conflicts are rare.",
    reachFor:
      "Low-contention updates — editing a profile, saving a document — where holding a lock would cost more than the occasional retry.",
    trap: "Wrong: 'optimistic is faster.' Under high contention every loser redoes its work and throughput collapses. Say 'optimistic wins below some conflict rate and pessimistic wins above it, and the conflict rate is measurable rather than a matter of taste.'",
  },
  geohash: {
    name: 'Geohash',
    def: "An encoding that interleaves latitude and longitude bits into a single string, so nearby points share a common prefix and an ordinary index answers \"near me\" with a prefix range scan. It turns a 2D proximity query into a 1D lookup. The catch is cell borders: a point near an edge requires checking the neighboring cells too.",
    say: "A geohash interleaves latitude and longitude bits into one sortable string so nearby points share a prefix, turning a two-dimensional proximity query into an ordinary index range scan.",
    reachFor:
      "Find-things-near-me on a database you already run, without adopting a spatial engine.",
    trap: "Wrong: 'the prefix gives you everything nearby.' A point near a cell border has its closest neighbours under a completely different prefix. Say 'I query the cell plus its eight neighbours, then filter by true distance.'",
  },
  quadtree: {
    name: 'Quadtree',
    def: "A spatial index that recursively splits a region into four quadrants, subdividing only where points are dense — cities get fine cells, oceans stay coarse. It adapts to uneven density far better than a fixed grid. The price is a heavier structure to maintain as objects move, which is the trade weighed against a simpler geohash.",
    say: "A quadtree recursively splits a region into four quadrants only where points are dense, so cities get fine cells, oceans stay coarse, and both cost about the same query.",
    reachFor:
      "Highly uneven spatial density, where a fixed grid would be mostly empty cells and a few overloaded ones.",
    trap: "Wrong: 'a quadtree is faster than a geohash.' It adapts better and costs more to maintain as objects move. Say 'I'd start with geohashing on the index I already have and reach for a quadtree or R-tree when density is genuinely uneven.'",
  },
  consistenthash: {
    name: 'Consistent hashing',
    def: "Placing nodes and keys on a hash ring where each key belongs to the next node clockwise, so adding or removing a node re-homes only about 1/N of the keys instead of nearly all of them. It is what lets distributed caches and partitioned stores change size without a system-wide reshuffle — which, for a cache, would be a total miss storm.",
    say: "Consistent hashing puts nodes and keys on a ring where a key belongs to the next node clockwise, so a membership change re-homes about one in N of the keys instead of nearly all of them.",
    reachFor:
      "Distributed caches and partitioned stores that must grow or shrink without a system-wide reshuffle — which for a cache is a total miss storm.",
    trap: "Wrong: 'consistent hashing balances the load.' It bounds movement; virtual nodes are what balance it. Say 'it keeps a resize from re-homing everything, and I add virtual nodes so the arcs come out even.'",
  },

  /* ---- Networking (spec 065) — the transport floor everything above assumes.
     Every entry here carries the full speakable set: say / reachFor / trap. */
  ip: {
    name: 'IP',
    def: "The Internet Protocol — the L3 contract that gives every machine an address and best-effort delivery of packets to any of them, anywhere on earth. 'Best effort' means it promises to try, not to succeed: packets can be dropped, duplicated, or reordered in flight, and everything reliable is built on top of that honesty. Routing, BGP, and peering keep the promise invisibly, which is why an application developer can address a machine on another continent without knowing a single hop on the way.",
    say: 'IP gives every machine an address and best-effort packet delivery — a promise to try, not to succeed — and everything reliable on the internet is built on top of that honesty.',
    reachFor:
      'Naming why regions, round trips, and geography constrain a design — the L3 facts an architecture inherits before you choose anything.',
    trap: "Wrong: 'the network will deliver it.' IP never promised that. Say 'IP is best-effort — TCP papers over the loss and UDP hands it to me raw, so reliability is a choice I make at L4, not something the wire owes me.'",
  },
  rtt: {
    name: 'RTT (round trip)',
    def: "Round-trip time: one full there-and-back between two endpoints — the network's basic unit of cost. Light in fiber covers about 200,000 km/s, so geography sets a hard floor: ~1 ms across a city, ~70 ms across a country, ~150 ms across an ocean, and no protocol tuning beats it. Handshakes, retransmits, and consensus rounds are each priced in round trips, which is why counting them predicts latency better than counting bytes.",
    say: "A round trip is the network's unit of cost — the speed of light in fiber puts a hard floor under it — so handshakes, retransmits, and consensus rounds are all priced in RTTs you can't engineer away.",
    reachFor:
      'Any latency budget: what a handshake or retransmit really costs, and why cross-region anything starts ~70–150 ms behind.',
    trap: "Wrong: 'we have plenty of bandwidth, so latency is covered.' A fat pipe moves more bytes per trip, never the trip itself. Say 'bandwidth and latency are different budgets — this path costs ~70 ms per round trip, so the fix is fewer round trips, not a faster link.'",
  },
  tcp: {
    name: 'TCP',
    def: 'The connection-oriented transport under HTTP: it numbers every byte, acknowledges what arrived, retransmits what did not, and slows itself down when the network starts dropping. That bookkeeping is what makes a stream ordered and complete — and it is also what makes it wait, because a missing segment holds back every byte already sitting behind it. You buy reliability with setup round trips and with delay you cannot see coming.',
    say: 'I default to TCP because almost everything above it — HTTP, gRPC, database protocols — wants an ordered, reliable byte stream, and I only step down to UDP when a late packet is worse than a lost one.',
    reachFor:
      'Anything where completeness beats freshness: page loads, API calls, file transfer, database connections — the default, until a latency requirement forces the argument.',
    trap: "Wrong: 'TCP is slow.' TCP is not slow; its guarantees cost round trips. Say 'TCP pays a handshake up front and can head-of-line block on loss — here that is roughly 100 ms before the first byte, which this requirement can or cannot afford.'",
  },
  udp: {
    name: 'UDP',
    def: 'A transport that just sends datagrams: no connection setup, no acknowledgments, no retransmission, no ordering. Packets can arrive late, out of order, or never, and the application decides what that means. That is not a defect — discarding a stale packet is exactly right when the next one is already in flight, which is why voice, video, and game state ride on it.',
    say: 'UDP trades delivery guarantees for latency — no handshake, no retransmits, no ordering — so it wins exactly when a late packet is worse than a lost one.',
    reachFor:
      'Live media and telemetry: voice and video, game state, metrics firehoses, DNS queries — anywhere the next value replaces the lost one before you could have used it.',
    trap: "Wrong: 'UDP is unreliable, so it's risky.' Unreliable is the feature you are buying. Say 'the application takes over loss handling — we drop a stale audio frame instead of retransmitting it, because a 200 ms-late frame is useless anyway.'",
  },
  handshake: {
    name: 'Handshake',
    def: 'The round trips two endpoints spend agreeing before any payload moves: TCP establishes the connection, then TLS exchanges keys and certificates on top of it. Each round trip is one full there-and-back at the speed of the link, so a cold connection to a distant server can burn 100–200ms before the first byte of the request leaves. That fixed per-connection tax is why connections are reused and why edges terminate them close to the user.',
    say: 'The handshake is the fixed price of a new connection — a round trip for TCP plus one or two for TLS — so I reuse connections and terminate TLS at the edge instead of paying it on every request.',
    reachFor:
      "Any first-byte latency budget: cold mobile clients, cross-region calls, per-request connection churn, or a tier that can't keep pools warm.",
    trap: "Wrong: 'we'll add HTTPS, it's basically free.' It is free per byte, not per connection. Say 'each new connection pays 1–2 extra round trips — about 100 ms for a distant user — so the fix is keep-alive and edge termination.'",
  },
  headofline: {
    name: 'Head-of-line blocking',
    def: 'One stalled item holding up everything queued behind it, even though that work is ready to go. In TCP it is literal: a single lost segment makes the receiver buffer every later byte until the retransmission lands, so ten multiplexed HTTP/2 streams on one connection all stall on one packet. The same shape shows up in queues and worker pools, and the fix never changes — give independent work independent lanes.',
    say: 'Head-of-line blocking is one stuck item stalling everything behind it — one lost TCP segment freezing every multiplexed stream on that connection — which is the whole reason HTTP/3 moved to QUIC over UDP.',
    reachFor:
      "Explaining why multiplexing onto one connection isn't free, why one slow consumer stalls a whole partition, or why a single poison message drains a worker pool.",
    trap: "Wrong: 'HTTP/2 fixed head-of-line blocking.' It fixed it at the HTTP layer only. Say 'HTTP/2 removed the application-level queue, but every stream still shares one TCP connection, so a dropped packet stalls all of them — QUIC is what gives each stream its own recovery.'",
  },
  quic: {
    name: 'QUIC',
    def: "A modern transport that rebuilds TCP's ideas on top of UDP: one connection carries many independent streams, each ordered on its own, so a lost packet stalls only its stream instead of the whole connection. TLS is folded into the very first round trip, and it rides inside UDP because kernels and middleboxes have ossified around TCP — a brand-new native transport could never have deployed. HTTP/3 is HTTP running over QUIC, which is what finally removed cross-stream head-of-line blocking.",
    say: "QUIC is TCP's ideas rebuilt over UDP — independent streams so one loss doesn't stall the rest, with encryption folded into the first round trip — and HTTP/3 is HTTP running on it.",
    reachFor:
      "Explaining why HTTP/2's single-connection multiplexing made head-of-line blocking worse, or naming the modern fix in one sentence.",
    trap: "Wrong: 'we should build this on QUIC.' It is a depth signal, not a default. Say 'QUIC is why HTTP/3 exists — each stream repairs its own losses — and I'd reach for it only where handshake latency or head-of-line blocking is actually the bottleneck.'",
  },
  grpc: {
    name: 'gRPC',
    def: 'A remote-procedure-call framework over HTTP/2: you declare the service in a schema, generate client and server code from it, and call remote methods as if they were local. Payloads travel as Protobuf binary, so messages are smaller and decoding is far cheaper than JSON, and one connection multiplexes many concurrent calls. The cost is that browsers cannot speak it natively and the body is unreadable on the wire, which is why it dominates service-to-service traffic and rarely faces the public internet.',
    say: 'I use gRPC for internal service-to-service calls — generated clients, binary Protobuf, many streams multiplexed over one HTTP/2 connection — and keep REST and JSON at the public edge where browsers and debuggability matter.',
    reachFor:
      'High-volume internal RPC, polyglot services that need one shared contract, and bidirectional streaming between backends.',
    trap: "Wrong: 'gRPC is faster than REST.' Faster at what — name the mechanism. Say 'Protobuf is smaller and cheaper to parse than JSON, and HTTP/2 avoids a connection per call, which shows up at internal RPC volume and almost never at the edge.'",
  },
  protobuf: {
    name: 'Protocol Buffers',
    def: 'A binary serialization format defined by a schema: every field gets a number and a type, and the wire format carries the numbers rather than the names. Messages come out several times smaller than the equivalent JSON and decode without parsing text, while the schema hands every language the same generated types. The trade is that the bytes mean nothing without the schema, and compatibility depends on never reusing a field number.',
    say: 'Protobuf is schema-first binary encoding — field numbers instead of field names — so messages are several times smaller than JSON and decode without text parsing, at the cost of being unreadable on the wire.',
    reachFor:
      'Internal APIs at volume, event payloads on a stream, and anywhere serialization CPU or egress bandwidth actually appears in the budget.',
    trap: "Wrong: 'Protobuf saves bandwidth, so use it everywhere.' Say where the saving lands: 'at a million messages a second the size and parse cost is real money; on a page that loads twice, JSON's debuggability is worth more than the bytes.'",
  },
  webrtc: {
    name: 'WebRTC',
    def: 'A browser-native stack for peer-to-peer audio, video, and data: a signaling server introduces two clients, and then media flows directly between them over UDP. Taking the server out of the media path removes a hop and its bandwidth bill, which is what makes sub-200ms conversation feel like conversation. The complication is getting through NATs and firewalls — most calls need a STUN server to discover addresses, and some fall back to relaying through TURN, which puts the traffic back on your bill.',
    say: 'WebRTC is peer-to-peer media in the browser — a signaling server introduces the peers, then audio and video flow directly over UDP, so latency and my bandwidth bill both drop, except for the calls that have to relay through TURN.',
    reachFor:
      'Live voice and video calls, screen sharing, and low-latency peer data channels — small-group conversation, not one-to-many broadcast.',
    trap: "Wrong: 'it's peer-to-peer, so we don't need servers.' Say what stays: 'the media path is direct, but we still run signaling to introduce peers, STUN to discover addresses, and a TURN relay for the clients stuck behind restrictive NATs.'",
  },
  lasteventid: {
    name: 'Last-Event-ID',
    def: 'The resume mechanism built into server-sent events: the server tags each message with an id, the browser remembers the last one it saw, and on reconnect it sends that id back in a Last-Event-ID header so the server can replay what was missed. Without it every dropped connection is a silent gap in the stream. The client half is automatic; the server half is yours to build, because replay only works if recent events are still buffered somewhere.',
    say: 'SSE reconnects on its own and replays the gap through Last-Event-ID — the browser sends back the last id it saw — but that only works if the server kept a buffer of recent events to replay from.',
    reachFor:
      'Any feed or notification stream where a client dropping off Wi-Fi for ten seconds must not silently lose the updates it missed.',
    trap: "Wrong: 'SSE handles reconnection for us.' It reconnects; it does not backfill by itself. Say 'the browser resends Last-Event-ID automatically, so we keep the last N events per channel server-side and replay from that id.'",
  },

  /* ================= Storage & Data — spec 072, coverage-map §B.3 ================= */
  partitionkey: {
    name: 'Partition key',
    def: 'The field a distributed store hashes to decide WHICH node holds a row. It is fixed at table-creation time and is the only thing that routes a query straight to one machine — a query that cannot supply it fans out to every node instead. Choosing it wrong cannot be fixed with an index later; it is a rewrite, which is why it is the first schema decision rather than the last.',
    say: "I pick the partition key by asking what every read already knows, because a query that supplies it hits one node and a query that doesn't fans out to all of them.",
    reachFor:
      'Any wide-column or key-value store (Cassandra, DynamoDB), and any sharding conversation — "what is the partition key?" is the question that exposes whether a design actually spreads.',
    trap: "Wrong: 'we'll partition by timestamp so the data stays ordered.' Every writer shares the current timestamp, so every write lands on one node. Say 'I partition on a high-cardinality value the reads already carry — user id, tenant id — and put time in the clustering key, where it sorts without concentrating writes.'",
  },
  clusteringkey: {
    name: 'Clustering key',
    def: 'The field or fields that sort rows INSIDE a partition, after the partition key has already chosen the node. Because that sort is physical layout on disk, a range query along the clustering key ("this user\'s last 50 messages") is one sequential read rather than a scan and a sort. It also means the orders you did not choose are expensive forever.',
    say: 'The partition key picks the node and the clustering key sorts the rows inside it, so "this user\'s most recent messages" becomes one sequential read instead of a sort.',
    reachFor:
      'Cassandra and DynamoDB table design, and every feed or time-series model: partition by the entity, cluster by time descending.',
    trap: "Wrong: 'we can sort by another column later.' Sort order inside a partition is physical, not a query option. Say 'the clustering key IS the on-disk order — any other ordering means reading the whole partition and sorting it in memory.'",
  },
  vnode: {
    name: 'Virtual node',
    def: 'Instead of giving each physical machine one position on the hash ring, you give it many small ones — typically 128 to 256. Load then averages across many small arcs rather than depending on where one random position happened to land, and when a machine dies its arcs are absorbed by many different neighbours instead of dumping entirely onto one. The cost is bookkeeping: the ring now tracks thousands of entries instead of dozens.',
    say: 'Virtual nodes give each machine hundreds of small arcs on the ring instead of one big one, so load averages out and a failure spreads across every neighbour rather than doubling one of them.',
    reachFor:
      'Cassandra and Dynamo-style rings, and any consistent-hashing answer where the follow-up is about imbalance or about what happens when a node dies.',
    trap: "Wrong: 'consistent hashing spreads load evenly.' With one position per node it does not — random placement leaves arcs of wildly different sizes. Say 'consistent hashing bounds how much data MOVES when the topology changes; virtual nodes are what make the distribution even.'",
  },
  hashslot: {
    name: 'Hash slot',
    def: "Redis Cluster's alternative to a continuous ring: the key space is cut into a fixed 16,384 slots, every key hashes into exactly one, and slots are assigned to nodes. Rebalancing means handing whole slots between nodes, so the topology is a small explicit table every client caches rather than a ring computation. A fixed slot count turns routing into a lookup.",
    say: 'Redis Cluster hashes every key into one of 16,384 fixed slots and assigns slots to nodes, so rebalancing is moving slots and clients just cache the slot table.',
    reachFor:
      'Explaining Redis Cluster specifically, or contrasting a fixed-slot scheme against a continuous hash ring when asked how rebalancing actually works.',
    trap: "Wrong: 'Redis Cluster uses consistent hashing.' It uses a fixed slot map — the same goal reached by a different mechanism. Say 'it hashes into 16,384 slots and migrates slots between nodes, which bounds movement without a ring.'",
  },
  sstable: {
    name: 'SSTable',
    def: 'A Sorted String Table: an immutable file of key-value pairs written out in sorted order when a memtable fills. Immutability is the whole point — nothing is ever modified in place, so writes stay sequential and readers never need a lock. The cost is that one key\'s history can be spread across many SSTables, so a single read may have to consult several files.',
    say: 'An SSTable is an immutable sorted file flushed from memory, so writes stay sequential and readers never block, at the cost of a read possibly checking several files.',
    reachFor:
      'LSM internals — Cassandra, RocksDB, LevelDB — whenever the question is why write-optimized engines absorb writes so much faster than B-trees.',
    trap: "Wrong: 'the SSTable gets updated.' It never does; an update appends a newer entry and compaction resolves it later. Say 'updates and deletes are appends — the newest version wins at read time, and compaction eventually drops the older ones.'",
  },
  memtable: {
    name: 'Memtable',
    def: 'The in-memory sorted structure an LSM engine writes into first, before anything reaches disk. It absorbs writes at RAM speed and keeps them in order, so the eventual flush is one sequential write of a whole SSTable. Durability does not rest on it — the write-ahead log is fsynced first, so a crash replays the log rather than losing the buffer.',
    say: 'Writes land in an in-memory sorted memtable backed by a fsynced write-ahead log, and when it fills it flushes to disk as one sequential SSTable.',
    reachFor:
      'Explaining where an LSM\'s write speed actually comes from, and where its durability actually comes from — two different components people merge into one.',
    trap: "Wrong: 'the memtable makes the write durable.' It is volatile memory. Say 'the write-ahead log is what makes the write durable and the memtable is what makes it fast — they are written together, which is why the write is both.'",
  },
  compaction: {
    name: 'Compaction',
    def: 'The background job that merges SSTables, keeps only the newest version of each key, and physically drops the tombstones left by deletes. It is what keeps read amplification bounded — without it every read would consult an ever-growing pile of files. It is also where an LSM pays for its cheap writes: the same data is rewritten several times over its life, consuming disk bandwidth that competes with live traffic.',
    say: 'Compaction merges SSTables in the background to bound how many files a read must check, and it is where an LSM actually pays for its cheap writes.',
    reachFor:
      'Any LSM performance question — latency spikes with no traffic change, disk usage that will not fall after a mass delete, or the size-tiered versus leveled trade-off.',
    trap: "Wrong: 'deleting rows frees the space.' A delete is a tombstone — a marker — and the space returns only when compaction runs. Say 'deletes are writes; the space comes back at compaction, which is why a deletion-heavy workload can temporarily grow.'",
  },
  bloomfilter: {
    name: 'Bloom filter',
    def: 'A small probabilistic bit array that answers one question: is this key definitely NOT in this file? It can say "maybe" when the answer is no (a false positive) but never says "no" when the answer is yes, and that asymmetry is exactly what a read path needs — a negative answer skips a disk read with certainty. A few bits per key buys the ability to skip most files without touching them.',
    say: 'A bloom filter tells me a key is definitely not in this file and never that it definitely is, so an LSM read skips most SSTables for a few bits per key.',
    reachFor:
      'LSM read-path mitigations, and any "how do we avoid a disk trip just to learn nothing was there?" question — including cache-penetration defenses.',
    trap: "Wrong: 'the bloom filter tells us whether the key exists.' It only rules keys OUT. Say 'a negative is certain and a positive is a maybe, so it eliminates disk reads for absent keys and costs one wasted lookup at the false-positive rate.'",
  },
  compositeindex: {
    name: 'Composite index',
    def: 'One index over several columns in a declared order: rows are sorted by the first column, then by the second within it, and so on. Because the sort is nested, the index serves a query only from a leading PREFIX of its columns — an index on (tenant, created_at) helps a query filtering on tenant, but not one filtering only on created_at. Ordered well, a single composite index satisfies a filter and its sort in one traversal.',
    say: 'A composite index sorts by its columns in order so it serves any leading prefix, and one built as filter-column-then-sort-column answers both halves of the query in a single traversal.',
    reachFor:
      'Query tuning wherever a filter and an ORDER BY appear together, and the perennial "why is my index not being used?" question.',
    trap: "Wrong: 'I indexed both columns, so the query is covered.' Two separate indexes are not a composite one, and a composite one cannot be entered from its second column. Say 'the leading-prefix rule decides usability — equality filter first, sort column next.'",
  },
  coveringindex: {
    name: 'Covering index',
    def: 'An index that already contains every column a particular query needs, so the engine answers from the index and never fetches the row from the heap. That removes one random I/O per result row — the expensive half of an index scan. The price is duplication: those columns are now stored twice and rewritten on every update.',
    say: 'A covering index carries every column the query returns, so the engine answers from the index alone and skips the random heap fetch entirely.',
    reachFor:
      'One proven-hot, narrow, high-volume query where the heap fetch dominates the cost — and only after measuring that it does.',
    trap: "Wrong: 'add covering indexes for speed.' Every covered column is stored twice and maintained on every write. Say 'it is a targeted optimization justified by removing a measured heap fetch, not a default — the modern take is that it is a niche win.'",
  },
  partialindex: {
    name: 'Partial index',
    def: "An index built over only the rows matching a condition — WHERE status = 'pending'. When the interesting rows are a thin slice of a huge table, the index is a fraction of the size, stays resident in memory, and skips maintenance entirely for every row outside the condition. It helps only queries whose predicate the planner can prove the condition covers.",
    say: "A partial index covers only the rows matching a condition, so a job table's few pending rows get a tiny hot index instead of one spanning millions of finished rows.",
    reachFor:
      'Queue-like tables, soft-deleted tables, and any workload whose queries always filter on the same small, stable subset.',
    trap: "Wrong: 'just index the status column.' On a table that is 99% 'done' that index is mostly dead weight, and the planner may skip it. Say 'I would make it partial on the pending rows — small enough to stay in memory, and no maintenance cost for completed rows.'",
  },
  materializedview: {
    name: 'Materialized view',
    def: 'A query result stored as a real table and refreshed on a schedule or on write, rather than recomputed per request. It moves an expensive aggregation off the read path and onto a background job, which is what makes dashboards fast. What you give up is freshness: the view is exactly as stale as its last refresh, and the refresh itself is load you have to schedule.',
    say: 'A materialized view stores a query result as a table refreshed in the background, trading freshness for a read that no longer recomputes the aggregate.',
    reachFor:
      'Dashboards, leaderboards, and rollups where the same expensive aggregation is read constantly and a minute of staleness costs nothing.',
    trap: "Wrong: 'a materialized view keeps the numbers up to date.' It is a cache with a refresh policy. Say 'reads see the last refresh, so I would state the staleness window out loud — that window is the entire trade.'",
  },
  rtree: {
    name: 'R-tree',
    def: 'A spatial index that groups nearby objects into bounding rectangles, then groups those rectangles into larger ones, building a tree fitted to where the data actually is. Unlike a fixed grid it adapts to density, and unlike a geohash it indexes SHAPES — polygons and lines, not only points. The catch is that sibling rectangles may overlap, so one search can be forced down several branches.',
    say: 'An R-tree nests bounding rectangles fitted to the data so it can index polygons as well as points, but overlapping boxes mean a search sometimes has to descend more than one branch.',
    reachFor:
      'PostGIS, and any query mixing points with regions — "which delivery zones contain this address?" — where a geohash\'s point-only model runs out.',
    trap: "Wrong: 'an R-tree is basically a quadtree.' A quadtree subdivides SPACE on fixed quadrants; an R-tree groups OBJECTS into fitted boxes and tolerates overlap. Say 'quadtrees split space, R-trees group objects — which is why R-trees handle polygons and can search multiple branches.'",
  },
  docvalues: {
    name: 'Doc values',
    def: "Elasticsearch's column-oriented copy of a field, written to disk beside the inverted index. The inverted index answers \"which documents contain this term?\", but sorting, aggregating, and faceting need the opposite direction — \"what value does THIS document have?\" — and doc values supply it without loading the field into heap memory. Two layouts of the same data, each serving the direction of access it is good at.",
    say: 'The inverted index maps a term to documents and doc values store the same field column-wise for the reverse lookup, which is what lets a search engine sort and aggregate without exhausting the heap.',
    reachFor:
      'Explaining how a search engine also does analytics, or why a field has to be explicitly enabled before you can aggregate on it.',
    trap: "Wrong: 'the inverted index handles the sorting too.' It maps terms to documents, which is precisely backwards for sorting. Say 'matching reads the inverted index and sorting or aggregating reads doc values — a column-oriented copy of the same field.'",
  },
  lastwritewins: {
    name: 'Last write wins (LWW)',
    def: 'A conflict-resolution rule for concurrent writes to the same key on different replicas: stamp each write with a timestamp and keep the highest one. It needs no coordination and always converges, which is why AP systems default to it. It also silently DISCARDS the other write, so a concurrent increment or a merge is simply lost — and "last" means by clock, which can be skewed between nodes.',
    say: 'Last-write-wins resolves replica conflicts by keeping the highest timestamp, which always converges and silently throws the losing write away.',
    reachFor:
      'Cassandra and Dynamo-style stores, and any AP design where you must state out loud what happens when two replicas take the same key at once.',
    trap: "Wrong: 'conflicting writes get merged.' LWW does not merge, it discards — and it decides by a clock that may be skewed. Say 'LWW keeps the newest timestamp and drops the other write, so anything that must accumulate needs a CRDT or an append-only model instead.'",
  },
  hintedhandoff: {
    name: 'Hinted handoff',
    def: 'When a replica is unreachable, the coordinating node accepts the write anyway and stores a "hint" — a note recording who this was meant for — then delivers it once that node returns. It keeps writes available across a brief outage without blocking on repair. It is best-effort: hints expire after a window, and a node down longer than that needs a full anti-entropy repair instead.',
    say: "Hinted handoff lets a coordinator accept a write for a node that's down and replay it on recovery, which keeps writes available through short outages.",
    reachFor:
      'Cassandra availability questions, and any AP answer that needs to describe what concretely happens during a node failure rather than in principle.',
    trap: "Wrong: 'hinted handoff guarantees every replica eventually gets the write.' Hints have a time limit and die with the coordinator that holds them. Say 'it covers short outages; past the hint window you depend on read repair and anti-entropy to reconcile.'",
  },
  scattergather: {
    name: 'Scatter-gather',
    def: 'A query pattern where a coordinator sends the request to every shard, waits for all of them, and merges what comes back. It is precisely what a query without the partition key costs. Its latency is the SLOWEST shard\'s rather than the average, so adding shards makes the tail worse, and the merge, sort, and pagination all land on the coordinator.',
    say: "A query without the partition key scatters to every shard and gathers the results, so its latency is the slowest shard's and it gets worse as you add shards.",
    reachFor:
      'Explaining why the partition key matters, or why search and analytics fan-outs have such bad tail latency.',
    trap: "Wrong: 'more shards means faster queries.' For scatter-gather it means more chances to hit a slow one. Say 'sharding speeds up queries that carry the partition key and slows down every query that does not.'",
  },
  isolationlevel: {
    name: 'Isolation level',
    def: 'The setting that decides which concurrency anomalies a transaction is permitted to see: read committed, repeatable read, snapshot, serializable. Each level up removes a class of anomaly and costs more locking or more aborts. The default is not the strongest — Postgres ships read committed — so the anomalies your code quietly assumes away are usually still allowed unless you asked for otherwise.',
    say: 'The isolation level decides which anomalies are permitted, and since the default is read committed rather than serializable, the guarantees I want have to be requested.',
    reachFor:
      'Any transaction-correctness question — double booking, inventory, balance transfers — where you have to say what the database actually promises rather than what ACID implies.',
    trap: "Wrong: 'transactions are ACID, so this is safe.' The I is a dial, not a guarantee. Say 'at read committed this specific anomaly is allowed, so I would raise the level or take an explicit lock, and name what that costs.'",
  },
  serializable: {
    name: 'Serializable',
    def: 'The strongest isolation level: the outcome must equal SOME order in which the transactions ran one at a time. It is the only level that rules out every anomaly — including the ones you did not anticipate, like write skew — without you having to enumerate them. Databases reach it either by locking more or by detecting conflicts and aborting, so the cost appears as reduced concurrency or as transactions the client must retry.',
    say: 'Serializable means the result matches some order in which the transactions ran one at a time, which is the only level that rules out anomalies I did not think to look for.',
    reachFor:
      'Correctness-critical invariants that span rows — ledgers, seat allocation, shift coverage — where being wrong costs more than being slow.',
    trap: "Wrong: 'we will just run everything serializable.' It buys correctness with aborts or lock contention, and the application must handle the retries. Say 'I would use it where an invariant spans rows, and budget for serialization failures the client retries.'",
  },
  writeskew: {
    name: 'Write skew',
    def: 'Two transactions read the same rows, each concludes its own change is fine, and each writes DIFFERENT rows — so no row is ever contended, neither blocks the other, and both commit. The invariant that spanned those rows is now broken: both on-call doctors go off shift, because each saw the other still on. Since there is no shared row to lock, version, or compare, snapshot isolation cannot detect it and neither can a per-row compare-and-set — that absence is exactly why the cheaper tools miss it.',
    say: 'Write skew is two transactions reading the same rows and writing different ones, so nothing conflicts row by row while the invariant across them breaks.',
    reachFor:
      'Any invariant that lives across rows rather than in one — "at least one person on call", "the total stays under budget", "no two bookings overlap".',
    trap: "Wrong: 'we version the row, so concurrent updates are safe.' There is no shared row to version — that is the entire anomaly. Say 'write skew needs serializable isolation or an explicit lock on the predicate, because a per-row compare-and-set has nothing to compare against.'",
  },

  /* ================= Queues & Streams — spec 072, coverage-map §B.3 ================= */
  offset: {
    name: 'Offset',
    def: "A consumer's position in a partition's log, stored as a single number: I have processed up to message 4,812. Because the log is immutable and the position belongs to the consumer, replaying history is just moving that number backwards, and several consumers can read the same partition at different positions without interfering. It also makes delivery progress the consumer's responsibility rather than the broker's.",
    say: "A consumer's offset is just its position in the log, so replaying is moving the number backwards and two consumers can read the same partition independently.",
    reachFor:
      'Kafka and any log-based stream, especially the "how would we reprocess history?" and "what happens when a consumer crashes?" follow-ups.',
    trap: "Wrong: 'the broker deletes the message once it has been consumed.' A log broker deletes by retention, not by acknowledgment. Say 'consumers track an offset and the data stays until retention expires — which is exactly what makes replay possible.'",
  },
  consumergroup: {
    name: 'Consumer group',
    def: 'A set of consumers sharing the work of a topic, with each partition assigned to exactly one member. Adding members adds parallelism up to the partition count and not one consumer further; a member that dies has its partitions reassigned to the survivors, which is a rebalance. Two different groups reading the same topic each receive every message, which is how one stream feeds many independent pipelines.',
    say: 'A consumer group splits partitions across its members so each partition has exactly one reader, which caps parallelism at the partition count and gives every separate group a full copy of the stream.',
    reachFor:
      'Sizing consumers against partitions, and explaining how one event stream fans out to several services without duplicating the stream.',
    trap: "Wrong: 'we will add consumers to catch up faster.' Past the partition count the extra members sit idle. Say 'partitions set the parallelism ceiling, so scaling consumers means planning the partition count first.'",
  },
  watermark: {
    name: 'Watermark',
    def: "A stream processor's running assertion that no event older than time T will still arrive — which is what lets it decide a time window is finished and emit a result. It exists because events arrive out of order and late, so \"the window is over\" is a judgment rather than a fact. Set it aggressively and you emit sooner and drop more late data; set it conservatively and you are more complete and slower.",
    say: 'A watermark is the processor asserting that nothing older than this timestamp is still coming, which is what lets it close a window and emit — trading completeness against latency.',
    reachFor:
      'Flink and any event-time processing question, especially the immediate follow-up about late-arriving data.',
    trap: "Wrong: 'we window by when the event was received.' Processing time makes the answer depend on your infrastructure's hiccups rather than on reality. Say 'I would window on event time with a watermark, and decide explicitly whether late events are dropped or trigger an update.'",
  },
  windowing: {
    name: 'Windowing',
    def: 'Cutting an unbounded stream into finite chunks so an aggregation has something to finish: tumbling windows are fixed and non-overlapping, sliding windows are fixed and overlapping, session windows are bounded by a gap in activity. The choice decides both what the number MEANS and how much state the processor must hold at once. Windows are the reason a stream can answer "how many in the last five minutes" at all.',
    say: 'Windowing cuts an endless stream into finite pieces — tumbling, sliding, or session — so an aggregate finally has a boundary it can complete at.',
    reachFor:
      'Any streaming aggregation: rate limits, real-time metrics, fraud rules evaluated over a recent interval.',
    trap: "Wrong: 'we aggregate the stream.' Aggregating an unbounded stream never terminates. Say 'five-minute tumbling windows on event time' — which also tells your listener how much state each operator has to hold.",
  },
  checkpoint: {
    name: 'Checkpoint',
    def: "A periodic, consistent snapshot of a stream processor's in-flight state together with its input positions, written to durable storage. After a failure the job restarts from the last checkpoint and replays its input from the recorded offsets, which is how exactly-once semantics survive a crash. The interval is a direct trade: more often means less replay after a failure and more overhead in steady state.",
    say: 'A checkpoint snapshots operator state together with the input offsets, so a crashed job resumes from that point and replays rather than starting over.',
    reachFor:
      "Flink's exactly-once story, and any stateful stream job where you must explain what happens when a worker dies mid-window.",
    trap: "Wrong: 'the job is stateless, so checkpoints do not matter.' Any aggregation, join, or window IS state. Say 'checkpointing state and offsets together is what makes recovery consistent — restore one without the other and you double-count or lose data.'",
  },
  compensation: {
    name: 'Compensating transaction',
    def: 'An action that semantically undoes a step that already committed, when a later step in the workflow fails: refund the charge, release the seat, restock the item. It is not a rollback — the original effect really happened and may already have been seen, so the compensation is itself a new and visible business event. Every step in a saga needs one designed up front, and some steps (an email that went out) cannot be compensated at all.',
    say: 'A compensating transaction semantically undoes a step that already committed — a refund rather than a rollback — because in a distributed workflow the effect was real and visible.',
    reachFor:
      'Sagas and any cross-service workflow — book the flight, the hotel, the car — where a distributed transaction is not on the table.',
    trap: "Wrong: 'we roll the saga back.' There is nothing to roll back; every step committed independently. Say 'each step ships with a compensating action, and I would order the steps so the hardest one to compensate runs last.'",
  },
  choreography: {
    name: 'Choreography',
    def: 'A saga style with no coordinator: each service reacts to events other services publish and emits its own. It stays decoupled and has no central point of failure, so adding a participant is cheap. The cost is that the workflow exists nowhere as a single artifact — understanding it means tracing events across services, and so does debugging one that got stuck.',
    say: 'Choreography runs a workflow by having each service react to events with no coordinator, which keeps services decoupled and leaves the process itself written down nowhere.',
    reachFor:
      'Short workflows of two or three steps, and teams that must stay independently deployable more than they need central visibility.',
    trap: "Wrong: 'choreography scales better.' It decouples better; it does not observe better. Say 'past a few steps I move to orchestration, because with choreography nobody can answer where a given order is stuck.'",
  },
  orchestration: {
    name: 'Orchestration',
    def: 'A saga style where one coordinator holds the workflow definition, invokes each step, and decides what happens on failure. The process becomes an inspectable artifact: you can query where any instance sits, retry a single step, and read the whole state machine in one place. The cost is a component every participant depends on, which must itself be made durable.',
    say: 'Orchestration puts the workflow in one coordinator that calls each step and handles failures, so the process is inspectable and every instance\'s position is a query.',
    reachFor:
      'Workflows past about three steps, anything needing operational visibility, and anything with a compensation path a human may need to trigger by hand.',
    trap: "Wrong: 'the orchestrator is a single point of failure.' It is if you hand-build it as one — which is what durable execution engines exist to prevent. Say 'I would run the orchestrator on a durable workflow engine so its own state survives a crash.'",
  },
  durableexecution: {
    name: 'Durable execution',
    def: 'A runtime that records every step of a workflow — each call made and each result received — to a durable log, so a crashed process is resumed by REPLAYING that history to rebuild its exact state and then continuing from the first unfinished step. The workflow is written as ordinary sequential code that can wait days without occupying a process. It is not retrying: a retry re-runs work, while a replay reconstructs what already happened and never re-executes a completed step.',
    say: "A durable execution engine records each step's result and resumes a crashed workflow by replaying that history to the first unfinished step, so long-running code survives restarts without redoing completed work.",
    reachFor:
      'Long, stateful workflows with human waits or day-long delays — Temporal, Step Functions — where a process in memory or a cron table would be too fragile to trust.',
    trap: "Wrong: 'it just retries the workflow after a failure.' Retrying re-runs completed steps and double-charges the customer; replay does not. Say 'the engine replays the recorded history to rebuild state, then continues from the first step that never completed.'",
  },

  /* ================= Resilience — spec 072, coverage-map §B.3 ================= */
  compareandset: {
    name: 'Compare-and-set (CAS)',
    def: 'The single primitive underneath conditional writes, version checks, ETags, and optimistic concurrency: write this value only if the current value is still the one I read. One atomic operation both checks and updates, so two concurrent writers cannot both succeed — the loser is told to re-read and try again. Whether it appears as a version column, an If-Match header, a DynamoDB condition expression, or a Redis WATCH, it is the same move.',
    say: "Compare-and-set writes only if the value is still what I read, so concurrent writers cannot both win — one is told to retry, and that single atomic check-and-set is what optimistic concurrency is built out of.",
    reachFor:
      'Any lost-update problem where conflicts are rare — inventory decrements, profile edits, acquiring a distributed lock.',
    trap: "Wrong: 'we read it, check it, then write it.' Two separate operations leave a window in between where somebody else writes. Say 'the check and the write have to be one atomic compare-and-set — otherwise I have described the race, not the fix.'",
  },
  aba: {
    name: 'The ABA problem',
    def: "A compare-and-set only knows whether the value LOOKS unchanged. If another writer changed A to B and back to A while you were deciding, your compare-and-set succeeds even though the world moved underneath it, and you overwrite decisions made in between. The fix is to compare something that can never repeat — a version number, a sequence, a commit id. Values that only ever increase are immune by construction, because an old value can never come back to fool the comparison.",
    say: "ABA is a compare-and-set succeeding because the value returned to what I read while I was not looking, so I compare a monotonically increasing version instead — a number that only goes up can never repeat, so it cannot fool the check.",
    reachFor:
      'Lock-free structures, and any conditional write whose compared field can legitimately return to an earlier value — a status, a counter that moves both ways, a reused pointer or slot.',
    trap: "Wrong: 'we compare the value, so the write is safe.' Equality does not mean untouched. Say 'I compare a monotonic version rather than the value, because a version that only increases cannot be reused — which is exactly what closes the ABA hole.'",
  },
  pessimistic: {
    name: 'Pessimistic locking',
    def: 'Take the lock BEFORE reading, hold it while you decide, and release it after writing — SELECT ... FOR UPDATE. Conflicts become waiting instead of retrying, so a contended write succeeds on its first attempt rather than after several failed rounds. What you pay is concurrency plus a new operational risk: everyone behind the lock waits, and a holder that stalls stalls all of them.',
    say: 'Pessimistic locking takes the lock before reading so conflicts become waiting instead of retrying, which is what I want once contention is high enough that optimistic retries keep losing.',
    reachFor:
      'Hot single rows — the last ticket, one popular seat, a counter thousands of writers hit — where retry storms waste more work than a queue would cost.',
    trap: "Wrong: 'locks are slow, so always go optimistic.' Under high contention optimistic is slower, because every loser redoes its work. Say 'optimistic wins when conflicts are rare and pessimistic wins when they are common — the crossover is the actual conflict rate, which is measurable.'",
  },
  fencingtoken: {
    name: 'Fencing token',
    def: 'A monotonically increasing number issued with every lock grant, which the protected resource checks and refuses if it is lower than the highest it has already seen. It exists because a lock can EXPIRE while its holder is paused — in a garbage-collection pause or behind a partition — and that holder wakes up still believing it holds the lock. The token makes the stale writer fail at the resource, which no amount of correctness in the lock service can do on its own.',
    say: 'A fencing token is an increasing number handed out with each lock grant that the resource itself checks, so a holder whose lease quietly expired during a pause gets rejected when it finally writes.',
    reachFor:
      'Any distributed lock protecting a real side effect — a file write, a payment, a state transition — and the standard follow-up about what happens if the holder pauses.',
    trap: "Wrong: 'the lease expires, so the old holder cannot write.' The old holder does not know its lease expired. Say 'expiry alone is not safe — the resource has to reject the lower fencing token, or both holders write and one silently clobbers the other.'",
  },
  gossip: {
    name: 'Gossip protocol',
    def: 'Nodes learn cluster state by periodically exchanging what they know with a few randomly chosen peers, instead of consulting a central registry. Information spreads exponentially, so a change reaches the whole cluster in a logarithmic number of rounds with no coordinator and no single point of failure. What you give up is a consistent instant view: at any moment different nodes hold slightly different pictures of who is up.',
    say: 'Gossip spreads cluster membership by having each node swap state with a few random peers every second, so news reaches everyone in log-many rounds with no coordinator and no exact global view.',
    reachFor:
      'Cassandra and Dynamo-style membership, and any "how does the cluster notice a failure without a master?" question.',
    trap: "Wrong: 'the cluster knows that node is down.' Different nodes conclude it at different moments, which is why failure detection is a suspicion level rather than a boolean. Say 'gossip converges in seconds, so membership is eventually consistent — decisions that need agreement go through consensus instead.'",
  },
  splitbrain: {
    name: 'Split brain',
    def: 'A network partition leaves two halves of a cluster unable to see each other, each concludes the other is dead, and each elects its own leader. Both then accept writes, and both are behaving correctly from where they sit — so the damage lands at reconciliation, when two divergent histories have to be merged. The standard defense is a majority quorum, which at most one side can ever hold.',
    say: 'Split brain is a partition leaving two halves that each elect a leader and accept writes, which is why a majority quorum is the defense — only one side can ever hold a majority.',
    reachFor:
      'Any leader-election or failover design, and the "what if the network partitions?" question that CAP is really asking.',
    trap: "Wrong: 'we detect the partition and shut the other side down.' The other side is unreachable — that is what a partition means. Say 'a node cannot tell a partition from a failure, so I require a majority quorum to act and let the minority side go read-only.'",
  },
  ephemeral: {
    name: 'Ephemeral node',
    def: "A coordination-service entry (ZooKeeper, etcd) whose lifetime is tied to the session that created it: when the client stops heartbeating, the service deletes it automatically. That turns liveness into a data structure — presence in the tree IS the fact that the process is alive — so locks and memberships clean themselves up when a holder dies instead of deadlocking. The gap is the session timeout, during which a dead holder still appears alive.",
    say: "An ephemeral node disappears when its creator's session stops heartbeating, so a lock held by a crashed process releases itself instead of deadlocking forever.",
    reachFor:
      'ZooKeeper or etcd leader election, service registries, and distributed locks that have to survive their holder crashing.',
    trap: "Wrong: 'the lock is released the moment the process dies.' It is released once the session timeout expires, typically seconds later. Say 'release is bounded by the session timeout, and a holder that paused and resumed still needs a fencing token.'",
  },
  heartbeat: {
    name: 'Heartbeat',
    def: 'A periodic "I am alive" signal, whose ABSENCE rather than whose presence is the signal that matters. Because a missing heartbeat is indistinguishable from a slow network, the timeout is a guess: short timeouts detect failures quickly and declare healthy nodes dead, long ones are stable and leave a dead node taking traffic. Every failure detector in a distributed system is this same trade-off wearing a different name.',
    say: 'A heartbeat detects failure by its absence, so the timeout is a direct trade — short means fast detection and false positives, long means stability and a dead node still taking traffic.',
    reachFor:
      'Health checks, session timeouts, leader leases, consumer-group liveness — anywhere one thing has to notice that another thing stopped.',
    trap: "Wrong: 'the heartbeat tells us the node is healthy.' It tells you a thread got scheduled and the network worked; a node can heartbeat happily while failing every real request. Say 'I health-check the dependency path, not just the process, or I keep routing to a node that is up and useless.'",
  },
  loadshedding: {
    name: 'Load shedding',
    def: 'Deliberately rejecting a fraction of incoming work — quickly, cheaply, and by chosen priority — once demand exceeds capacity. The alternative is not serving everyone: it is a queue that grows until every request times out and the whole system fails at once. Shedding converts a total outage into a partial and chosen degradation, which is why it is a design decision rather than a failure.',
    say: 'Load shedding rejects excess work immediately and by priority, because the alternative to failing some requests fast is failing all of them slowly.',
    reachFor:
      'Sustained overload where a queue would grow without bound — a sale spike, a thundering herd, a downstream that just got slower.',
    trap: "Wrong: 'we will queue the extra requests.' A queue absorbs a burst, not a sustained overload; past capacity it only adds latency before the same failure. Say 'above capacity I shed — cheapest requests first, paying customers last — and return a retry-after rather than letting them time out.'",
  },
}

export type GlossaryKey = keyof typeof GLOSSARY

/* ---------------- Reference groups (README-v3 Phase 2) ----------------
   The Library's REFERENCE section renders every glossary term, organized into
   seven groups. Every key above appears in exactly one group (schema test);
   each group carries a channel accent assigned in the UI. */

export interface ReferenceGroup {
  id: string
  label: string
  keys: GlossaryKey[]
}

export const REFERENCE_GROUPS: ReferenceGroup[] = [
  {
    id: 'traffic',
    label: 'Requests & Traffic',
    keys: [
      'request', 'read', 'write', 'rps', 'readpct', 'burst', 'iot', 'phonehome',
      'util', 'throughput', 'p99', 'sla', 'lb', 'appserver', 'apigateway',
      'rest', 'pagination', 'autoscaling',
    ],
  },
  {
    // Spec 065: the transport floor. Every entry here carries say/reachFor/trap
    // (schema test); dns/tls/websocket/sse/polling moved in from the traffic and
    // caching groups with their keys unchanged, so existing <Term> refs still resolve.
    id: 'networking',
    label: 'Networking',
    keys: [
      'ip', 'rtt', 'tcp', 'udp', 'quic', 'handshake', 'headofline', 'dns', 'tls',
      'grpc', 'protobuf', 'websocket', 'sse', 'polling', 'lasteventid', 'webrtc',
    ],
  },
  {
    id: 'cpu',
    label: 'CPU & Memory',
    keys: ['core', 'pipeline', 'speculation', 'cpucache', 'cacheline', 'coherence', 'locality', 'virtualmemory'],
  },
  {
    id: 'caching',
    label: 'Caching & Delivery',
    keys: ['cache', 'hitrate', 'ttl', 'stampede', 'cdn', 'fanout'],
  },
  {
    id: 'storage',
    label: 'Storage & Data',
    keys: [
      'durable', 'wal', 'btree', 'lsm', 'index', 'gsi', 'invertedindex',
      'normalization', 'denormalization', 'join', 'acid', '2pc', 'optimistic',
      'nosql', 'blob', 'presigned', 'connpool', 'shard', 'hotpartition',
      'consistenthash', 'replica', 'replag', 'readyourwrites', 'cdc',
      'geohash', 'quadtree',
      // spec 072 (coverage-map §B.3): the storage bundle.
      'partitionkey', 'clusteringkey', 'vnode', 'hashslot', 'sstable', 'memtable',
      'compaction', 'bloomfilter', 'compositeindex', 'coveringindex', 'partialindex',
      'materializedview', 'rtree', 'docvalues', 'lastwritewins', 'hintedhandoff',
      'scattergather', 'isolationlevel', 'serializable', 'writeskew',
    ],
  },
  {
    id: 'queues',
    label: 'Queues & Streams',
    keys: [
      'queue', 'worker', 'backlog', 'backpressure', 'visibility', 'dlq',
      'stream', 'eventsourcing', 'idempotent', 'atleastonce', 'exactlyonce', 'saga',
      // spec 072 (coverage-map §B.3): the queues-and-streams bundle.
      'offset', 'consumergroup', 'watermark', 'windowing', 'checkpoint',
      'compensation', 'choreography', 'orchestration', 'durableexecution',
    ],
  },
  {
    id: 'resilience',
    label: 'Resilience',
    keys: [
      'errorbudget', 'timeout', 'retry', 'ratelimit', 'breaker', 'bulkhead',
      'herd', 'failover', 'bluegreen', 'canary', 'cap', 'consistency',
      'consensus', 'quorum', 'leader', 'distlock', 'lease',
      // spec 072 (coverage-map §B.3): the resilience bundle.
      'compareandset', 'aba', 'pessimistic', 'fencingtoken', 'gossip',
      'splitbrain', 'ephemeral', 'heartbeat', 'loadshedding',
    ],
  },
]
