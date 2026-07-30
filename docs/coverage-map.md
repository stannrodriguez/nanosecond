# Concept Library coverage map — source material → 27 briefings

**Status:** accepted and in flight. The P-series prerequisites (§D.0) landed as
specs 071–075, and the fill-out queue (§D.1) is being authored one row at a time —
F1 landed as spec 076. The §D.1 table is the live record of what is done.

## What this document is

The user supplied three Hello Interview study compilations (Core Concepts, Key
Technologies, Patterns — 25 articles, 436 pages) as source material for the 27
Concept Library briefings. The SOURCE SUPERSET rule (`docs/content-pipeline.md` §7)
says shipped content must be an information superset of supplied source, mapped
claim-by-claim, with anything left out carrying an explicit waiver. This map is the
claim-by-claim ledger that makes that rule checkable *before* we start authoring.

It has four parts:

- **[A] Per-article inventories** — what is actually in each of the 25 articles.
- **[B] Master topic → destination map** — where every item lands: a page block, a
  glossary entry, a say-it card, a `numbers.ts` entry, or a one-line waiver.
- **[C] Connection edges** — proposed `related.sections` graph, every edge with a
  why-sentence in both directions.
- **[D] Ordered fill-out spec sequence** — what to build in what order, with the
  shared prerequisites that must land first.

**Provenance.** The PDFs are source material only. They are not committed to this
repo and never will be (content-pipeline §7). Everything below is a description of
*what a topic is*, never a reproduction of how the source says it. Shipped content
is a superset of the source's **information**, and shares none of its **wording**.

**Fixed ground.** Spec 069 (networking briefing) is already planned and its
Appendix A already assigns the whole Networking Essentials article. Those
assignments are treated here as immovable: §B.1 restates them, and everything else
maps *around* them. Where this map adds a destination Appendix A did not enumerate,
it is marked `[+]` and never contradicts an existing assignment.

---

## 0. The structural mismatch (read this first)

The source and the library are not shaped the same way, and three-quarters of the
authoring judgment in this map comes from reconciling them.

**Core Concepts → concepts shelf: near-parity, one gap.** 8 of our 9 concept
briefings have a directly corresponding article. `cc09 Numbers to Know` has no
briefing at all — it is *cross-cutting*, and its content belongs in `numbers.ts`
plus the derivation lines of a dozen other briefings.

**Key Technologies → technologies shelf: product names vs capability names.** The
source articles are named for products (Redis, Kafka, Cassandra, DynamoDB,
PostgreSQL, Elasticsearch, Flink, ZooKeeper, API Gateway). Our 11 briefings are
named for capabilities (relational-db, nosql-db, queues, streams, distributed-locks,
distributed-caches, …). The mapping is many-to-many in both directions:

| Direction | Consequence |
|---|---|
| One article → many briefings | Redis alone supplies distributed-caches, distributed-locks, queues, streams, proximity, contention, api-gateway, consistent-hashing |
| Many articles → one briefing | nosql-db draws on Cassandra **and** DynamoDB; queues draws on Kafka, Redis Streams, SQS, RabbitMQ |
| Briefing with **no** source article | **blob-storage**, **load-balancer**, **cdn** |

The three briefings with no source article are not underserved — load-balancer and
cdn are richly covered inside the Networking Essentials article, and blob-storage is
covered by the Handling Large Blobs pattern. They just receive their material by
edge rather than by article.

**Patterns → patterns shelf: 7 articles, 8 briefings.** Six map cleanly.
`proximity` has **no source pattern article** and assembles from five other places
(indexing's geospatial section, Redis geo commands, Elasticsearch geo types,
PostGIS, and the regional-partitioning material in networking).

**Consequence for sequencing:** briefings fed by a single dedicated article are
cheap and can be authored in parallel. Briefings assembled from fragments across
many articles (proximity, load-balancer, cdn, blob-storage, queues, streams) are
expensive and need their prerequisites landed first. §D orders on exactly this.

---

# A. Per-article inventories

Each entry records the article's scope, its topic clusters, its distinctive callouts
(the source's asides and interview advice — a genuine content category, not
decoration), its quantities, and where the bulk of it lands. "Claims" counts
load-bearing assertions, not sentences.

## A.1 Core Concepts (9 articles, 135 pp.)

### cc01 · Networking Essentials — pp. 3–38 · ~64 claims
**Scope:** the whole stack, L3 to L7, plus load balancing, regionalization, and
failure handling. The single largest article in the set and the widest-ranging.

**Topic clusters:** layered architecture and layers-as-abstractions · L3/IP
(addressing, best-effort delivery, packetization) · L4 (TCP characteristics, UDP
characteristics, QUIC as modernized transport) · L7 protocol survey (HTTP anatomy,
REST, GraphQL, gRPC, SSE, WebSockets, WebRTC) · the request lifecycle end to end
(DNS → handshake → request → response → teardown) · connection state and reuse ·
kernel-space vs user-space · vertical vs horizontal scaling · client-side load
balancing · dedicated load balancers (L4 vs L7, health checks, algorithms) ·
regionalization, availability zones, and the speed-of-light floor · CDN edge
caching · regional partitioning · the failure family (timeouts, retries,
exponential backoff, jitter, thundering herd, idempotency keys, circuit breakers,
cascading failures).

**Callouts (≈20):** role-dependent depth expectations · the fading "what happens
when you type a URL" question · QUIC/HTTP3 as a depth signal rather than a design
choice · browsers cannot speak raw UDP · headers as a lesson in extensible
interface design · never trust the request body · resources vs operations in REST ·
premature protocol optimization · SSE's infrastructure limitations being unknown to
most interviewers · WebSocket infrastructure support · not reaching for WebSockets
unjustified · candidates going off-trail with WebRTC · DNS rotation removing the
load balancer as a single point of failure · L4-vs-L7 for realtime · scaling load
balancers being out of scope · "retry with exponential backoff" as the expected
phrase, with jitter as the senior follow-up · cascading failures as an experience
screen.

**Numbers (11):** UDP vs TCP header sizes · protobuf vs JSON encoded size · gRPC
throughput multiple · local vs transatlantic latency · speed of light in fiber ·
NY–London distance · resulting theoretical minimum round trip · hardware load
balancer throughput ceiling · GraphQL's origin year.

**Destination:** fixed by spec 069 Appendix A. See §B.1.

### cc02 · API Design — pp. 39–52 · ~41 claims
**Scope:** protocol selection, REST mechanics, GraphQL, RPC, and the cross-cutting
API patterns (pagination, versioning, auth, rate limiting).

**Topic clusters:** three protocols and a selection flowchart · REST as default ·
resource modeling (things not actions, plural nouns, nesting vs query params, the
required-vs-optional rule for path vs query) · HTTP methods with per-verb safety and
idempotency, including the subtlety that PATCH's idempotency depends on
implementation · the three input channels (path structural, query modifier, body
payload) · responses as status code plus body, with 4xx-vs-5xx mattering more than
memorization · GraphQL origin, the over/under-fetching dilemma, schema design, the
**N+1 problem** and dataloader batching, field-level authorization · RPC as
action-oriented, gRPC on protobuf and HTTP/2, Apache Thrift, generated
cross-language type safety · pagination (offset-based drift vs cursor-based
stability and the loss of jump-to-page) · versioning (URL vs header) · security
(authentication vs authorization, API keys vs JWT and when each is wrong, RBAC) ·
rate limiting tiers and the 429 response.

**Callouts (≈13):** interviewers do not want perfect APIs · frontend/product/junior
roles weight this more · default to REST and move on · don't memorize status codes ·
don't default to GraphQL · skip internal APIs during the API step · remembering
pagination matters more than which kind · API keys are wrong for user-facing
products · mention rate limiting without designing the algorithm · candidates
over-invest here more often than under-invest.

**Numbers (8):** REST's coverage fraction · GraphQL's origin year · the N+1 query
count for a 100-item query · per-user, per-IP, and per-endpoint rate limits ·
the status-code shortlist · the interview time budget for the API step.

**Destination:** `api-design` (primary), with pagination and rate-limiting material
edging to `api-gateway`.

### cc03 · Data Modeling — pp. 53–65 · ~34 claims
**Scope:** picking a database model, then designing a schema inside it.

**Topic clusters:** where modeling appears twice in an interview (core entities
early, schema sketch in the high-level design) · five database models with
when-to-consider and data-modeling impact for each — relational (ACID, joins, the
multi-table join performance trap, the exaggerated scalability knock), document
(flexible schema, embedding, the update-whole-document cost, and the observation
that interviews rarely have genuinely evolving schemas), key-value (used *with* SQL
rather than instead of it, flat and duplicated per access pattern), wide-column
(partition-contiguous writes, time as a first-class dimension), graph (almost never
correct in an interview; large social networks model their graphs relationally) ·
the three schema drivers (data volume, access patterns as the dominant one derived
from your own API, consistency requirements) · entities, system-generated keys,
the three relationship cardinalities, foreign keys and referential integrity with
their per-write validation cost, constraints · indexing tied to endpoints ·
normalization vs denormalization with three named exceptions and the
cache-as-denormalized-view escape · sharding by primary access pattern, the
time-range hot-shard anti-pattern, and shard-key permanence.

**Callouts (≈10):** the bar is lower than a dedicated data-modeling interview ·
resist exotic databases · document databases need an explicit trigger · graph
databases are a common and costly mistake · tie schema choices to the three drivers
out loud · keep the model grounded in the problem domain · connect indexes to
endpoints · the shard key is effectively permanent.

**Numbers (2):** the single-instance storage ceiling referenced forward to sharding ·
an illustrative book-index page number.

**Destination:** `data-modeling` (primary), with model-selection material edging to
`relational-db` / `nosql-db` and the closing checklist to a say-it card.

### cc04 · Caching — pp. 66–78 · ~40 claims
**Scope:** where to cache, how to cache, what to evict, and the three failure modes.

**Topic clusters:** the latency argument (memory near the CPU vs disk behind a
query) · four *places* — external (the expected default), CDN, client-side
(browser, mobile, and client-library metadata), in-process (with the caveat that
per-instance caches cannot be invalidated coherently) · four *architectures* —
cache-aside as the one to remember, write-through (needing library support, slower
writes, cache pollution, and an unresolved dual-write problem), write-behind (fast
writes, crash-loses-data, analytics-shaped), read-through (which is what a CDN is) ·
four *eviction policies* — LRU as the safe default, LFU for consistently popular
keys, FIFO's evicts-hot-items flaw, and TTL as an expiry mechanism that is not
itself an eviction policy · three *failure modes* — stampede (with request
coalescing as the most effective fix and the caveat that cache warming only helps
TTL-based expiry, not write invalidation), consistency (the read-cache/write-DB
window), hot keys (replication, local fallback, rate limiting) · a five-step
interview walkthrough with four quantified triggers.

**Callouts (≈9):** external Redis is the expected default · introduce a CDN for
static media first · in-process only as a later optimization layer · cache-aside is
the one pattern to remember · write-through is rare in interviews · read-through is
basically only CDNs · LRU is the safe answer · prove the bottleneck before caching ·
pick one or two downsides, not all of them · don't cache everything.

**Numbers (13):** relational read vs in-memory read latency and their ratio ·
cross-continent vs CDN-edge latency · a daily-active-user read derivation ·
pre- and post-cache query latencies · a feed-computation cost · TTL values ·
a database CPU headroom figure · a load-reduction fraction · a latency SLA against
uncached query time · concurrent refetch count.

**Destination:** `caching` (primary), `distributed-caches` and `cdn` (secondary).

### cc05 · Sharding — pp. 79–90 · ~38 claims
**Scope:** partitioning vs sharding, choosing a key, three distribution strategies,
and the three hard problems sharding creates.

**Topic clusters:** the vertical ceiling that forces the decision · the
partitioning/sharding terminology distinction (within one instance vs across
machines) and the note that engineers use the terms loosely · horizontal vs vertical
partitioning · what a shard actually is (a standalone database with its own
resources) · the two decisions (what to shard by, how to distribute) · three
properties of a good shard key (high cardinality, even distribution, alignment with
queries) with worked good and bad examples · three strategies — range-based (simple,
efficient range scans, skew risk, multi-tenant fit), hash-based (the default and
what interviewers assume; the resharding catastrophe when the modulus changes),
directory-based (maximum flexibility, per-request lookup latency, single point of
failure, and the observation that it derails interview conversations) · three
challenges — hot spots (the celebrity problem, time-based write skew, detection
signals, and three remediations including dynamic shard splitting with the
distinction between automatic and operator-driven), cross-shard operations
(scatter-gather cost, and three mitigations), consistency (two-phase commit's
fragility, designing to avoid cross-shard transactions, sagas with compensations,
accepting eventual consistency) · how modern databases differ in their actual
mechanisms · a four-step interview script and three capacity triggers.

**Callouts (≈8):** don't get hung up on the terminology · hash-based is assumed ·
directory-based invites derailing follow-ups · time-range sharding is a write
anti-pattern · cross-shard queries signal a design rethink · premature sharding is
the single most common mistake · you will not implement sharding yourself.

**Numbers (11):** the managed-database storage ceiling · a large-table row count and
size · a modulus-change example · a geographic skew fraction · a celebrity shard's
traffic multiple · a shard count and its scatter-gather multiplier · a user-count ×
per-user-size storage derivation · write and read throughput triggers · a starting
shard count · a cache TTL for aggregate queries.

**Destination:** `sharding` (primary), `consistent-hashing` and `scaling-writes`
(secondary).

### cc06 · Consistent Hashing — pp. 91–101 · ~26 claims
**Scope:** the problem modulo hashing has, the ring, virtual nodes, and the limits
of the technique.

**Topic clusters:** modulo hashing and its two failures (adding a node, removing a
node — both redistributing nearly everything) · the hash ring, clockwise walk, and
the real key space versus the teaching-sized one · what actually moves when a node
joins or leaves, quantified · virtual nodes solving the uneven-successor-load
problem, and additionally letting a joining node absorb from many neighbors rather
than one · **the key distinction: virtual nodes fix structural imbalance,
replication and key salting fix workload imbalance** · hot spots and three
remediations · the practical note that consistent hashing tells you where data
*should* live but does not move it — replication means most failures move no data at
all, and movement happens only on planned membership changes and is bounded even
then · real-world users, plus a counterexample using fixed hash slots · when to go
deep (infrastructure interviews) versus when to name it and move on · the caveat
that the term is used loosely for fixed-slot variants.

**Callouts (≈6):** most published explanations are over-academic · the real ring is
far larger than teaching diagrams · the vnodes-vs-replication distinction is *the*
interview point · not every system uses it · name it and move on in most interviews ·
the term is used loosely in practice.

**Numbers (8):** the real hash space size · a teaching ring with node positions ·
the arc that moves on a join, as a fraction of one node's span and of all keys ·
a celebrity read multiple · a fixed-slot count and its hash function · a replication
factor across availability zones · a salting suffix range.

**Destination:** `consistent-hashing` (primary), `distributed-caches` and `cdn`
(secondary).

### cc07 · CAP Theorem — pp. 102–107 · ~20 claims
**Scope:** the three properties, the reduction to a single choice, and the
consistency spectrum.

**Topic clusters:** the three properties defined precisely · the explicit warning
that CAP-consistency is not ACID-consistency · **the reduction: partition tolerance
is mandatory in a distributed system, so CAP collapses to one question — C or A
*when a partition occurs*** · a two-region worked example making the choice concrete ·
three cases where consistency wins (booking, inventory, financial) and three where
availability wins (social profiles, content platforms, review sites) · the decision
question, which asks whether a brief window of inconsistency would actually be
catastrophic for this feature · CAP's placement in the
non-functional requirements step · what a consistency-first design contains versus
an availability-first one, each with technology examples · per-feature CAP with two
worked systems that need both · a four-level consistency spectrum (strong, causal,
read-your-own-writes, eventual) with a canonical use for each.

**Callouts (≈7):** CAP is a routine point of candidate confusion · CAP-C ≠ ACID-C ·
partition tolerance is non-negotiable so the choice is binary · most systems should
choose availability · junior/mid candidates can stop before the advanced section ·
real systems mix C and A per feature · the one question to ask yourself.

**Numbers:** none quantitative beyond illustrative scenarios (a seat, a unit of
inventory). This article is unusual in the set for carrying essentially no numbers.

**Destination:** `cap` (primary).

### cc08 · Database Indexing — pp. 108–128 · ~57 claims
**Scope:** how indexes work physically, five index types, and two optimization
patterns. The second-largest article.

**Topic clusters:** physical storage (heap files, page-at-a-time loading, why a
scan is slow) and the observation that random access remains materially slower than
sequential even on SSDs · index costs (space that can approach the data size, and a
write amplification of one-per-index) and the two cases where indexes lose · B-trees
(structural rules, page-sized nodes, shallow lookups, why they are the default in
five specific ways) · **LSM trees** at unusual depth — the write-path motivation,
the fact that an LSM tree is the storage format for the whole table rather than a
per-column structure, the four-stage write path (memtable, write-ahead log, SSTable
flush, compaction), the read penalty of checking many files, and three mitigations
(bloom filters, sparse indexes, compaction strategies with their opposing
trade-offs) · hash indexes (O(1) exact match, useless for ranges, rare in practice
because B-trees are nearly as fast at equality) · **geospatial** — why two
one-dimensional indexes fail at a two-dimensional problem, then geohash (recursive
subdivision to a sortable string, indexed with an ordinary B-tree, needing adjacent
cells for radius queries, with the boundary-straddling limitation), quadtrees
(adaptive resolution, specialized structure, ancestor of R-trees), and R-trees
(overlapping data-fitted rectangles, indexing points and polygons together, with
overlap forcing multi-branch searches) · inverted indexes (why a mid-string pattern
cannot use a B-tree, the flipped mapping, the analysis pipeline, and the features
built on top) · composite indexes (one traversal serving both filter and sort, the
prefix rule, the selectivity heuristic nuanced by sort patterns, three canonical
shapes) · covering indexes (skipping the heap fetch, at a size cost, and the modern
assessment that they are a niche optimization).

**Callouts (≈9):** infrastructure roles probe this harder · internals aren't asked
but ground the reasoning · the random-vs-sequential gap is real on SSD · index memory
impact is often overblown · B-trees are the safe default · don't overemphasize hash
indexes · for geospatial, know the problem and one solution · covering indexes need
justification · when in doubt, B-tree.

**Numbers (10):** disk page size · node fan-out · lookup depth · the node-occupancy
and child-count rules · the write rate at which B-trees break down · memtable flush
threshold · a sparse-index skip example · quadtree split threshold · geohash
precision levels · a table-size threshold below which indexing is pointless.

**Destination:** `indexing` (primary), `search-db` / `proximity` / `relational-db` /
`nosql-db` (secondary).

