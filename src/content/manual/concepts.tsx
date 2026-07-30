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

/* ---------- indexing (spec 076, coverage-map F1): six viz-led blocks ----------
   Baseline: specs/076-indexing-search-briefings.md Appendix B.1. Block 1's parts
   double as the section's legacy body/viz/simplifies fields. */

const IDX_SCAN_BODY = (
  <>
    <p>
      A table is a <T k="heapfile">heap file</T>: rows land wherever there was room, in no order whatsoever. And the
      engine never reads a row — it reads the <b>page</b> the row is sitting on, 8&nbsp;KB of it, because the page is
      the unit of I/O, of buffer caching, and often of locking. So a full scan is one sentence long: read every page,
      test every row. Its cost is the table's size in pages, and a 200-byte row you actually wanted still arrives inside
      a full 8&nbsp;KB transfer.
    </p>
    <p>
      Picture the filing cabinet where every folder was dropped in wherever it fit. There is no drawer for the Ms. To
      find one folder you open every drawer — and you always pull out the whole drawer, even when you want one sheet
      from it.
    </p>
    <p>
      One belief to break before going further: <b>solid-state storage did not make random access free.</b> Sequential
      streaming still beats scattered random reads by roughly an order of magnitude on NVMe — it was a thousandfold on
      spinning disk, so the gap narrowed hugely and then stopped narrowing. That surviving gap is the reason everything
      below is a bet <i>against</i> sequential streaming rather than a bet against the disk being slow.
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
          caption: `${rows.toLocaleString()} rows of 200 bytes fill ${pages.toLocaleString()} pages of 8 KB. The scan reads all of them; the tree reaches any one row in ${seek} reads, the last of which is the random fetch into the heap.`,
          bars: [
            { label: 'full scan', frac: v / 9, col: C.alert, tag: '≈ pages' },
            { label: 'index seek', frac: seek / 9, col: C.mem, tag: `${seek}` },
          ],
        }
      }}
    />
    <p style={{ color: C.dim, fontSize: 14, lineHeight: 1.6 }}>
      Drag down past about a thousand rows and the whole calculation inverts: 25 pages read in one streaming burst beat
      a tree walk plus a random fetch, every time. Below that threshold an index is pure write cost with a lookup
      attached — and the <T k="queryplanner">planner</T> will measure exactly that and ignore it, which is the correct
      call and is regularly misread as the index being broken.
    </p>
  </>
)

const IDX_SCAN_SIMPLIFIES =
  'Counts logical page reads, not cache hits — hot pages live in RAM, and the top of any tree effectively always does. Assumes 200-byte rows, ignores that a range scan or a sort changes the arithmetic entirely, and ignores that every index taxes every write.'

const IDX_TREE_BODY = (
  <>
    <p>
      A <T k="btree">B-tree</T> node is sized to exactly one page. With ~16-byte keys and 8-byte child pointers, one
      8&nbsp;KB node holds on the order of <b>340 children</b> — fan-out in the hundreds, not two. Depth is a logarithm
      in that fan-out: 340² ≈ 115,000 rows at depth 2, 340³ ≈ 39 million at depth 3, 340⁴ ≈ 13 <i>billion</i> at depth
      4. A hundred-million-row table therefore sits at depth ~4, and the top two or three levels are almost always
      already resident, so the honest cost of a point lookup is about one disk read.
    </p>
    <p>
      The tree stays balanced by construction rather than by luck: nodes are held between half-full and full, splitting
      when they overflow and merging when they empty, so every leaf is the same distance from the root. No query is
      unlucky, and none ever will be.
    </p>
    <p style={{ color: C.dim }}>
      Which is why "the table got ten times bigger and lookups got slower" is nearly always false. Depth barely moved —
      each extra level multiplies the reachable rows by another 340. What actually degraded is the buffer-cache hit
      rate, or maintenance: at around a hundred million rows a vacuum or index rebuild has to stream a hundred-odd
      gigabytes, and it is the <i>maintenance window</i> that stops fitting overnight, never the lookup.
    </p>
    <p>
      Five things this structure does well, and no other index family does all five: point lookups (one descent), range
      queries (leaves are linked, so a range is a descent plus a walk), sorted retrieval (the index is already in order,
      so an ORDER BY on that column costs nothing), prefix matching on strings (a prefix is just a range), and
      predictable behaviour under a mixed read/write load. When in doubt, this is the answer — and saying <i>why</i> is
      the half that scores.
    </p>
  </>
)

