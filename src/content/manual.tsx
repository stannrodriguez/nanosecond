// Field Manual sections — plain-language briefings with small diagrams.
// JSX here is content (copy + <Term> links), not logic; spec 020 grows this
// to 10 sections.

import type { ReactNode } from 'react'
import { C } from '../theme'
import { Term as T } from '../ui/Term'

export interface ManualSection {
  id: string
  title: string
  body: ReactNode
}

function RequestFlow() {
  const stops = [
    { label: 'phone', ms: '', col: C.dim },
    { label: 'load balancer', ms: '~1 ms', col: C.net },
    { label: 'app server', ms: '~3 ms', col: C.compute },
    { label: 'cache', ms: '~1 ms', col: C.mem },
    { label: 'database', ms: '~5 ms', col: C.storage },
  ]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', margin: '14px 0' }}>
      {stops.map((s, i) => (
        <span key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ textAlign: 'center' }}>
            <span
              style={{
                display: 'block',
                padding: '10px 12px',
                background: C.bg,
                border: `1.5px solid ${s.col}`,
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 600,
                color: s.col,
                whiteSpace: 'nowrap',
              }}
            >
              {s.label}
            </span>
            <span className="mono" style={{ display: 'block', fontSize: 10, color: C.faint, marginTop: 3 }}>
              {s.ms}
            </span>
          </span>
          {i < stops.length - 1 && <span style={{ color: C.faint, fontSize: 16, margin: '0 2px', paddingBottom: 14 }}>→</span>}
        </span>
      ))}
    </div>
  )
}

function Spark({ d, col }: { d: string; col: string }) {
  return (
    <svg width="110" height="34" viewBox="0 0 110 34">
      <polyline points={d} fill="none" stroke={col} strokeWidth="2" />
      <line x1="0" y1="32" x2="110" y2="32" stroke={C.line} />
    </svg>
  )
}

