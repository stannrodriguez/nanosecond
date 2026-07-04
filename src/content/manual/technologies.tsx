// Key Technologies shelf (11) — the parts you reach for, and the physics each
// one is buying you out of. Contract: docs/content-pipeline.md §7.

import type { ReactNode } from 'react'
import { C } from '../../theme'
import { Term as T } from '../../ui/Term'
import { Slidey, Toggler, Stepper } from '../../ui/viz'
import type { ManualSection } from './types'

const line = (label: string, val: ReactNode, col: string) => (
  <p style={{ margin: '4px 0' }}>
    <b style={{ color: col }}>{label}</b> {val}
  </p>
)

export const TECHNOLOGIES_SECTIONS: ManualSection[] = [
  {
    id: 'relational-db',
    shelf: 'technologies',
    title: 'Relational databases',
    thesis: 'One primary holds the truth — so how do you scale reads off it?',
    body: (
      <>
        <p>
          A relational database (Postgres, MySQL) is the default source of truth: <T k="acid">ACID</T> transactions, a{' '}
          <T k="join">join</T> engine, and a <T k="wal">write-ahead log</T> that makes every commit <T k="durable">durable</T>.
          That fsync bounds one primary to ~8,000 <T k="write">writes</T>/s. You scale <T k="read">reads</T> by
          photocopying: each <T k="replica">read replica</T> streams the primary's changes and serves reads.
        </p>
        <p style={{ color: C.dim }}>
          Drag the replica count: reads scale linearly, writes stay flat (copies don't help writes). The fine print is{' '}
          <T k="replag">replication lag</T> — every replica read is a read of the recent past, and after the primary dies a{' '}
          <T k="failover">failover</T> stalls writes for seconds.
        </p>
      </>
    ),
    viz: (
      <Slidey
        label="read replicas"
        min={0}
        max={8}
        step={1}
        init={2}
        accent={C.storage}
        fmt={(v) => `${v} replica${v === 1 ? '' : 's'}`}
        compute={(v) => {
          const readCap = 30_000 + v * 20_000
          return {
            headline: (
              <>
                ~{(readCap / 1000).toFixed(0)}k reads/s · ~8k writes/s
              </>
            ),
            caption:
              'Reads scale with replicas (+~20k QPS each). Writes stay pinned to the single primary — the only fixes there are sharding or a queue.',
            bars: [
              { label: 'read cap', frac: readCap / 200_000, col: C.mem, tag: `${(readCap / 1000).toFixed(0)}k` },
              { label: 'write cap', frac: 8_000 / 200_000, col: C.alert, tag: '8k' },
            ],
          }
        }}
      />
    ),
    simplifies:
      'Treats replicas as adding fixed read capacity with zero lag cost; real replicas lag under load, and cross-shard joins/transactions are the wall this omits.',
    related: { toys: ['replag'], terms: ['acid', 'join', 'wal', 'durable', 'replica', 'replag', 'failover', 'read', 'write'], sections: ['indexing', 'scaling-reads', 'cap'] },
    feltIn: { note: <>Push writes past a replica’s apply rate, then read your own comment.</>, to: '/lab/replag', cta: 'play REPLICATION LAG' },
  },
  {
    id: 'nosql-db',
    shelf: 'technologies',
    title: 'NoSQL databases',
    thesis: 'What do you give up to make writes and scale-out cheap?',
    body: (
      <>
        <p>
          <T k="nosql">NoSQL</T> is not one thing — it's a family that trades the relational <T k="join">join</T> and strict{' '}
          <T k="acid">ACID</T> for horizontal scale and a data model shaped to one access pattern. Pick your query below.
          The rule that unites them: you <T k="denormalization">denormalize</T> so every read is a single-key lookup, and you
          design the <T k="shard">partition key</T> before you write a line of code.
        </p>
        <p style={{ color: C.dim }}>
          The cost is generality. Cross-entity queries a SQL join would do for free become a <T k="gsi">secondary index</T>{' '}
          (more writes) or an app-side merge, and many stores default to eventual <T k="consistency">consistency</T>. Reach
          for NoSQL when the access pattern is known and the scale is real — not because relational "doesn't scale".
        </p>
      </>
    ),
    viz: (
      <Toggler
        options={[
          { id: 'kv', label: 'key → value', col: C.mem },
          { id: 'doc', label: 'document', col: C.net },
          { id: 'wide', label: 'wide-column', col: C.compute },
        ]}
        initial="kv"
      >
        {(id) => (
          <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
            {id === 'kv' && (
              <>
                {line('Redis, DynamoDB:', 'get/put by one key. O(1), no query engine.', C.mem)}
                <p style={{ color: C.dim, margin: '4px 0' }}>Best for sessions, counters, caches. Worst for "find all X where…".</p>
              </>
            )}
            {id === 'doc' && (
              <>
                {line('MongoDB:', 'store a whole nested JSON document per entity.', C.net)}
                <p style={{ color: C.dim, margin: '4px 0' }}>Best for self-contained aggregates (an order + its lines). Worst for data queried many ways.</p>
              </>
            )}
            {id === 'wide' && (
              <>
                {line('Cassandra:', 'rows keyed by (partition, clustering) for range scans within a key.', C.compute)}
                <p style={{ color: C.dim, margin: '4px 0' }}>Best for time-series and feeds. Worst when you don’t know the query up front.</p>
              </>
            )}
          </div>
        )}
      </Toggler>
    ),
    simplifies:
      'Collapses dozens of real engines into three archetypes; modern databases blur the lines (document stores add transactions, SQL adds JSON).',
    related: { toys: ['hotpartition'], terms: ['nosql', 'join', 'acid', 'denormalization', 'shard', 'gsi', 'consistency'], sections: ['data-modeling', 'sharding'] },
    feltIn: { note: <>Taste tests pit SQL against NoSQL under stated requirements.</>, to: '/review/taste', cta: 'try a Taste Test' },
  },
  {
    id: 'blob-storage',
    shelf: 'technologies',
    title: 'Blob storage',
    thesis: 'Where do the big bytes go, and why never in the database?',
    body: (
      <>
        <p>
          Object storage (S3, GCS) holds <T k="blob">blobs</T> — images, video, backups — at ~$0.02/GB/mo, cheaper than any
          block disk and effectively infinite. Putting a 4&nbsp;MB image in a database row instead bloats the
          <T k="btree">B-tree</T>, wrecks the cache, and costs ~4× more. Drag the volume below to feel the gap.
        </p>
        <p style={{ color: C.dim }}>
          The pattern: store the blob in object storage, store only its key in the database, and serve it through a{' '}
          <T k="cdn">CDN</T> so the bytes never round-trip your servers. Uploads use a <T k="presigned">presigned URL</T> so
          the client writes straight to storage. The number that bites is <b>egress</b> (~$0.09/GB out) — which is exactly
          why the CDN pays for itself.
        </p>
      </>
    ),
    viz: (
      <Slidey
        label="data stored"
        min={1}
        max={1000}
        step={1}
        init={100}
        accent={C.storage}
        fmt={(v) => `${v.toLocaleString()} TB`}
        compute={(v) => {
          const gb = v * 1000
          const blob = gb * 0.02
          const db = gb * 0.08 // block storage ~4×, replicated
          return {
            headline: (
              <>
                object ≈ ${blob.toLocaleString()}/mo · in-DB ≈ ${db.toLocaleString()}/mo
              </>
            ),
            caption:
              'Same bytes, ~4× the cost inside a replicated database — before you count the ruined cache hit rate and slower queries.',
            bars: [
              { label: 'object store', frac: blob / (db || 1), col: C.mem, tag: `$${blob.toLocaleString()}` },
              { label: 'in the DB', frac: 1, col: C.alert, tag: `$${db.toLocaleString()}` },
            ],
          }
        }}
      />
    ),
    simplifies:
      'Uses list storage prices only; ignores request charges, retrieval tiers (Glacier), and that egress — not storage — is usually the line item that hurts.',
    related: { toys: [], terms: ['blob', 'presigned', 'cdn', 'btree'], sections: ['large-blobs', 'cdn'] },
    feltIn: { note: <>Builder scenarios price storage and egress against a monthly budget.</>, to: '/builder', cta: 'open the Builder' },
  },
  {
    id: 'search-db',
    shelf: 'technologies',
    title: 'Search-optimized databases',
    thesis: 'Why can’t your primary database do "search for a word"?',
    body: (
      <>
        <p>
          A <T k="index">B-tree index</T> finds rows by a prefix of a value; it can't find every document <i>containing</i> a
          word without scanning. Toggle below: a <span className="mono">LIKE '%term%'</span> query is a full scan, while a
          search engine (Elasticsearch, Lucene) precomputes an <T k="invertedindex">inverted index</T> — word → list of
          documents — so a query is a lookup and a merge.
        </p>
        <p style={{ color: C.dim }}>
          You pay at write time (tokenizing and indexing every document) and in freshness: the search index is a separate
          system, usually fed from the database's own <T k="cdc">change-data-capture</T> stream, so it is eventually
          consistent. Search is a specialized read replica, not a replacement for your source of truth.
        </p>
      </>
    ),
    viz: (
      <Toggler
        options={[
          { id: 'scan', label: "LIKE '%term%'", col: C.alert },
          { id: 'inv', label: 'inverted index', col: C.mem },
        ]}
        initial="scan"
      >
        {(id) =>
          id === 'scan' ? (
            <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
              {line('Full scan:', 'read every row, test the substring. Linear in table size, no ranking.', C.alert)}
              <p style={{ color: C.dim, margin: '4px 0' }}>10M docs → 10M reads. And "close matches" or typo tolerance are impossible.</p>
            </div>
          ) : (
            <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
              {line('Inverted index:', '"latency" → [doc 3, doc 91, …]. The lookup is O(matches), pre-ranked by relevance.', C.mem)}
              <p style={{ color: C.dim, margin: '4px 0' }}>Built at write time; kept in sync via CDC. Fast reads, extra write + freshness cost.</p>
            </div>
          )
        }
      </Toggler>
    ),
    simplifies:
      'Ignores that Postgres has real full-text and trigram indexes; the point is the inverted-index mechanism, not that you always need a separate cluster.',
    related: { toys: [], terms: ['invertedindex', 'index', 'cdc', 'consistency'], sections: ['indexing', 'relational-db'] },
    feltIn: { note: <>Estimation drills translate "10M docs" into the reads a scan would cost.</>, to: '/drills/session', cta: 'run some drills' },
  },
  {
    id: 'api-gateway',
    shelf: 'technologies',
    title: 'API gateway',
    thesis: 'What belongs at the front door, before any service runs?',
    body: (
      <>
        <p>
          An <T k="apigateway">API gateway</T> is the single front door in front of many services. Scrub what it does per{' '}
          <T k="request">request</T>
          before your business logic sees it: terminate <T k="tls">TLS</T>, authenticate, <T k="ratelimit">rate-limit</T>,
          then route (and sometimes aggregate several backend calls into one response).
        </p>
        <p style={{ color: C.dim }}>
          Concentrating these cross-cutting concerns means every service doesn't re-implement auth and limiting — but the
          gateway becomes a critical path and a potential bottleneck, so it stays thin and often pairs a{' '}
          <T k="breaker">circuit breaker</T> and a <T k="bulkhead">bulkhead</T> per downstream, with a{' '}
          <T k="timeout">timeout</T> on every call. It is not a <T k="lb">load balancer</T>: the LB spreads load across
          identical boxes; the gateway makes policy decisions about the request itself.
        </p>
      </>
    ),
    viz: (
      <Stepper
        accent={C.net}
        nodes={['client', 'gateway', 'auth', 'limiter', 'service']}
        steps={[
          { active: [0, 1], edge: [0, 1], cap: <>A request arrives. TLS terminates here, once, instead of at every service.</> },
          { active: [1, 2], edge: [1, 2], cap: <>Authenticate: verify the token. Anonymous or invalid requests die at the door.</> },
          { active: [1, 3], edge: [1, 3], cap: <>Rate-limit: over quota? Return a clean 429 before consuming any backend capacity.</> },
          { active: [1, 4], edge: [1, 4], cap: <>Route to the right service — or fan out to several and aggregate the reply.</> },
          { active: [4], cap: <>Only now does business logic run, on a request already authenticated and shaped.</> },
        ]}
      />
    ),
    simplifies:
      'Shows a linear happy path; real gateways also do request/response transformation, canary routing, and observability, and must be made highly available themselves.',
    related: { toys: [], terms: ['apigateway', 'request', 'tls', 'ratelimit', 'breaker', 'lb'], sections: ['load-balancer', 'api-design'] },
    feltIn: { note: <>On-Call runs hand you rate limiters and breakers as relics.</>, to: '/on-call', cta: 'start an On-Call run' },
  },
  {
    id: 'load-balancer',
    shelf: 'technologies',
    title: 'Load balancer',
    thesis: 'Why is 80% utilization the real 100%?',
    body: (
      <>
        <p>
          A <T k="lb">load balancer</T> spreads requests across interchangeable <T k="appserver">app servers</T> so any one
          can die unnoticed — and it's where you watch <T k="util">utilization</T>. Drag it: waiting time grows like
          1/(1−u), gentle at 50%, vertical past the ~80% knee. That knee is why every scaling rule fires at 70–80%, not
          100%.
        </p>
        <p style={{ color: C.dim }}>
          The same queue math governs the database <T k="connpool">connection pool</T> behind each app server — a small,
          shared set of connections that requests wait for. You're judged at the tail: <T k="p99">p99 latency</T>, not the
          average — 99 fast requests hide one 3-second disaster, and your heaviest users hit it daily. Say the promise out
          loud: "<T k="sla">p99 under 200 ms</T> at peak, steady-state near 70% for burst headroom." That sentence is half
          the interview.
        </p>
      </>
    ),
    viz: (
      <Slidey
        label="utilization"
        min={10}
        max={98}
        step={1}
        init={70}
        accent={C.compute}
        fmt={(v) => `${v}%`}
        compute={(v) => {
          const u = v / 100
          const wait = 1 / (1 - u) // relative queueing delay
          return {
            headline: (
              <>
                queue wait ≈ {wait.toFixed(1)}× the service time
              </>
            ),
            caption:
              v >= 80
                ? 'Past the knee: a small traffic bump now sends latency vertical. This is where systems fall over.'
                : v >= 65
                  ? 'The healthy cruising band — enough slack to absorb a clump of arrivals.'
                  : 'Comfortable, but you are paying for idle capacity. Cost is a graded skill too.',
            bars: [
              { label: 'utilization', frac: u, col: v >= 80 ? C.alert : C.compute, tag: `${v}%` },
              { label: 'wait (rel.)', frac: Math.min(wait / 20, 1), col: C.alert, tag: `${wait.toFixed(1)}×` },
            ],
          }
        }}
      />
    ),
    simplifies:
      'An M/M/1 caricature (one server, random arrivals); real fleets have many servers and admission control, but the knee only sharpens with retries.',
    related: { toys: ['queue', 'connpool'], terms: ['lb', 'appserver', 'util', 'p99', 'sla', 'backlog'], sections: ['api-gateway', 'scaling-reads'] },
    feltIn: { note: <>Drag utilization and watch waiting — not throughput — explode.</>, to: '/lab/queue', cta: 'play THE QUEUE' },
  },
  {
    id: 'queues',
    shelf: 'technologies',
    title: 'Queues',
    thesis: 'How does a durable waiting line survive a worker crashing?',
    body: (
      <>
        <p>
          A <T k="queue">queue</T> (SQS, RabbitMQ) sits between "accept the write" and "process it": the app appends in ~1 ms
          and answers "got it", while <T k="worker">workers</T> drain the line at a pace the database survives. It absorbs a{' '}
          <T k="burst">burst</T> by buying time instead of capacity. Scrub one message's life below.
        </p>
        <p style={{ color: C.dim }}>
          The machinery is all crash insurance. A <T k="visibility">visibility timeout</T> hides a message while a worker
          holds it and resurrects it if the worker dies — so delivery is <T k="atleastonce">at-least-once</T> (true{' '}
          <T k="exactlyonce">exactly-once</T> is just at-least-once plus idempotency) and consumers must be{' '}
          <T k="idempotent">idempotent</T>. After N failures the message lands in a <T k="dlq">dead-letter queue</T>{' '}
          instead of clogging the line while a <T k="backlog">backlog</T> grows behind it.
        </p>
      </>
    ),
    viz: (
      <Stepper
        accent={C.compute}
        nodes={['producer', 'queue', 'worker', 'DB', 'DLQ']}
        steps={[
          { active: [0, 1], edge: [0, 1], cap: <>Producer appends the message and returns immediately. ~1 ms, no waiting on the DB.</> },
          { active: [1, 2], edge: [1, 2], cap: <>A worker receives it — the message is now hidden by a visibility timeout, not deleted.</> },
          { active: [2, 3], edge: [2, 3], cap: <>Worker writes to the DB and deletes the message. Done, exactly the happy path.</> },
          { active: [1, 2], edge: [1, 2], cap: <>But if the worker crashes, the timeout expires and the message reappears — at-least-once.</> },
          { active: [1, 4], edge: [1, 4], cap: <>After N failed attempts it moves to the DLQ: your forensic record, not a clogged line.</> },
        ]}
      />
    ),
    simplifies:
      'One queue, one worker; real systems tune visibility timeouts against processing time and run many competing consumers with ordering caveats.',
    related: { toys: ['backpressure'], terms: ['queue', 'worker', 'visibility', 'atleastonce', 'idempotent', 'dlq', 'backlog', 'burst'], sections: ['long-running-tasks', 'streams'] },
    feltIn: { note: <>A fast producer, a slow consumer, and a buffer that has to choose.</>, to: '/lab/backpressure', cta: 'play BACKPRESSURE' },
  },
  {
    id: 'streams',
    shelf: 'technologies',
    title: 'Streams / event sourcing',
    thesis: 'What if the log of changes were the source of truth?',
    body: (
      <>
        <p>
          A queue deletes a message once it's consumed. A <T k="stream">stream</T> (Kafka) keeps an ordered, replayable log
          and lets many independent consumers read it at their own offset — one broker handles ~1,000,000 msgs/s because it
          only ever appends sequentially. Toggle the two below.
        </p>
        <p style={{ color: C.dim }}>
          <T k="eventsourcing">Event sourcing</T> takes this to its conclusion: store the events, not the current state, and
          derive every view by replaying them. The same <T k="cdc">change-data-capture</T> feed can fan a single write out to
          a search index, a cache, and a warehouse — one source of truth, many eventually-consistent projections. The cost:
          you now reason about a <T k="backlog">consumer backlog</T> and replay, not just rows.
        </p>
      </>
    ),
    viz: (
      <Toggler
        options={[
          { id: 'queue', label: 'queue (consume + delete)', col: C.compute },
          { id: 'stream', label: 'stream (retained log)', col: C.net },
        ]}
        initial="queue"
      >
        {(id) =>
          id === 'queue' ? (
            <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
              {line('Queue:', 'one consumer group; a message is gone once acked. Great for work to be done once.', C.compute)}
              <p style={{ color: C.dim, margin: '4px 0' }}>Can’t replay, can’t add a second independent reader after the fact.</p>
            </div>
          ) : (
            <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
              {line('Stream:', 'the log is retained. New consumers can start from offset 0 and replay all of history.', C.net)}
              <p style={{ color: C.dim, margin: '4px 0' }}>Search, cache, and warehouse each read the same log at their own pace.</p>
            </div>
          )
        }
      </Toggler>
    ),
    simplifies:
      'Ignores retention limits, partition ordering (order holds only within a partition), and the operational weight of running Kafka.',
    related: { toys: ['disk'], terms: ['stream', 'eventsourcing', 'cdc', 'backlog'], sections: ['queues', 'multi-step'] },
    feltIn: { note: <>Estimation drills size a broker at a million sequential appends/s.</>, to: '/drills/session', cta: 'run some drills' },
  },
  {
    id: 'distributed-locks',
    shelf: 'technologies',
    title: 'Distributed locks',
    thesis: 'How do many machines agree only one holds the lock — safely?',
    body: (
      <>
        <p>
          When only one worker may act at a time (charge a card once, run one cron), you need a <T k="distlock">distributed
          lock</T>. It's a <T k="lease">lease</T>: hold it for a bounded time, renew to keep it, and it auto-expires if you
          crash so the system can't deadlock. Scrub the handoff below.
        </p>
        <p style={{ color: C.dim }}>
          The subtle killer is the paused holder: a GC pause or network blip lets your lease expire while you still <i>think</i>
          you own it. The fix is a fencing token — a monotonically increasing number the resource checks, rejecting the
          stale holder. Because a lock is agreement among machines, correct implementations lean on <T k="consensus">consensus</T>
          / a <T k="quorum">quorum</T> (etcd, ZooKeeper), not a single Redis key.
        </p>
      </>
    ),
    viz: (
      <Stepper
        accent={C.storage}
        nodes={['node A', 'lock (lease)', 'node B', 'resource']}
        steps={[
          { active: [0, 1], edge: [0, 1], cap: <>Node A acquires the lease with fencing token #7 and starts working.</> },
          { active: [0], cap: <>Node A stalls — a long GC pause. It still believes it holds the lock.</> },
          { active: [1, 2], edge: [1, 2], cap: <>The lease expires; node B acquires it with token #8 and begins.</> },
          { active: [0, 3], edge: [0, 3], cap: <>Node A wakes and writes with token #7 — the resource rejects it: stale, less than #8.</> },
          { active: [2, 3], edge: [2, 3], cap: <>Only node B (token #8) is allowed through. Fencing turned a race into a safe rejection.</> },
        ]}
      />
    ),
    simplifies:
      'Abstracts the consensus store behind "lock"; a correct lock also needs clock-skew tolerance and the resource itself must honor fencing tokens.',
    related: { toys: ['consensus'], terms: ['distlock', 'lease', 'consensus', 'quorum'], sections: ['contention', 'cap'] },
    feltIn: { note: <>Flaw puzzles hide missing fencing and double-processing bugs.</>, to: '/review/flaw', cta: 'find the flaw' },
  },
  {
    id: 'distributed-caches',
    shelf: 'technologies',
    title: 'Distributed caches',
    thesis: 'When one cache node dies, why don’t all your keys vanish?',
    body: (
      <>
        <p>
          One Redis node does ~100k ops/s and holds one machine's worth of RAM. To go bigger you spread keys across many
          nodes — and the mapping matters. Drag the node count: with <T k="consistenthash">consistent hashing</T>, losing or
          adding a node re-homes only ~1/N of the keys, so a scale event isn't a cache-wide <T k="stampede">stampede</T>.
        </p>
        <p style={{ color: C.dim }}>
          Distributing a <T k="cache">cache</T> reopens every caching question at scale: a hot key still pins one node
          (client-side replication of the hottest keys helps), and a node loss still drops its slice of the <T k="hitrate">hit
          rate</T> onto the database. More nodes buy capacity, not immunity.
        </p>
      </>
    ),
    viz: (
      <Slidey
        label="cache nodes"
        min={1}
        max={20}
        step={1}
        init={5}
        accent={C.mem}
        fmt={(v) => `${v} node${v === 1 ? '' : 's'}`}
        compute={(v) => {
          const cap = v * 100
          const movedPct = Math.round(100 / v)
          return {
            headline: (
              <>
                ~{cap}k ops/s · one node dies → ~{movedPct}% of keys re-home
              </>
            ),
            caption:
              'Capacity scales with nodes; consistent hashing keeps a node loss to ~1/N of keys instead of a full flush. That slice still lands on the DB until it re-warms.',
            bars: [
              { label: 'total ops/s', frac: cap / 2000, col: C.mem, tag: `${cap}k` },
              { label: 'keys moved', frac: movedPct / 100, col: C.alert, tag: `${movedPct}%` },
            ],
          }
        }}
      />
    ),
    simplifies:
      'Assumes even key distribution and per-node 100k ops/s; hot keys, big values, and network limits move the real numbers.',
    related: { toys: ['stampede', 'dram'], terms: ['cache', 'consistenthash', 'stampede', 'hitrate'], sections: ['caching', 'consistent-hashing'] },
    feltIn: { note: <>The stampede toy shows what a cold cache does to the database.</>, to: '/lab/stampede', cta: 'play TTL & STAMPEDE' },
  },
  {
    id: 'cdn',
    shelf: 'technologies',
    title: 'CDN',
    thesis: 'Why is moving data 2,000 km closer the cheapest capacity there is?',
    body: (
      <>
        <p>
          Cross-region latency is physics: NY↔SF is ~70 ms round trip in fiber, and no engineering fixes the speed of light
          in glass. A <T k="cdn">CDN</T> caches your content in hundreds of cities so users hit an edge, not your origin.
          Toggle origin-only vs edge below.
        </p>
        <p style={{ color: C.dim }}>
          The edge terminates <T k="tls">TLS</T> nearby (cutting handshake round trips), absorbs most read traffic before it
          reaches your stack, and slashes <b>egress</b> — the ~$0.09/GB internet-bound tax that quietly dominates bandwidth
          bills. It only helps cacheable responses; personalized and <T k="write">write</T> traffic still travels to you.{' '}
          <T k="dns">DNS</T> is what steers a user to the nearest edge.
        </p>
      </>
    ),
    viz: (
      <Toggler
        options={[
          { id: 'origin', label: 'origin only', col: C.alert },
          { id: 'edge', label: 'CDN edge', col: C.net },
        ]}
        initial="origin"
      >
        {(id) =>
          id === 'origin' ? (
            <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
              {line('Every request crosses the country:', '~70 ms RTT + a full TLS handshake, every time.', C.alert)}
              <p style={{ color: C.dim, margin: '4px 0' }}>Origin serves 100% of reads and pays egress on every byte. Distant users feel it most.</p>
            </div>
          ) : (
            <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
              {line('Edge answers nearby:', '~5–20 ms, TLS terminated locally, cache hit never touches origin.', C.net)}
              <p style={{ color: C.dim, margin: '4px 0' }}>A 90% edge hit rate means origin sees 10% of reads and 10% of the egress bill.</p>
            </div>
          )
        }
      </Toggler>
    ),
    simplifies:
      'Ignores cache invalidation (the hard part), origin-shield tiers, and that dynamic/personalized responses can’t be edge-cached without care.',
    related: { toys: ['light', 'pipe'], terms: ['cdn', 'tls', 'dns', 'write', 'hitrate'], sections: ['networking', 'blob-storage'] },
    feltIn: { note: <>Watch how far light gets before a cross-region round trip ends.</>, to: '/lab/light', cta: 'play RACE LIGHT' },
  },
]
