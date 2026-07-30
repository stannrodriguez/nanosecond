// Key Technologies shelf (11) — the parts you reach for, and the physics each
// one is buying you out of. Contract: docs/content-pipeline.md §7.

import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { C } from '../../theme'
import { Term as T } from '../../ui/Term'
import { Slidey, Toggler, Stepper } from '../../ui/viz'
import { InvertedIndexBuilder } from '../../ui/InvertedIndexBuilder'
import { SegmentMerge } from '../../ui/SegmentMerge'
import type { ManualSection } from './types'

const line = (label: string, val: ReactNode, col: string) => (
  <p style={{ margin: '4px 0' }}>
    <b style={{ color: col }}>{label}</b> {val}
  </p>
)

// In-prose § link to a sibling briefing (spec 076 hand-off blocks).
const Sec = ({ to, children }: { to: string; children: ReactNode }) => (
  <Link to={`/manual/briefings/${to}`} style={{ color: C.net }}>
    §&nbsp;{children}
  </Link>
)

/* ---------- search-db (spec 076, coverage-map F1): six viz-led blocks ----------
   Baseline: specs/076-indexing-search-briefings.md Appendix B.2. Block 1's parts
   double as the section's legacy body/viz/simplifies fields. */

const SRCH_WHY_BODY = (
  <>
    <p>
      A B-tree finds values by a <i>prefix</i>, so <span className="mono">LIKE '%latency%'</span> has nothing to seek on
      and becomes a full scan: every row read, every string tested, linear in the size of the table, with no ranking at
      the end of it. The first move is not a new system, though. Relational engines ship a real full-text index —
      stemming, ranking, the lot — and it covers far more than candidates expect. An indexed lookup there already costs
      a fraction of a millisecond, so "search is slow" is rarely an argument for new infrastructure by itself.
    </p>
    <p>
      What actually pushes you past the built-in is specific, and you should be able to name which one bit you: analysis
      in several languages, typo tolerance and fuzzy matching, relevance you need to <i>tune</i> rather than accept,
      faceting and aggregation across large result sets, or a search load heavy enough that it would compete with the
      source of truth's own traffic. The built-in is right up to the moment search stops being a query and starts being
      a feature. "We added a search box" is a query. "Results should rank, facet, forgive typos, and hold up under the
      read load of the entire product" is a feature — and features get their own system.
    </p>
    <p>
      The vocabulary comes with a warning attached. A <b>document</b> is a JSON record, an <b>index</b> is a collection
      of them, a <b>mapping</b> declares the fields and their types, a <b>field</b> is one of them. The warning is that{' '}
      <b>"index" is overloaded</b>: here it means the whole collection — closer to a table than to a lookup structure —
      and the thing playing the role of an index in the ordinary sense is built <i>inside</i> it, per field. Two field
      types carry most of the confusion: a <span className="mono">keyword</span> field is stored whole and matched
      exactly, a hash lookup; a <span className="mono">text</span> field is run through the{' '}
      <T k="analyzer">analysis pipeline</T> and matched by term. Choosing wrong is the classic first bug — an
      exact-match filter on an analyzed field, or a search over a keyword field that only ever matches the entire
      string.
    </p>
    <p style={{ color: C.dim }}>
      And mapping every field you might one day query is not free. Every mapped field carries into cluster state and
      memory, so a mapping that grew by accretion is one of the more common reasons a cluster is slow for no visible
      reason.
    </p>
  </>
)

const SRCH_WHY_VIZ = (
  <Toggler
    options={[
      { id: 'scan', label: "LIKE '%term%'", col: C.alert },
      { id: 'builtin', label: 'built-in full-text', col: C.compute },
      { id: 'engine', label: 'search engine', col: C.mem },
    ]}
    initial="scan"
  >
    {(id) =>
      id === 'scan' ? (
        <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
          {line('Mechanism:', 'read every row, test the substring. No prefix to seek on, so the index cannot help.', C.alert)}
          {line('Cost:', '10M docs → 10M rows examined, every time, and the result comes back unranked.', C.alert)}
          <p style={{ color: C.dim, margin: '4px 0' }}>Stops working at the first real corpus. Not a strategy — a placeholder.</p>
        </div>
      ) : id === 'builtin' ? (
        <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
          {line('Mechanism:', 'the same inverted index, inside the database you already run. Stemming and ranking included.', C.compute)}
          {line('Cost:', 'one system, one backup, one source of truth — and search competes with your write traffic for the same machine.', C.compute)}
          <p style={{ color: C.dim, margin: '4px 0' }}>
            Stops at multi-language analysis, typo tolerance, tunable relevance, and heavy faceting. Start here and say
            what would make you leave.
          </p>
        </div>
      ) : (
        <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
          {line('Mechanism:', 'a dedicated cluster of inverted indexes plus a columnar copy of each field, fed from your database.', C.mem)}
          {line('Cost:', 'a second source of data that is always slightly behind, plus a cluster to operate and a reindex plan.', C.mem)}
          <p style={{ color: C.dim, margin: '4px 0' }}>
            Buys ranking you control, aggregation at scale, and read load that never touches the primary. Justify it in
            one sentence before you draw the box.
          </p>
        </div>
      )
    }
  </Toggler>
)

const SRCH_WHY_SIMPLIFIES =
  'The built-in and the dedicated engine use the same underlying structure, so the boundary is about operations and scale rather than raw capability; the row counts are illustrative, and a relational engine with the right extension closes more of the gap than this toggle implies.'