### cc09 · Numbers to Know — pp. 129–135 · ~45 quantities
**Scope:** a hardware-capability reference plus three named over-engineering
mistakes. **This article has no corresponding briefing — it is cross-cutting.**

**Topic clusters:** the framing that outdated numbers are the tell of book knowledge
without operational experience, and that they cause over-engineering · modern
hardware limits (compute, storage, network bandwidth, and a three-tier latency
ladder from same-zone to cross-region) · four component profiles, each with key
metrics *and* explicit scale triggers — caching, databases, application servers,
message queues · the note that a single instance is not a single point of failure
because replication for availability is a separate concern from partitioning for
scale · a consolidated cheat sheet · **three named mistakes with worked
arithmetic** — premature sharding (two derivations showing datasets that comfortably
fit one machine), overestimating storage latency (indexed lookups are already fast,
so a cache added for latency alone is unjustified), and over-engineering write
throughput (a specific write rate that needs no queue, the four things that actually
limit write capacity, and four simpler optimizations to try first) · the position
that cost modeling matters in practice but rarely in interviews, with the exception
of obviously wasteful designs.

**Callouts (≈6):** outdated numbers are a seniority tell · single databases handle
terabytes · caches hold whole datasets · queues are fast enough for synchronous
flows absent a backlog · application servers have spare memory · knowing where the
real limits are is itself a seniority signal.

**Destination:** `numbers.ts` plus derivation lines across ~12 briefings. See §B.4.
This is the single largest prerequisite in the whole map.

## A.2 Key Technologies (9 articles, 164 pp.)

### kt01 · Redis — pp. 3–16 · ~52 claims
**Scope:** the widest fan-out of any article. Basics, cluster mechanics, then six
distinct capabilities, then failure modes.

**Topic clusters:** the single-threaded execution model and why it is deliberate ·
**the durability callout** — two persistence modes, each with an explicit loss
window, an intentional trade-off, and a durable alternative · data structures
including streams and geospatial indexes · cluster mechanics (fixed hash slots,
client-cached slot maps, redirect-on-wrong-node, gossip, and the fact that nodes do
not forward) · **asynchronous replication as the deepest reason Redis is not a
system of record** — acknowledged writes can vanish on failover, a point the article
deliberately raises twice · hash tags for co-locating keys · performance
(microsecond execution, and the observation that the N+1 pattern is survivable here
because pipelining pays one round trip) · **six capabilities** — cache (with TTL as
staleness control distinct from memory pressure, the need to configure eviction
explicitly, and approximate LRU), distributed lock (the acquire idiom, the
check-token-then-delete release with its reason, the pessimistic/optimistic
clarification, the async-replication failure mode, the controversial majority-node
algorithm, fencing tokens as the standard defense, and the conclusion that a Redis
lock is an efficiency tool rather than a correctness guarantee), leaderboards, rate
limiting (fixed window with the expiry-only-on-first-request subtlety, and a sliding
window variant), proximity search (with its two-pass complexity explained by the
grid-aligned imprecision of geohash boxes), event sourcing via streams (consumer
groups, idle-time-based reclaim, and the resulting need for idempotent processing) ·
pub/sub with a **myth-busting callout** (sharded pub/sub now scales with the
cluster) and a detailed rebuttal of the roll-your-own alternative on network-hop and
liveness-tracking grounds · **hot keys** with three remediations, each with a stated
catch — including that replicas do nothing for a write-hot key · four explicit
boundaries on when not to use Redis at all.

**Callouts (≈13):** listed inline above; the durability, replication, lock-safety,
and replicas-don't-help-writes callouts are the load-bearing ones.

**Numbers (12):** slot count · per-node write throughput · command execution and
network read latencies · the persistence fsync interval · a lock expiry · a
leaderboard trim producing a top-N · the proximity search complexity · version
numbers for two feature changes · a cluster size in the hot-key example · a key-copy
count · the network-hop comparison.

**Destination:** `distributed-caches` (primary); `distributed-locks`, `queues`,
`streams`, `proximity`, `contention`, `consistent-hashing`, `api-gateway`
(secondary). The widest spread in the map.

### kt02 · Elasticsearch — pp. 17–42 · ~54 claims
**Scope:** client-facing usage, then internals, framed explicitly as two separate
audiences (product interviews vs infrastructure interviews).

**Topic clusters:** the framing that a general-purpose database with a full-text
index suffices for many problems, and what pushes you past it · four client concepts
(documents, indices, mappings, fields) with an explicit warning that "index" is
overloaded · keyword-vs-text as a hash-lookup-vs-inverted-index distinction ·
mapping bloat costing memory · nesting vs separate index framed as the
normalization/denormalization trade-off · **optimistic concurrency control via a
version field**, with conflict-then-retry semantics · partial updates and why
explicit update semantics matter in a distributed, asynchronous, concurrent system ·
the query model · **geospatial** — two field types (point vs shape) with distinct
use classes, radius queries composed with other filters, and the internals (geohash,
BKD trees as a block-storage-optimized k-d tree variant, R-tree-like structures) ·
sorting including relevance as the default with its classical scoring basis ·
**three pagination models with a genuine progression** — offset/size with a deep-
pagination cliff, search-after (stable, forward-only, client-stateful, still
vulnerable to updates on earlier pages), and point-in-time cursors giving a
consistent view at higher cost · the orchestration-over-a-search-library
architecture · five node types with role composition and hot/warm/cold/frozen data
tiers · leader election among seed nodes · the two-phase query/fetch execution and
the ideal of never touching source documents · the shard/replica/segment nesting and
the throughput multiplication replicas provide · **segment immutability** — batched
writes, merges, deletion as a tombstone set, updates as soft-delete-plus-insert, and
the consequence that **updates cost more than inserts**, making Elasticsearch a poor
fit for rapidly-changing data · six named benefits of immutability · inverted index
motivated from first principles (two ways to make lookup fast: reorganize, or copy
and reorganize the copy) · doc values as a columnar per-field structure, explicitly
linked to how analytics engines work · **query planning** with a worked
order-of-execution example where the choices differ by orders of magnitude, and
statistics as what enables the choice · six cautions for interview use, most
importantly that it is not a database and is usually fed by change data capture ·
five transferable lessons.

**Callouts (≈9):** "index" is overloaded · the nesting decision is fair game · the
API is a good model for API-design questions · relevance scoring is worth learning ·
updates cost more than inserts · the immutability lessons generalize · query-planner
questions are familiar territory in infrastructure interviews · don't use it as your
database · justify it over alternatives.

**Numbers (9):** default shard and replica counts · the deep-pagination threshold ·
cursor keep-alive · node type count · the replica throughput multiplier · a
document-count threshold below which you don't need it · the shard-to-index
correspondence.

**Destination:** `search-db` (primary); `indexing`, `proximity`, `streams`, `cap`,
`api-design` (secondary).

### kt03 · Kafka — pp. 43–57 · ~48 claims
**Scope:** built top-down from a motivating example, with an explicit
junior/senior/staff depth split partway through.

**Topic clusters:** a scaling narrative that derives partitions from an ordering
requirement, consumer groups from consumer overload, and topics from
multi-domain traffic — the article's strongest pedagogical move · brokers,
partitions as ordered immutable append-only logs, topics as logical groupings, with
the explicit distinction that topics organize while partitions scale · queue mode vs
stream mode as a consumption-pattern difference rather than an architectural one ·
message structure with four optional fields, the key determining partition, and
**ordering within a partition being by offset rather than timestamp** · the
two-step publish path via cluster metadata maintained by a controller · three
benefits of the append-only log · offsets and **at-least-once delivery by default**,
with exactly-once requiring specific configuration · leader-follower replication
with follower reads as a latency option, and controller-managed leadership
reassignment · the deliberate choice of a pull-based consumer model with four stated
advantages · when to use each mode with worked examples · **scalability** — a
message-size recommendation, an explicit blob anti-pattern with the store-a-pointer
fix, per-broker capacity estimates, two scaling strategies with the warning that
under-partitioned topics cannot exploit new brokers, and the partitioning function ·
**hot partitions** (flagged as a favorite interview question) with four strategies,
each with a stated cost · fault tolerance (acknowledgment settings, replication
factor, and the maxim that Kafka is highly available and sometimes consistent) ·
consumer failure as the realistic failure, with offset management and rebalancing ·
**the commit-timing trade-off** — commit only after durable work, and keep consumer
work small, with a worked two-phase split · producer retries needing idempotent mode ·
**consumers having no built-in retry or dead-letter support**, requiring a retry
topic and DLQ you build yourself · three performance levers · a default retention
window.

**Callouts (≈10):** junior/mid can stop halfway · don't store blobs · start scaling
conversations at the partitioning strategy · the availability maxim · push back
gently on a whole-broker-failure question · consumer failure is the realistic one · commit
offsets only after durable work · enable idempotent producers with retries · Kafka
lacks consumer retry and DLQ where another queue has them.

**Numbers (9):** an adoption fraction · the message size recommendation · per-broker
storage and throughput · the common replication factor · the default retention
window · the hash function · retry configuration values · a version at which follower
reads arrived.

**Destination:** `queues` + `streams` (co-primary); `scaling-writes`,
`long-running-tasks`, `multi-step` (secondary).

### kt04 · API Gateway — pp. 58–64 · ~22 claims
**Scope:** the smallest and most self-limiting article; it argues for its own
brevity.

**Topic clusters:** the single-entry-point framing and its parallel to the rise of
microservices · **the callout that candidates introduce a gateway, enthuse about
middleware, and never mention routing — the actual reason it exists** · a six-step
request trace (validation, middleware, routing, backend communication, response
transformation, optional caching) · a twelve-item middleware menu with the three
that matter for interviews · routing tables keyed on path, method, query parameters,
and headers · protocol translation, noted as uncommon in practice · response
transformation with a worked external-REST-to-internal-RPC example · caching limited
to non-user-specific data, with three strategies · horizontal scaling made easy by
statelessness, plus **the distinction between client-to-gateway load balancing (a
dedicated balancer in front) and gateway-to-service load balancing (the gateway
itself)** · global distribution via regional deployment, geographic DNS routing, and
configuration synchronization · six named products across managed and open-source ·
when it is overkill.

**Callouts (≈6):** candidates forget routing is the point · say "routing and basic
middleware" and move on · don't get bogged down at the entry point · managed services
are easiest and most expensive · there is far more risk of over-investing here than
under-investing.

**Numbers (3):** step count, middleware option count, caching strategy count.

**Destination:** `api-gateway` (primary); `load-balancer`, `api-design`, `cdn`
(secondary).

### kt05 · Cassandra — pp. 65–83 · ~49 claims
**Scope:** data model, distribution internals, then two extended real-world data
modeling walkthroughs.

**Topic clusters:** lineage and adopters · the keyspace/table/row/column hierarchy
with wide-column flexibility (columns varying per row, unlike a relational table) ·
per-column write timestamps with last-write-wins conflict resolution · **the primary
key decomposition into partition keys and clustering keys**, with five syntax
variants and the note that this concept is shared with the other major wide-column
store · consistent hashing for partitioning, derived from the two problems with
modulo hashing · virtual nodes both for even load and for letting heterogeneous
hardware own proportional shares · replication by clockwise scan, **skipping vnodes
on physical machines already in the replica set** · two replication strategies, one
rack- and datacenter-aware · **tunable consistency** — per-read and per-write
consistency levels, no ACID beyond row-level atomicity within a partition, and the
quorum overlap argument shown arithmetically · any node acting as coordinator ·
**the LSM storage model** (commit log, memtable, SSTable) with a five-step write
path, a bloom-filter-guided read path, compaction, and byte-offset SSTable indexing ·
gossip with generation and version numbers forming a vector clock, and seed nodes as
deliberate choke points preventing sub-cluster formation · failure detection that
never declares a node permanently down without an operator, plus hinted handoff for
short outages · **query-driven rather than entity-relationship-driven modeling**,
with four explicit considerations including partition *size* · **two extended worked
examples** — a chat system where unbounded partition growth forces a time-bucket
added to the partition key, and a ticketing system where the user interface itself
reveals the right partition key and justifies a denormalized summary table · three
advanced features · when to use and three limitations.

**Callouts (≈9):** the primary-key concept transfers · no ACID beyond row-level
atomicity · quorum read plus quorum write guarantees read-sees-write · last write
wins · consistent hashing generalizes beyond databases · a node is never declared
down without an operator · modeling is query-driven · partition size is a
first-class concern · the user interface drives the schema.

**Numbers (7):** replication factor · the quorum formula with a worked instance ·
the gossip version increment interval · a time-bucket width and its epoch · an event
size threshold · a section count · a deliberately imprecise display convention.

**Destination:** `nosql-db` (primary); `sharding`, `consistent-hashing`, `indexing`,
`cap`, `scaling-writes`, `data-modeling` (secondary).

### kt06 · DynamoDB — pp. 84–100 · ~51 claims
**Scope:** the managed counterpart to Cassandra, with unusually concrete pricing and
capacity mechanics.

**Topic clusters:** the three defining properties unpacked · the note that internals
are not public, so the article works from documentation and a published paper ·
tables/items/attributes with an item size ceiling and schema-less flexibility
pushing validation into the application · partition key and optional sort key, with
**a callout preferring monotonic identifiers over timestamps** and four generation
techniques including a specific recommendation between two identifier versions ·
internals — hash partitioning via a *centralized* metadata and placement service
rather than a peer-to-peer ring, with automatic split and merge, plus B-trees within
a partition for sort-key range queries · **two secondary index types compared across
eight dimensions** (physical location, size limits, throughput accounting,
consistency support, creation timing, deletion, per-table maxima, and use class),
with the operationally critical facts that one type is asynchronously updated and
eventually consistent while the other updates synchronously, and that one can only
be created at table creation · scan vs query · **a projection caveat** — restricting
returned attributes saves bandwidth but not read cost, unlike column selection in
SQL, which pushes you toward normalizing large items · **per-request consistency
choice** rather than per-table, with a stated cost multiple, plus transactions with
serializable isolation across a bounded item count, and the limitation that strong
reads are unsupported on one index type · replication internals (three replicas, a
consensus protocol, leader-handled writes, quorum acknowledgment, and the routing
difference between the two read modes) · auto-splitting, cross-region replication,
multi-zone redundancy · security defaults · **pricing as an architectural
constraint** — two models, capacity units with explicit byte quanta, per-partition
capacity ceilings, and a full worked cost derivation from a write rate to a daily
figure · a purpose-built cache with three sharp caveats (client swap required,
invalidation only for writes that pass through it, and no caching of strongly
consistent reads) · change data capture with three downstream use cases and a
pipeline caveat · four named limitations.

**Callouts (≈10):** ask whether it's allowed · specify both keys · monotonic ids over
timestamps · one index type must be planned at creation · the availability-only
reflex is outdated · strong reads unsupported on one index type · projections don't
save read cost · pricing constrains architecture · the cache won't see out-of-band
writes · the no-transactions criticism is obsolete.

**Numbers (14):** item size ceiling · per-table index maxima · a per-partition-key
size limit · transaction item limit · replica count and quorum · capacity unit byte
quanta and the strong-read multiple · per-unit prices · per-partition capacity
ceilings and their derived bandwidths · a worked partition count and daily cost.

**Destination:** `nosql-db` (co-primary with Cassandra); `indexing`, `sharding`,
`cap`, `distributed-caches`, `streams`, `blob-storage` (secondary).

### kt07 · PostgreSQL — pp. 101–125 · ~62 claims
**Scope:** the largest technology article. Read performance, write performance,
replication, consistency, and a SQL appendix.

**Topic clusters:** the framing that interviewers want architectural decisions, with
two named failure modes (diving into internals when asked about relationships, and
broad unsupported claims about NoSQL scalability) · a motivating example with
deliberately mixed requirements (atomic multi-step operations, referential
integrity, tolerable eventual consistency, efficient composite fetches, search, and
growth) · **specialized indexes that can replace whole systems** — full-text search
with stemming and ranking, plus a five-item list of what still justifies a dedicated
search engine; a JSON column type with containment queries giving schema flexibility
inside a relational store; a geospatial extension with a general-purpose index
framework, multiple geometry types, several distance models, and the note that a
major ride-sharing company ran its matching on it before outgrowing it · a combined
query using all three · covering and partial indexes · **practical performance
limits** — four query-class throughput bands, four scale thresholds, and the
principle that the working set should fit in memory · **the four-step write path**
(buffer cache plus log record in memory, sequential log flush at commit, asynchronous
background page writes, index updates also logged) with the conclusion that commit
latency is gated by log flush · four throughput bands with five limiting factors,
including **the process-per-connection model that makes a connection pooler
necessary** · five write optimizations in escalating order (hardware, batching,
offloading to a queue, time-based table partitioning with a hot/cold storage
pattern, and sharding — noting the absence of built-in sharding) · replication
(asynchronous default vs synchronous, a hybrid arrangement, read-scaling with a
read-your-writes caveat, and four-step failover) · **the auction race condition** —
the article's centerpiece, where a check-then-insert under default isolation leaves
a record that should never have been accepted, fixed either by row-level locking or
by stronger isolation, with the interview-phrasing point that "transactions" alone is
an insufficient answer · three isolation levels with the notable fact that this
engine's middle level is stronger than the standard requires · an eight-row
comparison of stronger isolation versus row locking · optimistic concurrency
implemented manually with a version column · five reasons it should be the default
and three genuine reasons to leave (extreme write throughput, active-active
multi-region against a single-primary architecture, and pure key-value access), with
the closing position that scalability alone is not one of them · a SQL appendix
covering relations, foreign keys, three cardinalities, join tables, normalization
with three benefits, ACID walked through a transfer example, the ACID-vs-CAP
consistency warning, an isolation-anomaly matrix, and four SQL command categories.

**Callouts (≈14):** listed inline; the load-bearing ones are the two failure modes,
"don't index every column", trying built-in search and geospatial before adding a
system, connection pooling, "shard, don't abandon" past a write threshold, saying
*how* you use ACID, and "transactions AND row-level locking".

**Numbers (12):** four read-throughput bands · four write-throughput bands · four
scale thresholds · a spatial reference identifier · radius examples · the count of
isolation levels accepted versus implemented.

**Destination:** `relational-db` (primary); `indexing`, `search-db`, `proximity`,
`contention`, `scaling-reads`, `scaling-writes`, `cap`, `data-modeling` (secondary).

### kt08 · Flink — pp. 126–142 · ~44 claims
**Scope:** stream processing concepts, then the runtime, with an unusually strong
"do you even need this" opening.