const IDX_COST_BODY = (
  <>
    <p>
      Every index is a second copy of its columns plus a pointer per row, so a wide one can approach the size of the
      data it indexes. The sharper cost is that it sits on the <b>write</b> path: every insert, update, and delete
      maintains <i>every</i> index on that table. One logical row write becomes 1 + n physical writes, forever.
    </p>
    <p>
      So an index is a bet that this column is read more often than the table is written. Six indexes means every write
      does seven jobs, in exchange for six queries being fast. Take that bet deliberately, and only six times.
    </p>
    <p style={{ color: C.dim }}>
      Two cases where the bet is simply wrong. A column written constantly and queried rarely — you have bought the
      expensive half and left the cheap half on the shelf. And a table small enough that the scan wins anyway, where the
      planner will correctly refuse to use what you built. Worth noticing what is <i>not</i> on that list: an indexed
      lookup already costs a fraction of a millisecond, so "the database is slow" is almost never storage physics. It is
      a missing index, or a scan you did not know you were doing.
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
          ? 'No indexes: writes are as cheap as they get, and every query that is not by primary key reads the whole table.'
          : `Every write now maintains ${n} index${n === 1 ? '' : 'es'} as well as the row. ${n} query shape${n === 1 ? ' gets' : 's get'} a sub-millisecond lookup; everything else on this table pays for them on every insert, update, and delete.`,
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
      First, the correction this block exists for: an <T k="lsm">LSM-tree</T> is <b>not</b> another index type sitting
      next to a B-tree on one column. It is the storage format of the <i>whole table</i>. Choosing it is choosing an
      engine, not adding a structure — which is why the wide-column stores behave the way they do all the way down, and
      why "we added an LSM index" is a sentence that gives you away.
    </p>
    <p>
      The write path has four stages. The write is appended to the <T k="wal">write-ahead log</T> and fsynced —{' '}
      <b>durability lands here, and nowhere else.</b> It is inserted into the in-memory <T k="memtable">memtable</T>, in
      sorted order, at RAM speed. When that fills — commonly around 64&nbsp;MB — it is flushed to disk as one immutable{' '}
      <T k="sstable">SSTable</T>, a single sequential write. And in the background, <T k="compaction">compaction</T>{' '}
      merges SSTables, keeps the newest version of each key, and physically drops the tombstones.
    </p>
    <p>
      A B-tree writes where the data belongs; an LSM writes where the disk is fastest and tidies up afterwards. That is
      the whole trade — and above roughly 10,000 sustained writes a second it stops being a matter of taste, because
      random page writes are what a B-tree cannot escape and sequential streaming is what an LSM converts them into.
    </p>
    <p>
      The bill arrives on reads: one key's history is spread across files, so a read may have to consult the memtable{' '}
      <i>plus every SSTable</i>. Three mitigations make that survivable. A <T k="bloomfilter">bloom filter</T> per file
      rules keys OUT with certainty — never a false negative — so most files are skipped without a disk trip at all. A
      sparse index holds one key per block, so a file that might have the key is entered at a byte offset rather than
      scanned. And compaction strategy is the one real dial: leveled compaction rewrites aggressively, so reads check
      fewer files and writes are amplified more; size-tiered rewrites less, so writes stay cheap and reads check more
      files. They pull in opposite directions, and choosing between them <i>is</i> the workload question.
    </p>
    <p style={{ color: C.dim }}>
      None of which makes writes free — it defers them. The same data is rewritten several times over its life, in
      background I/O that competes with your live traffic. What you actually bought is that the payment happens off the
      commit path, where nobody is waiting.
    </p>
  </>
)

