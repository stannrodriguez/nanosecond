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
  locality: {
    name: 'Locality',
    def: "The two access patterns that make caches work. Temporal locality is reusing the same data soon, while it is still cached; spatial locality is using data adjacent to what was just touched, because it arrived on the same cache line. Code with good locality can run 10× faster than identical code without it — same instructions, same data, different memory layout.",
  },
  replica: {
    name: 'Read replica',
    def: "A live copy of the database that receives every write from the primary and serves reads. Each replica adds read capacity — on the order of ~20k reads/s — without touching the write path. The copies lag slightly behind the primary, so a just-written comment may not appear on a replica for a moment.",
  },
  shard: {
    name: 'Shard',
    def: "Splitting data across multiple independent databases — users A–M on box 1, N–Z on box 2. It is how write capacity scales: replicas don't help writes, because every copy must apply every write, while each shard takes only its own share. The cost is that queries crossing shards become joins across machines, so sharding usually comes after caching and replication are exhausted.",
  },
  queue: {
    name: 'Queue',
    def: "A durable waiting line (Kafka, SQS) between accepting a write and processing it. The app appends a message in ~1ms and replies immediately; workers drain the line into the database at a rate the database can sustain. A burst then costs processing delay instead of capacity — the messages wait rather than overload the database.",
  },
  worker: {
    name: 'Worker',
    def: "A background process that pulls messages off the queue and does the deferred work (writing to the database, resizing the image). It serves no user directly, so it can run steadily at its own pace. Drain rate scales with the number of workers, which makes backlog recovery a provisioning knob rather than a redesign.",
  },
  backlog: {
    name: 'Backlog / lag',
    def: "Messages waiting in the queue because they arrive faster than workers drain them. A backlog that grows during a burst and shrinks afterward is the queue absorbing the burst. A backlog that never shrinks means the steady arrival rate exceeds drain capacity — the queue is then only deferring the overload, and either the workers or the downstream bottleneck have to grow.",
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
  },
  idempotent: {
    name: 'Idempotent',
    def: "An operation that is safe to repeat: doing it twice has the same effect as doing it once ('set status = PAID', unlike 'add $10'). At-least-once delivery guarantees occasional duplicates, so a retried operation is only safe when every side effect is idempotent — usually arranged with a unique operation ID the receiver remembers.",
  },
  stampede: {
    name: 'Cache stampede',
    def: "A hot key expires (or a cache restarts) and thousands of concurrent misses recompute the same answer against the database at once — the load spike is created by the cache's absence. The standard defenses all break the synchronization: a dogpile lock so one request recomputes while the rest wait, random jitter added to TTLs, and serving stale content while a refresh runs.",
  },
  consistency: {
    name: 'Consistency',
    def: "Whether every reader sees the same data at the same moment. Strong consistency means a read after a write always shows the write, which requires the copies to coordinate before answering — and coordination costs round trips. Eventual consistency answers immediately from whatever a copy has, and the copies converge later. The choice trades latency and availability against staleness, one operation at a time.",
  },
  consensus: {
    name: 'Consensus',
    def: "The protocol family (Raft, Paxos) by which several machines agree on one value — who is leader, what order writes happened in — even while some of them crash. Agreement takes multiple round trips among a majority of nodes, which is why a strongly-consistent cross-region write costs ~150ms: two rounds × ~70ms of geography. Consensus prices are paid only where two conflicting truths would be catastrophic.",
  },
  failover: {
    name: 'Failover',
    def: "Promoting a replica to primary when the primary dies. It is never instant: detection takes seconds — a dead node and a slow node look alike at first — promotion takes more, and clients must rediscover the new primary. Writes fail during the gap, and writes the dead primary had not yet replicated are lost or need reconciling, which is why failover is rehearsed rather than assumed.",
  },
  ttl: {
    name: 'TTL (time to live)',
    def: "An expiry stamp on a cached value: after this long, the cache discards it and the next lookup refetches. Short TTLs keep data fresher at the cost of more misses reaching the database; long TTLs invert the trade. Many keys expiring in the same second produce a synchronized miss storm, which is why real systems add random jitter to TTLs.",
  },
  wal: {
    name: 'Write-ahead log (WAL)',
    def: "The database's crash-recovery log: before changing any data structure, it appends the intended change to a sequential log and fsyncs it, so a crash mid-write is repaired by replaying the log. This works because sequential appends are the one thing disks do fast. It is also why every durable write costs a sequential flush, bounding a primary to thousands — not millions — of writes per second.",
  },
  lsm: {
    name: 'LSM-tree',
    def: "A storage engine (Cassandra, RocksDB, LevelDB) that never overwrites in place: writes go to a memory buffer, then flush as sorted immutable files that background jobs merge. Writes become pure sequential appends, which are fast; reads may have to check several files (read amplification). It is the engine that fits when writes dominate reads.",
  },
  btree: {
    name: 'B-tree',
    def: "The classic database index (Postgres, MySQL): a wide, shallow tree in which each node is one disk page, so any row is ~3–4 page reads away. Reads are fast and predictable; writes must find and update pages in place, paying random I/O. The B-tree/LSM choice is the read-optimized versus write-optimized fork — same data, opposite physics.",
  },
  gsi: {
    name: 'Secondary index (GSI)',
    def: "An extra copy of the table sorted by a different key, so queries can address something other than the primary key. In distributed stores (DynamoDB's Global Secondary Index) it is literally a second table the system keeps in sync: every write now costs two writes, and the index copy can lag. Indexes are paid for with write amplification, not conjured for free.",
  },
  cdc: {
    name: 'Change data capture (CDC)',
    def: "Tapping the database's own replication log and streaming every committed change to other systems — search indexes, caches, warehouses. It beats dual-writing from the app because the log is authoritative: nothing is missed, order is preserved, and consumers can replay history. The cost is that downstream systems are eventually consistent by construction.",
  },
  fanout: {
    name: 'Fan-out',
    def: "One incoming event triggering many outgoing operations — one tweet written to a million follower timelines, one request calling six microservices. Fan-out multiplies load invisibly: 1k posts/s × 500 followers = 500k timeline writes/s. Every feed design chooses between fan-out-on-write (pay when posting) and fan-out-on-read (pay when reading), priced by the follower distribution.",
  },
  backpressure: {
    name: 'Backpressure',
    def: "What a system does when a producer outruns a consumer and the buffer between them is full: block the producer, shed work, or degrade output. The alternative — an unbounded buffer — converts overload into memory exhaustion and a later, larger crash. Where to refuse work, and whose work to refuse, is a design decision; leaving it unmade is choosing the crash.",
  },
  ratelimit: {
    name: 'Rate limiting',
    def: "Refusing requests beyond a quota (per user, per IP, per API key) before they consume real capacity, usually with token buckets. It converts unbounded abuse and retry storms into a clean, predictable 429. Protecting the write path with a limiter is often cheaper than provisioning for the worst client the system will ever meet.",
  },
  dns: {
    name: 'DNS',
    def: "The naming system that turns a hostname (api.example.com) into IP addresses, resolved through a hierarchy of caches with TTLs. It adds a lookup — ~1–100ms when not cached — to first connections. It is also a control surface: changing a DNS answer is how traffic gets steered between regions, at the speed of cache expiry rather than instantly.",
  },
  tls: {
    name: 'TLS handshake',
    def: "The certificate-and-key exchange that upgrades a TCP connection to encrypted HTTPS. It costs 1–2 extra round trips before the first byte of the request — 100–200ms for a far-away user. That per-connection tax is why connections are reused (keep-alive, HTTP/2) and why TLS is terminated at a nearby edge.",
  },
  connpool: {
    name: 'Connection pool',
    def: "A small set of pre-opened database connections that many app threads share, because connections are expensive for the database — each one costs memory and a process or thread, and Postgres degrades past a few hundred. 10,000 concurrent users do not get 10,000 connections; they queue briefly for ~100 pooled ones. An exhausted pool is a queue, with all the queue math attached.",
  },
  herd: {
    name: 'Thundering herd',
    def: "Thousands of clients acting in perfect sync — reconnecting after a network blip, retrying on the same backoff schedule, or hammering one just-expired cache key. Each client behaves reasonably; the synchronization is what overloads the target. Every defense breaks the sync: random jitter on retries and TTLs, staggered reconnects, dogpile locks.",
  },
  breaker: {
    name: 'Circuit breaker',
    def: "A wrapper that watches calls to a dependency and, after enough failures, opens: further calls fail instantly instead of waiting out timeouts. That frees the caller’s threads, sheds load off the failing dependency so it can recover, and periodically lets a probe through to test for recovery. It converts \"one slow service drags down everything\" into \"one feature degrades\".",
  },
  bulkhead: {
    name: 'Bulkhead',
    def: "Giving each dependency or tenant its own bounded pool — threads, connections, queue slots — so exhaustion in one cannot spread to the rest. Without bulkheads, one slow payments API quietly consumes every thread in the service and takes checkout, search, and login down with it. The isolation costs a little capacity fragmentation; shared-everything failure costs the whole service.",
  },
  bluegreen: {
    name: 'Blue-green deploy',
    def: "Running two identical environments: blue serves traffic while the new version deploys to green, then the router flips. Rollback is flipping back — seconds, not a re-deploy. The costs are double hardware during the window and a shared database, so schema changes must stay compatible with both versions at once.",
  },
  canary: {
    name: 'Canary deploy',
    def: "Shipping a new version to a small slice (1–5%) of traffic, watching error rates and latency, then widening or rolling back. It bounds the blast radius of a bad release to the slice. The limit is representativeness: a 1% canary can miss bugs that appear only at full load or only for specific user cohorts.",
  },
  cap: {
    name: 'CAP theorem',
    def: "During a network partition, a distributed system must choose: refuse some requests (consistency) or answer with possibly-stale data (availability). It is a proof, not a slogan, and in practice a statement about geography — partitions between regions are a matter of when, not if. The working question is per-operation: which requests may return stale data, and which must never?",
  },
  quorum: {
    name: 'Quorum',
    def: "Requiring a majority (2 of 3, 3 of 5) of replicas to acknowledge a write or serve a read, so that any two majorities overlap in at least one node holding the latest value. The overlap is what keeps the system consistent while a minority of nodes is down. It is why replica counts are odd, and why every quorum write waits on the slowest member of its majority.",
  },
  leader: {
    name: 'Leader election',
    def: "Picking exactly one node to accept writes, so ordering has a single source of truth; the election is done with consensus so a network split cannot crown two leaders (split-brain). During an election — triggered precisely when the system is already failing — there is no leader, and writes stall. Leader-based systems are therefore engineered around how short that gap can be made.",
  },
  exactlyonce: {
    name: 'Exactly-once',
    def: "A message delivered and processed precisely one time — the guarantee no network can natively provide, because acknowledgements themselves can be lost. Real systems compose it honestly: at-least-once delivery plus idempotent processing, deduplicating by operation ID, so duplicates arrive but have no second effect. A vendor claiming exactly-once is describing that composition, and the load-bearing part is where the idempotency key lives.",
  },
  atleastonce: {
    name: 'At-least-once',
    def: "The workhorse delivery guarantee: keep retrying until acknowledged, so nothing is lost — but the same message may arrive twice, because the acknowledgement, not the message, may be what got lost. Accepting at-least-once makes duplicates a promise rather than a bug, so every consumer must be idempotent. The alternative, at-most-once, trades duplicates for silent loss.",
  },
  visibility: {
    name: 'Visibility timeout',
    def: "A queue's crash-recovery window: receiving a message hides it, rather than deleting it, while a worker processes it. If the worker finishes, it deletes the message; if it crashes, the timeout expires and the message reappears for another worker. The timeout has to exceed the slowest processing time, or healthy work reappears mid-flight and gets processed twice.",
  },
  dlq: {
    name: 'Dead-letter queue',
    def: "Where messages go after failing N processing attempts, so one poison message — malformed, or triggering a bug — cannot clog the queue with endless retries while healthy work backs up behind it. The DLQ doubles as the forensic record: it converts 'processing kept crashing all night' into 'these 14 exact messages failed — replay them after the fix'.",
  },
  hotpartition: {
    name: 'Hot partition',
    def: "One shard receiving far more traffic than its siblings because many writers compute the same partition key — a timestamp bucket, today's date, a viral post's ID. The cluster is large and mostly idle while one node saturates: total capacity means nothing when per-key capacity is the limit. The defense is salting or composing keys so concurrent writers spread across partitions.",
  },
  readyourwrites: {
    name: 'Read-your-own-writes',
    def: "The consistency promise users actually notice: after saving, the author's own next read shows the change — even if strangers see stale data a moment longer. Replication lag breaks it: write to the primary, read from a lagging replica, and the new comment has 'vanished'. The standard fixes pin a user's reads to the primary briefly after their write, or route reads by session.",
  },
  replag: {
    name: 'Replication lag',
    def: "The delay between a write committing on the primary and appearing on a replica — milliseconds normally, unbounded under load, because lag is a queue and queues explode past the knee. It is the fine print on 'just add replicas': every read from a replica is a read of the recent past. The design question is which reads tolerate that and which must not.",
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
  },
  throughput: {
    name: 'Throughput vs latency',
    def: "Throughput is how much work per second; latency is how long one request takes. They are different axes and they fight: batching raises throughput while adding waiting, and pushing utilization toward 100% maximizes throughput while queueing destroys latency. A requirement that says 'fast' has not yet said which one it means.",
  },
  timeout: {
    name: 'Timeout',
    def: "How long a caller waits on a dependency before giving up. Without one, a slow dependency silently holds the caller's threads until everything upstream is stuck — slowness propagates farther than errors do. Timeouts must shrink as calls go deeper, because the caller's budget bounds the callee's, and every timeout needs a decided fallback: retry, degrade, or fail.",
  },
  retry: {
    name: 'Retry (with backoff + jitter)',
    def: "Repeating a failed call, waiting exponentially longer each time, with randomness added so thousands of clients do not retry in lockstep — a synchronized retry wave is a self-inflicted thundering herd. Transient failures are common enough that retries are load-bearing, and two rules make them safe: the operation must be idempotent, and retries must be budgeted so they cannot multiply load during an outage.",
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
  },
  denormalization: {
    name: 'Denormalization',
    def: "Deliberately duplicating data — pre-joining it into the shape a screen needs — so a read becomes a single lookup instead of a multi-table join. It trades write cost and consistency risk for read speed: every copy must be updated, and copies can drift. The trade is right when reads vastly outnumber writes, and wrong otherwise.",
  },
  join: {
    name: 'Join',
    def: "Combining rows from multiple tables on a shared key at query time. Joins are what let data stay normalized — stored once — but they cost CPU and I/O that grow with table size, and they become hard or impossible once data is sharded across machines. That limit is a major reason NoSQL stores drop them.",
  },
  acid: {
    name: 'ACID',
    def: "The transactional guarantees of a classic database: Atomicity (all-or-nothing), Consistency (declared rules always hold), Isolation (concurrent transactions don't see each other's partial work), Durability (committed data survives a crash). They are why a bank transfer cannot lose money in the middle — and why every commit pays an fsync, bounding write throughput to thousands per second.",
  },
  nosql: {
    name: 'NoSQL',
    def: "A family of non-relational databases — key-value, document, wide-column, graph — that drop joins and strict ACID in exchange for horizontal scale and a data model shaped to one access pattern. The queries must be known up front, because the partition key is designed first and everything else follows from it. The fit is real when the access pattern is fixed and the scale demands it.",
  },
  blob: {
    name: 'Blob / object storage',
    def: "Large binary objects — images, video, backups — stored in a flat key→bytes service (S3, GCS) at ~$0.02/GB/mo, far cheaper and more scalable than block storage. Blobs stay out of the database because a multi-megabyte row bloats indexes, evicts useful cache, and costs several times more. The object lives in blob storage; only its key lives in the database.",
  },
  presigned: {
    name: 'Presigned URL',
    def: "A time-limited, permission-scoped link that lets a client read or write one specific object in blob storage directly, without the bytes passing through the application servers. It exists because a 2 GB upload would otherwise pin an app-server thread and its memory for minutes. The API issues the ticket; the heavy transfer runs between client and storage.",
  },
  invertedindex: {
    name: 'Inverted index',
    def: "The data structure behind search: a map from each word to the list of documents containing it, so a text query becomes a lookup and a merge instead of a scan of every row. It is built at write time by tokenizing and indexing each document. Search therefore lives in a separate, eventually-consistent system fed from the database, rather than inside the primary store.",
  },
  apigateway: {
    name: 'API gateway',
    def: "A single front service in front of many backends that handles cross-cutting concerns once: TLS termination, authentication, rate limiting, routing, sometimes aggregating several backend calls into one reply. Centralizing them keeps every service from re-implementing auth and limiting. The gateway sits on the critical path of every request, so it stays thin and highly available.",
  },
  stream: {
    name: 'Stream (event log)',
    def: "An ordered, retained, replayable log of events (Kafka) that many independent consumers read at their own offset — unlike a queue, consuming a message does not delete it. A broker sustains ~1M msgs/s because it only ever appends sequentially. Retention plus offsets mean a new consumer can be added later and reprocess all of history.",
  },
  eventsourcing: {
    name: 'Event sourcing',
    def: "Storing the sequence of changes (events) as the source of truth and deriving current state by replaying them, instead of storing only the latest state. It yields a complete audit log and the ability to rebuild any view — or fix a bug retroactively — by replaying. The costs are more storage and the obligation to keep old event schemas replayable forever.",
  },
  distlock: {
    name: 'Distributed lock',
    def: "A lock shared across machines so only one worker performs a critical action at a time (charging a card once, running one cron). A holder can pause or crash, so correct locks are time-bounded leases carrying a fencing token that the protected resource checks. Because the lock is agreement among machines, robust implementations sit on a consensus store (etcd, ZooKeeper) rather than a lone Redis key.",
  },
  lease: {
    name: 'Lease',
    def: "A lock granted for a bounded time that must be renewed to keep, so a crashed holder's lock expires on its own instead of deadlocking the system. The subtlety: a paused holder can lose its lease while still believing it owns the resource. That stale writer is rejected by a fencing token — a monotonically rising number the resource validates on every operation.",
  },
  websocket: {
    name: 'WebSocket',
    def: "A persistent, full-duplex connection over a single TCP socket: server and client can each send at any time with minimal latency, which fits chat, multiplayer, and trading. The cost is statefulness — every open connection is memory pinned to one specific server. Realtime systems get hard exactly at the tier that routes each message to whichever server holds the right connection.",
  },
  sse: {
    name: 'Server-sent events',
    def: "A long-lived one-way stream from server to client over plain HTTP, with automatic reconnection built in — a fit for feeds, notifications, and live dashboards. It is simpler than a WebSocket and traverses proxies and firewalls as ordinary HTTP. It only pushes server→client, so client actions still travel as ordinary requests.",
  },
  polling: {
    name: 'Polling',
    def: "The client repeatedly asks \"anything new?\" on a timer, because plain HTTP cannot let the server speak first. It works everywhere and is trivial to operate, but most responses carry nothing when updates are rare, and staleness averages half the polling interval. Long-polling and push protocols exist to eliminate exactly those two costs.",
  },
  saga: {
    name: 'Saga',
    def: "A transaction spanning several services, run as a sequence of local steps, each paired with a compensating action that undoes it if a later step fails. It trades atomicity for availability: there is a window where some steps are done and others are not. Every step must therefore be idempotent, and a failure that cannot be compensated goes to a human via a dead-letter queue.",
  },
  '2pc': {
    name: 'Two-phase commit (2PC)',
    def: "A protocol in which a coordinator asks every participant to prepare, then — if all agree — to commit, yielding atomicity across separate databases. It blocks: participants hold locks while they wait, and a coordinator crash can leave them stuck holding those locks. It is reserved for a few fast steps that truly must be atomic; at scale, sagas are preferred.",
  },
  optimistic: {
    name: 'Optimistic concurrency',
    def: "Handling contention by letting writers race without locks: read a version number, and commit only if it has not changed (compare-and-set), otherwise retry. With rare conflicts it is the fastest scheme, because no one waits on a lock. Under heavy contention it thrashes on repeated retries — there, a pessimistic lock or a single serialized owner wins.",
  },
  geohash: {
    name: 'Geohash',
    def: "An encoding that interleaves latitude and longitude bits into a single string, so nearby points share a common prefix and an ordinary index answers \"near me\" with a prefix range scan. It turns a 2D proximity query into a 1D lookup. The catch is cell borders: a point near an edge requires checking the neighboring cells too.",
  },
  quadtree: {
    name: 'Quadtree',
    def: "A spatial index that recursively splits a region into four quadrants, subdividing only where points are dense — cities get fine cells, oceans stay coarse. It adapts to uneven density far better than a fixed grid. The price is a heavier structure to maintain as objects move, which is the trade weighed against a simpler geohash.",
  },
  consistenthash: {
    name: 'Consistent hashing',
    def: "Placing nodes and keys on a hash ring where each key belongs to the next node clockwise, so adding or removing a node re-homes only about 1/N of the keys instead of nearly all of them. It is what lets distributed caches and partitioned stores change size without a system-wide reshuffle — which, for a cache, would be a total miss storm.",
  },
}

