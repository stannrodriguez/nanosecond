// The Named Technologies lens (ADR 0007, spec 089). Nine product pages that
// CONSOLIDATE what the library already teaches about the technologies
// interviewers name — they are a lens, not briefings. Each entry AUTHORS only
// an identity block, its home briefing, and a where-it-lives list with phrased
// reasons (edges.ts discipline: a link is a claim). Everything else on the
// page — glossary entries, numbers, Lab toys — is DERIVED by alias scan below,
// so the fill-out specs (coverage-map F2–F16) enrich these pages for free.

import type { ReactNode } from 'react'
import { Term as T } from '../ui/Term'
import { GLOSSARY, type GlossaryEntry } from './glossary'
import { NUMBERS, type NumberEntry } from './numbers'
import { BRIEFINGS } from './briefings'
import { TOYS, type ToyEntry } from './toys'

export interface Product {
  id: string
  name: string
  /** word-boundary matched (case-insensitive) by the collectors below; include
   *  the short forms number ids use (pg, ddb, es, zk) — the schema test's
   *  alias-rot guard fails the suite if a scan goes empty. */
  aliases: string[]
  /** one line under the name in the index strip */
  tagline: string
  /** 2–4 sentences, glossary-def register: what it is, why it is shaped that
   *  way, and the consequence — every jargon word a <Term> */
  what: ReactNode
  /** ONE interview-ready sentence in the player's voice (glossary `say` rules) */
  say: string
  /** the capability briefing that owns this product (coverage-map primary destination) */
  home: string
  /** every briefing carrying this product's material, home first, each with the
   *  reason the trip is worth making (coverage-map Destination lines) */
  liveIn: { section: string; how: string }[]
}