const IDX_SHAPE_BODY = (
  <>
    <p>
      You do not choose a column, you choose a <b>shape</b>. A <T k="compositeindex">composite index</T> sorts by its
      columns in the order you declare — by the first, then by the second within it. Because that sort is nested, the
      index can be entered only from a <b>leading prefix</b>: one on (tenant, created_at) serves a query filtering on
      tenant, and one filtering on tenant while ordering by created_at, and nothing at all that starts from created_at.
      Order it filter-column first, sort-column next, and a single traversal answers both halves of the query with no
      sort step at all.
    </p>
    <p>
      Two separate indexes are not a composite index, and the planner cannot glue them into one. That single fact
      answers "why is my index not being used?" more often than everything else combined.
    </p>
    <p>
      Three shapes are worth carrying around. <b>(filter, sort)</b> — the common one above. <b>(equality, range)</b> —
      equality column first, always, because a range in the leading position destroys the ordering of everything behind
      it. And <b>(tenant, time)</b> — the multi-tenant shape, where the leading column is doing partition-like work
      inside one index. The usual heuristic, most selective column first, holds right up until the query sorts: then the
      sort column's position matters more, because getting it wrong forces the engine to materialize and sort the whole
      result set, which is precisely the cost you were avoiding.
    </p>
    <p style={{ color: C.dim }}>
      Then two refinements, both narrower than they sound. A <T k="coveringindex">covering index</T> carries the columns
      the query returns, so the engine answers from the index alone and skips the random heap fetch — the expensive step
      from the descent above. It duplicates those columns on every write, and the honest modern assessment is that it is
      a targeted win for one measured, hot, narrow query rather than a default. A{' '}
      <T k="partialindex">partial index</T> covers only rows matching a condition, which is how a job table's handful of
      pending rows gets an index small enough to live in memory while its millions of finished rows cost nothing to
      maintain.
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
          {line('Right shape:', '(tenant, created_at) — descend to the tenant, walk 20 leaves backwards, done. No sort step.', C.mem)}
          {line('Wrong shape:', '(created_at, tenant) — cannot be entered by tenant at all, so the planner scans and then sorts.', C.alert)}
        </div>
      ) : id === 'range' ? (
        <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
          {line('The query:', "status = 'pending' AND created_at > yesterday.", C.compute)}
          {line('Right shape:', '(status, created_at) — equality first pins one contiguous run, and the range is a walk inside it.', C.mem)}
          {line('Wrong shape:', '(created_at, status) — the range comes first, so every matching row must be re-checked for status one at a time.', C.alert)}
        </div>
      ) : (
        <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
          {line('The query:', 'SELECT id, status — nothing else — for one tenant.', C.mem)}
          {line('Right shape:', '(tenant) INCLUDE (status) — the leaf already holds the answer, so the random heap fetch never happens.', C.mem)}
          {line('The price:', 'status is now stored twice and rewritten on every update to it. Justify it with a measurement, not a hunch.', C.alert)}
        </div>
      )
    }
  </Toggler>
)

