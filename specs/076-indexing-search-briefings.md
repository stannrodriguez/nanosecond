# 076 — Indexing + search-optimized databases (coverage-map F1)

The first fill-out spec off the F-queue (`docs/coverage-map.md` §D.1, row F1) and
the first to be authored against the three-registers reference implementation
(spec 069). Two briefings, one change, because they share their source material:
`indexing` becomes a six-block deep briefing on how a lookup is actually served,
and `search-db` becomes a six-block deep briefing on the one query shape the tree
cannot serve. Both ship their say-it decks and their outbound edges in the same
change (§D.0 standing rule).

Appendix A is the source-coverage map the SOURCE SUPERSET rule requires, derived
claim-by-claim from the coverage map's §B.2 rows for these two briefings.
Appendix B is the content BASELINE: every claim, register pairing, number, and
piece of viz copy in it must ship, but the wording and the order are the
implementation's to rework — write in the repo's voice, never toward the source's.

- [x] `indexing` rebuilt as the six viz-led blocks of Appendix B: THE PAGE IS
      THE UNIT · THE TREE THAT DEFAULTS · WHAT EVERY INDEX COSTS · WHEN THE
      WRITE PATH WINS · THE SHAPE, NOT JUST THE COLUMN · WHERE SORTED ORDER
      RUNS OUT (which closes with the hand-off paragraph). Legacy
      `body`/`viz`/`simplifies` point at block 1, per the 069 convention.
- [x] `search-db` rebuilt as six viz-led blocks: THE TREE CANNOT DO "CONTAINS" ·
      THE INVERTED INDEX, DERIVED · TWO LAYOUTS OF ONE FIELD · NOTHING IS EVER
      EDITED · THE QUERY IN TWO PHASES · WHAT IT IS NOT (hand-off, no viz).
- [x] New viz `BTreeWalk` (indexing block 2): a fan-out slider (16–512 children
      per node) driving a stepped descent root → branch → leaf → heap. Each step
      names the page it reads and whether that page is realistically cached;
      the headline is depth and reachable rows at the current fan-out. Keyboard:
      the stepper's existing prev/next buttons; the slider is labeled.
- [x] New viz `LsmPath` (indexing block 4): the four-stage write path (WAL
      fsync → memtable → SSTable flush → compaction) as steps, each carrying
      what is durable, what is in memory, and what a read now costs. A bloom
      filter toggle switches the read cost between "check every file" and
      "check the one file that might have it".
- [x] New viz `InvertedIndexBuilder` (search-db block 2): a fixed four-document
      corpus and three toggleable analysis stages (fold case · drop stop words ·
      stem). The postings map and a sample query's hit list both re-render as
      stages come off, so turning stemming off visibly loses a document.
- [x] New viz `SegmentMerge` (search-db block 4): stepped — writes land as new
      segments, an update writes a tombstone plus a new copy, a merge collapses
      them and reclaims the dead space. Two live counters: segments a query must
      check, and share of the index held by deleted documents.
- [x] Say-it decks ship in the same change: 7 cards on `indexing`
      (`sayit-idx-*`) and 7 on `search-db` (`sayit-search-*`), Appendix B §D.
      Traps are drawn from the `[GROUND]` corrections in Appendix A, per
      coverage-map §B.5.
- [x] Edges ship in the same change (Appendix B §E, coverage-map §C.2):
      `indexing ↔ nosql-db` and `indexing ↔ scaling-reads` (both directions);
      `search-db ↔ streams` and `search-db ↔ data-modeling` (both directions);
      `search-db → contention` and `search-db → proximity` (one-way — §C.2
      justifies only the outbound direction). Both briefings land at exactly the
      six-edge cap, which §C.3 predicts for both.
- [x] Glossary: six keys join the **Storage & Data** group with the full
      speakable contract (`heapfile`, `segment`, `tombstone`, `analyzer`,
      `relevance`, `queryplanner`) — every jargon word introduced by these
      blocks is a dotted `<Term>`.
- [x] Every displayed number cites `numbers.ts`: `disk-page-size`,
      `btree-lookup-depth`, `index-table-threshold`, `pg-indexed-lookup-rate`,
      `pg-table-row-ceiling`, `lsm-write-crossover`, `memtable-flush-size`,
      `quadtree-split-threshold`, `es-deep-pagination-cliff`, `es-doc-threshold`.
      No new numbers — P1/P4 landed them all.
- [x] Schema tests already cover the block contract, deck sizing, edge cap, and
      the speakable contract; this spec adds no new test shapes but must leave
      all of them green. e2e: one test per briefing asserting the block headings
      and one real interaction in each new viz, screenshotted at desktop and at
      380px.
- [x] verify.sh green; flagged screenshots reviewed at desktop AND 380px per
      autonomy rule 3 (both pages roughly triple in length — check the 380px flow
      top to bottom: every block heading, both new viz on each page, the
      hand-off panel, the say-it card).