export const PRODUCTS: Product[] = [
  {
    id: 'redis',
    name: 'Redis',
    aliases: ['Redis'],
    tagline: 'in-memory data structures as a service',
    what: (
      <>
        Redis puts strings, hashes, sorted sets, and streams straight in RAM behind a single-threaded event loop, so
        commands finish one at a time in microseconds with no locks to untangle. Speed is the product and volatility is
        the fine print: <T k="replica">replication</T> is asynchronous and persistence is optional, which makes Redis a
        performance layer rather than your system of record. In cluster mode it skips a hash ring for 16,384 fixed{' '}
        <T k="hashslot">hash slots</T>, turning rebalancing into moving slots and routing into a simple table lookup.
        That honest bargain (blazing fast because it lives in RAM, forgetful for the exact same reason) settles which
        jobs belong here and which do not.
      </>
    ),
    say: 'Redis is a single-threaded in-memory data-structure server with microsecond latency and asynchronous replication, so I reach for it as a performance layer and never as the system of record.',
    home: 'distributed-caches',
    liveIn: [
      { section: 'distributed-caches', how: 'its home briefing: RAM speed as a service, covering cache-aside, eviction, TTLs, and hot keys' },
      { section: 'consistent-hashing', how: "Redis Cluster's 16,384 fixed hash slots, reaching the hash ring's goal with a slot table instead" },
      { section: 'distributed-locks', how: 'why a single Redis key is not a safe lock on its own, and what fencing tokens actually fix' },
      { section: 'queues', how: 'lists and sorted sets as a starter queue, and where a dedicated broker starts earning its keep' },
      { section: 'streams', how: 'how Redis Streams borrow the retained-log model for lightweight fan-out' },
      { section: 'contention', how: 'atomic single-threaded commands (INCR, SETNX) as the cheapest place to settle a race' },
      { section: 'proximity', how: "geo commands built on geohash-encoded sorted sets, answering 'what is near me' from RAM" },
      { section: 'api-gateway', how: 'why the rate-limit counter behind most gateways is just a Redis INCR paired with a TTL' },
    ],
  },
  {
    id: 'elasticsearch',
    name: 'Elasticsearch',
    aliases: ['Elasticsearch', 'es'],
    tagline: 'the query shape a B-tree cannot answer',
    what: (
      <>
        Elasticsearch is built around the <T k="invertedindex">inverted index</T>: text is analyzed into terms, terms
        point back to matching documents, and <T k="relevance">relevance</T> scoring ranks the results. That unlocks
        full-text "contains" queries, the exact lookup shape a <T k="btree">B-tree</T> cannot serve. Under the hood it
        runs as a distributed store of immutable <T k="segment">segments</T>, where nothing changes in place, an update
        writes a <T k="tombstone">tombstone</T> plus a fresh copy, and background merges keep read cost from drifting
        upward. Because it almost always runs as a secondary store fed by <T k="cdc">CDC</T> from your primary database,
        it is eventually consistent by design and never the place to ask for the latest source-of-truth value.
      </>
    ),
    say: 'Elasticsearch handles the queries a B-tree cannot, like ranked full-text contains over an inverted index of immutable segments, running as a CDC-fed secondary store rather than the source of truth.',
    home: 'search-db',
    liveIn: [
      { section: 'search-db', how: 'its home briefing: the inverted index derived from scratch, doc values, segments, and two-phase queries' },
      { section: 'indexing', how: 'the boundary line where sorted B-tree order runs out and an inverted index takes over' },
      { section: 'proximity', how: "geo points and geo shapes, treating 'near me' as a filtered, ranked search query" },
      { section: 'streams', how: 'kept fresh by CDC, since the pipeline feeding a search cluster is really a stream job' },
      { section: 'cap', how: 'availability chosen on purpose: refresh intervals make results eventually consistent, and the design owns that lag' },
      { section: 'api-design', how: 'search-after cursors, because deep offset pagination falls apart under scatter-gather' },
    ],
  },
  {
    id: 'kafka',
    name: 'Kafka',
    aliases: ['Kafka'],
    tagline: 'the append-only log, packaged as a service',
    what: (
      <>
        Kafka is an append-only, partitioned, retained log: producers append to the tail, brokers write sequentially
        without random disk seeks, and each consumer tracks its own <T k="offset">offset</T> because reading never
        deletes a message. Ordering holds strictly inside a single partition, which puts real weight on the{' '}
        <T k="partitionkey">partition key</T>: group what must stay ordered, spread everything else, and remember that
        one hot key pins one member of a <T k="consumergroup">consumer group</T> while its peers sit idle. Pairing
        retention with consumer-held offsets is the real superpower, letting a brand-new service hired next quarter
        replay history that a deleting <T k="queue">queue</T> already threw away.
      </>
    ),
    say: 'Kafka is a partitioned append-only log with per-partition ordering and consumer-tracked offsets, pairing sequential-disk speed with retention so it handles both queue bursts and historical replay.',
    home: 'streams',
    liveIn: [
      { section: 'streams', how: 'its home briefing: offsets, consumer groups, replay, and the retained log as a core primitive' },
      { section: 'queues', how: 'co-primary on queue duty: buffering bursts and decoupling producers from slower consumers' },
      { section: 'scaling-writes', how: 'the shock absorber sitting in front of a database that cannot swallow a sudden write spike' },
      { section: 'long-running-tasks', how: "the durable handoff between 'request accepted' and 'background work done'" },
      { section: 'multi-step', how: 'the backbone for event choreography, where each step is a consumer and each event states a fact' },
    ],
  },
  {
    id: 'api-gateway',
    name: 'API Gateway',
    aliases: ['API gateway', 'gateway'],
    tagline: 'the single front door (a role, not a vendor)',
    what: (
      <>
        This is the one entry here that is a capability wearing a product name: Kong, Apigee, AWS API Gateway, and a
        well-tuned nginx config all fill the same seat. An <T k="apigateway">API gateway</T> stands as the single front
        door for routing, authentication, <T k="ratelimit">rate limiting</T>, and <T k="tls">TLS</T> termination, so
        cross-cutting policy gets built once instead of once per backend service. In an interview, the trap is lingering
        too long on the porch: introduce the gateway in one crisp sentence and walk straight inside, because the real
        design decisions live behind it.
      </>
    ),
    say: 'An API gateway is the single front door that handles routing, auth, and rate limiting once so individual services do not repeat policy, which is why I name it in one sentence and move on.',
    home: 'api-gateway',
    liveIn: [
      { section: 'api-gateway', how: 'its home briefing: the step-by-step request trace and what belongs (and does not belong) at the front door' },
      { section: 'load-balancer', how: 'the sibling that spreads traffic instead of enforcing policy, often sharing one box at small scale' },
      { section: 'api-design', how: 'the gateway can only enforce what your API contract makes explicit: versions, auth scopes, and limits' },
      { section: 'cdn', how: 'the layer standing in front of the front door, since cacheable static responses should never reach the gateway' },
    ],
  },
  {
    id: 'cassandra',
    name: 'Cassandra',
    aliases: ['Cassandra'],
    tagline: 'leaderless, write-heavy wide-column scale',
    what: (
      <>
        Cassandra is a wide-column store built for heavy write throughput and always-on availability: every node accepts
        writes through an <T k="lsm">LSM</T> engine (<T k="memtable">memtables</T> flushing sequentially to{' '}
        <T k="sstable">SSTables</T>), keys land on a <T k="consistenthash">consistent-hash</T> ring split into{' '}
        <T k="vnode">virtual nodes</T>, and replicas coordinate with <T k="quorum">quorum</T> math instead of a single
        leader. The tradeoff is the data model. You design tables query-first around a{' '}
        <T k="partitionkey">partition key</T> and <T k="clusteringkey">clustering key</T>, giving up joins, ad-hoc
        queries, and cross-partition transactions. Pick it when write scale and availability matter more than query
        flexibility, and model every table around its query, because here the query is the schema.
      </>
    ),
    say: 'Cassandra is a leaderless wide-column store combining LSM writes, consistent-hash placement, and tunable quorums to stay write-fast and available in exchange for query-first data modeling.',
    home: 'nosql-db',
    liveIn: [
      { section: 'nosql-db', how: 'its home briefing: the partition-key plus clustering-key model and query-first table design' },
      { section: 'sharding', how: 'your partition key IS your shard key, which means hotspots are baked in at schema time' },
      { section: 'consistent-hashing', how: 'the consistent-hash ring with virtual nodes, running at real production scale' },
      { section: 'cap', how: 'the availability poster child, where R + W > N quorum math tunes the dial between consistency and availability' },
      { section: 'scaling-writes', how: 'near-linear write scale from adding nodes, the direct payoff of leaderless LSM storage' },
      { section: 'indexing', how: 'why secondary indexes become a scatter-gather trap here, and why one table per query wins' },
      { section: 'data-modeling', how: 'deliberate denormalization: duplicate tables that your writer keeps in sync' },
    ],
  },
  {
    id: 'dynamodb',
    name: 'DynamoDB',
    aliases: ['DynamoDB', 'ddb'],
    tagline: 'managed, metered partition-key storage',
    what: (
      <>
        DynamoDB is AWS's managed key-value and wide-column store, built on the same modeling core as Cassandra (
        <T k="partitionkey">partition key</T>, sort key, query-first tables) while selling capacity by the meter. Reads
        and writes are billed in RCUs and WCUs, items top out at 400 KB, and every partition carries a fixed throughput
        budget, so a <T k="hotpartition">hot partition</T> does not merely slow down: it gets throttled. Managed extras
        round out the pitch. A <T k="gsi">GSI</T> is literally a second table AWS maintains for you, DynamoDB Streams
        turn table writes into a <T k="cdc">CDC</T> feed, and transactions work inside strict item limits. In an
        interview it is the "I do not want to operate Cassandra" pick, with pricing acting as a real design constraint.
      </>
    ),
    say: 'DynamoDB is a managed partition-key store with capacity metered per partition in RCUs and WCUs, a 400 KB item cap, and throttled hot keys, making data modeling and cost modeling the same job.',
    home: 'nosql-db',
    liveIn: [
      { section: 'nosql-db', how: 'co-primary with Cassandra: the same query-first modeling, handed off as a managed, metered service' },
      { section: 'indexing', how: 'a GSI is a second table behind the scenes, meaning every write pays twice and carries index lag' },
      { section: 'sharding', how: 'capacity caps live per partition rather than per table, pitting adaptive capacity against hot keys' },
      { section: 'cap', how: 'strongly consistent reads cost double in-region, while global tables trade for availability via last-writer-wins' },
      { section: 'distributed-caches', how: "DAX, the vendor's quiet admission that even DynamoDB benefits from a cache in front" },
      { section: 'streams', how: 'DynamoDB Streams turn change data capture into a checkbox, letting your table act as a stream producer' },
      { section: 'blob-storage', how: 'the 400 KB item cap draws a sharp line: big payloads live in blob storage while the table holds a pointer' },
    ],
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    aliases: ['PostgreSQL', 'Postgres', 'pg'],
    tagline: 'the default database and strongest boring pick',
    what: (
      <>
        PostgreSQL is the default database and the strongest "boring" pick in any room: <T k="acid">ACID</T>{' '}
        transactions over <T k="btree">B-tree</T> indexes and a <T k="heapfile">heap</T>, a{' '}
        <T k="wal">write-ahead log</T> that keeps commits durable and sequential, and MVCC so readers never block
        writers. A decade of mature extensions (built-in full-text search, PostGIS, JSONB) lets one engine carry most
        products through their first several years. Its ceilings are well known enough to quote as numbers: each
        connection is a process so you sit a <T k="connpool">connection pool</T> in front, single-node writes eventually
        top out, and <T k="replica">replicas</T> lag behind the primary. Naming those limits up front is what earns you
        the right to keep the architecture simple.
      </>
    ),
    say: 'PostgreSQL is my ACID B-tree-and-WAL default with MVCC and deep extensions, and I stick with it until a concrete ceiling like single-node writes, connection limits, or replica lag forces a move.',
    home: 'relational-db',
    liveIn: [
      { section: 'relational-db', how: 'its home briefing: the write path, read replicas, isolation levels, and practical ceilings' },
      { section: 'indexing', how: 'B-trees alongside composite, partial, and covering indexes, plus what each extra index taxes the write path' },
      { section: 'contention', how: 'row locks, SELECT FOR UPDATE, isolation levels, and write skew: the whole escalation ladder lives here' },
      { section: 'scaling-reads', how: 'read replicas and the read-your-own-writes bargain that comes with replication lag' },
      { section: 'scaling-writes', how: 'where the single-primary write ceiling finally bites and the sharding conversation begins' },
      { section: 'search-db', how: 'built-in full-text search: the honest middle step before spinning up a separate search cluster' },
      { section: 'proximity', how: 'PostGIS, treating geospatial queries as an index-type choice rather than a new database' },
      { section: 'cap', how: 'the consistency-first anchor: one primary that stays honest about what failover costs' },
      { section: 'data-modeling', how: 'normalization as the clean default, and denormalization as a deliberate, measured retreat' },
    ],
  },
  {
    id: 'flink',
    name: 'Flink',
    aliases: ['Flink'],
    tagline: 'stateful computation over endless streams',
    what: (
      <>
        Flink is a stateful stream processor built for continuous work over unbounded streams, handling{' '}
        <T k="windowing">windows</T>, joins, and aggregations with event-time semantics,{' '}
        <T k="watermark">watermarks</T> to decide when late data is too late, and{' '}
        <T k="checkpoint">checkpointed</T> state that keeps internal updates <T k="exactlyonce">exactly-once</T>. The
        first question it puts on the table is whether you need streaming at all: when a few minutes of delay are fine,
        a batch job is far simpler, so Flink earns its operational weight only when results must stay seconds fresh at
        scale. Its running state is both its superpower and its sharpest edge, because whatever it holds has
        to be restored after a crash and shifted during a rescale.
      </>
    ),
    say: 'Flink runs stateful computation over unbounded streams with event-time windows, watermarks for late data, and checkpointed exactly-once state when results must stay seconds fresh instead of minutes.',
    home: 'streams',
    liveIn: [
      { section: 'streams', how: 'its home briefing: windows, watermarks, and checkpoints, the compute half of the retained log' },
      { section: 'queues', how: 'sitting downstream of the broker, where consumer groups feed its parallel operators' },
      { section: 'realtime-updates', how: 'the compute stage that turns raw event firehoses into something worth pushing to users' },
      { section: 'scaling-writes', how: 'pre-aggregating inside the stream so the database writes compact summaries instead of raw events' },
      { section: 'long-running-tasks', how: 'the limiting case of background work: a job that runs indefinitely and must outlive its workers' },
      { section: 'multi-step', how: 'windowed joins and enrichment structured as pipeline stages that never terminate' },
    ],
  },
  {
    id: 'zookeeper',
    name: 'ZooKeeper',
    aliases: ['ZooKeeper', 'zk'],
    tagline: 'consensus, packaged as tiny primitives',
    what: (
      <>
        ZooKeeper is a <T k="consensus">consensus</T>-backed coordination service: a small replicated tree of znodes
        where reads stay cheap, writes pass through a <T k="quorum">quorum</T>, and two small primitives build almost
        everything else. <T k="ephemeral">Ephemeral nodes</T> disappear automatically when a client session dies, and
        watches push notifications when a znode changes. Locks, <T k="leader">leader election</T>, service registries,
        and shared config all grow straight out of those two pieces, turning process liveness into a data structure.
        ZooKeeper stays tiny and read-heavy on purpose, holding coordination metadata only, because a quorum write is
        the priciest write in the building.
      </>
    ),
    say: 'ZooKeeper is a quorum-replicated tree of tiny znodes with ephemeral nodes and watches that power locks, leader election, and membership, kept small because every consensus write is expensive.',
    home: 'distributed-locks',
    liveIn: [
      { section: 'distributed-locks', how: 'its home briefing: sequential znodes as a fair lock queue, leases, and fencing done right' },
      { section: 'cap', how: 'consistency chosen deliberately: during a network partition, the minority side stops answering' },
      { section: 'load-balancer', how: 'service discovery in action, where the registry a balancer reads is a watch on a znode tree' },
      { section: 'realtime-updates', how: 'watches as a push primitive, letting subscribers hear about changes without polling' },
      { section: 'queues', how: 'deciding which broker or consumer owns which partition is an agreement problem settled here' },
      { section: 'multi-step', how: "the coordinator's coordinator: electing a single leader for whatever engine drives the workflow" },
    ],
  },
]