const IDX_LIMITS_BODY = (
  <>
    <p>
      Everything above rests on one assumption: that the values can be put in order, one dimension at a time. Three
      query shapes break it.
    </p>
    <p>
      <b>Exact match only.</b> A hash index answers "equals this value" in a single step and does nothing else — no
      ranges, no sorts, no prefixes. It is genuinely rare in practice, and not because it is bad: a B-tree at depth four
      is close enough at equality and does four other jobs besides. Name it, say why you did not pick it, move on.
    </p>
    <p>
      <b>Two dimensions at once.</b> Latitude and longitude are both ordered values, so indexing both looks obvious. It
      does not work: the planner picks one of them and hand-filters a stripe of the planet. Sorted order is
      one-dimensional and "near me" is not. Every real answer either flattens the plane into something orderable or
      builds a tree around the data. A <T k="geohash">geohash</T> recursively halves the map and encodes the path as a
      string, so nearby points share a prefix and an ordinary B-tree can index it — you then have to check the adjacent
      cells too, because two points either side of a cell boundary can be metres apart and share no prefix at all. A{' '}
      <T k="quadtree">quadtree</T> splits a node into four whenever it exceeds a threshold of about a hundred points, so
      dense cities grow deep while empty ocean stays a single node. An <T k="rtree">R-tree</T> nests bounding rectangles
      fitted to the data, which is what lets it index polygons and points together, at the cost of overlapping siblings
      forcing one search down several branches.
    </p>
    <p>
      <b>Somewhere in the middle of a string.</b> A B-tree indexes values from the left, so a query for documents{' '}
      <i>containing</i> a word has no prefix to seek on and collapses into a scan. The fix is not a better tree. It is
      to flip the mapping entirely — term → the list of documents holding it — which is an{' '}
      <T k="invertedindex">inverted index</T>, a different structure with a different write path and a different bill.
    </p>
    <p style={{ color: C.dim }}>
      Those two breakages are pages of their own: spatial indexes at full depth are{' '}
      <Sec to="proximity">Proximity-based services</Sec>, and the inverted index is{' '}
      <Sec to="search-db">Search-optimized databases</Sec>. The rest of the neighbourhood follows the same logic — the
      log-structured engine above is the whole point of <Sec to="nosql-db">NoSQL databases</Sec>, an index is the first
      and cheapest rung of <Sec to="scaling-reads">Scaling reads</Sec>, and whether yours gets used at all is decided by
      a planner reading statistics over in <Sec to="relational-db">Relational databases</Sec>.
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
          {line('Answered by:', 'a B-tree, in ~4 page reads. A hash index would do it in one — and nothing else.', C.mem)}
          <p style={{ color: C.dim, margin: '4px 0' }}>
            The tempting wrong answer is the hash index. It is faster at exactly this and useless at everything beside
            it, which is why it is rare in production.
          </p>
        </div>
      ) : id === 'range' ? (
        <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
          {line('Answered by:', 'a B-tree, and this is where it is untouchable — one descent, then a walk along linked leaves, already in order.', C.storage)}
          <p style={{ color: C.dim, margin: '4px 0' }}>
            Sorted retrieval is free here and impossible in every other family. Put the sort column in the composite
            index and the sort step disappears from the plan.
          </p>
        </div>
      ) : id === 'near' ? (
        <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
          {line('Answered by:', 'a geohash on a B-tree, a quadtree, or an R-tree — depending on whether you index points or shapes.', C.compute)}
          <p style={{ color: C.dim, margin: '4px 0' }}>
            The tempting wrong answer is two indexes, one per coordinate. The planner takes one and filters a stripe of
            the planet by hand. Depth lives on Proximity-based services.
          </p>
        </div>
      ) : (
        <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
          {line('Answered by:', 'an inverted index — term → documents — built by an analysis pipeline at write time.', C.alert)}
          <p style={{ color: C.dim, margin: '4px 0' }}>
            The tempting wrong answer is an index on the text column. There is no prefix to seek on, so it degrades to a
            scan with no ranking at the end. Depth lives on Search-optimized databases.
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
        <p>
          Two shapes the slider cannot show. How you address the NEXT page decides whether deep paging stays cheap: a{' '}
          <T k="cursor">cursor</T> asks for what comes after the last item seen, so page 1,000 costs what page 1 costs and
          an insert mid-scroll cannot make you skip a row — where an offset makes the database count past every skipped
          row. And when clients want genuinely different field sets, <T k="graphql">GraphQL</T> lets each ask for exactly
          what it needs in one round trip, trading away the URL-level caching and per-endpoint rate limiting that made
          REST easy to operate.
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
    related: { toys: ['disk'], terms: ['normalization', 'denormalization', 'join', 'index', 'write', 'readpct', 'fanout', 'cdc'] },
    feltIn: { note: <>Builder scenarios force the read/write-mix decision under a budget.</>, to: '/builder', cta: 'open the Builder' },
  },
  {
    id: 'indexing',
    shelf: 'concepts',
    title: 'Database indexing',
    thesis: 'What does the engine actually do to find your row — and what does each shortcut cost?',
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
          'Fan-out depends on key width, so a wide text key drops it sharply and can add a level; assumes no page compression, and ignores that the planner may measure and choose a scan anyway.',
      },
      {
        heading: 'WHAT EVERY INDEX COSTS',
        body: IDX_COST_BODY,
        viz: IDX_COST_VIZ,
        simplifies:
          'Assumes every index is maintained on every write — true for inserts and deletes, but an update only touches the indexes whose columns it changed. Index size is taken as a flat ~15% of the table, which a wide or covering index blows past.',
      },
      {
        heading: 'WHEN THE WRITE PATH WINS',
        body: IDX_LSM_BODY,
        viz: <LsmPath accent={C.storage} />,
        simplifies:
          'One memtable and a handful of SSTables, where a real engine runs several levels holding many files each; compaction runs continuously rather than as a discrete step, and the log is recycled rather than growing forever.',
      },
      {
        heading: 'THE SHAPE, NOT JUST THE COLUMN',
        body: IDX_SHAPE_BODY,
        viz: IDX_SHAPE_VIZ,
        simplifies:
          'A real planner decides on statistics and may still pick a scan; these are the shapes to reason with, not a promise about any one engine. Row counts are illustrative.',
      },
      {
        heading: 'WHERE SORTED ORDER RUNS OUT',
        body: IDX_LIMITS_BODY,
        viz: IDX_LIMITS_VIZ,
        simplifies:
          'Real engines blur these lines — a relational engine ships spatial and full-text index types in the box — so "which family" is a question about the shape of the access, not about which product you have to buy.',
      },
    ],
    related: { toys: ['disk', 'lsmbtree'], terms: ['heapfile', 'index', 'btree', 'lsm', 'wal', 'durable', 'compositeindex', 'queryplanner'] },
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
          all break the synchronization: jittered TTLs, <T k="coalescing">request coalescing</T> so the first miss fetches
          while every duplicate waits on it, serving stale while refreshing.
        </p>
        <p>
          Underneath the slider sit three decisions. WHO fills the cache: <T k="cacheaside">cache-aside</T> puts the logic
          in the application, so a cache outage is a latency event rather than an outage;{' '}
          <T k="readthrough">read-through</T> makes the cache fetch on a miss, centralizing that logic and making the cache
          a hard dependency; <T k="writethrough">write-through</T> writes both together so the cache is never stale, paid
          for on every write. WHAT leaves when memory fills is <T k="eviction">eviction</T> — least-recently-used, an
          approximation of the thing you cannot know. And HOW a value is invalidated is the hardest of the three, which is
          why <T k="keyversion">key versioning</T> avoids it entirely: put a content hash in the key and a change becomes a
          miss instead of a delete you would have to chase through every layer.
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
    related: { toys: ['stampede', 'dram'], terms: ['cache', 'hitrate', 'ttl', 'stampede', 'read', 'write', 'herd'] },
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
    related: { toys: ['hotpartition'], terms: ['shard', 'hotpartition', 'gsi', 'fanout', 'write'] },
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
          leaves arcs of wildly different sizes. Real systems give each machine hundreds of small{' '}
          <T k="vnode">virtual nodes</T> scattered around the circle, so load averages out and a death is absorbed by
          many neighbours instead of doubling one.
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
    related: { toys: ['hotpartition'], terms: ['consistenthash', 'shard', 'cache', 'hitrate'] },
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
    related: { toys: ['consensus'], terms: ['cap', 'consistency', 'consensus', 'quorum', 'leader', 'failover'] },
    feltIn: { note: <>Count the round trips a single strongly-consistent write actually costs.</>, to: '/lab/consensus', cta: 'play CONSENSUS ROUND-TRIPS' },
  },
]