const SRCH_INVERTED_BODY = (
  <>
    <p>
      There are exactly two ways to make a lookup fast: reorganize the data by the thing you look up, or leave the data
      alone and build a second structure organized that way. A row store is organized by row, and reorganizing an entire
      corpus by word is not on the table — so it is the second one. Build a map from every term to the sorted list of
      documents containing it, its <b>postings list</b>. A query for two words is then two lookups and an intersection
      of two sorted lists: linear in the number of matches, not in the size of the corpus. That is an{' '}
      <T k="invertedindex">inverted index</T>, and it is the index at the back of a book, built by a machine that read
      every page — which is also exactly why it costs what it costs. Somebody has to read every page, once, at write
      time.
    </p>
    <p>
      Nothing goes in raw. The <T k="analyzer">analysis pipeline</T> runs first: <b>tokenize</b> the text into terms,{' '}
      <b>normalize</b> them (lowercase, strip punctuation and accents), <b>drop stop words</b> — "the", "of", "a", high
      frequency and near-zero discriminating power — and <b>stem</b> what is left, so running, ran, and runs all become
      one term. The detail that makes it work is that the <i>same</i> pipeline runs over the query. That is the entire
      reason a search for "Running" finds a document that said "ran", and switching a stage off below breaks both sides
      at once.
    </p>
    <p style={{ color: C.dim }}>
      <T k="relevance">Relevance</T> is the default sort, and it is neither insertion order nor recency: it is a score
      per document — how often the term appears in it, damped by how common that term is across the whole corpus,
      normalized by document length so a long document cannot win on volume. A rare word carries the match; a common one
      barely moves it. One sentence is usually all the depth an interview wants, and knowing the scoring is there at all
      is what stops you accidentally building a second ranking on top of it.
    </p>
  </>
)

const SRCH_DOCVALUES_BODY = (
  <>
    <p>
      The inverted index runs term → documents. That is exactly backwards for sorting, faceting, and aggregating, all of
      which need document → value. So the engine stores each field a <i>second</i> time, column-wise on disk, as{' '}
      <T k="docvalues">doc values</T>: one contiguous column per field, in document order.
    </p>
    <p>
      Two layouts of one field, each pointed the direction it will be read from. It is also why the index on disk is
      bigger than the data you handed it — every searchable, sortable field is stored twice, and that duplication is the
      price of doing both jobs at once.
    </p>
    <p style={{ color: C.dim }}>
      A per-field column in document order is precisely how an analytics engine is laid out, which is the real reason a
      search engine can answer "average price per brand across these two million hits" without the query ever touching a
      source document.
    </p>
  </>
)

const SRCH_DOCVALUES_VIZ = (
  <Toggler
    options={[
      { id: 'inv', label: 'which docs contain "latency"?', col: C.mem },
      { id: 'dv', label: 'sort these hits by price', col: C.compute },
    ]}
    initial="inv"
  >
    {(id) =>
      id === 'inv' ? (
        <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
          {line('Reads:', 'the inverted index — term → [doc 3, doc 91, …]. One lookup, then a merge.', C.mem)}
          {line('From the other structure:', 'you would have to read every document’s field value and test it. That is the scan you came here to avoid.', C.alert)}
        </div>
      ) : (
        <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
          {line('Reads:', 'doc values — a price column in document order, so 2M hits sort by streaming one contiguous column.', C.compute)}
          {line('From the other structure:', 'the inverted index maps price values to documents, so answering "what is doc 91’s price?" means searching the whole term list backwards.', C.alert)}
        </div>
      )
    }
  </Toggler>
)

const SRCH_SEGMENTS_BODY = (
  <>
    <p>
      The index is a set of immutable <T k="segment">segments</T>. New documents buffer and land as a <i>new</i>{' '}
      segment; nothing already written is ever modified. A delete removes nothing — it records a{' '}
      <T k="tombstone">tombstone</T>, and the document keeps occupying space and keeps being read and filtered out. An
      update is a soft delete plus an insert. Only a merge, combining small segments into larger ones, actually drops
      the dead documents.
    </p>
    <p>
      <b>The consequence that decides whether the whole system fits: an update costs strictly more than an insert.</b>{' '}
      A catalogue of mostly-static documents, searched constantly, is the perfect workload. A set of documents whose
      fields change every few minutes is the worst one — you pay insert cost plus tombstone cost plus merge pressure,
      forever, for data a database would have updated in place.
    </p>
    <p>
      It is a stack of finished, bound books, not a whiteboard. Correcting a line means printing a fresh page and
      crossing out the old one, and the crossing-out stays there — costing you space and a sliver of read work on every
      query — until somebody reprints the volume.
    </p>
    <p style={{ color: C.dim }}>
      Immutability is a choice, not an accident, and it buys a great deal: readers never take a lock, because nothing
      they are reading can change; the page cache can hold segment files indefinitely, because files never change;
      compression is easy on write-once data; replication can ship whole files; a query gets a consistent
      point-in-time view for free; and crash recovery is trivial, because a half-written segment is simply discarded.
      Every one of those is a general lesson rather than a search-engine one — the same bargain drives the
      log-structured storage engine over on <Sec to="indexing">Database indexing</Sec>.
    </p>
  </>
)

