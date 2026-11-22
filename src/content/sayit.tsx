// Say-it decks (docs/content-pipeline.md §11, specs 066/067): speak-only
// retrieval cards, each deck LOCAL to one briefing. The cue is a question an
// interviewer would realistically ask; the model is ONE speakable answer
// (a breath, max) in the player's first person. ids are stable — the Leitner
// scheduler keys on them; never reuse or rename.

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
    cue: 'When would you actually reach for UDP over TCP here? What has to be true for that trade to pay off?',
    model: (
      <>
        Yes. UDP trades guaranteed delivery for lower latency, skipping the handshake, retransmits, and strict ordering. It wins
        whenever a {em('late packet is worse than a lost one')}, like live voice, video, or game state, as long as my
        clients are not locked inside a browser without WebRTC.
      </>
    ),
    checks: [
      'Named what you trade away: guaranteed delivery, strict ordering, and connection setup',
      'Gave the decision rule (late is worse than lost) with a concrete example',
      'Flagged the browser constraint: raw UDP requires WebRTC or a fallback',
    ],
    trap: '"UDP is unreliable" is a shrug, not an answer. Say what giving up reliability actually buys you in latency.',
    number: { val: '8 B vs 20 to 60 B', body: 'UDP header compared to TCP, with zero round trips of setup.', refs: ['udp-vs-tcp-header'] },
    terms: ['udp', 'tcp', 'handshake'],
  },
  {
    id: 'sayit-net-hol',
    section: 'networking',
    cue: 'Users on hotel wifi say their live video freezes, then fast-forwards to catch up. What is happening on the wire?',
    model: (
      <>
        That is TCP doing exactly what it promises. It retransmits lost packets and refuses to deliver anything out of
        order, so one dropped packet stalls everything behind it: {em('head-of-line blocking')}. The stream arrives intact
        but late, and for live media, late is worse than lost.
      </>
    ),
    checks: [
      'Named the two guarantees causing the stall: retransmission and strict ordering',
      'Named "head-of-line blocking" clearly out loud',
      'Proposed the right fix: switch transports (WebRTC/UDP) instead of trying to tune TCP',
    ],
    trap: 'Avoid saying "TCP is slow." TCP is not slow; it is strict. Name the guarantee that forces the wait.',
    number: { val: '≥ 1 RTT', body: 'the cost of each retransmit, which means 100+ ms on a cross-country path and a visible freeze.', refs: ['retransmit-rtt'] },
    terms: ['tcp', 'headofline', 'webrtc'],
  },
  {
    id: 'sayit-net-ws',
    section: 'networking',
    cue: 'You put WebSockets on the board for live comments. Can you defend that choice, or would you simplify it?',
    model: (
      <>
        I would pull it back. Comments are a one-way push while users post over plain HTTP, so{' '}
        {em('SSE gives me live push without the full duplex')} I am not using. WebSockets earn their stateful overhead only
        when traffic is genuinely bidirectional and high-frequency, like chat, multiplayer, or presence.
      </>
    ),
    checks: [
      'Applied the test: is traffic genuinely bidirectional and high-frequency?',
      'Named the cost of stateful sockets: server memory, sticky routing, and harder deploys',
      'Suggested the simpler alternative instead of defending overkill',
    ],
    trap: 'Defending stateful sockets for one-way traffic only shows you missed the cost. Backing off to SSE when the workload does not need duplex is the stronger move.',
    number: { val: '1 conn = RAM + a slot', body: 'every open socket holds server memory that the LB has to pin to a specific host.', refs: [] },
    terms: ['websocket', 'sse', 'lb'],
  },
  {
    id: 'sayit-net-idem',
    section: 'networking',
    cue: 'A timeout triggered a client retry and a customer got billed twice. How do you make retries safe?',
    model: (
      <>
        With an {em('idempotency key')}. The client sends a unique id per logical operation, and the server stores it so
        each key runs once and any retry gets the original result instead of a second charge. That is what makes "retry
        with backoff" safe to put in a design.
      </>
    ),
    checks: [
      'Named the mechanism: an idempotency key deduplicated on the server',
      'Explained the ambiguity: a timeout might mean the write already landed',
      'Connected it back: retries are only safe on idempotent endpoints',
    ],
    trap: 'Saying "GETs are idempotent" dodges the real problem. The interviewer is asking how you protect writes from double execution.',
    number: { val: 'timeout ≠ failure', body: 'the write may already have committed, so ambiguity is the normal case rather than a rare edge case.', refs: [] },
    terms: ['idempotent', 'retry', 'timeout'],
  },
  {
    id: 'sayit-net-sse',
    section: 'networking',
    cue: 'A proxy drops your SSE connection after 60 seconds. What do your users notice?',
    model: (
      <>
        With a proper setup, nothing. EventSource reconnects automatically and sends {em('Last-Event-ID')}, so my server
        replays whatever they missed from a short buffer. Without that buffer, every proxy timeout silently loses events,
        so reconnect-and-replay has to be part of the core design.
      </>
    ),
    checks: [
      'Named the built-in behavior: automatic reconnect carrying Last-Event-ID',
      'Named your side of the contract: keeping a server-side replay buffer',
      'Treated disconnects as routine behavior rather than rare failures',
    ],
    trap: 'Treating SSE as a connection that stays open forever is the classic mistake. Proxies drop idle streams routinely, so skipping the replay buffer guarantees silent data loss.',
    number: { val: '~30 to 90 s', body: 'the typical middlebox idle timeout, which sets your connection’s real lifespan.', refs: ['middlebox-idle-timeout'] },
    terms: ['sse', 'lasteventid', 'timeout'],
  },
  {
    id: 'sayit-net-grpc',
    section: 'networking',
    cue: 'Your public API uses REST, while internal services talk gRPC. Is that split worth the complexity?',
    model: (
      <>
        Yes, and it is intentional. gRPC gives me compact binary protobuf over HTTP/2 with strict typing, but it assumes{' '}
        {em('I control both ends')} because browsers and third parties do not speak it cleanly. So I keep REST at the
        public edge and use gRPC internally where I own every client.
      </>
    ),
    checks: [
      'Named what gRPC gives you: binary encoding, HTTP/2, and generated typed stubs',
      'Named the edge constraint: limited browser and third-party support',
      'Stated the clean boundary: REST at the edge, gRPC service-to-service',
    ],
    trap: 'Bluffing past your hands-on depth falls apart on the next follow-up. Saying "I have seen gRPC run, not operated it myself" keeps your credibility intact.',
    number: { val: '15 B vs 40 B', body: 'the same User object in protobuf versus JSON, meaning less wire space and less CPU spent parsing.', refs: ['protobuf-vs-json-size'] },
    terms: ['grpc', 'rest', 'protobuf'],
  },

  /* ---------- indexing (spec 076, coverage-map F1) ----------
     Traps are the [GROUND] corrections from the briefing's blocks, per
     coverage-map §B.5. */
  {
    id: 'sayit-idx-scan',
    section: 'indexing',
    cue: 'This query sequentially scans 200 million rows and takes 40 seconds. Walk me through what the database is actually doing.',
    model: (
      <>
        The table lives in a {em('heap file')} with rows stored in no order, so without an index the engine has to read
        every page and check every row. It pulls full 8 KB pages whether I asked for one column or forty, so the cost
        tracks the table’s size in pages rather than its row count.
      </>
    ),
    checks: [
      'Named the storage layout: a heap file where rows sit in no order',
      'Identified the page, not the individual row, as the unit of I/O',
      'Priced the scan by pages read instead of rows examined',
    ],
    trap: 'Avoid saying "it is just a huge table." Size alone is not what makes it slow; the lack of any ordering is. Name the heap file.',
    number: { val: '8 KB per page', body: 'the real unit of disk I/O, so even a 200-byte row triggers a full page transfer.', refs: ['disk-page-size'] },
    terms: ['heapfile', 'index'],
  },
  {
    id: 'sayit-idx-depth',
    section: 'indexing',
    cue: 'This table is about to grow ten times larger. How much slower will our point lookups get?',
    model: (
      <>
        Hardly at all. A B-tree node holds a few hundred children, so tree depth grows with a high-base logarithm and ten
        times the rows adds {em('at most one extra page read')}. What actually feels the growth is your cache hit rate and
        maintenance windows, not the lookup itself.
      </>
    ),
    checks: [
      'Credited high fan-out for keeping tree depth nearly flat as the table grows',
      'Gave the right scale: hundreds of children per B-tree node',
      'Pointed to what actually degrades: cache hit rate and maintenance work',
    ],
    trap: '"Bigger table means slower index" is the reflex to unlearn. Point lookups scale logarithmically; vacuum and cache pressure do not.',
    number: { val: '~4 page reads', body: 'enough to locate a key among 100M rows at a fan-out near 340, with the top levels already warm in memory.', refs: ['btree-lookup-depth'] },
    terms: ['btree', 'index'],
  },
  {
    id: 'sayit-idx-cost',
    section: 'indexing',
    cue: 'Someone added six indexes to the orders table and write latency jumped. What changed under the hood?',
    model: (
      <>
        Every write has to keep every index in sync, so a single row change just turned into {em('seven physical writes')}.
        Each index is a wager that its column gets read more than the table gets written, and six of them add a permanent
        tax to every insert, update, and delete.
      </>
    ),
    checks: [
      'Explained the mechanism: every index must be updated on every write',
      'Quantified the multiplier: one row change becomes 1 + n physical writes',
      'Framed each index as a read/write bet rather than a free speedup',
    ],
    trap: 'Do not jump to "optimize the queries." The reads already got faster; that speedup is what the writes are paying for. Point straight at the write path.',
    number: { val: '1 + n writes', body: 'the work triggered by each row change, paid to keep reads at sub-millisecond lookups.', refs: ['pg-indexed-lookup-rate'] },
    terms: ['index', 'write'],
  },
  {
    id: 'sayit-idx-lsm',
    section: 'indexing',
    cue: 'You are ingesting 50,000 writes a second and the B-tree cannot keep up. What do you switch to?',
    model: (
      <>
        I would move to a log-structured engine. Writes append to an fsynced log and an in-memory table, then flush
        sequentially so {em('random page writes become one sequential stream')}. The tradeoff lands on reads, which may
        check multiple files, and bloom filters are what keep that affordable.
      </>
    ),
    checks: [
      'Described the write path: append-only log plus memtable, flushed sequentially',
      'Named the real cost: reads check multiple files, plus background compaction I/O',
      'Gave the rough crossover: an engine-level shift past ~10k writes/s',
    ],
    trap: 'Never call it "an LSM index." It is the storage format for the whole table, and calling it an index tells the room you are guessing.',
    number: { val: '~10,000 writes/s', body: 'the threshold where a log-structured engine starts pulling cleanly ahead of a B-tree.', refs: ['lsm-write-crossover'] },
    terms: ['lsm', 'memtable', 'bloomfilter'],
  },
  {
    id: 'sayit-idx-composite',
    section: 'indexing',
    cue: 'Your query filters by tenant and sorts by created_at. What index do you create?',
    model: (
      <>
        One composite index on {em('(tenant, created_at)')}, strictly in that order. The engine jumps straight to the
        tenant, and because rows inside each tenant are already sorted by date, the same scan satisfies both the filter
        and the sort with no extra sort step in the plan.
      </>
    ),
    checks: [
      'Picked a single composite index instead of two separate single-column indexes',
      'Cited the leading-prefix rule to explain why column order matters',
      'Named the payoff: one traversal handles both filtering and sorting',
    ],
    trap: 'Saying "I would index both columns" misses the point. Two separate indexes are not a composite one, and the planner cannot stitch them together to skip the sort.',
    number: { val: '1 traversal', body: 'the right column order answers both filter and sort together, while the reversed order forces a full sort.', refs: [] },
    terms: ['compositeindex', 'btree'],
  },
  {
    id: 'sayit-idx-small',
    section: 'indexing',
    cue: 'Would you put an index on the status column of a table with 800 rows?',
    model: (
      <>
        No. The entire table is only a couple of hundred kilobytes, so a sequential scan beats walking a tree and chasing
        random row fetches. The {em('query planner measures that')} and ignores the index anyway, leaving me with pure
        write amplification.
      </>
    ),
    checks: [
      'Said no and gave the physics: sequential reads beat random fetches at small size',
      'Named who makes the call: the query planner compares costs and picks the scan',
      'Pointed out the downside of adding it anyway: wasted write amplification',
    ],
    trap: 'Engineers often add an index, see zero speedup, and assume something is broken. The planner skipped it because skipping it was faster.',
    number: { val: '~1,000 rows', body: 'the rough floor below which an index adds pure overhead and a sequential scan wins outright.', refs: ['index-table-threshold'] },
    terms: ['queryplanner', 'index'],
  },
  {
    id: 'sayit-idx-geo',
    section: 'indexing',
    cue: 'You have latitude and longitude columns for a "restaurants near me" query. Just index both columns, right?',
    model: (
      <>
        No, because {em('sorted order is one-dimensional')}. The planner uses one index and then hand-filters a whole
        stripe of the planet. I would map the 2-D plane into a sortable geohash, or use a spatial tree like a quadtree for
        points or an R-tree when I need shapes.
      </>
    ),
    checks: [
      'Identified the geometry mismatch: two 1-D indexes cannot serve a 2-D box',
      'Named a real spatial structure and explained how it partitions space',
      'Committed to one choice and its tradeoff instead of reciting a list',
    ],
    trap: 'Rattling off geohash, quadtree, and R-tree without picking one sounds like flashcard recall. Choose one and state what it costs.',
    number: { val: '~100 points', body: 'roughly when a quadtree splits a cell, keeping cities deep and empty ocean shallow.', refs: ['quadtree-split-threshold'] },
    terms: ['geohash', 'quadtree', 'rtree'],
  },

  /* ---------- search-db (spec 076, coverage-map F1) ---------- */
  {
    id: 'sayit-search-builtin',
    section: 'search-db',
    cue: 'You put a dedicated search cluster in your diagram right away. Why not start with the database’s built-in full-text search?',
    model: (
      <>
        Most of the time I would start there, because it stems, ranks, and leaves me with one system to run. I bring in a
        dedicated search engine only for a specific need like {em('tunable relevance')}, typo tolerance, multi-language
        analysis, or heavy faceting that would crowd my write traffic.
      </>
    ),
    checks: [
      'Started from the simpler database option instead of defending the cluster',
      'Named a concrete capability that built-in full-text search lacks',
      'Acknowledged the operational overhead of running a second datastore',
    ],
    trap: '"Elasticsearch is for search" names a category, not a justification. Call out the exact requirement that forced you out of the primary database.',
    number: { val: '~0.3 ms', body: 'how fast an indexed lookup in the primary database already is, so raw speed alone rarely justifies a new cluster.', refs: ['pg-indexed-lookup-rate'] },
    terms: ['invertedindex', 'index'],
  },
  {
    id: 'sayit-search-inverted',
    section: 'search-db',
    cue: 'Walk me through what happens from the moment a document is saved until a search for one of its words finds it.',
    model: (
      <>
        The text runs through an analyzer that tokenizes, lowercases, strips stop words, and stems each word, appending
        the document’s id to each term’s postings list. At query time, search input passes through{' '}
        {em('the exact same analyzer')}, which is why searching "Running" still matches a document containing "ran".
      </>
    ),
    checks: [
      'Named the analysis pipeline and at least two stages inside it',
      'Described the inverted index: each term maps to a sorted list of document ids',
      'Caught the crucial symmetry: the same analyzer runs on both writes and queries',
    ],
    trap: 'Saying the engine "indexes the words" glosses over the whole mechanism. Analyzing terms before storing them is what makes matching forgiving.',
    number: { val: 'O(matches)', body: 'looking up and merging postings lists instead of scanning linearly across the whole corpus.', refs: [] },
    terms: ['analyzer', 'invertedindex', 'relevance'],
  },
  {
    id: 'sayit-search-updates',
    section: 'search-db',
    cue: 'Our product catalog reprices every few minutes and search latency has been creeping up. What is causing that?',
    model: (
      <>
        Search segments are immutable, so every update writes {em('a tombstone plus a brand-new copy')} of the document.
        Constant repricing piles dead documents into every segment and forces merges to run flat out reclaiming space,
        which is the exact workload this engine handles worst.
      </>
    ),
    checks: [
      'Called out segment immutability: documents are never edited in place',
      'Spelled out the update cost: a delete marker plus a full re-insert',
      'Tied the slowdown to merge pressure and dead space rather than raw write volume',
    ],
    trap: 'Throwing more nodes at the cluster misses the real issue. This is a workload mismatch: index the stable catalog fields and keep volatile prices in the database.',
    number: { val: 'update > insert', body: 'strictly and permanently, because the stale copy burns space and read work until a merge clears it.', refs: [] },
    terms: ['segment', 'tombstone'],
  },
  {
    id: 'sayit-search-truth',
    section: 'search-db',
    cue: 'Where does the search cluster sit relative to your primary database in this architecture?',
    model: (
      <>
        Strictly downstream. The database holds the source of truth and a change stream feeds the search index, making it
        a {em('derived read model')} that is eventually consistent by design. I would state the sync lag explicitly as a
        system parameter instead of pretending it is zero.
      </>
    ),
    checks: [
      'Placed search downstream as a derived read model, never the source of truth',
      'Named the sync path: a change stream flowing out of the database',
      'Owned eventual consistency and named an expected lag out loud',
    ],
    trap: 'Saying "the app writes to both" immediately invites the dual-write failure question, and there is no clean rescue from it. Name the stream that feeds the index.',
    number: { val: 'seconds of lag', body: 'the real window between a committed database write and a searchable result, so put a number on it.', refs: [] },
    terms: ['cdc', 'consistency'],
  },
  {
    id: 'sayit-search-page',
    section: 'search-db',
    cue: 'A user clicks all the way to result 9,000 and the search request suddenly fails. Why?',
    model: (
      <>
        Deep pagination. To build a globally sorted page, every shard has to return offset-plus-page-size hits for the
        coordinator to merge, so page 900 means {em('each shard ships 9,000 candidates')}. The engine caps that before
        memory blows up, and the real fix is a cursor rather than a higher limit.
      </>
    ),
    checks: [
      'Pinned the bottleneck on the coordinator merge rather than the page size',
      'Explained why cost scales with OFFSET instead of the number of displayed rows',
      'Gave the right fix: cursor pagination anchored on the last sort value',
    ],
    trap: 'Bumping the max-result limit is the classic trap. It just moves the cliff further back while letting memory pressure grow silently.',
    number: { val: '10,000 deep', body: 'the default cap on offset plus page size, after which the cluster refuses the query.', refs: ['es-deep-pagination-cliff'] },
    terms: ['cursor', 'pagination'],
  },
  {
    id: 'sayit-search-facet',
    section: 'search-db',
    cue: 'We need to facet these search results by brand and sort them by price. Does the inverted index handle that?',
    model: (
      <>
        No. An inverted index maps terms to documents, which is backwards for asking "what is this document’s price?"
        Sorting and faceting come from {em('doc values')}, a column-oriented copy stored in document order that lets the
        engine aggregate without blowing out heap memory.
      </>
    ),
    checks: [
      'Named the lookup direction mismatch: term-to-document versus document-to-value',
      'Named doc values and their column-oriented on-disk layout',
      'Explained why that second structure is what makes fast aggregations possible',
    ],
    trap: 'Saying "the inverted index handles sorting too" blurs two distinct structures together, and doc values are the exact reason search engines can run analytics.',
    number: { val: '2 layouts', body: 'the same field stored twice for opposite access directions, which is why search indexes often outweigh the raw data.', refs: [] },
    terms: ['docvalues', 'invertedindex'],
  },
  {
    id: 'sayit-search-shards',
    section: 'search-db',
    cue: 'How many shards would you give this search index, and can you change that count later?',
    model: (
      <>
        I would size the shard count by data volume, targeting tens of gigabytes per shard, and be upfront that the count
        is {em('fixed at creation')}. Changing it later requires building a new index and swapping an alias, so I would
        leave modest headroom rather than rely on an unscheduled reindex.
      </>
    ),
    checks: [
      'Sized shards from data volume instead of picking an arbitrary round number',
      'Stated clearly that the primary shard count is locked once data lands',
      'Named the real migration path: reindex into a new index behind an alias swap',
    ],
    trap: 'Over-sharding is the more common pitfall. Hundreds of tiny shards turn every query into heavy fan-out overhead without buying real parallelism.',
    number: { val: '10 to 50 GB', body: 'the healthy target size per shard, which determines the count you have to live with.', refs: ['es-doc-threshold'] },
    terms: ['shard', 'replica'],
  },
]

export const sayItCardsForSection = (sectionId: string): SayItCard[] => SAYIT_CARDS.filter((c) => c.section === sectionId)
