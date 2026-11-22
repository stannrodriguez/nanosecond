// Core Concepts shelf (8) — the load-bearing ideas every other section leans on.
// Contract + bar: docs/content-pipeline.md §7. The viz carries the explanation.

import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { C } from '../../theme'
import { Term as T } from '../../ui/Term'
import { Slidey, Toggler, Stepper, HashRing } from '../../ui/viz'
import { LayerStack } from '../../ui/LayerStack'
import { LossToggle } from '../../ui/LossToggle'
import { BTreeWalk } from '../../ui/BTreeWalk'
import { LsmPath } from '../../ui/LsmPath'
import type { ManualSection } from './types'

const mono = (children: ReactNode) => (
  <span className="mono" style={{ color: C.text }}>
    {children}
  </span>
)

// A labelled line inside a Toggler panel.
const line = (label: string, val: ReactNode, col: string) => (
  <p style={{ margin: '4px 0' }}>
    <b style={{ color: col }}>{label}</b> {val}
  </p>
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
      Every network protocol you will ever name in an interview is answering the same question:{' '}
      <b>what does this layer promise the one sitting on top of it?</b> <T k="ip">IP</T> promises best-effort delivery:
      hand it a packet and an address, and it will probably get there, anywhere on earth. <T k="tcp">TCP</T> promises
      a clean stream: hand it bytes, and the other end will receive every single one of them, in order. HTTP promises
      a conversation with meaning: ask a named server for a resource, and get a labeled answer back. Each layer builds
      on the promise below without knowing how it works, while the layer below keeps its promise without caring why you
      made the call. That stack of contracts is why you can ship a web app without once thinking about fiber, radio, or
      routing tables. Three floors down, someone else is turning your bytes into light.
    </p>
    <p>
      The OSI model lists seven layers, though in system design three of them do nearly all the real work. <b>L3</b>{' '}
      gets packets to a machine, <b>L4</b> turns packets into a conversation, and <b>L7</b> gives that conversation
      meaning. The action clusters this way because of where the code lives. L3 and L4 run inside the operating system's
      kernel, which is decades old, heavily tuned, and very slow to change. That is why the internet has leaned on TCP
      and <T k="udp">UDP</T> for fifty years, and why <T k="quic">QUIC</T>, the first serious newcomer, had to tuck
      itself inside UDP just to make it across existing routers. L7 runs in your own process, where anyone can invent a
      protocol before lunch, so that floor stays crowded with HTTP, <T k="grpc">gRPC</T>,{' '}
      <T k="websocket">WebSockets</T>, and whatever internal wire format your company built.
    </p>
  </>
)

const NET_STACK_VIZ = (
  <>
    <LayerStack accent={C.net} />
    <p style={{ color: C.dim, fontSize: 14, lineHeight: 1.6 }}>
      Treat this stack like a filing cabinet and it sorts half of networking vocabulary on sight. Regions, round trips,
      and the speed of light live at L3. TCP vs UDP, <T k="handshake">handshakes</T>, and head-of-line blocking live at
      L4. REST vs gRPC, <T k="polling">polling</T> vs push, and anything you can {mono('curl')} live at L7. When an
      interviewer mentions an "L4 <T k="lb">load balancer</T>," they are telling you exactly which promises it can see:
      addresses and connections, never the request riding inside.
    </p>
  </>
)

const NET_TRANSPORT_BODY = (
  <>
    <p>
      L4 is where networking's core tradeoff happens, so it deserves a closer look. <b>TCP's promise is completeness.</b>{' '}
      It numbers every byte, the receiver acknowledges what showed up, and anything unacknowledged gets sent again.
      Ordering is strict. If byte 4,001 disappears in transit, bytes 4,002 through 4,000,000 sit waiting in a buffer and
      reach your application only after that single gap is filled. Refusing to deliver newer bytes ahead of a missing
      one is <T k="headofline">head-of-line blocking</T>, and it is the honest price of a guaranteed stream:{' '}
      <b>the stream is never wrong, yet it can arrive arbitrarily late.</b> Recovering one lost packet costs at least
      one <T k="rtt">round trip</T>, because the sender has to hear about the loss before it can resend. And a round
      trip is pure geography: ~1&nbsp;ms across a city, ~70&nbsp;ms across a country, and ~150&nbsp;ms across an ocean.
    </p>
    <p>
      <b>UDP's promise is speed, kept by promising nothing else.</b> A datagram is an addressed envelope. It might
      arrive, arrive twice, or show up after the packet sent behind it, and the instant it lands, your application gets
      it. There is no handshake before byte one, no acknowledgments, and no buffer holding fresh data hostage to old
      losses. UDP is not a bargain-bin TCP; it is the right tool for a different job. On a video call, an audio packet
      that shows up 400&nbsp;ms late is already stale because the conversation moved on, and one crackled syllable beats
      a call that freezes and then fast-forwards to catch up. <b>Reach for UDP whenever a late packet hurts more than a
      lost one</b>, such as live audio and video, game state, or high-volume telemetry. Just check the browser wrinkle
      first: browsers cannot speak raw UDP, so on the web this choice arrives as <T k="webrtc">WebRTC</T>.
    </p>
  </>
)

const NET_TRANSPORT_VIZ = (
  <>
    <LossToggle accent={C.net} />
    <p style={{ color: C.dim, fontSize: 14, lineHeight: 1.6 }}>
      One piece of protocol history makes this concrete. TCP's head-of-line blocking applies to the whole{' '}
      <i>connection</i>, so when HTTP/2 multiplexed many requests onto one TCP connection, a single lost packet could
      stall every request sharing it. QUIC was built to solve that by giving streams independence so they do not block
      one another, while folding TLS into the first round trip. HTTP/3 is simply HTTP running over QUIC. You will rarely
      need QUIC in an interview architecture, yet explaining <i>why it exists</i> proves in one sentence that you
      understand the layer underneath.
    </p>
  </>
)