## Context (read this, not the whole repo)
- **Read**: this spec end to end (the appendices are the content);
  `docs/coverage-map.md` §B.2 rows for `indexing` and `search-db`, §B.4 bundles
  N2/N4, §C.2 edge rows, §D.0 standing rule; CLAUDE.md quality bar (three
  registers + superset rule); `specs/069-networking-briefing.md` as the shape to
  copy; the `indexing` section in `src/content/manual/concepts.tsx` and the
  `search-db` section in `src/content/manual/technologies.tsx`;
  `src/ui/LayerStack.tsx` + `src/ui/LossToggle.tsx` as the bespoke-viz model;
  one Storage & Data glossary entry (`sstable`) as the speakable model; the
  networking deck in `src/content/sayit.tsx` as the card model.
- **Touch**: `src/content/manual/concepts.tsx` (indexing section),
  `src/content/manual/technologies.tsx` (search-db section), four new viz files
  in `src/ui/`, `src/content/glossary.ts` (6 entries + the storage group list),
  `src/content/sayit.tsx` (14 cards), `src/content/edges.ts` (6 edges),
  `e2e/modes.spec.ts` + baselines, `specs/README.md`, `docs/coverage-map.md`
  (mark F1 landed).
- **Voice**: confident, concrete, lightly playful. The registers are already in
  the baseline — precision sentences and intuition sentences are deliberately
  doubled. Do not compress them into each other.
- **Scope guard**: no changes to the other 25 briefings, no new `numbers.ts`
  entries, no new glossary groups, no changes to the block-rendering path or the
  deck UI. The neighbor assignments in Appendix A are commitments for FUTURE
  specs (F5, F6, F7, F12, F15), not this one — with the two exceptions that this
  spec discharges by edge, noted inline.

---

## Appendix A — source coverage (cc08 "Database Indexing", kt02 "Elasticsearch")

Superset is site-level (content-pipeline §7): a topic routed to a neighbor is
covered because the edge in Appendix B §E exists. Every §B.2 row for these two
briefings appears below with the register it lands in.

### A.1 · cc08 → `indexing`

| Source topic | Destination | Register |
|---|---|---|
| Heap files; page-at-a-time loading; why a scan is slow | block 1 | UNDERSTAND |
| Random vs sequential access still differing on solid-state storage | block 1 | GROUND — corrects a common belief |
| Index space cost approaching data size; one write amplification per index | block 3 + `numbers` | UNDERSTAND |
| The two cases where indexes lose (write-heavy/read-rare, tiny tables) | block 3 | GROUND |
| B-tree structure rules, page-sized nodes, shallow lookups, the five reasons it defaults | block 2 viz | UNDERSTAND |
| LSM trees: whole-table storage format, four-stage write path, read penalty, three mitigations | block 4 — the deepest block | UNDERSTAND |
| Compaction strategy trade-off (write amplification vs file count) | block 4 | GROUND |
| Hash indexes: exact-match only, rare in practice | block 6 | GROUND |
| Geospatial: why two 1-D indexes fail; geohash, quadtree, R-tree | block 6 summary → `proximity` | UNDERSTAND (summary) |
| Inverted indexes: the flipped mapping and the analysis pipeline | block 6 summary → `search-db` | UNDERSTAND (summary) |
| Composite indexes: one traversal for filter + sort, the prefix rule, three canonical shapes | block 5 | UNDERSTAND |
| Covering indexes and the modern "niche optimization" assessment | block 5 | GROUND |
| Specialized index types in a relational engine (inverted-text, spatial, partial) | partial ships in block 5; the rest → `relational-db` (edge exists) | GROUND |
| The closing index-selection flowchart | block 6 viz + say-it deck | RETRIEVE |
| Internals aren't asked but ground the reasoning; infrastructure roles probe harder | folded into the deck's `trap` fields, not shipped as meta-advice | RETRIEVE |

**Numbers (all pre-existing, spec 071):** `disk-page-size` · `btree-lookup-depth`
· `index-table-threshold` · `pg-indexed-lookup-rate` · `pg-table-row-ceiling` ·
`lsm-write-crossover` · `memtable-flush-size` · `quadtree-split-threshold`.

### A.2 · kt02 → `search-db`

| Source topic | Destination | Register |
|---|---|---|
| When a general-purpose index suffices, and what pushes you past it | block 1 | UNDERSTAND |
| Documents, indices, mappings, fields — with "index" flagged as overloaded | block 1 | UNDERSTAND |
| Keyword vs text as hash-lookup vs inverted-index | block 1 | GROUND |
| Mapping bloat costing memory | block 1 | GROUND |
| Nesting vs separate index as the normalization trade-off | → `data-modeling` (new edge) | — |
| Inverted index derived from first principles (reorganize, or copy and reorganize) | block 2 viz | UNDERSTAND |
| The analysis pipeline: tokenize, normalize, remove stop words, stem | block 2 viz — the toggles ARE the pipeline | UNDERSTAND |
| Relevance scoring as the default sort | block 2 + `glossary:relevance` | GROUND |
| Doc values as a columnar per-field structure, linked to analytics engines | block 3 | UNDERSTAND |
| Segment immutability: merges, tombstones, soft-delete-plus-insert | block 4 viz | UNDERSTAND |
| Updates costing more than inserts; the poor fit for rapidly-changing data | block 4 | GROUND — the load-bearing limitation |
| The named benefits of immutability | block 4 | GROUND |
| Shard/replica/segment nesting; replicas multiplying throughput | block 5 | UNDERSTAND |
| Node types, role composition, hot/warm/cold tiers | block 5 | GROUND |
| Two-phase query/fetch; the ideal of never touching source documents | block 5 viz | UNDERSTAND |
| Query planning: the order-of-execution example, and statistics as what enables the choice | block 5 + `glossary:queryplanner` | UNDERSTAND |
| Three pagination models and the deep-pagination cliff | mechanism in block 5 → `api-design` owns the API-shape half (F7) | UNDERSTAND |
| Optimistic concurrency via a version field | → `contention` (new one-way edge) | — |
| Geospatial field types and their index structures | → `proximity` (new one-way edge) | — |
| Fed by change data capture; not a system of record; the interview cautions | block 6 + say-it deck | UNDERSTAND + RETRIEVE |
| Built-in text search in a relational engine as the cheaper first move | block 1 states it; depth → `relational-db` (edge exists) | GROUND |

