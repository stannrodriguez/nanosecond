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
  consistency: {
    name: 'Consistency',
    def: 'Whether every reader sees the same data at the same moment. Strong consistency means a read after a write always shows the write — which requires copies to coordinate BEFORE answering, and coordination costs round trips. Eventual consistency answers immediately from whatever a copy has, and copies converge later. The choice is a latency-and-availability trade, not a correctness slider.',
  },
  consensus: {
    name: 'Consensus',
    def: 'The protocol family (Raft, Paxos) by which several machines agree on one value — who is leader, what order writes happened in — even while some of them crash. Agreement takes multiple round trips between a majority of nodes, which is WHY strongly-consistent cross-region writes cost ~150ms: two rounds × 70ms of geography. You pay consensus prices only where two truths would be catastrophic.',
  },
  failover: {
    name: 'Failover',
    def: "Promoting a replica to primary when the primary dies. It is never instant: detection takes seconds (is it dead or just slow?), promotion takes more, and clients must re-discover the new primary. Writes fail during the gap, and any writes the dead primary hadn't replicated yet are lost or need reconciling — which is why failover is rehearsed, not assumed.",
  },
  ttl: {
    name: 'TTL (time to live)',
    def: 'An expiry stamp on a cached value: after this long, throw it away and refetch. Short TTLs mean fresher data but more misses hitting the database; long TTLs mean staleness. The subtle trap: many keys expiring at the SAME second creates a synchronized miss storm — which is why real systems add random jitter to TTLs.',
  },
  wal: {
    name: 'Write-ahead log (WAL)',
    def: "The database's crash insurance: before changing any data structure, append the intent to a sequential log and fsync it. If the machine dies mid-write, replay the log. It works because appending is the one thing disks do fast — and it is the reason every durable write costs a sequential disk flush, bounding a primary to thousands (not millions) of writes/s.",
  },
  lsm: {
    name: 'LSM-tree',
    def: 'A storage engine (Cassandra, RocksDB, LevelDB) that never overwrites in place: writes go to a memory buffer, then flush as sorted immutable files that background jobs merge. Writes become pure sequential appends — very fast — while reads may check several files (read amplification). Choose it when writes dominate; that is the trade.',
  },
  btree: {
    name: 'B-tree',
    def: 'The classic database index (Postgres, MySQL): a wide, shallow tree where each node is one disk page, so any row is ~3–4 page reads away. Reads are fast and predictable; writes must find and update pages in place, costing random I/O. The B-tree/LSM choice is literally "optimize reads or optimize writes" — same data, opposite physics.',
  },
  gsi: {
    name: 'Secondary index (GSI)',
    def: "An extra copy of your table sorted by a DIFFERENT key, so you can query by something other than the primary key. In distributed stores (DynamoDB's Global Secondary Index) it is literally a second table the system keeps in sync — meaning every write now costs two writes, and the index copy can lag. Indexes are not free lookups; they are bought with write amplification.",
  },
  cdc: {
    name: 'Change data capture (CDC)',
    def: "Tapping the database's own replication log and streaming every committed change to other systems (search indexes, caches, warehouses). It beats dual-writing from the app because the log is the truth: nothing is missed, order is preserved, and consumers can replay. The cost: downstream systems are eventually consistent by construction.",
  },
  fanout: {
    name: 'Fan-out',
    def: 'One incoming event triggering many outgoing operations — one tweet written to a million follower timelines, one request calling six microservices. Fan-out multiplies load invisibly: 1k posts/s × 500 followers = 500k timeline writes/s. Every feed design is a choice between fan-out-on-write (pay when posting) and fan-out-on-read (pay when reading), priced by the follower distribution.',
  },
  backpressure: {
    name: 'Backpressure',
    def: 'What a system does when a producer is faster than a consumer and the buffer between them is full: block the producer, shed (drop) work, or degrade. The alternative — an unbounded buffer — just converts overload into memory exhaustion and a later, bigger crash. Deciding WHERE to say no, and to whom, is a design decision, not an accident.',
  },
  ratelimit: {
    name: 'Rate limiting',
    def: 'Refusing requests beyond a quota (per user, per IP, per API key) BEFORE they consume real capacity — usually with token buckets. It converts unbounded abuse or retry storms into a clean, predictable 429. Protecting the write path with a limiter is often cheaper than provisioning for the worst client you will ever meet.',
  },
  dns: {
    name: 'DNS',
    def: 'The phone book of the internet: turns a name (api.example.com) into IP addresses, resolved through a hierarchy of caches with TTLs. It adds a lookup (~1–100ms when not cached) to first connections, and it is a control surface: changing a DNS answer is how traffic gets steered between regions — at the speed of cache expiry, not instantly.',
  },
  tls: {
    name: 'TLS handshake',
    def: 'The certificate-and-key exchange that upgrades a TCP connection to encrypted HTTPS. It costs 1–2 extra round trips BEFORE the first byte of your request — 100–200ms for a far-away user. That per-connection tax is why connection reuse (keep-alive, HTTP/2) and terminating TLS at a nearby edge matter so much.',
  },
  connpool: {
    name: 'Connection pool',
    def: 'A small set of pre-opened database connections that many app threads share, because connections are expensive for the DATABASE (memory and a process/thread each; Postgres degrades past a few hundred). 10,000 concurrent users do not get 10,000 connections — they queue briefly for ~100 pooled ones. When the pool is exhausted, requests wait: the pool is a queue, with all the queue math attached.',
  },
  herd: {
    name: 'Thundering herd',
    def: 'Thousands of clients acting in perfect sync — reconnecting after a network blip, retrying on the same backoff schedule, or hammering one just-expired cache key. Each client behaves reasonably; the SYNCHRONIZATION is the weapon. Defenses all break the sync: random jitter on retries and TTLs, staggered reconnects, dogpile locks.',
  },
  breaker: {
    name: 'Circuit breaker',
    def: 'A wrapper that watches calls to a dependency and, after enough failures, OPENS: further calls fail instantly instead of waiting on timeouts. This frees your threads, sheds load off the sick dependency so it can recover, and periodically lets a probe through to test recovery. It converts "one slow service drags down everything" into "one feature degrades".',
  },
  bulkhead: {
    name: 'Bulkhead',
    def: "Ship-hull thinking for capacity: give each dependency or tenant its own bounded pool (threads, connections, queue slots) so one flooding compartment can't sink the whole vessel. Without bulkheads, a slow payments API quietly consumes every thread and takes checkout, search, and login down with it. Isolation is cheap; shared-everything failure is not.",
  },
  bluegreen: {
    name: 'Blue-green deploy',
    def: 'Run two identical environments: blue serves traffic while you deploy to green, then flip the router. Rollback is flipping back — seconds, not a re-deploy. The costs: double the hardware during the window, and the databases are shared, so schema changes must stay compatible with BOTH versions. It buys instant, boring rollbacks.',
  },
  canary: {
    name: 'Canary deploy',
    def: 'Ship the new version to a tiny slice (1–5%) of traffic, watch error rates and latency, then widen or roll back. Named for the coal-mine bird: a small sacrifice detects the poison before everyone breathes it. The catch is representativeness — a 1% canary can miss bugs that only appear at full load or for specific user cohorts.',
  },
  cap: {
    name: 'CAP theorem',
    def: 'During a network partition, a distributed system must choose: refuse some requests (consistency) or answer with possibly-stale data (availability). Not a buzzword — a proof, and really a statement about geography: partitions WILL happen between regions. The practical question in interviews is per-operation: which requests may be stale, which must never be?',
  },
  quorum: {
    name: 'Quorum',
    def: 'Requiring a majority (e.g. 2 of 3, 3 of 5) of replicas to acknowledge a write or serve a read, so any two majorities overlap in at least one node that has the latest value. This is HOW systems stay consistent while surviving minority failures — and why replica counts are odd, and why every quorum write costs a round trip to the slowest majority member.',
  },
  leader: {
    name: 'Leader election',
    def: 'Picking exactly ONE node to accept writes, so ordering has a single source of truth; done with consensus so a network split cannot crown two leaders (split-brain). The subtle cost: during an election — triggered exactly when things are already failing — there is no leader, and writes stall. Systems are designed around how short that gap can be made.',
  },
  exactlyonce: {
    name: 'Exactly-once',
    def: 'The guarantee everyone asks for and no network can natively give: a message delivered and PROCESSED precisely one time. Real systems fake it honestly — at-least-once delivery plus idempotent processing (dedup by operation ID), so duplicates arrive but have no second effect. When a vendor says exactly-once, look for where the idempotency key lives.',
  },
  atleastonce: {
    name: 'At-least-once',
    def: 'The workhorse delivery guarantee: keep retrying until acknowledged, so nothing is lost — but the SAME message may arrive twice (the ack, not the message, may be what got lost). The moment you accept at-least-once, duplicates are not a bug but a promise; every consumer must be idempotent. The alternative, at-most-once, trades duplicates for silent loss.',
  },
  visibility: {
    name: 'Visibility timeout',
    def: "A queue's crash insurance: receiving a message HIDES it (rather than deleting it) for a window while you work. Finish and delete it, and it's gone forever; crash, and the timeout expires and the message reappears for another worker. Set it longer than your slowest processing time — too short and healthy work gets double-processed.",
  },
  dlq: {
    name: 'Dead-letter queue',
    def: "Where messages go after failing N processing attempts, so one poison message (malformed, or hitting a bug) can't clog the queue being retried forever while healthy work backs up behind it. The DLQ is also your forensic record: it converts 'we kept crashing all night' into 'here are the 14 exact messages that failed — replay them after the fix'.",
  },
  hotpartition: {
    name: 'Hot partition',
    def: "One shard receiving wildly more traffic than its siblings because many writers compute the SAME partition key — a timestamp bucket, today's date, a viral post's ID. The cluster is huge and mostly idle while one node melts; total capacity means nothing, per-key capacity is what saturates. Defense: salt or compose keys so concurrent writers spread out.",
  },
  readyourwrites: {
    name: 'Read-your-own-writes',
    def: "The consistency promise users actually notice: after I save, MY next read shows my change — even if strangers can see stale data a moment longer. Replication lag breaks it (write to primary, read from a lagging replica: my comment 'vanished'). Fixes: pin a user's reads to the primary briefly after their write, or route by session.",
  },
  replag: {
    name: 'Replication lag',
    def: "The delay between a write committing on the primary and appearing on a replica — milliseconds normally, unbounded under load (lag is a queue, and queues explode past the knee). It is the fine print on 'just add replicas': every read from a replica is a read of the recent past. Design question: which reads tolerate that, and which must not?",
  },
  cdn: {
    name: 'CDN',
    def: 'Servers in hundreds of cities that cache your content near users, because no engineering beats moving the data 2,000 km closer (cross-region RTT is physics). A CDN can absorb most read traffic before it ever reaches your stack — often the single cheapest capacity money can buy. Only helps cacheable responses; personalized and write traffic still travels to you.',
  },
  autoscaling: {
    name: 'Autoscaling',
    def: 'Rules that add or remove servers based on load signals (CPU, queue depth, request rate). It handles RAMPS beautifully and SPIKES poorly: new instances take minutes to boot and warm up, and a 10-second surge is over before help arrives. That gap is why queues, caches, and headroom still exist in autoscaled systems.',
  },
  index: {
    name: 'Index',
    def: 'A sorted copy of chosen columns that turns "scan a billion rows" into "walk a tree in a few page reads". The price is paid on the write path: every insert must also update every index, and each index is more storage and more write amplification. Indexes are the canonical read-vs-write trade, one table at a time.',
  },
  throughput: {
    name: 'Throughput vs latency',
    def: "Throughput is how much per second; latency is how long one request takes. They are different axes and they fight: batching raises throughput while adding waiting, and pushing utilization toward 100% maximizes throughput while queueing destroys latency. Always ask which one the requirement actually names — 'fast' is not a number.",
  },
  timeout: {
    name: 'Timeout',
    def: "How long you'll wait on a dependency before giving up. No timeout means a slow dependency silently holds your threads until everything upstream is stuck — slowness spreads farther than errors do. Timeouts must shrink as calls go deeper (the caller's budget bounds the callee's), and every timeout needs a decided fallback: retry, degrade, or fail.",
  },
  retry: {
    name: 'Retry (with backoff + jitter)',
    def: 'The immune system of distributed systems: transient failures are common, so try again — waiting exponentially longer each time, with randomness so thousands of clients do not retry in lockstep (that synchronized wave is a self-inflicted thundering herd). Two rules make retries safe: the operation must be idempotent, and retries must be budgeted so they cannot multiply load during an outage.',
  },
}

export type GlossaryKey = keyof typeof GLOSSARY