const NET_STACK_SIMPLIFIES =
  "Real networks run TCP/IP's four layers while borrowing OSI's seven names. Layers 5 and 6 live mostly in textbooks because HTTP absorbed their jobs."

const NET_TAP_BODY = (
  <>
    <p>
      Now watch those layers work together on a single tap. First, <T k="dns">DNS</T> resolves a name into an address
      (L7 asking L3's question). Next, L4 opens a conversation: TCP's <T k="handshake">handshake</T> spends one round
      trip, and <T k="tls">TLS</T> spends one to two more. Only after all of that does your HTTP{' '}
      <T k="request">request</T> actually leave the phone. On a 70&nbsp;ms cross-country path, a cold connection burns
      140 to 210&nbsp;ms on handshakes before your API sees byte one. That pure L4 tax is why services pool and reuse
      connections, and why a <T k="cdn">CDN</T> terminates TLS near the user even for traffic it cannot cache.
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
      { active: [0], cap: <>A tap. Nothing has left the phone yet, though a cold connection is about to pay tolls on three floors of the stack.</> },
      { active: [0, 1], edge: [0, 1], cap: <>{mono('DNS')} (L7 asking L3's question) turns the hostname into an address. It is cached almost everywhere, though a cold lookup still costs real milliseconds.</> },
      { active: [0, 2], edge: [0, 2], cap: <>L4 collects its toll: the TCP handshake (SYN → SYN-ACK → ACK) takes one round trip, and {mono('TLS')} takes one to two more. That is ~100 to 200 ms for a distant user before byte one moves.</> },
      { active: [3], edge: [0, 3], cap: <>A {mono('CDN')} edge at L7 terminates TLS close to the user and can answer cacheable requests right here, sparing a trip across the ocean to your origin.</> },
      { active: [3, 4], edge: [3, 4], cap: <>Dynamic traffic passes through the {mono('LB')}, running at L4 or L7 depending on what it needs to inspect, onto interchangeable app servers.</> },
      { active: [5, 6], edge: [5, 6], cap: <>Your app at L7 runs the business logic and queries the database, the slowest stop in the chain, shielded by everything upstream.</> },
      { active: [0, 6], edge: [6, 0], cap: <>The reply streams back. Unless the connection stays open, both sides tear it down with FIN/ACK. Keep-alive exists so the next request skips those handshakes altogether.</> },
    ]}
  />
)

const NET_HANDOFF_BODY = (
  <p style={{ color: C.dim }}>
    Each layer's deeper choices live on their own pages. Shaping L7 APIs (REST's resources, gRPC's contracts) is in{' '}
    <Sec to="api-design">API design</Sec>. Pushing updates instead of polling (polling, SSE, WebSockets) lives in{' '}
    <Sec to="realtime-updates">Pushing realtime updates</Sec>. How an L4 balancer differs from an L7 one, and why
    WebSockets care, is in <Sec to="load-balancer">Load balancer</Sec>. Finally, what geography does to every latency
    number on this page is in <Sec to="cdn">CDN</Sec>. Think of the stack you just walked as the floor plan, and each
    of those pages as one furnished room.
  </p>
)

/* ---------- indexing (spec 076, coverage-map F1): six viz-led blocks ----------
   Baseline: specs/076-indexing-search-briefings.md Appendix B.1. Block 1's parts
   double as the section's legacy body/viz/simplifies fields. */

const IDX_SCAN_BODY = (
  <>
    <p>
      On disk, a table starts life as a <T k="heapfile">heap file</T>: rows land wherever there is room, in no order at
      all. The storage engine never fetches a single row by itself. It reads the whole <b>page</b> that holds the row,
      8&nbsp;KB at a time, because the page is the unit of disk I/O, buffer caching, and often locking. A full table
      scan does exactly what it sounds like: read every page, check every row. The cost scales with the table's size in
      pages, so the 200-byte row you wanted still arrives wrapped inside an 8&nbsp;KB read.
    </p>
    <p>
      Picture a filing cabinet where folders were tossed into whichever drawer had space. There is no drawer labeled M.
      To find one folder you open every drawer, and you have to pull out the whole drawer even when you only want one
      sheet of paper inside it.
    </p>
    <p>
      One assumption worth retiring early: <b>solid-state drives did not make random access free.</b> Sequential
      streaming still beats scattered random reads by roughly an order of magnitude on NVMe. That gap used to be a
      thousandfold on spinning disk, so it shrank dramatically and then leveled off. The gap that remains is why every
      structure below is a bet <i>against</i> streaming sequentially, not simply a bet against slow hardware.
    </p>
  </>
)

const IDX_SCAN_VIZ = (
  <>
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
        const pages = Math.ceil((rows * 200) / 8192) // 200-byte rows in 8 KB pages
        const seek = Math.ceil(Math.log(rows) / Math.log(340)) + 1 // B-tree fan-out ~340, plus the heap fetch
        return {
          headline: (
            <>
              full scan ≈ {pages.toLocaleString()} page reads · index ≈ {seek}
            </>
          ),
          caption: `${rows.toLocaleString()} rows at 200 bytes each fill ${pages.toLocaleString()} pages of 8 KB. A full scan reads all of them; the tree reaches any single row in ${seek} reads, ending with one random fetch into the heap.`,
          bars: [
            { label: 'full scan', frac: v / 9, col: C.alert, tag: '≈ pages' },
            { label: 'index seek', frac: seek / 9, col: C.mem, tag: `${seek}` },
          ],
        }
      }}
    />
    <p style={{ color: C.dim, fontSize: 14, lineHeight: 1.6 }}>
      Drag the slider down past roughly a thousand rows and the math flips. Reading 25 pages in one clean sequential
      burst beats walking a tree and making a random heap jump every time. Below that size an index is pure write
      overhead with a lookup tacked on. The <T k="queryplanner">planner</T> measures this and skips the index on
      purpose, which is the smart move even though engineers often mistake it for a broken index.
    </p>
  </>
)