**Numbers (all pre-existing, specs 071/075):** `es-deep-pagination-cliff` ·
`es-doc-threshold` · `pg-indexed-lookup-rate` (the built-in-is-fast-enough
argument) · `replication-factor`.

### A.3 · Waivers claimed for this spec

All are already carried in coverage-map §B.6; none is new, and nothing is
silently dropped.

- Query-language and index-definition syntax (both articles) — the *shape* of a
  composite key or a mapping ships; typing its syntax is not a systems-design
  skill.
- The source's five transferable-lessons recap (kt02) — our recap layer is the
  say-it deck and the hand-off block, and duplicating it would be a third summary
  of the same page.
- Seniority-gating and role-weighting asides in both articles — the durable half
  ships as deck `trap` fields; the "if you're junior, stop here" framing does not,
  because the library does not gate depth by claimed seniority.
- Historical version-number specifics for search features — the capability ships,
  the release number does not.

---

## Appendix B — content baseline (keep every claim; rephrase and reorganize freely)

### B.1 · `indexing`

**Thesis:** What does the engine actually do to find your row — and what does
each shortcut cost?

#### Block 1 · THE PAGE IS THE UNIT

Precise: a table is a heap file — rows land wherever there is room, in no
order at all. The engine never reads a row; it reads the page the row sits on,
8 KB of it (`disk-page-size`), because the page is the unit of I/O, of buffer
caching, and often of locking. A full scan is therefore "read every page, test
every row," and its cost is the table's size in pages, not in rows.

Intuition: it is a filing cabinet where every folder was dropped in wherever it
fit. There is no drawer for the Ms. To find one folder you open every drawer,
and you always pull the whole drawer even when you want one sheet from it.

GROUND correction (this is the belief to break): *"SSDs made random access
free."* They did not. Sequential streaming still beats scattered random reads by
roughly an order of magnitude on NVMe — it was a thousandfold on spinning disk,
so the gap narrowed dramatically and then stopped narrowing. That surviving gap
is why the planner still prefers a scan on a small table, and why every index
decision below is a bet against sequential streaming rather than against the
disk being slow.

Viz: the existing table-size `Slidey`, retuned to report pages as well as reads —
`10^v rows` → `pages = rows × 200 B ÷ 8 KB`, scan reads = pages, index reads =
`log_340(rows) + 1`. Caption names `disk-page-size` and `btree-lookup-depth`.
Simplifies: counts logical page reads, not cache hits; ignores that the top
levels of any tree are effectively always resident, and that a range scan or a
sort changes the arithmetic entirely.

Closing beat (dim register): below about a thousand rows
(`index-table-threshold`) the whole calculation inverts and the scan simply
wins — 25 pages read in one streaming burst, faster than any tree walk plus a
random fetch. An index there is pure write amplification with a lookup attached.

#### Block 2 · THE TREE THAT DEFAULTS

Precise: a B-tree node is sized to exactly one page. With ~16-byte keys and
8-byte child pointers, one 8 KB node holds on the order of 340 children — fan-out
in the hundreds, not two. Depth is a logarithm in that fan-out: 340² ≈ 115,000
rows at depth 2, 340³ ≈ 39 million at depth 3, 340⁴ ≈ 13 billion at depth 4. A
hundred-million-row table therefore sits at depth ~4 (`btree-lookup-depth`), and
the top two or three levels are almost always already in memory, so the real cost
is roughly one disk read. The structure stays balanced by construction: nodes are
kept between half-full and full, splitting when they overflow and merging when
they empty, so every leaf is the same distance from the root — no query is
unlucky.

Intuition: each extra level multiplies the reachable rows by ~340, so growth is
almost free. "The table got ten times bigger and lookups got slower" is nearly
always false — depth barely moved. What actually got slower is the buffer-cache
hit rate, or maintenance (`pg-table-row-ceiling`).

The five reasons this is the default, and the honest reason to know them: point
lookups (one descent), range queries (leaves are linked, so a range is a descent
plus a walk), sorted retrieval (the index is already in order, so ORDER BY is
free), prefix matching on strings (a prefix is a range), and predictable
behaviour under a mixed read/write load. Nothing else in the family does five
things well. When in doubt in an interview, this is the answer, and saying *why*
is the part that scores.