const SRCH_QUERY_BODY = (
  <>
    <p>
      From the outside in: an index is split into <T k="shard">shards</T>, each shard is a self-contained index built
      from segments, and each shard has <T k="replica">replicas</T> that are full copies. Replicas multiply read
      throughput — every copy can serve a query — and do nothing at all for the latency of any single query. Nodes take
      roles: coordinating (receives the request, merges the results), data (holds shards), master-eligible (cluster
      state), plus ingest and machine-learning roles, and one node can hold several. The data itself is tiered by age —
      hot, warm, cold, frozen — onto progressively cheaper storage.
    </p>
    <p>
      A search runs in <b>two phases</b>, and this is the mechanism worth being able to draw. <b>Query:</b> the
      coordinator fans out to one copy of every shard, and each returns only document ids and scores for its own top-k —
      not documents. <b>Fetch:</b> the coordinator merges those lists, takes the global top-k, and asks only the shards
      owning those specific documents for their content. The ideal case never touches a source document at all, because
      everything the response needs is already sitting in doc values.
    </p>
    <p>
      It is the difference between asking ten libraries to post you their twenty best books and asking all ten to post
      you every book so you can pick twenty yourself.
    </p>
    <p>
      Which is also why clause order is worth an order of magnitude. A filter matching 0.1% of documents, applied first,
      leaves a thousand candidates for the expensive text scoring; applied last, that scoring runs across the whole
      corpus. What lets the engine choose well is the <T k="queryplanner">planner</T> and the statistics it already
      maintains — per-term document counts that say which clause is selective before anything runs.
    </p>
    <p style={{ color: C.dim }}>
      One cliff is worth naming out loud, because users find it for you. Offset pagination means <i>every</i> shard must
      return offset-plus-page-size documents so the coordinator can order them globally. Page 1,000 at ten per page
      across five shards is 50,000 documents merged in order to show ten — which is why the default refuses to go deeper
      than ten thousand. Raising the limit moves the cliff rather than removing it; the fix is a{' '}
      <T k="cursor">cursor</T> that remembers the last sort value instead of counting from the start, and the API shape
      of that choice lives on <Sec to="api-design">API design</Sec>.
    </p>
  </>
)

const SRCH_QUERY_VIZ = (
  <Toggler
    options={[
      { id: 'bad', label: 'score first, filter after', col: C.alert },
      { id: 'good', label: 'filter first, score after', col: C.mem },
    ]}
    initial="bad"
  >
    {(id) =>
      id === 'bad' ? (
        <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
          {line('Step 1:', 'score every document matching the text — 2,000,000 candidates, each one scored.', C.alert)}
          {line('Step 2:', 'throw away everything outside the last 24 hours — 1,998,000 of them.', C.alert)}
          <p style={{ color: C.dim, margin: '4px 0' }}>The expensive operation ran on the whole corpus to produce a two-thousand-row answer.</p>
        </div>
      ) : (
        <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
          {line('Step 1:', 'apply the date filter — a cheap term lookup, leaving 2,000 candidates.', C.mem)}
          {line('Step 2:', 'score those 2,000. Same answer, a thousandth of the work.', C.mem)}
          <p style={{ color: C.dim, margin: '4px 0' }}>
            The planner knows the date clause is selective because it keeps document counts per term. Statistics are
            what make the choice available.
          </p>
        </div>
      )
    }
  </Toggler>
)

const SRCH_NOT_BODY = (
  <>
    <p>
      The engine is almost never the source of truth, and saying so unprompted is worth more than any internals question
      you might answer. It is a derived read model: the database holds the truth, a change stream (
      <T k="cdc">change data capture</T>) carries every write across, and the index is built from that stream. Which
      makes it eventually consistent <i>by construction</i> — the lag is a design parameter you should be able to name,
      not a bug to apologize for.
    </p>
    <p>
      Four things to have ready. Say <i>how</i> it is kept in sync, because "we will write to both" is the wrong answer
      and the dual-write bug is what follows it. Say that mappings are effectively fixed once documents exist, so a real
      mapping change means building a new index and swapping an alias across — the reindex question is coming. Say how
      you sized the shard count, because it is fixed at creation and a target of tens of gigabytes per shard is what
      sets it. And justify the whole system over the built-in from block one, in one sentence, before you draw the box.
    </p>
    <p style={{ color: C.dim }}>
      From here: <Sec to="indexing">Database indexing</Sec> is the family this structure belongs to;{' '}
      <Sec to="relational-db">Relational databases</Sec> is where the truth stays and where the cheaper built-in lives;{' '}
      <Sec to="streams">Streams</Sec> is the change stream feeding this one;{' '}
      <Sec to="data-modeling">Data modeling</Sec> is where "nest the related records or index them separately" turns out
      to be the normalization question again; <Sec to="contention">Dealing with contention</Sec> is where the
      version-field trick this engine uses for concurrent updates is one rung of a longer ladder; and{' '}
      <Sec to="proximity">Proximity-based services</Sec> is where its geospatial field types become a real answer.
    </p>
  </>
)

