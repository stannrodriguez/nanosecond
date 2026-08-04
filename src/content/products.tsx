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
    tagline: 'in-memory data structures, sold as a service',
    what: (
      <>
        An in-memory data-structure server: strings, hashes, sorted sets, and streams, all answered from RAM by a
        single-threaded event loop — commands run one at a time in microseconds, with no locks to reason about. Speed is the
        product and volatility is the fine print: <T k="replica">replication</T> is asynchronous and persistence is optional,
        so Redis is a performance layer, never the system of record. In a cluster it skips the hash ring for 16,384 fixed{' '}
        <T k="hashslot">hash slots</T>, which turns rebalancing into moving slots and routing into a table lookup. That one
        honest pairing — fast because it's RAM, forgetful because it's RAM — decides every job it should and shouldn't get.
      </>
    ),
    say: 'Redis is a single-threaded in-memory data-structure server — microsecond answers, asynchronous replication — so I use it as a performance layer, never as the system of record.',
    home: 'distributed-caches',
    liveIn: [
      { section: 'distributed-caches', how: "its home: RAM speed as a service — cache-aside, eviction, TTLs, and the hot-key problem" },
      { section: 'consistent-hashing', how: "Redis Cluster's 16,384 fixed hash slots — the ring's goal reached by a slot table instead" },
      { section: 'distributed-locks', how: 'the lone-key lock, why it is not one, and what fencing tokens actually fix' },
      { section: 'queues', how: 'lists and sorted sets as the starter queue — and the point where a real broker earns its keep' },
      { section: 'streams', how: 'Redis Streams borrow the retained-log idea for lightweight fan-out' },
      { section: 'contention', how: 'atomic single-threaded commands (INCR, SETNX) as the cheapest seat for a race' },
      { section: 'proximity', how: "geo commands: geohash-encoded sorted sets answering 'what's near me' from RAM" },
      { section: 'api-gateway', how: 'the rate-limit counter behind most gateways is a Redis INCR with a TTL' },
    ],
  },
  {
    id: 'elasticsearch',
    name: 'Elasticsearch',
    aliases: ['Elasticsearch', 'es'],
    tagline: 'the query shape B-trees cannot serve',
    what: (
      <>
        A search engine built on the <T k="invertedindex">inverted index</T>: documents are analyzed into terms, terms point
        back at documents, and <T k="relevance">relevance</T> scoring ranks the hits — full-text "contains", the one query
        shape a <T k="btree">B-tree</T> cannot serve. Underneath it is a distributed store of immutable{' '}
        <T k="segment">segments</T>: nothing is edited in place, an update is a <T k="tombstone">tombstone</T> plus a rewrite,
        and background merges keep read cost bounded. It is almost always a secondary system fed by <T k="cdc">CDC</T> from
        the source of truth — eventually consistent by design, so it never gets pointed at questions that need the current
        value.
      </>
    ),
    say: "Elasticsearch serves the queries a B-tree can't — full-text contains, ranked by relevance, from an inverted index over immutable segments — as a CDC-fed secondary system, never the source of truth.",
    home: 'search-db',
    liveIn: [
      { section: 'search-db', how: 'its home: the inverted index derived, doc values, segments, and the two-phase query' },
      { section: 'indexing', how: 'the boundary line: where sorted order runs out and the inverted index begins' },
      { section: 'proximity', how: "geo points and geo shapes: 'near me' as a filtered, ranked search problem" },
      { section: 'streams', how: 'kept fresh by CDC — the pipeline feeding a search cluster is a stream job' },
      { section: 'cap', how: 'availability chosen in practice: refresh intervals make results eventually consistent, and the design owns it' },
      { section: 'api-design', how: 'search-after cursors, because deep offset pagination collapses under scatter-gather' },
    ],
  },
  {
    id: 'kafka',
    name: 'Kafka',
    aliases: ['Kafka'],
    tagline: 'the append-only log as a product',
    what: (
      <>
        An append-only, partitioned, retained log: producers append, the broker writes sequentially and never seeks, and each
        consumer holds an <T k="offset">offset</T> it advances at its own pace — consuming deletes nothing. Ordering exists per
        partition only, so the <T k="partitionkey">partition key</T> is where design happens: pick what must stay ordered,
        spread everything else, and accept that one hot key pins one member of the <T k="consumergroup">consumer group</T>{' '}
        while its neighbors nap. Retention plus offsets is the superpower — a consumer hired next quarter can replay history
        that a deleting <T k="queue">queue</T> already threw away.
      </>
    ),
    say: 'Kafka is a partitioned append-only log with per-partition ordering and consumer-held offsets — sequential-disk physics plus retention, so it does queue work and replay work a deleting queue cannot.',
    home: 'streams',
    liveIn: [
      { section: 'streams', how: 'its home: offsets, consumer groups, replay, and the retained log as an architectural primitive' },
      { section: 'queues', how: 'co-primary: the same broker on queue duty — buffering bursts, decoupling producer from consumer' },
      { section: 'scaling-writes', how: "the shock absorber in front of a database that can't take the burst" },
      { section: 'long-running-tasks', how: "the durable hand-off between 'accepted' and 'done'" },
      { section: 'multi-step', how: 'the backbone for choreography — each step a consumer, each event a fact' },
    ],
  },
  {
    id: 'api-gateway',
    name: 'API Gateway',
    aliases: ['API gateway', 'gateway'],
    tagline: 'the single front door (a capability, not a product)',
    what: (
      <>
        The one entry in this list that is a capability wearing a product name: Kong, Apigee, AWS API Gateway, and a careful
        nginx config all answer to it. An <T k="apigateway">API gateway</T> is the single front door — routing, auth,{' '}
        <T k="ratelimit">rate limiting</T>, <T k="tls">TLS</T> termination — so cross-cutting policy is implemented once
        instead of once per service. The interview trap is enthusiasm: introduce it in one sentence and move on, because the
        decisions worth talking about live behind it.
      </>
    ),
    say: "An API gateway is the single front door doing routing, auth, and rate limiting once so services don't each reimplement policy — I name it in a sentence and move on.",
    home: 'api-gateway',
    liveIn: [
      { section: 'api-gateway', how: 'its home: the six-step request trace and what does — and does not — belong at the front door' },
      { section: 'load-balancer', how: 'the sibling that spreads traffic instead of applying policy — the two collapse into one box at small scale' },
      { section: 'api-design', how: 'the gateway can only enforce what the contract makes explicit: versions, auth scopes, limits' },
      { section: 'cdn', how: 'the layer in front of the front door — static answers should never reach the gateway at all' },
    ],
  },
  {
    id: 'cassandra',
    name: 'Cassandra',
    aliases: ['Cassandra'],
    tagline: 'leaderless writes at wide-column scale',
    what: (
      <>
        A wide-column store built for write throughput and always-on availability: every node accepts writes into an{' '}
        <T k="lsm">LSM</T> engine (<T k="memtable">memtables</T> flushing to <T k="sstable">SSTables</T>), data spreads by a{' '}
        <T k="consistenthash">consistent-hash</T> ring with <T k="vnode">virtual nodes</T>, and replicas agree by{' '}
        <T k="quorum">quorum</T> arithmetic instead of a leader. The price is the data model: tables are designed query-first
        around a <T k="partitionkey">partition key</T> and <T k="clusteringkey">clustering key</T> — no joins, no ad-hoc
        queries, no cross-partition transactions. Reach for it when write volume and availability beat flexibility, and model
        as if the query is the schema — because here it is.
      </>
    ),
    say: 'Cassandra is a leaderless wide-column store — LSM writes, consistent-hash placement, tunable quorum reads and writes — that stays available and write-fast at the cost of query-first data modeling.',
    home: 'nosql-db',
    liveIn: [
      { section: 'nosql-db', how: 'its home: the partition-key + clustering-key model and query-first table design' },
      { section: 'sharding', how: 'the partition key IS the shard key — hotspots are self-inflicted at design time' },
      { section: 'consistent-hashing', how: 'the ring with virtual nodes, live in production' },
      { section: 'cap', how: 'the availability poster child: R + W > N quorum tuning is the dial between the letters' },
      { section: 'scaling-writes', how: 'near-linear write scale by adding nodes — what the LSM engine and leaderless design buy' },
      { section: 'indexing', how: 'why secondary indexes are a trap here, and one-table-per-query is the answer' },
      { section: 'data-modeling', how: 'denormalize on purpose: duplicate tables the writer keeps in sync' },
    ],
  },
  {
    id: 'dynamodb',
    name: 'DynamoDB',
    aliases: ['DynamoDB', 'ddb'],
    tagline: 'the metered, managed partition-key store',
    what: (
      <>
        AWS's managed key-value / wide-column store with the same modeling heart as Cassandra — <T k="partitionkey">partition key</T>,
        sort key, query-first tables — but sold by the unit: reads and writes are metered as RCUs and WCUs, items cap at 400
        KB, and each partition sustains a fixed budget, so a <T k="hotpartition">hot partition</T> is not slow, it is
        throttled. Its additions are managed conveniences: a <T k="gsi">GSI</T> is literally a second table AWS keeps in sync,
        DynamoDB Streams turn the table into a <T k="cdc">CDC</T> producer, and transactions work within hard item limits. In
        an interview it is the "I don't want to operate Cassandra" answer — with pricing as a first-class design constraint.
      </>
    ),
    say: 'DynamoDB is a managed partition-key store where capacity is metered per partition — RCUs, WCUs, 400 KB items, throttled hot keys — so data modeling and cost modeling are the same activity.',
    home: 'nosql-db',
    liveIn: [
      { section: 'nosql-db', how: 'co-primary with Cassandra: the same query-first modeling, managed and metered' },
      { section: 'indexing', how: 'a GSI is a second table — every write paid twice, index lag included' },
      { section: 'sharding', how: 'the capacity cap is per partition, not per table — adaptive capacity vs the hot key' },
      { section: 'cap', how: 'consistent reads cost double in-region; global tables buy availability with last-writer-wins' },
      { section: 'distributed-caches', how: "DAX: the vendor's admission that even DynamoDB wants a cache in front" },
      { section: 'streams', how: 'DynamoDB Streams: change-data-capture as a checkbox — the table becomes a producer' },
      { section: 'blob-storage', how: 'the 400 KB item cap is the nudge: big payloads go to blob storage, the table keeps a pointer' },
    ],
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    aliases: ['PostgreSQL', 'Postgres', 'pg'],
    tagline: 'the default database, and the strongest boring answer',
    what: (
      <>
        The default database and the strongest "boring" answer in the room: <T k="acid">ACID</T> transactions over{' '}
        <T k="btree">B-tree</T> indexes and a <T k="heapfile">heap</T>, a <T k="wal">write-ahead log</T> making commits
        durable-sequential, and MVCC so readers never block writers. A decade of extensions — built-in full-text, PostGIS,
        JSONB — lets one system cover the first several years of most products. Its limits are famous enough to be numbers:
        connections are processes so you pool them behind a <T k="connpool">connection pool</T>, single-node write throughput
        has a ceiling, and <T k="replica">replicas</T> lag. Naming those limits out loud is exactly what earns the right to
        keep the answer simple.
      </>
    ),
    say: 'PostgreSQL is the ACID B-tree-plus-WAL default with MVCC and serious extensions — my starting answer until a named limit like the write ceiling, connection count, or replica lag forces something more exotic.',
    home: 'relational-db',
    liveIn: [
      { section: 'relational-db', how: 'its home: the write path, replication, isolation, and the practical ceilings' },
      { section: 'indexing', how: 'B-trees plus composite, partial, and covering indexes — and what each one costs the write path' },
      { section: 'contention', how: 'row locks, SELECT FOR UPDATE, isolation levels, write skew — the escalation ladder lives here' },
      { section: 'scaling-reads', how: 'read replicas and the read-your-writes bargain' },
      { section: 'scaling-writes', how: 'where the single-writer ceiling bites and the sharding conversation starts' },
      { section: 'search-db', how: 'built-in full-text: the honest middle step before a search cluster' },
      { section: 'proximity', how: 'PostGIS: geospatial as an index-type problem, not a new database' },
      { section: 'cap', how: 'the consistency-first counterexample: one primary, honest about what failover costs' },
      { section: 'data-modeling', how: 'normalization as the default posture, denormalization as a measured retreat' },
    ],
  },
  {
    id: 'flink',
    name: 'Flink',
    aliases: ['Flink'],
    tagline: 'stateful computation over unbounded streams',
    what: (
      <>
        A stateful stream processor: continuous computation over unbounded streams — <T k="windowing">windows</T>, joins,
        aggregations — with event-time semantics, <T k="watermark">watermarks</T> to declare lateness, and{' '}
        <T k="checkpoint">checkpointed</T> state that makes results <T k="exactlyonce">exactly-once</T> with respect to its
        own state. The honest first question it forces is whether you need it at all: if minutes of delay are acceptable, a
        batch job is the simpler answer; Flink earns its complexity only when results must be seconds fresh at scale. Its
        state is both the point and the danger — whatever it holds is what a crash must recover and a rescale must move.
      </>
    ),
    say: 'Flink is stateful stream processing — event-time windows, watermarks for lateness, checkpointed exactly-once state — for when results must be seconds fresh; if minutes are fine, batch is simpler.',
    home: 'streams',
    liveIn: [
      { section: 'streams', how: 'its home: windows, watermarks, checkpoints — the processing half of the retained log' },
      { section: 'queues', how: 'downstream of the broker: consumer groups feed its parallel operators' },
      { section: 'realtime-updates', how: 'the compute stage that turns raw events into the thing worth pushing' },
      { section: 'scaling-writes', how: 'pre-aggregation in the stream, so the database receives summaries instead of the firehose' },
      { section: 'long-running-tasks', how: 'the limiting case: a job that runs forever and must survive its workers' },
      { section: 'multi-step', how: 'windowed joins and enrichment as pipeline steps that never terminate' },
    ],
  },
  {
    id: 'zookeeper',
    name: 'ZooKeeper',
    aliases: ['ZooKeeper', 'zk'],
    tagline: 'consensus, rented out as primitives',
    what: (
      <>
        A <T k="consensus">consensus</T>-backed coordination service: a small replicated tree of znodes where reads are cheap,
        writes go through a <T k="quorum">quorum</T>, and two primitives generate everything else —{' '}
        <T k="ephemeral">ephemeral nodes</T> that vanish when their session dies, and watches that notify on change. Locks,{' '}
        <T k="leader">leader election</T>, service registries, and config all fall out of those two: liveness becomes a data
        structure. It stays deliberately tiny and read-heavy — coordination metadata only — because a quorum write is the most
        expensive write in the building.
      </>
    ),
    say: 'ZooKeeper is a quorum-replicated tree with ephemeral nodes and watches — locks, leader election, and membership fall out of those two primitives, kept small because consensus writes are expensive.',
    home: 'distributed-locks',
    liveIn: [
      { section: 'distributed-locks', how: 'its home: sequential znodes as the lock queue, leases, and fencing done right' },
      { section: 'cap', how: 'consistency chosen on purpose: during a partition the minority side stops answering' },
      { section: 'load-balancer', how: 'service discovery — the registry a balancer reads is a watch on a znode tree' },
      { section: 'realtime-updates', how: 'watches are the push primitive: subscribers learn of change without polling' },
      { section: 'queues', how: 'who owns which partition is an agreement problem, and this is where it gets settled' },
      { section: 'multi-step', how: "the coordinator's coordinator: leader election for whatever drives the workflow" },
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
