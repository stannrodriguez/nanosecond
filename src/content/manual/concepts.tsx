// Core Concepts shelf (8) — the load-bearing ideas every other section leans on.
// Contract + bar: docs/content-pipeline.md §7. The viz carries the explanation.

import type { ReactNode } from 'react'
import { C } from '../../theme'
import { Term as T } from '../../ui/Term'
import { Slidey, Toggler, Stepper, HashRing } from '../../ui/viz'
import type { ManualSection } from './types'

const mono = (children: ReactNode) => (
  <span className="mono" style={{ color: C.text }}>
    {children}
  </span>
)

export const CONCEPTS_SECTIONS: ManualSection[] = [
  {
    id: 'networking',
    shelf: 'concepts',
    title: 'Networking essentials',
    thesis: 'What actually happens between a tap and your code running?',
    body: (
      <>
        <p>
          Before your first line of logic runs, a tap has already paid a chain of tolls. Scrub the trip: a{' '}
          <T k="dns">DNS</T> lookup turns the name into an address, then TCP plus the <T k="tls">TLS handshake</T> spend 1–2
          round trips agreeing on encryption. For a far user that is 100–200&nbsp;ms of pure geography — which is why a{' '}
          <T k="cdn">CDN</T> terminates connections nearby and why connections are reused.
        </p>
        <p style={{ color: C.dim }}>
          Only then does the <T k="request">request</T> reach your <T k="lb">load balancer</T> and an <T k="appserver">app
          server</T>. First-visit latency (handshakes, geography) and steady-state <T k="throughput">throughput</T> are
          different problems with different fixes — say which one the requirement names.
        </p>
      </>
    ),
    viz: (
      <Stepper
        accent={C.net}
        nodes={['phone', 'DNS', 'TLS', 'CDN edge', 'LB', 'app', 'DB']}
        steps={[
          { active: [0], cap: <>A tap. Nothing has left the phone yet — but a cold connection is about to pay four tolls.</> },
          { active: [0, 1], edge: [0, 1], cap: <>{mono('DNS')} resolves the name → IP. Cached almost everywhere; a cold lookup is real milliseconds.</> },
          { active: [0, 2], edge: [0, 2], cap: <>TCP + {mono('TLS')} handshakes: 1–2 round trips before the first byte. ~100–200 ms for a distant user.</> },
          { active: [3], edge: [0, 3], cap: <>A {mono('CDN')} edge may answer cacheable content here — never crossing the ocean to your origin.</> },
          { active: [3, 4], edge: [3, 4], cap: <>Whatever is dynamic passes the {mono('LB')}, which spreads it across interchangeable app servers.</> },
          { active: [5, 6], edge: [5, 6], cap: <>The app runs your logic and asks the database — the slowest stop, protected by everything upstream.</> },
        ]}
      />
    ),
    simplifies:
      'Collapses TCP and TLS into one step, ignores HTTP/2 multiplexing and connection reuse, and treats DNS as a single hop rather than a cache hierarchy.',
    related: { toys: ['light', 'pipe'], terms: ['request', 'dns', 'tls', 'cdn', 'lb', 'appserver', 'throughput'], sections: ['cdn', 'load-balancer'] },
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
          The right size is a fit to the client, not a universal constant.
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
    related: { toys: ['light'], terms: ['rest', 'pagination', 'idempotent', 'retry', 'request'], sections: ['data-modeling', 'api-gateway'] },
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
          <T k="shard">Sharding</T> scales <T k="write">writes</T> by splitting data across independent databases — and the
          partition key decides everything. The cluster can only spread load as evenly as your keys spread. Toggle to a{' '}
          <T k="hotpartition">hot key</T> (this hour's bucket, a viral post's id): every concurrent writer funnels to one
          node while the rest of the expensive cluster idles.
        </p>
        <p style={{ color: C.dim }}>
          Total capacity is a lie; per-key capacity is what saturates. Fixes: salt or compose the key so writers spread.
          Querying by a non-key column means a <T k="gsi">secondary index</T> — a second copy that doubles writes — and one
          event reaching many partitions is a <T k="fanout">fan-out</T> choice, priced by your most-followed user.
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
          of them. Real systems give each node many virtual points on the ring so load stays even; it's how distributed
          caches and partitioned stores grow without a stampede.
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
