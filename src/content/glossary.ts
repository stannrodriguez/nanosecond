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
    def: "A single client-to-server round: one message asking for work ('give me this page', 'save this comment') and the reply that answers it. Capacity planning starts by counting requests, figuring out what each one costs to serve, and knowing which machine pays that cost.",
  },
  read: {
    name: 'Read',
    def: "A request that returns stored data without changing it, like loading a post. Because the answer does not depend on who asks, you can copy it to caches and replicas and serve it from whichever copy sits closest. That is why read capacity scales by adding copies.",
  },
  write: {
    name: 'Write',
    def: 'A request that changes stored data, like saving a comment or recording a GPS ping. A write is not finished when it lands in RAM: it has to reach durable storage, and every replica has to converge on the same value. Both costs grow with the number of copies you keep, which is why extra replicas speed up reads while slowing down writes.',
  },
  rps: {
    name: 'RPS / QPS / TPS',
    def: 'Requests, Queries, or Transactions Per Second: the rate of demand hitting a component at its own front door. RPS counts HTTP requests at the web tier, QPS counts queries at the database, and TPS counts transactions where writes matter most. One user click often fans out into several queries, so all three numbers can differ for the same traffic.',
  },
  iot: {
    name: 'IoT device',
    def: "'Internet of Things': a small physical device with a network connection, like a GPS tracker in a truck, a smart thermostat, or a factory sensor. Because it sends traffic on a timer instead of waiting for a human to tap a button, load runs around the clock. Traffic grows with the size of the fleet, not with user engagement.",
  },
  phonehome: {
    name: 'Phones home',
    def: "The device initiates contact with the server on a schedule ('here is my location, again'), and the server never calls the device. Total traffic is simply the device count multiplied by each device's reporting rate. Almost all of it is writes, since the device has data to drop off and nothing to ask.",
  },
  burst: {
    name: 'Burst / spike',
    def: "A short stretch where traffic jumps far above its steady rate. Bursts usually come from synchronized behavior (a sale opens at noon, every truck in a fleet starts at 8am) or a 'thundering herd', where a network blip drops thousands of devices that all reconnect and resend at once. Plan capacity for the burst peak, because the average will lie to you.",
  },
  cache: {
    name: 'Cache',
    def: "A small, fast RAM store holding copies of recent answers in front of the database. A lookup that finds its answer there (a 'hit') skips the database completely, returning in ~1ms instead of ~5 to 50ms at roughly 10× the capacity per dollar. It only speeds up reads; every write still has to reach the database.",
    say: 'A cache keeps recent answers in fast memory in front of the database, so a hit skips the database completely at roughly ten times the capacity per dollar.',
    reachFor:
      'Read-heavy workloads concentrated on a small hot set: popular posts, session data, or expensive computed aggregates.',
    trap: "Wrong: 'Add a cache to make it faster.' A cache only speeds up reads, and every write still has to reach the database. Say 'At a 95% hit rate the cache absorbs most reads, so the database only has to survive the miss traffic.'",
  },
  hitrate: {
    name: 'Hit rate',
    def: 'The share of lookups a cache answers on its own; an 80% hit rate means only 20% of reads reach the database. It depends on how tightly traffic clusters around the same keys: a viral post everyone reads can top 99%, while random user-profile lookups land much lower. Because the database only has to survive the misses, this percentage sets its required read capacity.',
    say: 'Hit rate is the share of lookups the cache answers itself, which makes it the single number that decides how much read traffic actually reaches the database.',
    reachFor:
      "Sizing a database behind a cache, or pressure-testing any 'we will add a cache' claim with real arithmetic.",
    trap: "Wrong: 'The cache will handle the reads.' At an 80% hit rate it handles four in five, and the remaining fifth is still the database's entire problem. Say '100k reads a second at a 95% hit rate leaves 5k hitting the database, and a cache restart briefly turns that back into 100k.'",
  },
  virtualmemory: {
    name: 'Virtual memory',
    def: 'Per-process address translation: every program sees its own private, contiguous memory space, and the hardware maps each access to physical RAM one 4 KB page at a time. That translation lets many programs share one machine safely without stepping on each other. Because the CPU caches those page mappings in the TLB, "it fits in RAM" only runs fast when your working set also fits within the TLB\'s reach.',
  },
  pipeline: {
    name: 'Pipeline',
    def: 'Overlapped instruction execution: while the CPU decodes one instruction, it is already fetching the next, letting a core retire roughly one instruction per clock tick instead of waiting for each one to finish end to end. Keeping the pipeline full forces the core to guess which way every branch will go. Guess wrong, and all that partially finished work gets thrown out.',
  },
  speculation: {
    name: 'Speculative execution',
    def: 'The CPU running instructions before it knows for sure they are needed, guessing how a branch will resolve and racing ahead of the answer. A right guess is pure speedup, while a wrong guess discards the speculative work. Modern CPU performance leans heavily on speculation, and its hidden side effects are what leaked in Spectre.',
  },
  core: {
    name: 'Core',
    def: 'One independent processor on a chip, complete with its own pipeline, capable of running a program by itself. Once heat capped clock speeds near ~4 GHz, chipmakers stopped making single cores faster and started packing more cores onto the die instead. Single-thread speed has barely budged since, so real speedups now come from putting multiple cores to work.',
  },
  cacheline: {
    name: 'Cache line',
    def: 'The fixed 64-byte chunk the CPU moves between RAM and cache, because it never fetches a single byte on its own. Touching one byte pulls its 63 neighbors along for free, so fields used together run much faster when stored together. That is why walking a contiguous array can beat a linked list by an order of magnitude: each cache line hands the core eight useful values from the array and only one from the list.',
  },
  cpucache: {
    name: 'CPU cache (L1/L2/L3)',
    def: 'The tiered staircase of tiny, fast memories on the chip (L1, L2, L3) holding recently used data so the core rarely pays the full ~100 ns trip to RAM. Each step trades size for closeness: roughly 1 ns for L1, 4 ns for L2, and 12 ns for L3. Fitting your working set inside a cache level often beats any micro-optimization, because missing every level slows the exact same loop by ~100×.',
  },
  coherence: {
    name: 'Cache coherence',
    def: "The hardware protocol that keeps every core's private cache agreeing on the truth: before a core writes to memory, it must claim exclusive ownership of that address's entire 64-byte cache line, kicking it out of every other core's cache. Correctness stays intact, but two cores writing to the same line end up taking turns even when they touch completely different bytes. That involuntary turn-taking is false sharing, and it is why adding cores can make a parallel loop slower.",
  },
  locality: {
    name: 'Locality',
    def: 'The two memory patterns that make caches pay off. Temporal locality means reusing the same data soon while it is still hot in cache; spatial locality means reading data right next to what you just touched because it rode in on the same cache line. Code with strong locality can run 10× faster than identical code without it: same instructions, same data, better memory layout.',
  },
  replica: {
    name: 'Read replica',
    def: 'A live copy of the database that replays every write from the primary and serves read traffic. Each replica adds read capacity, ~20k reads/s, without touching the write path. Because copies lag slightly behind the primary, a comment you just posted may take a moment to show up on a replica.',
    say: 'A read replica replays every write from the primary and serves reads, adding read capacity without moving the write ceiling at all.',
    reachFor:
      'Read-heavy workloads spread across a long tail of keys that a cache would not concentrate, like reporting or browse pages.',
    trap: "Wrong: 'Add replicas to scale.' Replicas only scale reads, because every copy still has to apply every write. Say 'Replicas add read capacity and a failover target, while the write ceiling stays right where it was.'",
  },
  shard: {
    name: 'Shard',
    def: "Splitting data across multiple independent databases, like putting users A-M on box 1 and N-Z on box 2. Sharding is how write capacity scales: replicas cannot help writes because every copy applies every write, whereas each shard handles only its own slice. The catch is that cross-shard queries turn into cross-machine joins, so teams usually reach for sharding only after caching and replication are tapped out.",
    say: 'Sharding splits data across independent databases so each node handles only its share of writes, which is the one scaling problem replicas cannot solve.',
    reachFor:
      "Write rates genuinely past one primary's ceiling, or datasets past one node's disk, after caching and read replicas are exhausted.",
    trap: "Wrong: 'We will shard so it scales.' Sharding buys write capacity at the price of cross-shard queries, distributed transactions, and painful rebalancing. Say 'At this write rate we are past one primary, so I will shard on a key that spreads load evenly.'",
  },
  queue: {
    name: 'Queue',
    def: 'A durable waiting line (Kafka, SQS) sitting between accepting a write and finishing the work behind it. The app appends a message in ~1ms and replies right away, while workers drain the line into the database at a pace the database can handle. A traffic burst then turns into a brief processing delay instead of an outage.',
    say: 'A queue puts a durable waiting line between accepting a write and processing it, turning a traffic burst into processing delay instead of a capacity crisis.',
    reachFor:
      'Work that can safely run asynchronously (email, image resizing, report generation) and spikes you would rather absorb than over-provision for.',
    trap: "Wrong: 'We will add a queue so it scales.' A queue smooths bursts, not steady throughput. Say 'The queue absorbs the spike, but if steady arrival exceeds drain capacity, the backlog grows forever and only delays the failure.'",
  },
  worker: {
    name: 'Worker',
    def: 'A background process that pulls messages off a queue and handles deferred work like writing to the database or resizing an image. Because no user is waiting on an open HTTP connection, workers can churn through jobs at a steady pace. Drain rate scales with worker count, turning backlog recovery into a provisioning knob instead of an architecture rewrite.',
    say: 'A worker pulls deferred jobs off the queue at a steady pace, making drain rate a provisioning knob rather than an architectural redesign.',
    reachFor:
      'Any async pipeline, or a backlog incident where the first question is whether more workers will actually clear it.',
    trap: "Wrong: 'Add workers to clear the backlog.' More workers only help when workers are the bottleneck, not the database behind them. Say 'I will check what the workers are waiting on first, because doubling them in front of a saturated database just moves the queue downstream.'",
  },
  backlog: {
    name: 'Backlog / lag',
    def: 'Messages piling up in a queue because they arrive faster than workers can drain them. A backlog that swells during a spike and drains back to zero afterward means the queue is doing its job. One that never shrinks means steady arrivals exceed drain capacity, so the queue is only postponing overload until workers or the downstream bottleneck get more headroom.',
    say: 'A backlog is work waiting because arrivals outpace draining, which is healthy when it clears after a spike and fatal when it grows without end.',
    reachFor:
      'Diagnosing any queue incident: backlog shape immediately tells you whether you have a burst problem or a capacity problem.',
    trap: "Wrong: 'The queue is deep, so add workers.' Depth alone does not tell you which problem you have. Say 'I will check whether the backlog is shrinking, because steady growth means arrival rate beats drain rate and no buffer can fix that.'",
  },
  p99: {
    name: 'p99 latency',
    def: 'The response time at the 99th percentile, meaning 1 request in 100 is slower than this number. Averages hide ugly tails: 99 fast requests can mask 1 that stalls for 2 seconds, and your busiest users make the most requests so they hit that tail constantly. Teams write SLAs around p99 because queueing pain shows up there long before the average moves.',
  },
  sla: {
    name: 'SLA',
    def: "Service Level Agreement: a written performance promise such as 'p99 under 200ms, 99.9% of requests succeed.' A design only passes if it keeps that promise under peak load and within budget. The SLA, not a smooth local demo, is the real pass/fail line.",
  },
  durable: {
    name: 'Durability (fsync)',
    def: 'A write is durable once its bytes sit physically on disk and can survive a power cut. Forcing bytes to disk with fsync is orders of magnitude slower than writing to RAM, which is why one database primary handles ~10k writes/s while serving ~10× as many reads/s. Reads can come straight out of memory, while every durable write pays for the flush.',
    say: 'A write is only durable once it is fsynced to disk, which is why one primary does thousands of writes a second while memory-backed reads run ten times faster.',
    reachFor:
      'Any write-throughput ceiling question, or any proposal claiming faster writes without pricing the disk flush.',
    trap: "Wrong: 'The write is saved once the database returns.' It is saved once the log is fsynced, which is what the return waited for and what a relaxed fsync setting quietly turns off. Say 'Durability costs a disk flush per commit, which bounds one primary to roughly 8,000 writes a second.'",
  },
  lb: {
    name: 'Load balancer',
    def: 'The front door that receives incoming requests and spreads them across your app servers. By making servers interchangeable behind a single address, it lets any machine crash or restart without clients noticing. The routing hop costs ~1ms per request.',
  },
  appserver: {
    name: 'App server',
    def: 'The machine running your application code: checking logins, validating input, talking to caches or databases, and assembling replies. Because it stays stateless and remembers nothing between requests, scaling it is just adding more boxes. One server handles ~10k simple requests/s.',
  },
  util: {
    name: 'Utilization',
    def: 'How busy a component is: load ÷ capacity. Wait times shoot up as you approach 100%, so at 95% busy queueing delay is ~10× worse than at 50% because random arrivals clump together with no slack left to absorb them. Healthy systems cruise at 60 to 70% for exactly this reason (try The Queue toy in the Lab to feel the cliff).',
  },
  readpct: {
    name: 'Read/write mix',
    def: 'The split between requests that read data and requests that write it, which is the very first question to ask because it picks your architecture. Read-heavy systems (social feeds and blogs, often 90%+ reads) lean on caches and replicas to multiply read capacity. Write-heavy systems (telemetry, logging, chat ingest) need queues and shards, since extra copies do nothing for writes.',
  },
  errorbudget: {
    name: 'Error budget',
    def: "The slice of failure users will tolerate before losing trust, written down as a concrete number: a 99.9% target leaves a 0.1% budget. Teams either spend it on purpose for launches and experiments or burn it by accident on outages, and when it hits zero, feature work pauses until reliability recovers. It turns 'how reliable is enough?' from an argument into arithmetic.",
    say: 'An error budget turns reliability into arithmetic by naming the failure users tolerate, like 0.1% for a 99.9% target, so teams know when to ship and when to harden.',
    reachFor:
      'Reliability-versus-velocity trade-offs, and justifying the exact moment feature launches should pause.',
    trap: "Wrong: 'We aim for zero downtime.' Zero is unpriced, and every extra nine costs roughly ten times as much as the last. Say 'Our 99.9% target gives us 43 minutes a month, and we spend that budget on purpose for launches.'",
  },
  idempotent: {
    name: 'Idempotent',
    def: "An operation you can safely run more than once without changing the outcome: 'set status = PAID' is idempotent, while 'add $10' is not. Because at-least-once delivery guarantees occasional duplicates, retries are only safe when every side effect is idempotent. Most systems enforce this by attaching a unique operation ID that the receiver remembers.",
    say: 'An idempotent operation produces the same result whether it runs once or twice, like setting status to PAID instead of adding ten dollars, which makes retries and at-least-once delivery safe.',
    reachFor:
      'Every retry path, queue consumer, and payment endpoint where duplicate delivery is a matter of when, not if.',
    trap: "Wrong: 'We retry on failure.' Retrying a non-idempotent write double-charges the customer. Say 'The consumer deduplicates on an operation ID it stores, so a second delivery has no second effect.'",
  },
  stampede: {
    name: 'Cache stampede',
    def: "What happens when a hot key expires (or a cache restarts) and thousands of misses race to recompute the same answer against the database at once. The traffic spike is caused by the cache disappearing, not by extra users. Every fix breaks that lockstep timing: a dogpile lock so one request recomputes while the rest wait, random jitter on TTLs, or serving stale data while a refresh runs.",
    say: "A cache stampede hits when a hot key expires and thousands of misses recompute the same answer at once, creating a database spike out of the cache's absence.",
    reachFor:
      'Hot keys, cold cache restarts, and any database spike that happened while user traffic stayed flat.',
    trap: "Wrong: 'It is just a cache miss.' One miss is harmless; ten thousand copies of it in the same millisecond is an outage. Say 'I will break the synchronization with a dogpile lock so one request recomputes, jittered TTLs, and stale-while-revalidate.'",
  },
  consistency: {
    name: 'Consistency',
    def: 'Whether every reader sees the same data at the same moment. Strong consistency guarantees a read after a write reflects that write, which forces copies to coordinate before answering and costs network round trips. Eventual consistency replies right away from whatever a copy holds and lets replicas catch up later, trading staleness for lower latency and higher availability one operation at a time.',
    say: 'Strong consistency guarantees a read sees the latest write by coordinating across copies first, and that coordination is paid directly in network round trips.',
    reachFor:
      'Deciding which operations genuinely need coordination and pricing that choice in milliseconds across zones or regions.',
    trap: "Wrong: 'We need the data to be consistent.' Consistency is a dial with a latency bill at every step. Say 'This read has to see its own write while that browse page can lag by a second, so I will price consistency per operation.'",
  },
  consensus: {
    name: 'Consensus',
    def: 'The protocol family (Raft, Paxos) that lets several machines agree on a single truth, like who leads or what order writes happened in, even while some nodes crash. Reaching agreement takes multiple round trips across a majority of nodes, which is why a strongly consistent cross-region write costs ~150ms (two rounds × ~70ms of geography). You pay the consensus tax only where two conflicting truths would be catastrophic.',
    say: 'Consensus lets a cluster agree on one value like leader identity or write order even while nodes crash, at the cost of multiple round trips across a majority.',
    reachFor:
      'Leader election, distributed locks, and any metadata where two conflicting truths would be catastrophic rather than merely messy.',
    trap: "Wrong: 'We will use consensus for consistency.' Cross-region round trips cost ~70 ms each and a write takes more than one. Say 'I will use consensus for metadata and leadership, and cheaper replication for bulk data.'",
  },
  failover: {
    name: 'Failover',
    def: 'Promoting a replica to primary when the primary dies. It is never instant: spotting the failure alone takes seconds because a dead node and a slow node look identical at first, promotion takes longer still, and clients have to find the new primary. Writes fail during that gap and any unreplicated writes may be lost or need reconciling, which is why failover has to be rehearsed instead of assumed.',
    say: 'Failover promotes a replica when the primary dies, and it is never instant because detecting a dead node versus a slow one takes seconds before promotion even starts.',
    reachFor:
      'Availability conversations, and stating clearly how many seconds of failed writes a database outage actually costs.',
    trap: "Wrong: 'We have a replica, so failover is automatic.' Automatic does not mean instant or lossless, because unreplicated writes on the dead primary can vanish. Say 'Writes fail during the detection and promotion window, so I rehearse failover instead of trusting it on faith.'",
  },
  ttl: {
    name: 'TTL (time to live)',
    def: 'An expiry timer stamped on a cached entry: once it runs out, the cache drops the value and the next lookup fetches a fresh copy. Short TTLs keep data fresher at the price of more database misses, while long TTLs flip that trade. Keys written together expire together and trigger synchronized miss storms, which is why production caches add random jitter to TTLs.',
    say: 'A TTL sets how long a cached entry lives before refetching, trading freshness against miss rate, and real systems add random jitter so keys written together do not expire together.',
    reachFor:
      'Any cached data that can go stale, and deciding explicitly how stale a read is allowed to be.',
    trap: "Wrong: 'We cache it for an hour.' You just made a one-hour staleness promise to every user. Say 'I will use a 60-second TTL with random jitter, because this data can be a minute stale and I do not want every key expiring on the same tick.'",
  },
  wal: {
    name: 'Write-ahead log (WAL)',
    def: "The database's crash-recovery journal: before modifying any data page, the engine appends the intended change to a sequential log and fsyncs it so a crash mid-write can be repaired by replaying the log. It works because sequential appends are the one thing disks do fast. That sequential flush per durable write is also why one primary tops out in the thousands of writes per second, not millions.",
    say: 'Before any data page changes, the database appends the write to a sequential write-ahead log and fsyncs it, so crash recovery is a replay and disks stay on their fast sequential path.',
    reachFor:
      'Explaining crash recovery, why commits pay a flush, or where replication and change-data-capture streams physically originate.',
    trap: "Wrong: 'The WAL is our backup.' It is a short-horizon recovery log, not a long-term archive. Say 'The WAL repairs half-finished writes and feeds replicas and CDC, while backups are a separate system with their own retention.'",
  },
  lsm: {
    name: 'LSM-tree',
    def: 'A storage engine (Cassandra, RocksDB, LevelDB) that never overwrites data in place: writes land in a memory buffer and flush out as sorted, immutable files that background jobs merge later. That turns writes into fast sequential appends, while reads may have to check several files (read amplification). It shines when writes outnumber reads.',
    say: 'An LSM-tree buffers writes in memory and flushes immutable sorted files merged in the background, turning writes into fast sequential appends while reads pay by checking multiple files.',
    reachFor:
      'Write-heavy workloads like time series, event ingestion, or anything backed by Cassandra or RocksDB.',
    trap: "Wrong: 'LSM engines are just faster.' They are faster at writes, slower at reads, and the deferred merges still bill your disk bandwidth later. Say 'An LSM turns random writes into sequential appends and pays that bill later in compaction and read amplification.'",
  },
  btree: {
    name: 'B-tree',
    def: 'The classic database index (Postgres, MySQL): a wide, shallow tree where every node is one disk page, putting any row ~3 to 4 page reads away. Reads stay fast and predictable, while writes must locate and update pages in place, paying random I/O. Choosing between a B-tree and an LSM-tree is the classic read-optimized versus write-optimized fork: same data, opposite physics.',
    say: 'A B-tree is a wide, shallow tree of page-sized nodes that finds any row in three or four page reads, trading random in-place write I/O for predictable read speed.',
    reachFor:
      'The default database index choice, and explaining why lookups stay fast even as a table grows huge.',
    trap: "Wrong: 'The table got big, so the index got slow.' With fan-out in the hundreds, tree depth barely budges. Say 'Depth only moved from three page reads to four, so what actually changed is the buffer-cache hit rate or maintenance overhead.'",
  },
  gsi: {
    name: 'Secondary index (GSI)',
    def: "An extra copy of a table sorted by a different key so queries can look up rows without knowing the primary key. In distributed stores like DynamoDB's Global Secondary Index, it is literally a second table kept in sync behind the scenes: every write now costs two writes, and the index copy can lag. Indexes are bought with write amplification, never conjured for free.",
    say: 'A secondary index maintains another copy of the table sorted by a different key, so looking up a non-primary attribute costs a second write on every insert and a copy that can lag.',
    reachFor:
      'DynamoDB and Cassandra data modeling whenever a new query shows up that the partition key cannot answer.',
    trap: "Wrong: 'We will add a secondary index so we can query that.' It is a full extra table maintained asynchronously. Say 'That doubles our write cost and the index is eventually consistent, so read-after-write against it can miss.'",
  },
  cdc: {
    name: 'Change data capture (CDC)',
    def: "Tapping the database's own replication log to stream every committed change to downstream systems like search indexes, caches, and warehouses. It beats dual-writing from application code because the log is the single authoritative record: nothing drops silently, order holds, and consumers can replay history. The trade-off is that downstream views are eventually consistent by construction.",
    say: "Change data capture streams committed changes straight from the database's replication log, giving search indexes and caches an authoritative, ordered feed instead of fragile dual writes.",
    reachFor:
      'Keeping a search index, cache, or warehouse in sync without dual-writing from app code and hoping nothing fails mid-flight.',
    trap: "Wrong: 'The app writes to both the database and the search index.' A dual write can fail halfway and leave the two silently out of sync. Say 'I will feed the index from CDC so the log is the single ordered source, and accept eventual consistency.'",
  },
  fanout: {
    name: 'Fan-out',
    def: 'One incoming event triggering many outgoing operations, like a single tweet landing in a million follower timelines or one API call fanning out to six microservices. Fan-out multiplies load behind the scenes: 1k posts/s × 500 followers equals 500k timeline writes/s. Feed designs weigh fan-out-on-write (pay when posting) against fan-out-on-read (pay when reading), decided by the follower distribution.',
    say: 'Fan-out multiplies one incoming event into many outgoing operations, like a thousand posts a second across five hundred followers turning into five hundred thousand timeline writes a second.',
    reachFor:
      'Social feeds, notifications, and microservice call graphs where one inbound request sparks half a dozen outbound calls.',
    trap: "Wrong: 'It is just one write.' It is one write multiplied by the follower count. Say 'Fan-out-on-write pays at post time and fan-out-on-read pays at read time, and celebrity accounts usually push us to a hybrid of both.'",
  },
  backpressure: {
    name: 'Backpressure',
    def: 'How a system responds when a producer outruns its consumer and the buffer between them fills up: block the producer, shed work, or degrade output. The alternative, an unbounded buffer, quietly turns overload into memory exhaustion and a much bigger crash later. Deciding where to refuse work, and whose work to refuse, is an explicit design choice; ignoring it is choosing the crash.',
    say: 'Backpressure is how a system reacts when a producer outruns its consumer by blocking, shedding, or degrading work, because the alternative is an unbounded buffer and a bigger crash later.',
    reachFor:
      'Any producer-consumer boundary: an ingestion pipeline, a streaming job, or a write path sitting in front of a database.',
    trap: "Wrong: 'We will just buffer it.' An unbounded buffer turns overload into an out-of-memory crash. Say 'I will cap the buffer and choose explicitly whose work we refuse, because leaving that choice unmade is choosing the crash.'",
  },
  ratelimit: {
    name: 'Rate limiting',
    def: 'Turning away requests past a set quota (per user, per IP, or per API key) before they burn real backend capacity, usually using token buckets. It converts unbounded abuse and runaway retry storms into a clean, predictable 429. Putting a limiter in front of your write path is almost always cheaper than sizing your fleet for the worst client you will ever meet.',
    say: 'Rate limiting rejects requests past a quota before they touch real capacity, turning abuse and retry storms into a clean, predictable 429.',
    reachFor:
      'Public APIs, expensive endpoints, and any write path guarding a database you cannot cheaply scale.',
    trap: "Wrong: 'We will just scale to handle the load.' That means provisioning your fleet for the worst client on the internet. Say 'I will rate-limit per key with a token bucket, which is far cheaper than sizing the fleet for abuse.'",
  },
  dns: {
    name: 'DNS',
    def: 'The naming system that turns a hostname (api.example.com) into IP addresses through a hierarchy of caches with TTLs. An uncached lookup adds ~1 to 100ms to a first connection. It is also a traffic steering knob: changing a DNS record shifts traffic between regions, but only at the speed of cache expiry, never instantaneously.',
    say: 'DNS resolves a hostname into an address before any connection starts, and because every resolver along the path caches that answer for its TTL, changing it steers traffic at cache-expiry speed rather than instantly.',
    reachFor:
      "Region steering, disaster failover, first-connection latency budgets, and any rollback plan that claims 'we will just repoint DNS'.",
    trap: "Wrong: 'We will fail over with DNS.' Resolvers cache records until the TTL expires and some ignore TTLs completely, so DNS failover takes minutes. Say 'DNS steers traffic at cache-expiry speed, while per-request failover belongs to the load balancer.'",
  },
  tls: {
    name: 'TLS handshake',
    def: 'The certificate-and-key exchange that upgrades a plain TCP connection to encrypted HTTPS. It adds 1 to 2 extra round trips before the first byte of your request can leave, which costs 100 to 200ms for a far-away user. That per-connection tax is why systems reuse connections (keep-alive, HTTP/2) and terminate TLS at a nearby edge.',
    say: 'A TLS handshake costs one to two extra round trips per new connection before a single request byte moves, so I terminate it at a nearby edge and reuse connections instead of paying it on every call.',
    reachFor:
      'First-byte latency for distant users, connection-churn issues, and short-lived tiers like serverless functions that cannot hold warm keep-alive pools.',
    trap: "Wrong: 'Encryption will burn too much CPU.' Per-byte symmetric encryption is nearly free; the per-connection handshake is the real bill. Say 'The real cost is 1 to 2 round trips per new connection, so the fix is keep-alive and edge termination, not dropping encryption.'",
  },
  connpool: {
    name: 'Connection pool',
    def: 'A small set of pre-opened database connections shared across many app threads, because every connection costs the database memory and a process or thread, and Postgres degrades past a few hundred. Ten thousand concurrent users do not get 10,000 connections; they wait briefly in line for ~100 pooled ones. Once a pool fills up, it behaves like a queue with all the same queueing math.',
    say: 'A connection pool shares a small set of pre-opened database connections across many app threads, because databases charge memory and a process per connection and degrade past a few hundred.',
    reachFor:
      "Any 'the database is slow' investigation, and autoscaling plans where every new app instance multiplies total open connections.",
    trap: "Wrong: 'We will just bump the pool size.' Throwing more connections at the same CPU cores buys contention instead of throughput and moves the queue inside the database. Say 'The pool is a queue, so I will measure wait time at the pool before blaming the database.'",
  },
  herd: {
    name: 'Thundering herd',
    def: 'Thousands of clients acting in lockstep: reconnecting after a network blip, retrying on the exact same backoff timer, or hammering one freshly expired cache key. Every individual client looks polite, and their synchronized timing is what flattens the server. Every fix breaks that synchronization with random jitter on retries and TTLs, staggered reconnects, or dogpile locks.',
    say: 'A thundering herd happens when thousands of polite clients act in lockstep on reconnects, retries, or expired keys, so their shared timing is what knocks the server over.',
    reachFor:
      'Reconnect storms after a blip, cache stampedes on hot keys, and any device fleet running on a shared schedule.',
    trap: "Wrong: 'Each client only sends one request.' Ten thousand simultaneous single requests is the outage. Say 'Every defense breaks the synchronization: jitter on retries and TTLs, staggered reconnects, and a dogpile lock on hot misses.'",
  },
  breaker: {
    name: 'Circuit breaker',
    def: "A protective wrapper that watches calls to a dependency and trips open after enough failures, making further calls fail instantly instead of sitting through timeouts. Failing fast frees the caller's threads, takes load off the struggling dependency so it can recover, and periodically lets a single probe through to check if it is healthy again. It turns 'one slow service takes down everything' into 'one feature degrades cleanly'.",
    say: "A circuit breaker trips open after repeated failures so calls fail immediately instead of waiting out timeouts, freeing the caller's threads and giving the failing dependency room to recover.",
    reachFor:
      'Any downstream dependency whose outage should degrade a single feature instead of pulling down the entire service.',
    trap: "Wrong: 'The timeout handles it.' A timeout still forces every single request to sit there waiting until the clock runs out. Say 'The breaker trips open so we stop paying the timeout at all, then sends periodic probes to test for recovery.'",
  },
  bulkhead: {
    name: 'Bulkhead',
    def: 'Giving each dependency or tenant its own capped pool of threads, connections, or queue slots so exhaustion in one cannot spill into the rest. Without bulkheads, one sluggish payments API can quietly swallow every thread in your app and drag checkout, search, and login down with it. You pay a tiny bit of capacity fragmentation to avoid losing the whole ship.',
    say: 'A bulkhead gives each dependency or tenant its own bounded pool of threads and connections so a stall in one cannot starve the rest of the service.',
    reachFor:
      'Services calling multiple downstream dependencies with different reliability, or multi-tenant systems where one noisy tenant must not sink everyone else.',
    trap: "Wrong: 'A shared thread pool is more efficient.' It is right up until one slow payments API eats every thread and kills checkout, search, and login together. Say 'I will isolate each dependency in its own bounded pool and trade a little fragmentation for containment.'",
  },
  bluegreen: {
    name: 'Blue-green deploy',
    def: 'Running two identical production environments side by side: blue serves live traffic while the new build deploys to green, and then the router flips over. Rolling back is just flipping the router back in seconds instead of sweating through a fresh deploy. The trade-offs are double hardware during the switch and a shared database, meaning schema changes must work with both versions at the same time.',
    say: 'Blue-green runs two identical environments and flips the router between them, turning rollback into a few-second switch rather than an emergency redeploy.',
    reachFor:
      'Releases where instant rollback matters more than paying for double capacity during the switch window.',
    trap: "Wrong: 'Blue-green makes deploys safe.' Both environments share one database, so a schema change that only the new build understands breaks your rollback path. Say 'The flip is only safe when the schema migration stays compatible with both versions at once.'",
  },
  canary: {
    name: 'Canary deploy',
    def: 'Routing a small slice of live traffic (1 to 5%) to a new release, watching error rates and latency closely, and then widening the rollout or pulling it back. It caps the blast radius of a bad deploy to that small slice. Its blind spot is representativeness: a 1% canary can easily miss bugs that only surface under full load or for a specific user cohort.',
    say: 'A canary routes a small slice of live traffic to the new release and watches errors and latency before widening, capping the blast radius of a bad deploy to that slice.',
    reachFor:
      'Risky releases whose real failure modes show up in live production metrics rather than in staging tests.',
    trap: "Wrong: 'The canary was clean, so we are good to ship.' One percent of traffic can easily hide bugs that only appear at peak load or for one cohort. Say 'The canary bounds our blast radius, not our risk at full scale.'",
  },
  cap: {
    name: 'CAP theorem',
    def: 'During a network partition, a distributed system has to pick between refusing some requests to protect consistency or answering with potentially stale data to stay available. It is a mathematical proof, not a marketing slogan, and in real life it is about geography because cross-region partitions are a matter of when, not if. The practical question is per operation: which requests can tolerate stale data, and which must never?',
    say: 'During a network partition, a distributed system must choose per operation between refusing unconfirmed requests to stay consistent or answering with possibly stale data to stay available.',
    reachFor:
      'Any multi-region or replicated architecture, since partitions across regions are a matter of when rather than if.',
    trap: "Wrong: 'We are a CP system.' CAP applies to individual operations, not whole systems. Say 'Checkout has to stay consistent while the browse page can serve stale data, because the real design question is per operation.'",
  },
  quorum: {
    name: 'Quorum',
    def: 'Requiring a majority of replicas (2 of 3, or 3 of 5) to acknowledge a write or answer a read, guaranteeing that any two majorities overlap on at least one node holding the latest value. That guaranteed overlap is what keeps data consistent even while a minority of nodes are down. It is also why replica counts are odd and why every quorum write moves at the speed of the slowest node in its majority.',
    say: 'A quorum requires a majority of replicas to respond so every read majority and write majority overlap on at least one node with the latest value, and that overlap is the entire consistency guarantee.',
    reachFor:
      'Tunable consistency, explaining why replica counts are odd, and showing how clusters actually prevent split brain.',
    trap: "Wrong: 'Quorum just means most nodes agreed.' What actually matters is forcing the read set and write set to intersect. Say 'W plus R greater than N guarantees the read set touches a node that saw the write, which is pigeonhole arithmetic, not a popularity vote.'",
  },
  leader: {
    name: 'Leader election',
    def: 'Choosing exactly one node to accept writes so ordering has a single source of truth, backed by consensus so a network split cannot accidentally crown two leaders (split-brain). Because elections trigger right when something is already breaking, there is a window with no leader at all where writes pause. Leader-based designs therefore spend a lot of engineering effort making that gap as brief as possible.',
    say: 'Leader election picks one node via consensus to accept writes so ordering stays singular and a network split cannot crown two leaders at once.',
    reachFor:
      'Single-writer designs like a primary database, a partition leader, or a scheduled job that must run on exactly one box.',
    trap: "Wrong: 'Having a leader keeps writes consistent and smooth.' There is an unavoidable window with no leader right when the cluster is already failing. Say 'Writes stall during an election, so the real design question is how short we can make that gap.'",
  },
  exactlyonce: {
    name: 'Exactly-once',
    def: 'Delivering and processing a message precisely one time, which no network can guarantee on its own because acknowledgments themselves can get lost. Real systems build it honestly out of two pieces: at-least-once delivery plus idempotent processing that deduplicates on an operation ID, so duplicates still arrive but never take effect twice. When a vendor promises exactly-once, they mean that composition, and the real question is where the idempotency key lives.',
    say: 'No network gives you native exactly-once delivery, so real systems compose it from at-least-once delivery plus idempotent processing keyed on an operation ID.',
    reachFor:
      'Deconstructing vendor claims, or explaining how Kafka transactions and Flink checkpoints actually deliver what they advertise.',
    trap: "Wrong: 'Our message broker guarantees exactly-once.' Acknowledgments can drop on the wire, making redelivery unavoidable. Say 'Exactly-once is at-least-once plus deduplication, and the load-bearing piece is where we store the idempotency key.'",
  },
  atleastonce: {
    name: 'At-least-once',
    def: 'The workhorse delivery guarantee: keep retrying until an acknowledgment comes back so nothing disappears, accepting that the same message may arrive twice when an acknowledgment gets lost in transit. Choosing at-least-once makes duplicates a guaranteed part of normal life, which forces every consumer to be idempotent. Its alternative, at-most-once, avoids duplicates only by accepting silent data loss.',
    say: 'At-least-once retries until acknowledged so nothing disappears, accepting occasional duplicates whenever an acknowledgment gets lost instead of the message.',
    reachFor:
      'The right default for nearly every production queue, always paired with an idempotent consumer.',
    trap: "Wrong: 'We will use at-most-once to avoid duplicates.' You just swapped visible duplicates for silent data loss. Say 'I take at-least-once and make the consumer idempotent, because a duplicate I can deduplicate beats a lost message I never knew about.'",
  },
  visibility: {
    name: 'Visibility timeout',
    def: "A queue's built-in crash-recovery window: pulling a message hides it instead of deleting it while a worker handles the job. If the worker finishes, it deletes the message; if it crashes, the timer runs out and the message pops back up for another worker to claim. Set it shorter than your slowest job, and healthy in-flight work reappears and runs twice.",
    say: "A visibility timeout hides a claimed message instead of deleting it while a worker runs, so if that worker crashes the job automatically reappears for someone else.",
    reachFor:
      'SQS-style queues, and explaining the concrete mechanism that actually implements at-least-once delivery.',
    trap: "Wrong: 'Set a short visibility timeout so failed jobs recover fast.' Shorter than your slowest job means healthy work reappears mid-flight and executes twice. Say 'The timeout has to clear p99 processing time, and the consumer still needs to be idempotent.'",
  },
  dlq: {
    name: 'Dead-letter queue',
    def: "A side queue where messages land after failing N processing attempts, stopping one poison message (bad payload or bug trigger) from looping forever while healthy work backs up behind it. It also doubles as your forensic trail: turning 'workers kept crashing all night' into 'these 14 exact messages failed, fix the bug and replay them'.",
    say: 'A dead-letter queue sidelines messages after N failed attempts so one poison message cannot trap workers in endless retries while healthy jobs pile up behind it.',
    reachFor:
      'Every production queue, as the concrete operational answer for what happens to unprocessable messages.',
    trap: "Wrong: 'Failed messages just get retried.' Retrying forever lets one bad payload ruin the night shift. Say 'After N failures it moves to a DLQ that acts as our forensic record: these fourteen messages broke, replay them once the fix lands.'",
  },
  hotpartition: {
    name: 'Hot partition',
    def: "One shard taking way more traffic than its neighbors because too many writers hash to the same partition key, like a timestamp bucket, today's date, or a viral post's ID. The rest of the cluster sits mostly idle while that one node melts down, proving that total cluster capacity means nothing when per-key capacity is the ceiling. The fix is salting or composing keys so concurrent writers fan out across partitions.",
    say: 'A hot partition happens when many writers hash to the same key so one shard saturates while the rest of the cluster sits mostly idle.',
    reachFor:
      'Partition-key reviews, and any incident where overall cluster capacity looks fine while a single node throttles.',
    trap: "Wrong: 'We will just provision more capacity.' Partition limits apply per key range, so one hot key still gets pinned to one partition no matter how big the table is. Say 'I will salt or compose the key so concurrent writers spread across different partitions.'",
  },
  readyourwrites: {
    name: 'Read-your-own-writes',
    def: "The consistency guarantee users actually feel: right after saving a post or edit, the author's own next read shows the update, even if strangers see the old version for a second longer. Replication lag breaks this immediately: write to the primary, read from a lagging replica, and the brand-new comment seems to vanish. Systems fix it by pinning the author's reads to the primary briefly after a write or routing by session.",
    say: "Read-your-own-writes guarantees that an author's next read reflects their own save immediately, even while other users may see slightly stale data for a moment.",
    reachFor:
      'Posts, comments, profile edits, and any user-facing write flow where you want the cheapest consistency guarantee people actually notice.',
    trap: "Wrong: 'We need strong consistency everywhere.' Usually you only need this narrower, much cheaper guarantee. Say 'I will pin reads for the author to the primary for a few seconds after a write instead of making every global read coordinate.'",
  },
  replag: {
    name: 'Replication lag',
    def: "The delay between a write committing on the primary and showing up on a replica: usually milliseconds in calm weather, but unbounded under heavy load because replication lag is a queue and queues blow up past the knee. It is the catch hidden inside 'just add replicas': every replica read is a snapshot of the recent past. Your job is deciding which reads can live with that and which cannot.",
    say: 'Replication lag is the delay between a write committing on the primary and appearing on a replica, usually milliseconds until load spikes because lag itself is a queue.',
    reachFor:
      'Any architecture serving reads from replicas, and the immediate follow-up about what users see right after posting.',
    trap: "Wrong: 'Replication lag is only a few milliseconds.' Because it behaves like a queue, it stays tiny right up until it spikes wildly. Say 'Reads that must see their own write hit the primary, and every replica read accepts seeing the recent past.'",
  },
  cdn: {
    name: 'CDN',
    def: 'A network of servers spread across hundreds of cities that caches content close to users. Distance sets the speed limit for round trips, so serving bytes from 50 km away beats every server optimization you could ever make from 2,000 km away. A CDN absorbs most read traffic before it touches your origin and is often the cheapest capacity you can buy, though personalized and write requests still travel the full distance.',
    say: 'A CDN caches responses across hundreds of cities so round trips run 50 kilometers instead of 2,000, absorbing most read traffic before it ever reaches the origin.',
    reachFor:
      'Static assets, images, video, and any cacheable global read, usually the cheapest capacity on the board.',
    trap: "Wrong: 'We will put a CDN in front of it.' A CDN only helps cacheable responses, while personalized reads and writes still cross the full distance. Say 'The CDN absorbs static and shared responses, and I will size the origin for everything that slips past it.'",
  },
  autoscaling: {
    name: 'Autoscaling',
    def: 'Automated rules that add or remove servers based on live signals like CPU, queue depth, or request rate. It handles gradual daily ramps smoothly, but it misses sharp spikes because fresh instances take minutes to boot and warm up, so a 10-second surge is over before reinforcements arrive. That boot-time gap is why autoscaled systems still need queues, caches, and headroom.',
  },
  index: {
    name: 'Index',
    def: 'A sorted copy of chosen columns that turns "scan a billion rows" into "walk a tree in a few page reads." You pay for that read speed on the write path, since every insert has to update every index, adding both storage and write amplification. Each index is a read-versus-write trade made one table at a time.',
    say: 'An index keeps a sorted copy of selected columns so lookups take a few page reads instead of scanning a billion rows, paid for by extra work on every write.',
    reachFor:
      'Slow-query debugging, and schema reviews where someone wants to slap a fourth or fifth index onto one table.',
    trap: "Wrong: 'Add an index, it can only help.' Every index adds storage and an extra write per insert, and on small or low-selectivity tables the planner will ignore it anyway. Say 'I will index the exact column this query filters on and accept the extra write per insert.'",
  },
  throughput: {
    name: 'Throughput vs latency',
    def: "Throughput measures how much work finishes per second; latency measures how long one single request takes. They are different axes and they often pull against each other: batching boosts throughput while adding wait time, and pushing utilization toward 100% squeezes out maximum throughput while queueing wrecks latency. If a spec just says 'make it fast', it has not told you which one matters yet.",
  },
  timeout: {
    name: 'Timeout',
    def: "The ceiling on how long a caller waits for a dependency before giving up. Without a timeout, one sluggish downstream service quietly pins your caller's threads until everything upstream freezes, because slowness spreads much farther than crisp errors do. Timeouts must shrink as calls go deeper since a caller's budget caps its callee's, and every timeout needs a clear fallback: retry, degrade, or fail.",
    say: 'A timeout caps how long a caller waits before bailing out, because without one a slow dependency holds your threads until everything upstream stalls with it.',
    reachFor:
      'Every network call without exception, and any outage where everything slowed to a crawl instead of throwing clean errors.',
    trap: "Wrong: 'We set a generous timeout just to be safe.' Generous means your threads stay pinned longer during the exact outage you wanted to survive. Say 'Timeouts shrink at deeper hops because the caller bounds the callee, and each one pairs with a deliberate fallback.'",
  },
  retry: {
    name: 'Retry (with backoff + jitter)',
    def: 'Repeating a failed request with exponentially growing waits plus random jitter so thousands of clients do not hammer the server in lockstep, turning recovery into a self-inflicted thundering herd. Transient blips happen often enough that retries are essential, provided you follow two rules: the operation must be idempotent, and retries need a budget so they cannot multiply load during a real outage.',
    say: 'Retries repeat a failed call using exponential backoff plus random jitter, because synchronized retries turn a brief blip into a self-inflicted thundering herd.',
    reachFor:
      'Transient hiccups like a network blip, short overload, or failover where a second try has a real shot at succeeding.',
    trap: "Wrong: 'We retry three times.' Without jitter clients strike in lockstep, and without a budget retries multiply traffic during an outage. Say 'Exponential backoff with jitter, a strict retry budget, and an idempotent operation, otherwise retries amplify outages instead of healing them.'",
  },
  rest: {
    name: 'REST API',
    def: 'An HTTP API convention where URLs name resources (/users/42) and verbs (GET, POST, PUT, DELETE) name the action, letting the protocol itself carry meaning. That discipline pays off at scale: GETs are cacheable and safe to repeat, while PUT and DELETE are idempotent by contract. Those guarantees are what let CDNs, caches, and retry logic work safely without corrupting data.',
  },
  pagination: {
    name: 'Pagination',
    def: 'Returning a long list in fixed-size pages instead of all at once so a single request never hauls back a million rows and blows up latency and memory. Cursor-based pagination (a pointer to the last item seen) beats offset-based (LIMIT/OFFSET) cleanly: offsets re-scan every skipped row and silently duplicate or drop items whenever data shifts between pages.',
  },
  normalization: {
    name: 'Normalization',
    def: 'Storing every fact in exactly one place and linking to it by key, so an update touches one row and your data cannot contradict itself. You pay for that cleanliness at read time, because piecing a full view together takes multi-table joins that get pricier as tables grow. That is why read-heavy systems often layer denormalized views on top of a normalized core.',
    say: 'Normalization stores each fact once and reassembles views with joins, so updates touch one row and data cannot drift out of sync with itself.',
    reachFor:
      'Write-heavy, correctness-critical models like ledgers or inventory where two copies disagreeing triggers a 3am page.',
    trap: "Wrong: 'Normalize everything so it stays correct.' Correctness and read speed are separate axes, and a hot feed pays that join cost on every single view. Say 'I will normalize the source of truth and denormalize the read path on top of it.'",
  },
  denormalization: {
    name: 'Denormalization',
    def: 'Intentionally duplicating data by pre-joining it into the exact shape a screen needs, turning a multi-table join into one fast lookup. The price is extra write work and consistency risk, because every copy has to be updated and copies can drift apart. It pays off when reads crush writes in volume, and hurts when they do not.',
    say: 'Denormalization pre-joins data into the exact shape a screen reads so queries take one lookup, trading extra write work and copy drift for read speed.',
    reachFor:
      'Read-heavy views with a stable shape like a feed, profile, or product listing where reads outnumber writes by orders of magnitude.',
    trap: "Wrong: 'Denormalize for performance.' You did not erase the work, you moved it onto every write and invited copy drift. Say 'Reads outnumber writes a hundred to one here, so I will duplicate data and absorb the write fan-out.'",
  },
  join: {
    name: 'Join',
    def: 'Combining rows from separate tables on a matching key at query time. Joins are what make normalized, single-copy schemas usable, though their CPU and I/O costs grow alongside table size. Once tables get sharded across separate machines, joins turn painful or impossible, which is a huge reason NoSQL databases drop them altogether.',
    say: 'A join stitches rows from separate tables on a shared key at query time, enabling normalized storage right up until tables split across separate machines.',
    reachFor:
      'Relational schema design, and explaining the exact capability NoSQL databases gave up to scale horizontally.',
    trap: "Wrong: 'Joins are slow.' A well-indexed join across a few local tables is plenty fast; what hurts is joining across shards or starving the planner. Say 'Joins stay cheap until data spreads across machines, which is the point where I denormalize.'",
  },
  acid: {
    name: 'ACID',
    def: "The four transactional promises of a classic relational database: Atomicity (all or nothing), Consistency (declared rules always hold), Isolation (concurrent transactions do not see each other's half-finished work), and Durability (committed data survives a crash). Together they keep a bank transfer from losing money mid-flight, and because every commit pays an fsync, they also bound write throughput to thousands per second.",
    say: "ACID guarantees atomicity, consistency, isolation, and durability so transactions run all-or-nothing, uphold rules, hide partial work, and survive crashes.",
    reachFor:
      'Backing money, inventory, or bookings with a relational database whenever a half-finished write would cause real-world harm.',
    trap: "Wrong: 'It is ACID, so concurrency is handled.' Isolation is a dial, and most databases ship it set to read committed. Say 'ACID hands me atomicity and durability out of the box, while isolation is a level I still have to pick and pay for.'",
  },
  nosql: {
    name: 'NoSQL',
    def: 'A family of non-relational stores (key-value, document, wide-column, and graph) that give up joins and strict ACID in return for horizontal scale and schemas tailored to one access pattern. You have to know your queries up front because you design the partition key first and everything else flows from it. It earns its keep when access patterns are stable and scale truly demands it.',
    say: 'NoSQL trades away joins and strict ACID for horizontal scale and a schema built around one access pattern, which means knowing the queries before designing the table.',
    reachFor:
      'Well-understood, fixed access patterns at high scale: session stores, social feeds, or device telemetry tables.',
    trap: "Wrong: 'NoSQL scales better.' It scales differently by forcing you to lock in your access pattern up front. Say 'I would pick it because I know the exact query and can choose a spreading partition key, not because relational databases hit a wall.'",
  },
  blob: {
    name: 'Blob / object storage',
    def: 'Large binary files (images, video, backups) stored in a flat key-to-bytes service like S3 or GCS for ~$0.02/GB/mo, vastly cheaper and more scalable than block storage. Keeping blobs out of your database matters because multi-megabyte rows bloat indexes, push hot data out of cache, and cost far more per byte. Put the bytes in object storage and keep only the key in your database.',
    say: 'Blob storage holds large binaries in a flat key-to-bytes service at roughly two cents per gigabyte-month, leaving only the key and metadata in the database.',
    reachFor:
      'Images, video, PDFs, and backups: anything measured in megabytes instead of bytes.',
    trap: "Wrong: 'We will just store the file in the database.' Multi-megabyte rows bloat indexes, evict useful cache entries, and multiply storage costs. Say 'The bytes go straight to object storage while the database row keeps the key and the metadata we query on.'",
  },
  presigned: {
    name: 'Presigned URL',
    def: 'A short-lived, permission-scoped link letting a client read or write one exact object directly in blob storage so the bytes never pass through your app servers. Without it, a single 2 GB upload pins an app-server thread and its memory buffers for minutes. Your API hands out the ticket, and the heavy lifting runs straight between client and storage.',
    say: 'A presigned URL gives a client a time-limited, scoped ticket to transfer bytes straight to object storage so a two-gigabyte upload never touches an app server.',
    reachFor:
      'Large upload or download paths like user media, exports, and backups where proxying bytes would tie up app threads for minutes.',
    trap: "Wrong: 'Uploads go through our API.' Proxying pins threads and buffers for the whole transfer and turns your app tier into a bandwidth bill. Say 'The API issues a presigned URL, the client uploads straight to object storage, and then calls back with the object key.'",
  },
  invertedindex: {
    name: 'Inverted index',
    def: 'The core data structure behind search engines: a map from each word to the list of documents containing it, turning a text query into fast lookups and list merges instead of scanning every row. Engines build it at write time by tokenizing and indexing every document. That extra write work and specialized layout is why search usually lives in its own eventually consistent cluster fed from the primary database.',
    say: 'An inverted index maps every word to the documents containing it, turning full-text search into fast lookups and list merges instead of scanning every row.',
    reachFor:
      'Product search, log search, autocomplete, and any text query where a wildcard LIKE would scan the whole table.',
    trap: "Wrong: 'We will just add a search index to the database and call it done.' Full-text search is a separate, eventually consistent system fed from your primary store. Say 'I will run a search cluster fed by change data capture and call out explicitly that it lags the source of truth.'",
  },
  apigateway: {
    name: 'API gateway',
    def: 'A single front service sitting ahead of your backends to handle shared chores once: TLS termination, authentication, rate limiting, routing, and sometimes stitching multiple backend replies together. Putting those jobs in one place stops every team from rebuilding auth and quotas slightly differently. Because every request passes through it, the gateway has to stay lean and highly available.',
  },
  stream: {
    name: 'Stream (event log)',
    def: 'An ordered, retained, replayable log of events (like Kafka) that many independent consumers read at their own pace using their own offset. Unlike a queue, reading a message does not erase it, and a single broker sustains ~1M msgs/s because it only appends sequentially. Combining retention with consumer offsets lets a brand-new service show up months later and replay all of history.',
    say: 'A stream is an ordered, retained log that independent consumers read at their own offsets without deleting messages, letting a new consumer show up later and replay history.',
    reachFor:
      'Multiple independent services consuming the same events, audit trails, or reprocessing history after shipping a bug fix.',
    trap: "Wrong: 'A stream is basically a queue.' A queue deletes on consume, whereas a log deletes on retention. Say 'The log holds events for its retention window, which is what enables replay and independent consumers.'",
  },
  eventsourcing: {
    name: 'Event sourcing',
    def: 'Storing the ordered sequence of changes (events) as your source of truth and rebuilding current state by replaying them, instead of overwriting one latest row. It gives you a complete audit log and lets you construct new views, or fix past bugs retroactively, by replaying history. You pay for that power in extra storage and the permanent commitment to keep old event schemas replayable forever.',
    say: 'Event sourcing treats the log of state changes as the source of truth and derives current state by replay, giving you a full audit trail and rebuildable views.',
    reachFor:
      'Domains where history itself is the product requirement (ledgers, order lifecycles, compliance) or where retroactive bug fixes matter.',
    trap: "Wrong: 'We will event-source it for flexibility.' You just signed up to keep every historical event schema replayable forever. Say 'I use event sourcing when the audit trail is a real requirement, and I price schema evolution as a permanent tax.'",
  },
  distlock: {
    name: 'Distributed lock',
    def: 'A lock coordinated across machines so only one worker runs a critical action at a time, like charging a card once or running a single fleet-wide cron. Because any holder can freeze or crash, safe locks are time-bounded leases paired with a fencing token that the protected resource checks. Since locking is really an agreement problem across machines, reliable locks live on a consensus store (etcd, ZooKeeper) instead of a lone Redis key.',
    say: 'A distributed lock keeps a critical action down to one worker across machines, and because holders can pause or crash it must be a time-bounded lease paired with a fencing token.',
    reachFor:
      'Charging a card once, running a single cron across a fleet, or guarding any side effect that must never happen twice.',
    trap: "Wrong: 'We just use a Redis key as a lock.' A lone key gives you neither consensus nor fencing. Say 'A lock is agreement across machines, so I will back it with etcd or ZooKeeper and have the protected resource verify the fencing token.'",
  },
  lease: {
    name: 'Lease',
    def: "A lock granted for a fixed slice of time that the holder must keep renewing, so if a worker crashes its lock expires automatically instead of deadlocking the cluster. The catch is that a paused holder can lose its lease while still thinking it owns the resource. Systems block that stale writer with a fencing token, a strictly rising number the resource checks on every write.",
    say: "A lease is a time-bounded lock that must be renewed to stay alive, so a crashed holder's lock expires on its own instead of deadlocking the system.",
    reachFor:
      'Distributed locks, leader terms, and session coordination whenever a holder might simply vanish mid-flight.',
    trap: "Wrong: 'The lease expired, so the old holder stopped.' A paused process has no idea its lease ran out. Say 'Expiry prevents permanent deadlocks, while a fencing token checked at the resource is what actually blocks the stale writer.'",
  },
  websocket: {
    name: 'WebSocket',
    def: 'A persistent, full-duplex connection over a single TCP socket where both client and server can push messages at any instant with tiny latency, ideal for chat, multiplayer games, and live trading. The catch is statefulness: every open socket ties up memory on one specific machine. Realtime architectures get tricky right at the routing layer that has to deliver each message to whichever server holds that user.',
    say: 'A WebSocket keeps one full-duplex connection open so either side can send immediately, which fits chat or trading, though pinning every socket to one server makes cross-server message routing the hard part.',
    reachFor:
      'Low-latency two-way traffic where clients send almost as often as servers: chat, multiplayer, collaborative editing, live trading, and presence.',
    trap: "Wrong: 'We will use WebSockets for live updates.' When data only flows one way, you took on stateful connections for nothing. Say 'Updates only flow server to client here, so SSE gives us push over plain HTTP with auto-reconnect and no sticky-routing tier.'",
  },
  sse: {
    name: 'Server-sent events',
    def: 'A long-lived, one-way stream from server to client over plain HTTP with automatic reconnection built right in, making it a natural fit for feeds, notifications, and live dashboards. It is lighter than a WebSocket and glides through proxies and firewalls as normal HTTP. Because it only pushes server to client, user actions simply travel back as regular HTTP requests.',
    say: 'Server-sent events give me one-way server-to-client push over plain HTTP with automatic reconnection, covering feeds and dashboards without the sticky routing WebSockets demand.',
    reachFor:
      'One-way live updates where the client only reads: feeds, notifications, dashboards, job progress bars, and streaming model output.',
    trap: "Wrong: 'SSE is just a weaker WebSocket.' It is deliberately narrower so it stays simpler. Say 'It runs one-way over standard HTTP, clears proxies cleanly, and reconnects itself, so I only pay for duplex WebSockets when the client needs to push.'",
  },
  polling: {
    name: 'Polling',
    def: 'The client repeatedly asking "anything new?" on a timer because standard HTTP does not let the server speak first. It runs everywhere and is dead simple to operate, though most replies come back empty when changes are rare and data stays stale for half the polling interval on average. Long-polling and push protocols exist specifically to cut out those empty trips and that lag.',
    say: "Polling has the client ask on a timer because plain HTTP will not let the server speak first, which works everywhere at the cost of empty requests and staleness averaging half the interval.",
    reachFor:
      'Infrequent updates, huge or untrusted client fleets, and places where dead-simple operations beat shaving off a few seconds of freshness.',
    trap: "Wrong: 'Polling does not scale.' The interval makes that call, not the technique. Say 'At a 10-second interval, a million clients means 100k mostly empty requests a second so push wins, whereas at one poll an hour polling is completely fine.'",
  },
  saga: {
    name: 'Saga',
    def: 'A cross-service transaction broken into a chain of local steps, each paired with a compensating action that undoes its effect if a later step fails. It trades strict atomicity for availability, leaving a brief window where early steps have committed while later ones have not. Every step must be idempotent, and any compensation that fails gets routed to a human via a dead-letter queue.',
    say: 'A saga runs a multi-service transaction as a chain of local steps paired with compensating actions, trading strict atomicity for availability.',
    reachFor:
      'Workflows crossing services with separate databases (booking, checkout, onboarding) where two-phase commit would lock everything up.',
    trap: "Wrong: 'The saga rolls back on failure.' Every earlier step already committed, so there is nothing to roll back. Say 'Each step pairs with a compensating action, and I order the workflow so the hardest step to compensate runs last.'",
  },
  '2pc': {
    name: 'Two-phase commit (2PC)',
    def: 'A protocol where a coordinator asks every participant to prepare a transaction and then, if all agree, tells them to commit, delivering true atomicity across separate databases. The downside is blocking: participants hold locks while waiting, and if the coordinator crashes they can stay stuck holding those locks. Teams save 2PC for a small set of fast local steps that genuinely must be atomic, and switch to sagas at scale.',
    say: 'Two-phase commit has a coordinator ask every participant to prepare and then commit for cross-database atomicity, at the cost of participants holding locks while they wait.',
    reachFor:
      'A tiny set of fast operations that truly must be atomic inside a single trust and latency boundary.',
    trap: "Wrong: 'We will use 2PC across our microservices.' It blocks, and a coordinator crash leaves participants holding locks with nobody left to resolve them. Say 'Beyond a couple of fast local participants, I use a saga and design the compensations up front.'",
  },
  optimistic: {
    name: 'Optimistic concurrency',
    def: 'Handling contention by letting writers race without locks: read a version number, commit only if that version is still untouched (compare-and-set), and retry if someone beat you. When conflicts are rare, it is the fastest path because nobody waits on a lock. Under heavy contention it thrashes on endless retries, where a pessimistic lock or a single serialized owner pulls ahead.',
    say: 'Optimistic concurrency lets writers race without locks and commits only if the version is unchanged, which wins whenever conflicts are rare.',
    reachFor:
      'Low-contention writes like profile edits or document saves where holding a lock costs more than an occasional retry.',
    trap: "Wrong: 'Optimistic locking is always faster.' Under heavy contention every losing writer redoes its work and throughput collapses. Say 'Optimistic wins below a conflict threshold and pessimistic wins above it, and that conflict rate is something we can measure.'",
  },
  geohash: {
    name: 'Geohash',
    def: 'An encoding that interleaves latitude and longitude bits into one sortable string so nearby points share a prefix, letting an ordinary database index answer "near me" with a simple prefix range scan. It flattens a 2D proximity search into a 1D lookup. The wrinkle is cell borders: a point sitting near an edge has close neighbors in adjacent cells, so you have to check those too.',
    say: 'A geohash weaves latitude and longitude bits into one sortable string so nearby places share a prefix, letting an ordinary database index handle proximity as a range scan.',
    reachFor:
      'Near-me queries on a database you already run, without standing up a dedicated spatial engine.',
    trap: "Wrong: 'Matching the prefix gives you everything nearby.' A point near a cell edge has its closest neighbors under a completely different prefix. Say 'I query the cell plus its eight neighbors, then filter the results by true distance.'",
  },
  quadtree: {
    name: 'Quadtree',
    def: 'A spatial index that recursively divides a map into four quadrants, splitting only where points pack tightly so cities get fine cells while oceans stay coarse. It handles lopsided density far better than a fixed grid. The trade-off is heavier maintenance whenever objects move around, which is what you weigh against a simpler geohash.',
    say: 'A quadtree recursively splits a map into four quadrants only where points cluster, giving cities fine cells and oceans coarse ones so both take roughly the same query work.',
    reachFor:
      'Wildly uneven spatial density where a fixed grid would be mostly empty squares plus a few overloaded hotspots.',
    trap: "Wrong: 'A quadtree is faster than a geohash.' It adapts better to uneven density, while costing more to keep updated as objects move. Say 'I start with geohashing on the index I already have, and switch to a quadtree or R-tree once density is genuinely uneven.'",
  },
  consistenthash: {
    name: 'Consistent hashing',
    def: 'Placing both nodes and keys on a hash ring where each key belongs to the next node clockwise, so adding or removing a machine only moves roughly 1/N of the keys instead of reshuffling nearly all of them. That stability lets distributed caches and partitioned stores resize smoothly instead of triggering a total miss storm.',
    say: 'Consistent hashing maps nodes and keys onto a ring where each key belongs to the next node clockwise, so adding or removing a node only moves about one in N keys instead of almost everything.',
    reachFor:
      'Distributed caches and partitioned stores that need to grow or shrink without triggering a system-wide reshuffle and total cache miss storm.',
    trap: "Wrong: 'Consistent hashing balances load evenly.' It limits how many keys move during a resize, while virtual nodes are what actually even out the load. Say 'Consistent hashing bounds key movement on topology changes, and I add virtual nodes so the arcs stay balanced.'",
  },

  /* ---- Networking (spec 065) — the transport floor everything above assumes.
     Every entry here carries the full speakable set: say / reachFor / trap. */
  ip: {
    name: 'IP',
    def: "The Internet Protocol: the L3 contract giving every machine an address and best-effort packet delivery anywhere on earth. 'Best effort' means it promises to try, never to succeed: packets can drop, duplicate, or arrive out of order, and every reliable protocol builds on top of that honesty. Routing, BGP, and peering fulfill that contract behind the scenes so your code can reach a machine across an ocean without knowing a single hop in between.",
    say: 'IP gives every machine an address and best-effort packet delivery, promising to try rather than succeed, and everything reliable on the internet is built on top of that honesty.',
    reachFor:
      'Explaining why regions, round trips, and geography constrain a design before you even pick a protocol.',
    trap: "Wrong: 'The network will deliver it.' IP never promised that. Say 'IP is best-effort, so TCP hides loss while UDP hands it to us raw; reliability is a choice at L4, not something the wire owes us.'",
  },
  rtt: {
    name: 'RTT (round trip)',
    def: "Round-trip time: one complete there-and-back trip between two endpoints, and the network's fundamental unit of cost. Light in fiber moves at roughly 200,000 km/s, which puts a hard physical floor under latency: ~1 ms across a city, ~70 ms across a country, and ~150 ms across an ocean, with no protocol trick able to beat it. Handshakes, retransmits, and consensus rounds all bill in round trips, so counting RTTs predicts latency far better than counting bytes.",
    say: "A round trip is the network's unit of cost, bounded by the speed of light in fiber, so handshakes, retransmits, and consensus rounds all carry RTT bills you cannot optimize away.",
    reachFor:
      'Any latency budget: pricing handshakes or retransmits, and explaining why cross-region calls start ~70 to 150 ms behind.',
    trap: "Wrong: 'We have plenty of bandwidth, so latency is fine.' A wider pipe moves more bytes per trip, never a faster trip. Say 'Bandwidth and latency are separate budgets; this cross-country path costs ~70 ms per round trip, so we fix it with fewer round trips, not a bigger link.'",
  },
  tcp: {
    name: 'TCP',
    def: 'The connection-oriented transport underneath HTTP: it numbers every byte, acknowledges what arrived, retransmits what went missing, and backs off when the network starts dropping packets. That bookkeeping delivers an ordered, complete byte stream, and it is also what makes TCP stall because one missing segment holds back every byte already waiting behind it. You pay for reliability in setup round trips and unpredictable tail pauses.',
    say: 'I default to TCP because HTTP, gRPC, and database protocols expect an ordered, reliable byte stream, and I only drop down to UDP when a late packet is worse than a lost one.',
    reachFor:
      'Anything where completeness beats freshness (page loads, API calls, file transfers, database connections), right up until a strict latency target forces a different choice.',
    trap: "Wrong: 'TCP is slow.' TCP is not slow; its guarantees cost round trips. Say 'TCP pays a setup handshake and can head-of-line block on packet loss, adding roughly 100 ms before the first byte, which we have to weigh against this latency budget.'",
  },
  udp: {
    name: 'UDP',
    def: 'A bare-bones transport that fires off datagrams with no connection setup, no acknowledgments, no retransmissions, and no ordering. Packets can show up late, out of order, or never at all, leaving the application in charge of what to do next. That hands-off approach is a feature when the next update is already on its way, which is why voice, video, and live game state run on UDP.',
    say: 'UDP trades delivery guarantees for raw latency, skipping handshakes, retransmits, and ordering so it wins whenever a late packet is worse than a lost one.',
    reachFor:
      'Live media and telemetry (voice, video, game state, metrics firehoses, DNS queries) where a fresh packet replaces a lost one before a retransmit could arrive.',
    trap: "Wrong: 'UDP is unreliable, so it is risky.' Unreliability is the exact feature you are choosing. Say 'The application handles loss directly so we drop a stale audio frame instead of retransmitting it, because a 200 ms-late frame is useless anyway.'",
  },
  handshake: {
    name: 'Handshake',
    def: 'The introductory round trips two endpoints spend setting up before a single byte of payload moves: TCP opens the connection, then TLS negotiates keys and certificates on top. Because each round trip crosses the full link distance, a cold connection to a distant server burns 100 to 200ms before your first request byte even leaves. That upfront per-connection tax is why systems reuse warm connections and terminate TLS close to the user.',
    say: 'A handshake is the fixed startup tax on every new connection, costing one round trip for TCP plus one or two for TLS, so I reuse connections and terminate TLS at the edge.',
    reachFor:
      'First-byte latency budgets, cold mobile clients, cross-region calls, connection churn, or serverless tiers that struggle to keep pools warm.',
    trap: "Wrong: 'Adding HTTPS is basically free.' It is nearly free per byte, not per new connection. Say 'Every fresh connection pays 1 to 2 extra round trips, roughly 100 ms for a distant user, so the fix is keep-alive and edge termination.'",
  },
  headofline: {
    name: 'Head-of-line blocking',
    def: 'One stalled item holding up everything ready to move behind it. In TCP it happens literally on the wire: one dropped segment forces the receiver to buffer every later byte until the retransmit arrives, freezing ten multiplexed HTTP/2 streams on that connection over a single lost packet. The exact same bottleneck turns up in queues and worker pools, and the cure never changes: give independent work independent lanes.',
    say: 'Head-of-line blocking happens when one stuck item freezes ready work behind it, like one dropped TCP packet stalling every multiplexed HTTP/2 stream, which is why HTTP/3 moved to QUIC over UDP.',
    reachFor:
      'Explaining why multiplexing onto one TCP socket is not free, why one slow consumer stalls a partition, or why one poison message gums up a worker pool.',
    trap: "Wrong: 'HTTP/2 solved head-of-line blocking.' It only solved it at the HTTP layer. Say 'HTTP/2 removed the application-level queue, but every stream still shares one TCP connection so one lost packet stalls all of them; QUIC gives each stream independent recovery.'",
  },
  quic: {
    name: 'QUIC',
    def: "A modern transport that rebuilds TCP's best ideas over UDP: one connection carries many independent, ordered streams so a dropped packet pauses only its own stream instead of freezing the whole connection. It folds TLS right into the first round trip, and it rides inside UDP because operating systems and network middleboxes ossified around TCP, making a brand-new native protocol impossible to deploy. HTTP/3 runs on QUIC, finally ending cross-stream head-of-line blocking.",
    say: "QUIC rebuilds TCP's guarantees over UDP with independent streams so one dropped packet never stalls the rest and encryption rides in the first round trip, which is what powers HTTP/3.",
    reachFor:
      "Explaining why HTTP/2's single-socket multiplexing still suffered from head-of-line blocking, and naming the modern fix cleanly.",
    trap: "Wrong: 'We should build our API on QUIC.' It is a great depth signal, not an automatic default. Say 'QUIC powers HTTP/3 so each stream repairs its own loss, and I reach for it when handshake latency or head-of-line blocking is our actual bottleneck.'",
  },
  grpc: {
    name: 'gRPC',
    def: 'A remote-procedure-call framework running over HTTP/2: you define services in a schema, generate typed client and server code, and invoke remote calls almost like local functions. Payloads travel as compact binary Protobuf that parses far faster than JSON, while one HTTP/2 socket multiplexes many concurrent calls. Because browsers cannot speak it natively and raw frames are unreadable on the wire, gRPC dominates internal service-to-service traffic while REST and JSON hold the public edge.',
    say: 'I use gRPC for internal service-to-service traffic to get generated clients, compact Protobuf payloads, and HTTP/2 multiplexing, while keeping REST and JSON at the public edge for browsers and easy debugging.',
    reachFor:
      'High-volume internal RPC, polyglot microservice fleets needing one shared contract, and bidirectional backend streaming.',
    trap: "Wrong: 'gRPC is faster than REST.' Faster how? Name the physics. Say 'Binary Protobuf is smaller and cheaper to parse than JSON and HTTP/2 reuses one connection across calls, which pays off at internal RPC volume and rarely matters at the public edge.'",
  },
  protobuf: {
    name: 'Protocol Buffers',
    def: 'A schema-first binary serialization format where every field gets a numeric tag and a type, and the wire carries those numbers instead of string field names. Encoded messages shrink to several times smaller than equivalent JSON and decode without text parsing, while the schema generates matching types in every language. The catch is that raw bytes mean nothing without the schema, and backward compatibility depends on never reusing an old field number.',
    say: 'Protobuf is schema-first binary encoding using field numbers instead of names, making payloads several times smaller than JSON and much cheaper to parse at the cost of human readability on the wire.',
    reachFor:
      'High-volume internal APIs, event payloads on streams, and any budget where serialization CPU or egress bandwidth actually shows up.',
    trap: "Wrong: 'Protobuf saves bandwidth, so use it everywhere.' Tie the win to real volume. Say 'At a million messages a second, smaller payloads and cheaper parsing save real money; on a page that loads twice, JSON debuggability beats saving a few bytes.'",
  },
  webrtc: {
    name: 'WebRTC',
    def: 'A browser-native stack for peer-to-peer audio, video, and data: a signaling server introduces two clients, and then live media streams directly between them over UDP. Stepping your servers out of the media path eliminates a hop and its bandwidth bill, making sub-200ms conversation feel natural. Crossing NATs and firewalls adds plumbing: most calls need a STUN server to learn public addresses, and stubborn networks fall back to a TURN relay that puts bandwidth back on your bill.',
    say: 'WebRTC lets browsers stream audio and video directly peer-to-peer over UDP after a signaling server introduces them, cutting latency and bandwidth costs except for calls forced onto a TURN relay.',
    reachFor:
      'Live voice and video calls, screen sharing, and low-latency peer data channels for small-group conversations rather than one-to-many broadcasts.',
    trap: "Wrong: 'It is peer-to-peer, so we do not need servers.' Name the pieces that stay. Say 'Media flows directly when it can, but we still run signaling to introduce peers, STUN to discover addresses, and TURN relays for clients stuck behind strict NATs.'",
  },
  lasteventid: {
    name: 'Last-Event-ID',
    def: 'The built-in resume hook in server-sent events: the server tags every outgoing event with an ID, the browser remembers the latest one it received, and on reconnect it sends that ID back in a Last-Event-ID header so the server can replay the missed gap. Without it, every brief drop leaves a silent hole in the feed. The browser handles its half automatically, while the server half is on you because replay only works if recent events are still buffered somewhere.',
    say: 'SSE reconnects automatically and sends Last-Event-ID with the last message it saw, letting the server replay the gap as long as it buffered recent events.',
    reachFor:
      'Feeds or notification streams where a client dropping off Wi-Fi for ten seconds must not silently lose missed updates.',
    trap: "Wrong: 'SSE handles reconnection for us.' It reopens the socket, not the history. Say 'The browser automatically resends Last-Event-ID, so we buffer the last N events per channel on the server and replay from that ID.'",
  },

  /* ================= Storage & Data — spec 072, coverage-map §B.3 ================= */
  partitionkey: {
    name: 'Partition key',
    def: 'The field a distributed database hashes to pick which node stores a row. Set at table creation, it is the only key that routes a query straight to a single machine; any query missing it has to scatter across every node instead. You cannot patch a bad partition key later with a quick index, because changing it means rewriting the table, making it the first schema choice rather than the last.',
    say: 'I pick the partition key around what every read already knows, because queries that include it hit one node while queries without it fan out across the entire cluster.',
    reachFor:
      'Wide-column or key-value stores (Cassandra, DynamoDB) and any sharding review where choosing the right key decides whether load actually spreads.',
    trap: "Wrong: 'We will partition by timestamp so rows stay ordered.' Every concurrent writer hashes to right now and slams a single node. Say 'I partition on a high-cardinality key every read carries, like user ID or tenant ID, and put time in the clustering key so it sorts without concentrating writes.'",
  },
  clusteringkey: {
    name: 'Clustering key',
    def: 'The column or columns that sort rows inside a partition once the partition key has picked the node. Because that order matches the physical layout on disk, a range query along the clustering key ("this user\'s last 50 messages") turns into one clean sequential read instead of a full scan and sort. The flip side is that any sort order you did not plan into the key stays expensive forever.',
    say: 'The partition key picks the node and the clustering key sets the physical sort order inside it, turning "this user\'s last 50 messages" into one sequential read.',
    reachFor:
      'Cassandra and DynamoDB modeling for feeds or time-series tables: partition by entity, cluster by timestamp descending.',
    trap: "Wrong: 'We can always sort by another column later.' Sort order inside a partition is physical layout on disk, not a cheap query flag. Say 'The clustering key is the on-disk order, so any other sort forces reading the whole partition and sorting it in memory.'",
  },
  vnode: {
    name: 'Virtual node',
    def: 'Giving each physical machine many small spots on a hash ring (typically 128 to 256) instead of just one. Load averages smoothly across hundreds of tiny arcs rather than depending on luck, and when a server dies its ranges spread across many neighbors instead of doubling the load on one unlucky peer. The modest trade-off is extra metadata, tracking thousands of ring entries instead of dozens.',
    say: 'Virtual nodes give every physical machine hundreds of small arcs on the hash ring so load evens out and a node failure spreads across all neighbors instead of flattening one.',
    reachFor:
      'Cassandra and Dynamo-style hash rings whenever someone asks about uneven load or what happens the moment a node dies.',
    trap: "Wrong: 'Consistent hashing spreads load evenly.' With one spot per machine, random placement creates wildly lopsided arcs. Say 'Consistent hashing bounds how many keys move on a resize, while virtual nodes are what actually balance the distribution.'",
  },
  hashslot: {
    name: 'Hash slot',
    def: "Redis Cluster's clean alternative to a continuous hash ring: it slices the key space into exactly 16,384 fixed slots, hashes every key into one slot, and assigns slots to nodes. Rebalancing just hands whole slots from one node to another, letting every client cache a compact explicit slot table instead of running ring math. A fixed slot count turns routing into a direct lookup.",
    say: 'Redis Cluster hashes every key into 16,384 fixed slots assigned to nodes, so rebalancing just moves slots and clients route with a cached lookup table.',
    reachFor:
      'Explaining Redis Cluster specifically, or contrasting fixed slot tables against continuous hash rings during rebalancing.',
    trap: "Wrong: 'Redis Cluster uses consistent hashing.' It achieves the same bounded movement with a fixed slot map instead of a ring. Say 'Redis Cluster maps keys to 16,384 slots and migrates slots between nodes, bounding key movement without a ring.'",
  },
  sstable: {
    name: 'SSTable',
    def: "A Sorted String Table: an immutable file of key-value pairs written to disk in sorted order whenever a memtable fills up. Immutability is the whole trick, keeping writes purely sequential and letting readers scan without locks. The catch is that updates to one key can span multiple SSTables, so a single read may have to inspect several files.",
    say: 'An SSTable is an immutable sorted file flushed from memory so writes stay sequential and readers never lock, at the price of reads potentially checking multiple files.',
    reachFor:
      'LSM internals in Cassandra, RocksDB, and LevelDB whenever explaining why write-optimized engines ingest so much faster than B-trees.',
    trap: "Wrong: 'The SSTable gets updated in place.' SSTables never change once written; updates append a newer record and compaction cleans up later. Say 'Updates and deletes are sequential appends, the newest entry wins at read time, and compaction merges old files away.'",
  },
  memtable: {
    name: 'Memtable',
    def: 'The in-memory sorted structure where an LSM engine buffers incoming writes before touching data files on disk. It absorbs writes at RAM speed while keeping keys sorted, so flushing it produces one clean sequential SSTable. Durability does not live in the memtable, because the write-ahead log is fsynced first so a crash simply replays the log.',
    say: 'LSM writes land in an in-memory sorted memtable backed by an fsynced write-ahead log, flushing out as one sequential SSTable whenever memory fills.',
    reachFor:
      'Separating where LSM write speed comes from versus where durability comes from, two pieces people often blur together.',
    trap: "Wrong: 'The memtable makes the write durable.' It lives in volatile RAM and vanishes on power loss. Say 'The write-ahead log gives us durability and the memtable gives us speed; writing both together is how an LSM gets both.'",
  },
  compaction: {
    name: 'Compaction',
    def: 'The background process that merges SSTables together, keeps only the latest version of each key, and physically removes delete tombstones. Without compaction, reads would slow down forever as the stack of files kept growing. Compaction is also where an LSM pays the tab for its cheap writes, rewriting the same bytes multiple times and competing with live queries for disk bandwidth.',
    say: 'Compaction merges SSTables in the background to cap how many files reads inspect, and it is where an LSM pays the deferred disk-bandwidth bill for its fast writes.',
    reachFor:
      'LSM performance mysteries: sudden latency spikes with flat traffic, disk usage refusing to shrink after mass deletes, or size-tiered versus leveled trade-offs.',
    trap: "Wrong: 'Deleting rows frees disk space right away.' A delete writes a tombstone marker, and space only returns when compaction runs. Say 'Deletes are writes, and disk space only comes back during compaction, which is why heavy deletes can briefly grow disk usage.'",
  },
  bloomfilter: {
    name: 'Bloom filter',
    def: 'A compact probabilistic bit array built to answer one narrow question: is this key definitely not in this file? It can return a false positive ("maybe") when the key is absent, yet it never lies with a false negative when the key is present, letting a read path skip a disk lookup with 100% certainty on every "no". Spending just a few bits per key lets an LSM skip almost every irrelevant SSTable.',
    say: 'A bloom filter proves a key is definitely not in a file while never guaranteeing it is, letting an LSM read skip most SSTables for just a few bits per key.',
    reachFor:
      'LSM read-path speedups, cache-penetration defenses, and any design trying to avoid a disk trip just to discover a key does not exist.',
    trap: "Wrong: 'The bloom filter tells us whether the key is in the file.' It only rules keys out. Say 'A negative is certain and a positive is only a maybe, so it skips disk reads for absent keys while paying one wasted lookup at the false-positive rate.'",
  },
  compositeindex: {
    name: 'Composite index',
    def: 'A single index built over several columns in a fixed order: rows sort by the first column, then by the second inside each group, and so on. Because that sorting is nested, queries can only use a leading prefix of the columns: an index on (tenant, created_at) speeds up a filter on tenant, not a filter on created_at alone. Put your equality filter first and your sort column second, and one traversal handles both.',
    say: 'A composite index sorts columns in nested order so queries can only use a leading prefix, letting an equality-then-sort index satisfy both filtering and ordering in one pass.',
    reachFor:
      'Tuning queries that pair a WHERE filter with an ORDER BY, and diagnosing why an index sits unused.',
    trap: "Wrong: 'I indexed both columns, so the query is covered.' Two single-column indexes are not a composite index, and you cannot enter a composite index from its second column. Say 'The leading-prefix rule decides whether the index fires: put the equality filter first and the sort column second.'",
  },
  coveringindex: {
    name: 'Covering index',
    def: 'An index that already holds every column a query selects, letting the database answer straight from the index without hopping to the table heap for the full row. That skips one random I/O per matched row, which is often the priciest part of an index scan. The price is data duplication, since every covered column now lives in two places and gets rewritten on every update.',
    say: 'A covering index includes every column a query needs so the engine answers straight from the index and skips random heap fetches altogether.',
    reachFor:
      'One proven hot, narrow, high-volume query where measurements confirm heap fetches dominate latency.',
    trap: "Wrong: 'Add covering indexes everywhere for speed.' Every covered column is stored twice and rewritten on every update. Say 'A covering index is a targeted fix justified by a measured heap-fetch bottleneck, not a blanket default.'",
  },
  partialindex: {
    name: 'Partial index',
    def: "An index covering only the rows that pass a filter condition, such as WHERE status = 'pending'. When the rows you actually query are a tiny fraction of a huge table, the index stays small enough to live in RAM and pays zero maintenance on every excluded row. It only fires when the query planner can prove a query's WHERE clause falls cleanly inside that filter.",
    say: "A partial index only tracks rows matching a filter, giving a job table's handful of pending rows a tiny hot index instead of indexing millions of finished ones.",
    reachFor:
      'Job queues in SQL, soft-deleted tables, and any query pattern that always targets the same small active slice.',
    trap: "Wrong: 'Just index the status column.' On a table that is 99% 'done', a full index is mostly dead weight the planner may ignore. Say 'I will build a partial index on pending rows so it stays resident in memory and skips maintenance on finished rows.'",
  },
  materializedview: {
    name: 'Materialized view',
    def: 'A query result saved to disk as a real table and refreshed on a timer or on write instead of being recomputed on every request. It shifts heavy aggregations off the live read path and into a background job, which is how dashboards stay snappy. What you give up is instant freshness, since readers see data as old as the last refresh and those refreshes still consume real load.',
    say: 'A materialized view saves an expensive query result as a table refreshed in the background, trading a known staleness window for instant reads.',
    reachFor:
      'Dashboards, leaderboards, and analytics rollups where the same heavy aggregation gets read constantly and a minute of lag is harmless.',
    trap: "Wrong: 'A materialized view keeps our metrics up to date.' It is a precomputed cache tied to a refresh schedule. Say 'Readers see the state as of the last refresh, so I will name the staleness window up front because that window is the whole trade.'",
  },
  rtree: {
    name: 'R-tree',
    def: 'A spatial index that wraps nearby objects inside fitted bounding rectangles, then nests those rectangles inside larger ones to mirror where data actually clusters. Unlike a fixed grid it adapts cleanly to density, and unlike a point-only geohash it indexes real shapes like lines and polygons. Because sibling rectangles can overlap, a single lookup sometimes has to explore multiple branches.',
    say: 'An R-tree nests fitted bounding rectangles around spatial objects so it can index polygons as well as points, though overlapping boxes mean a search may descend several branches.',
    reachFor:
      'PostGIS and queries mixing points with regions ("which delivery zones contain this address?") where point-only geohashes run out of road.',
    trap: "Wrong: 'An R-tree is basically a quadtree.' Quadtrees slice fixed regions of space, while R-trees group actual objects into overlapping boxes. Say 'Quadtrees split space and R-trees group objects, which is why R-trees handle polygons and occasionally search multiple branches.'",
  },
  docvalues: {
    name: 'Doc values',
    def: "Elasticsearch's column-oriented on-disk copy of a field, stored right next to the inverted index. The inverted index answers 'which documents contain this word?', while sorting, aggregating, and faceting ask the opposite question ('what value does this document hold?'), which doc values answer without blowing up heap memory. Both structures store the same field in opposite layouts to serve opposite access directions.",
    say: 'The inverted index maps terms to documents while doc values store the same field column-wise for the reverse lookup, letting a search engine sort and aggregate without exhausting heap memory.',
    reachFor:
      'Explaining how a search engine powers analytics, or why a field has to be configured explicitly before you can sort or aggregate on it.',
    trap: "Wrong: 'The inverted index handles sorting too.' Mapping terms to documents is completely backward for sorting results. Say 'Matching reads the inverted index, while sorting and aggregations read doc values, a column-oriented copy of the same field.'",
  },
  // Spec 076 (coverage-map F1): the six terms the indexing and search briefings
  // introduce. Storage & Data is an opted-in speakable group, so all three
  // fields are mandatory here.
  heapfile: {
    name: 'Heap file',
    def: 'The default on-disk layout of a database table: rows dropped wherever free space exists, in no sorted order. Without an index, locating a row means reading the entire file, and because engines read whole fixed-size pages rather than individual rows, scan cost is counted in pages instead of rows. Every database index exists to keep queries from scanning this file.',
    say: 'A heap file packs rows in no particular order and is read a full page at a time, so without an index every lookup becomes a scan measured in pages.',
    reachFor:
      'Explaining why an unindexed query drags before jumping to fixes, and why selecting one tiny column still triggers a full page read.',
    trap: "Wrong: 'The database just reads that one row.' Storage engines fetch the whole 8 KB page holding the row whether you want one field or forty. Say 'The page is the unit of I/O, so fetching a 200-byte row still costs an entire 8 KB page read.'",
  },
  segment: {
    name: 'Segment',
    def: 'One immutable file forming part of a search index. Fresh documents buffer in memory and flush out as a brand-new segment, because written segments are never edited in place. Queries have to run across every segment and merge the hits, which makes segment count a live performance metric and drives continuous background merges to combine small files into larger ones.',
    say: 'A search index consists of immutable segments so writes create new files instead of editing old ones, forcing every query to search across all segments and merge results.',
    reachFor:
      'Explaining why search indexes hate frequent updates, and why a pile of tiny segments drags down query latency.',
    trap: "Wrong: 'Updating a document edits it inside the search index.' Segments are immutable, so an update writes a tombstone plus a fresh copy in a new segment. Say 'Nothing changes in place; updates cost a delete marker plus an insert, and background merges clean up later.'",
  },
  tombstone: {
    name: 'Tombstone',
    def: 'A marker written to record a deletion in an append-only store that never removes data in place. The old record stays on disk, still read and filtered out on queries, until background compaction or segment merging physically drops it. That is why deletes in log-structured and segment-based stores are actually writes, and why disk usage can tick upward right after a huge delete.',
    say: 'A tombstone records a delete as a new write, leaving the old record on disk to consume space and read work until compaction physically drops it.',
    reachFor:
      "Answering 'why did deleting a million rows not free disk space?' and explaining why updates cost more than inserts in segment-based engines.",
    trap: "Wrong: 'Deleting rows frees disk space.' In append-only stores the delete is itself a write, and space returns only at compaction. Say 'Deletes write tombstones and space comes back during merges, which is why mass deletes can temporarily grow disk usage.'",
  },
  analyzer: {
    name: 'Analyzer (analysis pipeline)',
    def: 'The text pipeline turning raw input into the terms a search index actually stores: splitting text into tokens, normalizing casing, accents, and punctuation, dropping stop words, and stemming words so running, ran, and runs collapse to one root. Running the exact same pipeline on incoming queries is why searching "Running" finds a document containing "ran". Change the analyzer later and you have to rebuild the index, because the stored terms change underneath.',
    say: 'An analyzer tokenizes, normalizes, strips stop words, and stems text into indexed terms on both write and query, which is why word forms and capitalization match cleanly.',
    reachFor:
      'Debugging mysterious search misses, and explaining why choosing text versus keyword field types decides whether analysis runs at all.',
    trap: "Wrong: 'The search engine indexes the words in the document.' It indexes analyzed terms, which rarely match raw input verbatim. Say 'Both documents and queries pass through the same analyzer, so matching happens on normalized stems rather than literal strings.'",
  },
  relevance: {
    name: 'Relevance score',
    def: 'The default ranking number a search engine sorts hits by whenever you do not specify another order. It climbs when a search term appears often in a document, shrinks when that term is common across the entire corpus, and normalizes for document length so sprawling documents do not win on sheer size. In practice, rare words steer the ranking while everyday words barely budge it.',
    say: 'A relevance score ranks hits by term frequency in the document, weighted down by how common the word is across the corpus and normalized by length so rare words drive the match.',
    reachFor:
      'Explaining what "sort by relevance" actually calculates, and pushing back on custom ranking work before understanding the default.',
    trap: "Wrong: 'Search results come back in the order they were indexed.' The default sort is a computed relevance score, not insertion order. Say 'Search defaults to relevance scoring, so if users expect recency I need to specify that sort explicitly.'",
  },
  queryplanner: {
    name: 'Query planner',
    def: 'The database brain that chooses how to execute a query: which index to pick, what order to run filters in, or whether a sequential scan is cheaper. It bases those calls on live statistics (row counts, value distributions, per-term document counts) rather than your wishes, so an index you added can sit unused for completely sound reasons. Clause order alone can swing query cost by orders of magnitude, and the planner is what decides it.',
    say: 'The query planner chooses access paths and filter order from table statistics, so adding an index gives it a new option rather than forcing it to use one.',
    reachFor:
      'Answering "why is the database ignoring my index?" and explaining why running the most selective filter first saves orders of magnitude of work.',
    trap: "Wrong: 'Adding the index makes the query fast.' The planner decides whether to touch it, and on small or low-selectivity tables a full scan legitimately wins. Say 'An index is an option the planner weighs using statistics, so I check the query plan before adding another.'",
  },
  lastwritewins: {
    name: 'Last write wins (LWW)',
    def: 'A simple conflict-resolution rule for concurrent writes to the same key on separate replicas: tag each write with a timestamp and keep whichever is highest. It needs zero coordination and always converges, which is why AP stores default to it. The catch is silent data loss: the losing write simply disappears, and "last" relies on node clocks that can drift out of sync.',
    say: 'Last-write-wins settles replica conflicts by keeping the highest timestamp, guaranteeing convergence at the price of silently discarding the losing write.',
    reachFor:
      'Cassandra and Dynamo-style designs where you must state honestly what happens when two replicas accept concurrent updates to one key.',
    trap: "Wrong: 'Conflicting writes get merged automatically.' LWW never merges, it throws one write away based on a potentially skewed clock. Say 'LWW keeps the highest timestamp and drops the other update, so counters or accumulating sets need a CRDT or an append-only model instead.'",
  },
  hintedhandoff: {
    name: 'Hinted handoff',
    def: 'A write-availability trick when a replica goes unreachable: the coordinator accepts the write anyway, tucks away a "hint" noting which node missed it, and replays that write once the node comes back online. It lets Cassandra-style clusters keep taking writes across brief blips without blocking. Because hints are best-effort and expire after a set window, longer outages still require full anti-entropy repair.',
    say: 'Hinted handoff lets a coordinator accept writes for a temporarily down replica and replay them when it returns, keeping writes available through short blips.',
    reachFor:
      'Cassandra availability questions, and describing concretely what happens to writes during a brief node failure.',
    trap: "Wrong: 'Hinted handoff guarantees every replica gets the write.' Hints expire after a window and vanish if the coordinator itself dies. Say 'Hinted handoff bridges short outages; past the hint window you rely on read repair and anti-entropy to reconcile.'",
  },
  scattergather: {
    name: 'Scatter-gather',
    def: 'A distributed query pattern where a coordinator blasts the request to every shard, waits for all of them to reply, and stitches the answers together. That is the exact bill you pay whenever a query lacks the partition key. Tail latency matches the slowest shard instead of the average, so adding more shards actually makes the tail worse while piling merge, sort, and pagination work onto the coordinator.',
    say: "Any query missing the partition key scatters to every shard and gathers the replies, making its latency equal to the slowest shard and worse as you add more shards.",
    reachFor:
      'Explaining why partition keys are sacred, or why distributed search and analytics fan-outs suffer from stubborn tail latency.',
    trap: "Wrong: 'More shards means faster queries.' Under scatter-gather, more shards just gives you more chances to hit a slow box. Say 'Sharding speeds up queries carrying the partition key and slows down every query that leaves it out.'",
  },
  isolationlevel: {
    name: 'Isolation level',
    def: 'The database setting that chooses which concurrency anomalies a transaction is allowed to see: read committed, repeatable read, snapshot, or serializable. Each rung up eliminates another class of subtle bug while charging more locking or more transaction aborts. Because databases do not default to the strictest rung (Postgres ships at read committed), anomalies your code quietly assumes away are usually still legal until you ask otherwise.',
    say: 'Isolation level decides which concurrency anomalies are legal, and because databases default to read committed rather than serializable, stricter guarantees have to be requested explicitly.',
    reachFor:
      'Transaction correctness problems like double booking, inventory counts, or balance transfers where you must name what the database actually enforces.',
    trap: "Wrong: 'It runs in an ACID transaction, so it is safe.' Isolation is a dial, not an all-or-nothing switch. Say 'At read committed this anomaly is still legal, so I will raise the isolation level or take an explicit lock and price that trade-off.'",
  },
  serializable: {
    name: 'Serializable',
    def: 'The strictest isolation level: the final state must match some order where concurrent transactions ran cleanly one at a time. It is the only rung that blocks every concurrency anomaly, including subtle ones like write skew that you did not think to guard against. Engines enforce it with extra locks or conflict-triggered aborts, so you pay in lower concurrency or retry logic in your application.',
    say: 'Serializable isolation guarantees results match some one-at-a-time execution order, making it the only level that blocks subtle anomalies like write skew automatically.',
    reachFor:
      'Cross-row business invariants like ledgers, seat allocation, or on-call shift coverage where being wrong costs far more than retrying.',
    trap: "Wrong: 'We will just run everything at serializable.' Strict isolation charges you in lock contention or aborted transactions that clients must retry. Say 'I turn on serializable where invariants span multiple rows, and I build retry handling for serialization failures.'",
  },
  writeskew: {
    name: 'Write skew',
    def: 'A sneaky anomaly where two transactions read the same set of rows, each sees its own update as safe, and each writes to a different row, so no single row conflicts and both commit cleanly. The invariant spanning those rows quietly snaps: both on-call doctors step off shift because each saw the other still working. Because no shared row was touched twice, snapshot isolation and per-row compare-and-set both miss it completely.',
    say: 'Write skew happens when two transactions read the same rows and write to different ones, avoiding any row conflict while silently breaking an invariant across them.',
    reachFor:
      'Multi-row invariants like "at least one doctor on call", "combined spend stays under budget", or "no overlapping room bookings".',
    trap: "Wrong: 'We version the row, so concurrent updates are safe.' Write skew never touches the same row twice, which is the entire trap. Say 'Write skew requires serializable isolation or an explicit lock on the predicate, because per-row compare-and-set has no shared row to compare.'",
  },

  /* ================= Queues & Streams — spec 072, coverage-map §B.3 ================= */
  offset: {
    name: 'Offset',
    def: "A consumer's bookmark inside a partition log, stored as one plain number: 'I have processed through message 4,812.' Because the log is immutable and the consumer owns its bookmark, replaying history is just dialing that number back, and multiple consumers can read the same partition at different spots without stepping on each other. It also puts delivery tracking on the consumer instead of the broker.",
    say: "A consumer's offset is just its numbered bookmark in the log, so replaying history means moving that number backward and separate consumers can read the same partition independently.",
    reachFor:
      'Kafka and log-based streams, especially follow-ups on reprocessing history or recovering when a consumer crashes.',
    trap: "Wrong: 'The broker deletes each message once it is consumed.' Log brokers expire data by retention, not by acknowledgment. Say 'Consumers track an offset while data stays until retention expires, which is exactly why replay works.'",
  },
  consumergroup: {
    name: 'Consumer group',
    def: 'A team of consumers splitting the work of a topic, where each partition belongs to exactly one member at a time. Adding consumers scales parallelism up to the partition count and stops dead there; if a member crashes, its partitions shift to the survivors during a rebalance. Separate consumer groups reading the same topic each get every message, letting one stream drive multiple independent pipelines.',
    say: 'A consumer group assigns each partition to one member so parallelism caps at the partition count, while separate groups reading the same topic each get a full copy of the stream.',
    reachFor:
      'Sizing consumer pools against partition counts, and fanning one event stream out to several independent services without duplicating data.',
    trap: "Wrong: 'We will add more consumers to catch up faster.' Any consumer past the partition count sits completely idle. Say 'Partitions set our parallelism ceiling, so scaling consumers starts with choosing the partition count up front.'",
  },
  watermark: {
    name: 'Watermark',
    def: "A stream processor's running declaration that no event older than timestamp T will still arrive, giving it permission to close a time window and emit a result. Watermarks exist because real-world events arrive late and out of order, making 'this window is done' a judgment call rather than a certainty. Push the watermark tightly and you emit faster while dropping more late events; give it extra slack and results stay complete at higher latency.",
    say: 'A watermark asserts that no event older than timestamp T is still on the way, letting a stream processor close a window and emit while trading completeness against latency.',
    reachFor:
      'Flink and event-time streaming designs, especially the inevitable question about late-arriving data.',
    trap: "Wrong: 'We window by when our server received the event.' Processing time makes business metrics depend on infrastructure hiccups instead of reality. Say 'I will window on event time with a watermark and decide explicitly whether late events get dropped or trigger an update.'",
  },
  windowing: {
    name: 'Windowing',
    def: 'Slicing an endless stream into finite chunks so aggregations actually have a finish line: tumbling windows are fixed and non-overlapping, sliding windows are fixed and overlapping, and session windows close after a quiet gap. That choice decides both what the metric means and how much in-flight state each operator must hold. Windows are what let a stream answer questions like "how many events happened in the last five minutes?" at all.',
    say: 'Windowing cuts an endless stream into finite tumbling, sliding, or session chunks so aggregations finally have a boundary where they can emit.',
    reachFor:
      'Streaming aggregations like rate limits, real-time dashboards, and fraud checks evaluated over a recent interval.',
    trap: "Wrong: 'We aggregate the stream.' Aggregating an unbounded stream never finishes. Say 'Five-minute tumbling windows on event time, which defines both the metric and how much state each operator has to hold.'",
  },
  checkpoint: {
    name: 'Checkpoint',
    def: "A periodic, consistent snapshot of a stream processor's in-flight operator state paired with its input offsets, saved to durable storage. If a worker dies, the job reloads the latest checkpoint and replays input from those saved offsets, which is how exactly-once processing survives crashes. Choosing the checkpoint interval balances recovery replay time against steady-state overhead.",
    say: 'A checkpoint durably snapshots operator state alongside input offsets so a crashed stream job resumes from that exact point and replays instead of starting from scratch.',
    reachFor:
      "Flink's exactly-once story, and any stateful stream pipeline where you have to explain what happens when a worker dies mid-window.",
    trap: "Wrong: 'Our streaming job is stateless, so checkpoints do not matter.' Any window, join, or running count is state. Say 'Checkpointing state and offsets together is what keeps recovery accurate, because restoring one without the other either double-counts or drops data.'",
  },
  compensation: {
    name: 'Compensating transaction',
    def: 'A follow-up action that semantically undoes a step that already committed when a later workflow step fails: refund the card, release the seat, restock the item. It is not a database rollback because the original action really happened and others may have seen it, making the undo a new, visible business event of its own. Every saga step needs its compensation planned up front, and some effects (an email already sent) cannot be undone at all.',
    say: 'A compensating transaction semantically undoes an already-committed step with a new business action like a refund, because in a distributed workflow you cannot rewind history.',
    reachFor:
      'Sagas and cross-service flows like booking a flight, hotel, and car where distributed database transactions are off the table.',
    trap: "Wrong: 'We roll the saga back if step three fails.' Earlier steps already committed locally, so there is nothing to roll back. Say 'Each step pairs with a compensating action, and I put the hardest-to-compensate step last.'",
  },
  choreography: {
    name: 'Choreography',
    def: 'A saga style with no central boss: each service listens for events from other services, runs its local step, and publishes its own event. Services stay loosely coupled with no single coordinator to fail, making new listeners cheap to plug in. The catch is that the full workflow never lives in one place, so understanding the process or finding where a stuck order went means chasing events across services.',
    say: 'Choreography coordinates a workflow by having each service react to events with no central controller, keeping teams decoupled while leaving the overall process written down nowhere.',
    reachFor:
      'Short workflows of two or three steps where independent deploys matter more than centralized visibility.',
    trap: "Wrong: 'Choreography scales better.' It decouples better, not observes better. Say 'Past two or three steps I switch to orchestration, because choreography makes it painful to answer where one specific order is stuck.'",
  },
  orchestration: {
    name: 'Orchestration',
    def: 'A saga style where one central coordinator holds the workflow definition, calls each step in sequence, and directs recovery when something breaks. The workflow becomes a concrete artifact you can inspect: check where any order sits, retry a single step, and read the whole state machine in one place. The trade-off is introducing a central component that every step relies on, so the orchestrator itself must be durable.',
    say: "Orchestration puts the workflow inside one coordinator that invokes steps and handles failures, making the entire state machine inspectable and every order's status a direct query.",
    reachFor:
      'Workflows beyond three steps, processes needing clear operational visibility, or flows where humans may have to trigger compensations by hand.',
    trap: "Wrong: 'The orchestrator is a single point of failure.' Only if you roll your own brittle in-memory service. Say 'I will run the orchestrator on a durable workflow engine so its own state survives restarts and crashes.'",
  },
  durableexecution: {
    name: 'Durable execution',
    def: 'A workflow runtime that logs every step (each outbound call and its returned result) to durable storage so a crashed process recovers by replaying that log to rebuild its exact memory state and picking up at the first unfinished step. You write normal sequential code that can pause for days without tying up a live thread. Replay is not the same as retrying: a retry re-runs work, while replay reconstructs completed history and never re-executes a finished step.',
    say: "Durable execution records every step's result to a log and resumes crashed workflows by replaying history to the first unfinished step, letting long workflows survive restarts without repeating completed work.",
    reachFor:
      'Long, stateful workflows with human approvals or multi-day waits (Temporal, Step Functions) where in-memory threads or cron tables are far too fragile.',
    trap: "Wrong: 'It just retries the workflow after a crash.' Retrying re-runs finished steps and double-charges customers, whereas replay skips them. Say 'The engine replays logged results to restore state and continues from the first step that never finished.'",
  },

  /* ================= Resilience — spec 072, coverage-map §B.3 ================= */
  compareandset: {
    name: 'Compare-and-set (CAS)',
    def: 'The single atomic primitive powering conditional writes, version checks, ETags, and optimistic concurrency: write this new value only if the stored value still matches what I read. Because the check and update happen in one atomic step, two concurrent writers cannot both win and the loser gets told to re-read and retry. Whether you meet it as a version column, an If-Match header, a DynamoDB condition expression, or Redis WATCH, it is the exact same move.',
    say: 'Compare-and-set writes only if the current value still matches what I read in one atomic step, preventing two concurrent writers from both winning and forming the bedrock of optimistic concurrency.',
    reachFor:
      'Lost-update bugs where conflicts stay rare: inventory decrements, profile saves, or grabbing a distributed lock.',
    trap: "Wrong: 'We read the value, check it in code, and then write.' Two separate steps leave a race window right between the read and the write. Say 'The check and update must be one atomic compare-and-set, otherwise I just described the race instead of fixing it.'",
  },
  aba: {
    name: 'The ABA problem',
    def: 'A subtle catch in compare-and-set: it can only verify whether a value still looks the same. If another writer flips a field from A to B and back to A while you are thinking, your compare-and-set happily succeeds even though the world moved underneath you, overwriting decisions made in between. The cure is comparing something that can never repeat, like a monotonic version number, sequence, or commit ID that only ever climbs.',
    say: 'The ABA problem happens when a compare-and-set succeeds because a value changed away and back while I was not looking, so I compare a monotonically increasing version number that can never repeat.',
    reachFor:
      'Lock-free data structures, and any conditional write checking a field that can legitimately return to an older value like a status, bidirectional counter, or reused slot.',
    trap: "Wrong: 'We compare the old value, so the write is safe.' Matching the value does not prove nothing happened in between. Say 'I compare a monotonic version instead of the field value, because a number that only rises can never repeat and closes the ABA hole.'",
  },
  pessimistic: {
    name: 'Pessimistic locking',
    def: 'Grabbing the lock before reading, holding it while you decide, and releasing it once you write (SELECT ... FOR UPDATE). Conflicts turn into orderly waiting instead of failed retries, so a heavily contended write succeeds on its first pass instead of thrashing. You pay in reduced concurrency and a sharper operational edge: everyone queues behind the lock, and if the holder stalls, everybody behind it stalls too.',
    say: 'Pessimistic locking acquires the lock before reading so conflicts become waiting instead of retrying, which wins once contention climbs high enough that optimistic retries keep failing.',
    reachFor:
      'Red-hot single rows like the last concert ticket, a popular seat, or a shared counter hit by thousands of writers where retry storms waste more work than waiting.',
    trap: "Wrong: 'Locks are slow, so always use optimistic concurrency.' Under heavy contention optimistic is slower because every loser repeats its work. Say 'Optimistic wins when conflicts are rare and pessimistic wins when they are frequent, and we can measure that conflict rate directly.'",
  },
  fencingtoken: {
    name: 'Fencing token',
    def: 'A monotonically increasing number issued alongside every lock grant that the protected resource checks, rejecting any request carrying a number lower than the highest one it has seen. You need it because a lock can expire while its holder is frozen in a garbage-collection pause or stuck behind a network partition, only for that holder to wake up still convinced it owns the lock. Checking the token at the resource stops the stale writer cold, which no lock service can guarantee on its own.',
    say: 'A fencing token is a rising number issued with every lock grant that the protected resource validates, rejecting any paused holder whose lease quietly expired before its write arrived.',
    reachFor:
      'Any distributed lock guarding a real side effect (file writes, payments, state transitions) and the classic follow-up on what happens if the lock holder pauses.',
    trap: "Wrong: 'Once the lease expires, the old holder cannot write.' A paused holder has no clue its lease expired. Say 'Lease expiry alone is not safe; the downstream resource must reject lower fencing tokens or both holders write and one silently clobbers the other.'",
  },
  gossip: {
    name: 'Gossip protocol',
    def: 'A decentralized way for nodes to share cluster state by periodically swapping what they know with a few random peers instead of asking a central registry. News spreads exponentially, reaching the entire cluster in a logarithmic number of rounds with no coordinator and no single point of failure. The trade-off is giving up an instant global view, since at any given second different nodes hold slightly different pictures of who is alive.',
    say: 'Gossip spreads cluster membership by having every node trade state with a few random peers each round, reaching everyone in logarithmic time with no coordinator and no exact global snapshot.',
    reachFor:
      'Cassandra and Dynamo-style cluster membership, and answering how a leaderless cluster notices dead nodes.',
    trap: "Wrong: 'The cluster immediately knows that node is down.' Different nodes reach that conclusion at different times, making failure detection a suspicion score rather than a boolean. Say 'Gossip converges within seconds for eventually consistent membership, while decisions needing strict agreement go through consensus.'",
  },
  splitbrain: {
    name: 'Split brain',
    def: 'What happens when a network partition cuts a cluster into two isolated halves, each decides the other died, and each elects its own leader. Both halves keep accepting writes while believing they are the one true cluster, leaving a brutal mess when the link heals and two divergent histories collide. The standard safeguard is a majority quorum, since at most one side of a split can ever hold a majority.',
    say: 'Split brain happens when a partition cuts a cluster into two halves that each elect a leader and accept writes, which is why requiring a majority quorum prevents it since only one side can ever hold one.',
    reachFor:
      'Leader-election and failover designs, and answering the core network-partition question behind CAP.',
    trap: "Wrong: 'We detect the partition and shut the other side down.' You cannot reach the other side, which is the entire definition of a partition. Say 'A node cannot tell a partition from a crash, so I require a majority quorum to accept writes and force the minority side read-only.'",
  },
  ephemeral: {
    name: 'Ephemeral node',
    def: "An entry in a coordination service (ZooKeeper, etcd) whose life is bound to the client session that created it: the moment the client stops heartbeating, the service deletes the node automatically. Turning liveness into a tree entry means locks and service registrations clean up after a crash instead of deadlocking forever. The catch is the session timeout gap, during which a dead process still looks alive until the clock runs out.",
    say: "An ephemeral node vanishes automatically when its creator's session stops heartbeating, so locks held by a crashed process release themselves instead of deadlocking forever.",
    reachFor:
      'ZooKeeper or etcd leader election, service registries, and distributed locks that must survive process crashes.',
    trap: "Wrong: 'The lock releases the instant the process crashes.' It releases once the session timeout expires, usually seconds later. Say 'Cleanup waits for the session timeout, and a paused process that wakes back up still needs a fencing token.'",
  },
  heartbeat: {
    name: 'Heartbeat',
    def: 'A regular "I am still alive" pulse whose silence, not its arrival, is the real signal. Because missing a heartbeat looks identical to a slow network, picking the timeout is always a compromise: short timeouts catch crashes fast at the risk of false alarms, while long timeouts stay calm while leaving a dead box taking live traffic. Every failure detector in distributed systems is this same trade-off under a different name.',
    say: 'A heartbeat spots failure by its absence, turning the timeout into a direct trade between fast detection with false positives and calm stability that leaves dead nodes taking traffic longer.',
    reachFor:
      'Health checks, session timeouts, leader leases, and consumer-group liveness whenever one component has to notice another went dark.',
    trap: "Wrong: 'The heartbeat proves the node is healthy.' It only proves one thread ran and the network worked; a box can heartbeat smoothly while failing every real request. Say 'I health-check the real dependency path rather than just the process, or we keep routing traffic to a broken node.'",
  },
  loadshedding: {
    name: 'Load shedding',
    def: 'Intentionally turning away excess traffic fast, cheaply, and by priority once demand climbs past capacity. The real alternative is never "serve everyone": it is letting queues swell until every single request times out and the whole system goes dark together. Shedding turns a total blackout into a controlled, partial degradation, making it a deliberate design tool rather than a defeat.',
    say: 'Load shedding rejects excess traffic immediately and by priority, because the alternative to failing some requests fast is failing every request slowly.',
    reachFor:
      'Sustained overload where queues would grow without end: flash sales, thundering herds, or a suddenly slow downstream dependency.',
    trap: "Wrong: 'We will just queue the extra requests.' Queues absorb short bursts, not sustained overload, where buffering only adds latency before the same failure. Say 'Above capacity I shed load by priority, dropping cheap traffic first and paying customers last with a retry-after header.'",
  },

  /* ================= Networking — spec 073, coverage-map §B.3 ================= */
  graphql: {
    name: 'GraphQL',
    def: 'An API query language where the client asks for the exact fields it needs and the server returns that precise shape, replacing a sprawl of fixed endpoints with one flexible graph. It eliminates both over-fetching (mobile apps no longer download a whole profile just to show a name) and under-fetching (no more three sequential calls to render one screen). The trade-off shifts onto the server: arbitrary queries cannot be cached by URL, cannot be rate-limited per endpoint, and one careless nested query can fan out into thousands of database calls.',
    say: 'GraphQL lets clients request the exact fields they need in one round trip, eliminating over-fetching and under-fetching while shifting caching, rate-limiting, and query-cost defense onto the server.',
    reachFor:
      'Diverse clients (mobile, web, partners) reading varied slices of one data graph, especially where extra round trips hurt.',
    trap: "Wrong: 'GraphQL is faster than REST.' It shifts work rather than deleting it, and one deeply nested query can explode into thousands of resolver calls. Say 'It saves round trips across diverse clients, paid for with query-depth limits, cost analysis, and resolver batching.'",
  },
  nat: {
    name: 'NAT',
    def: 'Network Address Translation: a router rewrites outgoing packets so many private devices share a single public IP address, keeping a translation table so replies find their way home. It is why the IPv4 internet still runs with far more devices than public addresses, and why no outside server can initiate a connection to your laptop until you send a packet first. Every peer-to-peer protocol inherits that one-way wall.',
    say: 'NAT lets many private devices share one public address by rewriting outgoing packets and tracking the mapping, which is why outside hosts cannot open a connection to you until you speak first.',
    reachFor:
      'Peer-to-peer or inbound-connection designs (video calls, gaming, IoT control) and explaining why clients almost always initiate connections.',
    trap: "Wrong: 'The peers just connect directly to each other.' Most peers sit behind NATs with no inbound mapping. Say 'We use STUN to discover public mappings and a TURN relay for peers behind strict NATs, and that relay carries real bandwidth cost.'",
  },
  signaling: {
    name: 'Signaling',
    def: 'The out-of-band channel two peers use to locate each other and negotiate connection details (network candidates, codecs, encryption keys) before a direct link exists. It runs over a separate server, usually a plain WebSocket, for the simple reason that peers cannot talk over a peer-to-peer link they have not built yet. Once the media stream connects, signaling steps completely out of the path.',
    say: 'Signaling is the separate server peers use to swap network addresses and codecs before a direct connection exists, stepping out of the path once media flows.',
    reachFor:
      'WebRTC architectures (video calls, screen sharing, live audio) and clarifying which pieces of peer-to-peer still require your servers.',
    trap: "Wrong: 'Peer-to-peer means we run no servers.' Peers cannot introduce themselves over a socket that does not exist yet. Say 'Signaling introduces the peers, STUN discovers addresses, and TURN relays strict NATs; only the media path itself is peer-to-peer.'",
  },

  /* ================= Requests & Traffic — spec 073, coverage-map §B.3 ================= */
  jwt: {
    name: 'JWT',
    def: 'A cryptographically signed token carrying user claims (ID, roles, expiry) that any backend service can verify locally with a public key, without calling an auth server or querying a session store. That statelessness is both its superpower and its sharpest edge: a signed token stays valid until it expires, so revoking one early drags back the exact shared state you tried to escape. Real systems cap the blast radius with short access expiries paired with a revocable refresh token.',
    say: 'A JWT is a signed bundle of claims any service can verify locally without a session lookup, which is the exact reason revoking one before expiry is hard.',
    reachFor:
      'Stateless authentication across many microservices where hitting a central session store on every request would bottleneck.',
    trap: "Wrong: 'We log the user out by deleting the token on the client.' Deleting the client copy changes nothing because the signature remains valid anywhere it is presented. Say 'Access tokens live roughly 15 minutes paired with a revocable refresh token, bounding the blast radius of a stolen token.'",
  },
  rbac: {
    name: 'RBAC',
    def: 'Role-based access control: permissions attach to roles instead of individuals, and users receive roles, turning authorization into a compact table lookup instead of per-person checklists. It scales smoothly for teams because onboarding is assigning a role and auditing means reading role definitions. It runs out of steam when access depends on the specific object rather than job title, where ownership checks or attribute-based rules step in.',
    say: 'RBAC attaches permissions to roles rather than individual users so authorization stays a clean lookup and onboarding means assigning a role instead of maintaining per-user lists.',
    reachFor:
      'Multi-user apps with clear job roles (admin, support, viewer) whose permissions stay steady across everyone holding them.',
    trap: "Wrong: 'RBAC handles all of our authorization.' Roles say what a job title may do, not whether this user owns this specific record. Say 'The role gates the endpoint while an ownership check gates the row, and the second check is where most security bugs hide.'",
  },
  cursor: {
    name: 'Cursor pagination',
    def: 'A pagination method that returns an opaque bookmark to the last item seen (usually an encoded sort key), so the next page asks for items coming after that point instead of counting past the first 10,000 rows. The database jumps straight to that key via the index, making page 1,000 cost the exact same as page 1. It also stays steady under live writes, where offset pagination quietly duplicates or skips rows.',
    say: 'Cursor pagination asks for rows after the last item I saw, so page one thousand costs the same as page one and live inserts mid-scroll never duplicate or skip entries.',
    reachFor:
      'Lists that grow continuously, take live writes while being read, or get paged deeply: feeds, logs, search hits, and exports.',
    trap: "Wrong: 'We paginate with LIMIT and OFFSET.' Offsets force the database to count past every skipped row, and one new insert shifts every subsequent page. Say 'I use a cursor on the sort key so deep pages stay fast and results stay stable under concurrent writes.'",
  },
  rangerequest: {
    name: 'Range request',
    def: 'An HTTP request asking for a specific byte slice of a file instead of downloading the whole object, which is how video scrubbing, resumable downloads, and parallel chunked transfers work. The client requests bytes 5,000,000 through 6,000,000, and the server replies with only that slice. Without range support, a connection drop at 90% forces starting all over from byte zero.',
    say: 'A range request asks for a specific byte window instead of the entire object, which is what makes video seeking and resuming broken downloads possible.',
    reachFor:
      'Large media streaming, resumable downloads, and any transfer large enough that a mid-flight network drop is routine rather than rare.',
    trap: "Wrong: 'If the download drops, we just retry it.' Restarting a two-gigabyte transfer from byte zero on flaky mobile internet may never finish. Say 'The client resumes with a Range header from the last byte saved, mirroring how multipart upload works in the other direction.'",
  },
  apikey: {
    name: 'API key',
    def: 'A long random string identifying the calling application rather than an end user, sent along with every request. Its real job is attribution and rate limiting so one noisy integration gets throttled without bothering anyone else, not fine-grained user identity. Because it acts as a bearer secret with no built-in expiry, careful scoping and regular rotation are where the real security lives.',
    say: 'An API key identifies the calling application so quotas and attribution attach cleanly to it, which is a separate job from authenticating a human user.',
    reachFor:
      'Public and partner APIs, service-to-service traffic, and anywhere per-caller rate limiting is the core requirement.',
    trap: "Wrong: 'The API key authenticates the request.' It identifies an application via a bearer string that routinely leaks into logs, repos, and mobile binaries. Say 'The key handles attribution and rate limiting with strict scopes and rotation, while user identity travels separately.'",
  },

  /* ================= Caching & Delivery — spec 073, coverage-map §B.3 ================= */
  cacheaside: {
    name: 'Cache-aside',
    def: 'The default caching pattern where application code steers everything: check the cache first, fall back to the database on a miss, write the result into the cache, and return it. Because the cache sits off to the side rather than in front, a cache outage only slows the app down instead of breaking it. The trade-offs are repeating that logic in every reader and living with a slim race window where a concurrent write leaves a stale entry behind.',
    say: 'Cache-aside keeps caching logic in the app (check cache, miss to database, fill on the way back), so a cache outage slows latency instead of taking the app down.',
    reachFor:
      'The go-to default for read-heavy workloads, especially when surviving a cache outage matters more than keeping read code minimal.',
    trap: "Wrong: 'The cache sits in front of the database.' In cache-aside nothing sits inline; the application talks to both directly. Say 'The app checks the cache and fills it on a miss, which turns a cache failure into a latency bump rather than an outage.'",
  },
  writethrough: {
    name: 'Write-through',
    def: 'A caching pattern where every write updates both the cache and the backing database together, keeping the cache fresh from the start. Immediate reads after a write always hit warm data, though writes run slower because they wait on both stores and memory fills up with newly written items nobody may ever read. Its faster cousin, write-behind, acknowledges straight from cache and flushes asynchronously, risking data loss if the cache crashes before flushing.',
    say: 'Write-through updates the cache and database together so cached data never goes stale, trading slower writes and memory spent on cold entries for warm immediate reads.',
    reachFor:
      'Write-then-immediately-read flows and small hot datasets where keeping cache and database locked together justifies extra write latency.',
    trap: "Wrong: 'Write-through is safer, so default to it.' It roughly doubles write latency and crowds memory with cold data. Say 'Write-through when reads immediately follow writes, cache-aside by default, and write-behind only when losing the last few seconds is genuinely acceptable.'",
  },
  readthrough: {
    name: 'Read-through',
    def: 'A caching mode where the cache layer itself, rather than your app code, fetches missing keys from the backing database. Your application only ever talks to the cache, keeping miss-handling logic in one place instead of copying it across services that can drift apart. The trade-off is tighter coupling and wider blast radius: the cache now holds database credentials and schema knowledge, and if the cache dies, reads stop completely.',
    say: 'Read-through lets the cache itself load misses from the database so apps only call the cache and miss logic stays in one place.',
    reachFor:
      'Multiple services reading the same dataset where duplicating cache-aside logic everywhere would inevitably drift out of sync.',
    trap: "Wrong: 'Read-through and cache-aside are basically the same.' They differ in who fetches from the database, which completely changes what breaks when the cache goes down. Say 'Read-through centralizes miss logic and makes the cache a hard dependency, whereas cache-aside keeps the cache optional.'",
  },
  eviction: {
    name: 'Eviction',
    def: 'What a full cache does to make room for a new entry: boot an older one out. The eviction policy decides who leaves (LRU drops the least recently used, LFU drops the least frequently used), and every policy is just an educated guess at the one thing you cannot know: what will sit unused the longest. Eviction is normal, healthy behavior; a cache that never evicts is either oversized or hoarding data nobody asks for.',
    say: 'Eviction is how a full cache picks which entry to drop, usually least-recently-used, because every policy approximates the one thing you cannot know: what will not be needed next.',
    reachFor:
      'Sizing cache memory, diagnosing why hit rates dropped as the working set grew, or finding where the cache cliff lives.',
    trap: "Wrong: 'We set a short TTL so the cache stays small.' TTL bounds staleness while eviction bounds memory capacity, and they fail in completely different ways. Say 'TTL controls how stale a value can get, while the eviction policy controls what survives when RAM fills up.'",
  },
  coalescing: {
    name: 'Request coalescing',
    def: 'Merging identical in-flight cache misses into a single backend fetch: the first miss heads to the origin while every duplicate pauses and shares that same answer once it returns. Also known as request collapsing or a dogpile lock, it stops cache stampedes at the root because one miss never hurt anyone; ten thousand simultaneous copies of that miss did.',
    say: 'Request coalescing sends only the first miss to the origin while duplicate callers wait on that same in-flight fetch, turning ten thousand simultaneous misses into one.',
    reachFor:
      'Hot keys with expiring TTLs, CDN origin shielding, and expensive queries hit by crowds at the exact same moment.',
    trap: "Wrong: 'We will lengthen the TTL so it stops stampeding.' A longer TTL makes stampedes happen less often, not one bit smaller when they hit. Say 'I will coalesce duplicate misses behind one in-flight fetch and add jitter to TTLs so hot keys stop expiring together.'",
  },
  keyversion: {
    name: 'Key versioning',
    def: 'Invalidating cached entries by changing the key name (embedding a version number or content hash) instead of hunting down old entries to delete them, so fresh content simply misses and stale keys age out quietly. It sidesteps the hardest problem in caching, trying to purge every copy across browsers, CDNs, and app caches at once, and makes rollback effortless because the old key still holds the old data. You only pay the RAM cost of old entries sitting around until eviction.',
    say: 'Key versioning turns cache invalidation into a clean miss by putting a version or content hash in the key, so I never have to chase stale copies across every cache layer.',
    reachFor:
      'Static assets, rendered page fragments, and anything cached across browser, CDN, and app layers where coordinated purges fail.',
    trap: "Wrong: 'We just purge the cache on deploy.' You can purge your own cache, never every user's browser or intermediate proxy. Say 'I put a content hash in the key so new deploys fetch fresh keys while stale copies quietly go unread.'",
  },
  edgecache: {
    name: 'Edge cache',
    def: "A cache sitting inside a CDN's point of presence just tens of kilometers from the user instead of back in your origin region. Because physical distance is latency, an edge hit answers in single-digit milliseconds where an origin trip crosses a continent. Serving traffic at the edge also absorbs the load completely so it never touches your servers, which is why edge caching is usually the cheapest capacity you can buy.",
    say: 'An edge cache serves hits from a CDN point of presence near the user in a few milliseconds, absorbing requests before they ever touch my origin.',
    reachFor:
      'Static assets, media, and cacheable shared responses for a geographically spread audience, usually the first capacity layer to add before scaling origin servers.',
    trap: "Wrong: 'The CDN caches our site.' A CDN only caches what you configure as cacheable, and personalized pages bypass it by default. Say 'Static and shared assets live at the edge, while personalized pages split into a cacheable shell plus one tiny personalized API call.'",
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
      // spec 073 (coverage-map §B.3): the traffic bundle. These five carry the
      // speakable contract; the group as a whole does NOT yet — see the schema test.
      'jwt', 'rbac', 'cursor', 'rangerequest', 'apikey',
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
      // spec 073 (coverage-map §B.3): the networking bundle.
      'graphql', 'nat', 'signaling',
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
    keys: [
      'cache', 'hitrate', 'ttl', 'stampede', 'cdn', 'fanout',
      // spec 073 (coverage-map §B.3): the caching-and-delivery bundle.
      'cacheaside', 'writethrough', 'readthrough', 'eviction', 'coalescing',
      'keyversion', 'edgecache',
    ],
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
      // spec 076 (coverage-map F1): the indexing + search briefings' vocabulary.
      'heapfile', 'segment', 'tombstone', 'analyzer', 'relevance', 'queryplanner',
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