**Topic clusters:** **the do-you-need-streaming framing** — many apparent streaming
problems reduce to batch, and the honest question is whether real-time latency is
required · the escalation that introduces state, and the three problems state
creates (crash loses it, scaling requires redistributing it, and out-of-order events
corrupt accuracy) · the dataflow graph vocabulary · sources and sinks with the
observation that interview designs almost always start from a log, and the advice
not to use this tool for batch in an interview · streams as unbounded sequences that
are explicitly *not* durable logs — durability comes from checkpoints · seven
operators, with a note distinguishing record-at-a-time streaming from batch
map-reduce · five state types · **watermarks** — four causes of lateness, the
timestamp-flowing-alongside-data mechanism with a worked arrival example, three
things they enable, two strategies, and the practical note that mission-critical
systems pair bounded lateness with an offline correction process · **four window
types** with the emission-frequency arithmetic that makes window choice a cost
decision, per-key independence, and allowed lateness · a job definition and the
four-step submission path · two worked jobs, the second building an entire fraud
detection system (enrichment by stream join, velocity detection over a sliding
window, sequence pattern detection, alert union and deduplication, dual sinks) ·
cluster architecture with leader-based coordination whose high availability
typically rides on an external coordination service · task slots as the unit of both
resource scheduling and parallelism, with three purposes · three state backends with
an explicit memory-versus-terabytes trade-off and remote storage options ·
**checkpointing** via a distributed-snapshot algorithm using barriers that flow with
the data, and a seven-step recovery in which **the entire job pauses** because the
job is treated as one consistency unit, sources rewind to checkpoint positions
(requiring sufficient upstream retention), and processing resumes · **the
exactly-once caveat** — the guarantee covers internal state only and does not extend
to external systems, so side effects still need idempotency or transactions · five
interview cautions · five transferable lessons.

**Callouts (≈9):** ask whether you need real-time at all · start from a log · don't
use it for batch in an interview · pair bounded lateness with offline correction ·
pick the cheapest adequate window · exactly-once does not cover external side
effects · it's overkill for simple transforms · source rewind depends on upstream
retention · interviewers may not know its capabilities and may misjudge your design.

**Numbers (10):** window durations and slide intervals · a lateness bound · a
detection threshold and amount · a pattern time bound · the default slot-per-core
rule · a watermark arrival example.

**Destination:** `streams` (primary); `queues`, `scaling-writes`,
`long-running-tasks`, `multi-step`, `realtime-updates` (secondary).

### kt09 · ZooKeeper — pp. 143–164 · ~53 claims
**Scope:** coordination primitives, built from a five-stage motivating failure
narrative. The best-structured article in the set.

**Topic clusters:** **the escalating chat narrative** — single server needs no
coordination; two servers create a discovery problem; a database introduces a single
point of failure, per-message latency, and a query bottleneck; caching introduces
staleness that loses messages; peer broadcast creates quadratic connection growth;
heartbeats introduce the partition problem where different servers disagree about
liveness — arriving at five named challenges (service discovery, configuration
sharing, failure detection, leader election, consensus) · the synchronized-metadata-
filesystem mental model · the node hierarchy with a size guidance and the
small-data-many-nodes shape · **three node flavors** — persistent, ephemeral
(session-scoped, giving automatic crash cleanup), sequential (monotonically
numbered) · a scale callout that a real system should not create a node per user but
instead register servers and hash users onto them · ensembles of odd size with
leader and follower roles, quorum survival, and stated fault tolerance per size ·
**watches** — the notification mechanism, the arithmetic showing that polling would
make the coordinator the bottleneck, and **the key pattern that servers keep a local
cache updated by notification**, which is why this is a coordination service rather
than a database · **four capabilities** — configuration management with
restart-free propagation and the advice to store only dynamic values, service
discovery, leader election via lowest sequential ephemeral node with successor
watching, and distributed locks by the same mechanism with an explicit unsuitability
for high-frequency locking · **an explicit lock comparison** naming when to prefer
this over a cache-based lock (correctness over performance, and long-lived locks
where session-based failure detection beats timeout management) · the consensus
protocol in two phases, with **the confusing inversion that internal leader election
prefers the highest identifier while the application-level pattern built on top uses
the lowest** · five consistency guarantees, with the caveat that follower reads can
be stale unless synchronized · a read-dominant optimization ratio · sessions with
timeouts, heartbeats, recovery, and expiration semantics, plus tuning guidance in
both directions · storage (write-ahead log with a recommendation for dedicated
hardware, plus snapshots) and a note that memory swapping is catastrophic because
operations are ordered · failure handling including **partitions halting writes to
prevent split-brain** · its current ecosystem position and one major system's
migration away from it toward a built-in consensus mode, framed as an industry
trend · three alternatives · **three limitations** (watch hot-spotting, expensive
writes with in-memory capacity limits, and operational complexity summarized as easy
to use and hard to operate) · three cases where it is still the right answer,
including a routing scheme that co-locates related connections on the same server.

**Callouts (≈9):** the example deliberately shows where direct coordination is
needed · don't create a node per user · the leader-election inversion · follower
reads can be stale · session timeout tuning cuts both ways · easy to use, hard to
operate · it should rarely be your first reach · skip the internals if overwhelmed.

**Numbers (9):** node data size guidance · ensemble sizes and their fault tolerance ·
session timeout range · the read-to-write ratio · the quadratic connection count.

**Destination:** `distributed-locks` (primary); `cap`, `load-balancer`,
`realtime-updates`, `queues`, `multi-step` (secondary).

## A.3 Patterns (7 articles, 137 pp.)

### pt01 · Real-time Updates — pp. 3–38 · ~58 claims
**Scope:** the largest pattern article. Organized around a two-hop frame that is the
single most reusable idea in the set.

**Topic clusters:** **the two-hop frame** — hop 1 is server-to-client delivery, hop 2
is how the server learns an update happened; these have different trade-offs and are
solved separately · a networking recap that substantially duplicates cc01 (layers,
request lifecycle, L4 vs L7 balancers) · **five client-server protocols**, each with
mechanism, advantages, disadvantages, when-to-use, and what to discuss: simple
polling (with the underrated advantage that it is quick to explain, preserving
interview time), long polling (with **a worked latency derivation showing the second
of two near-simultaneous updates arriving at nearly triple the network latency**,
plus browser per-domain connection limits and the requirement that every
infrastructure hop agree on the timeout), server-sent events (the chunked-transfer
mechanism, built-in reconnection with a resume identifier, and the operationally
nasty fact that intermediaries may buffer the stream opaquely), WebSockets (the
upgrade mechanism, infrastructure support requirements, deployment-driven connection
churn, load-balancing stickiness, and **a reference architecture terminating
connections in a dedicated service so the rest of the system stays stateless**), and
WebRTC (signaling, NAT traversal by hole-punching with a relay fallback, and the
observation that the signaling server is itself a real-time system) · a decision
flowchart · **three hop-2 patterns** — polling a database (decoupling producer from
consumer at the cost of real-time, with an easily-missed read-volume derivation),
consistent hashing (deriving a coordination service, with a four-step scaling
orchestration including dual-sending during transition, and the guidance that this
is for connections carrying expensive state), and pub/sub (endpoint servers becoming
interchangeable, with four stated disadvantages including not knowing when
subscribers disconnect) · five interview scenarios · **three deep dives** —
reconnection (zombie connections needing heartbeats, plus per-user queues or sequence
numbers for gap recovery), the celebrity fan-out problem (cache once, distribute
hierarchically), and ordering across servers (with the pragmatic answer that funneling
through a single partition beats logical clocks in product interviews).

**Callouts (≈12):** most questions don't need real-time, but check before committing ·
"quick to explain" is underrated · browser connection limits · proxies silently buffer
streams · every hop must agree on timeouts · candidates over-adopt WebSockets · prefer
severing connections on deploy · least-connections for persistent connections · WebRTC
needs an obvious justification · single partition beats vector clocks in product
interviews · minimizing complexity is a senior signal.

**Numbers (8):** a poll interval · a network latency and the derived worst-case
delivery time · long-poll interval guidance · a timeout mismatch example · stream
connection lifetimes · a client-count-over-interval read derivation · pub/sub added
latency.

**Destination:** `realtime-updates` (primary); `load-balancer`,
`consistent-hashing`, `streams`, `distributed-caches`, `scaling-writes` (secondary).

### pt02 · Dealing with Contention — pp. 39–56 · ~53 claims
**Scope:** the most rigorously structured article in the set: a five-rung escalation
where each rung exists because the previous one has a specific, named limit.

**Topic clusters:** a race condition walked to its business consequence, with the gap
between read and write named as the culprit · **the unifying frame** — the failure is
a lost update, and every fix is a compare-and-set closing that gap · **rung 1
conditional writes** — a predicate evaluated as part of the write, safe under
concurrency because row updates serialize; the failure shape varying with isolation
level; the trap that a zero-row update is not an error, so a follow-up insert must be
made conditional on it · **the guard-the-right-thing lesson** — with more inventory,
a counter guard passes for both racers and two buyers get the same specific item; the
fix is giving each contended item its own row, and the rule that a counter can only
answer whether *some* unit remains while the item row answers whether *this
particular* one does · the
observation that a WHERE clause is how SQL spells compare-and-set, with four
equivalents in other stores · **rung 2 pessimistic locking** — needed when the
decision is application logic rather than a predicate; two failure modes (locking too
much for too long, with slow I/O inside the lock named as the worst offender; and
deadlocks from inconsistent ordering); the real cost being that every transaction
pays for insurance against a rare event · **rung 3 optimistic concurrency** — a value
that changes on every write, retry on zero rows, the same zero-row trap, and three
version sources with **the ABA problem** limiting reuse of business values to
monotonic ones · **rung 4 isolation levels** — write skew, where two transactions
touch no shared row yet break an invariant together, which none of the first three
tools can see; four levels with the fact that the second-strongest does *not* catch
it; the cost of the strongest; the note that this is a relational feature; and the
cheaper alternative of materializing the invariant onto one row · **rung 5
distributed locks** — needed when the hold must outlive a transaction; holding the
lock as *data* with an expiry rather than as a transaction; three homes for the lease
with distinct trade-offs, including the honest admission that an expiry-based lock is
not airtight because a stalled holder can be superseded · a five-row cross-store
equivalence table · **the single-home principle** with two explicitly out-of-scope
exceptions (operations spanning services, and records writable in multiple places) ·
a first-fit decision list and a five-row comparison table · four recognition signals
and six interview scenarios · when not to overcomplicate · **three deep dives** —
deadlock prevention by globally consistent ordering (with the sharp correction that
you sort participants by key rather than locking the initiator first) plus automatic
detection as the backstop; the ABA problem with a dedicated-counter fix and a
whole-row fallback; and hot-resource performance, where sharding, load balancing, and
replicas all fail because the contention is on one row, leaving problem reformulation
or queue-based serialization with a permanent throughput ceiling.

**Callouts (≈13):** the loser's failure shape depends on isolation level · zero
matched rows is not an error (stated twice) · guard the contended thing, not a proxy ·
drop the lock if the logic simplifies · slow I/O inside a lock is the worst offender ·
deadlock errors are retryable · ABA restricts business-value versions · isolation
levels are options, not a ladder · the second-strongest level does not catch write
skew · don't reach for a distributed lock when a row lock will do · a serializing
queue caps throughput permanently.

**Numbers (8):** two inventory counts producing different outcomes · a price · a
version number transition · a concurrency count · two reservation timeouts · a count
round-trip demonstrating ABA · two user identifiers demonstrating ordering.

**Destination:** `contention` (primary); `distributed-locks`, `relational-db`, `cap`,
`multi-step`, `sharding`, `scaling-writes` (secondary).

### pt03 · Multi-step Processes — pp. 57–74 · ~55 claims
**Scope:** a four-solution escalation from a single server to durable execution
engines.

