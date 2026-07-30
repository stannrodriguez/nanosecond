// Core Concepts shelf (8) — the load-bearing ideas every other section leans on.
// Contract + bar: docs/content-pipeline.md §7. The viz carries the explanation.

import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { C } from '../../theme'
import { Term as T } from '../../ui/Term'
import { Slidey, Toggler, Stepper, HashRing } from '../../ui/viz'
import { LayerStack } from '../../ui/LayerStack'
import { LossToggle } from '../../ui/LossToggle'
import type { ManualSection } from './types'

const mono = (children: ReactNode) => (
  <span className="mono" style={{ color: C.text }}>
    {children}
  </span>
)

// In-prose § link to a sibling briefing (networking block 4 hand-offs).
const Sec = ({ to, children }: { to: string; children: ReactNode }) => (
  <Link to={`/manual/briefings/${to}`} style={{ color: C.net }}>
    §&nbsp;{children}
  </Link>
)

/* ---------- networking (spec 069): the three-registers reference briefing ----------
   Four viz-led blocks; Appendix B of specs/069-networking-briefing.md is the
   approved content baseline. Block 1's parts double as the section's legacy
   body/viz/simplifies fields, which the type still requires. */

const NET_STACK_BODY = (
  <>
    <p>
      Every protocol you will ever name in an interview answers the same question:{' '}
      <b>what should this layer promise the one above it?</b> <T k="ip">IP</T> promises: hand me a packet and an
      address, and I will probably get it there — anywhere on earth. <T k="tcp">TCP</T> promises: hand me bytes, and
      the far side will receive every one of them, in order. HTTP promises: ask a named server for a thing, and you
      get a labeled answer back. Each promise is a contract — the layer above builds on it without knowing how it is kept, and the
      layer below keeps it without knowing why it is wanted. That contract structure, not any particular protocol, is
      the deep fact about networks. It is the reason you can ship a web app without once thinking about fiber, radio,
      or routing tables: three contracts down, someone is turning your bytes into light.
    </p>
    <p>
      The OSI model names seven such layers; for system design, three do all the work. <b>L3</b> gets packets to a
      machine, <b>L4</b> turns packets into a conversation, <b>L7</b> gives the conversation meaning. And the action
      clusters where it does for a reason: L3 and L4 are kept by the operating system's kernel — decades old,
      ferociously optimized, near-impossible to change — which is why the internet has run on TCP and{' '}
      <T k="udp">UDP</T> for fifty years, and why <T k="quic">QUIC</T>, the first serious newcomer, had to smuggle
      itself inside UDP to get deployed. L7 lives in your own process, where anyone can invent a protocol this
      afternoon — which is why that floor is crowded: HTTP, <T k="grpc">gRPC</T>, <T k="websocket">WebSockets</T>, and
      whatever your company built internally.
    </p>
  </>
)

const NET_STACK_VIZ = (
  <>
    <LayerStack accent={C.net} />
    <p style={{ color: C.dim, fontSize: 14, lineHeight: 1.6 }}>
      Used as a filing system, the stack organizes half of networking vocabulary by itself. Regions, round trips, and
      the speed of light: L3 facts. TCP vs UDP, <T k="handshake">handshakes</T>, head-of-line blocking: L4. REST vs
      gRPC, <T k="polling">polling</T> vs push, everything you can {mono('curl')}: L7. When an interviewer says “L4{' '}
      <T k="lb">load balancer</T>,” they are telling you which promises it can see — addresses and connections, never
      the request inside.
    </p>
  </>
)

