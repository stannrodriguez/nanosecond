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
    thesis: 'How does a server tell the client something changed without waiting to be asked?',
    body: (
      <>
        <p>
          Plain HTTP is client-pull: the server only speaks when spoken to. Showing live data means choosing a point on
          the spectrum between freshness and server cost. Compare the four options below. <T k="polling">Polling</T>{' '}
          checks in on a timer, which is simple to build, though most trips come back empty. Long-polling holds each
          request open until news arrives. <T k="sse">Server-sent events</T> keep a one-way stream open from server to
          client. A <T k="websocket">WebSocket</T> upgrades the connection into a full-duplex pipe where either side can
          talk at any time.
        </p>
        <p style={{ color: C.dim }}>
          The catch is <T k="fanout">fan-out</T>: pushing a single event to a million connected clients means a million
          outbound sends, and every open socket claims memory on a server that can no longer stay stateless. Polling
          wins when updates are rare across a big crowd; push wins when updates arrive fast and latency matters, as in
          chat, trading, or presence. Dropped connections are the second bill you pay. SSE can replay what a client
          missed through <T k="lasteventid">Last-Event-ID</T>, but only if the server kept a buffer of recent events.
          When you are moving live audio or video instead of small events, <T k="webrtc">WebRTC</T> shifts the media
          peer-to-peer so it stays off your servers.
        </p>
        <p>
          "Off your servers" comes with one big footnote. Both peers usually sit behind <T k="nat">NAT</T>, sharing a
          public address with no open inbound mapping, so neither side can be reached until it sends traffic outward
          first. They meet on a <T k="signaling">signaling</T> server (typically an ordinary WebSocket) to swap
          addresses and codecs before a direct link exists, and a relay server still bridges peers whose NAT refuses to
          cooperate. Only the media travels peer-to-peer; the introduction still goes through you.
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
                {line('Poll every 10s:', 'dead simple and works everywhere, at the cost of ~5s average staleness and mostly empty replies.', C.compute)}
                <p style={{ color: C.dim, margin: '4px 0' }}>1M clients × 6/min = 100k req/s just to hear "nothing new" most of the time.</p>
              </>
            )}
            {id === 'long' && (
              <>
                {line('Long-poll:', 'hold the request open until an update lands, then reconnect right away. Near-realtime over plain HTTP.', C.gold)}
                <p style={{ color: C.dim, margin: '4px 0' }}>Far fewer empty responses, though every waiting client still holds an open connection.</p>
              </>
            )}
            {id === 'sse' && (
              <>
                {line('Server-sent events:', 'one long-lived stream, server → client only, with automatic reconnect built into the browser.', C.net)}
                <p style={{ color: C.dim, margin: '4px 0' }}>A clean fit for feeds, tickers, and notifications. Client → server messages still go over separate requests.</p>
              </>
            )}
            {id === 'ws' && (
              <>
                {line('WebSocket:', 'full-duplex with the lowest latency. Built for chat, collaboration, and multiplayer state.', C.mem)}
                <p style={{ color: C.dim, margin: '4px 0' }}>Every live socket holds server memory and state, so fan-out and horizontal scaling take real architecture.</p>
              </>
            )}
          </div>
        )}
      </Toggler>
    ),
    simplifies:
      'Leaves out the connection-management tier (a pub/sub layer that routes each event to the server holding the right socket), which is where realtime systems get genuinely tricky.',
    related: { toys: [], terms: ['polling', 'sse', 'websocket', 'fanout', 'lasteventid', 'webrtc'] },
    feltIn: { note: <>Taste Tests put polling and push head-to-head under specific update rates.</>, to: '/review/taste', cta: 'try a Taste Test' },
  },
  {
    id: 'long-running-tasks',
    shelf: 'patterns',
    title: 'Managing long-running tasks',
    thesis: 'Should the user wait for the finished work, or take a receipt and check back?',
    body: (
      <>
        <p>
          When a request kicks off slow work, like transcoding a video or building a heavy report, running it
          synchronously ties up a connection and a worker thread from start to finish. Under a <T k="burst">burst</T>,
          those slow jobs fill the whole pool and even quick requests start timing out. The fix is to decouple
          acceptance from execution: validate the job, hand back a receipt (HTTP 202 plus a status URL), and let a{' '}
          <T k="worker">worker</T> pull it off a <T k="queue">queue</T> in the background. Compare both paths below.
        </p>
        <p style={{ color: C.dim }}>
          Going async gives you <T k="backpressure">backpressure</T> (the queue absorbs the spike instead of your web
          tier) along with clean retries. The tradeoff is <T k="atleastonce">at-least-once</T> delivery: a job can be
          handed to a worker more than once, so the work must be <T k="idempotent">idempotent</T> to avoid double-running
          side effects. Stay synchronous when the work is fast and the user needs the answer <i>now</i>, like a login;
          move to a queue whenever the work is slow or arrives in bursts.
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
              {line('Client waits 40s:', 'one thread and one connection stay pinned for the entire run. 200 slow jobs exhaust the pool.', C.alert)}
              <p style={{ color: C.dim, margin: '4px 0' }}>Once the pool fills, a traffic burst turns into timeouts for everyone, fast requests included.</p>
            </div>
          ) : (
            <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
              {line('Accept in ~5ms:', 'return 202 plus a status URL; a background worker pulls the 40s job off the queue.', C.mem)}
              <p style={{ color: C.dim, margin: '4px 0' }}>Spikes pile up in the queue instead of starving the app, and retries stay safe because the job is idempotent.</p>
            </div>
          )
        }
      </Toggler>
    ),
    simplifies:
      'Leaves out how the client learns the job finished (status polling or webhooks), and assumes the worker fleet can eventually drain the queue.',
    related: { toys: ['backpressure', 'queue'], terms: ['queue', 'worker', 'backpressure', 'atleastonce', 'idempotent', 'burst'] },
    feltIn: { note: <>Watch a bounded buffer decide whether to drop, block, or blow up under load.</>, to: '/lab/backpressure', cta: 'play BACKPRESSURE' },
  },
  {
    id: 'contention',
    shelf: 'patterns',
    title: 'Dealing with contention',
    thesis: 'Two requests want the same row at the same instant. Who wins, and how?',
    body: (
      <>
        <p>
          Contention happens when many writers chase the same piece of state: the last concert seat, a shared counter,
          an account balance. You have three main moves, toggled below. <T k="pessimistic">Pessimistic locking</T>{' '}
          lines writers up behind a lock so only one touches the row at a time. Optimistic concurrency lets them race
          and rejects the loser with a version check powered by <T k="compareandset">compare-and-set</T>, the single
          atomic operation underneath conditional writes, ETags, and version columns. Serializing all writes for that
          key through one owner (a queue or a single partition) removes the race altogether.
        </p>
        <p style={{ color: C.dim }}>
          Traffic shape picks the winner. Under low contention, <T k="optimistic">optimistic</T> concurrency is fastest
          because conflicts are rare and nobody waits on a lock. Under heavy contention, optimistic writers burn CPU
          retrying over and over, so a lock or a serialized owner pulls ahead. Whichever route you choose, retries must
          be <T k="idempotent">idempotent</T>, and contenders spread across separate machines need a{' '}
          <T k="distlock">distributed lock</T>.
        </p>
        <p>
          Watch out for two quiet failure modes in version checks. First, if the field you compare can change and then
          return to its old value while you were deciding (the <T k="aba">ABA problem</T>), compare-and-set will succeed
          right over updates you never saw. That is why you check a monotonically increasing version number rather than
          the business value itself. Second, if two writers read the same set of rows and each updates a{' '}
          <i>different</i> row, nothing collides row-by-row even though the invariant across those rows breaks. That is{' '}
          <T k="writeskew">write skew</T>, and none of the three row-level moves below can catch it because there is no
          shared row to lock or version. Closing that gap takes <T k="serializable">serializable</T> isolation or a lock
          on the predicate itself.
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
                {line('Lock the row:', 'writer B waits for A to commit. Zero wasted work, but updates proceed one at a time.', C.storage)}
                <p style={{ color: C.dim, margin: '4px 0' }}>Strong under heavy contention. Watch out for long-held locks and deadlocks.</p>
              </>
            )}
            {id === 'opt' && (
              <>
                {line('Read version, write if unchanged:', 'both writers race; the loser hits a version mismatch and retries.', C.net)}
                <p style={{ color: C.dim, margin: '4px 0' }}>Fastest when collisions are rare. Thrashes in retry loops once a row gets hot.</p>
              </>
            )}
            {id === 'serial' && (
              <>
                {line('One owner:', 'funnel every write for that key through a single queue or partition so no two writes collide.', C.mem)}
                <p style={{ color: C.dim, margin: '4px 0' }}>Simple to reason about and strictly ordered, capped at one worker’s throughput for that key.</p>
              </>
            )}
          </div>
        )}
      </Toggler>
    ),
    simplifies:
      'Shows three pure strategies; real services often combine them (an optimistic fast path with a pessimistic fallback) and cap retries to stop retry storms.',
    related: { toys: ['hotpartition'], terms: ['optimistic', 'distlock', 'idempotent', 'consistency', 'readpct'] },
    feltIn: { note: <>A hot key is contention at the storage tier. Watch it pin a single node to the wall.</>, to: '/lab/hotpartition', cta: 'play HOT PARTITION' },
  },
  {
    id: 'scaling-reads',
    shelf: 'patterns',
    title: 'Scaling reads',
    thesis: 'At a million reads a second, how much of that traffic can you keep off the database?',
    body: (
      <>
        <p>
          Reads are the forgiving half of scale because an answer can be <i>copied</i>. Scaling reads is really
          building a funnel that stops each request as early and cheaply as possible. Drag the target read rate below
          to see the layered defense at work: <T k="cdn">CDN</T> edge → <T k="cache">cache</T> →{' '}
          <T k="replica">read replicas</T> → primary. Each layer sheds roughly an order of magnitude so the source of
          truth sees only a trickle.
        </p>
        <p style={{ color: C.dim }}>
          The lever that drives the math is <T k="hitrate">hit rate</T>: a 90% cache hit rate turns 1M reads/s into
          100k at the database. What you pay in exchange is freshness. A cached or replica <T k="read">read</T> is
          always a snapshot of the recent past, so you choose per query which reads can live with slight lag (almost
          all of them) and which must go straight to the primary for <T k="readyourwrites">read-your-own-writes</T>.
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
              'The CDN absorbs ~80%, and the cache catches ~90% of what gets through. At ~20k QPS per replica, the database tier stays calm even at internet scale.',
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
      'Holds absorption fixed at 80% and 90%; real hit rates shift with content and personalization, and write-heavy views like live dashboards barely cache at all.',
    related: { toys: ['stampede', 'replag'], terms: ['cdn', 'cache', 'replica', 'hitrate', 'read'] },
    feltIn: { note: <>Order-of-magnitude drills make reads-per-second math second nature.</>, to: '/drills/session', cta: 'run some drills' },
  },
  {
    id: 'scaling-writes',
    shelf: 'patterns',
    title: 'Scaling writes',
    thesis: 'Extra copies cannot scale writes, so what actually can?',
    body: (
      <>
        <p>
          Start by turning the product story into a rate: <span className="mono">(actors) × (actions each) ÷ time</span>.
          Take 10M users × 50 <T k="write">writes</T>/day ÷ 86,400s ≈ 5,800 <T k="rps">writes/s</T> on average, then
          multiply by 3 for <T k="burst">peak</T>. Machine (<T k="iot">IoT</T>) fleets that{' '}
          <T k="phonehome">phone home</T> on a fixed timer behave differently: flatter across the clock, yet relentless.
          Now comes the hard constraint: adding a <T k="replica">replica</T> does not help write throughput, because
          every copy still has to apply every write. Your real levers are to <T k="shard">shard</T> (split the data
          across primaries) or <T k="queue">queue</T> (smooth out a temporary burst).
        </p>
        <p style={{ color: C.dim }}>
          Drag the write rate below. At ~1,000 writes/s per partition, sizing shards is plain division, <i>provided</i>{' '}
          your key spreads traffic evenly. A <T k="hotpartition">hot key</T> still lands on one partition unless you
          salt it. A queue can absorb a short spike, but a permanent <T k="backlog">backlog</T> means steady arrivals
          outpace what your workers can drain. At that point the queue is only postponing the outage.
        </p>
        <p>
          That brings you to the move few people think to name out loud: <T k="loadshedding">load shedding</T>. Once
          incoming writes exceed your drain rate, the only alternative to failing some requests quickly is failing all
          of them slowly, as the queue swells until everything times out together. Shedding turns an accidental total
          outage into a deliberate partial one: reject cheaply, drop lower-priority traffic first, and return a
          retry-after hint. Choosing which traffic gives way first is a design decision, not an admission of defeat.
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
                {shards} partition{shards === 1 ? '' : 's'} · past {(8000).toLocaleString()}/s one primary can’t keep up
              </>
            ),
            caption:
              v > 8000
                ? `Past a single primary’s ~8k durable TPS: time to shard (${shards} partitions at ~1k/s each) or buffer bursts through a queue.`
                : 'One primary still handles this rate, though you want to pick a clean partition key now before an uneven key finds you.',
            bars: [
              { label: 'partitions', frac: Math.min(shards / 50, 1), col: C.storage, tag: String(shards) },
              { label: 'vs 1 primary', frac: Math.min(primaries / 7, 1), col: C.alert, tag: `${primaries}×` },
            ],
          }
        }}
      />
    ),
    simplifies:
      'Assumes keys spread evenly and every write costs the same; real write cost changes with secondary indexes and row size, and this skips the tax of cross-shard transactions.',
    related: { toys: ['hotpartition', 'replag'], terms: ['write', 'shard', 'queue', 'hotpartition', 'backlog', 'burst', 'replica', 'durable'] },
    feltIn: { note: <>Watch a single hot partition key pin one node against its write ceiling.</>, to: '/lab/hotpartition', cta: 'play HOT PARTITION' },
  },
  {
    id: 'large-blobs',
    shelf: 'patterns',
    title: 'Handling large blobs',
    thesis: 'A user uploads a 2 GB video. Where should all those bytes actually go?',
    body: (
      <>
        <p>
          Keep big payloads off your app servers. Streaming a 2 GB upload through an API process holds a request thread
          hostage for minutes and chews through memory. Step through the flow below: the client asks your API for a{' '}
          <T k="presigned">presigned URL</T>, sends the <T k="blob">blob</T> <i>directly</i> to object storage, and
          lets your database store only the object key and metadata. Downloads flow out through a <T k="cdn">CDN</T>.
        </p>
        <p style={{ color: C.dim }}>
          Your app tier only ever handles tiny metadata, while heavy <T k="throughput">throughput</T> stays between
          the client and the object store or CDN edge, which are built for bulk transfer. For huge files, multipart
          upload slices the blob into chunks that upload in parallel and retry independently if one chunk drops.
        </p>
        <p>
          Downloads use the same idea in reverse via a <T k="rangerequest">range request</T>: the client asks for bytes
          5,000,000 through 6,000,000 instead of pulling the entire object. That single HTTP header is why you can scrub
          ahead in a video without downloading the whole file first, and why a connection that drops at 90% can pick up
          at byte 1.8 GB rather than starting from zero. On a flaky network, resumability is the difference between
          finishing a download and never finishing it at all.
        </p>
      </>
    ),
    viz: (
      <Stepper
        accent={C.storage}
        nodes={['client', 'API', 'object store', 'DB', 'CDN']}
        steps={[
          { active: [0, 1], edge: [0, 1], cap: <>Client asks the API for permission to upload. The API never touches the video bytes.</> },
          { active: [1, 0], edge: [1, 0], cap: <>API returns a presigned URL: a time-limited, tightly scoped pass to write one object.</> },
          { active: [0, 2], edge: [0, 2], cap: <>Client streams the 2 GB blob straight to object storage. Zero app threads tied up.</> },
          { active: [0, 3], edge: [0, 3], cap: <>Client notifies the API that the upload finished; the DB stores just the object key and metadata.</> },
          { active: [4, 2], edge: [4, 2], cap: <>Downloads serve from the CDN close to the viewer, so origin bytes barely have to move.</> },
        ]}
      />
    ),
    simplifies:
      'Skips malware scanning, async thumbnail and transcode pipelines triggered after upload, and the fine print of presigned-URL expiry and permission scoping.',
    related: { toys: ['pipe'], terms: ['presigned', 'blob', 'cdn', 'throughput'] },
    feltIn: { note: <>The Builder prices storage, egress, and transfer for a media workload.</>, to: '/builder', cta: 'open the Builder' },
  },
  {
    id: 'multi-step',
    shelf: 'patterns',
    title: 'Multi-step processes',
    thesis: 'Book a flight, a hotel, and a car across separate services. Can it still be all or nothing?',
    body: (
      <>
        <p>
          Once a workflow crosses several services, each with its own database, you cannot wrap the whole trip in one
          local transaction. Toggle between the two main approaches below. Two-phase commit (<T k="2pc">2PC</T>) uses a
          coordinator to lock every participant and commit them together. It delivers strong consistency, at the cost
          of blocking participants while the coordinator decides and turning that coordinator into a failure point. A{' '}
          <T k="saga">saga</T> runs the steps one by one, pairing each step with a compensating undo in case a later
          step fails.
        </p>
        <p style={{ color: C.dim }}>
          Sagas trade strict atomicity for availability. There is a brief window where the flight is booked and the
          hotel is not yet confirmed, and any failure unwinds through a{' '}
          <T k="compensation">compensating transaction</T> (canceling the flight) rather than a database rollback. The
          first booking genuinely happened and someone may already have seen it, so the undo has to be a visible
          business event of its own. Because network calls retry, every forward step and undo must be{' '}
          <T k="idempotent">idempotent</T>, and failures that still cannot compensate land in a{' '}
          <T k="dlq">dead-letter queue</T> for human cleanup. Reach for 2PC only when the steps are few, fast, and
          genuinely must be atomic.
        </p>
        <p>
          Who drives those steps is a second design choice. Under <T k="choreography">choreography</T>, each service
          listens for events from the others with no central coordinator. Services stay decoupled, yet the full
          workflow is not written down in any one place, so figuring out where an order stalled takes detective work.
          Under <T k="orchestration">orchestration</T>, a single coordinator owns the workflow definition, and any
          in-flight order’s position is a direct query. The usual worry is making that coordinator a single point of
          failure, which is the exact problem <T k="durableexecution">durable execution</T> engines solve: they persist
          each step’s result and recover from a crash by replaying that history up to the first unfinished step. It is
          replay rather than retry, so an already-completed charge never runs twice.
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
              {line('Prepare → commit:', 'the coordinator asks every participant to prepare, then tells all of them to commit. Atomic across services.', C.net)}
              <p style={{ color: C.dim, margin: '4px 0' }}>Participants hold locks while waiting, and a coordinator crash can leave them stuck. Hard to scale across many services.</p>
            </div>
          ) : (
            <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
              {line('Step, step, step (+ undo):', 'book flight → book hotel → book car; if a step fails, compensations run backward.', C.mem)}
              <p style={{ color: C.dim, margin: '4px 0' }}>Stays available and scales cleanly, at the price of eventual consistency and an idempotent undo for every step.</p>
            </div>
          )
        }
      </Toggler>
    ),
    simplifies:
      'The toggle skips orchestration vs. choreography (a central coordinator vs. independent events) and leaves out how hard it is to design airtight compensations.',
    related: { toys: ['consensus'], terms: ['saga', '2pc', 'idempotent', 'dlq', 'consensus'] },
    feltIn: { note: <>Flaw Puzzles hide missing compensations and steps that break on retry.</>, to: '/review/flaw', cta: 'find the flaw' },
  },
  {
    id: 'proximity',
    shelf: 'patterns',
    title: 'Proximity-based services',
    thesis: '"Find drivers within 2 km." Why does a standard database index struggle with that?',
    body: (
      <>
        <p>
          A <T k="btree">B-tree index</T> sorts along one dimension, while "near me" lives in two (latitude and
          longitude). Sorting by latitude still scatters longitude, so a naive query scans a wide bounding box and
          filters every row, then has to do it all over again as objects move. The trick is to fold 2D space into a 1D
          key that a normal index can navigate. Compare the two main schemes below.
        </p>
        <p style={{ color: C.dim }}>
          A <T k="geohash">geohash</T> interleaves latitude and longitude bits so nearby points share a key prefix; a
          simple prefix range scan pulls back a whole neighborhood. A <T k="quadtree">quadtree</T> recursively splits
          crowded regions into four quadrants while leaving sparse areas in one big cell. Both schemes let you{' '}
          <T k="shard">shard</T> by region and index busy cells, though the same hot-key lessons still apply whenever
          half a city crowds into one neighborhood.
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
              {line('Interleave bits → prefix:', '"dr5ru" covers a ~150 m cell. Nearby points share the prefix, so a range scan finds them fast.', C.net)}
              <p style={{ color: C.dim, margin: '4px 0' }}>Fixed grid: simple and index-friendly, though points near a cell edge need neighbor checks too.</p>
            </div>
          ) : (
            <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
              {line('Recursive quadrants:', 'split a cell into four whenever it fills up; quiet areas stay in a single wide cell.', C.compute)}
              <p style={{ color: C.dim, margin: '4px 0' }}>Adapts cleanly to uneven density (great for cities), at the cost of a heavier tree to update as points move.</p>
            </div>
          )
        }
      </Toggler>
    ),
    simplifies:
      'Leaves out border-neighbor queries (a point near a cell edge has to check adjacent cells) and the write overhead of re-indexing objects that never stop moving.',
    related: { toys: ['hotpartition'], terms: ['geohash', 'quadtree', 'btree', 'shard'] },
    feltIn: { note: <>Estimation drills size "riders per city cell" straight from a fleet story.</>, to: '/drills/session', cta: 'run some drills' },
  },
]