Viz: `BTreeWalk`. Fan-out slider 16 → 512 (init 340). Headline: `depth N ·
reaches M rows`. Steps: `root` ("one page read; this node is always cached"),
`branch` ("one page read; the top levels stay resident, so this is usually memory
too"), `leaf` ("the first read that realistically touches disk — it holds the key
and a pointer to the row"), `heap fetch` ("a RANDOM read to the page the row
actually lives on — the expensive half, and the one a covering index removes").
Simplifies: fan-out depends on key width, so a wide text key drops it sharply and
adds a level; assumes no compression and ignores that the planner may choose a
scan anyway.

#### Block 3 · WHAT EVERY INDEX COSTS

Precise: an index is a second copy of its columns plus a pointer per row, so a
wide index can approach the size of the data itself. Worse, it is on the write
path: every insert, update, and delete on the table maintains *every* index on
that table. One logical row write becomes 1 + n physical writes.

Intuition: an index is a bet that this column is read more often than the table
is written. Six indexes means every write does seven jobs, forever, in exchange
for six queries being fast.

The two cases where the index loses, stated plainly: a column that is written
constantly and queried rarely (the bet is backwards), and a table small enough
that the scan wins anyway (`index-table-threshold`) — where the planner will
measure and ignore your index, which is the correct call and is regularly
misread as the index being broken.

Viz: `Slidey`, "indexes on this table" 0 → 8, init 3. Headline: `1 row write =
N physical writes`. Bars: write amplification, index space as a fraction of the
table, and reads served. Caption ties the write cost to
`pg-indexed-lookup-rate` — the read that got fast is already sub-millisecond, so
the question is always what you paid for it.
Simplifies: assumes every index is maintained on every write, which is true for
inserts and deletes but only for updates that touch an indexed column; ignores
fill-factor and index-only maintenance optimizations.

#### Block 4 · WHEN THE WRITE PATH WINS — THE LOG-STRUCTURED TREE

**The correction this block exists for:** an LSM tree is not another index type
sitting next to a B-tree on one column. It is the storage format of the *whole
table*. Choosing it is choosing an engine, not adding a structure, and that is
why the wide-column stores behave the way they do all the way down.

Precise, in four stages. (1) The write is appended to the
`wal`{write-ahead log} and fsynced — durability lands *here*, and nowhere else.
(2) It is inserted into the in-memory `memtable`, sorted, at RAM speed. (3) When
the memtable fills — commonly around 64 MB (`memtable-flush-size`) — it is
flushed to disk as one immutable `sstable`{SSTable}, a single sequential write.
(4) `compaction` merges SSTables in the background, keeps the newest version of
each key, and physically drops tombstones.

Intuition: a B-tree writes where the data belongs; an LSM writes where the disk
is fastest and tidies up later. That is the entire trade, and above roughly
10,000 sustained writes per second (`lsm-write-crossover`) it stops being taste.

The read penalty, and its three mitigations. A read may have to consult the
memtable *plus every SSTable*, because one key's history is spread across
files. (a) A `bloomfilter`{bloom filter} per file rules keys OUT with certainty —
never a false negative — so most files are skipped without a disk trip at all.
(b) A sparse index holds one key per block, so a file that might have the key is
entered at a byte offset instead of scanned. (c) Compaction strategy, which is
the one real dial: leveled compaction rewrites more aggressively, so reads check
fewer files and writes are amplified more; size-tiered rewrites less, so writes
stay cheap and reads check more files. They pull in opposite directions, and
choosing between them IS the workload question.

Closing beat (dim register): none of this makes writes free — it defers them.
The same data is rewritten several times over its life, so you pay in background
I/O that competes with live traffic, and in read amplification. What you bought
is that the payment happens off the commit path.

Viz: `LsmPath`. Four steps, each with three fields — DURABLE ("yes, the moment
the log was fsynced" from step 1 onward), IN MEMORY, and A READ NOW COSTS.
Bloom-filter toggle flips the step-4 read cost between "memtable + all 6
SSTables" and "memtable + the 1 file the filter could not rule out".
Simplifies: one memtable and a handful of SSTables where a real engine runs
several levels with many files each; ignores that compaction runs continuously
rather than as a discrete step, and that the WAL is recycled rather than growing
forever.

#### Block 5 · THE SHAPE, NOT JUST THE COLUMN

Precise: a `compositeindex`{composite index} sorts by its columns in the
declared order — by the first, then by the second within it. Because the sort is
nested, it can be entered only from a *leading prefix*: an index on
(tenant, created_at) serves a query filtering on tenant, and one filtering on
tenant and ordering by created_at, and nothing that starts at created_at. Order
it filter-column-first, sort-column-next, and a single traversal answers both
halves of the query with no sort step at all.

Intuition: two separate indexes are not a composite index, and the planner
cannot glue them together into one. The prefix rule is the answer to "why is my
index not being used?" more often than any other single fact.

The three canonical shapes worth having in your hands: (filter, sort) — the
common one above; (equality, range) — equality column first, always, because a
range in the leading position destroys the ordering of everything after it; and
(tenant, time) — the multi-tenant shape, where the tenant column is doing
partition-like work inside a single index.

The selectivity heuristic, and its nuance: put the most selective column first,
*unless* the query sorts — in which case the sort column's position matters more,
because getting it wrong forces the engine to materialize and sort the whole
result set, which is exactly the cost you were trying to avoid.

Then the two refinements. A `coveringindex`{covering index} carries the columns
the query returns, so the engine answers from the index alone and skips the
random heap fetch — the expensive half from block 2. It costs duplication on
every write, and the modern assessment is honest: it is a niche optimization for
one measured, hot, narrow query, not a default. A `partialindex`{partial index}
covers only rows matching a condition, which is how a job table's few pending
rows get an index small enough to live in memory while the millions of finished
rows cost nothing to maintain.

Viz: `Toggler` with three query shapes — "filter by tenant, sort by date" ·
"filter by date range, sort by price" · "return just the id and the status".
Each shows the index that serves it in one traversal, and what the wrong shape
costs instead (an extra sort, a scan of a stripe, a heap fetch per row).
Simplifies: a real planner decides on statistics and may still choose a scan;
the shapes here are the reasoning, not a guarantee about any one engine.

#### Block 6 · WHERE SORTED ORDER RUNS OUT

Everything above rests on one assumption: that the values can be put in order,
one dimension at a time. Three query shapes break it.

**Exact match only.** A hash index answers "equals this value" in one step and
nothing else — no ranges, no sorts, no prefixes. It is genuinely rare in
practice, and the reason is not that it is bad: a B-tree at depth four is close
enough at equality and does four other things besides. Name it, know why you
didn't pick it, move on.

**Two dimensions.** Latitude and longitude are two ordered values, so it is
tempting to index both. It does not work: the planner picks one of them and hand-
filters a stripe of the planet. Sorted order is one-dimensional, and "near me" is
not. The answers all reduce the plane to something orderable or build a tree
around the data. A `geohash` recursively halves the map and encodes the path as
a string, so nearby points share a prefix and an ordinary B-tree can index it —
you then have to check adjacent cells too, because two points either side of a
cell boundary can be metres apart and share no prefix. A `quadtree` splits a node
into four whenever it exceeds a threshold of points (`quadtree-split-threshold`),
so dense cities grow deep and empty ocean stays one node. An `rtree`{R-tree}
nests bounding rectangles fitted to the data, which is what lets it index
polygons and points together, at the cost of overlapping siblings forcing a
search down more than one branch. Depth on all three lives on §Proximity-based
services.

**Somewhere in the middle of a string.** A B-tree indexes values from the left,
so a query for documents *containing* a word has no prefix to seek on and
degrades to a scan. The fix is not a better tree; it is to flip the mapping
entirely — term → the list of documents containing it — which is an
`invertedindex`{inverted index}, and it is a different data structure with a
different write path. §Search-optimized databases is that structure at full
depth.

Hand-off (dim register): those two are the pages this one hands off to, and the
rest of the neighborhood follows the same logic — the storage format that the
log-structured tree above describes is the whole point of §NoSQL databases, an
index is the first and cheapest rung of §Scaling reads, and whether your index
is used at all is a decision the planner makes on statistics over in §Relational
databases.

Viz: `Toggler` with four query shapes — `id = 42` · `created_at BETWEEN … ORDER
BY` · `within 5 km of me` · `contains the word "latency"` — each naming the
index family that answers it, the one that looks right and isn't, and where the
depth lives.
Simplifies: real engines blur these — a relational engine ships spatial and
full-text index types in the box, so "which family" is a question about the
access shape, not about which product you have to buy.

### B.2 · `search-db`

**Thesis:** What does a search engine do that an index on your database can't?

#### Block 1 · THE TREE CANNOT DO "CONTAINS"

Precise: a B-tree finds values by a prefix, so `LIKE '%latency%'` has nothing to
seek on and becomes a full scan — every row read, every string tested, linear in
table size, with no ranking at the end of it. The first move is not a new system:
relational engines ship a real full-text index, with stemming and ranking, and it
covers far more than candidates expect (`pg-indexed-lookup-rate` is the reminder
that the built-in path is already fast). What actually pushes you past it:
analysis in several languages, typo tolerance and fuzzy matching, relevance you
need to tune rather than accept, faceting and aggregation over large result sets,
and a search load heavy enough that it would compete with the source of truth's
own traffic.

Intuition: the built-in is right up to the moment search stops being a query and
starts being a feature. "We added a search box" is a query. "Results should
rank, facet, correct typos, and hold up under the read load of the whole
product" is a feature, and features get their own system.

The vocabulary, with one warning attached. A *document* is a JSON record; an
*index* is a collection of them; a *mapping* declares the fields and their types;
a *field* is one of them. The warning is that **"index" is overloaded** — here it
means the whole collection, closer to a table than to a lookup structure, and
the thing that plays the role of an index in the block-1 sense is built *inside*
it per field. Two field types matter: `keyword` is stored whole and matched
exactly, a hash lookup; `text` is run through the `analyzer`{analysis pipeline}
and matched by term, an inverted-index lookup. Choosing wrong is the classic
first bug — an exact-match filter on an analyzed field, or a search over a
keyword field that only ever matches the whole string.

GROUND correction: mapping every field you might one day query is not free. Every
mapped field carries into cluster state and memory, and a mapping that grew by
accretion is one of the more common causes of a cluster that is slow for no
visible reason.

Viz: `Toggler` — "LIKE '%term%'" · "built-in full-text index" · "dedicated search
engine". Each states the mechanism, what it costs, and where it stops.
Simplifies: the built-in and the dedicated engine use the same underlying idea,
so the boundary is about operations and scale rather than about capability; the
row counts are illustrative.

#### Block 2 · THE INVERTED INDEX, DERIVED

Precise: there are exactly two ways to make a lookup fast. Reorganize the data
by the thing you look up, or leave the data alone and build a second structure
organized that way. A row store is organized by row, and reorganizing the corpus
by word is not an option — so: the second one. Build a map from every term to the
sorted list of documents containing it (its postings list). A query for two words
is then two lookups and an intersection of two sorted lists, which is linear in
the number of matches rather than in the size of the corpus.

Intuition: it is the index at the back of a book, built by a machine that read
every page. That is also exactly why it costs what it costs — somebody has to
read every page, once, at write time.

Nothing goes in raw. The `analyzer`{analysis pipeline} runs first: **tokenize**
(split the text into terms), **normalize** (lowercase, strip punctuation and
accents), **remove stop words** ("the", "of", "a" — high frequency, near-zero
discriminating power), and **stem** (running, ran, runs → run). The critical
detail is that the *same* pipeline runs over the query, which is the entire
reason searching "Running" finds a document that said "ran".

`relevance`{Relevance} is the default sort, and it is not insertion order or
recency: it is a score per document — how often the term appears in it, damped
by how common that term is across the whole corpus, normalized by document
length. A rare word carries the match; a common one barely moves it. That single
sentence is usually the whole depth an interview wants, and knowing that the
scoring exists at all is what stops you designing your own ranking on top of it
by accident.

Viz: `InvertedIndexBuilder`. Fixed four-document corpus; three toggles — fold
case · drop stop words · stem. The postings map re-renders live, and a sample
query ("running latency") shows its hit list. Turning stemming off visibly drops
a document from the hits; turning stop words back in visibly inflates the map
with a term that matches everything.
Simplifies: a real analyzer chain is longer and language-specific, scoring uses a
tuned formula rather than raw counts, and a real corpus is millions of documents
where the postings lists are compressed on disk.

#### Block 3 · TWO LAYOUTS OF ONE FIELD

Precise: the inverted index runs term → documents. That is exactly backwards for
sorting, faceting, and aggregating, all of which need document → value. So the
engine stores the same field a *second* time, column-wise on disk, as
`docvalues`{doc values}: one contiguous column per field, in document order.

Intuition: two layouts of one field, each pointed the direction it will be read
from. It is also why the index on disk is bigger than the data you gave it —
you are storing every searchable, sortable field twice, and that duplication is
the price of doing both jobs at once.

GROUND link outward: a per-field column in document order is precisely how
analytics engines are laid out, which is why a search engine can also answer
"average price per brand across these two million hits" without the query
touching a single source document.

Viz: `Toggler` — "find the documents containing X" vs "sort these hits by price /
count them by brand". Each shows which structure answers it, in which direction,
and what it would cost from the other one.
Simplifies: doc values are not built for every field type or for fields excluded
from them; the "twice" is a simplification of several optional per-field
structures.

#### Block 4 · NOTHING IS EVER EDITED

Precise: the index is a set of immutable **segments**. New documents buffer and
land as a *new* segment. A delete does not remove anything — it records a
`tombstone` in a side structure, and the document keeps taking up space and
keeps being read and filtered out. An update is a soft delete plus an insert.
Merges combine small segments into bigger ones and are where tombstoned
documents are actually dropped.

**The load-bearing consequence:** an update costs strictly more than an insert.
This is the fact that decides whether the whole system is a fit. A catalogue of
mostly-static documents that are searched constantly is the perfect workload. A
set of documents whose fields change every few minutes is the worst one — you
are paying insert cost plus tombstone cost plus merge pressure, forever, for
data that a database would have updated in place.

Intuition: it is a stack of finished, bound books, not a whiteboard. Correcting
a line means printing a new page and crossing out the old one, and the
crossing-out stays there — costing you space and a little read work on every
query — until someone reprints the volume.

Immutability is a choice, not an accident, and it buys a lot: readers never take
a lock, because nothing they are reading can change; the OS page cache can hold
segment files forever, because files never change; compression is easy on
write-once data; replication can ship whole files; a query gets a consistent
point-in-time view for free; and crash recovery is simple, because a partially
written segment is just discarded. Every one of those is a general lesson, not a
search-engine one — the same trade shows up in the log-structured storage engine
on §Database indexing.

Viz: `SegmentMerge`. Steps: index three documents (one segment) · index three
more (two segments) · update one (tombstone + new copy, three segments) · merge
(one segment, dead space reclaimed). Live counters: segments a query must check,
and share of the index held by deleted documents.
Simplifies: real engines run a continuous tiered merge policy with many segments
and a refresh interval that decides when new documents become visible; the
counters here move in discrete steps for legibility.

#### Block 5 · THE QUERY IN TWO PHASES

Precise, from the outside in: an index is split into **shards**; each shard is a
self-contained index built from segments; each shard has **replicas**, which are
full copies. Replicas multiply read throughput — every copy can serve a query —
and they do nothing for the latency of one query. Nodes take roles: coordinating
(receives the request, merges results), data (holds shards), master-eligible
(cluster state), plus ingest and machine-learning roles, and a node can hold
several. Data itself is tiered by age — hot, warm, cold, frozen — on
progressively cheaper storage.

A search runs in two phases, and this is the mechanism worth being able to draw.
**Query:** the coordinator fans the request out to one copy of every shard, and
each returns only document ids and scores for its own top-k — not documents.
**Fetch:** the coordinator merges those lists, takes the global top-k, and asks
only the shards that own those specific documents for their content. The ideal
case never touches a source document at all, because everything the response
needs is already in doc values.

Intuition: it is the difference between asking ten libraries to post you their
best twenty books and asking them to post you every book so you can pick twenty.

**Query planning.** The order in which filters are applied changes the work by
orders of magnitude. A filter matching 0.1% of documents applied first leaves a
thousand candidates for the expensive text scoring; applied last, the scoring
runs over the whole corpus. What lets the engine choose well is
`queryplanner`{statistics} — per-term document counts it already maintains, which
tell it which clause is selective before it runs anything.

The cliff worth naming out loud: `from + size` pagination means *every* shard
must return `from + size` documents so the coordinator can order them globally.
Page 1,000 at ten per page across five shards is 50,000 documents merged to show
ten, which is why the default refuses to go past ten thousand deep
(`es-deep-pagination-cliff`). Raising the limit moves the cliff; it does not
remove it. The fix is a cursor that remembers the last sort value instead of
counting from the start — the API shape of that choice lives on §API design.

Viz: `Toggler`, two plans over the same query — "score the text first, then
filter" vs "filter first, then score". Each shows the candidate count at each
stage.
Simplifies: real planners consider far more than clause order, and the counts
are illustrative; the two-phase description omits several optimizations that skip
the fetch entirely.

#### Block 6 · WHAT IT IS NOT

The engine is almost never the source of truth, and saying so unprompted is
worth more than any internals question you might answer. It is a derived read
model: the database holds the truth, a change stream (`cdc`) carries every write
across, and the index is rebuilt from that stream. Which makes it eventually
consistent *by construction* — the lag is a design parameter you should be able
to name, not a bug you should apologize for.

Four things to have ready. Say how it is kept in sync, because "we'll write to
both" is the wrong answer and a dual write is the bug that follows it. Say that
mappings are effectively fixed once documents exist, so a real mapping change
means building a new index and swapping an alias across — the reindex question is
coming. Say how you sized the shard count, because it is fixed at creation and
`es-doc-threshold` is the number that sets it. And justify the whole system over
the built-in from block 1, in one sentence, before you draw the box.

Hand-off: §Database indexing is the family this structure belongs to;
§Relational databases is where the truth stays and where the cheaper built-in
lives; §Streams is the change stream that feeds this one; §Data modeling is where
"nest the related records or index them separately" turns out to be the
normalization question again; §Dealing with contention is where the version-field
trick this engine uses for concurrent updates is one rung of a longer ladder; and
§Proximity-based services is where its geospatial field types become a real
answer.

(No viz — the hand-off block, per the spec 069 shape. WHERE THIS TOUCHES renders
directly beneath it.)

### B.3 · New glossary entries (Storage & Data group, full speakable contract)

- **heapfile** — def: rows stored in no order, wherever there is room; the page
  is the unit of I/O; a scan is O(pages). say: one sentence tying "no order" to
  "every lookup without an index reads every page". reachFor: explaining why a
  query is slow before reaching for a fix. trap: *"the database reads the row"* →
  it reads the 8 KB page the row is on.
- **segment** — def: an immutable file that is one self-contained piece of a
  search index; new writes create new ones; merges combine them. say: ties
  immutability to lock-free reads and to merge cost. reachFor: explaining why
  updates are expensive and why more segments means slower queries. trap: *"the
  document gets updated in the index"* → it is a tombstone plus a new copy.
- **tombstone** — def: a marker that a record is deleted, written instead of
  removing it; the space returns at merge/compaction time. say: one sentence
  covering delete-is-a-write and space-comes-back-later. reachFor: LSM and search
  internals; "why did disk usage go UP after we deleted a million rows?". trap:
  *"deleting frees the space"*.
- **analyzer** — def: the pipeline turning text into indexed terms — tokenize,
  normalize, remove stop words, stem — run identically over documents and over
  the query. say: one sentence including the run-on-both-sides fact. reachFor:
  any "why doesn't my search match this?" question. trap: *"it stores the words"*
  → it stores the analyzed terms, which is why case and word endings stop
  mattering.
- **relevance** — def: the default sort of a search result: term frequency in
  the document, damped by term rarity across the corpus, normalized by document
  length. say: one sentence, mechanism-first. reachFor: explaining what "sorted
  by relevance" actually computes. trap: *"results come back in the order they
  were added"*.
- **queryplanner** — def: the component that decides HOW to run a query — which
  index, which clause first — on statistics rather than on your intentions. say:
  one sentence linking statistics to plan choice. reachFor: "why is my index not
  being used?", and clause-ordering questions. trap: *"the index makes the query
  fast"* → the planner decides whether to use it, and it decides on measurements.

### B.4 · Say-it decks

**`indexing` (7 cards).** Cues, models compressed to a breath, three checks each,
and traps drawn from the GROUND corrections above.

| id | cue | the answer's spine | number |
|---|---|---|---|
| `sayit-idx-scan` | A query sequentially scans 200 million rows and takes 40 seconds. Walk me through what's actually happening. | heap file, no order, page-at-a-time; cost is pages not rows | `disk-page-size` |
| `sayit-idx-depth` | This table is about to grow ten times. How much slower do the point lookups get? | barely — depth is a log in a fan-out of hundreds; what degrades is cache hit rate and maintenance | `btree-lookup-depth` |
| `sayit-idx-cost` | Someone added six indexes to the orders table and writes have slowed down. What happened? | every write maintains every index: 1 row write → 7 physical writes | `pg-indexed-lookup-rate` |
| `sayit-idx-lsm` | You're taking 50,000 writes a second and the B-tree can't keep up. What do you change? | LSM engine — sequential appends, deferred merge; pay on reads, mitigate with bloom filters | `lsm-write-crossover` |
| `sayit-idx-composite` | The query filters on tenant and sorts by created_at. What index would you build? | composite (tenant, created_at); prefix rule; one traversal, no sort step | — |
| `sayit-idx-small` | Would you index the status column on a table with 800 rows? | no — the planner will measure and scan anyway; it is pure write cost | `index-table-threshold` |
| `sayit-idx-geo` | You have latitude and longitude columns and a "restaurants near me" query. Two indexes, right? | no — sorted order is one-dimensional; geohash / quadtree / R-tree, pick one and say why | `quadtree-split-threshold` |

**`search-db` (7 cards).**

| id | cue | the answer's spine | number |
|---|---|---|---|
| `sayit-search-builtin` | You reached for a search cluster on slide two. Why not just use the database's built-in full-text search? | built-in covers more than expected; name the specific thing that pushes past it | `pg-indexed-lookup-rate` |
| `sayit-search-inverted` | Walk me through what happens between a document being saved and it being findable by one of its words. | analysis pipeline, then term → postings; same pipeline over the query | — |
| `sayit-search-updates` | Our catalogue reprices every few minutes and search has gotten slow. Any idea why? | segments are immutable; update = tombstone + insert; merge pressure | — |
| `sayit-search-truth` | Where does the search cluster sit relative to the database in this design? | derived read model fed by CDC; eventually consistent by construction; never the source of truth | — |
| `sayit-search-page` | A user pages to result 9,000 and the request fails. What's going on? | every shard returns from+size; the merge is the cost; cursor, not a bigger limit | `es-deep-pagination-cliff` |
| `sayit-search-facet` | You want to facet these hits by brand and sort them by price. Does the inverted index do that? | no — wrong direction; doc values, a per-field column in document order | — |
| `sayit-search-shards` | How many shards would you give this index, and can you change it later? | size by data volume per shard; fixed at creation; reindex + alias swap | `es-doc-threshold` |

### B.5 · Edges (coverage-map §C.2, both directions unless marked one-way)

| a | b | kind | direction sentences |
|---|---|---|---|
| `indexing` | `nosql-db` | composes-with | **→** the log-structured engine is not a per-column index but the whole table's format, which is why these stores behave as they do · **←** their secondary-index limitations follow directly from that storage format, so the constraint stops looking arbitrary |
| `indexing` | `scaling-reads` | composes-with | **→** indexes have a ceiling, and the progression past it — replicas, then caches — is what comes next · **←** the first and cheapest rung of the read ladder is an index, and most read problems end there |
| `search-db` | `streams` | needs | **→** the index is almost always fed by a change stream rather than written to directly, which is what makes it eventually consistent · **←** keeping a derived index current is the canonical worked example of what a change stream is for |
| `search-db` | `data-modeling` | trades-against | **→** whether to nest related records or separate them is the same normalization decision, with the same read/write trade-off · **←** the denormalized shape a search index wants is the clearest case of modeling for the query rather than for the entity |
| `search-db` | `contention` | composes-with | **one-way →** concurrent document updates are resolved with a version field — the same optimistic move, in a store with no transactions |
| `search-db` | `proximity` | composes-with | **one-way →** its geospatial field types are a production-grade answer to proximity search, with a distinct index structure behind them |

**Cap check.** After this change `indexing` has six outbound edges
(data-modeling, relational-db, search-db, proximity, nosql-db, scaling-reads) and
`search-db` has six (indexing, relational-db, streams, data-modeling, contention,
proximity) — both exactly at the §C.3 cap, which is what §C.3 predicts for both.

**One deviation from §C.3, recorded here.** §C.3's dropped-edge note proposes
removing `indexing → data-modeling` to respect the cap. Keeping it lands
`indexing` at exactly six rather than five, it is already written and annotated
(spec 074), and deleting a shipped hand-off to make room for nothing is a net
loss. Kept; the cap is respected either way. Reversible — no ADR (autonomy
rule 5).