const IDX_SCAN_SIMPLIFIES =
  'Counts logical page reads rather than cache hits; hot pages stay in RAM, and the top levels of a tree almost always do. Assumes 200-byte rows, leaves out how range scans or sorts change the math, and ignores the write tax each index adds.'

const IDX_TREE_BODY = (
  <>
    <p>
      A <T k="btree">B-tree</T> sizes each node to match a single page. With ~16-byte keys and 8-byte child pointers,
      one 8&nbsp;KB node holds around <b>340 children</b>, giving you fan-out in the hundreds rather than two. Tree
      depth grows as a logarithm in that fan-out: 340² ≈ 115,000 rows at depth 2, 340³ ≈ 39 million at depth 3, and
      340⁴ ≈ 13 <i>billion</i> at depth 4. A hundred-million-row table sits at depth ~4, and since the top two or three
      levels stay hot in memory, a real point lookup usually costs about one disk read.
    </p>
    <p>
      The tree stays balanced by rule rather than luck. Nodes stay between half-full and full, splitting when they
      overflow and merging when they empty, so every leaf stays the same number of hops from the root. No key gets stuck
      down an unlucky deep branch.
    </p>
    <p style={{ color: C.dim }}>
      That is why "our table grew tenfold and lookups slowed down" is almost never about tree height. Depth barely
      budges when each extra level multiplies reach by another 340. What actually degrades is your buffer-cache hit
      rate, or background maintenance: around a hundred million rows, a vacuum or index rebuild has to stream a hundred
      gigabytes or more, so the <i>maintenance window</i> stops fitting overnight long before point lookups slow down.
    </p>
    <p>
      A B-tree handles five jobs well, and no other index family covers all five: point lookups (one quick descent),
      range queries (leaves link sideways, so a range is one descent plus a scan along the leaves), sorted retrieval
      (keys are already in order, making ORDER BY on that column free), string prefix matching (a prefix is just a
      range), and steady behavior under mixed reads and writes. When in doubt, start here, and be ready to explain{' '}
      <i>why</i> it fits.
    </p>
  </>
)

const IDX_COST_BODY = (
  <>
    <p>
      Every index stores a second copy of its columns plus a pointer to each row, so a wide index can grow nearly as
      large as the table itself. The sharper bill lands on the <b>write</b> path: every insert, update, and delete has
      to maintain <i>every</i> index attached to that table. One logical row write turns into 1 + n physical writes for
      as long as those indexes exist.
    </p>
    <p>
      Every index is a wager that this column gets read far more often than the table gets written. Six indexes mean
      every write does seven pieces of work so that six query shapes stay fast. Make that wager on purpose, and stop
      adding indexes once the read payoff stops covering the write bill.
    </p>
    <p style={{ color: C.dim }}>
      Two cases make that bet a clear loss: a column that is written constantly and rarely queried (all cost, almost no
      payoff), and a table small enough that a sequential scan already wins, where the planner rightly ignores the index
      you built. Notice what is <i>not</i> on that list: an indexed lookup already finishes in a fraction of a
      millisecond, so when someone says "the database is slow," it is rarely disk physics. Usually it is a missing
      index, or an accidental full scan hiding behind a query.
    </p>
  </>
)

const IDX_COST_VIZ = (
  <Slidey
    label="indexes on this table"
    min={0}
    max={8}
    step={1}
    init={3}
    accent={C.storage}
    fmt={(v) => `${v}`}
    compute={(n) => ({
      headline: (
        <>
          1 row write = {1 + n} physical write{n === 0 ? '' : 's'}
        </>
      ),
      caption:
        n === 0
          ? 'No extra indexes: writes are as cheap as they get, while any query outside the primary key scans the whole table.'
          : `Every write updates ${n} index${n === 1 ? '' : 'es'} alongside the row. ${n} query shape${n === 1 ? ' gets' : 's get'} a sub-millisecond lookup; every insert, update, and delete on this table pays the upkeep.`,
      bars: [
        { label: 'write cost', frac: (1 + n) / 9, col: C.alert, tag: `${1 + n}×` },
        { label: 'index space', frac: Math.min(1, n * 0.15), col: C.compute, tag: `${Math.round(n * 15)}%` },
        { label: 'fast reads', frac: n / 8, col: C.mem, tag: `${n}` },
      ],
    })}
  />
)

const IDX_LSM_BODY = (
  <>
    <p>
      Start by clearing up a common mix-up: an <T k="lsm">LSM-tree</T> is <b>not</b> an index type you bolt onto one
      column next to a B-tree. It is the storage engine for the <i>entire table</i>. Choosing it means choosing how the
      database lays out bytes on disk, which is why wide-column stores behave the way they do from top to bottom, and
      why saying "we added an LSM index" immediately sounds off in an interview.
    </p>
    <p>
      Its write path moves through four steps. First, the write appends to the <T k="wal">write-ahead log</T> and
      fsyncs: <b>durability happens right here, and nowhere else.</b> Second, it goes into an in-memory{' '}
      <T k="memtable">memtable</T>, kept sorted at RAM speed. Third, once that memtable fills (commonly around
      64&nbsp;MB), it flushes to disk as an immutable <T k="sstable">SSTable</T> in one clean sequential write. Fourth,
      background <T k="compaction">compaction</T> merges those SSTables together, keeps the newest version of each key,
      and physically clears out deleted tombstones.
    </p>
    <p>
      A B-tree writes data where it belongs in place; an LSM writes wherever the disk is fastest and organizes things
      later. Above roughly 10,000 sustained writes per second, that difference stops being academic. A B-tree cannot
      avoid scattered random page writes, while an LSM turns them into sequential streams.
    </p>
    <p>
      Reads are where you pay the bill. Because one key's history can span multiple files, a lookup may have to check
      the memtable <i>plus every SSTable</i>. Three tools keep reads practical. A{' '}
      <T k="bloomfilter">bloom filter</T> on each file rules missing keys out with certainty (never a false negative),
      so most files are skipped without touching disk. A sparse index keeps one key per block, letting the engine jump
      straight to a byte offset instead of scanning a whole file. Finally, compaction strategy is the main tuning knob:
      leveled compaction rewrites files aggressively so reads inspect fewer files at the cost of higher write
      amplification, while size-tiered compaction rewrites less so writes stay cheap and reads check more files. They
      pull in opposite directions, and picking between them depends directly on your workload.
    </p>
    <p style={{ color: C.dim }}>
      None of this makes writes free; it moves them in time. The same bytes get rewritten several times over their life
      in background I/O that still shares disk bandwidth with live queries. What you gain is that the work happens off
      the commit path, while no client is waiting on a reply.
    </p>
  </>
)