const NET_TRANSPORT_BODY = (
  <>
    <p>
      L4 is where networking's foundational trade gets made, so it earns this page's full attention.{' '}
      <b>TCP's promise is completeness.</b> It numbers every byte, the receiver acknowledges what arrived, and anything
      unacknowledged is sent again. Ordering is absolute: if byte 4,001 is missing, bytes 4,002 through 4,000,000 sit
      in a buffer and reach your application only once the gap is filled. That refusal to reorder is{' '}
      <T k="headofline">head-of-line blocking</T>, and it is the honest price of a guaranteed stream —{' '}
      <b>the stream is never wrong, but it can be arbitrarily late.</b> Repairing one lost packet costs at least one{' '}
      <T k="rtt">round trip</T>, because the sender has to learn about the loss before it can resend — and a round trip
      is geography: ~1&nbsp;ms across a city, ~70&nbsp;ms across a country, ~150&nbsp;ms across an ocean.
    </p>
    <p>
      <b>UDP's promise is speed, kept by promising nothing else.</b> A datagram is an addressed envelope: it may
      arrive, arrive twice, or arrive after the one sent behind it — and the instant it does arrive, your application
      has it. No handshake before the first byte, no acknowledgments, no buffer holding fresh data hostage to old
      losses. This is not a lesser TCP; it is the correct product for a different customer. A video call that receives
      a 400-ms-old audio packet has received garbage — the conversation has moved on — and one crackled syllable beats
      a call that freezes, then fast-forwards. <b>The decision rule: reach for UDP exactly when a late packet is worse
      than a lost one</b> — live audio and video, game state, high-volume telemetry — and check the escape hatch
      first, because browsers can't speak raw UDP: on the web, this choice arrives dressed as{' '}
      <T k="webrtc">WebRTC</T>.
    </p>
  </>
)

const NET_TRANSPORT_VIZ = (
  <>
    <LossToggle accent={C.net} />
    <p style={{ color: C.dim, fontSize: 14, lineHeight: 1.6 }}>
      One pattern worth internalizing, because it explains modern protocol history: TCP's head-of-line blocking is per{' '}
      <i>connection</i>, so when HTTP/2 multiplexed many requests onto one TCP connection, a single lost packet could
      stall all of them at once. QUIC exists precisely to fix that — independent streams that don't block each other,
      with TLS folded into the first round trip — and HTTP/3 is HTTP over QUIC. You will rarely need QUIC in an
      interview answer, but saying <i>why it exists</i> is a one-sentence proof that you understand the layer under
      you.
    </p>
  </>
)

const NET_STACK_SIMPLIFIES =
  "Real deployments run TCP/IP's four layers wearing OSI's seven names — layers 5–6 exist mostly in textbooks, because HTTP absorbed their jobs."

const NET_TAP_BODY = (
  <>
    <p>
      Now watch the contracts cooperate. A tap resolves a name — <T k="dns">DNS</T>, which is L7 asking L3's question —
      then opens a conversation: TCP's <T k="handshake">handshake</T> costs one round trip, and <T k="tls">TLS</T> one
      to two more. Only then does the <T k="request">request</T> itself go out — HTTP, finally speaking. On a
      70&nbsp;ms cross-country path, a cold connection spends
      140–210&nbsp;ms in handshakes before your API sees byte one — pure L4 tax, which is why connections are pooled
      and reused, and why a <T k="cdn">CDN</T> terminates TLS near the user even for traffic it can't cache.
      {/* RTT numbers here and in the stepper captions: numbers.ts `fiber-rtt-floor` (≥56 ms transatlantic) */}
    </p>
  </>
)

