// Say-it decks (docs/content-pipeline.md §11, specs 066/067): speak-only
// retrieval cards, each deck LOCAL to one briefing. The cue is a question an
// interviewer would realistically ask; the model is ONE speakable answer
// (a breath, max) in the player's first person. ids are stable — the Leitner
// scheduler keys on them; never reuse or rename. The networking deck's copy
// was approved in design review (spec 066 appendix) — ported verbatim.

import type { ReactNode } from 'react'
import { C } from '../theme'

const em = (children: ReactNode) => <span style={{ color: C.net, fontWeight: 600 }}>{children}</span>

export interface SayItCard {
  /** stable — the Leitner scheduler keys on it */
  id: string
  /** the briefing (manual section id) this card belongs to */
  section: string
  /** the front: interviewer voice, a concrete system on the table */
  cue: string
  /** the back's centerpiece: one speakable answer, first person where it's a decision */
  model: ReactNode
  /** exactly 3 self-grade key points: mechanism / tradeoff or cost / decision rule */
  checks: [string, string, string]
  /** the wrong sentence people say — and what to say instead */
  trap: string
  /** one quantity to leave with; refs resolve in numbers.ts (empty for prose numbers) */
  number: { val: string; body: string; refs: string[] }
  /** keys into glossary.ts */
  terms: string[]
}