const IDX_SHAPE_BODY = (
  <>
    <p>
      Good indexing is about choosing a <b>shape</b>, not just picking a column. A{' '}
      <T k="compositeindex">composite index</T> sorts rows by its columns in the exact order you list them: by the first
      column, then by the second inside each group of the first. Because the sort is nested, queries can only enter from
      a <b>leading prefix</b>. An index on (tenant, created_at) serves queries filtering on tenant, or filtering on
      tenant while sorting by created_at, and cannot help a query starting from created_at alone. Put the filter column
      first and the sort column second, and one traversal handles both halves with zero extra sorting.
    </p>
    <p>
      Two separate single-column indexes are not the same as one composite index, and the planner cannot glue them into
      one ordered walk. That single detail answers "why isn't the database using my index?" more often than everything
      else combined.
    </p>
    <p>
      Three shapes cover most day-to-day queries. <b>(filter, sort)</b> is the pattern above. <b>(equality, range)</b>{' '}
      always puts the equality column first, because a range in the leading slot breaks the sort order of every column
      behind it. And <b>(tenant, time)</b> is the classic multi-tenant shape, where the leading column neatly isolates
      each tenant's slice inside one index. The familiar rule of thumb ("most selective column first") works right up
      until your query has a sort; once sorting enters the picture, column order matters more, because getting it wrong
      forces the engine to pull and sort the entire result set in memory.
    </p>
    <p style={{ color: C.dim }}>
      Two sharper tools sit on top of those shapes, both more specialized than they sound. A{' '}
      <T k="coveringindex">covering index</T> includes the columns the query returns so the engine answers straight from
      the leaf and skips the random heap fetch (the expensive final hop from the descent above). Because it copies those
      extra columns on every write, treat it as a surgical win for one measured, hot, narrow query rather than a
      default. A <T k="partialindex">partial index</T> indexes only rows matching a condition, letting a job queue keep
      its handful of pending rows in a tiny in-memory index while millions of completed rows cost nothing to maintain.
    </p>
  </>
)

const IDX_SHAPE_VIZ = (
  <Toggler
    options={[
      { id: 'sort', label: 'filter + sort', col: C.storage },
      { id: 'range', label: 'equality + range', col: C.compute },
      { id: 'cover', label: 'returns two columns', col: C.mem },
    ]}
    initial="sort"
  >
    {(id) =>
      id === 'sort' ? (
        <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
          {line('The query:', 'orders for one tenant, newest first, 20 of them.', C.storage)}
          {line('Right shape:', '(tenant, created_at): jump to the tenant, walk 20 leaves backward, done. No sort step.', C.mem)}
          {line('Wrong shape:', '(created_at, tenant): cannot enter by tenant at all, forcing a scan and a sort.', C.alert)}
        </div>
      ) : id === 'range' ? (
        <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
          {line('The query:', "status = 'pending' AND created_at > yesterday.", C.compute)}
          {line('Right shape:', '(status, created_at): equality first pins one contiguous slice, and the range walks cleanly inside it.', C.mem)}
          {line('Wrong shape:', '(created_at, status): the range leads, so every matching row has to be re-checked for status one by one.', C.alert)}
        </div>
      ) : (
        <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
          {line('The query:', 'SELECT id, status (nothing else) for one tenant.', C.mem)}
          {line('Right shape:', '(tenant) INCLUDE (status): the leaf already holds both columns, so the random heap fetch never happens.', C.mem)}
          {line('The price:', 'status is now stored twice and rewritten every time it changes. Justify it with measurements, not a hunch.', C.alert)}
        </div>
      )
    }
  </Toggler>
)

const IDX_LIMITS_BODY = (
  <>
    <p>
      Everything above assumes your values fit on a single sorted line, one dimension at a time. Three common query
      shapes break that assumption.
    </p>
    <p>
      <b>Exact match only.</b> A hash index answers "equals this value" in a single step and does nothing else: no
      ranges, no sorting, no prefixes. It shows up rarely in production, not because it is broken, but because a B-tree
      at depth four is already fast enough for equality while covering four other query patterns for free. Name it, say
      why you skipped it, and move on.
    </p>
    <p>
      <b>Two dimensions at once.</b> Latitude and longitude are both ordered numbers, so putting an index on each looks
      tempting. It fails in practice because the planner picks one axis and hand-filters a giant stripe across the
      planet. Sorted order is one-dimensional, and "near me" is not. Real spatial indexes either flatten the 2D plane
      into an orderable string or build a tree shaped around the points. A <T k="geohash">geohash</T> recursively splits
      the map and encodes the path as a string so nearby points share a prefix a normal B-tree can index; you still have
      to check neighboring cells, since two points on opposite sides of a cell border can sit meters apart with no
      shared prefix. A <T k="quadtree">quadtree</T> divides a region into four once it holds more than roughly a hundred
      points, so dense cities branch deep while empty ocean stays one leaf. An <T k="rtree">R-tree</T> wraps data in
      nested bounding rectangles, letting it index polygons alongside points, though overlapping sibling rectangles can
      send one search down several branches.
    </p>
    <p>
      <b>Words inside a block of text.</b> A B-tree indexes strings from the left edge, so searching for documents that{' '}
      <i>contain</i> a word anywhere in the body has no prefix to seek on and falls back to a full scan. You do not fix
      that with a cleverer B-tree. You flip the lookup around so terms map to the list of documents containing them
      (term → documents). That structure is an <T k="invertedindex">inverted index</T>, with its own write pipeline and
      its own tradeoffs.
    </p>
    <p style={{ color: C.dim }}>
      Those last two get their own briefings: spatial indexes live in{' '}
      <Sec to="proximity">Proximity-based services</Sec>, and inverted indexes live in{' '}
      <Sec to="search-db">Search-optimized databases</Sec>. The rest of the neighborhood connects along the same lines:
      the log-structured engine above is the backbone of <Sec to="nosql-db">NoSQL databases</Sec>, an index is the first
      and cheapest step in <Sec to="scaling-reads">Scaling reads</Sec>, and whether your index actually runs is decided
      by the statistics-driven planner over in <Sec to="relational-db">Relational databases</Sec>.
    </p>
  </>
)