export const MANUAL: ManualSection[] = [
  {
    id: 'request',
    title: 'Anatomy of one request',
    body: (
      <>
        <p>
          When someone taps a button, a <T k="request">request</T> makes this trip — and the reply retraces it:
        </p>
        <RequestFlow />
        <p>
          Each stop exists for one reason. The <T k="lb">load balancer</T> spreads traffic so servers are interchangeable. The{' '}
          <T k="appserver">app server</T> runs your logic. The <T k="cache">cache</T> intercepts repeat questions so most{' '}
          <T k="read">reads</T> never reach the database. The database is the slowest stop and the only one holding truth — which
          is why the whole architecture is arranged to protect it.
        </p>
        <p style={{ color: C.dim }}>
          Total: ~5–10 ms when healthy. Systems don't fail by this number growing gently — they fail when one stop saturates and
          its line explodes (see <T k="util">utilization</T>).
        </p>
      </>
    ),
  },
  {
    id: 'rw',
    title: "Reads vs writes — why they're priced differently",
    body: (
      <>
        <p>
          The first question to ask about ANY system: what's the <T k="readpct">read/write mix</T>?
        </p>
        <p>
          A <T k="read">read</T> just looks. Looking is cheap to scale because answers can be <i>copied</i> — into a{' '}
          <T k="cache">cache</T>, onto <T k="replica">replicas</T> — and served from anywhere.
        </p>
        <p>
          A <T k="write">write</T> changes the truth. It must be <T k="durable">durable</T> (on disk before you say "saved"), and
          every copy must learn about it. So copies don't help writes — each copy must do every write anyway. Your only write
          moves: split the data (<T k="shard">shard</T>) or buffer the burst (<T k="queue">queue</T>).
        </p>
        <div
          className="mono"
          style={{ fontSize: 12.5, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 8, padding: '10px 14px', marginTop: 6 }}
        >
          read-heavy → cache + replicas &nbsp;·&nbsp; write-heavy → queue + shards
        </div>
      </>
    ),
  },
  {
    id: 'traffic',
    title: 'Where the traffic numbers come from',
    body: (
      <>
        <p>Interviewers give you a story, not a number. The translation is always the same shape:</p>
        <div
          className="mono"
          style={{ fontSize: 13, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 8, padding: '10px 14px', margin: '8px 0' }}
        >
          (how many actors) × (actions per actor per time) = requests per second
        </div>
        <p>
          Humans: 10M daily users × 50 taps/day ÷ 86,400s ≈ 5,800 <T k="rps">req/s</T> average (shortcut: 1M/day ≈ 12/s), then ×
          2–5 for peak hours. Machines (<T k="iot">IoT</T>): 60,000 devices <T k="phonehome">phoning home</T> every 8s = 7,500/s
          flat, day and night — no peak hours, but brutal <T k="burst">bursts</T> when they all act at once.
        </p>
        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', marginTop: 10 }}>
          <div>
            <Spark col={C.mem} d="0,20 20,19 40,21 60,19 80,20 110,20" />
            <div className="mono" style={{ fontSize: 10.5, color: C.faint }}>
              machine-steady (IoT)
            </div>
          </div>
          <div>
            <Spark col={C.net} d="0,28 15,26 30,18 45,8 60,10 75,18 95,26 110,28" />
            <div className="mono" style={{ fontSize: 10.5, color: C.faint }}>
              human-diurnal (apps)
            </div>
          </div>
          <div>
            <Spark col={C.alert} d="0,26 30,25 45,24 50,4 62,5 68,24 90,25 110,26" />
            <div className="mono" style={{ fontSize: 10.5, color: C.faint }}>
              burst (launch, herd)
            </div>
          </div>
        </div>
        <p style={{ color: C.dim, marginTop: 10 }}>
          Design for the peak, pay for the average — that tension is what queues and autoscaling are for.
        </p>
      </>
    ),
  },
  {
    id: 'parts',
    title: 'The parts bin',
    body: null, // rendered from src/content/components.ts by the mode
  },
  {
    id: 'judge',
    title: "How you're judged (and why)",
    body: (
      <>
        <p>
          <b>
            <T k="p99">p99 latency</T>
          </b>{' '}
          — not the average. 99 quick requests hide one 3-second disaster; averages forgive it, users don't. <b>Error rate</b> — a
          request dropped at a saturated component is a user seeing a spinner. <b>Cost</b> — anyone can pass with 10× hardware;
          the skill is passing at 60–70% <T k="util">utilization</T> with money left over.
        </p>
        <p style={{ color: C.dim }}>
          Together these are your <T k="sla">SLA</T>. In interviews say it out loud: "I'm designing for p99 under 200ms at peak,
          and I'll keep steady-state utilization near 70% for burst headroom." That sentence is half the interview.
        </p>
      </>
    ),
  },
  {
    id: 'internet',
    title: 'How the internet delivers a request',
    body: (
      <>
        <p>Before your code runs a single line, a tap on a phone has already paid four tolls:</p>
        <div
          className="mono"
          style={{ fontSize: 12.5, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 8, padding: '10px 14px', margin: '8px 0' }}
        >
          DNS lookup → TCP + TLS handshakes → (CDN edge?) → load balancer → your app
        </div>
        <p>
          <T k="dns">DNS</T> turns the name into an address — cached almost everywhere, but a cold lookup costs real
          milliseconds. Then TCP plus the <T k="tls">TLS handshake</T> spend 1–2 round trips agreeing on encryption before the
          first byte moves; for a user far from your servers that is 100–200 ms of pure geography, which is why connections are
          reused and why a <T k="cdn">CDN</T> terminates them close to the user and serves cached content without ever crossing
          the ocean.
        </p>
        <p>
          Whatever reaches you goes through the <T k="lb">load balancer</T> to an app server — which talks to the database
          through a <T k="connpool">connection pool</T>, the quiet queue almost nobody provisions on purpose. Interview
          instinct: first-visit latency and steady-state <T k="throughput">throughput</T> are different problems with different
          fixes — edges and handshake reuse for the first, capacity math for the second.
        </p>
      </>
    ),
  },
  {
    id: 'engines',
    title: 'Storage engines: B-tree vs LSM',
    body: (
      <>
        <p>
          Every database first writes intent to a <T k="wal">write-ahead log</T> — a sequential append, the one thing disks do
          fast — so a crash can be replayed. The engines differ in what they do next:
        </p>
        <p>
          A <T k="btree">B-tree</T> (Postgres, MySQL) keeps data sorted in place: any row is a few page reads away, so reads are
          fast and predictable — but writes must update pages where they live, paying random I/O. An <T k="lsm">LSM-tree</T>{' '}
          (Cassandra, RocksDB) refuses to overwrite anything: writes buffer in memory and flush as sorted immutable files merged
          in the background — writes become pure appends, and reads may consult several files to find the newest version.
        </p>
        <div
          className="mono"
          style={{ fontSize: 12.5, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 8, padding: '10px 14px', margin: '8px 0' }}
        >
          B-tree: read-optimized, write-amplified in place · LSM: write-optimized, read-amplified across files
        </div>
        <p style={{ color: C.dim }}>
          Every <T k="index">index</T> you add is the same trade in miniature: one more sorted copy to speed a read, one more
          structure every <T k="durable">durable</T> write must update. "Which side of this trade does my workload live on?" is
          the storage-engine question, and it is answerable from the read/write mix alone.
        </p>
      </>
    ),
  },
  {
    id: 'replication',
    title: 'Replication & lag',
    body: (
      <>
        <p>
          A <T k="replica">replica</T> is a live photocopy: the primary streams every committed change and the copy applies
          them, seconds or milliseconds behind. That gap is <T k="replag">replication lag</T> — normally tiny, but it is a
          queue, and under load queues explode. Every read from a replica is a read of the recent past.
        </p>
        <p>
          Users forgive most staleness but notice one kind instantly: posting a comment and watching it vanish. That is the{' '}
          <T k="readyourwrites">read-your-own-writes</T> anomaly — write lands on the primary, next read hits a lagging replica.
          Fix it by pinning a user's reads to the primary right after their write, not by making everything strongly{' '}
          <T k="consistency">consistent</T>.
        </p>
        <p>
          Replicas also buy survival: when the primary dies, <T k="failover">failover</T> promotes one — after a{' '}
          <T k="leader">leader election</T> in which <T k="consensus">consensus</T> among a <T k="quorum">quorum</T> guarantees
          the cluster cannot crown two primaries. Elections take seconds, and writes stall while they run. <T k="cap">CAP</T> is
          this whole section in one sentence: when the network partitions, you either stop answering or answer stale.
        </p>
        <p style={{ color: C.dim }}>
          One more use of the replication stream: <T k="cdc">change data capture</T> taps it to feed search indexes, caches, and
          warehouses — one source of truth, many eventually-consistent projections.
        </p>
      </>
    ),
  },
  {
    id: 'partitioning',
    title: 'Partitioning & keys',
    body: (
      <>
        <p>
          <T k="shard">Sharding</T> scales writes by splitting data across independent databases — and the partition key decides
          everything. The store can only spread LOAD as evenly as your keys spread. A key derived from "now" (this hour's
          bucket) or from popularity (a viral post's ID) funnels every concurrent writer to one node: a{' '}
          <T k="hotpartition">hot partition</T>, melting while the rest of the expensive cluster idles.
        </p>
        <div
          className="mono"
          style={{ fontSize: 12.5, background: C.bg, border: `1px solid ${C.line}`, borderRadius: 8, padding: '10px 14px', margin: '8px 0' }}
        >
          rule: will many concurrent writers compute the SAME key value? then salt it (key#0..9) and fan-in on read
        </div>
        <p>
          Need to query by something other than the partition key? That is a <T k="gsi">secondary index</T> — a second copy of
          the table sorted differently, kept in sync at the cost of doubling your writes. And when one event must reach many
          partitions (a post to a million follower feeds), you are choosing a <T k="fanout">fan-out</T> strategy: pay at write
          time or pay at read time, priced by your most-followed user.
        </p>
        <p style={{ color: C.dim }}>
          Hot keys have a cache-side twin: one popular key expiring triggers a <T k="stampede">stampede</T> of identical misses.
          Same lesson as salting, applied to <T k="ttl">TTLs</T>: add jitter so the crowd doesn't move in sync.
        </p>
      </>
    ),
  },
  {
    id: 'delivery',
    title: 'Delivery guarantees',
    body: (
      <>
        <p>
          Networks lose messages, and worse, they lose ACKNOWLEDGMENTS — the work succeeded but the reply vanished, and the
          sender cannot tell the difference. Out of that one ambiguity falls every delivery guarantee.{' '}
          <T k="atleastonce">At-least-once</T> retries until acknowledged, so nothing is lost but duplicates are PROMISED.{' '}
          <T k="exactlyonce">Exactly-once</T> is at-least-once plus <T k="idempotent">idempotent</T> processing — duplicates
          arrive, but a remembered operation ID makes the second one a no-op.
        </p>
        <p>
          A <T k="queue">queue</T> makes the machinery concrete: the <T k="visibility">visibility timeout</T> hides a message
          while a worker processes it and resurrects it if the worker crashes; after enough failed attempts the message lands in
          the <T k="dlq">dead-letter queue</T> instead of clogging the line while a <T k="backlog">backlog</T> grows behind it.
        </p>
        <p>
          The failure-handling trio travels together: a <T k="timeout">timeout</T> decides how long to wait, a{' '}
          <T k="retry">retry with backoff and jitter</T> decides how to try again without becoming a synchronized{' '}
          <T k="herd">thundering herd</T>, and when a dependency stays sick, a <T k="breaker">circuit breaker</T> stops calling
          it while <T k="bulkhead">bulkheads</T> keep its pool from starving everyone else's.
        </p>
        <p style={{ color: C.dim }}>
          At the front door the same idea is <T k="ratelimit">rate limiting</T> and <T k="backpressure">backpressure</T>: decide
          on purpose where the system says "no" — or overload will decide for you, somewhere worse.
        </p>
      </>
    ),
  },
]