export const SAYIT_CARDS: SayItCard[] = [
  {
    id: 'sayit-net-udp',
    section: 'networking',
    cue: 'Would you ever pick UDP over TCP here? What would have to be true?',
    model: (
      <>
        Yes — UDP trades delivery guarantees for latency: no handshake, no retransmits, no ordering. It wins exactly when
        a {em('late packet is worse than a lost one')} — live voice, video, game state — and my users aren't stuck in a
        browser without WebRTC.
      </>
    ),
    checks: [
      'Named what’s traded away: delivery, ordering, connection setup',
      'Gave the decision rule — late worse than lost — with an example',
      'Caught the browser caveat: raw UDP needs WebRTC or a fallback',
    ],
    trap: '"UDP is unreliable" is a shrug, not an answer. Say what the unreliability buys you.',
    number: { val: '8 B vs 20–60 B', body: 'UDP header vs TCP — and zero round trips of setup.', refs: ['udp-vs-tcp-header'] },
    terms: ['udp', 'tcp', 'handshake'],
  },
  {
    id: 'sayit-net-hol',
    section: 'networking',
    cue: 'Users on hotel wifi report that live video freezes, then fast-forwards to catch up. What’s going on?',
    model: (
      <>
        That's TCP doing its job: it retransmits lost packets and won't deliver anything out of order, so one lost packet
        blocks everything behind it — {em('head-of-line blocking')}. The stream is reliable but late, and for live media,
        late is worse than lost.
      </>
    ),
    checks: [
      'Named the guarantees doing the damage: retransmission + strict ordering',
      'Said "head-of-line blocking" out loud',
      'Concluded the fix: switch transports (WebRTC/UDP), don’t tune TCP',
    ],
    trap: 'Don’t say "TCP is slow." TCP isn’t slow — it’s strict. Name the guarantee causing the wait.',
    number: { val: '≥ 1 RTT', body: 'per retransmit — 100+ ms on a cross-country path, felt as a freeze.', refs: ['retransmit-rtt'] },
    terms: ['tcp', 'headofline', 'webrtc'],
  },
  {
    id: 'sayit-net-ws',
    section: 'networking',
    cue: 'You drew WebSockets for live comments. Defend that — or back off.',
    model: (
      <>
        I'd back off. Comments are one-way push — users post over plain HTTP — so {em('SSE gives me push without the duplex')}{' '}
        I'm not using. WebSockets earn their stateful cost only when traffic is genuinely bidirectional and high-frequency:
        chat, multiplayer, presence.
      </>
    ),
    checks: [
      'Applied the test: is the traffic truly bidirectional + high-frequency?',
      'Named the cost of stateful connections: memory, sticky routing, harder deploys',
      'Offered the cheaper alternative instead of defending the wrong pick',
    ],
    trap: 'Backing off gracefully scores higher than a confident defense of overkill. Retreat is a move.',
    number: { val: '1 conn = RAM + a slot', body: 'every open socket is server memory the LB must pin somewhere.', refs: [] },
    terms: ['websocket', 'sse', 'lb'],
  },
  {
    id: 'sayit-net-idem',
    section: 'networking',
    cue: 'A timeout triggered a client retry and a customer got charged twice. How do you make retries safe?',
    model: (
      <>
        With an {em('idempotency key')}: the client attaches a unique id per logical operation, the server records it and
        processes each key once — so a retry returns the first result instead of charging again. That's what makes "retry
        with backoff" safe to say.
      </>
    ),
    checks: [
      'Named the mechanism: idempotency key, dedup on the server',
      'Explained the ambiguity: a timeout means the write may have succeeded',
      'Tied it back: retries are only safe on idempotent APIs',
    ],
    trap: '"GETs are idempotent" dodges the question — the interviewer is always asking about writes.',
    number: { val: 'timeout ≠ failure', body: 'the request may have landed; ambiguity is the default, not the edge case.', refs: [] },
    terms: ['idempotent', 'retry', 'timeout'],
  },
  {
    id: 'sayit-net-sse',
    section: 'networking',
    cue: 'Your SSE connection gets killed by a proxy after 60 seconds. What do your users see?',
    model: (
      <>
        Ideally nothing: EventSource auto-reconnects and sends {em('Last-Event-ID')}, and my server replays what they missed
        from a short buffer. If I don't keep that buffer, every proxy timeout silently drops events — so reconnect-and-replay
        is part of the design, not an edge case.
      </>
    ),
    checks: [
      'Named the built-in: auto-reconnect with Last-Event-ID',
      'Named your obligation: a server-side replay buffer',
      'Framed disconnects as routine, not exceptional',
    ],
    trap: 'Interviewers probe SSE limits to find out if you’ve actually shipped it. This card is that probe.',
    number: { val: '~30–90 s', body: 'typical middlebox idle timeout — your connection’s real life expectancy.', refs: ['middlebox-idle-timeout'] },
    terms: ['sse', 'lasteventid', 'timeout'],
  },
  {
    id: 'sayit-net-grpc',
    section: 'networking',
    cue: 'Your public API is REST but services talk gRPC internally. Isn’t that inconsistent?',
    model: (
      <>
        It's deliberate. gRPC's binary protobuf over HTTP/2 is fast and typed, but it assumes {em('you control both ends')} —
        browsers and third parties don't speak it well. So REST at the boundary, gRPC inside where I own every client.
      </>
    ),
    checks: [
      'Named what gRPC buys: binary encoding, HTTP/2, generated typed stubs',
      'Named the constraint: poor browser/third-party support at the edge',
      'Stated the rule: REST at the boundary, gRPC service-to-service',
    ],
    trap: 'If probed past your experience, say where it ends — "I’ve seen it run, not operated it" is a strong answer.',
    number: { val: '15 B vs 40 B', body: 'the same User object in protobuf vs JSON — less space, less CPU to parse.', refs: ['protobuf-vs-json-size'] },
    terms: ['grpc', 'rest', 'protobuf'],
  },

  /* ---------- indexing (spec 076, coverage-map F1) ----------
     Traps are the [GROUND] corrections from the briefing's blocks, per
     coverage-map §B.5. */
  {
    id: 'sayit-idx-scan',
    section: 'indexing',
    cue: 'This query sequentially scans 200 million rows and takes 40 seconds. Walk me through what is actually happening.',
    model: (
      <>
        The table is a {em('heap file')} — rows stored in no order — so without an index the engine reads every page and
        tests every row. It reads 8 KB whether I wanted one column or forty, so the cost is the table's size in pages,
        not in rows.
      </>
    ),
    checks: [
      'Named the layout: a heap file, with rows in no order at all',
      'Said the PAGE, not the row, is the unit of I/O',
      'Priced the scan in pages read rather than rows examined',
    ],
    trap: 'Don’t say "it’s a big table." Size is not the problem — the absence of any ordering is. Name the heap file.',
    number: { val: '8 KB per page', body: 'the unit of I/O — a 200-byte row still costs a full page transfer.', refs: ['disk-page-size'] },
    terms: ['heapfile', 'index'],
  },
  {
    id: 'sayit-idx-depth',
    section: 'indexing',
    cue: 'This table is about to grow ten times. How much slower do the point lookups get?',
    model: (
      <>
        Barely at all — a B-tree node holds a few hundred children, so depth is a logarithm in the hundreds and ten
        times the rows costs {em('at most one extra page read')}. What degrades at that size is the cache hit rate and
        the maintenance window, not the lookup.
      </>
    ),
    checks: [
      'Named fan-out as the reason depth barely moves with size',
      'Gave the order of magnitude: hundreds of children per node',
      'Redirected to what does degrade — cache hit rate and maintenance',
    ],
    trap: '"Bigger table, slower index" is the intuition to unlearn. The lookup is logarithmic; the vacuum is not.',
    number: { val: '~4 page reads', body: '100M rows at a fan-out near 340 — and the top levels are already in memory.', refs: ['btree-lookup-depth'] },
    terms: ['btree', 'index'],
  },
  {
    id: 'sayit-idx-cost',
    section: 'indexing',
    cue: 'Someone added six indexes to the orders table and writes have slowed right down. What happened?',
    model: (
      <>
        Every write maintains every index, so one row write became {em('seven physical writes')}. Each index is a bet
        that its column is read more often than the table is written, and six of those bets is a permanent tax on every
        insert, update and delete.
      </>
    ),
    checks: [
      'Named the mechanism: every index maintained on every write',
      'Quantified it — one row write becomes 1 + n physical writes',
      'Framed an index as a read/write bet rather than a free win',
    ],
    trap: 'Don’t offer to "optimize the queries." The queries got faster — that is what was paid for. Name the write path.',
    number: { val: '1 + n writes', body: 'per row change — and the read you bought was already a sub-millisecond lookup.', refs: ['pg-indexed-lookup-rate'] },
    terms: ['index', 'write'],
  },
  {
    id: 'sayit-idx-lsm',
    section: 'indexing',
    cue: 'You are taking 50,000 writes a second and the B-tree cannot keep up. What do you change?',
    model: (
      <>
        I'd move to a log-structured engine: writes append to a fsynced log and an in-memory table, then flush
        sequentially, so {em('random page writes become one sequential stream')}. I pay on reads, where a lookup may
        check several files — bloom filters are what make that survivable.
      </>
    ),
    checks: [
      'Named the write path: log plus memtable, flushed sequentially',
      'Named the cost honestly — reads check several files, plus compaction I/O',
      'Gave the crossover: it is an engine choice above ~10k writes/s',
    ],
    trap: 'Don’t call it "an LSM index." It is the storage format of the whole table, and saying index gives you away.',
    number: { val: '~10,000 writes/s', body: 'the band where a log-structured engine starts beating a B-tree outright.', refs: ['lsm-write-crossover'] },
    terms: ['lsm', 'memtable', 'bloomfilter'],
  },
  {
    id: 'sayit-idx-composite',
    section: 'indexing',
    cue: 'The query filters on tenant and sorts by created_at. What index would you build?',
    model: (
      <>
        One composite index on {em('(tenant, created_at)')}, in that order. It is entered by tenant, and because rows
        are already ordered by date inside each tenant, the same traversal answers the sort — no sort step in the plan
        at all.
      </>
    ),
    checks: [
      'Chose one composite index rather than two single-column ones',
      'Named the leading-prefix rule as why the column order matters',
      'Said what it buys: filter and sort in a single traversal',
    ],
    trap: '"I’d index both columns" is the common miss — two indexes are not a composite one, and the planner cannot glue them together.',
    number: { val: '1 traversal', body: 'the right column order answers filter and sort together; the wrong one sorts the whole result set.', refs: [] },
    terms: ['compositeindex', 'btree'],
  },
  {
    id: 'sayit-idx-small',
    section: 'indexing',
    cue: 'Would you index the status column on a table with 800 rows in it?',
    model: (
      <>
        No. The whole table is a couple of hundred kilobytes, so a sequential read beats a tree walk plus a random fetch
        per row — and the {em('planner will measure exactly that')} and ignore the index. All I would have bought is
        write amplification.
      </>
    ),
    checks: [
      'Said no, with the reason: sequential beats random at this size',
      'Named who decides — the planner measures and picks the scan',
      'Named the cost of adding it anyway: pure write amplification',
    ],
    trap: 'People add an index, see nothing improve, and conclude it is broken. It was not used — and not using it was correct.',
    number: { val: '~1,000 rows', body: 'the rough floor below which an index is pure cost and the scan wins outright.', refs: ['index-table-threshold'] },
    terms: ['queryplanner', 'index'],
  },
  {
    id: 'sayit-idx-geo',
    section: 'indexing',
    cue: 'You have latitude and longitude columns and a "restaurants near me" query. Two indexes, right?',
    model: (
      <>
        No — {em('sorted order is one-dimensional')}, so the planner takes one of them and hand-filters a stripe of the
        planet. I'd flatten the plane into something sortable with a geohash, or use a tree built around the data — a
        quadtree for points, an R-tree if I need shapes.
      </>
    ),
    checks: [
      'Named the failure: two 1-D indexes cannot serve a 2-D query',
      'Named a real structure and what it actually does',
      'Picked one and justified it instead of listing all three',
    ],
    trap: 'Listing geohash, quadtree and R-tree without choosing reads as recall. Pick one and say what it costs you.',
    number: { val: '~100 points', body: 'a quadtree splits a node past roughly this, so cities go deep and ocean stays shallow.', refs: ['quadtree-split-threshold'] },
    terms: ['geohash', 'quadtree', 'rtree'],
  },

  /* ---------- search-db (spec 076, coverage-map F1) ---------- */
  {
    id: 'sayit-search-builtin',
    section: 'search-db',
    cue: 'You reached for a search cluster on slide two. Why not just use the database’s built-in full-text search?',
    model: (
      <>
        Often I would — it stems, it ranks, and it is one system to operate. I'd add a dedicated engine for something
        specific: {em('tunable relevance')}, typo tolerance, multi-language analysis, or faceting at a scale that would
        compete with my write traffic.
      </>
    ),
    checks: [
      'Started from the cheaper option instead of defending the cluster',
      'Named a specific capability the built-in does not cover',
      'Named the operational cost of running a second system',
    ],
    trap: '"Elasticsearch is for search" is a category, not a reason. Name the one capability that made you leave the database.',
    number: { val: '~0.3 ms', body: 'an indexed lookup in the primary is already this fast — slowness alone is not the argument.', refs: ['pg-indexed-lookup-rate'] },
    terms: ['invertedindex', 'index'],
  },
  {
    id: 'sayit-search-inverted',
    section: 'search-db',
    cue: 'Walk me through what happens between a document being saved and it being findable by one of its words.',
    model: (
      <>
        It goes through an analyzer — tokenize, lowercase, drop stop words, stem — and each resulting term gets that
        document's id appended to its postings list. The query runs through {em('the same analyzer')}, which is why
        searching "Running" finds a document that said "ran".
      </>
    ),
    checks: [
      'Named the analysis pipeline and at least two of its stages',
      'Described the structure: term to a sorted list of document ids',
      'Caught the key detail — the same pipeline runs over the query',
    ],
    trap: 'Saying it "indexes the words" skips the whole mechanism. The stored terms are analyzed, and that is what makes matching forgiving.',
    number: { val: 'O(matches)', body: 'a lookup and a merge of postings lists, instead of a scan linear in the corpus.', refs: [] },
    terms: ['analyzer', 'invertedindex', 'relevance'],
  },
  {
    id: 'sayit-search-updates',
    section: 'search-db',
    cue: 'Our catalogue reprices every few minutes and search has got slow. Any idea why?',
    model: (
      <>
        Segments are immutable, so an update is {em('a tombstone plus a whole new copy')}. Repricing constantly means
        dead documents piling up in every segment and merges running flat out to reclaim them — this is precisely the
        workload the design is worst at.
      </>
    ),
    checks: [
      'Named immutability: nothing in a segment is edited in place',
      'Named the cost — an update is a delete marker plus an insert',
      'Connected it to merge pressure and dead space, not raw write volume',
    ],
    trap: 'Don’t reach for more nodes first. This is a fit problem — index the stable fields and leave the volatile price in the database.',
    number: { val: 'update > insert', body: 'strictly and permanently — the old copy holds space and read work until a merge.', refs: [] },
    terms: ['segment', 'tombstone'],
  },
  {
    id: 'sayit-search-truth',
    section: 'search-db',
    cue: 'Where does the search cluster sit relative to your database in this design?',
    model: (
      <>
        Downstream of it. The database holds the truth and a change stream feeds the index, so it is a{' '}
        {em('derived read model')}, eventually consistent by construction — I'd quote the lag as a design parameter
        rather than pretend it is zero.
      </>
    ),
    checks: [
      'Placed it downstream: a derived read model, never the source of truth',
      'Named the sync mechanism — a change stream out of the database',
      'Owned the consistency story and quoted a lag out loud',
    ],
    trap: '"We write to both" invites the dual-write question, and there is no good follow-up to it. Say what feeds the index.',
    number: { val: 'seconds of lag', body: 'the gap between a committed write and a searchable document — say the number.', refs: [] },
    terms: ['cdc', 'consistency'],
  },
  {
    id: 'sayit-search-page',
    section: 'search-db',
    cue: 'A user pages through to result 9,000 and the request suddenly fails. What is going on?',
    model: (
      <>
        Deep pagination. To order results globally every shard has to return offset-plus-page-size documents for the
        coordinator to merge, so page 900 means {em('each shard shipping 9,000 candidates')}. The engine caps that
        rather than let it grow, and the fix is a cursor, not a bigger limit.
      </>
    ),
    checks: [
      'Located the cost in the coordinator’s merge, not in the page size',
      'Explained why it grows with the OFFSET rather than the page',
      'Gave the fix: a cursor keyed on the last sort value',
    ],
    trap: 'Raising the limit is the trap — it moves the cliff and buries it deeper in the product.',
    number: { val: '10,000 deep', body: 'the default cap on offset plus page size, past which the request is refused.', refs: ['es-deep-pagination-cliff'] },
    terms: ['cursor', 'pagination'],
  },
  {
    id: 'sayit-search-facet',
    section: 'search-db',
    cue: 'You want to facet these hits by brand and sort them by price. Does the inverted index do that?',
    model: (
      <>
        No — it maps terms to documents, which is the wrong direction for "what is this document's price?". That comes
        from {em('doc values')}: a column-oriented copy of each field in document order, which is also how the engine
        aggregates without exhausting the heap.
      </>
    ),
    checks: [
      'Named the direction problem: term-to-document versus document-to-value',
      'Named doc values and their column-oriented layout',
      'Connected it to why aggregation works on this system at all',
    ],
    trap: 'Saying "the index handles sorting too" collapses two structures into one — and the second is why this thing does analytics.',
    number: { val: '2 layouts', body: 'the same field stored twice, one per direction of access — which is why the index outgrows the data.', refs: [] },
    terms: ['docvalues', 'invertedindex'],
  },
  {
    id: 'sayit-search-shards',
    section: 'search-db',
    cue: 'How many shards would you give this index, and can you change that number later?',
    model: (
      <>
        I'd size it by data volume — tens of gigabytes per shard — and then say plainly that the count is{' '}
        {em('fixed at creation')}. Changing it means building a new index and swapping an alias over, so I would rather
        over-provision slightly than plan a reindex I cannot schedule.
      </>
    ),
    checks: [
      'Sized shards by data volume instead of guessing a round number',
      'Knew the count is fixed once the index holds documents',
      'Named the migration: a reindex behind an alias swap',
    ],
    trap: 'Over-sharding is the more common mistake — hundreds of tiny shards make every query a fan-out with none of the parallelism.',
    number: { val: '10–50 GB', body: 'the target size per shard, which is what sets the count you can never change.', refs: ['es-doc-threshold'] },
    terms: ['shard', 'replica'],
  },
]

export const sayItCardsForSection = (sectionId: string): SayItCard[] => SAYIT_CARDS.filter((c) => c.section === sectionId)