const IDX_LIMITS_VIZ = (
  <Toggler
    options={[
      { id: 'eq', label: 'id = 42', col: C.mem },
      { id: 'range', label: 'range + ORDER BY', col: C.storage },
      { id: 'near', label: 'within 5 km', col: C.compute },
      { id: 'word', label: 'contains "latency"', col: C.alert },
    ]}
    initial="eq"
  >
    {(id) =>
      id === 'eq' ? (
        <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
          {line('Answered by:', 'a B-tree, in ~4 page reads. A hash index could do it in one, and nothing else.', C.mem)}
          <p style={{ color: C.dim, margin: '4px 0' }}>
            The tempting trap is picking a hash index. It wins at pure equality and cannot help with anything else,
            which is why you rarely see it in production.
          </p>
        </div>
      ) : id === 'range' ? (
        <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
          {line('Answered by:', 'a B-tree, where it shines: one descent, then a smooth walk along linked leaves, already sorted.', C.storage)}
          <p style={{ color: C.dim, margin: '4px 0' }}>
            Sorted retrieval comes for free here and nowhere else. Include the sort column in your composite index and
            the sort step vanishes from the query plan.
          </p>
        </div>
      ) : id === 'near' ? (
        <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
          {line('Answered by:', 'a geohash in a B-tree, a quadtree, or an R-tree, depending on whether you index points or shapes.', C.compute)}
          <p style={{ color: C.dim, margin: '4px 0' }}>
            The tempting trap is adding two separate indexes, one for latitude and one for longitude. The planner picks
            one and filters a stripe of the planet by hand. See Proximity-based services for the full picture.
          </p>
        </div>
      ) : (
        <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
          {line('Answered by:', 'an inverted index (term → documents), assembled by an analysis pipeline at write time.', C.alert)}
          <p style={{ color: C.dim, margin: '4px 0' }}>
            The tempting trap is indexing the text column with a B-tree. With no leading prefix to seek on, it drops
            back to a scan with no relevance ranking. See Search-optimized databases for the full picture.
          </p>
        </div>
      )
    }
  </Toggler>
)