export type GlossaryKey = keyof typeof GLOSSARY

/* ---------------- Reference groups (README-v3 Phase 2) ----------------
   The Library's REFERENCE section renders every glossary term, organized into
   six groups. Every key above appears in exactly one group (schema test);
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
      'rest', 'pagination', 'dns', 'tls', 'autoscaling',
    ],
  },
  {
    id: 'cpu',
    label: 'CPU & Memory',
    keys: ['core', 'pipeline', 'speculation', 'cacheline', 'locality', 'virtualmemory'],
  },
  {
    id: 'caching',
    label: 'Caching & Delivery',
    keys: ['cache', 'hitrate', 'ttl', 'stampede', 'cdn', 'fanout', 'websocket', 'sse', 'polling'],
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
    ],
  },
  {
    id: 'queues',
    label: 'Queues & Streams',
    keys: [
      'queue', 'worker', 'backlog', 'backpressure', 'visibility', 'dlq',
      'stream', 'eventsourcing', 'idempotent', 'atleastonce', 'exactlyonce', 'saga',
    ],
  },
  {
    id: 'resilience',
    label: 'Resilience',
    keys: [
      'errorbudget', 'timeout', 'retry', 'ratelimit', 'breaker', 'bulkhead',
      'herd', 'failover', 'bluegreen', 'canary', 'cap', 'consistency',
      'consensus', 'quorum', 'leader', 'distlock', 'lease',
    ],
  },
]