// The pre-069 request-path stepper, demoted to the worked example: captions now
// name the layer doing each step's work, and the trip ends with the teardown.
const NET_TAP_VIZ = (
  <Stepper
    accent={C.net}
    nodes={['phone', 'DNS', 'TLS', 'CDN edge', 'LB', 'app', 'DB']}
    steps={[
      { active: [0], cap: <>A tap. Nothing has left the phone yet — but a cold connection is about to pay tolls on three floors of the stack.</> },
      { active: [0, 1], edge: [0, 1], cap: <>{mono('DNS')} — L7 asking L3's question — turns the name into an address. Cached almost everywhere; a cold lookup is real milliseconds.</> },
      { active: [0, 2], edge: [0, 2], cap: <>L4's toll: the TCP handshake (SYN → SYN-ACK → ACK) spends one round trip, {mono('TLS')} one to two more. ~100–200 ms for a distant user, before the first byte.</> },
      { active: [3], edge: [0, 3], cap: <>A {mono('CDN')} edge — L7, terminating TLS near the user — may answer cacheable content here, never crossing the ocean to your origin.</> },
      { active: [3, 4], edge: [3, 4], cap: <>Whatever is dynamic passes the {mono('LB')} — L4 or L7, depending on which promises it needs to see — onto interchangeable app servers.</> },
      { active: [5, 6], edge: [5, 6], cap: <>The app — your own L7 — runs the logic and asks the database: the slowest stop, protected by everything upstream.</> },
      { active: [0, 6], edge: [6, 0], cap: <>The reply streams back — and unless the connection is kept alive, it is torn down with FIN/ACK. Keep-alive exists so the next request skips every toll.</> },
    ]}
  />
)

const NET_HANDOFF_BODY = (
  <p style={{ color: C.dim }}>
    The rest of the stack's decisions live on their own pages: shaping L7 APIs — REST's resources, gRPC's contracts —
    is <Sec to="api-design">API design</Sec>; pushing instead of pulling (polling, SSE, WebSockets) is{' '}
    <Sec to="realtime-updates">Pushing realtime updates</Sec>; how a balancer that can only see L4 differs from one
    that reads L7 — and why WebSockets care — is <Sec to="load-balancer">Load balancer</Sec>; and what geography does
    to every number on this page is <Sec to="cdn">CDN</Sec>. The stack you just learned is the map — each of those
    pages is one floor of this building, furnished.
  </p>
)

export const CONCEPTS_SECTIONS: ManualSection[] = [
  {
    id: 'networking',
    shelf: 'concepts',
    title: 'Networking essentials',
    thesis: 'What is each layer promising your code — and what does it cost to keep that promise?',
    body: NET_STACK_BODY,
    viz: NET_STACK_VIZ,
    simplifies: NET_STACK_SIMPLIFIES,
    blocks: [
      { heading: 'THE STACK — the organizing model', body: NET_STACK_BODY, viz: NET_STACK_VIZ, simplifies: NET_STACK_SIMPLIFIES },
      {
        heading: 'TRANSPORT — the guarantees you order, and their price',
        body: NET_TRANSPORT_BODY,
        viz: NET_TRANSPORT_VIZ,
        simplifies:
          'Assumes 30 packets a second and an 80 ms round trip; real TCP recovers smarter (fast retransmit, SACK) and real video hides loss behind jitter buffers — the shape of the trade survives all of it.',
      },
      {
        heading: 'ONE TAP, EVERY LAYER — the model in motion',
        body: NET_TAP_BODY,
        viz: NET_TAP_VIZ,
        simplifies:
          'Collapses TCP and TLS into one step, ignores HTTP/2 multiplexing and connection reuse, treats DNS as a single hop rather than a cache hierarchy — and shows one request, where a real browser opens several connections and reuses them all.',
      },
      { heading: 'WHERE THIS PAGE HANDS OFF', body: NET_HANDOFF_BODY },
    ],
    related: {
      toys: ['light', 'pipe'],
      terms: ['request', 'dns', 'tls', 'tcp', 'udp', 'handshake', 'headofline', 'cdn', 'lb', 'appserver', 'throughput'],
      sections: ['cdn', 'load-balancer'],
    },
    termShelf: 'networking',
    feltIn: { note: <>Race a real operation against the speed of light in the Lab.</>, to: '/lab/light', cta: 'play RACE LIGHT' },
  },
  {
    id: 'api-design',
    shelf: 'concepts',
    title: 'API design',
    thesis: 'How do the shapes of your endpoints decide load and cost?',
    body: (
      <>
        <p>
          A good API is a contract that makes the common case one round trip and the dangerous case impossible. Two levers
          dominate: whether writes are <T k="idempotent">idempotent</T> (safe to <T k="retry">retry</T> — so a lost
          acknowledgment doesn't double-charge a card), and how you <T k="pagination">paginate</T> lists so one call can't
          drag back a million rows.
        </p>
        <p style={{ color: C.dim }}>
          Drag the page size below: fetching a fixed 10,000-item list, a tiny page means many <T k="rest">REST</T> round
          trips (each paying network latency); a huge page means fewer trips but a heavier payload and slower first byte.
          The right size is a fit to the client, not a universal constant. Encoding is the same kind of fit: REST over
          JSON stays at the public edge, while internal calls often move to <T k="grpc">gRPC</T> and{' '}
          <T k="protobuf">Protobuf</T> once message size and parse cost show up in the budget.
        </p>
      </>
    ),
    viz: (
      <Slidey
        label="page size"
        min={10}
        max={2000}
        step={10}
        init={100}
        accent={C.net}
        fmt={(v) => `${v} items/page`}
        compute={(v) => {
          const total = 10_000
          const trips = Math.ceil(total / v)
          const payloadKb = Math.round(v * 0.4)
          return {
            headline: (
              <>
                {trips} round trip{trips === 1 ? '' : 's'} · ~{payloadKb} KB each
              </>
            ),
            caption:
              trips > 40
                ? 'Tiny pages: latency-bound. Each trip pays a full network round trip before any data moves.'
                : payloadKb > 400
                  ? 'Huge pages: payload-bound. Fewer trips, but slow first byte and fat responses to parse.'
                  : 'A balanced page: few trips, modest payloads. This is the range most cursors target.',
            bars: [
              { label: 'round trips', frac: trips / 1000, col: C.net, tag: String(trips) },
              { label: 'payload/trip', frac: payloadKb / 800, col: C.compute, tag: `${payloadKb}KB` },
            ],
          }
        }}
      />
    ),
    simplifies:
      'Assumes uniform item size and a fixed total; real pagination uses cursors (not offsets) to stay stable under writes, and payload cost is nonlinear once compression and gzip kick in.',
    related: {
      toys: ['light'],
      terms: ['rest', 'pagination', 'idempotent', 'retry', 'request', 'grpc', 'protobuf'],
      sections: ['data-modeling', 'api-gateway'],
    },
    feltIn: { note: <>Taste tests judge API choices against stated requirements.</>, to: '/review/taste', cta: 'try a Taste Test' },
  },
  {
    id: 'data-modeling',
    shelf: 'concepts',
    title: 'Data modeling',
    thesis: 'Normalize for clean writes, or denormalize for fast reads?',
    body: (
      <>
        <p>
          Every schema answers one question: do you store each fact once, or many times? <T k="normalization">Normalizing</T>{' '}
          keeps one copy and reassembles it with a <T k="join">join</T> at read time — writes are clean, reads pay to gather.{' '}
          <T k="denormalization">Denormalizing</T> pre-joins the data into the shape the screen needs — reads are one lookup,
          but every <T k="write">write</T> must update every copy.
        </p>
        <p style={{ color: C.dim }}>
          Toggle the two below. The choice is <T k="readpct">read/write-mix</T> arithmetic: a read-heavy feed denormalizes
          and eats the write <T k="fanout">fan-out</T>; a write-heavy ledger normalizes and eats the join. An{' '}
          <T k="index">index</T> is the same trade in miniature — a sorted copy that speeds a read and taxes every write.
        </p>
        <p>
          There is a third position between the two toggles: keep the normalized truth AND store the assembled answer as
          a <T k="materializedview">materialized view</T>, refreshed in the background rather than recomputed per request.
          Reads stop paying for the join, writes stop fanning out to every copy, and the price moves to a place you can
          state out loud — the view is exactly as stale as its last refresh.
        </p>
      </>
    ),
    viz: (
      <Toggler
        options={[
          { id: 'norm', label: 'normalized', col: C.mem },
          { id: 'denorm', label: 'denormalized', col: C.compute },
        ]}
        initial="norm"
      >
        {(id) =>
          id === 'norm' ? (
            <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
              <div className="mono" style={{ color: C.mem }}>
                users · posts · likes (three tables)
              </div>
              <p style={{ marginTop: 8 }}>
                <b style={{ color: C.mem }}>Write:</b> one row, one place. Truth is never contradictory.
                <br />
                <b style={{ color: C.alert }}>Read:</b> a feed page joins 3 tables and sorts — expensive, and it gets worse as
                data grows.
              </p>
            </div>
          ) : (
            <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
              <div className="mono" style={{ color: C.compute }}>
                feed_items (one fat pre-joined row per card)
              </div>
              <p style={{ marginTop: 8 }}>
                <b style={{ color: C.mem }}>Read:</b> one lookup, already in display shape. Fast and flat.
                <br />
                <b style={{ color: C.alert }}>Write:</b> a like updates every feed row that embedded it — write fan-out, and
                copies can drift.
              </p>
            </div>
          )
        }
      </Toggler>
    ),
    simplifies:
      'Real systems mix both (a normalized source of truth with denormalized read projections kept in sync by CDC); the toggle pretends it is one-or-the-other.',
    related: { toys: ['disk'], terms: ['normalization', 'denormalization', 'join', 'index', 'write', 'readpct', 'fanout', 'cdc'], sections: ['indexing', 'relational-db', 'nosql-db'] },
    feltIn: { note: <>Builder scenarios force the read/write-mix decision under a budget.</>, to: '/builder', cta: 'open the Builder' },
  },
  {
    id: 'indexing',
    shelf: 'concepts',
    title: 'Database indexing',
    thesis: 'Why is one query instant and another scans a billion rows?',
    body: (
      <>
        <p>
          Without an <T k="index">index</T>, finding a row means reading every row — a full scan, linear in table size.
          An index is a sorted copy (a <T k="btree">B-tree</T>: wide and shallow, so any row is ~3–4 page reads away)
          that turns "scan a billion rows" into "walk a tree". Drag the table size: the scan grows with the table; the
          index barely moves.
        </p>
        <p style={{ color: C.dim }}>
          The bill arrives on the write path. Every insert updates every index, and each is more <T k="durable">durable</T>{' '}
          write amplification. Storage engines make the same trade at the root: a <T k="btree">B-tree</T> overwrites in place
          (read-optimized), an <T k="lsm">LSM-tree</T> only appends and merges later (write-optimized) — both first append
          intent to a <T k="wal">write-ahead log</T>.
        </p>
        <p>
          The slider shows one index. In practice you also choose its SHAPE. A <T k="compositeindex">composite index</T>{' '}
          sorts by several columns in order and can be entered from any leading prefix — put the filter column first and
          the sort column next, and one traversal answers both halves of the query. A{' '}
          <T k="coveringindex">covering index</T> also carries the columns you return, so the engine answers from the
          index and skips the random heap fetch. A <T k="partialindex">partial index</T> covers only rows matching a
          condition, which is how a job table's handful of pending rows gets an index small enough to stay in RAM. And
          when the question is spatial, sorted order fails outright: an <T k="rtree">R-tree</T> groups objects into
          fitted, overlapping rectangles, which is what lets it index polygons and not only points.
        </p>
        <p style={{ color: C.dim }}>
          Zoom into the LSM half of that trade and the read count above is built from four stages: a write lands in the
          in-memory <T k="memtable">memtable</T> — already durable, because the log was fsynced first — which flushes to
          an immutable <T k="sstable">SSTable</T>, which <T k="compaction">compaction</T> later merges to keep the file
          count, and therefore the read cost, from growing forever. A <T k="bloomfilter">bloom filter</T> per file is
          what makes that read survivable: it rules keys OUT with certainty, so most files are skipped without a disk
          trip at all.
        </p>
      </>
    ),
    viz: (
      <Slidey
        label="table size"
        min={3}
        max={9}
        step={1}
        init={6}
        accent={C.storage}
        fmt={(v) => `${Math.pow(10, v).toLocaleString()} rows`}
        compute={(v) => {
          const rows = Math.pow(10, v)
          const scan = rows // one read per row, roughly
          const seek = Math.ceil(Math.log(rows) / Math.log(200)) + 1 // B-tree fanout ~200
          return {
            headline: (
              <>
                full scan ≈ {scan.toLocaleString()} reads · index ≈ {seek} reads
              </>
            ),
            caption: `A B-tree with ~200 keys per page reaches any of ${rows.toLocaleString()} rows in ${seek} page reads. The scan reads them all.`,
            bars: [
              { label: 'full scan', frac: v / 9, col: C.alert, tag: '≈ rows' },
              { label: 'index seek', frac: seek / 9, col: C.mem, tag: `${seek}` },
            ],
          }
        }}
      />
    ),
    simplifies:
      'Counts logical page reads, not cache hits (hot pages live in RAM); ignores that range scans and sorts change the calculus, and that each added index taxes every write.',
    related: { toys: ['disk', 'lsmbtree'], terms: ['index', 'btree', 'lsm', 'wal', 'durable', 'gsi'], sections: ['relational-db', 'data-modeling'] },
    feltIn: { note: <>Race the same writes through a B-tree and an LSM, then pay the read bill.</>, to: '/lab/lsmbtree', cta: 'play LSM vs B-TREE' },
  },
  {
    id: 'caching',
    shelf: 'concepts',
    title: 'Caching',
    thesis: 'Why does one percentage decide your database’s fate?',
    body: (
      <>
        <p>
          A <T k="read">read</T> just looks, so its answer can be <i>copied</i> — into a <T k="cache">cache</T> in front of
          the database. Every <T k="hitrate">hit</T> is a read the database never sees. Drag the hit rate: this single number
          decides whether your database is bored or on fire. A <T k="write">write</T> changes the truth and can't be cached
          away — every copy must learn it.
        </p>
        <p style={{ color: C.dim }}>
          The catch lives in the tail. A hot key's <T k="ttl">TTL</T> expires and thousands of misses race to recompute the
          same answer at once — a <T k="stampede">stampede</T>, where the cache's <i>absence</i> is the load spike. Defenses
          all break the synchronization: jittered TTLs, dogpile locks, serving stale while refreshing.
        </p>
      </>
    ),
    viz: (
      <Slidey
        label="cache hit rate"
        min={0}
        max={99}
        step={1}
        init={90}
        accent={C.mem}
        fmt={(v) => `${v}%`}
        compute={(v) => {
          const reads = 100_000 // reads/s arriving
          const toDb = Math.round(reads * (1 - v / 100))
          return {
            headline: (
              <>
                {toDb.toLocaleString()} reads/s still hit the database
              </>
            ),
            caption:
              toDb > 30_000
                ? 'Above a single Postgres primary’s ~30k cached QPS — the cache is barely helping.'
                : toDb > 5_000
                  ? 'Survivable on one primary, but a cache restart would drop you back to 100k/s instantly.'
                  : 'The database is nearly idle. This is why read-heavy systems live or die by hit rate.',
            bars: [
              { label: 'served by cache', frac: v / 100, col: C.mem, tag: `${v}%` },
              { label: 'hits the DB', frac: (100 - v) / 100, col: C.alert, tag: `${100 - v}%` },
            ],
          }
        }}
      />
    ),
    simplifies:
      'Assumes a fixed 100k reads/s and a uniform miss cost; real hit rates depend on key skew and value churn, and a miss can be far more expensive than a hit.',
    related: { toys: ['stampede', 'dram'], terms: ['cache', 'hitrate', 'ttl', 'stampede', 'read', 'write', 'herd'], sections: ['distributed-caches', 'scaling-reads'] },
    feltIn: { note: <>Expire a hot key and watch ten thousand misses dogpile the DB.</>, to: '/lab/stampede', cta: 'play TTL & STAMPEDE' },
  },
  {
    id: 'sharding',
    shelf: 'concepts',
    title: 'Sharding & partitioning',
    thesis: 'Why can a huge cluster melt while sitting mostly idle?',
    body: (
      <>
        <p>
          <T k="shard">Sharding</T> scales <T k="write">writes</T> by splitting data across independent databases — and the{' '}
          <T k="partitionkey">partition key</T> decides everything. The cluster can only spread load as evenly as your keys
          spread. Toggle to a{' '}
          <T k="hotpartition">hot key</T> (this hour's bucket, a viral post's id): every concurrent writer funnels to one
          node while the rest of the expensive cluster idles.
        </p>
        <p style={{ color: C.dim }}>
          Total capacity is a lie; per-key capacity is what saturates. Fixes: salt or compose the key so writers spread.
          Querying by a non-key column means a <T k="gsi">secondary index</T> — a second copy that doubles writes — and one
          event reaching many partitions is a <T k="fanout">fan-out</T> choice, priced by your most-followed user.
        </p>
        <p>
          The bars above assume every query knows its key. One that doesn't becomes a{' '}
          <T k="scattergather">scatter-gather</T>: the coordinator asks every shard and waits for the slowest, so that
          query gets worse with each shard you add. Inside a partition, ordering is a second decision — the{' '}
          <T k="clusteringkey">clustering key</T> is the physical sort on disk, which is why "this user's newest first"
          is one sequential read and any other order is a scan plus a sort.
        </p>
      </>
    ),
    viz: (
      <Toggler
        options={[
          { id: 'even', label: 'well-spread key', col: C.mem },
          { id: 'hot', label: 'hot key', col: C.alert },
        ]}
        initial="even"
      >
        {(id) => {
          const load =
            id === 'even'
              ? [0.6, 0.55, 0.62, 0.58, 0.6, 0.57, 0.61, 0.59]
              : [0.05, 0.05, 1.0, 0.05, 0.05, 0.05, 0.05, 0.05]
          return (
            <div>
              <div className="mono" style={{ fontSize: 11, color: C.dim, marginBottom: 8 }}>
                8 shards · 1,000 writes/s each ceiling
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 96 }}>
                {load.map((f, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                    <div
                      style={{
                        height: `${f * 84}px`,
                        background: f >= 0.99 ? C.alert : C.mem,
                        borderRadius: 3,
                        boxShadow: f >= 0.99 ? `0 0 12px ${C.alert}` : 'none',
                        transition: 'height .2s',
                      }}
                    />
                    <div className="mono" style={{ fontSize: 9, color: C.faint, marginTop: 3 }}>
                      s{i + 1}
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12.5, color: C.dim, marginTop: 8 }}>
                {id === 'even'
                  ? 'Load spreads; each shard cruises near 60%. Add shards, add capacity.'
                  : 'One shard is pinned at 100% and throttling; seven idle. More shards would not help — the key does not spread.'}
              </p>
            </div>
          )
        }}
      </Toggler>
    ),
    simplifies:
      'Eight fixed equal partitions; real stores split hot partitions adaptively (too late for a per-second spike) and rebalance in the background.',
    related: { toys: ['hotpartition'], terms: ['shard', 'hotpartition', 'gsi', 'fanout', 'write'], sections: ['consistent-hashing', 'scaling-writes'] },
    feltIn: { note: <>Watch "now" as a partition key melt one node while seven idle.</>, to: '/lab/hotpartition', cta: 'play HOT PARTITION' },
  },
  {
    id: 'consistent-hashing',
    shelf: 'concepts',
    title: 'Consistent hashing',
    thesis: 'When you add a cache node, why don’t all the keys move?',
    body: (
      <>
        <p>
          Assign keys to nodes with <span className="mono">hash(key) % N</span> and every time N changes — a node dies, a
          node joins — nearly every key re-homes. For a <T k="cache">cache</T> that means a near-total miss storm; for a{' '}
          <T k="shard">shard</T> it means moving almost all the data. Consistent hashing fixes this by placing nodes and keys
          on a ring: a key belongs to the next node clockwise.
        </p>
        <p style={{ color: C.dim }}>
          Drag the node count. Adding a node steals only its new clockwise slice — about <b>1/N</b> of the keys move, not all
          of them. That is a bound on MOVEMENT, not a promise of evenness: with one point per node, random placement
          leaves arcs of wildly different sizes. Real systems give each node hundreds of <T k="vnode">virtual nodes</T> on
          the ring, so load averages out and a death is absorbed by many neighbours instead of doubling one.
        </p>
        <p style={{ color: C.dim }}>
          A ring is not the only way to bound movement. Redis Cluster cuts the key space into 16,384 fixed{' '}
          <T k="hashslot">hash slots</T> and assigns slots to nodes, so rebalancing means handing over whole slots and
          every client just caches the slot table — same goal, a lookup instead of a ring walk.
        </p>
      </>
    ),
    viz: <HashRing />,
    simplifies:
      'Uses one ring point per node (real deployments use dozens of virtual nodes to smooth load) and 12 evenly-hashed keys; skew and hot keys still need separate handling.',
    related: { toys: ['hotpartition'], terms: ['consistenthash', 'shard', 'cache', 'hitrate'], sections: ['sharding', 'distributed-caches'] },
    feltIn: { note: <>The hot-partition toy shows what happens when keys don’t spread.</>, to: '/lab/hotpartition', cta: 'play HOT PARTITION' },
  },
  {
    id: 'cap',
    shelf: 'concepts',
    title: 'CAP theorem',
    thesis: 'When the network splits, do you refuse writes or answer stale?',
    body: (
      <>
        <p>
          <T k="cap">CAP</T> isn't a buzzword — it's a proof about geography. Partitions <i>will</i> happen between regions.
          When they do, a distributed system must choose per operation: stay <T k="consistency">consistent</T> and refuse
          requests it can't confirm, or stay available and answer with possibly-stale data. Toggle a partition below and
          watch each choice.
        </p>
        <p style={{ color: C.dim }}>
          Consistency is bought with coordination: a <T k="quorum">quorum</T> of replicas must agree before answering, via{' '}
          <T k="consensus">consensus</T> that also runs the <T k="leader">leader election</T> so a split can't crown two
          leaders. That agreement is round trips — which is why strong cross-region writes cost ~150&nbsp;ms. The interview
          question is never "CP or AP?" but "which requests may be stale, which must never be?"
        </p>
        <p>
          The quorum is not ceremony — it is what prevents <T k="splitbrain">split brain</T>, where both sides of a
          partition elect a leader and both accept writes. At most one side can hold a majority, so at most one side may
          act. Pick AP instead and you have signed up for the reconciliation: a coordinator takes writes for absent
          replicas as a <T k="hintedhandoff">hinted handoff</T> and replays them on recovery, and genuinely concurrent
          edits are resolved by <T k="lastwritewins">last write wins</T> — which always converges and silently discards
          the losing write. Say which of your writes can afford to be the one discarded.
        </p>
      </>
    ),
    viz: (
      <Toggler
        options={[
          { id: 'cp', label: 'choose consistency (CP)', col: C.net },
          { id: 'ap', label: 'choose availability (AP)', col: C.compute },
        ]}
        initial="cp"
      >
        {(id) => (
          <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
            <div className="mono" style={{ color: C.alert }}>
              ⚡ network partition: region A cannot reach region B
            </div>
            {id === 'cp' ? (
              <p style={{ marginTop: 8 }}>
                <b style={{ color: C.net }}>CP:</b> the minority side refuses writes it can't confirm with a quorum. No wrong
                answers — but some users see errors until the partition heals. Right for balances, inventory, locks.
              </p>
            ) : (
              <p style={{ marginTop: 8 }}>
                <b style={{ color: C.compute }}>AP:</b> both sides keep accepting writes and reconcile later. Everyone stays
                up — but two truths may diverge and need merging. Right for carts, likes, presence.
              </p>
            )}
          </div>
        )}
      </Toggler>
    ),
    simplifies:
      'Treats CAP as a clean binary; real systems tune consistency per request (read-your-writes, bounded staleness) and partitions are rarely total.',
    related: { toys: ['consensus'], terms: ['cap', 'consistency', 'consensus', 'quorum', 'leader', 'failover'], sections: ['relational-db', 'distributed-locks'] },
    feltIn: { note: <>Count the round trips a single strongly-consistent write actually costs.</>, to: '/lab/consensus', cta: 'play CONSENSUS ROUND-TRIPS' },
  },
]