export const productById = (id: string): Product | undefined => PRODUCTS.find((p) => p.id === id)

/* ---------------- derived collectors (the lens itself) ---------------- */

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const mentionRe = (p: Product) => new RegExp(`\\b(?:${p.aliases.map(escapeRe).join('|')})\\b`, 'i')

/** glossary entries whose text names the product — the scattered mentions, gathered */
export const termsFor = (p: Product): { key: string; entry: GlossaryEntry }[] => {
  const re = mentionRe(p)
  return Object.entries(GLOSSARY)
    .filter(([, e]) => re.test([e.name, e.def, e.say, e.reachFor, e.trap].filter(Boolean).join(' ')))
    .map(([key, entry]) => ({ key, entry }))
}

/** numbers.ts entries whose id or derivation names the product (ids match via their words) */
export const numbersFor = (p: Product): NumberEntry[] => {
  const re = mentionRe(p)
  return NUMBERS.filter((n) =>
    re.test([n.id.replace(/-/g, ' '), ...n.derivation, n.boundingPhysics, n.confusions].join(' '))
  )
}

/** Lab toys whose MEET IT panel names the product, with the panel's how-clause */
export const toysFor = (p: Product): { toy: ToyEntry; how: ReactNode }[] => {
  const re = mentionRe(p)
  return TOYS.flatMap((t) => {
    const hit = BRIEFINGS[t.id]?.meetIt.find((m) => re.test(m.name))
    return hit ? [{ toy: t, how: hit.how }] : []
  })
}