export const TECHNOLOGIES_SECTIONS: ManualSection[] = [
  {
    id: 'relational-db',
    shelf: 'technologies',
    title: 'Relational databases',
    thesis: 'One primary holds the truth — so how do you scale reads off it?',
    body: (
      <>
        <p>
          A relational database (Postgres, MySQL) is the default source of truth: <T k="acid">ACID</T> transactions, a{' '}
          <T k="join">join</T> engine, and a <T k="wal">write-ahead log</T> that makes every commit <T k="durable">durable</T>.
          That fsync bounds one primary to ~8,000 <T k="write">writes</T>/s. You scale <T k="read">reads</T> by
          photocopying: each <T k="replica">read replica</T> streams the primary's changes and serves reads.
        </p>
        <p style={{ color: C.dim }}>
          Drag the replica count: reads scale linearly, writes stay flat (copies don't help writes). The fine print is{' '}
          <T k="replag">replication lag</T> — every replica read is a read of the recent past, and after the primary dies a{' '}
          <T k="failover">failover</T> stalls writes for seconds.
        </p>
        <p>
          The A, C and D in ACID are yours for free; the I is a dial. The{' '}
          <T k="isolationlevel">isolation level</T> decides which concurrency anomalies a transaction may see, and the
          default is read committed, not <T k="serializable">serializable</T> — so the guarantees your code assumes are
          usually still permitted unless you asked. Raising the level costs either lock contention or aborts the client
          must retry, which is why "we're ACID, so it's safe" is the sentence to stop saying.
        </p>
      </>
    ),
    viz: (
      <Slidey
        label="read replicas"
        min={0}
        max={8}
        step={1}
        init={2}
        accent={C.storage}
        fmt={(v) => `${v} replica${v === 1 ? '' : 's'}`}
        compute={(v) => {
          const readCap = 30_000 + v * 20_000
          return {
            headline: (
              <>
                ~{(readCap / 1000).toFixed(0)}k reads/s · ~8k writes/s
              </>
            ),
            caption:
              'Reads scale with replicas (+~20k QPS each). Writes stay pinned to the single primary — the only fixes there are sharding or a queue.',
            bars: [
              { label: 'read cap', frac: readCap / 200_000, col: C.mem, tag: `${(readCap / 1000).toFixed(0)}k` },
              { label: 'write cap', frac: 8_000 / 200_000, col: C.alert, tag: '8k' },
            ],
          }
        }}
      />
    ),
    simplifies:
      'Treats replicas as adding fixed read capacity with zero lag cost; real replicas lag under load, and cross-shard joins/transactions are the wall this omits.',
    related: { toys: ['replag'], terms: ['acid', 'join', 'wal', 'durable', 'replica', 'replag', 'failover', 'read', 'write'] },
    feltIn: { note: <>Push writes past a replica’s apply rate, then read your own comment.</>, to: '/lab/replag', cta: 'play REPLICATION LAG' },
  },
  {
    id: 'nosql-db',
    shelf: 'technologies',
    title: 'NoSQL databases',
    thesis: 'What do you give up to make writes and scale-out cheap?',
    body: (
      <>
        <p>
          <T k="nosql">NoSQL</T> is not one thing — it's a family that trades the relational <T k="join">join</T> and strict{' '}
          <T k="acid">ACID</T> for horizontal scale and a data model shaped to one access pattern. Pick your query below.
          The rule that unites them: you <T k="denormalization">denormalize</T> so every read is a single-key lookup, and you
          design the <T k="shard">partition key</T> before you write a line of code.
        </p>
        <p style={{ color: C.dim }}>
          The cost is generality. Cross-entity queries a SQL join would do for free become a <T k="gsi">secondary index</T>{' '}
          (more writes) or an app-side merge, and many stores default to eventual <T k="consistency">consistency</T>. Reach
          for NoSQL when the access pattern is known and the scale is real — not because relational "doesn't scale".
        </p>
      </>
    ),
    viz: (
      <Toggler
        options={[
          { id: 'kv', label: 'key → value', col: C.mem },
          { id: 'doc', label: 'document', col: C.net },
          { id: 'wide', label: 'wide-column', col: C.compute },
        ]}
        initial="kv"
      >
        {(id) => (
          <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
            {id === 'kv' && (
              <>
                {line('Redis, DynamoDB:', 'get/put by one key. O(1), no query engine.', C.mem)}
                <p style={{ color: C.dim, margin: '4px 0' }}>Best for sessions, counters, caches. Worst for "find all X where…".</p>
              </>
            )}
            {id === 'doc' && (
              <>
                {line('MongoDB:', 'store a whole nested JSON document per entity.', C.net)}
                <p style={{ color: C.dim, margin: '4px 0' }}>Best for self-contained aggregates (an order + its lines). Worst for data queried many ways.</p>
              </>
            )}
            {id === 'wide' && (
              <>
                {line('Cassandra:', 'rows keyed by (partition, clustering) for range scans within a key.', C.compute)}
                <p style={{ color: C.dim, margin: '4px 0' }}>Best for time-series and feeds. Worst when you don’t know the query up front.</p>
              </>
            )}
          </div>
        )}
      </Toggler>
    ),
    simplifies:
      'Collapses dozens of real engines into three archetypes; modern databases blur the lines (document stores add transactions, SQL adds JSON).',
    related: { toys: ['hotpartition'], terms: ['nosql', 'join', 'acid', 'denormalization', 'shard', 'gsi', 'consistency'] },
    feltIn: { note: <>Taste tests pit SQL against NoSQL under stated requirements.</>, to: '/review/taste', cta: 'try a Taste Test' },
  },
  {
    id: 'blob-storage',
    shelf: 'technologies',
    title: 'Blob storage',
    thesis: 'Where do the big bytes go, and why never in the database?',
    body: (
      <>
        <p>
          Object storage (S3, GCS) holds <T k="blob">blobs</T> — images, video, backups — at ~$0.02/GB/mo, cheaper than any
          block disk and effectively infinite. Putting a 4&nbsp;MB image in a database row instead bloats the
          <T k="btree">B-tree</T>, wrecks the cache, and costs ~4× more. Drag the volume below to feel the gap.
        </p>
        <p style={{ color: C.dim }}>
          The pattern: store the blob in object storage, store only its key in the database, and serve it through a{' '}
          <T k="cdn">CDN</T> so the bytes never round-trip your servers. Uploads use a <T k="presigned">presigned URL</T> so
          the client writes straight to storage. The number that bites is <b>egress</b> (~$0.09/GB out) — which is exactly
          why the CDN pays for itself.
        </p>
      </>
    ),
    viz: (
      <Slidey
        label="data stored"
        min={1}
        max={1000}
        step={1}
        init={100}
        accent={C.storage}
        fmt={(v) => `${v.toLocaleString()} TB`}
        compute={(v) => {
          const gb = v * 1000
          const blob = gb * 0.02
          const db = gb * 0.08 // block storage ~4×, replicated
          return {
            headline: (
              <>
                object ≈ ${blob.toLocaleString()}/mo · in-DB ≈ ${db.toLocaleString()}/mo
              </>
            ),
            caption:
              'Same bytes, ~4× the cost inside a replicated database — before you count the ruined cache hit rate and slower queries.',
            bars: [
              { label: 'object store', frac: blob / (db || 1), col: C.mem, tag: `$${blob.toLocaleString()}` },
              { label: 'in the DB', frac: 1, col: C.alert, tag: `$${db.toLocaleString()}` },
            ],
          }
        }}
      />
    ),
    simplifies:
      'Uses list storage prices only; ignores request charges, retrieval tiers (Glacier), and that egress — not storage — is usually the line item that hurts.',
    related: { toys: [], terms: ['blob', 'presigned', 'cdn', 'btree'] },
    feltIn: { note: <>Builder scenarios price storage and egress against a monthly budget.</>, to: '/builder', cta: 'open the Builder' },
  },
  {
    id: 'search-db',
    shelf: 'technologies',
    title: 'Search-optimized databases',
    thesis: 'What does a search engine do that an index on your database can’t?',
    body: SRCH_WHY_BODY,
    viz: SRCH_WHY_VIZ,
    simplifies: SRCH_WHY_SIMPLIFIES,
    blocks: [
      { heading: 'THE TREE CANNOT DO "CONTAINS"', body: SRCH_WHY_BODY, viz: SRCH_WHY_VIZ, simplifies: SRCH_WHY_SIMPLIFIES },
      {
        heading: 'THE INVERTED INDEX, DERIVED',
        body: SRCH_INVERTED_BODY,
        viz: <InvertedIndexBuilder accent={C.storage} />,
        simplifies:
          'A real analyzer chain is longer and language-specific, and the stemmer here is a lookup table rather than a rule engine. Scoring uses a tuned formula rather than raw counts, and a real corpus is millions of documents with postings lists compressed on disk.',
      },
      {
        heading: 'TWO LAYOUTS OF ONE FIELD',
        body: SRCH_DOCVALUES_BODY,
        viz: SRCH_DOCVALUES_VIZ,
        simplifies:
          'Doc values are not built for every field type, and can be turned off per field; the "stored twice" framing compresses several optional per-field structures into one idea.',
      },
      {
        heading: 'NOTHING IS EVER EDITED',
        body: SRCH_SEGMENTS_BODY,
        viz: <SegmentMerge accent={C.storage} />,
        simplifies:
          'Real engines run a continuous tiered merge policy across many segments, and a refresh interval decides when new documents become visible at all; the counters here move in discrete steps for legibility.',
      },
      {
        heading: 'THE QUERY IN TWO PHASES',
        body: SRCH_QUERY_BODY,
        viz: SRCH_QUERY_VIZ,
        simplifies:
          'Real planners weigh far more than clause order and the candidate counts are illustrative; the two-phase description also omits optimizations that skip the fetch phase entirely.',
      },
      { heading: 'WHAT IT IS NOT', body: SRCH_NOT_BODY },
    ],
    related: {
      toys: [],
      terms: ['invertedindex', 'analyzer', 'relevance', 'docvalues', 'segment', 'tombstone', 'queryplanner', 'cdc'],
    },
    feltIn: { note: <>Estimation drills translate "10M docs" into the reads a scan would cost.</>, to: '/drills/session', cta: 'run some drills' },
  },
  {
    id: 'api-gateway',
    shelf: 'technologies',
    title: 'API gateway',
    thesis: 'What belongs at the front door, before any service runs?',
    body: (
      <>
        <p>
          An <T k="apigateway">API gateway</T> is the single front door in front of many services. Scrub what it does per{' '}
          <T k="request">request</T>
          before your business logic sees it: terminate <T k="tls">TLS</T>, authenticate, <T k="ratelimit">rate-limit</T>,
          then route (and sometimes aggregate several backend calls into one response).
        </p>
        <p style={{ color: C.dim }}>
          Concentrating these cross-cutting concerns means every service doesn't re-implement auth and limiting — but the
          gateway becomes a critical path and a potential bottleneck, so it stays thin and often pairs a{' '}
          <T k="breaker">circuit breaker</T> and a <T k="bulkhead">bulkhead</T> per downstream, with a{' '}
          <T k="timeout">timeout</T> on every call. It is not a <T k="lb">load balancer</T>: the LB spreads load across
          identical boxes; the gateway makes policy decisions about the request itself.
        </p>
        <p>
          "Authenticate" in that scrub is three separate questions. WHO is calling is an <T k="apikey">API key</T> when the
          caller is an application — quota attaches to the key, so one noisy integration is throttled alone — and a{' '}
          <T k="jwt">JWT</T> when the caller is a user, signed so every downstream service verifies it locally instead of
          querying a session store. WHAT they may do is <T k="rbac">RBAC</T>: permissions on roles, roles on users, so the
          gateway gates the endpoint. Whether they own this particular record is not a gateway question at all — that
          check belongs to the service holding the row.
        </p>
      </>
    ),
    viz: (
      <Stepper
        accent={C.net}
        nodes={['client', 'gateway', 'auth', 'limiter', 'service']}
        steps={[
          { active: [0, 1], edge: [0, 1], cap: <>A request arrives. TLS terminates here, once, instead of at every service.</> },
          { active: [1, 2], edge: [1, 2], cap: <>Authenticate: verify the token. Anonymous or invalid requests die at the door.</> },
          { active: [1, 3], edge: [1, 3], cap: <>Rate-limit: over quota? Return a clean 429 before consuming any backend capacity.</> },
          { active: [1, 4], edge: [1, 4], cap: <>Route to the right service — or fan out to several and aggregate the reply.</> },
          { active: [4], cap: <>Only now does business logic run, on a request already authenticated and shaped.</> },
        ]}
      />
    ),
    simplifies:
      'Shows a linear happy path; real gateways also do request/response transformation, canary routing, and observability, and must be made highly available themselves.',
    related: { toys: [], terms: ['apigateway', 'request', 'tls', 'ratelimit', 'breaker', 'lb'] },
    feltIn: { note: <>On-Call runs hand you rate limiters and breakers as relics.</>, to: '/on-call', cta: 'start an On-Call run' },
  },
  {
    id: 'load-balancer',
    shelf: 'technologies',
    title: 'Load balancer',
    thesis: 'Why is 80% utilization the real 100%?',
    body: (
      <>
        <p>
          A <T k="lb">load balancer</T> spreads requests across interchangeable <T k="appserver">app servers</T> so any one
          can die unnoticed — and it's where you watch <T k="util">utilization</T>. Drag it: waiting time grows like
          1/(1−u), gentle at 50%, vertical past the ~80% knee. That knee is why every scaling rule fires at 70–80%, not
          100%.
        </p>
        <p style={{ color: C.dim }}>
          The same queue math governs the database <T k="connpool">connection pool</T> behind each app server — a small,
          shared set of connections that requests wait for. You're judged at the tail: <T k="p99">p99 latency</T>, not the
          average — 99 fast requests hide one 3-second disaster, and your heaviest users hit it daily. Say the promise out
          loud: "<T k="sla">p99 under 200 ms</T> at peak, steady-state near 70% for burst headroom." That sentence is half
          the interview.
        </p>
      </>
    ),
    viz: (
      <Slidey
        label="utilization"
        min={10}
        max={98}
        step={1}
        init={70}
        accent={C.compute}
        fmt={(v) => `${v}%`}
        compute={(v) => {
          const u = v / 100
          const wait = 1 / (1 - u) // relative queueing delay
          return {
            headline: (
              <>
                queue wait ≈ {wait.toFixed(1)}× the service time
              </>
            ),
            caption:
              v >= 80
                ? 'Past the knee: a small traffic bump now sends latency vertical. This is where systems fall over.'
                : v >= 65
                  ? 'The healthy cruising band — enough slack to absorb a clump of arrivals.'
                  : 'Comfortable, but you are paying for idle capacity. Cost is a graded skill too.',
            bars: [
              { label: 'utilization', frac: u, col: v >= 80 ? C.alert : C.compute, tag: `${v}%` },
              { label: 'wait (rel.)', frac: Math.min(wait / 20, 1), col: C.alert, tag: `${wait.toFixed(1)}×` },
            ],
          }
        }}
      />
    ),
    simplifies:
      'An M/M/1 caricature (one server, random arrivals); real fleets have many servers and admission control, but the knee only sharpens with retries.',
    related: { toys: ['queue', 'connpool'], terms: ['lb', 'appserver', 'util', 'p99', 'sla', 'backlog'] },
    feltIn: { note: <>Drag utilization and watch waiting — not throughput — explode.</>, to: '/lab/queue', cta: 'play THE QUEUE' },
  },
  {
    id: 'queues',
    shelf: 'technologies',
    title: 'Queues',
    thesis: 'How does a durable waiting line survive a worker crashing?',
    body: (
      <>
        <p>
          A <T k="queue">queue</T> (SQS, RabbitMQ) sits between "accept the write" and "process it": the app appends in ~1 ms
          and answers "got it", while <T k="worker">workers</T> drain the line at a pace the database survives. It absorbs a{' '}
          <T k="burst">burst</T> by buying time instead of capacity. Scrub one message's life below.
        </p>
        <p style={{ color: C.dim }}>
          The machinery is all crash insurance. A <T k="visibility">visibility timeout</T> hides a message while a worker
          holds it and resurrects it if the worker dies — so delivery is <T k="atleastonce">at-least-once</T> (true{' '}
          <T k="exactlyonce">exactly-once</T> is just at-least-once plus idempotency) and consumers must be{' '}
          <T k="idempotent">idempotent</T>. After N failures the message lands in a <T k="dlq">dead-letter queue</T>{' '}
          instead of clogging the line while a <T k="backlog">backlog</T> grows behind it.
        </p>
      </>
    ),
    viz: (
      <Stepper
        accent={C.compute}
        nodes={['producer', 'queue', 'worker', 'DB', 'DLQ']}
        steps={[
          { active: [0, 1], edge: [0, 1], cap: <>Producer appends the message and returns immediately. ~1 ms, no waiting on the DB.</> },
          { active: [1, 2], edge: [1, 2], cap: <>A worker receives it — the message is now hidden by a visibility timeout, not deleted.</> },
          { active: [2, 3], edge: [2, 3], cap: <>Worker writes to the DB and deletes the message. Done, exactly the happy path.</> },
          { active: [1, 2], edge: [1, 2], cap: <>But if the worker crashes, the timeout expires and the message reappears — at-least-once.</> },
          { active: [1, 4], edge: [1, 4], cap: <>After N failed attempts it moves to the DLQ: your forensic record, not a clogged line.</> },
        ]}
      />
    ),
    simplifies:
      'One queue, one worker; real systems tune visibility timeouts against processing time and run many competing consumers with ordering caveats.',
    related: { toys: ['backpressure'], terms: ['queue', 'worker', 'visibility', 'atleastonce', 'idempotent', 'dlq', 'backlog', 'burst'] },
    feltIn: { note: <>A fast producer, a slow consumer, and a buffer that has to choose.</>, to: '/lab/backpressure', cta: 'play BACKPRESSURE' },
  },
  {
    id: 'streams',
    shelf: 'technologies',
    title: 'Streams / event sourcing',
    thesis: 'What if the log of changes were the source of truth?',
    body: (
      <>
        <p>
          A queue deletes a message once it's consumed. A <T k="stream">stream</T> (Kafka) keeps an ordered, replayable log
          and lets many independent consumers read it at their own <T k="offset">offset</T> — one broker handles
          ~1,000,000 msgs/s because it only ever appends sequentially. Toggle the two below. Work is shared by a{' '}
          <T k="consumergroup">consumer group</T>, which gives each partition to exactly one member — so the partition
          count, not the consumer count, is your parallelism ceiling, and a second group reading the same topic gets its
          own full copy of the stream.
        </p>
        <p style={{ color: C.dim }}>
          <T k="eventsourcing">Event sourcing</T> takes this to its conclusion: store the events, not the current state, and
          derive every view by replaying them. The same <T k="cdc">change-data-capture</T> feed can fan a single write out to
          a search index, a cache, and a warehouse — one source of truth, many eventually-consistent projections. The cost:
          you now reason about a <T k="backlog">consumer backlog</T> and replay, not just rows.
        </p>
        <p>
          Computing anything over that log needs a boundary, because the log never ends: <T k="windowing">windowing</T>{' '}
          cuts it into tumbling, sliding, or session chunks so an aggregate can finish. Events arrive late and out of
          order, so "this window is closed" is a judgment — the <T k="watermark">watermark</T> is the processor asserting
          nothing older than T is still coming, trading completeness for latency. And because that running state is
          real, a <T k="checkpoint">checkpoint</T> snapshots it together with the input offsets, so a crashed job resumes
          and replays rather than starting the world over.
        </p>
      </>
    ),
    viz: (
      <Toggler
        options={[
          { id: 'queue', label: 'queue (consume + delete)', col: C.compute },
          { id: 'stream', label: 'stream (retained log)', col: C.net },
        ]}
        initial="queue"
      >
        {(id) =>
          id === 'queue' ? (
            <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
              {line('Queue:', 'one consumer group; a message is gone once acked. Great for work to be done once.', C.compute)}
              <p style={{ color: C.dim, margin: '4px 0' }}>Can’t replay, can’t add a second independent reader after the fact.</p>
            </div>
          ) : (
            <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
              {line('Stream:', 'the log is retained. New consumers can start from offset 0 and replay all of history.', C.net)}
              <p style={{ color: C.dim, margin: '4px 0' }}>Search, cache, and warehouse each read the same log at their own pace.</p>
            </div>
          )
        }
      </Toggler>
    ),
    simplifies:
      'Ignores retention limits, partition ordering (order holds only within a partition), and the operational weight of running Kafka.',
    related: { toys: ['disk'], terms: ['stream', 'eventsourcing', 'cdc', 'backlog'] },
    feltIn: { note: <>Estimation drills size a broker at a million sequential appends/s.</>, to: '/drills/session', cta: 'run some drills' },
  },
  {
    id: 'distributed-locks',
    shelf: 'technologies',
    title: 'Distributed locks',
    thesis: 'How do many machines agree only one holds the lock — safely?',
    body: (
      <>
        <p>
          When only one worker may act at a time (charge a card once, run one cron), you need a <T k="distlock">distributed
          lock</T>. It's a <T k="lease">lease</T>: hold it for a bounded time, renew to keep it, and it auto-expires if you
          crash so the system can't deadlock. Scrub the handoff below.
        </p>
        <p style={{ color: C.dim }}>
          The subtle killer is the paused holder: a GC pause or network blip lets your lease expire while you still <i>think</i>
          you own it. The fix is a <T k="fencingtoken">fencing token</T> — a monotonically increasing number the resource
          checks, rejecting the stale holder. Because a lock is agreement among machines, correct implementations lean on{' '}
          <T k="consensus">consensus</T> / a <T k="quorum">quorum</T> (etcd, ZooKeeper), not a single Redis key.
        </p>
        <p>
          How does the lock notice you died at all? By your silence. The lock is an{' '}
          <T k="ephemeral">ephemeral node</T> tied to your session, and the session lives only as long as your{' '}
          <T k="heartbeat">heartbeat</T> — so a crash releases the lock automatically, one session timeout later. That
          timeout is the whole failure-detection trade: short detects fast and buries healthy nodes, long is stable and
          leaves a corpse holding the lock. Peer-to-peer clusters make the same guess with{' '}
          <T k="gossip">gossip</T> instead of a coordinator, which is why membership there is a suspicion level rather
          than a fact.
        </p>
      </>
    ),
    viz: (
      <Stepper
        accent={C.storage}
        nodes={['node A', 'lock (lease)', 'node B', 'resource']}
        steps={[
          { active: [0, 1], edge: [0, 1], cap: <>Node A acquires the lease with fencing token #7 and starts working.</> },
          { active: [0], cap: <>Node A stalls — a long GC pause. It still believes it holds the lock.</> },
          { active: [1, 2], edge: [1, 2], cap: <>The lease expires; node B acquires it with token #8 and begins.</> },
          { active: [0, 3], edge: [0, 3], cap: <>Node A wakes and writes with token #7 — the resource rejects it: stale, less than #8.</> },
          { active: [2, 3], edge: [2, 3], cap: <>Only node B (token #8) is allowed through. Fencing turned a race into a safe rejection.</> },
        ]}
      />
    ),
    simplifies:
      'Abstracts the consensus store behind "lock"; a correct lock also needs clock-skew tolerance and the resource itself must honor fencing tokens.',
    related: { toys: ['consensus'], terms: ['distlock', 'lease', 'consensus', 'quorum'] },
    feltIn: { note: <>Flaw puzzles hide missing fencing and double-processing bugs.</>, to: '/review/flaw', cta: 'find the flaw' },
  },
  {
    id: 'distributed-caches',
    shelf: 'technologies',
    title: 'Distributed caches',
    thesis: 'When one cache node dies, why don’t all your keys vanish?',
    body: (
      <>
        <p>
          One Redis node does ~100k ops/s and holds one machine's worth of RAM. To go bigger you spread keys across many
          nodes — and the mapping matters. Drag the node count: with <T k="consistenthash">consistent hashing</T>, losing or
          adding a node re-homes only ~1/N of the keys, so a scale event isn't a cache-wide <T k="stampede">stampede</T>.
        </p>
        <p style={{ color: C.dim }}>
          Distributing a <T k="cache">cache</T> reopens every caching question at scale: a hot key still pins one node
          (client-side replication of the hottest keys helps), and a node loss still drops its slice of the <T k="hitrate">hit
          rate</T> onto the database. More nodes buy capacity, not immunity.
        </p>
      </>
    ),
    viz: (
      <Slidey
        label="cache nodes"
        min={1}
        max={20}
        step={1}
        init={5}
        accent={C.mem}
        fmt={(v) => `${v} node${v === 1 ? '' : 's'}`}
        compute={(v) => {
          const cap = v * 100
          const movedPct = Math.round(100 / v)
          return {
            headline: (
              <>
                ~{cap}k ops/s · one node dies → ~{movedPct}% of keys re-home
              </>
            ),
            caption:
              'Capacity scales with nodes; consistent hashing keeps a node loss to ~1/N of keys instead of a full flush. That slice still lands on the DB until it re-warms.',
            bars: [
              { label: 'total ops/s', frac: cap / 2000, col: C.mem, tag: `${cap}k` },
              { label: 'keys moved', frac: movedPct / 100, col: C.alert, tag: `${movedPct}%` },
            ],
          }
        }}
      />
    ),
    simplifies:
      'Assumes even key distribution and per-node 100k ops/s; hot keys, big values, and network limits move the real numbers.',
    related: { toys: ['stampede', 'dram'], terms: ['cache', 'consistenthash', 'stampede', 'hitrate'] },
    feltIn: { note: <>The stampede toy shows what a cold cache does to the database.</>, to: '/lab/stampede', cta: 'play TTL & STAMPEDE' },
  },
  {
    id: 'cdn',
    shelf: 'technologies',
    title: 'CDN',
    thesis: 'Why is moving data 2,000 km closer the cheapest capacity there is?',
    body: (
      <>
        <p>
          Cross-region latency is physics: NY↔SF is ~70 ms round trip in fiber, and no engineering fixes the speed of light
          in glass. A <T k="cdn">CDN</T> caches your content in hundreds of cities so users hit an edge, not your origin.
          Toggle origin-only vs edge below.
        </p>
        <p style={{ color: C.dim }}>
          The edge terminates <T k="tls">TLS</T> nearby (cutting handshake round trips), absorbs most read traffic before it
          reaches your stack, and slashes <b>egress</b> — the ~$0.09/GB internet-bound tax that quietly dominates bandwidth
          bills. It only helps cacheable responses; personalized and <T k="write">write</T> traffic still travels to you.{' '}
          <T k="dns">DNS</T> is what steers a user to the nearest edge.
        </p>
        <p>
          What actually answers at that point of presence is an <T k="edgecache">edge cache</T>, and its win is geometric
          rather than clever: distance IS the latency, so a hit tens of kilometers away is single-digit milliseconds while
          the same request to your origin crosses a continent. It also absorbs the request completely — traffic served at
          the edge never touches your infrastructure, which is why this is usually the cheapest capacity you can buy, and
          why the design question is how much of a personalized page can be split into a cacheable shell.
        </p>
      </>
    ),
    viz: (
      <Toggler
        options={[
          { id: 'origin', label: 'origin only', col: C.alert },
          { id: 'edge', label: 'CDN edge', col: C.net },
        ]}
        initial="origin"
      >
        {(id) =>
          id === 'origin' ? (
            <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
              {line('Every request crosses the country:', '~70 ms RTT + a full TLS handshake, every time.', C.alert)}
              <p style={{ color: C.dim, margin: '4px 0' }}>Origin serves 100% of reads and pays egress on every byte. Distant users feel it most.</p>
            </div>
          ) : (
            <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
              {line('Edge answers nearby:', '~5–20 ms, TLS terminated locally, cache hit never touches origin.', C.net)}
              <p style={{ color: C.dim, margin: '4px 0' }}>A 90% edge hit rate means origin sees 10% of reads and 10% of the egress bill.</p>
            </div>
          )
        }
      </Toggler>
    ),
    simplifies:
      'Ignores cache invalidation (the hard part), origin-shield tiers, and that dynamic/personalized responses can’t be edge-cached without care.',
    related: { toys: ['light', 'pipe'], terms: ['cdn', 'tls', 'dns', 'write', 'hitrate'] },
    feltIn: { note: <>Watch how far light gets before a cross-region round trip ends.</>, to: '/lab/light', cta: 'play RACE LIGHT' },
  },
]