export const CONCEPTS_SECTIONS: ManualSection[] = [
  {
    id: 'networking',
    shelf: 'concepts',
    title: 'Networking essentials',
    thesis: 'What does each layer promise your code, and what does it cost to keep that promise?',
    body: NET_STACK_BODY,
    viz: NET_STACK_VIZ,
    simplifies: NET_STACK_SIMPLIFIES,
    blocks: [
      { heading: 'THE STACK: the organizing model', body: NET_STACK_BODY, viz: NET_STACK_VIZ, simplifies: NET_STACK_SIMPLIFIES },
      {
        heading: 'TRANSPORT: the guarantees you order, and their price',
        body: NET_TRANSPORT_BODY,
        viz: NET_TRANSPORT_VIZ,
        simplifies:
          'Models 30 packets a second over an 80 ms round trip. Real TCP recovers smarter with fast retransmit and SACK, and real video smooths loss with jitter buffers, though the core tradeoff stays the same.',
      },
      {
        heading: 'ONE TAP, EVERY LAYER: the model in motion',
        body: NET_TAP_BODY,
        viz: NET_TAP_VIZ,
        simplifies:
          'Combines TCP and TLS into one step, skips HTTP/2 multiplexing and connection reuse, and treats DNS as a single hop instead of a cache hierarchy. It also traces one request, whereas real browsers open several connections and reuse them.',
      },
      { heading: 'WHERE THIS PAGE HANDS OFF', body: NET_HANDOFF_BODY },
    ],
    related: {
      toys: ['light', 'pipe'],
      terms: ['request', 'dns', 'tls', 'tcp', 'udp', 'handshake', 'headofline', 'cdn', 'lb', 'appserver', 'throughput'],
    },
    termShelf: 'networking',
    feltIn: { note: <>Race real system operations against the speed of light in the Lab.</>, to: '/lab/light', cta: 'play RACE LIGHT' },
  },
  {
    id: 'api-design',
    shelf: 'concepts',
    title: 'API design',
    thesis: 'How do the shapes of your endpoints decide load and cost?',
    body: (
      <>
        <p>
          A good API contract makes the common path a single round trip and makes dangerous mistakes hard to trigger.
          Two levers carry most of the weight: making writes <T k="idempotent">idempotent</T> (safe to{' '}
          <T k="retry">retry</T>, so a dropped acknowledgment never double-charges a card), and choosing how you{' '}
          <T k="pagination">paginate</T> lists so one request cannot drag back a million rows.
        </p>
        <p style={{ color: C.dim }}>
          Drag the page size slider below for a fixed 10,000-item list. Tiny pages turn into a long chain of{' '}
          <T k="rest">REST</T> round trips, each paying network latency before data moves. Huge pages cut the trip count
          but produce fat payloads and a slower first byte. The right page size fits the client, not some universal
          constant. Wire encoding follows the same logic: REST over JSON stays friendly at the public edge, while
          internal service calls often switch to <T k="grpc">gRPC</T> and <T k="protobuf">Protobuf</T> once payload size
          and parse time start showing up in the budget.
        </p>
        <p>
          Two big choices sit outside the slider. First, how you ask for the next page determines whether deep scrolling
          stays fast: a <T k="cursor">cursor</T> asks for rows after the last item seen, so page 1,000 costs the same as
          page 1 and an insert mid-scroll will not shift rows under you, whereas an offset forces the database to count
          past every skipped row. Second, when different clients need genuinely different field sets,{' '}
          <T k="graphql">GraphQL</T> lets each ask for just what it needs in one round trip, trading away the URL-level
          caching and simple per-endpoint rate limiting that make REST straightforward to operate.
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
                ? 'Tiny pages: latency-bound. Each request pays a full network round trip before any data moves.'
                : payloadKb > 400
                  ? 'Huge pages: payload-bound. Fewer trips, but a slower first byte and heavy responses to parse.'
                  : 'Balanced page size: modest trip count, reasonable payloads. Most cursor-based APIs aim right around here.',
            bars: [
              { label: 'round trips', frac: trips / 1000, col: C.net, tag: String(trips) },
              { label: 'payload/trip', frac: payloadKb / 800, col: C.compute, tag: `${payloadKb}KB` },
            ],
          }
        }}
      />
    ),
    simplifies:
      'Assumes uniform item size and a fixed total. Real pagination uses cursors instead of offsets to stay stable under live writes, and payload size turns nonlinear once gzip compression kicks in.',
    related: {
      toys: ['light'],
      terms: ['rest', 'pagination', 'idempotent', 'retry', 'request', 'grpc', 'protobuf'],
    },
    feltIn: { note: <>Taste tests put API choices head-to-head against real requirements.</>, to: '/review/taste', cta: 'try a Taste Test' },
  },
  {
    id: 'data-modeling',
    shelf: 'concepts',
    title: 'Data modeling',
    thesis: 'Normalize for clean writes, or denormalize for fast reads?',
    body: (
      <>
        <p>
          Every schema makes one foundational choice: do you store each fact once, or copy it into several places?{' '}
          <T k="normalization">Normalizing</T> keeps a single copy and stitches rows back together with a{' '}
          <T k="join">join</T> at read time, keeping writes clean while reads pay to gather the pieces.{' '}
          <T k="denormalization">Denormalizing</T> pre-assembles data into the shape the screen expects, giving you
          one-lookup reads while every <T k="write">write</T> has to update every copy.
        </p>
        <p style={{ color: C.dim }}>
          Flip between the two layouts below. The decision comes down to <T k="readpct">read/write-mix</T> math: a
          read-heavy feed denormalizes and absorbs the write <T k="fanout">fan-out</T>, while a write-heavy ledger
          normalizes and pays for the join. Even a plain <T k="index">index</T> is this same tradeoff in miniature: a
          sorted extra copy that speeds up a read and taxes every write.
        </p>
        <p>
          There is a third option between the two toggles: keep the normalized source of truth and store the assembled
          answer in a <T k="materializedview">materialized view</T> that refreshes in the background instead of on every
          request. Reads skip the join, writes skip fanning out to every copy, and the cost moves to a place you can
          state clearly: the view is exactly as stale as its last refresh.
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
                <b style={{ color: C.mem }}>Write:</b> one row, one home. Facts never disagree with each other.
                <br />
                <b style={{ color: C.alert }}>Read:</b> loading a feed joins 3 tables and sorts, which gets heavier as
                the tables grow.
              </p>
            </div>
          ) : (
            <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
              <div className="mono" style={{ color: C.compute }}>
                feed_items (one fat pre-joined row per card)
              </div>
              <p style={{ marginTop: 8 }}>
                <b style={{ color: C.mem }}>Read:</b> one lookup, already shaped for the UI. Fast and predictable.
                <br />
                <b style={{ color: C.alert }}>Write:</b> a single like has to update every feed row that embedded it,
                creating write fan-out and letting copies drift.
              </p>
            </div>
          )
        }
      </Toggler>
    ),
    simplifies:
      'Real systems usually mix both: a normalized source of truth feeding denormalized read projections kept fresh by CDC. The toggle frames it as one-or-the-other.',
    related: { toys: ['disk'], terms: ['normalization', 'denormalization', 'join', 'index', 'write', 'readpct', 'fanout', 'cdc'] },
    feltIn: { note: <>Builder scenarios make you balance read/write mix under a real budget.</>, to: '/builder', cta: 'open the Builder' },
  },
  {
    id: 'indexing',
    shelf: 'concepts',
    title: 'Database indexing',
    thesis: 'How does the engine actually find your row, and what does each shortcut cost?',
    body: IDX_SCAN_BODY,
    viz: IDX_SCAN_VIZ,
    simplifies: IDX_SCAN_SIMPLIFIES,
    blocks: [
      { heading: 'THE PAGE IS THE UNIT', body: IDX_SCAN_BODY, viz: IDX_SCAN_VIZ, simplifies: IDX_SCAN_SIMPLIFIES },
      {
        heading: 'THE TREE THAT DEFAULTS',
        body: IDX_TREE_BODY,
        viz: <BTreeWalk accent={C.storage} />,
        simplifies:
          'Fan-out depends on key width, so wide text keys drop it sharply and can add a level. Assumes no page compression, and ignores that a planner may still measure and choose a scan.',
      },
      {
        heading: 'WHAT EVERY INDEX COSTS',
        body: IDX_COST_BODY,
        viz: IDX_COST_VIZ,
        simplifies:
          'Assumes every index updates on every write. That holds for inserts and deletes, while updates only touch indexes whose columns actually changed. Index size is modeled as a flat ~15% of the table, which wide or covering indexes easily exceed.',
      },
      {
        heading: 'WHEN THE WRITE PATH WINS',
        body: IDX_LSM_BODY,
        viz: <LsmPath accent={C.storage} />,
        simplifies:
          'Shows one memtable and a handful of SSTables, whereas a real engine runs several levels holding many files each. Compaction also runs continuously in the background, and the write-ahead log is recycled rather than growing forever.',
      },
      {
        heading: 'THE SHAPE, NOT JUST THE COLUMN',
        body: IDX_SHAPE_BODY,
        viz: IDX_SHAPE_VIZ,
        simplifies:
          'A real planner decides from table statistics and may still pick a scan. Treat these as shapes to reason with, not guarantees about any one engine. Row counts are illustrative.',
      },
      {
        heading: 'WHERE SORTED ORDER RUNS OUT',
        body: IDX_LIMITS_BODY,
        viz: IDX_LIMITS_VIZ,
        simplifies:
          'Real databases blur these borders: relational engines ship spatial and full-text index types right in the box. Picking an index family is about the shape of your query, not which vendor logo you have to buy.',
      },
    ],
    related: { toys: ['disk', 'lsmbtree'], terms: ['heapfile', 'index', 'btree', 'lsm', 'wal', 'durable', 'compositeindex', 'queryplanner'] },
    feltIn: { note: <>Send the same write stream through a B-tree and an LSM, then pay the read bill.</>, to: '/lab/lsmbtree', cta: 'play LSM vs B-TREE' },
  },
  {
    id: 'caching',
    shelf: 'concepts',
    title: 'Caching',
    thesis: 'Why does one percentage decide your database’s fate?',
    body: (
      <>
        <p>
          A <T k="read">read</T> only looks, so its answer can be <i>copied</i> into a <T k="cache">cache</T> sitting in
          front of the database. Every <T k="hitrate">hit</T> is a query the database never has to answer. Drag the hit
          rate below: this one percentage decides whether your database is bored or on fire. A <T k="write">write</T>{' '}
          changes the truth and cannot be cached away, because every copy has to learn about it.
        </p>
        <p style={{ color: C.dim }}>
          The trouble hides in the tail. When a hot key's <T k="ttl">TTL</T> expires, thousands of simultaneous misses
          can rush the database to recompute the exact same answer. That is a <T k="stampede">stampede</T>, where the
          cache's sudden <i>absence</i> becomes the traffic spike. Every defense breaks that synchronization: jittered
          TTLs, <T k="coalescing">request coalescing</T> so the first miss fetches while duplicate callers wait on it,
          or serving stale values while refreshing in the background.
        </p>
        <p>
          Three practical decisions sit underneath the slider. First, who fills the cache: <T k="cacheaside">cache-aside</T>{' '}
          keeps the logic in your app, so a cache outage turns into higher latency rather than a full outage;{' '}
          <T k="readthrough">read-through</T> lets the cache fetch on a miss, centralizing the code while turning the
          cache into a hard dependency; <T k="writethrough">write-through</T> writes to both together so the cache stays
          fresh at the cost of slower writes. Second, what leaves when memory fills is <T k="eviction">eviction</T>,
          usually least-recently-used, which is our best guess at what will not be needed next. Third, how you
          invalidate stale data is the hardest part of all, which is why <T k="keyversion">key versioning</T> sidesteps
          it: bake a content hash into the key and an update becomes a clean miss instead of a delete you have to chase
          across every layer.
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
                ? 'Above a single Postgres primary’s ~30k cached QPS. At this hit rate, the cache is barely helping.'
                : toDb > 5_000
                  ? 'Survivable on one primary, though a cold cache restart would slam you straight back to 100k/s.'
                  : 'The database is nearly idle. Read-heavy systems live or die right here.',
            bars: [
              { label: 'served by cache', frac: v / 100, col: C.mem, tag: `${v}%` },
              { label: 'hits the DB', frac: (100 - v) / 100, col: C.alert, tag: `${100 - v}%` },
            ],
          }
        }}
      />
    ),
    simplifies:
      'Assumes a flat 100k reads/s and uniform miss cost. Real hit rates depend heavily on key skew and churn, and a single miss can cost far more work than a hit.',
    related: { toys: ['stampede', 'dram'], terms: ['cache', 'hitrate', 'ttl', 'stampede', 'read', 'write', 'herd'] },
    feltIn: { note: <>Expire a hot key and watch ten thousand misses dogpile the database.</>, to: '/lab/stampede', cta: 'play TTL & STAMPEDE' },
  },
  {
    id: 'sharding',
    shelf: 'concepts',
    title: 'Sharding & partitioning',
    thesis: 'Why can a huge cluster melt while sitting mostly idle?',
    body: (
      <>
        <p>
          <T k="shard">Sharding</T> scales <T k="write">writes</T> by splitting your data across independent databases,
          and your <T k="partitionkey">partition key</T> decides whether it actually works. A cluster can only spread
          traffic as evenly as your keys spread. Flip the toggle below to a <T k="hotpartition">hot key</T> (this
          hour's bucket, or a viral post's id): every writer piles onto a single node while the rest of your expensive
          cluster sits around doing almost nothing.
        </p>
        <p style={{ color: C.dim }}>
          Cluster-wide capacity is a comforting fiction; per-key capacity is what actually hits the wall. To fix it,
          salt or compose the key so writers land across multiple shards. Querying by a non-key column means building a{' '}
          <T k="gsi">secondary index</T> (a second copy that doubles your writes), and one event touching many
          partitions becomes a <T k="fanout">fan-out</T> problem priced by your single most-followed user.
        </p>
        <p>
          The bars below assume every query already knows its partition key. Any query that does not turns into a{' '}
          <T k="scattergather">scatter-gather</T>: the coordinator asks every shard and waits for the slowest one to
          answer, so that query gets slower with every shard you add. Inside a partition, ordering is a second lever.
          The <T k="clusteringkey">clustering key</T> sets the physical sort order on disk, which is why "this user's
          newest posts first" is one sequential read while any other order forces a scan and a sort.
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
                  ? 'Load spreads cleanly; each shard cruises near 60%. Add more shards, get more capacity.'
                  : 'One shard is pinned at 100% and throttling while seven sit idle. Adding more shards will not help until the key spreads.'}
              </p>
            </div>
          )
        }}
      </Toggler>
    ),
    simplifies:
      'Uses eight fixed, equal partitions. Real databases split hot partitions adaptively (usually too late to save a per-second spike) and rebalance in the background.',
    related: { toys: ['hotpartition'], terms: ['shard', 'hotpartition', 'gsi', 'fanout', 'write'] },
    feltIn: { note: <>Use "now" as a partition key and watch one node melt while seven sit idle.</>, to: '/lab/hotpartition', cta: 'play HOT PARTITION' },
  },
  {
    id: 'consistent-hashing',
    shelf: 'concepts',
    title: 'Consistent hashing',
    thesis: 'When you add a cache node, why don’t all the keys move?',
    body: (
      <>
        <p>
          If you place keys on nodes with <span className="mono">hash(key) % N</span>, then whenever N changes (a node
          crashes, or a fresh node joins), nearly every key lands on a new owner. For a <T k="cache">cache</T> that
          triggers a massive miss storm; for a <T k="shard">shard</T> it means copying almost your entire dataset across
          the network. Consistent hashing avoids that reshuffle by placing both nodes and keys on a circle, where each
          key belongs to the next node clockwise.
        </p>
        <p style={{ color: C.dim }}>
          Drag the node count below. Adding a node claims only its new clockwise slice, so roughly <b>1/N</b> of the
          keys move instead of almost all of them. Notice that this bounds key movement, not balance: with only one spot
          per machine, random placement produces arcs of wildly uneven sizes. Production systems assign each machine
          hundreds of small <T k="vnode">virtual nodes</T> scattered around the ring, smoothing out the load and letting
          many neighbors share the fallout when a node dies instead of doubling traffic on one unlucky neighbor.
        </p>
        <p style={{ color: C.dim }}>
          A ring is not the only way to keep rebalancing small. Redis Cluster divides the key space into 16,384 fixed{' '}
          <T k="hashslot">hash slots</T> and maps slots to nodes. Rebalancing means handing over whole slots while
          clients cache the slot table: same goal, solved with a direct table lookup instead of a ring walk.
        </p>
      </>
    ),
    viz: <HashRing />,
    simplifies:
      'Places one ring point per node (real deployments use dozens of virtual nodes to smooth out load) and 12 evenly-hashed keys. Skew and hot keys still need separate handling.',
    related: { toys: ['hotpartition'], terms: ['consistenthash', 'shard', 'cache', 'hitrate'] },
    feltIn: { note: <>See what happens in the Lab when keys stop spreading evenly.</>, to: '/lab/hotpartition', cta: 'play HOT PARTITION' },
  },
  {
    id: 'cap',
    shelf: 'concepts',
    title: 'CAP theorem',
    thesis: 'When the network splits, do you refuse writes or answer stale?',
    body: (
      <>
        <p>
          <T k="cap">CAP</T> is not an interview buzzword; it is a proof about geography. Network partitions <i>will</i>{' '}
          happen between regions. When a link cuts off, a distributed system has to make a per-operation choice: protect{' '}
          <T k="consistency">consistency</T> by refusing requests it cannot verify, or stay available and answer with
          data that might be stale. Flip between the two responses to a partition below.
        </p>
        <p style={{ color: C.dim }}>
          Consistency costs coordination. A <T k="quorum">quorum</T> of replicas has to agree before answering, using{' '}
          <T k="consensus">consensus</T> that also handles <T k="leader">leader election</T> so a split cannot crown two
          leaders at once. Agreement takes round trips, which is why strong cross-region writes cost ~150&nbsp;ms. In an
          interview, the useful question is rarely "CP or AP?" It is "which requests can tolerate staleness, and which
          ones must never be wrong?"
        </p>
        <p>
          That quorum is not ceremony; it is what stops <T k="splitbrain">split brain</T>, where both halves of a
          partition elect their own leader and accept conflicting writes. Only one side can hold a majority, so only one
          side is allowed to proceed. Choosing AP means signing up for cleanup once the link heals: a coordinator holds
          writes for unreachable replicas via <T k="hintedhandoff">hinted handoff</T> and replays them on recovery,
          while concurrent edits are often settled with <T k="lastwritewins">last write wins</T>, which always converges
          by silently dropping the losing write. If you pick AP, be explicit about which writes can afford to be dropped.
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
                <b style={{ color: C.net }}>CP:</b> the minority side refuses writes it cannot confirm with a quorum.
                Nobody gets a wrong answer, though some users hit errors until the partition heals. Fit for balances,
                inventory, and locks.
              </p>
            ) : (
              <p style={{ marginTop: 8 }}>
                <b style={{ color: C.compute }}>AP:</b> both sides keep accepting writes and reconcile later. Everyone
                stays online, though two versions of the truth can diverge and need merging. Fit for carts, likes, and
                presence.
              </p>
            )}
          </div>
        )}
      </Toggler>
    ),
    simplifies:
      'Frames CAP as a clean binary. Real systems tune consistency per request (read-your-writes, bounded staleness), and real partitions are rarely total.',
    related: { toys: ['consensus'], terms: ['cap', 'consistency', 'consensus', 'quorum', 'leader', 'failover'] },
    feltIn: { note: <>Count every round trip a single strongly-consistent write actually takes.</>, to: '/lab/consensus', cta: 'play CONSENSUS ROUND-TRIPS' },
  },
]
