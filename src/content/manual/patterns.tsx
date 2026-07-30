// Common Patterns shelf (8) — shapes that recur across systems. Each teaches the
// choice and names when the losing option wins (law L5). Contract: §7.

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

export const PATTERNS_SECTIONS: ManualSection[] = [
  {
    id: 'realtime-updates',
    shelf: 'patterns',
    title: 'Pushing realtime updates',
    thesis: 'How does the server tell the client "something changed" without being asked?',
    body: (
      <>
        <p>
          HTTP is client-pull: the server can't speak first. To show live data you pick a technique on a spectrum of freshness
          vs cost. Toggle them below. <T k="polling">Polling</T> asks on a timer (simple, but most requests find nothing);
          long-polling holds the request open; <T k="sse">server-sent events</T> stream one-way; a <T k="websocket">WebSocket</T>{' '}
          is a full duplex pipe.
        </p>
        <p style={{ color: C.dim }}>
          The trap is <T k="fanout">fan-out</T>: one event pushed to a million connected clients is a million sends, and every
          open connection is memory on a server that can't be stateless. Polling wins when updates are rare and clients are
          many; push wins when updates are frequent and latency matters (chat, trading, presence). A dropped stream is
          the other cost: SSE replays the gap through <T k="lasteventid">Last-Event-ID</T> only if you buffered recent
          events server-side. When the payload is live media rather than events, <T k="webrtc">WebRTC</T> moves it
          peer-to-peer and off your servers entirely.
        </p>
        <p>
          "Off your servers entirely" needs one correction. Both peers usually sit behind <T k="nat">NAT</T>, sharing a
          public address with no inbound mapping, so neither can be dialed until it has sent something outward first. They
          therefore meet on a <T k="signaling">signaling</T> server — an ordinary WebSocket — to trade addresses and codecs
          before any direct link exists, and a relay still carries the peers whose NAT refuses to cooperate. Only the media
          is peer-to-peer; the introduction never is.
        </p>
      </>
    ),
    viz: (
      <Toggler
        options={[
          { id: 'poll', label: 'polling', col: C.compute },
          { id: 'long', label: 'long-poll', col: C.gold },
          { id: 'sse', label: 'SSE', col: C.net },
          { id: 'ws', label: 'WebSocket', col: C.mem },
        ]}
        initial="poll"
      >
        {(id) => (
          <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
            {id === 'poll' && (
              <>
                {line('Poll every 10s:', 'dead simple, works everywhere. But ~5s average staleness and mostly-empty requests.', C.compute)}
                <p style={{ color: C.dim, margin: '4px 0' }}>1M clients × 6/min = 100k req/s of mostly "nothing new".</p>
              </>
            )}
            {id === 'long' && (
              <>
                {line('Long-poll:', 'hold the request open until there’s news, then reconnect. Near-realtime over plain HTTP.', C.gold)}
                <p style={{ color: C.dim, margin: '4px 0' }}>Fewer empty responses, but a held connection per waiting client.</p>
              </>
            )}
            {id === 'sse' && (
              <>
                {line('Server-sent events:', 'one long-lived stream, server → client only. Auto-reconnect built in.', C.net)}
                <p style={{ color: C.dim, margin: '4px 0' }}>Perfect for feeds and notifications; can’t send client → server on the same pipe.</p>
              </>
            )}
            {id === 'ws' && (
              <>
                {line('WebSocket:', 'full-duplex, lowest latency. The right tool for chat and multiplayer.', C.mem)}
                <p style={{ color: C.dim, margin: '4px 0' }}>Every connection is server memory and state — fan-out and scale get real.</p>
              </>
            )}
          </div>
        )}
      </Toggler>
    ),
    simplifies:
      'Omits the connection-management tier (a pub/sub layer routing events to the right sockets), which is where realtime systems actually get hard.',
    related: { toys: [], terms: ['polling', 'sse', 'websocket', 'fanout', 'lasteventid', 'webrtc'] },
    feltIn: { note: <>Taste tests weigh polling vs push under stated update rates.</>, to: '/review/taste', cta: 'try a Taste Test' },
  },
  {
    id: 'long-running-tasks',
    shelf: 'patterns',
    title: 'Managing long-running tasks',
    thesis: 'Should the user wait for the work, or a receipt for it?',
    body: (
      <>
        <p>
          If a request triggers slow work (transcode a video, generate a report), doing it synchronously holds a connection
          and a thread hostage — and a <T k="burst">burst</T> exhausts the pool. The pattern: accept the job, return a
          receipt (202 + a status URL), and let a <T k="worker">worker</T> pull it off a <T k="queue">queue</T>. Toggle the
          two below.
        </p>
        <p style={{ color: C.dim }}>
          Async buys you <T k="backpressure">backpressure</T> (the queue absorbs the spike) and retries — but because
          delivery is <T k="atleastonce">at-least-once</T>, the work must be <T k="idempotent">idempotent</T> so a redelivered
          job doesn't run twice. Stay synchronous when the result is needed <i>now</i> and is fast (a login); go async when
          it's slow or bursty.
        </p>
      </>
    ),
    viz: (
      <Toggler
        options={[
          { id: 'sync', label: 'synchronous', col: C.alert },
          { id: 'async', label: 'async + queue', col: C.mem },
        ]}
        initial="sync"
      >
        {(id) =>
          id === 'sync' ? (
            <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
              {line('Client waits 40s:', 'a thread and connection held the whole time. 200 slow jobs exhaust the pool.', C.alert)}
              <p style={{ color: C.dim, margin: '4px 0' }}>A traffic burst becomes timeouts for everyone, including fast requests.</p>
            </div>
          ) : (
            <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
              {line('Accept in ~5ms:', 'return 202 + status URL; a worker does the 40s job off the queue.', C.mem)}
              <p style={{ color: C.dim, margin: '4px 0' }}>Bursts fill the queue, not the app. Retries are safe because the job is idempotent.</p>
            </div>
          )
        }
      </Toggler>
    ),
    simplifies:
      'Skips the status-polling / webhook mechanics the client needs to learn the result, and assumes the worker pool can eventually drain the queue.',
    related: { toys: ['backpressure', 'queue'], terms: ['queue', 'worker', 'backpressure', 'atleastonce', 'idempotent', 'burst'] },
    feltIn: { note: <>Feel a bounded buffer choose to drop, block, or blow up.</>, to: '/lab/backpressure', cta: 'play BACKPRESSURE' },
  },
  {
    id: 'contention',
    shelf: 'patterns',
    title: 'Dealing with contention',
    thesis: 'Two requests want the same row at once — who wins, and how?',
    body: (
      <>
        <p>
          Contention is many writers racing for one thing: the last concert seat, a counter, an account balance. You have
          three moves, toggled below. <T k="pessimistic">Pessimistic locking</T> makes writers wait in line; optimistic
          concurrency lets them race and rejects the loser via a version check —{' '}
          <T k="compareandset">compare-and-set</T>, the single atomic move underneath every conditional write, ETag, and
          version column; serializing through a single owner (a queue or one partition) sidesteps the race entirely.
        </p>
        <p style={{ color: C.dim }}>
          Which wins depends on contention: under low contention <T k="optimistic">optimistic</T> is fastest (retries are
          rare); under high contention it thrashes on retries and a lock or a serialized owner wins. Every choice needs an{' '}
          <T k="idempotent">idempotent</T> retry path, and a <T k="distlock">distributed lock</T> when the contenders span
          machines.
        </p>
        <p>
          Two ways the version check quietly fails. If the compared value can return to an earlier state while you were
          deciding — the <T k="aba">ABA problem</T> — your compare-and-set succeeds over changes you never saw, which is
          why you compare a monotonically increasing version rather than the value itself. And if the writers touch{' '}
          <i>different</i> rows after reading the same ones, nothing conflicts row-by-row at all while the invariant
          across them breaks: <T k="writeskew">write skew</T>, invisible to every tool on this toggle, because there is
          no shared row to lock or version. That one needs <T k="serializable">serializable</T> isolation or a lock on
          the predicate.
        </p>
      </>
    ),
    viz: (
      <Toggler
        options={[
          { id: 'pess', label: 'pessimistic lock', col: C.storage },
          { id: 'opt', label: 'optimistic (CAS)', col: C.net },
          { id: 'serial', label: 'serialize', col: C.mem },
        ]}
        initial="opt"
      >
        {(id) => (
          <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
            {id === 'pess' && (
              <>
                {line('Lock the row:', 'writer B waits for A to commit. No wasted work, but throughput is one-at-a-time.', C.storage)}
                <p style={{ color: C.dim, margin: '4px 0' }}>Best under heavy contention. Risk: held locks and deadlocks.</p>
              </>
            )}
            {id === 'opt' && (
              <>
                {line('Read version, write if unchanged:', 'both race; the loser sees a version mismatch and retries.', C.net)}
                <p style={{ color: C.dim, margin: '4px 0' }}>Fastest when conflicts are rare. Thrashes on retries when they aren’t.</p>
              </>
            )}
            {id === 'serial' && (
              <>
                {line('One owner:', 'route all writes for the key through one queue/partition. The race can’t happen.', C.mem)}
                <p style={{ color: C.dim, margin: '4px 0' }}>Clean and correct, but that key’s throughput is now one worker’s.</p>
              </>
            )}
          </div>
        )}
      </Toggler>
    ),
    simplifies:
      'Presents three pure strategies; production code blends them (a fast optimistic path with a pessimistic fallback) and must bound retry storms.',
    related: { toys: ['hotpartition'], terms: ['optimistic', 'distlock', 'idempotent', 'consistency', 'readpct'] },
    feltIn: { note: <>A hot key is contention at the storage layer — watch it saturate one node.</>, to: '/lab/hotpartition', cta: 'play HOT PARTITION' },
  },
  {
    id: 'scaling-reads',
    shelf: 'patterns',
    title: 'Scaling reads',
    thesis: 'A million reads a second — how much can you keep off the database?',
    body: (
      <>
        <p>
          Reads are the easy kind: the answer can be <i>copied</i>. So scaling reads is a funnel — stop each read as early
          and cheaply as possible. Drag the target read rate: the layered defense is <T k="cdn">CDN</T> edge → <T k="cache">cache</T>
          → <T k="replica">read replicas</T> → primary, each absorbing an order of magnitude so almost nothing reaches the
          truth.
        </p>
        <p style={{ color: C.dim }}>
          The metric that governs it all is the <T k="hitrate">hit rate</T>: a 90% cache hit rate turns 1M reads/s into 100k
          at the database. The cost is staleness — a cached or replica <T k="read">read</T> is a read of the recent past — so
          you decide per query which reads tolerate it (almost all) and which need the primary (
          <T k="readyourwrites">read-your-own-writes</T>).
        </p>
      </>
    ),
    viz: (
      <Slidey
        label="target read rate"
        min={4}
        max={7}
        step={1}
        init={6}
        accent={C.mem}
        fmt={(v) => `${Math.pow(10, v).toLocaleString()} reads/s`}
        compute={(v) => {
          const reads = Math.pow(10, v)
          const afterCdn = reads * 0.2 // 80% at the edge
          const afterCache = afterCdn * 0.1 // 90% cache hit on the rest
          const replicas = Math.max(1, Math.ceil(afterCache / 20_000))
          return {
            headline: (
              <>
                DB sees ~{Math.round(afterCache).toLocaleString()}/s · {replicas} replica{replicas === 1 ? '' : 's'}
              </>
            ),
            caption:
              'CDN absorbs ~80%, the cache ~90% of the rest. Each replica serves ~20k QPS, so the truth stays boring even at internet scale.',
            bars: [
              { label: 'CDN edge', frac: 0.8, col: C.net, tag: '~80%' },
              { label: 'cache', frac: 0.18, col: C.mem, tag: '~18%' },
              { label: 'DB tier', frac: 0.02, col: C.alert, tag: '~2%' },
            ],
          }
        }}
      />
    ),
    simplifies:
      'Uses fixed 80%/90% absorption rates; real hit rates depend on content and personalization, and write-heavy reads (dashboards) don’t cache well.',
    related: { toys: ['stampede', 'replag'], terms: ['cdn', 'cache', 'replica', 'hitrate', 'read'] },
    feltIn: { note: <>Order-of-magnitude drills make the reads-per-second math stick.</>, to: '/drills/session', cta: 'run some drills' },
  },
  {
    id: 'scaling-writes',
    shelf: 'patterns',
    title: 'Scaling writes',
    thesis: 'Copies don’t help writes — so what does?',
    body: (
      <>
        <p>
          First, translate the story into a number: <span className="mono">(actors) × (actions each) ÷ time</span>. 10M users
          × 50 <T k="write">writes</T>/day ÷ 86,400s ≈ 5,800 <T k="rps">writes/s</T> average, then ×3 for <T k="burst">peak</T>
          {' '}— while machine (<T k="iot">IoT</T>) fleets that <T k="phonehome">phone home</T> on a timer produce a flatter but
          relentless stream. Now the hard truth: a <T k="replica">replica</T> can't help, because every copy must apply every
          write. Your only moves are to <T k="shard">shard</T> (split the data) or <T k="queue">queue</T> (buffer the burst).
        </p>
        <p style={{ color: C.dim }}>
          Drag the write rate: at ~1,000 writes/s per partition, the shard count is just division — <i>if</i> the key spreads
          (a <T k="hotpartition">hot key</T> gets exactly one partition, so salt it). A queue smooths a spike but a
          permanent <T k="backlog">backlog</T> means your steady rate exceeds drain capacity — the queue is only delaying the
          funeral.
        </p>
        <p>
          Which leaves the move nobody volunteers: <T k="loadshedding">load shedding</T>. Once arrivals exceed what you
          can drain, the alternative to failing some requests fast is failing all of them slowly, because the queue grows
          until everything times out at once. Shedding turns a total outage into a chosen one — reject cheaply, by
          priority, with a retry-after — and saying which traffic you would drop first is a design decision, not an
          admission of defeat.
        </p>
      </>
    ),
    viz: (
      <Slidey
        label="sustained write rate"
        min={500}
        max={50_000}
        step={500}
        init={8_000}
        accent={C.storage}
        fmt={(v) => `${v.toLocaleString()} writes/s`}
        compute={(v) => {
          const shards = Math.ceil(v / 1000)
          const primaries = Math.ceil(v / 8000)
          return {
            headline: (
              <>
                {shards} partition{shards === 1 ? '' : 's'} · past {(8000).toLocaleString()}/s one primary can’t cope
              </>
            ),
            caption:
              v > 8000
                ? `Above a single primary’s ~8k durable TPS — you must shard (${shards} partitions at ~1k/s each) or buffer through a queue.`
                : 'A single primary still handles this — but design the partition key now, before the key that doesn’t spread finds you.',
            bars: [
              { label: 'partitions', frac: Math.min(shards / 50, 1), col: C.storage, tag: String(shards) },
              { label: 'vs 1 primary', frac: Math.min(primaries / 7, 1), col: C.alert, tag: `${primaries}×` },
            ],
          }
        }}
      />
    ),
    simplifies:
      'Assumes keys spread perfectly and every write is equal; real write cost varies with indexes and row size, and cross-shard transactions are the tax this omits.',
    related: { toys: ['hotpartition', 'replag'], terms: ['write', 'shard', 'queue', 'hotpartition', 'backlog', 'burst', 'replica', 'durable'] },
    feltIn: { note: <>Watch a hot partition key pin one node at its write ceiling.</>, to: '/lab/hotpartition', cta: 'play HOT PARTITION' },
  },
  {
    id: 'large-blobs',
    shelf: 'patterns',
    title: 'Handling large blobs',
    thesis: 'A user uploads a 2 GB video — where do those bytes go?',
    body: (
      <>
        <p>
          Never route big bytes through your app servers — a 2 GB upload would tie up a request thread for minutes and
          exhaust memory. Scrub the flow: the client asks your API for a <T k="presigned">presigned URL</T>, uploads the{' '}
          <T k="blob">blob</T> <i>directly</i> to object storage, and your database stores only the key. Downloads serve
          through a <T k="cdn">CDN</T>.
        </p>
        <p style={{ color: C.dim }}>
          The app server only ever handles tiny metadata; the heavy <T k="throughput">throughput</T> is between the client
          and the storage/CDN edge, which are built for exactly that. For huge files, multipart upload splits the blob into
          parts uploaded in parallel and retried independently.
        </p>
        <p>
          Downloads get the same treatment in reverse, through the <T k="rangerequest">range request</T>: the client asks
          for bytes 5,000,000 through 6,000,000 rather than the whole object. That one header is why seeking inside a video
          works without fetching the file first, and why a connection dropping at 90% resumes from byte 1.8 GB instead of
          starting over — which on a flaky link is the difference between finishing and never finishing.
        </p>
      </>
    ),
    viz: (
      <Stepper
        accent={C.storage}
        nodes={['client', 'API', 'object store', 'DB', 'CDN']}
        steps={[
          { active: [0, 1], edge: [0, 1], cap: <>Client asks the API to start an upload. The API never touches the bytes.</> },
          { active: [1, 0], edge: [1, 0], cap: <>API returns a presigned URL — a time-limited, scoped permission to write one object.</> },
          { active: [0, 2], edge: [0, 2], cap: <>Client uploads the 2 GB blob straight to object storage. No app thread held.</> },
          { active: [0, 3], edge: [0, 3], cap: <>Client tells the API "done"; the DB stores just the object key + metadata.</> },
          { active: [4, 2], edge: [4, 2], cap: <>Downloads serve from the CDN, cached near the user — origin bytes stay put.</> },
        ]}
      />
    ),
    simplifies:
      'Omits virus scanning, thumbnail/transcode pipelines (triggered async off the upload), and presigned-URL expiry/permission scoping details.',
    related: { toys: ['pipe'], terms: ['presigned', 'blob', 'cdn', 'throughput'] },
    feltIn: { note: <>The Builder prices storage, egress, and transfer for a media workload.</>, to: '/builder', cta: 'open the Builder' },
  },
  {
    id: 'multi-step',
    shelf: 'patterns',
    title: 'Multi-step processes',
    thesis: 'Book a flight and a hotel and a car — all or nothing, across services?',
    body: (
      <>
        <p>
          When one operation spans several services (each with its own database), you can't wrap them in a single
          transaction. Two shapes, toggled below. Two-phase commit (<T k="2pc">2PC</T>) makes a coordinator lock all
          participants and commit together — strongly consistent, but it blocks and the coordinator is a failure point. A{' '}
          <T k="saga">saga</T> runs the steps as a sequence, each with a compensating undo if a later step fails.
        </p>
        <p style={{ color: C.dim }}>
          Sagas trade atomicity for availability: there's a window where the flight is booked but the hotel isn't, resolved
          by a <T k="compensation">compensating transaction</T> (cancel the flight) rather than a rollback — the booking
          really happened and someone may have seen it, so the undo is itself a visible business event. Because steps
          retry, each must be <T k="idempotent">idempotent</T>, and failures that can't compensate land in a{' '}
          <T k="dlq">dead-letter queue</T> for a human. 2PC wins only when steps are few, fast, and truly must be atomic.
        </p>
        <p>
          Who drives the sequence is a second decision. With <T k="choreography">choreography</T> each service reacts to
          the others' events and no coordinator exists — decoupled, and the workflow is written down nowhere, so nobody
          can answer where an order got stuck. With <T k="orchestration">orchestration</T> one coordinator holds the
          definition and every instance's position is a query. The usual objection is that the coordinator becomes a
          single point of failure, which is exactly what <T k="durableexecution">durable execution</T> engines remove:
          they record each step's result and resume a crashed workflow by replaying that history to the first unfinished
          step — replay, not retry, so a completed charge never runs twice.
        </p>
      </>
    ),
    viz: (
      <Toggler
        options={[
          { id: '2pc', label: 'two-phase commit', col: C.net },
          { id: 'saga', label: 'saga', col: C.mem },
        ]}
        initial="saga"
      >
        {(id) =>
          id === '2pc' ? (
            <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
              {line('Prepare → commit:', 'coordinator asks all to prepare, then all to commit. Atomic across services.', C.net)}
              <p style={{ color: C.dim, margin: '4px 0' }}>Participants hold locks while waiting; a coordinator crash can leave them stuck. Doesn’t scale wide.</p>
            </div>
          ) : (
            <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
              {line('Step, step, step (+ undo):', 'book flight → book hotel → book car; any failure fires compensations backward.', C.mem)}
              <p style={{ color: C.dim, margin: '4px 0' }}>Available and scalable, but eventually consistent — and every step needs an idempotent undo.</p>
            </div>
          )
        }
      </Toggler>
    ),
    simplifies:
      'Ignores orchestration-vs-choreography (a central coordinator vs events), and that designing correct compensations is the genuinely hard part.',
    related: { toys: ['consensus'], terms: ['saga', '2pc', 'idempotent', 'dlq', 'consensus'] },
    feltIn: { note: <>Flaw puzzles hide missing compensations and non-idempotent steps.</>, to: '/review/flaw', cta: 'find the flaw' },
  },
  {
    id: 'proximity',
    shelf: 'patterns',
    title: 'Proximity-based services',
    thesis: '"Find drivers within 2 km" — why is that hard for a normal index?',
    body: (
      <>
        <p>
          A <T k="btree">B-tree index</T> sorts one dimension; "near me" is two (lat and lng), so a naive query scans a
          bounding box and filters — slow, and it re-scans as everything moves. The fix is to turn 2D space into a 1D key an
          index can handle. Toggle the two schemes below.
        </p>
        <p style={{ color: C.dim }}>
          A <T k="geohash">geohash</T> interleaves lat/lng bits so nearby points share a key prefix — a range scan on the
          prefix returns a neighborhood. A <T k="quadtree">quadtree</T> recursively splits space into quadrants, staying
          dense where points cluster. Both let you <T k="shard">shard</T> by region and index the hot cell — the same
          hot-key care applies where everyone crowds one area.
        </p>
      </>
    ),
    viz: (
      <Toggler
        options={[
          { id: 'geohash', label: 'geohash', col: C.net },
          { id: 'quad', label: 'quadtree', col: C.compute },
        ]}
        initial="geohash"
      >
        {(id) =>
          id === 'geohash' ? (
            <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
              {line('Interleave bits → prefix:', '"dr5ru" ≈ a ~150 m cell. Nearby points share the prefix; a range scan finds them.', C.net)}
              <p style={{ color: C.dim, margin: '4px 0' }}>Fixed grid: simple and index-friendly, but edge cases at cell borders need neighbor checks.</p>
            </div>
          ) : (
            <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
              {line('Recursive quadrants:', 'split a cell into four whenever it gets crowded; sparse areas stay one big cell.', C.compute)}
              <p style={{ color: C.dim, margin: '4px 0' }}>Adapts to density (great for cities), but the structure is heavier to maintain as points move.</p>
            </div>
          )
        }
      </Toggler>
    ),
    simplifies:
      'Skips the border-neighbor query (a point near a cell edge needs adjacent cells) and the write cost of re-indexing constantly-moving objects.',
    related: { toys: ['hotpartition'], terms: ['geohash', 'quadtree', 'btree', 'shard'] },
    feltIn: { note: <>Estimation drills size "riders per city cell" from a fleet story.</>, to: '/drills/session', cta: 'run some drills' },
  },
]