**Topic clusters:** an order-fulfilment workflow whose steps each fail differently,
including one that waits on a human · **the structural diagnosis** — patches
interweave system-level concerns with business-level concerns · **solution 1 single
server** with two problems (crash amnesia, and callback routing landing on a host
that knows nothing about the in-flight operation), whose patches leave you
hand-rolling a state machine, a poller, a locking scheme, and retry logic — and
**the observation that the database remembers progress but does not act on it** ·
**solution 2 the saga** — local steps with compensating actions; why one distributed
transaction cannot work (nobody holds a lock that long, a stalled coordinator stalls
everyone, and external systems don't speak your protocol); what sagas guarantee
instead (undoability, not atomicity); the price being a window of inconsistency; and
the point that compensations need the same retries, idempotency, and human escape
hatch as forward steps · two coordination styles (choreography as emergent, suiting
independent teams and mid-complexity; orchestration as centralized, suiting complex
flows) · **solution 3 event-driven choreography** — storing the event stream rather
than current state, its relationship to event sourcing, compensation flowing backward
through the same mechanism, four benefits, and two honest costs (building substantial
infrastructure, and the fact that an audit trail requires tooling to interpret, which
the industry has rebuilt many times) · the limit: no single place knows the sequence,
so changing it changes contracts across many workers · **solution 4 orchestration** —
durable execution engines described as code, with **two obligations (deterministic
workflow code, idempotent activities) and the explanation that determinism is
required *because recovery works by replay*** — a crash re-executes from the top with
recorded results returned instead of re-firing side effects; a five-step crash
walkthrough; a three-component deployment; **the division of labor that trips people
up** (the workflow worker schedules rather than calls); and signals letting a workflow
wait indefinitely without holding a thread · managed declarative systems with a
visualization benefit and an expressiveness cost, plus **a callout against mocking
the declarative format in front of an interviewer who generates it from code** · six
implementations with their recovery models and hard limits · the position that the
tool choice matters less than knowing its recovery model · when to use, with two
listening cues, and three cases where it's overkill · **five deep dives** — crash
recovery needing durable progress; updating long-running workflows via versioning or
in-place patching that branches deterministically on recorded history; state size
control by passing identifiers and by snapshot-and-restart with an empty history;
external events via signals; and **exactly-once, resolved honestly** — the window
between action and record cannot be closed, only shrunk by recording state on both
sides and parking the ambiguous case for reconciliation, with the precise formulation
that attempts are at-least-once and only the *effect* is exactly-once.

**Callouts (≈11):** patches interweave concerns · the database remembers but doesn't
act · compensations need paranoia and an escape hatch · distributed transactions can't
span systems you don't control · inserting a mid-chain step breaks neighbors ·
audit trails need tooling · determinism is required because recovery is replay ·
don't mock the declarative format · know your tool's recovery model · listen for
"undo step Y" and "all or none" · true exactly-once delivery is impossible across a
network.

**Numbers (7):** a retry configuration and timeout · an execution duration cap and a
payload size limit · a running-workflow count · a wait duration and its extension.

**Destination:** `multi-step` (primary); `queues`, `streams`, `long-running-tasks`,
`distributed-locks`, `contention` (secondary).

### pt04 · Scaling Reads — pp. 75–92 · ~49 claims
**Scope:** a three-step progression plus four unusually deep invalidation dives.

**Topic clusters:** the read/write imbalance quantified with a ratio band, and the
framing that this is a physical limit rather than a software problem · **step 1
optimize within the database** — indexing with a complexity comparison and **a
callout that under-indexing kills more applications than over-indexing**; hardware
upgrades acknowledged as effective but sidestepping the question; denormalization
with an explicit read/write-ratio precondition; materialized views for precomputed
aggregations · **step 2 horizontal** — a throughput threshold that triggers it; read
replicas with the redundancy bonus and the replication-lag caveat; sharding split
into functional and geographic forms, with the honest note that sharding is primarily
a *write* technique and caching usually beats it for reads · **step 3 caching** — the
skewed-access-pattern justification; application-level caching with **five
invalidation strategies** including tagged invalidation and versioned keys; the
combination pattern of short TTLs plus active invalidation; **the principle that a
stated staleness requirement gives you your TTL directly**; CDN caching with a
latency improvement, an origin-load reduction, and the rule that user-specific data
has no hit-rate benefit · four interview scenarios, including one where a specific
value must *not* be cached to avoid overselling · four when-not-to-use cases,
including the observation that caching actively hurts collaborative editing ·
**four deep dives** — growth-driven slowdown with a scan-volume derivation and the
composite-index prefix rule; **millions of reads on one key**, where request
coalescing caps backend load at the number of application servers and key fanout
spreads a single hot key across copies; **simultaneous rebuild**, with three fixes
(lock-based serialization judged fragile, probabilistic early refresh with a rising
refresh probability spreading the herd, and continuous background refresh for the
most critical entries); and **immediate-visibility invalidation**, where the naive
delete has three problems including a re-cache race, and **cache key versioning**
sidesteps the whole class by routing around stale entries rather than deleting them —
with its own three trade-offs and a fallback deleted-items filter for computed data.

**Callouts (≈12):** it's physics, not debugging · under-indexing is the bigger killer ·
hardware sidesteps the question · check the ratio before denormalizing · sharding is
primarily a write technique · don't edge-cache user-specific data · never cache actual
availability · view counts can lag · caching hurts collaborative editing · requirements
set your TTL · coalescing caps load at N · lock-based rebuild is fragile.

**Numbers (17):** reads per feed load · the ratio band · a scan-vs-index comparison ·
a random-I/O multiple · two instance profiles · the horizontal-scaling threshold · TTL
guidance · a staleness-to-TTL mapping · a geographic latency improvement · an
origin-load reduction · a user-count growth with row size and scan volume · a query
planner cost comparison · a hot-key request rate and its fanout division · a
stampede's request-to-capacity mismatch · three refresh probabilities at three
times · a background refresh interval · a version transition.

**Destination:** `scaling-reads` (primary); `caching`, `indexing`,
`distributed-caches`, `cdn`, `relational-db`, `sharding` (secondary).

### pt05 · Scaling Writes — pp. 93–111 · ~47 claims
**Scope:** four strategies, ordered from cheapest to most invasive.

**Topic clusters:** **strategy 1 vertical and database choice** — exhaust hardware
first, with a callout that modern machines are far larger than most candidates
assume, *and* a matching callout that many interviewers will move the goalposts, so
make the case without arguing; then write-optimized stores, with an
append-only-versus-in-place explanation and a throughput comparison, the
write-versus-read tension named explicitly, three other specialized store classes,
and three general write optimizations · **strategy 2 sharding and partitioning** —
a worked slot-based scheme; **choosing the partitioning key**, with a bad key
producing a lopsided distribution and the principle that you are minimizing variance;
the reminder to consider the *read* path so you don't create scatter-gather; and two
questions to ask of your hottest data · vertical partitioning splitting a
multi-purpose table into three tables with different access patterns, each then
placed on differently-optimized storage · **strategy 3 queues and load shedding** —
burst arithmetic showing that absorbing a peak multiple means running at a low
steady-state utilization; **autoscaling explicitly rejected as a panacea** because
scaling takes time and can reduce database throughput exactly when you need it; write
queues with burst absorption as the benefit and **unbounded growth as the failure**,
with the rule that queues are for short-lived bursts rather than for patching a
database that cannot handle steady state; and **load shedding**, defended as a real
tool rather than a cop-out, with a worked case where dropping a stale location update
is free because a fresher one arrives seconds later · **strategy 4 batching and
hierarchical aggregation** — batching at three layers (application, with a
source-of-truth caveat; an intermediate aggregator collapsing many events into one
write; and the database's own flush configuration, flagged as a blunt instrument),
with a staff-level caveat that batching helps nothing if the traffic shape is
already sparse; then hierarchical aggregation resolving an all-to-all fan-in/fan-out
problem by inserting aggregating write processors and dis-aggregating broadcast
nodes · four interview scenarios · two deep dives — resharding without downtime via
dual writes with read preference, and **a hot key too popular for any single shard**,
with two splitting approaches, the constraint that both only work for aggregatable
data, and **the requirement that readers and writers agree on which keys are split**,
resolved in practice by always checking sub-keys.

**Callouts (≈11):** make the vertical case but don't fight the goalposts · explain
*why* a store is write-fast · flat variance is the goal · ask how many shards a
request touches · autoscaling is not a panacea · queues mask steady-state problems ·
load shedding is legitimate · verify batching helps at your traffic shape ·
database-layer batching is the blunt instrument · key splitting only works for
aggregatable data · avoid over-engineering the reader/writer agreement.

**Numbers (12):** a core count and network bandwidth · two store throughputs
compared · a per-server rate multiplied by a server count · two burst multiples and
the derived steady-state utilization · a flush interval · a batching window and its
compression ratio · a viral write rate · a sub-key count and per-key rate · a shard
count doubling · a batching improvement band.

**Destination:** `scaling-writes` (primary); `sharding`, `queues`, `streams`,
`nosql-db`, `consistent-hashing`, `contention` (secondary).

### pt06 · Handling Large Blobs — pp. 112–123 · ~42 claims
**Scope:** direct client-to-storage transfer, and the distributed state problem it
creates.

**Topic clusters:** why large objects don't belong in a database (query performance,
backup times, replication), with a durability figure and a size rule of thumb · **the
transfer problem storage alone doesn't solve** — routing bytes through application
servers makes them dumb pipes adding only latency and cost; and the honest admission
that going direct is not sufficient on its own, because you then lose resumability,
progress visibility, and state agreement between your database and storage · the
access-control reframing, with the server validating and issuing credentials rather
than moving data · **presigned uploads** — permission scoped to one object at one
location for a bounded time; generation happening entirely in memory with no call to
storage; the signature as a keyed hash the storage service can independently
recompute; and **the requirement to encode size and type restrictions into the
signature**, since anyone holding the URL can use it · signed downloads, with **the
distinction that storage signatures are validated by the storage service using your
credentials while CDN signatures are validated at the edge using public-key
cryptography with no callback** · **resumable uploads** — a transfer-time derivation
making the failure cost concrete, chunked APIs across three providers with differing
URL structures, resumption by querying which parts landed, progress tracking falling
out for free, a required completion call without which parts exist but no file does,
and the fact that incomplete uploads cost money and need lifecycle cleanup ·
**state synchronization** — a metadata table with a status column; four problems with
trusting the client's completion report (race, orphans, malice, lost notification);
storage event notifications carrying the object key that links back to your row; and
**reconciliation as a required safety net because events themselves can fail** · a
five-row cross-provider terminology table · four interview scenarios and four
when-not-to-use cases (small files, synchronous validation, compliance inspection,
and interactive experiences needing immediate content-derived feedback) · **four deep
dives** — resumption mechanics with session-identifier persistence surviving app
restarts; **abuse prevention by quarantine-then-publish**, which is more robust than
real-time detection and whose processing delay itself throttles automation; metadata
handling, where the database row is created at URL-generation time so a reference
exists before the file does, object tags are rejected as a metadata home, the storage
key is the join point, and clients must never choose keys; and download speed via
CDN, range requests for resumability, and parallel chunk downloads judged rarely
worth the complexity.

**Callouts (≈10):** servers as dumb pipes add only latency and cost · generation needs
no network call · bake restrictions into the signature · who validates differs between
storage and CDN · incomplete uploads cost money · never trust the client's completion
report · events need reconciliation behind them · never let clients pick keys ·
quarantine beats real-time detection · range requests matter more than parallelism.

**Numbers (14):** a durability figure · a size threshold · two file sizes · URL expiry
range · minimum part sizes across three providers · a transfer-time derivation · a
partial-completion example · lifecycle cleanup windows · tag count and length limits ·
two latency figures · a byte-range example · a parallel-download speedup.

**Destination:** `large-blobs` (primary); `blob-storage`, `cdn`, `api-gateway`,
`long-running-tasks`, `streams` (secondary).

### pt07 · Managing Long Running Tasks — pp. 124–137 · ~44 claims
**Scope:** the accept-then-process split, with six deep dives that are effectively a
queue-operations curriculum.

**Topic clusters:** a synchronous operation whose duration exceeds standard
infrastructure timeouts, plus the second-order problem that **users who see no
feedback retry, creating duplicate work that worsens the situation** · the split into
acceptance and processing, with the queue as a durable buffer providing visibility
into depth, duration, and failures · **the resource-mismatch argument** — web servers
shouldn't be sized for the heaviest job, so each tier scales on its own needs · the
user-experience improvement of immediate acknowledgement plus later notification ·
**four gains and four losses stated symmetrically**, plus three new failure modes
(queue saturation, poison messages, and deciding when to stop retrying) · four queue
options with their distinguishing trade-offs, including one that is memory-first
despite persistence options, one with a message-size limit that forces
store-elsewhere-pass-the-id, one with real operational burden, and one recommended as
the interview default · three worker run models with explicit constraints (execution
duration limits, cold starts, minimal local storage) · **an eight-step end-to-end
flow** with the detail that the queue carries the job identifier rather than the job
data, and the property that **each component can fail independently without breaking
the system** · four recognition signals, including **a worked arithmetic where
processing time per second exceeds one second**, which is the cleanest
does-this-need-async test in the whole source set · five interview scenarios ·
**six deep dives** — worker crash detection by heartbeat, with the interval as a
design decision that fails in both directions (delayed recovery when too long,
false-positive failures during pauses when too short) and three per-system names for
the same setting; repeated failures resolved by a dead-letter queue after a bounded
retry count, with the poison-message-takes-down-the-fleet motivation and the guidance
that DLQ growth signals a bug; duplicate work resolved by idempotency keys, with the
detail that user-initiated keys should round the timestamp to the deduplication
window, plus a requirement that the work itself be idempotent; backpressure by
rejecting at a depth limit and autoscaling on **queue depth rather than CPU, because
by the time CPU is high the queue is already backed up**; mixed workloads causing
head-of-line blocking, resolved by duration-tiered queues with a promotion rule for
jobs that overrun; and job dependencies, handled by context-carrying chained jobs for
simple cases and an orchestrator for branching ones · a closing decision flowchart
with a duration threshold and five escalating conditions.

**Callouts (≈11):** retrying users create duplicate work · one option is memory-first ·
queue the identifier, not the data · every component can fail independently · don't
debate queue technologies · a short heartbeat marks live jobs dead during pauses ·
poison messages threaten the whole fleet · monitor DLQ growth · round idempotency
timestamps to the window · autoscale on depth, not CPU · separate fast and slow queues.

**Numbers (13):** a fast-path latency · a slow operation's duration · the
infrastructure timeout band · a message size limit · serverless execution limits · a
worker process count · a spiky-workload illustration · heartbeat guidance · a DLQ
retry threshold · a volume-times-duration derivation · a burst multiple · two queue
tier profiles · the synchronous/async duration threshold.

**Destination:** `long-running-tasks` (primary); `queues`, `multi-step`,
`large-blobs`, `scaling-writes` (secondary).

---

### A.4 Inventory totals

| Collection | Articles | Pages | Claims | Callouts | Distinct numbers |
|---|---:|---:|---:|---:|---:|
| Core Concepts | 9 | 135 | ~365 | ~78 | ~76 |
| Key Technologies | 9 | 164 | ~435 | ~89 | ~85 |
| Patterns | 7 | 137 | ~348 | ~80 | ~79 |
| **Total** | **25** | **436** | **~1,148** | **~247** | **~240** |

Numbers are de-duplicated within an article but not across articles; several
quantities (round-trip latencies, relational write throughput, in-memory operation
rates) recur in three or four articles and resolve to a single `numbers.ts` entry.
See §B.4.

---

# B. Master topic → destination map

## B.0 How to read this section

Every item in §A resolves to exactly one of:

| Destination kind | Notation | Means |
|---|---|---|
| Page block | `§briefing-id ▸ block` | Teaching prose + viz on that briefing |
| Neighbor page | `→ briefing-id` | Belongs to a different briefing, reached by an edge (§C) |
| Glossary | `glossary:key` | A `<Term>` with the full contract |
| Say-it card | `sayit:section` | Compressed for the RETRIEVE register |
| Number | `numbers:id` | A displayed quantity with a derivation |
| Waiver | `WAIVE` | Explicitly out, with a one-line reason (§B.6) |

**Coverage is site-level, not page-level** (content-pipeline §7). A topic assigned to
a neighbor is covered as long as the edge exists in §C.

## B.1 Fixed assignments — spec 069 Appendix A

Restated, not re-decided. Spec 069 owns the Networking Essentials article (cc01) and
its Appendix A already places every topic in it. The commitments that bind *future*
specs are the neighbor assignments, reproduced here as the contract this map must
honor:

| Source topic (cc01) | Committed destination |
|---|---|
| HTTP anatomy, methods, status codes, headers, content negotiation, HTTPS note, never-trust-the-request-body | `api-design` |
| REST resource modeling incl. the operations-vs-resources example | `api-design` |
| GraphQL (under/over-fetching, interview murkiness) — flagged must-add, covered nowhere today | `api-design` |
| gRPC service definitions, streaming, deadlines, client-side balancing | `api-design` |
| SSE mechanics; WebSocket upgrade and infrastructure caveat; WebRTC signaling, STUN/TURN/NAT, setup sequence, video-calling guidance | `realtime-updates` |
| Client-side load balancing (cluster gossip, DNS rotation with TTL, built-in RPC balancing, decision flowchart); dedicated L4 vs L7; health checks; balancing algorithms; hardware/software/cloud examples | `load-balancer` |
| Vertical vs horizontal scaling | `scaling-reads` / `scaling-writes` |
| CDN edge caching | `cdn` |
| Regionalization, availability zones, regional partitioning | `proximity` + `cdn` |
| Timeouts, retries with backoff and jitter, thundering herd, idempotency keys, circuit breakers, cascading failures | a reliability walkthrough spec (not yet written) |
| DHCP/address-allocation trivia · packet-capture homework · source's own upsells | `WAIVE` |

**Additions this map contributes `[+]`,** none conflicting: the hardware-interconnect
aside → `WAIVE`; the conflict-free-replicated-data-type aside → `realtime-updates`;
the network-is-unreliable fallacy → the reliability spec; data locality → `cdn`;
health-check protocol specifics → `load-balancer`.

**Consequence for §D:** the reliability spec named in Appendix A does not exist yet
and is now load-bearing for a whole family of cc01 topics *plus* material from pt03,
pt07, and kt03. §D.1 schedules it.

## B.2 Destination map by briefing

Each table lists what lands on that briefing, the source it comes from, and the
register it serves. `[+]` marks an assignment this map adds beyond spec 069's
Appendix A.

### Concepts shelf

#### `networking` — owned by spec 069
No new assignments. See §B.1.

#### `api-design`
| Item | Source | Register |
|---|---|---|
| Protocol selection: REST default, GraphQL trigger, RPC trigger, with a selection flowchart | cc02, cc01 | UNDERSTAND — block 1 viz |
| Resource modeling: things not actions, nesting vs query params, the required/optional rule | cc02, cc01 | UNDERSTAND |
| HTTP methods with per-verb idempotency, incl. the PATCH-depends-on-implementation subtlety | cc02, cc01 | UNDERSTAND + `glossary:idempotent` |
| The three input channels and their distinct roles | cc02 | GROUND — the pokeable request-builder viz |
| Status codes: 4xx vs 5xx as the load-bearing distinction | cc02, cc01 | RETRIEVE — say-it |
| GraphQL: over/under-fetching, schema, **N+1 and dataloader batching**, field-level auth | cc02, cc01 | UNDERSTAND — block 2 |
| RPC: binary encoding, generated cross-language contracts, streaming | cc02, cc01 | UNDERSTAND + `numbers:protobuf-vs-json-size` |
| Content negotiation as extensible-interface design | cc01 | GROUND |
| Never trust the request body; the identifier-in-body attack | cc01 | UNDERSTAND + say-it trap |
| Pagination: offset drift vs cursor stability, and the lost jump-to-page | cc02, kt02 | UNDERSTAND — block 3 |
| Versioning: URL vs header | cc02 | GROUND |
| Auth: authN vs authZ, API keys vs tokens and where each is wrong, RBAC | cc02 | UNDERSTAND |
| Rate limiting tiers → deeper mechanics live next door | cc02 | → `api-gateway` |
| Optimistic concurrency over the wire (conditional-request headers) | pt02, kt02 | → `contention` edge |
| The "5 minutes, then move on" budget | cc02 | RETRIEVE — say-it framing |

#### `data-modeling`
| Item | Source | Register |
|---|---|---|
| Where modeling appears twice in a design conversation | cc03 | GROUND |
| Five database models, each with when-to-consider **and** data-modeling impact | cc03 | UNDERSTAND — block 1, the model-picker viz |
| Relational: joins, the multi-table join trap, the exaggerated scalability knock | cc03, kt07 | UNDERSTAND |
| Document: embedding, whole-document update cost, and the "interviews rarely have evolving schemas" caveat | cc03 | GROUND |
| Key-value used *with* SQL, not instead of | cc03 | GROUND — the correction is the teaching moment |
| Wide-column: partition-contiguous writes, time as a first-class dimension | cc03, kt05 | UNDERSTAND |
| Graph: almost never right, and large social graphs are relational | cc03 | UNDERSTAND — a taste-test-shaped claim |
| The three schema drivers, with access patterns dominant and derived from your API | cc03 | UNDERSTAND — block 2 |
| Keys, cardinalities, foreign keys and their per-write cost, constraints | cc03, kt07 | UNDERSTAND |
| Normalization vs denormalization with the three exceptions | cc03, pt04 | UNDERSTAND — block 3 viz |
| Cache-as-denormalized-view keeping the source of truth clean | cc03 | GROUND → `caching` |
| Query-driven modeling as the wide-column counterpart | kt05 | → `nosql-db` |
| The closing six-step checklist | cc03 | RETRIEVE — say-it deck spine |

#### `indexing`
| Item | Source | Register |
|---|---|---|
| Heap files, page-at-a-time loading, why a scan is slow | cc08 | UNDERSTAND — block 1 |
| Random vs sequential access still differing on solid-state storage | cc08 | GROUND — corrects a common belief |
| Index costs: space near data size, one write amplification per index | cc08, kt07 | UNDERSTAND + `numbers` |
| Two cases where indexes lose (write-heavy/read-rare, and tiny tables) | cc08 | GROUND |
| B-trees: structure rules, page-sized nodes, shallow lookups, five reasons they default | cc08 | UNDERSTAND — block 2 viz |
| **LSM trees**: whole-table storage format, four-stage write path, read penalty, three mitigations | cc08, kt05, kt06 | UNDERSTAND — block 3, the deepest block |
| Compaction strategy trade-off (write amplification vs file count) | cc08 | GROUND |
| Hash indexes: exact-match only, rare in practice | cc08 | GROUND |
| Geospatial: why two 1-D indexes fail; geohash, quadtree, R-tree | cc08 | → `proximity` (summary block stays here) |
| Inverted indexes: the flipped mapping and the analysis pipeline | cc08, kt02 | → `search-db` (summary block stays here) |
| Composite indexes: one traversal for filter+sort, the prefix rule, three canonical shapes | cc08, pt04, kt07 | UNDERSTAND — block 4 |
| Covering indexes and the modern "niche optimization" assessment | cc08, kt07 | GROUND |
| Specialized index types in a relational engine (inverted-text, spatial, partial) | kt07 | → `relational-db` |
| The closing index-selection flowchart | cc08 | RETRIEVE — say-it |

#### `caching`
| Item | Source | Register |
|---|---|---|
| The memory-vs-disk latency argument with its ratio | cc04 | UNDERSTAND — block 1 + `numbers` |
| Four places to cache, with in-process coherence explicitly unresolved | cc04 | UNDERSTAND — block 2 viz |
| Four architectures, with cache-aside as the default and read-through as what a CDN is | cc04 | UNDERSTAND — block 3 |
| Write-through's dual-write problem surviving the pattern | cc04 | GROUND |
| Four eviction policies, and TTL as expiry rather than eviction | cc04, kt01 | UNDERSTAND |
| Approximate rather than exact recency in a real implementation | kt01 | GROUND |
| Stampede, with coalescing as most effective and warming only helping TTL expiry | cc04, pt04 | UNDERSTAND — block 4 |
| Cache consistency: the read-cache/write-DB window | cc04, pt04 | UNDERSTAND |
| Hot keys → remediation depth next door | cc04, kt01 | → `distributed-caches` |
| Five invalidation strategies incl. tagged and versioned keys | pt04 | → `scaling-reads` |
| **Staleness requirement → TTL directly** | pt04 | GROUND — the single best decision rule here |
| The five-step interview walkthrough and four quantified triggers | cc04 | RETRIEVE — say-it deck |

#### `sharding`
| Item | Source | Register |
|---|---|---|
| The vertical ceiling that forces the decision | cc05, cc09 | UNDERSTAND — block 1 + `numbers` |
| Partitioning vs sharding, and that engineers use the terms loosely | cc05 | GROUND |
| Horizontal vs vertical partitioning | cc05, pt05 | UNDERSTAND |
| A shard as a standalone database with its own resources | cc05 | GROUND |
| Three properties of a good key, with worked good and bad examples | cc05, pt05 | UNDERSTAND — block 2 viz |
| Three strategies: range, hash (the assumed default), directory (and why it derails) | cc05 | UNDERSTAND — block 3 |
| The resharding catastrophe when the modulus changes | cc05 | → `consistent-hashing` |
| Hot spots: celebrity keys, time-based write skew, detection, three remediations | cc05, kt01, pt05 | UNDERSTAND — block 4 |
| Automatic vs operator-driven shard splitting | cc05 | GROUND |
| Cross-shard operations and three mitigations | cc05 | UNDERSTAND |
| Cross-shard consistency: 2PC's fragility, design-to-avoid, sagas | cc05 | → `multi-step` |
| How the major managed stores actually differ in mechanism | cc05, kt05, kt06 | → `nosql-db` |
| Three capacity triggers and the four-step interview script | cc05, cc09 | RETRIEVE — say-it |
| Premature sharding as the single most common mistake | cc05, cc09 | GROUND — the post-mortem-shaped claim |

#### `consistent-hashing`
| Item | Source | Register |
|---|---|---|
| Modulo hashing and its two symmetric failures | cc06, kt05 | UNDERSTAND — block 1 |
| The ring, clockwise walk, and the real key space vs the teaching one | cc06 | UNDERSTAND — block 2 viz |
| What actually moves on join and leave, quantified | cc06 | GROUND + `numbers` |
| Virtual nodes for even load **and** for heterogeneous hardware shares | cc06, kt05 | UNDERSTAND — block 3 |
| **Virtual nodes fix structural imbalance; replication and salting fix workload imbalance** | cc06 | UNDERSTAND — the thesis |
| Hot spots and three remediations | cc06 | UNDERSTAND |
| Consistent hashing says where data belongs but doesn't move it | cc06 | GROUND — corrects the usual mental model |
| Replica-set placement skipping same-machine nodes | kt05 | GROUND |
| A fixed-slot alternative and why it's a real trade-off | cc06, kt01 | UNDERSTAND — block 4 |
| Applications beyond databases: caches, brokers, connection routing | cc06, pt01 | → `distributed-caches`, `realtime-updates` |
| The term being used loosely for slot-based variants | cc06 | GROUND |

#### `cap`
| Item | Source | Register |
|---|---|---|
| The three properties, defined precisely | cc07 | UNDERSTAND — block 1 |
| **CAP-consistency is not ACID-consistency** | cc07, kt07 | GROUND — the highest-value correction here |
| The reduction: partition tolerance is mandatory, so it's one choice under partition | cc07 | UNDERSTAND — block 2 viz |
| Three consistency-wins and three availability-wins cases | cc07 | GROUND |
| The decision question | cc07 | RETRIEVE — say-it |
| Placement in the non-functional requirements step | cc07 | GROUND |
| What each choice implies architecturally, with technology examples | cc07 | UNDERSTAND — block 3 |
| **Per-feature CAP** with two worked mixed systems | cc07 | UNDERSTAND — block 4 |
| The four-level consistency spectrum with a canonical use each | cc07 | UNDERSTAND + `glossary` |
| Tunable per-operation consistency levels and the quorum-overlap argument | kt05 | → `nosql-db` |
| Per-request consistency choice with its cost multiple | kt06 | → `nosql-db` |
| Availability-skewed defaults with strong reads as an opt-in | kt05, kt06 | → `nosql-db` |

### Technologies shelf

#### `relational-db`
| Item | Source | Register |
|---|---|---|
| The two named failure modes when discussing this in an interview | kt07 | GROUND |
| The mixed-requirements motivating example | kt07 | UNDERSTAND — block 1 |
| Specialized indexes replacing whole systems: text search, document columns, spatial | kt07 | UNDERSTAND — block 2, the differentiating block |
| What still justifies a dedicated search engine (five items) | kt07 | → `search-db` |
| Covering and partial indexes | kt07, cc08 | → `indexing` |
| Practical read limits: four query-class bands, four scale thresholds | kt07, cc09 | GROUND + `numbers` |
| **The four-step write path and why commit latency is gated by log flush** | kt07 | UNDERSTAND — block 3 viz |
| Four write-throughput bands and five limiting factors | kt07, cc09 | UNDERSTAND + `numbers` |
| **Process-per-connection and why a pooler is required** | kt07 | GROUND + `glossary:connpool` |
| Five write optimizations in escalating order | kt07, pt05 | → `scaling-writes` |
| Time-based table partitioning with hot/cold storage tiers | kt07 | UNDERSTAND |
| Replication: async default vs sync, hybrid arrangements, four-step failover | kt07, pt04 | UNDERSTAND — block 4 |
| Read-your-writes lag | kt07, pt04 | GROUND + `glossary:readyourwrites` |
| **The auction race**: check-then-insert leaving an invalid record | kt07, pt02 | → `contention` (the canonical worked example) |
| Three isolation levels, with the middle one stronger than the standard | kt07, pt02 | UNDERSTAND |
| Stronger isolation vs row locking, compared across eight dimensions | kt07, pt02 | → `contention` |
| Manual optimistic concurrency with a version column | kt07, pt02 | → `contention` |
| Five reasons it's the default; three genuine reasons to leave; and that scale alone isn't one | kt07 | UNDERSTAND — block 5 + say-it |
| ACID walked through a transfer, with the anomaly matrix | kt07 | UNDERSTAND + `glossary:acid` |

#### `nosql-db`
| Item | Source | Register |
|---|---|---|
| Wide-column flexibility: columns varying per row | kt05 | UNDERSTAND — block 1 |
| Per-column write timestamps and last-write-wins | kt05 | GROUND |
| **Partition key + clustering key**, shared across both major stores | kt05, kt06 | UNDERSTAND — block 2 viz |
| Item/attribute model, size ceiling, schema-less validation moving to the app | kt06 | UNDERSTAND |
| Monotonic identifiers over timestamps, with the version recommendation | kt06 | GROUND + say-it |
| Ring-based distribution vs a centralized placement service | kt05, kt06 | UNDERSTAND — block 3 |
| Replication strategies, rack and datacenter awareness | kt05 | UNDERSTAND |
| **Tunable consistency levels and the quorum-overlap argument** | kt05 | UNDERSTAND — block 4 |
| Per-request consistency choice and its cost multiple | kt06 | UNDERSTAND — block 4 |
| No ACID beyond row-level atomicity in a partition | kt05 | GROUND |
| Transactions with serializable isolation over a bounded item set | kt06 | GROUND — the obsolete-criticism correction |
| Two secondary index types compared across eight dimensions | kt06 | UNDERSTAND — block 5 |
| The projection caveat: bandwidth saved, read cost not | kt06 | GROUND |
| Scan vs query | kt06 | GROUND |
| Gossip, vector clocks, seed nodes as deliberate choke points | kt05 | → `distributed-locks` (coordination edge) |
| Failure detection never declaring a node down without an operator; hinted handoff | kt05 | UNDERSTAND |
| Storage-engine internals (log-structured merge) | kt05, kt06 | → `indexing` |
| **Query-driven modeling** with the two extended worked examples | kt05 | UNDERSTAND — block 6, the payoff block |
| Partition *size* as a first-class design concern | kt05 | GROUND |
| Capacity units, per-partition ceilings, and the cost derivation | kt06 | UNDERSTAND + `numbers` |
| Purpose-built caching layer with its three caveats | kt06 | → `distributed-caches` |
| Change data capture with three downstream uses | kt06 | → `streams` |
| When to use each, and four limitations | kt05, kt06 | RETRIEVE — say-it |

#### `blob-storage`
*No source article. Assembled from pt06 plus fragments.*

| Item | Source | Register |
|---|---|---|
| Why large objects don't belong in a database (query, backup, replication) | pt06 | UNDERSTAND — block 1 |
| The durability figure and the size rule of thumb | pt06 | GROUND + `numbers` |
| Object-store economics: unlimited capacity, per-object pricing | pt06 | GROUND |
| Metadata in the database, bytes in the store — and the join key between them | pt06 | UNDERSTAND — block 2 |
| Storage keys: consistent patterns, collision avoidance, clients never choosing them | pt06 | UNDERSTAND |
| Object tags rejected as a metadata home, with the reason | pt06 | GROUND |
| Lifecycle rules and the cost of incomplete uploads | pt06 | GROUND |
| Event notifications as the completion signal | pt06 | → `large-blobs` |
| Presigned access, resumable transfer, range requests | pt06 | → `large-blobs` |
| Storing pointers rather than payloads in a message log | kt03 | → `queues` |

#### `search-db`
| Item | Source | Register |
|---|---|---|
| When a general-purpose index suffices and what pushes you past it | kt02, kt07 | UNDERSTAND — block 1 |
| Documents, indices, mappings, fields — with "index" flagged as overloaded | kt02 | UNDERSTAND |
| Keyword vs text as hash-lookup vs inverted-index | kt02 | GROUND |
| Mapping bloat costing memory | kt02 | GROUND |
| Nesting vs separate index as the normalization trade-off | kt02 | → `data-modeling` |
| **Inverted index derived from first principles** (reorganize, or copy and reorganize) | kt02, cc08 | UNDERSTAND — block 2 viz |
| The analysis pipeline: tokenize, normalize, remove stop words, stem | kt02, cc08 | UNDERSTAND |
| Relevance scoring as the default sort | kt02 | GROUND |
| **Doc values** as a columnar per-field structure, linked to analytics engines | kt02 | UNDERSTAND — block 3 |
| **Segment immutability**: merges, tombstones, soft-delete-plus-insert | kt02 | UNDERSTAND — block 4 |
| **Updates costing more than inserts**, and the poor fit for changing data | kt02 | GROUND — the load-bearing limitation |
| Six named benefits of immutability | kt02 | GROUND |
| Shard/replica/segment nesting; replicas multiplying throughput | kt02 | UNDERSTAND |
| Five node types, role composition, hot/warm/cold tiers | kt02 | GROUND |
| Two-phase query/fetch and the ideal of never touching source documents | kt02 | UNDERSTAND |
| **Query planning** with the order-of-execution example and statistics | kt02 | UNDERSTAND — block 5 |
| Three pagination models with the deep-pagination cliff | kt02, cc02 | → `api-design` (mechanism stays here) |
| Optimistic concurrency via a version field | kt02 | → `contention` |
| Geospatial field types and their index structures | kt02 | → `proximity` |
| Fed by change data capture; not a system of record; six cautions | kt02, kt06 | UNDERSTAND — block 6 + say-it |
| Built-in text search in a relational engine as the cheaper first move | kt07 | → `relational-db` |

#### `api-gateway`
| Item | Source | Register |
|---|---|---|
| Single entry point; the parallel with service decomposition | kt04 | UNDERSTAND — block 1 |
| **Routing is the reason it exists** — the middleware-without-routing callout | kt04 | UNDERSTAND — the thesis |
| The six-step request trace | kt04 | UNDERSTAND — block 2 viz |
| Request validation rejecting doomed requests early | kt04 | GROUND |
| The middleware menu, with the three that matter | kt04 | UNDERSTAND |
| Routing tables keyed on path, method, query, headers | kt04 | UNDERSTAND |
| Protocol translation, noted as uncommon | kt04 | GROUND |
| Response transformation with the external/internal protocol split | kt04, cc02 | UNDERSTAND — block 3 |
| Caching limited to non-user-specific data, three strategies | kt04, pt04 | GROUND |
| **Client-to-gateway vs gateway-to-service load balancing** | kt04 | → `load-balancer` |
| Statelessness enabling horizontal scaling | kt04 | GROUND |
| Global distribution: regional deployment, geographic routing, config sync | kt04 | → `cdn`, `proximity` |
| Rate limiting mechanics: fixed and sliding window implementations | kt01, cc02 | UNDERSTAND — block 4 |
| When it's overkill | kt04 | RETRIEVE — say-it |

#### `load-balancer`
*No source article. Assembled from cc01 (per Appendix A), kt04, pt01, kt09.*

| Item | Source | Register |
|---|---|---|
| Client-side balancing: registries, cluster gossip, redirect-on-miss | cc01 | UNDERSTAND — block 1 |
| DNS rotation with TTL as coarse client-side balancing | cc01 | UNDERSTAND |
| Two balancers behind rotation removing the single point of failure | cc01 | GROUND |
| The client-side decision flowchart | cc01 | UNDERSTAND |
| Dedicated balancers and the extra-hop trade-off | cc01 | UNDERSTAND — block 2 |
| **L4 vs L7**: what each can see, and therefore what each can decide | cc01, pt01 | UNDERSTAND — block 3 viz |
| Connection-oriented protocols favoring L4 | cc01, pt01 | GROUND |
| Health checks at two layers `[+]` | cc01 | UNDERSTAND |
| Five balancing algorithms, with least-connections for persistent connections | cc01 | UNDERSTAND — block 4 |
| Hardware/software/cloud implementations and their throughput range | cc01 | GROUND + `numbers` |
| Client-to-gateway vs gateway-to-service distinction | kt04 | UNDERSTAND |
| Coordination-service-driven routing for connection affinity | kt09, pt01 | → `realtime-updates` |
| Balancer timeouts vs long-held request timeouts | pt01 | GROUND — a shared-failure callout |

#### `queues`
| Item | Source | Register |
|---|---|---|
| Brokers, partitions as append-only logs, topics as logical groupings | kt03 | UNDERSTAND — block 1 |
| **Partitions derived from an ordering requirement** (the scaling narrative) | kt03 | UNDERSTAND — the pedagogical spine |
| Consumer groups derived from consumer overload | kt03 | UNDERSTAND — block 2 viz |
| Topics organize; partitions scale | kt03 | GROUND |
| Message structure; the key determining partition | kt03 | UNDERSTAND |
| Ordering within a partition by offset, not timestamp | kt03 | GROUND |
| Offsets, commits, and **at-least-once by default** | kt03 | UNDERSTAND — block 3 + `glossary:atleastonce` |
| Exactly-once requiring specific configuration | kt03, kt08, pt03 | → `multi-step` |
| Pull-based consumption and its four advantages | kt03 | GROUND |
| Acknowledgment settings and replication factor | kt03 | UNDERSTAND |
| Highly available, sometimes consistent | kt03 | GROUND + say-it |
| Consumer failure as the realistic failure; rebalancing | kt03 | UNDERSTAND — block 4 |
| **Commit only after durable work; keep consumer work small** | kt03 | UNDERSTAND — the operational thesis |
| No built-in consumer retry or dead-letter support here, where another queue has it | kt03, pt07 | GROUND |
| Retry topics and dead-letter queues | kt03, pt07 | → `long-running-tasks` |
| Four queue options compared, incl. one memory-first and one size-limited | pt07, kt01 | UNDERSTAND — block 5 |
| Message size guidance and the blob anti-pattern with the pointer fix | kt03, pt06 | GROUND + `numbers` |
| Per-broker capacity; under-partitioning wasting new brokers | kt03, cc09 | GROUND + `numbers` |
| Hot partitions and four strategies | kt03, pt05 | → `scaling-writes` |
| Retention windows | kt03 | GROUND |
| Consumer-group work distribution with idle-time reclaim | kt01 | UNDERSTAND |
| Queue depth as the autoscaling signal | pt07 | → `long-running-tasks` |

#### `streams`
| Item | Source | Register |
|---|---|---|
| Queue mode vs stream mode as a consumption-pattern difference | kt03 | UNDERSTAND — block 1 |
| Retained, replayable logs with independent consumer groups | kt03 | UNDERSTAND |
| **Do you even need streaming?** — the batch-first question | kt08 | UNDERSTAND — the opening thesis |
| The dataflow graph vocabulary | kt08 | UNDERSTAND — block 2 viz |
| Streams as unbounded and explicitly *not* durable logs | kt08 | GROUND |
| Seven operators; record-at-a-time vs batch | kt08 | UNDERSTAND |
| **State** and the three problems it creates | kt08 | UNDERSTAND — block 3 |
| Five state types; three state backends with the memory/disk trade-off | kt08 | GROUND |
| **Watermarks**: four causes of lateness, the flowing-timestamp mechanism | kt08 | UNDERSTAND — block 4 viz |
| Bounded lateness paired with offline correction | kt08 | GROUND |
| **Four window types and the emission arithmetic making choice a cost decision** | kt08 | UNDERSTAND — block 5 |
| Checkpoint barriers and the seven-step recovery, incl. the whole-job pause | kt08 | UNDERSTAND — block 6 |
| Source rewind requiring upstream retention | kt08 | GROUND |
| **Exactly-once covers internal state, not external side effects** | kt08, pt03 | GROUND — the load-bearing caveat |
| Task slots as the unit of resource scheduling and parallelism | kt08 | GROUND |
| Leader-based coordination riding on an external service | kt08 | → `distributed-locks` |
| Event sourcing: log as source of truth vs log as coordination | pt03, kt01 | UNDERSTAND — block 7 |
| Change data capture keeping a search index in sync | kt06, kt02 | → `search-db` |
| Five interview cautions; five transferable lessons | kt08 | RETRIEVE — say-it |

#### `distributed-locks`
| Item | Source | Register |
|---|---|---|
| **The escalating coordination narrative** (single server → discovery → SPOF → staleness → quadratic broadcast → partition disagreement) | kt09 | UNDERSTAND — block 1, the best on-ramp in the source |
| Five named coordination challenges | kt09 | UNDERSTAND |
| The synchronized-metadata-filesystem model | kt09 | GROUND |
| Three node flavors, with session-scoped nodes giving crash cleanup | kt09 | UNDERSTAND — block 2 viz |
| Registering servers and hashing users onto them, not a node per user | kt09 | GROUND |
| Ensembles, odd sizing, quorum survival | kt09 | UNDERSTAND + `numbers` |
| **Watches, and the local-cache-updated-by-notification pattern** | kt09 | UNDERSTAND — block 3 |
| Coordination service, not a database | kt09 | GROUND — the thesis |
| Leader election by lowest sequential node with successor watching | kt09 | UNDERSTAND — block 4 |
| Distributed locks by the same mechanism; unsuitable for high-frequency locking | kt09 | UNDERSTAND |
| **When to prefer this lock over a cache-based one** (correctness, long holds) | kt09, kt01, pt02 | UNDERSTAND — block 5 |
| Cache-based lock: acquire idiom, token-checked release, and its failure mode | kt01, pt02 | UNDERSTAND — block 5 |
| Majority-node algorithms, their controversy, and fencing tokens | kt01 | UNDERSTAND |
| **A cache lock is an efficiency tool, not a correctness guarantee** | kt01 | GROUND — the highest-value claim here |
| Consensus in two phases; the leader-election inversion | kt09 | UNDERSTAND — block 6 |
| Five consistency guarantees; stale follower reads unless synchronized | kt09 | GROUND |
| Sessions, heartbeats, expiration, and two-directional timeout tuning | kt09 | UNDERSTAND |
| Write-ahead log plus snapshots; ordered operations making swapping catastrophic | kt09 | GROUND |
| Partitions halting writes to prevent split-brain | kt09 | UNDERSTAND + `glossary` |
| Three limitations; the industry move toward built-in consensus | kt09 | GROUND + say-it |
| Configuration management and service discovery as sibling capabilities | kt09 | → `load-balancer` |
| Consensus-backed replication under a managed store | kt06 | → `nosql-db` |

#### `distributed-caches`
| Item | Source | Register |
|---|---|---|
| Single-threaded execution and why it's deliberate | kt01 | UNDERSTAND — block 1 |
| **The durability trade-off**: two persistence modes, each with a loss window | kt01 | UNDERSTAND — block 2 |
| **Asynchronous replication meaning acknowledged writes can vanish** | kt01 | UNDERSTAND — the thesis, stated twice in source |
| Fixed hash slots, client-cached slot maps, redirect-on-wrong-node, gossip | kt01 | UNDERSTAND — block 3 viz |
| Nodes not forwarding requests | kt01 | GROUND |
| Hash tags for co-locating keys | kt01 | UNDERSTAND |
| Throughput and latency figures; the N+1 pattern being survivable here | kt01 | GROUND + `numbers` |
| TTL as staleness control distinct from memory pressure | kt01, cc04 | UNDERSTAND — block 4 |
| Eviction requiring explicit configuration; approximate recency | kt01 | GROUND |
| **Hot keys and three remediations, each with its catch** | kt01, cc04, pt04 | UNDERSTAND — block 5 |
| **Replicas doing nothing for a write-hot key** | kt01 | GROUND — the sharpest correction |
| Request coalescing capping backend load at the server count | pt04 | UNDERSTAND |
| Key fanout spreading one hot key across copies | pt04, pt05 | UNDERSTAND |
| Four boundaries on when not to use it at all | kt01 | RETRIEVE — say-it |
| A purpose-built managed cache and its three caveats | kt06 | GROUND |
| Consistent hashing as the placement mechanism | cc06 | → `consistent-hashing` |
| Pub/sub for fan-out, and the per-node connection model | kt01, pt01 | → `realtime-updates` |

#### `cdn`
*No source article. Assembled from cc01 (per Appendix A), cc04, pt04, pt06, kt04.*

| Item | Source | Register |
|---|---|---|
| Edge locations and the request path on hit and miss | cc01, cc04 | UNDERSTAND — block 1 viz |
| A CDN as a read-through cache | cc04 | GROUND — the framing that makes it click |
| Geographic latency improvement, quantified | cc04, pt04, pt06 | UNDERSTAND + `numbers` |
| Origin load reduction | pt04 | GROUND |
| Static media as the safe first justification; dynamic content as the extension | cc04 | UNDERSTAND — block 2 |
| **User-specific data has no hit-rate benefit** | pt04 | GROUND — the decision rule |
| Edge invalidation across many locations, and its propagation delay | pt04 | UNDERSTAND — block 3 |
| Cache headers preventing edge caching for critical updates | pt04 | GROUND |
| Versioned keys naturally expiring at the edge | pt04 | → `scaling-reads` |
| **Edge signature validation by public key, with no origin callback** | pt06 | UNDERSTAND — block 4 |
| Range requests over cached objects | pt06 | → `large-blobs` |
| Terminating encryption near the user even for uncacheable traffic | cc01 | GROUND |
| Data locality as the general principle `[+]` | cc01 | UNDERSTAND |
| Regionalization, zones, and the speed-of-light floor | cc01 | → `proximity` |
| Gateways deployed regionally with geographic routing | kt04 | → `api-gateway` |

### Patterns shelf

#### `realtime-updates`
| Item | Source | Register |
|---|---|---|
| **The two-hop frame** | pt01 | UNDERSTAND — block 1, the organizing idea |
| Simple polling, incl. the quick-to-explain advantage | pt01 | UNDERSTAND — block 2 |
| Long polling and **the worked second-update latency derivation** | pt01 | UNDERSTAND + `numbers` |
| Browser per-domain connection limits | pt01 | GROUND |
| Every infrastructure hop agreeing on the timeout | pt01 | GROUND |
| SSE: chunked transfer, resume identifier, and opaque intermediary buffering | pt01, cc01 | UNDERSTAND — block 3 |
| WebSockets: upgrade, infrastructure support, deployment churn, stickiness | pt01, cc01 | UNDERSTAND — block 4 |
| **The dedicated-connection-service reference architecture** | pt01 | UNDERSTAND — block 4 viz |
| WebRTC: signaling, NAT traversal, relay fallback, setup sequence | pt01, cc01 | UNDERSTAND — block 5 |
| The signaling server being itself a real-time system | pt01 | GROUND |
| Conflict-free replicated data types for peer-to-peer editing `[+]` | cc01, pt01 | GROUND |
| The protocol decision flowchart | pt01 | RETRIEVE — say-it |
| Hop 2 by polling a database, with the read-volume derivation | pt01 | UNDERSTAND — block 6 |
| Hop 2 by consistent hashing, with the four-step scaling orchestration | pt01, kt09 | UNDERSTAND — block 7 |
| Hop 2 by pub/sub, with four stated disadvantages | pt01, kt01 | UNDERSTAND — block 8 |
| Reconnection: zombie connections, heartbeats, sequence numbers | pt01 | UNDERSTAND — block 9 |
| The celebrity fan-out problem | pt01, pt05 | → `scaling-writes` |
| Ordering: single partition over logical clocks in product interviews | pt01 | GROUND |
| Co-locating related connections on one server | kt09 | UNDERSTAND |
| Least-connections balancing for persistent connections | pt01, cc01 | → `load-balancer` |

#### `long-running-tasks`
| Item | Source | Register |
|---|---|---|
| An operation exceeding standard infrastructure timeouts | pt07 | UNDERSTAND — block 1 + `numbers` |
| **Users retrying on no feedback, creating duplicate work** | pt07 | GROUND — the second-order problem |
| The acceptance/processing split; the queue as a durable buffer | pt07 | UNDERSTAND — block 2 viz |
| The resource-mismatch argument for independent tier scaling | pt07 | UNDERSTAND |
| Four gains and four losses, stated symmetrically | pt07 | UNDERSTAND — block 3 |
| Three new failure modes | pt07 | GROUND |
| Four queue options with distinguishing trade-offs | pt07 | → `queues` |
| Three worker run models with explicit constraints | pt07 | UNDERSTAND — block 4 |
| **The eight-step flow, queueing the identifier not the data** | pt07 | UNDERSTAND — block 5 |
| Each component failing independently | pt07 | GROUND |
| **The processing-time-per-second test** | pt07 | UNDERSTAND — the cleanest trigger in the source |
| Heartbeat detection, with the interval failing in both directions | pt07 | UNDERSTAND — block 6 |
| Dead-letter queues, poison messages, and DLQ growth as a bug signal | pt07, kt03 | UNDERSTAND — block 7 |
| Idempotency keys, with the timestamp rounded to the dedup window | pt07, cc01, pt03 | UNDERSTAND — block 8 |
| **Backpressure by depth limits and autoscaling on depth, not CPU** | pt07, pt05 | UNDERSTAND — block 9 |
| Mixed workloads, head-of-line blocking, duration-tiered queues with promotion | pt07 | UNDERSTAND — block 10 |
| Job dependencies: chained context-carrying jobs vs an orchestrator | pt07 | → `multi-step` |
| The closing decision flowchart | pt07 | RETRIEVE — say-it |

#### `multi-step`
| Item | Source | Register |
|---|---|---|
| A workflow whose steps each fail differently, including a human wait | pt03 | UNDERSTAND — block 1 |
| **Patches interweaving system and business concerns** | pt03 | GROUND — the structural diagnosis |
| Single-server: crash amnesia and callback routing | pt03 | UNDERSTAND — block 2 |
| **The database remembers progress but does not act on it** | pt03 | GROUND — the sharpest line in the article |
| **Sagas**: local steps with compensating actions | pt03, cc05 | UNDERSTAND — block 3 viz |
| Why one distributed transaction cannot work (three reasons) | pt03, cc05 | UNDERSTAND + `glossary:2pc` |
| Sagas guarantee undoability, not atomicity | pt03 | GROUND |
| Compensations needing retries, idempotency, and a human escape hatch | pt03 | UNDERSTAND |
| Choreography vs orchestration, with their suitability bands | pt03 | UNDERSTAND — block 4 |
| Event-driven choreography; event sourcing as a close cousin | pt03 | → `streams` |
| Four benefits and two honest costs of choreography | pt03 | UNDERSTAND |
| The audit trail needing tooling to interpret | pt03 | GROUND |
| Implicit flow as the limit: changing it changes many contracts | pt03 | UNDERSTAND |
| **Determinism required because recovery is replay** | pt03 | UNDERSTAND — block 5, the thesis |
| The five-step crash walkthrough | pt03 | UNDERSTAND — block 5 viz |
| The division of labor: scheduling rather than calling | pt03 | GROUND |
| Signals letting a workflow wait indefinitely without holding a thread | pt03 | UNDERSTAND — block 6 |
| Declarative systems: visualization benefit, expressiveness cost | pt03 | UNDERSTAND |
| Knowing your tool's recovery model matters more than the choice | pt03 | GROUND + say-it |
| Versioning vs in-place patching branching on recorded history | pt03 | UNDERSTAND — block 7 |
| State size control: identifiers, and snapshot-and-restart | pt03 | UNDERSTAND |
| **At-least-once attempts, exactly-once effect** | pt03, kt03, kt08 | UNDERSTAND — block 8 |
| The unclosable window, shrunk by two-sided recording plus reconciliation | pt03 | UNDERSTAND |
| Two listening cues; three overkill cases | pt03 | RETRIEVE — say-it |

#### `contention`
| Item | Source | Register |
|---|---|---|
| A race condition walked to its business consequence | pt02 | UNDERSTAND — block 1 |
| **Lost update, and compare-and-set as the one underlying move** | pt02 | UNDERSTAND — the unifying frame |
| Rung 1 conditional writes: a predicate evaluated as part of the write | pt02 | UNDERSTAND — block 2 viz |
| The failure shape varying with isolation level | pt02 | GROUND |
| **A zero-row update is not an error** | pt02 | GROUND — stated twice in source, both times load-bearing |
| **Guard the contended thing**: the counter that passes while two buyers take one item | pt02 | UNDERSTAND — block 3, the sharpest lesson |
| Compare-and-set spelled four ways across other stores | pt02 | GROUND |
| Rung 2 pessimistic locking, for decisions a predicate can't express | pt02, kt07 | UNDERSTAND — block 4 |
| Locking too much for too long; slow I/O inside a lock as the worst case | pt02 | UNDERSTAND |
| Deadlocks; ordering by a global key, not by initiator; detection as backstop | pt02 | UNDERSTAND — block 5 |
| Everyone pays the lock premium for a rare event | pt02 | GROUND |
| Rung 3 optimistic concurrency: version, retry on zero rows | pt02, kt07, kt02 | UNDERSTAND — block 6 |
| **The ABA problem** limiting business-value versions to monotonic ones | pt02 | UNDERSTAND |
| Rung 4 **write skew**: an invariant broken with no shared row | pt02 | UNDERSTAND — block 7 |
| Four isolation levels, and the second-strongest not catching it | pt02, kt07 | UNDERSTAND |
| Materializing a cross-row invariant onto one row | pt02 | GROUND |
| Rung 5 distributed locks: holding the lock as data with an expiry | pt02, kt01, kt09 | UNDERSTAND — block 8 |
| Three lease homes; an expiry lock not being airtight | pt02, kt01 | → `distributed-locks` |
| **The single-home principle**, with two out-of-scope exceptions | pt02 | UNDERSTAND — block 9 |
| A first-fit decision list and a five-row comparison | pt02 | RETRIEVE — say-it |
| Hot resources defeating sharding, balancing, and replicas | pt02, pt05 | UNDERSTAND — block 10 |
| Queue-based serialization and its permanent throughput ceiling | pt02, pt05 | UNDERSTAND |
| The auction race as the canonical worked example | kt07, pt02 | UNDERSTAND — block 6 viz |

#### `scaling-reads`
| Item | Source | Register |
|---|---|---|
| The read/write imbalance, quantified | pt04 | UNDERSTAND — block 1 + `numbers` |
| **Physics, not a debugging problem** | pt04 | GROUND — the framing |
| Indexing, with **under-indexing as the bigger killer** | pt04, cc08 | UNDERSTAND — block 2 |
| Hardware upgrades: effective, and sidestepping the question | pt04, pt05 | GROUND |
| Denormalization with an explicit read/write-ratio precondition | pt04, cc03 | UNDERSTAND |
| Materialized views for precomputed aggregations | pt04 | UNDERSTAND |
| The throughput threshold triggering horizontal scaling | pt04, cc09 | GROUND + `numbers` |
| Read replicas; the redundancy bonus; replication lag | pt04, kt07 | UNDERSTAND — block 3 |
| Functional and geographic sharding | pt04 | UNDERSTAND |
| **Sharding is primarily a write technique** | pt04 | GROUND — the corrective |
| Skewed access patterns justifying caching | pt04, cc04 | UNDERSTAND — block 4 |
| Five invalidation strategies, incl. tagged and versioned keys | pt04 | UNDERSTAND — block 5 |
| **A staleness requirement gives you your TTL** | pt04 | GROUND — the decision rule |
| Vertical scaling as a legitimate first move | cc09, pt05 | → `scaling-writes` |
| Growth-driven slowdown with a scan-volume derivation | pt04 | UNDERSTAND — block 6 |
| The composite-index prefix rule | pt04, cc08 | → `indexing` |
| Request coalescing and key fanout for one hot key | pt04 | UNDERSTAND — block 7 |
| **Stampede rebuild**: lock-based (fragile), probabilistic early refresh, background refresh | pt04, cc04 | UNDERSTAND — block 8 |
| **Cache key versioning** routing around invalidation, with three trade-offs | pt04 | UNDERSTAND — block 9 |
| The deleted-items filter for computed data | pt04 | UNDERSTAND |
| Four scenarios, incl. one value that must not be cached | pt04 | RETRIEVE — say-it |
| Caching actively hurting collaborative editing | pt04 | → `realtime-updates` |

#### `scaling-writes`
| Item | Source | Register |
|---|---|---|
| Modern machine capability vs candidate assumptions | pt05, cc09 | UNDERSTAND — block 1 + `numbers` |
| **Make the vertical case, but don't fight moved goalposts** | pt05 | GROUND — an interview-craft claim worth keeping |
| Append-only vs in-place update, with the throughput comparison | pt05, cc08, kt05 | UNDERSTAND — block 2 |
| The write-versus-read tension named explicitly | pt05 | GROUND — the thesis |
| Three other specialized store classes | pt05 | GROUND |
| Three general write optimizations | pt05, kt07 | UNDERSTAND |
| Slot-based distribution; choosing the partitioning key | pt05, cc05 | UNDERSTAND — block 3 |
| **Minimizing variance — flat is the goal** | pt05 | GROUND |
| Considering the read path so you don't create scatter-gather | pt05, cc05 | UNDERSTAND |
| Vertical partitioning into differently-optimized tables | pt05 | UNDERSTAND — block 4 |
| Burst arithmetic: absorbing a peak means low steady-state utilization | pt05 | UNDERSTAND — block 5 + `numbers` |
| **Autoscaling rejected as a panacea** | pt05 | GROUND |
| Write queues: burst absorption, and unbounded growth as the failure | pt05, pt07 | UNDERSTAND |
| Queues for short bursts, not to patch steady-state incapacity | pt05 | GROUND |
| **Load shedding** defended, with the stale-update-is-free case | pt05 | UNDERSTAND — block 6 |
| Batching at three layers, with the sparse-traffic caveat | pt05 | UNDERSTAND — block 7 |
| **Hierarchical aggregation** resolving all-to-all fan-in/fan-out | pt05, pt01 | UNDERSTAND — block 8 viz |
| Resharding by dual writes with read preference | pt05 | UNDERSTAND — block 9 |
| Splitting a key too hot for one shard; aggregatable data only | pt05, pt04, kt01 | UNDERSTAND — block 10 |
| **Readers and writers must agree on which keys are split** | pt05 | GROUND |
| Hot partitions and four strategies | kt03 | UNDERSTAND |
| Reducing throughput per component as the unifying principle | pt05 | RETRIEVE — say-it |

#### `large-blobs`
| Item | Source | Register |
|---|---|---|
| Servers as dumb pipes adding only latency and cost | pt06 | UNDERSTAND — block 1 |
| **Going direct isn't sufficient on its own** — the three problems it creates | pt06 | UNDERSTAND — the thesis |
| Access control replacing data transfer | pt06 | UNDERSTAND — block 2 viz |
| Presigned uploads: scope, in-memory generation, the keyed signature | pt06 | UNDERSTAND — block 3 |
| **Encoding size and type restrictions into the signature** | pt06 | GROUND |
| Storage vs edge signature validation, and who holds which key | pt06 | UNDERSTAND — block 4 |
| Resumable uploads: the transfer-time derivation, chunked APIs, part queries | pt06 | UNDERSTAND — block 5 + `numbers` |
| Progress tracking falling out of chunking for free | pt06 | GROUND |
| The completion call, without which parts exist but no file does | pt06 | UNDERSTAND |
| Incomplete uploads costing money; lifecycle cleanup | pt06 | → `blob-storage` |
| **Four problems with trusting the client's completion report** | pt06 | UNDERSTAND — block 6 |
| Event notifications carrying the key that links back to your row | pt06 | UNDERSTAND |
| **Reconciliation required because events themselves fail** | pt06 | GROUND — the claim candidates miss |
| Four when-not-to-use cases | pt06 | RETRIEVE — say-it |
| Quarantine-then-publish, with delay throttling automation | pt06 | UNDERSTAND — block 7 |
| The metadata row created at URL-generation time | pt06 | → `blob-storage` |
| Range requests for resumable downloads; parallel chunks judged not worth it | pt06 | UNDERSTAND — block 8 |
| Async post-upload processing pipelines | pt06, pt07 | → `long-running-tasks` |

#### `proximity`
*No source pattern article. Assembled from five places.*

| Item | Source | Register |
|---|---|---|
| **Why two one-dimensional indexes fail at a two-dimensional query** | cc08 | UNDERSTAND — block 1, the on-ramp |
| The rectangle-larger-than-the-circle problem with index intersection | cc08 | GROUND |
| Geohash: recursive subdivision to a sortable string | cc08 | UNDERSTAND — block 2 viz |
| **Indexing the string with an ordinary B-tree** — the elegance | cc08 | UNDERSTAND |
| Adjacent cells needed for radius queries | cc08, kt01 | GROUND |
| The boundary-straddling limitation | cc08 | GROUND |
| Quadtrees: adaptive resolution, specialized structure, R-tree ancestry | cc08 | UNDERSTAND — block 3 |
| R-trees: overlapping data-fitted rectangles; points and polygons together | cc08 | UNDERSTAND — block 4 |
| Overlap forcing multi-branch searches | cc08 | GROUND |
| The interview script: the problem plus one solution, contrasted | cc08 | RETRIEVE — say-it |
| Two-pass search complexity from grid-aligned imprecision | kt01 | UNDERSTAND — block 5 |
| Point vs shape field types and their use classes | kt02 | UNDERSTAND |
| A block-storage-optimized k-d tree variant | kt02 | GROUND |
| A general-purpose index framework using bounding boxes | kt07 | UNDERSTAND |
| Multiple geometry types, distance models, coordinate systems | kt07 | GROUND |
| Trying the relational extension before a specialized store | kt07 | → `relational-db` |
| **Regional partitioning**: bundling nearby cities, co-locating servers with their data | cc01 | UNDERSTAND — block 6 |
| Availability zones and the speed-of-light floor | cc01 | → `cdn` + `numbers:fiber-rtt-floor` |
| Geographic sharding | pt04 | → `scaling-reads` |

## B.3 Glossary additions

Today's glossary holds ~110 keys across seven groups. The source needs ~46 more.
Only the **Networking** group currently carries the full speakable contract
(`say` / `reachFor` / `trap`, enforced by the schema test). Every entry proposed
below should ship with that contract, and §D treats each group's additions as a
**prerequisite bundle** that must land before the briefings that dot those terms.

| Group | New keys | Sources |
|---|---|---|
| **Networking** | `graphql`, `nat`, `signaling` | cc01, cc02, pt01 |
| **Requests & Traffic** | `jwt`, `rbac`, `cursor`, `rangerequest`, `apikey` | cc02, pt06 |
| **Caching & Delivery** | `cacheaside`, `writethrough`, `readthrough`, `eviction`, `coalescing`, `keyversion`, `edgecache` | cc04, pt04, kt01 |
| **Storage & Data** | `partitionkey`, `clusteringkey`, `vnode`, `hashslot`, `sstable`, `memtable`, `compaction`, `bloomfilter`, `compositeindex`, `coveringindex`, `partialindex`, `materializedview`, `rtree`, `docvalues`, `lastwritewins`, `hintedhandoff`, `scattergather`, `isolationlevel`, `serializable`, `writeskew` | cc05, cc06, cc08, kt02, kt05, kt06, kt07, pt02 |
| **Queues & Streams** | `offset`, `consumergroup`, `watermark`, `windowing`, `checkpoint`, `compensation`, `choreography`, `orchestration`, `durableexecution` | kt03, kt08, pt03 |
| **Resilience** | `compareandset`, `aba`, `pessimistic`, `fencingtoken`, `gossip`, `splitbrain`, `ephemeral`, `heartbeat`, `loadshedding` | kt01, kt05, kt09, pt02, pt05, pt07 |

**Contract notes for the trickier entries.** These four carry the highest risk of a
weak `say` sentence, and specs should treat them as review gates:

- `writeskew` — must convey that no shared row exists, which is *why* the cheaper
  tools miss it. A definition that only says "a concurrency anomaly" fails.
- `compareandset` — must land as the single move underneath conditional writes,
  optimistic concurrency, and version checks, or it is just a synonym.
- `durableexecution` — must convey resume-from-recorded-history, not just "retries".
- `aba` — must include *why* monotonic values are exempt, otherwise the trap is
  unusable.

## B.4 `numbers.ts` additions

`numbers.ts` currently holds 36 ids; spec 069 adds `fiber-rtt-floor`. The source
supplies roughly 240 distinct quantities, which de-duplicate to **~52 new entries**
(several source numbers already resolve to existing ids — in-memory operation rates
to `redis-ops`, relational write throughput to `pg-writes`, broker throughput to
`kafka-msgs`, inter-region latency to `cross-region-rtt`).

Grouped into the four prerequisite bundles §D schedules:

**N1 — Capacity ceilings (from cc09, the cross-cutting article).** Blocks every
briefing that says "when do I outgrow this?": `cache-memory-ceiling`,
`db-storage-ceiling`, `db-connection-ceiling`, `app-connection-ceiling`,
`broker-storage-ceiling`, `partition-count-ceiling`, `container-start-time`,
`dc-bandwidth`, `az-rtt`, `cpu-scale-trigger`, `shard-storage-trigger`,
`read-scale-threshold`, `write-scale-trigger`.

**N2 — Storage and index mechanics (cc08, kt05, kt06, kt07).**
`disk-page-size`, `btree-lookup-depth`, `lsm-write-crossover`,
`memtable-flush-size`, `quadtree-split-threshold`, `index-table-threshold`,
`pg-indexed-lookup-rate`, `pg-table-row-ceiling`, `pg-join-ceiling`,
`ddb-item-max`, `ddb-rcu-bytes`, `ddb-wcu-bytes`, `ddb-partition-capacity`,
`ddb-index-maxima`, `ddb-txn-items`, `cassandra-quorum`, `replication-factor`.

**N3 — Cache and delivery (cc04, cc06, pt04, kt01).**
`cache-vs-db-read`, `cache-speedup-ratio`, `cdn-edge-latency`,
`origin-load-reduction`, `read-write-ratio`, `hash-ring-space`, `hash-slot-count`,
`ring-move-fraction`, `shard-start-count`, `stampede-refresh-curve`,
`hot-key-fanout`.

**N4 — Transport, transfer, and async (pt01, pt06, pt07, kt02, kt03, kt09).**
`longpoll-second-update`, `sse-connection-life`, `pubsub-added-latency`,
`http-timeout-band`, `async-duration-threshold`, `heartbeat-interval`,
`dlq-retry-threshold`, `serverless-exec-limit`, `queue-message-max`,
`kafka-retention-default`, `blob-durability`, `blob-size-threshold`,
`multipart-min-part`, `upload-time-derivation`, `es-deep-pagination-cliff`,
`es-doc-threshold`, `zk-session-timeout`, `zk-read-write-ratio`,
`burst-headroom`, `batching-improvement`.

**Derivation discipline.** Every entry needs a `derivation` (CLAUDE.md quality bar).
The source's most valuable numbers are the ones that come *with* their arithmetic,
and those should ship as derivations rather than bare values — the dataset-size
computations that show sharding is unnecessary, the per-second processing-time test
for async work, the transfer-time computation that motivates resumable uploads, the
burst-headroom computation, and the quorum-overlap argument. A bare value here would
throw away the part that teaches.

## B.5 Say-it deck coverage

Today: **one deck, six cards, all on `networking`** (spec 066). The remaining 26
briefings have no deck. Decks are 5–8 cards and local to their briefing
(content-pipeline §11), so full coverage is **26 decks / ~160 cards**.

The source is unusually well-suited to supplying the `trap` field, because its
callouts are already shaped as corrections of a specific wrong thing candidates say. The
richest sources of traps, in order: pt02 (13 callouts, nearly all trap-shaped),
kt07 (14), pt01 (12), pt04 (12), cc01 (20, already spoken for by spec 069), kt01 (13).

**Deck sizing estimate by shelf:**

| Shelf | Briefings | Cards | Notes |
|---|---:|---:|---|
| concepts | 8 (7 new) | ~45 | `cap` is the smallest — the article carries almost no numbers, so cards lean on the decision question and the spectrum |
| technologies | 11 | ~70 | `relational-db` and `nosql-db` are the largest, each drawing on two or more articles |
| patterns | 8 | ~50 | `contention` and `multi-step` are the deepest; `proximity` the thinnest, being assembled |

**Coverage rule this map proposes:** every `[GROUND]`-register correction in §B.2
(the "corrects a common belief" rows) becomes a card `trap`. That is ~60 traps
already identified, which comfortably seeds the decks without inventing material.

## B.6 Waivers

Every item below is deliberately out of scope, with its reason. Waivers inherited
from spec 069 Appendix A are marked `[069]`.

| Waived | Reason |
|---|---|
| Address-allocation and address-registry trivia `[069]` | Below interview value; the layer-3 floor already teaches the inherited-geography consequence |
| Packet-capture and network-conditioner homework `[069]` | Outside the product — the Lab is our version of hands-on experimentation |
| The source's own video, quiz, and cross-sell modules `[069]` | The terms panel and say-it decks are our quick reference |
| Hardware-interconnect aside (cc01) | Named once as a non-web alternative; carries no interview consequence |
| Verbatim code samples in any language (kt03, kt08, pt03, pt04, pt07) | We teach mechanisms through visualizations; a code listing is not a pokeable viz and would violate §7's viz-carries-the-explanation rule |
| Query-language and schema syntax drills (kt02, kt05, kt06, kt07) | The *shape* of a primary key or an index ships; typing its syntax is not a systems-design skill |
| Vendor product feature lists (kt04's six gateways, kt09's alternatives, pt07's queue vendors) | We keep the *distinguishing trade-off* of each option and drop the marketing enumeration |
| Cloud-provider SDK function and parameter names (pt06's five-row terminology table) | The source itself says these aren't interview-relevant; we keep the concept triplet and drop the per-provider naming |
| Exact per-unit dollar prices (kt06) | Volatile and unverifiable; we keep the capacity-unit *mechanics* and the cost-derivation *method*, which is what constrains architecture |
| Specific cloud instance model designations (cc09, pt04) | We keep the capability numbers (memory, cores, bandwidth) and drop the SKU names, which age out within a year |
| "In the Wild" external engineering-blog links (pt01, pt02, pt04, pt05, pt07) | Outbound links aren't a content type in the library; the underlying lessons are already assigned |
| Cross-links to the source's own problem breakdowns (all articles) | Site navigation. The *examples themselves* — the chat-partition bucketing, the ticketing section split, the ad-click hot partition — are all kept and assigned |
| Interview-logistics meta-advice with no technical content ("ask your interviewer whether X is allowed", role-weighting notes, seniority gating) | Not systems knowledge. The subset that *is* durable technical judgment — reach-for and don't-reach-for rules — ships as say-it `reachFor` and `trap` fields instead |
| Source-specific framework references (its own delivery framework, its core-entities step) | Proprietary to the source's method; our equivalent structure is the library's own shelves and the Scar Journal |
| Historical version-number specifics (kt01's feature-by-version notes, kt03's follower-read version) | The *capability* ships; pinning it to a release number dates the content and teaches nothing |
| Deep protocol internals the source itself defers (routing protocols, hole-punching mechanics) | Explicitly out of scope in the source too; the layer model already teaches that these are the floor's implementation detail |

**Nothing else is waived.** Every remaining topic, claim, callout, and number in §A
has a destination in §B.1–B.5.

---

# C. Proposed connection edges

## C.0 Why this section exists

Coverage is site-level: §B routes a topic to a neighbor page and calls it covered.
**That is only true if the edge exists.** An unreachable neighbor is a coverage hole,
not a hand-off. This section is therefore the other half of §B — every `→` in the
destination map must appear here, or the superset claim fails.

Edges live in `related.sections` on each `ManualSection`. The field is a single array
per section, so an edge is stored **once per direction**. The three-registers contract
(content-pipeline §7) requires each briefing to end with a hand-off paragraph relating
it to its neighbors — which means each direction needs its own reason to exist. A
why-sentence that works in only one direction indicates the edge should be one-way.

**Current state:** 27 sections carry 2–3 edges each, mostly undirected pairs and
almost none annotated. The proposal below keeps all existing edges and adds the ones
§B's routing depends on.

**Pruning rule proposed:** cap each section at **six** outbound edges. Beyond that the
hand-off paragraph stops being a paragraph and becomes a link dump, and the player
stops following any of them. Where a section exceeded six, the weakest edge is dropped
and noted.

## C.1 Existing edges (keep)

| Section | Current outbound |
|---|---|
| networking | cdn, load-balancer |
| api-design | data-modeling, api-gateway |
| data-modeling | indexing, relational-db, nosql-db |
| indexing | relational-db, data-modeling |
| caching | distributed-caches, scaling-reads |
| sharding | consistent-hashing, scaling-writes |
| consistent-hashing | sharding, distributed-caches |
| cap | relational-db, distributed-locks |
| relational-db | indexing, scaling-reads, cap |
| nosql-db | data-modeling, sharding |
| blob-storage | large-blobs, cdn |
| search-db | indexing, relational-db |
| api-gateway | load-balancer, api-design |
| load-balancer | api-gateway, scaling-reads |
| queues | long-running-tasks, streams |
| streams | queues, multi-step |
| distributed-locks | contention, cap |
| distributed-caches | caching, consistent-hashing |
| realtime-updates | scaling-writes, streams |
| long-running-tasks | queues, multi-step |
| contention | distributed-locks, scaling-writes |
| scaling-reads | caching, relational-db |
| scaling-writes | sharding, queues |
| large-blobs | blob-storage, long-running-tasks |
| multi-step | distributed-locks, streams |
| proximity | indexing, sharding |

## C.2 Proposed new edges

Each row gives the reason the trip is worth making **in that direction**. Both rows
of a pair must be justifiable independently; where only one direction is, the edge is
marked one-way.

### Concepts → elsewhere

| Edge | Why this way |
|---|---|
| `api-design` → `realtime-updates` | Push protocols are not request/response APIs at all; a player who has just modeled resources needs to know that the moment the server must speak first, this whole vocabulary stops applying. |
| `realtime-updates` → `api-design` | Every push design still needs a conventional API for the writes; the common shape is a stream for updates and ordinary requests for changes, which is only obvious once you've seen both. |
| `api-design` → `contention` | Conditional requests are the same compare-and-set move as a version check in the database, one layer up — the player should see that the header and the WHERE clause are the same idea. |
| `contention` → `api-design` | The version a client holds has to reach the server somehow, and the request header is where that contract is expressed. |
| `indexing` → `search-db` | Text is the one query shape the tree cannot serve, so the inverted index is where indexing hands off rather than degrades. |
| `search-db` → `indexing` *(exists)* | The inverted index is one entry in a family; understanding what the others are good at is what tells you when a search engine is the wrong reach. |
| `indexing` → `proximity` | Two-dimensional queries break the one-dimensional assumption every other index makes, and that break is the entire reason spatial indexes exist. |
| `proximity` → `indexing` *(exists)* | Every spatial approach either reduces to a tree lookup or builds its own; you cannot judge which without knowing what the tree already does well. |
| `indexing` → `nosql-db` | The log-structured storage engine is not a per-column index but the whole table's format, which is why the wide-column stores behave the way they do. |
| `nosql-db` → `indexing` | The secondary-index limitations of these stores follow directly from that storage format, so the constraint stops looking arbitrary. |
| `caching` → `cdn` | The edge is the same cache pattern moved geographically; seeing it as read-through-at-a-distance stops it being a separate technology to memorize. |
| `cdn` → `caching` | Every edge decision — what to cache, how to invalidate, how long to keep it — is the same set of choices, just harder because the copies are far away and numerous. |
| `caching` → `data-modeling` | Keeping the source of truth normalized while the cache holds a pre-joined shape is the cleanest way to get denormalized reads without denormalized writes. |
| `data-modeling` → `caching` *(via existing)* | The decision to denormalize should be weighed against putting the same shape in a cache instead, which is often cheaper and always more reversible. |
| `sharding` → `multi-step` | A transaction that spans shards is no longer a sharding problem; it becomes a saga, and knowing where that boundary is prevents designing an impossible transaction. |
| `multi-step` → `sharding` | Sagas exist largely because data got split across machines in the first place; the partition decision is what created the need. |
| `sharding` → `nosql-db` | These stores partition automatically, so the manual decisions here become configuration there — with the mechanisms differing more than the marketing suggests. |
| `nosql-db` → `sharding` *(exists)* | The partition key is a shard key wearing a different name; every hot-spot lesson transfers directly. |
| `consistent-hashing` → `realtime-updates` | Placing persistent connections on servers is the same ring problem as placing data, and it is where the technique earns its keep outside databases. |
| `realtime-updates` → `consistent-hashing` | Deciding which server owns a given user's connection is exactly the placement problem, and the scaling orchestration comes straight from it. |
| `cap` → `nosql-db` | These stores let you choose per operation rather than per system, which turns the theorem from a classification into a runtime dial. |
| `nosql-db` → `cap` | The consistency-level setting is meaningless until you know which side of the partition trade-off you are buying. |

### Technologies → elsewhere

| Edge | Why this way |
|---|---|
| `relational-db` → `contention` | Isolation levels and row locks are the mechanism; the race they prevent is what makes them worth understanding, and it lives next door. |
| `contention` → `relational-db` | Four of the five escalation rungs are relational features, so the engine's behavior *is* the pattern's implementation. |
| `relational-db` → `search-db` | Built-in text search covers more than candidates expect, and knowing exactly where it stops is what justifies adding a whole system. |
| `search-db` → `relational-db` *(exists)* | The dedicated engine is almost never the source of truth; the relational store usually still is, and the two must be kept in sync. |
| `relational-db` → `proximity` | The spatial extension answers proximity queries without a new datastore, and one major ride-sharing company ran on it — the ceiling is far higher than assumed. |
| `proximity` → `relational-db` | Before reaching for a specialized store, the extension is the cheap first move; skipping it is the most common over-engineering here. |
| `relational-db` → `scaling-writes` | The write path explains exactly what a write costs; the scaling strategies are the responses to that cost, in escalating order. |
| `scaling-writes` → `relational-db` | The throughput number you are trying to beat comes from that write path, so the strategies are meaningless without it. |
| `nosql-db` → `streams` | Change data capture turns the store into an event source, which is how the search index and the analytics pipeline stay current. |
| `streams` → `nosql-db` | The change log has to originate somewhere, and a store that emits one natively removes an entire integration. |
| `nosql-db` → `distributed-caches` | The managed cache in front of these stores has invalidation caveats that are easy to miss and expensive to discover in production. |
| `distributed-caches` → `nosql-db` | Both face the same hot-key problem for the same reason, and the remediations are interchangeable. |
| `blob-storage` → `queues` | Large payloads must never travel through a message log; the pointer-not-payload rule is the single most common blob mistake in queue designs. |
| `queues` → `blob-storage` | The moment a message would exceed the size limit, the object store is where the payload goes and the message carries only its location. |
| `search-db` → `streams` | The index is almost always fed by a change stream rather than written to directly, which is what makes it eventually consistent. |
| `streams` → `search-db` | Keeping a derived index current is the canonical worked example of what a change stream is for. |
| `search-db` → `data-modeling` | Whether to nest related records or separate them is the same normalization decision, with the same read/write trade-off. |
| `search-db` → `contention` | Concurrent document updates are resolved with a version field — the same optimistic move, in a store with no transactions. |
| `search-db` → `proximity` | Its geospatial field types are a production-grade answer to proximity search, with a distinct index structure behind them. |
| `api-gateway` → `cdn` | Gateways deployed regionally with geographic routing are the same edge-proximity argument applied to compute rather than content. |
| `cdn` → `api-gateway` | Once the edge runs logic rather than just serving bytes, the boundary between the two blurs and the choice becomes a real one. |
| `load-balancer` → `realtime-updates` | Which layer the balancer works at determines whether a persistent connection survives it at all — the single most consequential balancer choice for push designs. |
| `realtime-updates` → `load-balancer` | Persistent connections break the stateless assumptions the default balancing strategy makes, which is why least-connections exists. |
| `queues` → `scaling-writes` | A hot partition is a write-scaling problem that happens to live in the log; the remediations are the same key-splitting moves. |
| `scaling-writes` → `queues` *(exists)* | The queue is the burst absorber, and knowing its failure mode is what keeps it from masking a real capacity problem. |
| `queues` → `multi-step` | At-least-once delivery is why every workflow step must be idempotent; the delivery guarantee and the workflow contract are the same fact. |
| `multi-step` → `queues` | Choreographed workflows are built directly on the log, so its ordering and delivery semantics *are* the workflow's semantics. |
| `streams` → `distributed-locks` | Stream processors elect a coordinator to survive failure, and they usually borrow an external coordination service to do it. |
| `distributed-locks` → `streams` | Leader election is abstract until you see a real system depending on it to keep processing after a crash. |
| `distributed-locks` → `load-balancer` | Service discovery and connection routing are the same registry, and it is where coordination shows up in an ordinary web architecture. |
| `load-balancer` → `distributed-locks` | Routing a user consistently to one server requires somewhere authoritative to record that decision. |
| `distributed-caches` → `realtime-updates` | Publish/subscribe is how updates reach the servers holding the connections, and its per-node connection model is what makes it affordable. |
| `realtime-updates` → `distributed-caches` *(via streams)* | The fan-out layer is usually the same in-memory store already in the design, which is why it is the default second hop. |
| `distributed-caches` → `scaling-reads` | The cache is the last step of the read-scaling progression; the earlier steps are what justify reaching for it. |
| `scaling-reads` → `distributed-caches` *(via caching)* | The operational failure modes — hot keys, stampedes, rebuild storms — are where a cache stops being free. |
| `cdn` → `large-blobs` | Signed edge URLs and range requests are what make large downloads fast and resumable without touching your servers. |
| `large-blobs` → `cdn` *(via blob-storage)* | Downloads should leave the origin entirely; the edge is where that happens and where the signature is validated. |
| `cdn` → `proximity` | The speed-of-light floor is the reason edges exist, and it is the same constraint that drives regional data placement. |
| `proximity` → `cdn` | Caching at the edge and partitioning by region are two answers to one physical problem, and they compose. |

### Patterns → elsewhere

| Edge | Why this way |
|---|---|
| `realtime-updates` → `scaling-writes` *(exists)* | The celebrity fan-out problem is a write-amplification problem; hierarchical aggregation is its answer. |
| `scaling-writes` → `realtime-updates` | Hierarchical aggregation exists because millions of clients need one shared view, which is a delivery problem before it is a write problem. |
| `long-running-tasks` → `large-blobs` | Upload completion is the trigger for the whole async processing pipeline, so the two patterns compose end to end. |
| `large-blobs` → `long-running-tasks` *(via existing)* | Everything after the bytes land — transcoding, scanning, thumbnailing — is background work, and the upload event is what starts it. |
| `long-running-tasks` → `scaling-writes` | Backpressure and depth-based autoscaling are write-scaling tools applied to a queue rather than a database. |
| `scaling-writes` → `long-running-tasks` | The queue that absorbs a burst is the same queue that feeds a worker pool; the operational concerns are shared. |
| `multi-step` → `contention` | The moment an operation spans more than one source of truth, contention tools stop applying and a saga takes over — the boundary is the useful thing to know. |
| `contention` → `multi-step` *(via existing)* | Two of the pattern's explicit out-of-scope exceptions are workflow problems, and knowing that keeps you from over-reaching a lock. |
| `scaling-reads` → `indexing` | The first and cheapest step of the read progression is an index, and most read problems end there. |
| `indexing` → `scaling-reads` | Indexes have a ceiling; the progression past it — replicas, then caches — is what comes next. |
| `scaling-reads` → `realtime-updates` | Caching actively hurts when every change must be visible immediately; knowing where the pattern inverts is the point. |
| `scaling-writes` → `contention` | A key too hot for one shard is a contention problem that sharding cannot solve, because every request wants the same row. |
| `contention` → `scaling-writes` *(exists)* | Serializing a hot resource caps its throughput permanently, which is a scaling decision disguised as a correctness one. |
| `scaling-writes` → `nosql-db` | Write-optimized stores exist precisely to move the throughput ceiling, and their read cost is the price. |
| `nosql-db` → `scaling-writes` | The append-only storage engine is why these stores absorb writes that a relational engine cannot. |
| `proximity` → `scaling-reads` | Geographic sharding is proximity applied to the data layer rather than the query layer. |

### One-way edges (justified in one direction only)

| Edge | Why one-way |
|---|---|
| `cap` → `contention` | Choosing consistency is what creates the contention problem; but the contention pattern operates entirely within one source of truth, where the theorem has nothing to say. |
| `networking` → `proximity` | The speed-of-light floor is a networking fact the proximity page inherits; proximity has no reciprocal reason to send a player back to the layer model. |
| `data-modeling` → `sharding` | Choosing a shard key is a modeling decision made early; the sharding page already reaches back via `consistent-hashing` and does not need a second return path. |

## C.3 Resulting graph shape

| Metric | Before | After |
|---|---:|---:|
| Total directed edges | ~54 | ~130 |
| Mean outbound per section | 2.0 | ~4.8 |
| Sections at the six-edge cap | 0 | 7 (`indexing`, `relational-db`, `nosql-db`, `search-db`, `scaling-writes`, `contention`, `realtime-updates`) |
| Sections with fewer than 3 outbound | 0 | 0 |
| Annotated with a why-sentence | ~0 | all |

**Edges dropped to respect the cap:** `indexing → data-modeling` (weaker than the
four new ones and already reachable in reverse) — *revised when F1 landed: the edge
was already shipped and annotated by spec 074, and keeping it puts `indexing` at
exactly six rather than five, so it stays*; `nosql-db → distributed-locks`
(gossip is interesting but not a decision the player makes); `api-gateway → contention`
(rate-limiting mechanics are better reached through `distributed-caches`).

**Hubs to watch.** `indexing`, `relational-db`, and `contention` become the three
highest-degree nodes. That matches where the source concentrates its depth, but it
means those three pages carry the most hand-off-paragraph weight and should be
reviewed for link-dump drift when they are authored.

---

# D. Proposed fill-out spec sequence

## D.0 Shared prerequisites — these must land first

Four things are needed by many briefings and would be rebuilt badly if each spec
invented its own. They are sequenced ahead of all authoring.

### P0 · spec 069 — already queued
Establishes the multi-block `ManualSection` shape, the block-rendering path, and the
schema tests every fill-out spec below depends on. **Nothing in §D can start until
069 lands.** It is also the reference implementation for the three registers, so the
first fill-out spec should be reviewed against it directly.

### P1 · `numbers.ts` bundles N1 + N2 — capacity ceilings and storage mechanics
~30 entries with derivations (§B.4). **Blocks: F1, F2, F5, F6, F9, F12.**
Scope: no UI, no briefing changes — `numbers.ts` plus tests. The derivations are the
work; several are multi-step arithmetic that should ship as the derivation string
rather than as a bare value.
Size: medium. Mostly writing, little code.

### P2a · Glossary — storage, queues, resilience bundles
38 keys with the full speakable contract (§B.3). **Blocks: F1, F2, F3, F5, F6, F8,
F9, F10, F13.**
Scope: `glossary.ts` plus the existing schema test, which already enforces
`say`/`reachFor`/`trap` for a group once the group opts in. Extend that enforcement to
these three groups.
Size: large — 38 × four fields, and the four flagged entries in §B.3 need review
attention.

### P2b · Glossary — caching, networking, traffic bundles
15 keys, same contract. **Blocks: F4, F7, F11, F14.**
Size: medium. Can run in parallel with P2a if two people are working; otherwise
sequence it after.

### P3 · Edge-graph mechanism + hand-off rendering
Today `related.sections` is an unannotated id array. The three-registers contract
needs a hand-off *paragraph*, and §C needs a why-sentence per direction.
Scope: extend the type so an edge carries its why-sentence; render the hand-off block
at the foot of a briefing; add a schema test that every edge is annotated and that no
section exceeds the six-edge cap; migrate the ~54 existing edges with sentences.
**Blocks: nothing hard, but every fill-out spec adds edges, so landing this first
avoids 15 migrations.**
Size: medium — a real code change plus 54 sentences.

### P4 · `numbers.ts` bundles N3 + N4
~31 entries (§B.4). **Blocks: F4, F11, F12, F13, F14.**
Can land any time before F4; grouped here because it is the same kind of work as P1
and benefits from the derivation conventions P1 establishes.
Size: medium.

**Standing rule for every fill-out spec below:** each ships its briefing's **say-it
deck** (5–8 cards, content-pipeline §11) and its **outbound edges with why-sentences**
in the same change. Decks are local to a briefing and unlocked by opening it, so a
briefing without its deck is incomplete, not deferred.

## D.1 The ordered queue

Sequencing principles, in priority order:

1. **Prerequisites before dependents** — the P-series gates everything.
2. **Hubs early.** `indexing`, `relational-db`, and `contention` are the three
   highest-degree nodes in §C.3 and the source's deepest material. Landing them first
   means later specs route into finished pages rather than stubs.
3. **Honor the 069 commitment early.** Appendix A flags GraphQL as a must-add covered
   nowhere today, so `api-design` (F7) is pulled ahead of the rest of the concepts
   shelf rather than being sequenced by size.
4. **Dedicated-article briefings before assembled ones.** A briefing with one source
   article is a scoping problem already solved; an assembled briefing is a judgment
   call every time. The three with no source article are scheduled last.
5. **Batch briefings that share a source.** Splitting `indexing` from `search-db`
   would mean reading the same inverted-index material twice.

| # | Spec | Briefings | Primary sources | Scope | Prereqs |
|---|---|---|---|---|---|
| F1 ✅ | indexing + search — **landed as spec 076** | `indexing`, `search-db` | cc08, kt02 | **XL.** ~9 blocks across two pages. New viz: B-tree traversal, LSM write path, inverted-index builder, segment-merge animation. The LSM block is the deepest single explanation in the map. ~14 cards. | P1, P2a |
| F2 | relational deep dive | `relational-db` | kt07 | **L.** ~5 blocks. New viz: the four-step write path with a commit-latency probe; specialized-index selector. Carries the connection-pooling and practical-limits material. ~8 cards. | P1, P2a |
| F3 | contention escalation | `contention` | pt02, kt07 | **XL.** ~10 blocks — the five-rung escalation, each rung existing because the previous one has a named limit. New viz: the race-condition timeline, the guard-the-right-thing counter-vs-row demo, the write-skew two-transaction viz. The single richest article in the set. ~8 cards. | P2a, F2 |
| F4 | caching + distributed caches | `caching`, `distributed-caches` | cc04, kt01, pt04 | **L.** ~9 blocks. New viz: the four-places map, cache-aside vs write-through stepper, hot-key load distribution. Carries the durability and async-replication callouts. ~13 cards. | P2b, P4 |
| F5 | sharding + consistent hashing | `sharding`, `consistent-hashing` | cc05, cc06, kt05 | **L.** ~8 blocks. New viz: shard-key variance visualizer, the hash ring with a draggable node count, virtual-node distribution. ~12 cards. | P1, P2a |
| F6 | wide-column stores | `nosql-db` | kt05, kt06 | **XL.** ~6 blocks but two source articles to reconcile. New viz: partition-key + clustering-key builder, the secondary-index comparison, the query-driven modeling walkthrough. ~8 cards. | P1, P2a, F5 |
| F7 | API design + gateway | `api-design`, `api-gateway` | cc02, kt04, cc01 | **L.** ~8 blocks. New viz: the request-builder showing path/query/body roles, the six-step gateway trace. **Discharges the 069 GraphQL commitment.** ~13 cards. | P2b |
| F8 | CAP + data modeling | `cap`, `data-modeling` | cc07, cc03 | **M.** ~7 blocks. New viz: the partition-choice toggle, the model-picker. `cap` is the smallest briefing in the map — the source carries almost no numbers, so it leans hard on the decision question and the spectrum. ~11 cards. | P2a |
| F9 | queues + streams | `queues`, `streams` | kt03, kt08, kt01 | **XL.** ~11 blocks. New viz: the partition-ordering narrative (derive partitions from an ordering requirement), consumer-group assignment, the watermark timeline, window-type comparison with emission arithmetic. ~14 cards. | P1, P2a |
| F10 | coordination + locks | `distributed-locks` | kt09, kt01, pt02 | **L.** ~6 blocks. New viz: the escalating coordination narrative (the best on-ramp in the source), the sequential-node lock queue. Carries the lock-is-efficiency-not-correctness thesis. ~8 cards. | P2a, F3 |
| F11 | realtime updates | `realtime-updates` | pt01, cc01, kt09 | **XL.** ~9 blocks. New viz: the two-hop frame as the organizing diagram, a protocol-latency comparator, the connection-routing demo. Largest pattern article. ~8 cards. | P2b, P4 |
| F12 | scaling reads + writes | `scaling-reads`, `scaling-writes` | pt04, pt05, cc09 | **XL.** ~10 blocks. New viz: the read progression with a threshold slider, the stampede refresh-probability curve, the hierarchical-aggregation fan-in/fan-out. ~14 cards. | P1, P4, F4, F5 |
| F13 | workflows + async work | `multi-step`, `long-running-tasks` | pt03, pt07, kt03 | **XL.** ~11 blocks. New viz: the saga with compensations firing backward, the replay-recovery stepper, the eight-step async flow, the duration-tiered queue. ~14 cards. | P2a, P4, F9 |
| F14 | large blobs + object storage | `large-blobs`, `blob-storage` | pt06 | **L.** ~9 blocks. New viz: the proxy-vs-direct comparison, the multipart resume demo, the state-synchronization race. ~12 cards. | P2b, P4 |
| F15 | the assembled three | `proximity`, `cdn`, `load-balancer` | cc08, cc01, kt01, kt02, kt07, pt04, pt06 | **XL and highest-risk.** ~14 blocks across three pages, none with a dedicated source article. New viz: the 2-D-vs-two-1-D-indexes failure, geohash subdivision, the edge-hit/miss path, the L4-vs-L7 visibility demo. **Scope this spec last and most carefully** — it is the one most likely to sprawl. Review decision 2026-07-30: author as THREE separate specs (one per briefing) when its turn arrives; the row stays one line only for sequencing. ~18 cards. | all prior |
| F16 | reliability walkthrough | `handling-failure` (new 28th briefing, patterns shelf — ADR 0006) | cc01, pt03, pt07, kt03 | **L.** Discharges the outstanding 069 Appendix A commitment: timeouts, retries with backoff and jitter, thundering herd, idempotency keys, circuit breakers, cascading failures. ADR 0006 accepted — see §D.3(1). | P2a, F13 |

## D.2 Critical path and parallelism

**Longest dependency chain:** `P0 → P1/P2a → F2 → F3 → F10`, i.e. 069, then numbers
and glossary, then relational-db, then contention, then locks. Everything else hangs
off shorter chains.

**Safely parallel once P0, P1, and P2a have landed:** F1, F5, and F8 touch disjoint
content files and different viz components. F7 needs only P2b, and F14 needs P2b plus
P4, so both can run alongside the P2a-gated work.

**Serialize these:** F3 after F2 (the auction race is a relational mechanism before it
is a pattern); F6 after F5 (partition keys are shard keys renamed); F12 after F4 and
F5 (the read and write progressions both terminate in material those specs own);
F13 after F9 (workflow semantics are queue semantics).

**Effort distribution.** Seven of the sixteen specs are XL, and they cluster in the
patterns shelf and the two-article technology briefings. If the queue needs to be cut
short, the concepts shelf (F1, F5, F8) plus F2 delivers the most coverage per spec,
because those briefings have dedicated source articles and the fewest assembled
dependencies.

## D.3 Open questions for the reviewer

Three decisions are above this map's pay grade and should be settled before the
queue is written into `specs/README.md`.

> **All three questions were resolved in review, 2026-07-30.** (1) 28th briefing —
> ADR 0006, `handling-failure` on the patterns shelf, definition of done now 28.
> (2) The six-edge cap stands; revisit only if hand-off paragraphs read thin.
> (3) Decks ship per-spec; `/playtest` owns the voice-consistency pass.
> The original questions are preserved below for the record.

1. **Does F16 get a 28th briefing, or does the reliability material distribute?**
   Appendix A promised these topics "a reliability walkthrough spec" without saying
   whether that is a Concept Library section. The v1 definition of done in CLAUDE.md
   names **27** sections, so adding a 28th changes a stated deliverable — which makes
   it an ADR-triggering decision under autonomy rule 5, not a judgment call. The
   alternative is distributing the material across `queues`, `long-running-tasks`,
   `multi-step`, and `load-balancer`, which costs the topic its coherence but keeps
   the count at 27. **Recommendation: distribute, and revisit for v2** — the backlog
   in content-pipeline §7 already lists adjacent v2 candidates.

2. **Is the six-edge cap right?** §C.3 drops three edges to respect it. If hand-off
   paragraphs read well at seven or eight, the cap should rise and those three come
   back.

3. **Do the say-it decks ship per-spec or as one pass?** This map assumes per-spec
   (the standing rule in §D.0), which keeps each briefing complete on landing. The
   alternative — one deck-authoring pass over all 26 at the end — would give more
   consistent voice across decks at the cost of leaving 26 briefings incomplete in
   the interim. **Recommendation: per-spec**, with a voice-consistency review folded
   into `/playtest`.

---

## Appendix: verification checklist

Before any fill-out spec is marked done, its **Source coverage appendix**
(content-pipeline §7) should be checkable against this map:

- [ ] Every §A item routed to this briefing in §B.2 appears in the shipped content,
      in the register §B.2 assigns it.
- [ ] Every `→` neighbor assignment has a live edge in `related.sections` with a
      why-sentence (§C).
- [ ] Every displayed number resolves to a `numbers.ts` id with a derivation (§B.4).
- [ ] Every jargon word is a `<Term>` with a glossary entry carrying the full
      speakable contract (§B.3).
- [ ] The say-it deck exists, is 5–8 cards, and its traps draw on the `[GROUND]`
      corrections in §B.2.
- [ ] Nothing waived in §B.6 has crept back in, and nothing new is silently dropped —
      a new waiver means an edit to §B.6, not an omission.
- [ ] No sentence in the shipped content mirrors source phrasing. The superset is of
      information, never of wording.
