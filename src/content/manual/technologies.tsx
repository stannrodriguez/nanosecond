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
      A B-tree locates values by their <i>prefix</i>, so <span className="mono">LIKE '%latency%'</span> gives it
      nothing to seek on. The database falls back to a full scan: every row read, every string inspected, linear in the
      size of the table, with zero ranking when it finishes. Even so, your first move is not a brand-new cluster.
      Relational databases already ship a real full-text index with stemming and ranking, and it carries far more weight
      than most candidates expect. An indexed lookup there takes a fraction of a millisecond, so "search is slow" rarely
      justifies extra infrastructure on its own.
    </p>
    <p>
      The reasons to outgrow the built-in are concrete, and you should be able to point to the exact one hurting you:
      multi-language text analysis, typo tolerance and fuzzy matching, relevance you need to <i>tune</i> rather than
      accept out of the box, faceting and aggregation over large result sets, or search traffic heavy enough to fight
      your source of truth for CPU and disk. Built-in full-text stays the right pick until search stops being a query
      and becomes a product feature. "We added a search box" is a query. "Results need custom ranking, facets, typo
      forgiveness, and room to handle the read load of the entire product" is a feature, and features earn their own
      system.
    </p>
    <p>
      The terminology deserves one quick heads-up. A <b>document</b> is a JSON record, an <b>index</b> is a collection
      of documents, a <b>mapping</b> declares the fields and their types, and a <b>field</b> is one property inside a
      document. The catch is that <b>"index" is overloaded</b>: here it names the whole collection, closer to a table
      than a lookup structure, while the actual lookup structures live <i>inside</i> it per field. Two field types cause
      most early bugs: a <span className="mono">keyword</span> field is stored whole for exact hash lookups, whereas a{' '}
      <span className="mono">text</span> field runs through the <T k="analyzer">analysis pipeline</T> and matches by
      term. Mix those up and you get the classic first failure: an exact-match filter running on analyzed text, or a
      search bar querying a keyword field that only matches if the user types the entire string verbatim.
    </p>
    <p style={{ color: C.dim }}>
      Mapping every field "just in case" is not free either. Every mapped field takes up cluster state and memory, so a
      mapping that grew by accretion is a surprisingly common reason a cluster slows down with no obvious culprit.
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
          {line('Mechanism:', 'read every row and test the substring. With no prefix to seek on, the B-tree sits idle.', C.alert)}
          {line('Cost:', '10M docs → 10M rows examined on every query, and the results still come back unranked.', C.alert)}
          <p style={{ color: C.dim, margin: '4px 0' }}>Falls over on the first real corpus. Not a strategy, just a placeholder.</p>
        </div>
      ) : id === 'builtin' ? (
        <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
          {line('Mechanism:', 'an inverted index living inside the database you already run, with stemming and ranking included.', C.compute)}
          {line('Cost:', 'one system, one backup, one source of truth, though search competes with writes for the same machine.', C.compute)}
          <p style={{ color: C.dim, margin: '4px 0' }}>
            Hits its limit at multi-language analysis, typo tolerance, tunable relevance, and heavy faceting. Start here
            and name what would make you graduate.
          </p>
        </div>
      ) : (
        <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
          {line('Mechanism:', 'a dedicated cluster of inverted indexes plus a columnar copy of each field, fed from your database.', C.mem)}
          {line('Cost:', 'a second copy of your data that always lags slightly behind, plus a cluster to operate and a reindex plan.', C.mem)}
          <p style={{ color: C.dim, margin: '4px 0' }}>
            Buys tunable ranking, aggregation at scale, and read capacity that never touches your primary. Earn the box
            in one sentence before drawing it.
          </p>
        </div>
      )
    }
  </Toggler>
)

const SRCH_WHY_SIMPLIFIES =
  'The built-in and dedicated engine share the same core data structure, so the real boundary is operations and scale rather than raw capability. The row counts are illustrative, and a relational engine with the right extension closes more of the gap than this toggle shows.'

const SRCH_INVERTED_BODY = (
  <>
    <p>
      There are only two ways to make a lookup fast: reorganize the data around the key you search by, or leave the
      records where they are and build a second structure organized that way. A row store is laid out by row, and
      reorganizing an entire corpus by word is out of the question, so we take door number two. We build a map from
      every term to the sorted list of documents containing it, called its <b>postings list</b>. Searching for two words
      becomes two lookups and an intersection of two sorted lists, scaling with the number of matches rather than the
      size of the corpus. That structure is an <T k="invertedindex">inverted index</T>. Think of the index at the back
      of a reference book, compiled by a machine that read every page up front. That explains both its speed and its
      price tag: someone has to read every page once at write time.
    </p>
    <p>
      Nothing enters that index raw. First comes the <T k="analyzer">analysis pipeline</T>: <b>tokenize</b> text into
      terms, <b>normalize</b> them (lowercase, strip punctuation and accents), <b>drop stop words</b> like "the", "of",
      and "a" that show up everywhere and narrow nothing down, and <b>stem</b> what remains so "running", "ran", and
      "runs" collapse into one shared term. The piece that makes the whole pipeline click is symmetry: the <i>exact same</i>{' '}
      stages run on the user's query. That is why searching for "Running" finds a document containing "ran", and why
      switching off a stage below breaks both sides together.
    </p>
    <p style={{ color: C.dim }}>
      <T k="relevance">Relevance</T> is the default sort order, not insertion order or recency. Each matching document
      earns a score based on how often the term appears inside it, damped by how common that term is across the entire
      corpus, and normalized by document length so a long document cannot win on sheer volume. A rare word drives the
      ranking while a common word barely nudges it. One clear sentence is usually all the depth an interview asks for,
      and knowing built-in scoring exists keeps you from accidentally bolting a second ranking layer on top.
    </p>
  </>
)

const SRCH_DOCVALUES_BODY = (
  <>
    <p>
      An inverted index answers term → documents. That direction is completely backwards for sorting, faceting, and
      aggregations, which all need document → value. To serve both without scanning every record, the engine stores each
      field a <i>second</i> time, column-wise on disk, as <T k="docvalues">doc values</T>: one contiguous column per
      field, ordered by document ID.
    </p>
    <p>
      You end up with two layouts of the same field, each pointing the direction its query reads from. That also
      explains why a search index on disk is often larger than the raw data you fed it. Every field that is both
      searchable and sortable gets stored twice, and that duplication is the honest price of doing both jobs fast.
    </p>
    <p style={{ color: C.dim }}>
      A contiguous per-field column in document order is the exact layout an analytics engine uses, which is why a
      search cluster can answer "average price per brand across these two million hits" without reading a single source
      document.
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
          {line('Reads:', 'the inverted index: term → [doc 3, doc 91, …]. One lookup, then a sorted merge.', C.mem)}
          {line('From the other structure:', 'you would have to read every document’s field value and check it. That is the full scan you came here to escape.', C.alert)}
        </div>
      ) : (
        <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
          {line('Reads:', 'doc values: a price column in document order, letting 2M hits sort by streaming one contiguous slice.', C.compute)}
          {line('From the other structure:', 'the inverted index maps price values back to documents, so asking "what is doc 91’s price?" means scanning the whole term dictionary backwards.', C.alert)}
        </div>
      )
    }
  </Toggler>
)

const SRCH_SEGMENTS_BODY = (
  <>
    <p>
      Underneath, a search index is a collection of immutable <T k="segment">segments</T>. Fresh documents buffer in
      memory and flush to disk as a <i>new</i> segment; nothing already written is ever modified in place. Deleting a
      document removes nothing right away. Instead, the engine writes a <T k="tombstone">tombstone</T>, so the deleted
      record keeps taking up disk space and keeps getting read and filtered out during queries. Updating a document is
      simply a soft delete paired with a new insert. Dead records finally disappear only when a background merge folds
      smaller segments into larger ones.
    </p>
    <p>
      <b>Here is the consequence that decides whether this engine fits your workload: an update costs strictly more than
      an insert.</b> A catalog of mostly static documents searched all day long is its dream job. A set of records whose
      fields mutate every few minutes is the worst fit imaginable, because you pay insert cost, tombstone overhead, and
      relentless merge pressure forever for data an ordinary database would have updated in place.
    </p>
    <p>
      Picture a stack of bound books instead of a whiteboard. Fixing one sentence means printing a brand-new page and
      crossing out the old one, and that crossed-out line stays on the shelf, costing storage and a tiny sliver of read
      work on every lookup, until somebody reprints the volume.
    </p>
    <p style={{ color: C.dim }}>
      Immutability is deliberate, and it pays handsomely: readers never wait on locks because nothing they read can
      change, the OS page cache can pin segment files indefinitely, write-once data compresses tightly, replication can
      ship whole files directly, every query gets a consistent point-in-time view for free, and crash recovery boils
      down to tossing any half-written segment. None of those wins are unique to search. The exact same bargain drives
      the log-structured storage engine over in <Sec to="indexing">Database indexing</Sec>.
    </p>
  </>
)

const SRCH_QUERY_BODY = (
  <>
    <p>
      Zooming out to the cluster: an index splits into <T k="shard">shards</T>, each shard is a self-contained index
      made of segments, and each shard can have <T k="replica">replicas</T> holding full copies. Replicas multiply read
      throughput because every copy can serve queries, yet they do nothing for the latency of a single query. Nodes take
      on roles (coordinating to receive requests and merge replies, data to hold shards, master-eligible for cluster
      state, plus ingest and machine-learning roles), and one machine can wear several hats. Older data rolls across
      tiers (hot, warm, cold, frozen) onto progressively cheaper storage.
    </p>
    <p>
      A search runs in <b>two phases</b>, and this is the flow worth knowing cold. <b>Query:</b> the coordinator fans
      out to one copy of every shard, and each shard sends back only the document IDs and scores for its local top-k,
      never the full documents. <b>Fetch:</b> the coordinator merges those ranked lists, picks the global top-k, and
      requests full document bodies only from the shards that own those winners. In the best case, the query never
      touches a source document at all because everything the response needs already lives in doc values.
    </p>
    <p>
      It is the difference between asking ten libraries to mail you a list of their twenty best titles and asking all
      ten to ship you their entire collection so you can pick twenty yourself.
    </p>
    <p>
      That same selectivity logic explains why clause order can swing latency by an order of magnitude. Apply a filter
      matching 0.1% of documents first and expensive text scoring runs on a thousand candidates; apply it last and
      scoring grinds through the entire corpus. The <T k="queryplanner">planner</T> makes that call using statistics it
      already maintains: per-term document counts that reveal which clause is selective before the heavy work starts.
    </p>
    <p style={{ color: C.dim }}>
      One cliff is worth naming before users stumble over it for you. Offset pagination forces <i>every</i> shard to
      return offset plus page size documents so the coordinator can sort them globally. Page 1,000 at ten results per
      page across five shards means merging 50,000 documents just to display ten, which is why the default caps depth at
      ten thousand. Bumping that cap only kicks the cliff down the road. The real fix is a <T k="cursor">cursor</T> that
      bookmarks the last sort value instead of counting from zero, and the API side of that tradeoff lives in{' '}
      <Sec to="api-design">API design</Sec>.
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
          {line('Step 1:', 'score every document matching the text: 2,000,000 candidates, every single one scored.', C.alert)}
          {line('Step 2:', 'discard everything outside the last 24 hours, throwing away 1,998,000 of them.', C.alert)}
          <p style={{ color: C.dim, margin: '4px 0' }}>The priciest step ran across the whole corpus just to return two thousand rows.</p>
        </div>
      ) : (
        <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
          {line('Step 1:', 'apply the date filter first: one cheap lookup leaves 2,000 candidates.', C.mem)}
          {line('Step 2:', 'score those 2,000. Identical answer for a thousandth of the work.', C.mem)}
          <p style={{ color: C.dim, margin: '4px 0' }}>
            The planner spots the selective date clause because it tracks document counts per term. Statistics are what
            make smart ordering possible.
          </p>
        </div>
      )
    }
  </Toggler>
)

const SRCH_NOT_BODY = (
  <>
    <p>
      A search engine is almost never your source of truth, and saying so before anyone asks carries more weight than
      reciting internals. It is a derived read model: your database holds the truth, a change stream (
      <T k="cdc">change data capture</T>) ships every write over, and the search index rebuilds its view from that
      stream. That makes it eventually consistent <i>by construction</i>, so replication lag is a design parameter you
      name up front rather than a bug you apologize for later.
    </p>
    <p>
      Keep four things ready whenever you put search on a whiteboard. Say <i>how</i> it stays in sync, because "our app
      will write to both" invites the classic dual-write split. Say that mappings are effectively locked once documents
      land, so a real mapping change requires building a fresh index and swapping an alias over (the reindex question is
      coming). Say how you sized the shard count, since it is fixed at creation and targeting tens of gigabytes per
      shard sets the number. Finally, justify adding a search cluster over your database's built-in full-text index in
      one clear sentence before you draw the box.
    </p>
    <p style={{ color: C.dim }}>
      Where this connects next: <Sec to="indexing">Database indexing</Sec> is the family this structure belongs to;{' '}
      <Sec to="relational-db">Relational databases</Sec> is where the source of truth stays and where the cheaper
      built-in lives; <Sec to="streams">Streams</Sec> carries the change feed keeping this index fresh;{' '}
      <Sec to="data-modeling">Data modeling</Sec> is where "nest related records or index them separately" turns back
      into the normalization tradeoff; <Sec to="contention">Dealing with contention</Sec> puts this engine's
      version-field check on a longer concurrency ladder; and <Sec to="proximity">Proximity-based services</Sec> is
      where its geospatial fields become a genuine option.
    </p>
  </>
)

export const TECHNOLOGIES_SECTIONS: ManualSection[] = [
  {
    id: 'relational-db',
    shelf: 'technologies',
    title: 'Relational databases',
    thesis: 'One primary holds the truth, so how do you scale reads off it?',
    body: (
      <>
        <p>
          A relational database (Postgres, MySQL) is the default source of truth: <T k="acid">ACID</T> transactions, a{' '}
          <T k="join">join</T> engine, and a <T k="wal">write-ahead log</T> that flushes every commit so it stays{' '}
          <T k="durable">durable</T>. That fsync caps one primary around ~8,000 <T k="write">writes</T>/s. To scale{' '}
          <T k="read">reads</T>, you photocopy the primary: each <T k="replica">read replica</T> tails the primary's
          change stream and takes read queries off its back.
        </p>
        <p style={{ color: C.dim }}>
          Drag the replica count below. Read capacity climbs in a straight line while writes stay pinned flat, because
          copies do not help writes. The catch is <T k="replag">replication lag</T>: every replica read
          looks slightly into the past, and if the primary crashes, <T k="failover">failover</T> pauses writes for
          seconds while a replica gets promoted.
        </p>
        <p>
          The A, C, and D in ACID come standard; the I is a dial you have to set. Your{' '}
          <T k="isolationlevel">isolation level</T> controls which concurrency anomalies a transaction can observe, and
          the default is read committed, not <T k="serializable">serializable</T>. That means subtle
          races your code assumes are impossible are often still allowed unless you asked for stricter isolation.
          Turning that dial up costs either lock contention or aborts your client must retry, which is why "we use ACID,
          so it is safe" is a sentence worth retiring.
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
              'Reads scale linearly with replicas (+~20k QPS each). Writes stay pinned to the lone primary; moving past that ceiling takes sharding or a queue.',
            bars: [
              { label: 'read cap', frac: readCap / 200_000, col: C.mem, tag: `${(readCap / 1000).toFixed(0)}k` },
              { label: 'write cap', frac: 8_000 / 200_000, col: C.alert, tag: '8k' },
            ],
          }
        }}
      />
    ),
    simplifies:
      'Assumes each replica adds fixed read capacity with zero lag penalty. Real replicas fall behind under heavy writes, and cross-shard joins or transactions are the wall this omits.',
    related: { toys: ['replag'], terms: ['acid', 'join', 'wal', 'durable', 'replica', 'replag', 'failover', 'read', 'write'] },
    feltIn: { note: <>Push writes faster than a replica can apply them, then try reading your own comment.</>, to: '/lab/replag', cta: 'play REPLICATION LAG' },
  },
  {
    id: 'nosql-db',
    shelf: 'technologies',
    title: 'NoSQL databases',
    thesis: 'What do you give up to make writes and scale-out cheap?',
    body: (
      <>
        <p>
          <T k="nosql">NoSQL</T> is not one database. It is a family of engines that trade away relational{' '}
          <T k="join">joins</T> and strict <T k="acid">ACID</T> guarantees for clean horizontal scale and a layout
          shaped around one known access pattern. Toggle the query shapes below. The rule tying them together is simple:
          you <T k="denormalization">denormalize</T> so every read hits a single key, and you pick your{' '}
          <T k="shard">partition key</T> before writing line one of application code.
        </p>
        <p style={{ color: C.dim }}>
          What you surrender is flexibility. Cross-entity questions a SQL join answers effortlessly turn into a{' '}
          <T k="gsi">secondary index</T> (extra write amplification) or an application-side merge, and many stores
          default to eventual <T k="consistency">consistency</T>. Reach for NoSQL when the access pattern is settled and
          the scale demands it, never because relational "does not scale".
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
                {line('Redis, DynamoDB:', 'get and put by a single key. O(1) lookup, no general query engine.', C.mem)}
                <p style={{ color: C.dim, margin: '4px 0' }}>Shines for sessions, counters, and caches. Painful for "find every X where…".</p>
              </>
            )}
            {id === 'doc' && (
              <>
                {line('MongoDB:', 'store one nested JSON document per aggregate entity.', C.net)}
                <p style={{ color: C.dim, margin: '4px 0' }}>Shines for self-contained aggregates (an order plus its line items). Awkward when the same data gets sliced many ways.</p>
              </>
            )}
            {id === 'wide' && (
              <>
                {line('Cassandra:', 'rows keyed by (partition, clustering) for fast range scans inside one partition.', C.compute)}
                <p style={{ color: C.dim, margin: '4px 0' }}>Shines for time-series and activity feeds. Unforgiving when you do not know the query up front.</p>
              </>
            )}
          </div>
        )}
      </Toggler>
    ),
    simplifies:
      'Groups dozens of distinct engines into three archetypes. Real databases blur these borders: document stores add transactions and SQL databases store JSON.',
    related: { toys: ['hotpartition'], terms: ['nosql', 'join', 'acid', 'denormalization', 'shard', 'gsi', 'consistency'] },
    feltIn: { note: <>Taste tests match SQL against NoSQL under stated requirements.</>, to: '/review/taste', cta: 'try a Taste Test' },
  },
  {
    id: 'blob-storage',
    shelf: 'technologies',
    title: 'Blob storage',
    thesis: 'Where do the big bytes go, and why never in the database?',
    body: (
      <>
        <p>
          Object storage (S3, GCS) holds <T k="blob">blobs</T> like images, video, and backups at ~$0.02/GB/mo, cheaper
          than block disks and practically bottomless. Stuffing a 4&nbsp;MB image inside a database row instead bloats
          your <T k="btree">B-tree</T>, evicts hot rows out of cache, and costs ~4× as much. Drag the storage slider
          below to see how fast that gap opens up.
        </p>
        <p style={{ color: C.dim }}>
          The clean pattern is universal: put the bytes in object storage, keep only the object key in your database,
          and serve downloads through a <T k="cdn">CDN</T> so heavy files never pass through your app servers. Uploads
          use a <T k="presigned">presigned URL</T> so clients stream straight to storage. Watch the bill for{' '}
          <b>egress</b> (~$0.09/GB out to the internet), because cutting that single line item is how a CDN pays for
          itself.
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
              'Same bytes, ~4× the bill inside a replicated database, even before counting the wrecked cache hit rate and slower queries.',
            bars: [
              { label: 'object store', frac: blob / (db || 1), col: C.mem, tag: `$${blob.toLocaleString()}` },
              { label: 'in the DB', frac: 1, col: C.alert, tag: `$${db.toLocaleString()}` },
            ],
          }
        }}
      />
    ),
    simplifies:
      'Uses list storage pricing only. Omits per-request fees, cold retrieval tiers like Glacier, and the fact that egress, not raw storage, is usually the bill that stings.',
    related: { toys: [], terms: ['blob', 'presigned', 'cdn', 'btree'] },
    feltIn: { note: <>Builder scenarios weigh storage and egress directly against a monthly budget.</>, to: '/builder', cta: 'open the Builder' },
  },
  {
    id: 'search-db',
    shelf: 'technologies',
    title: 'Search-optimized databases',
    thesis: 'What does a search engine do that an index on your database cannot?',
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
          'A real analyzer chain is longer and language-specific, and the stemmer here is a small lookup table rather than a full rule engine. Production scoring uses a tuned formula instead of raw counts, and real corpora compress postings lists across millions of documents on disk.',
      },
      {
        heading: 'TWO LAYOUTS OF ONE FIELD',
        body: SRCH_DOCVALUES_BODY,
        viz: SRCH_DOCVALUES_VIZ,
        simplifies:
          'Doc values are not generated for every field type and can be disabled per field. Saying a field is "stored twice" folds several optional per-field structures into one clear picture.',
      },
      {
        heading: 'NOTHING IS EVER EDITED',
        body: SRCH_SEGMENTS_BODY,
        viz: <SegmentMerge accent={C.storage} />,
        simplifies:
          'Production engines run a continuous tiered merge policy across many segments, and a refresh interval controls when newly indexed documents become visible. The counters here step cleanly for clarity.',
      },
      {
        heading: 'THE QUERY IN TWO PHASES',
        body: SRCH_QUERY_BODY,
        viz: SRCH_QUERY_VIZ,
        simplifies:
          'Real planners consider far more than clause order and the candidate counts are illustrative. This two-phase walkthrough also skips optimizations that avoid the fetch phase altogether.',
      },
      { heading: 'WHAT IT IS NOT', body: SRCH_NOT_BODY },
    ],
    related: {
      toys: [],
      terms: ['invertedindex', 'analyzer', 'relevance', 'docvalues', 'segment', 'tombstone', 'queryplanner', 'cdc'],
    },
    feltIn: { note: <>Estimation drills turn "10M docs" into the concrete read cost of a full scan.</>, to: '/drills/session', cta: 'run some drills' },
  },
  {
    id: 'api-gateway',
    shelf: 'technologies',
    title: 'API gateway',
    thesis: 'What belongs at the front door, before any service runs?',
    body: (
      <>
        <p>
          An <T k="apigateway">API gateway</T> is the single front door standing ahead of your services. Step through
          what happens to every <T k="request">request</T> before business logic ever runs: terminate{' '}
          <T k="tls">TLS</T>, authenticate the caller, enforce a <T k="ratelimit">rate limit</T>, and route the call
          (sometimes fanning out to several backends and stitching together one reply).
        </p>
        <p style={{ color: C.dim }}>
          Putting cross-cutting policy in one place saves every backend service from reinventing auth and throttling.
          The catch is that the gateway now sits on every critical path, so it has to stay thin and protect itself with
          a <T k="breaker">circuit breaker</T>, a <T k="bulkhead">bulkhead</T> per downstream service, and a strict{' '}
          <T k="timeout">timeout</T> on every outbound call. Do not confuse it with a <T k="lb">load balancer</T>: a load
          balancer spreads traffic across identical servers, while a gateway makes policy decisions about the request
          itself.
        </p>
        <p>
          "Authenticate" in that walkthrough actually splits into three distinct questions. WHO is calling uses an{' '}
          <T k="apikey">API key</T> for applications (so quota attaches to the key and one noisy integration gets
          throttled on its own) and a <T k="jwt">JWT</T> for end users, cryptographically signed so downstream services
          can verify it locally without hitting a session store. WHAT the caller is allowed to do is{' '}
          <T k="rbac">RBAC</T>: permissions attach to roles, roles attach to users, and the gateway gates the endpoint.
          Whether that user actually owns this specific record is not a gateway question at all; that check belongs in
          the service holding the row.
        </p>
      </>
    ),
    viz: (
      <Stepper
        accent={C.net}
        nodes={['client', 'gateway', 'auth', 'limiter', 'service']}
        steps={[
          { active: [0, 1], edge: [0, 1], cap: <>A request arrives. TLS terminates once at the door instead of at every backend service.</> },
          { active: [1, 2], edge: [1, 2], cap: <>Authenticate: verify the token. Missing or invalid credentials get stopped right here.</> },
          { active: [1, 3], edge: [1, 3], cap: <>Rate-limit: over quota? Return a clean 429 before spending any backend capacity.</> },
          { active: [1, 4], edge: [1, 4], cap: <>Route to the owning service, or fan out to several and assemble one reply.</> },
          { active: [4], cap: <>Only now does business logic run, on a request already authenticated and shaped.</> },
        ]}
      />
    ),
    simplifies:
      'Traces a linear happy path. Real gateways also transform requests and responses, steer canary traffic, emit telemetry, and need high availability of their own.',
    related: { toys: [], terms: ['apigateway', 'request', 'tls', 'ratelimit', 'breaker', 'lb'] },
    feltIn: { note: <>On-Call runs hand you rate limiters and circuit breakers as relics.</>, to: '/on-call', cta: 'start an On-Call run' },
  },
  {
    id: 'load-balancer',
    shelf: 'technologies',
    title: 'Load balancer',
    thesis: 'Why is 80% utilization the real 100%?',
    body: (
      <>
        <p>
          A <T k="lb">load balancer</T> spreads incoming traffic across interchangeable <T k="appserver">app servers</T>{' '}
          so any single machine can die without taking the product down, and it is also the dashboard where you watch{' '}
          <T k="util">utilization</T>. Drag the slider below: queue wait time grows like 1/(1−u), calm at 50% and nearly
          vertical past the ~80% knee. That knee is why autoscaling triggers around 70 to 80%, never at 100%.
        </p>
        <p style={{ color: C.dim }}>
          The exact same queue math rules the database <T k="connpool">connection pool</T> behind every app server,
          where requests line up for a small shared set of open connections. Users judge your service at the tail:{' '}
          <T k="p99">p99 latency</T>, not the mean. Ninety-nine snappy responses easily disguise one 3-second stall, and
          your most active users hit that 1-in-100 tail every day. Practice saying the target out loud: "
          <T k="sla">p99 under 200 ms</T> at peak, running steady-state near 70% for burst headroom." That single
          sentence settles half the sizing conversation.
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
                ? 'Past the knee: even a tiny traffic bump sends latency vertical. This is where services tip over.'
                : v >= 65
                  ? 'The healthy cruising band, with enough slack to absorb a tight clump of arrivals.'
                  : 'Plenty of breathing room, though you are paying for idle machines. Cost discipline counts too.',
            bars: [
              { label: 'utilization', frac: u, col: v >= 80 ? C.alert : C.compute, tag: `${v}%` },
              { label: 'wait (rel.)', frac: Math.min(wait / 20, 1), col: C.alert, tag: `${wait.toFixed(1)}×` },
            ],
          }
        }}
      />
    ),
    simplifies:
      'Models an M/M/1 queue (one server, random arrivals). Real fleets run many servers with admission control, though client retries only make the knee sharper.',
    related: { toys: ['queue', 'connpool'], terms: ['lb', 'appserver', 'util', 'p99', 'sla', 'backlog'] },
    feltIn: { note: <>Push utilization past the knee and watch wait time, not throughput, explode.</>, to: '/lab/queue', cta: 'play THE QUEUE' },
  },
  {
    id: 'queues',
    shelf: 'technologies',
    title: 'Queues',
    thesis: 'How does a durable waiting line survive a worker crashing?',
    body: (
      <>
        <p>
          A <T k="queue">queue</T> (SQS, RabbitMQ) decouples "accept the work" from "finish the work": your app appends
          a message in ~1 ms and replies "got it", while <T k="worker">workers</T> drain the line at a steady pace your
          database can survive. Instead of buying extra peak capacity, a queue absorbs a <T k="burst">burst</T> by
          buying time. Step through one message's lifecycle below.
        </p>
        <p style={{ color: C.dim }}>
          Almost every knob on a queue is crash insurance. A <T k="visibility">visibility timeout</T> hides a message
          while one worker processes it and returns it to the line if that worker dies before finishing. Because a
          crashed worker might have already completed half the work, delivery is <T k="atleastonce">at-least-once</T>{' '}
          (true <T k="exactlyonce">exactly-once</T> is really at-least-once plus idempotency), which means
          your consumers must be <T k="idempotent">idempotent</T>. After N failed tries, a poison message moves aside
          into a <T k="dlq">dead-letter queue</T> instead of blocking healthy traffic while a{' '}
          <T k="backlog">backlog</T> piles up behind it.
        </p>
      </>
    ),
    viz: (
      <Stepper
        accent={C.compute}
        nodes={['producer', 'queue', 'worker', 'DB', 'DLQ']}
        steps={[
          { active: [0, 1], edge: [0, 1], cap: <>Producer appends the message and returns right away in ~1 ms, never waiting on the DB.</> },
          { active: [1, 2], edge: [1, 2], cap: <>A worker claims it. A visibility timeout hides the message rather than deleting it.</> },
          { active: [2, 3], edge: [2, 3], cap: <>Worker writes to the DB and deletes the message. Clean finish on the happy path.</> },
          { active: [1, 2], edge: [1, 2], cap: <>If the worker crashes instead, the timeout expires and the message returns: at-least-once delivery.</> },
          { active: [1, 4], edge: [1, 4], cap: <>After N failed attempts, it lands in the DLQ: a forensic trail instead of a jammed line.</> },
        ]}
      />
    ),
    simplifies:
      'Shows one queue and one worker. Real deployments tune visibility timeouts against job duration and run many competing consumers, which complicates ordering.',
    related: { toys: ['backpressure'], terms: ['queue', 'worker', 'visibility', 'atleastonce', 'idempotent', 'dlq', 'backlog', 'burst'] },
    feltIn: { note: <>A fast producer, a slow consumer, and a bounded buffer forced to choose.</>, to: '/lab/backpressure', cta: 'play BACKPRESSURE' },
  },
  {
    id: 'streams',
    shelf: 'technologies',
    title: 'Streams / event sourcing',
    thesis: 'What if the log of changes were the source of truth?',
    body: (
      <>
        <p>
          A traditional queue deletes a message once a worker finishes it. A <T k="stream">stream</T> (Kafka) keeps an
          ordered, replayable log on disk and lets many independent readers walk through it at their own{' '}
          <T k="offset">offset</T>. Because a broker only ever appends sequentially, a single machine handles ~1,000,000
          msgs/s. Toggle the two models below. Inside one service, work is split across a{' '}
          <T k="consumergroup">consumer group</T> that assigns each partition to one member at a time, so your partition
          count (not your consumer count) caps parallelism, while a second consumer group reading the same topic sees
          its own complete copy of the stream.
        </p>
        <p style={{ color: C.dim }}>
          <T k="eventsourcing">Event sourcing</T> pushes that idea all the way: store the immutable events instead of
          mutable state, and derive every view by replaying them. In day-to-day systems, the same{' '}
          <T k="cdc">change-data-capture</T> stream fans one database write out to a search index, a cache, and an
          analytics warehouse: one source of truth feeding several eventually consistent projections. The new mental
          overhead is reasoning about <T k="backlog">consumer backlog</T> and replay instead of just rows in a table.
        </p>
        <p>
          Running aggregates over a stream that never ends requires artificial boundaries.{' '}
          <T k="windowing">Windowing</T> slices the log into tumbling, sliding, or session buckets so an aggregation can
          actually emit a result. Because real events arrive late and out of order, declaring a window finished is a
          judgment call: the <T k="watermark">watermark</T> is the processor's assertion that nothing older than time T
          is still in flight, trading completeness for lower latency. And since that in-flight state is valuable, a{' '}
          <T k="checkpoint">checkpoint</T> snapshots it alongside the current input offsets so a crashed job resumes and
          replays from the last save point instead of rebuilding the world from scratch.
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
              {line('Queue:', 'one consumer group, and the message vanishes once acknowledged. Ideal for work that should run once.', C.compute)}
              <p style={{ color: C.dim, margin: '4px 0' }}>Cannot replay past messages, and cannot attach a second independent reader later.</p>
            </div>
          ) : (
            <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
              {line('Stream:', 'the log stays put. New consumers can start at offset 0 and replay all retained history.', C.net)}
              <p style={{ color: C.dim, margin: '4px 0' }}>Search, cache, and warehouse each read the same log at whatever pace they can handle.</p>
            </div>
          )
        }
      </Toggler>
    ),
    simplifies:
      'Skips retention windows, per-partition ordering limits (global order does not exist across partitions), and the operational work of running Kafka.',
    related: { toys: ['disk'], terms: ['stream', 'eventsourcing', 'cdc', 'backlog'] },
    feltIn: { note: <>Estimation drills size a broker around a million sequential appends per second.</>, to: '/drills/session', cta: 'run some drills' },
  },
  {
    id: 'distributed-locks',
    shelf: 'technologies',
    title: 'Distributed locks',
    thesis: 'How do many machines agree that only one holds the lock safely?',
    body: (
      <>
        <p>
          When only one worker may act at a time (charging a card once, running a single scheduled job), you reach for a{' '}
          <T k="distlock">distributed lock</T>. Because any machine can crash mid-task, the lock is really a{' '}
          <T k="lease">lease</T>: you hold it for a bounded window, renew it while healthy, and let it expire
          automatically if you vanish so the whole system never deadlocks. Step through the handoff below.
        </p>
        <p style={{ color: C.dim }}>
          The sneaky bug is the paused holder. A long GC pause or network hiccup can freeze your process past lease
          expiry while you still <i>believe</i> you own the lock, letting two workers write at once. The real fix is a{' '}
          <T k="fencingtoken">fencing token</T>: a monotonically increasing number handed out with each lease that the
          downstream resource checks, rejecting any stale holder outright. Because mutual exclusion across machines is
          an agreement problem, dependable locks rest on <T k="consensus">consensus</T> and a{' '}
          <T k="quorum">quorum</T> (etcd, ZooKeeper), not a lone Redis key.
        </p>
        <p>
          How does the lock service know you crashed at all? By your silence. The lock lives as an{' '}
          <T k="ephemeral">ephemeral node</T> bound to your client session, and that session survives only as long as
          your <T k="heartbeat">heartbeat</T> keeps arriving, so a crash frees the lock automatically one session
          timeout later. That timeout is the entire failure-detection tradeoff: set it too short and brief pauses bury
          healthy workers; set it too long and a dead worker keeps blocking everyone else. Peer-to-peer clusters make
          the same bet with <T k="gossip">gossip</T> instead of a central coordinator, which is why cluster membership
          there is a suspicion score rather than a hard fact.
        </p>
      </>
    ),
    viz: (
      <Stepper
        accent={C.storage}
        nodes={['node A', 'lock (lease)', 'node B', 'resource']}
        steps={[
          { active: [0, 1], edge: [0, 1], cap: <>Node A acquires the lease with fencing token #7 and gets to work.</> },
          { active: [0], cap: <>Node A freezes in a long GC pause. It wakes up still convinced it holds the lock.</> },
          { active: [1, 2], edge: [1, 2], cap: <>Meanwhile the lease expires, and node B acquires a fresh lease with token #8.</> },
          { active: [0, 3], edge: [0, 3], cap: <>Node A tries to write with token #7. The resource rejects it because #7 is older than #8.</> },
          { active: [2, 3], edge: [2, 3], cap: <>Only node B (token #8) gets through. Fencing turned a silent race into a clean rejection.</> },
        ]}
      />
    ),
    simplifies:
      'Hides the consensus cluster behind a single "lock" box. Production locks also wrestle with clock skew, and fencing only works if the target resource actually enforces the token.',
    related: { toys: ['consensus'], terms: ['distlock', 'lease', 'consensus', 'quorum'] },
    feltIn: { note: <>Flaw puzzles hide missing fencing tokens and silent double-processing bugs.</>, to: '/review/flaw', cta: 'find the flaw' },
  },
  {
    id: 'distributed-caches',
    shelf: 'technologies',
    title: 'Distributed caches',
    thesis: 'When one cache node dies, why do all your keys not vanish?',
    body: (
      <>
        <p>
          A single Redis node handles ~100k ops/s and holds one machine's worth of RAM. To grow past either limit, you
          shard keys across a fleet of nodes, and the placement rule matters enormously. Drag the node count below: with{' '}
          <T k="consistenthash">consistent hashing</T>, losing or adding a node remaps only ~1/N of your keys, so a
          cluster resize or crash does not trigger a cache-wide <T k="stampede">stampede</T>.
        </p>
        <p style={{ color: C.dim }}>
          Spreading a <T k="cache">cache</T> across machines brings every classic caching headache along for the ride.
          One viral hot key still hammers a single node (client-side replication of the hottest keys helps), and losing
          one machine still drops its slice of the <T k="hitrate">hit rate</T> straight onto your database until the
          replacement warms up. More nodes buy headroom, not immunity.
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
              'Throughput scales with nodes, while consistent hashing limits a node failure to ~1/N of keys instead of flushing the whole cluster. That slice still hits the DB until it re-warms.',
            bars: [
              { label: 'total ops/s', frac: cap / 2000, col: C.mem, tag: `${cap}k` },
              { label: 'keys moved', frac: movedPct / 100, col: C.alert, tag: `${movedPct}%` },
            ],
          }
        }}
      />
    ),
    simplifies:
      'Assumes evenly distributed keys and a flat 100k ops/s per node. Hot keys, oversized values, and NIC bandwidth shift real-world numbers.',
    related: { toys: ['stampede', 'dram'], terms: ['cache', 'consistenthash', 'stampede', 'hitrate'] },
    feltIn: { note: <>The stampede toy shows what a cold cache does to your database.</>, to: '/lab/stampede', cta: 'play TTL & STAMPEDE' },
  },
  {
    id: 'cdn',
    shelf: 'technologies',
    title: 'CDN',
    thesis: 'Why is moving data 2,000 km closer the cheapest capacity you can buy?',
    body: (
      <>
        <p>
          Cross-region latency is pure physics: NY↔SF takes ~70 ms round trip in fiber, and no clever code makes light
          move faster through glass. A <T k="cdn">CDN</T> places copies of your content in hundreds of cities so users
          talk to a nearby edge instead of crossing the map to your origin. Compare origin-only against edge caching
          below.
        </p>
        <p style={{ color: C.dim }}>
          The edge terminates <T k="tls">TLS</T> close to the user (shaving off cross-country handshake round trips),
          absorbs the bulk of read traffic before it reaches your servers, and slashes <b>egress</b>, the ~$0.09/GB
          internet-bound tax that quietly dominates cloud bandwidth bills. It only caches cacheable responses, so
          personalized payloads and <T k="write">writes</T> still travel back to your origin. <T k="dns">DNS</T> is the
          piece steering each user toward the nearest edge.
        </p>
        <p>
          What actually serves the reply at that point of presence is an <T k="edgecache">edge cache</T>, and its win is
          geometric rather than clever: distance IS latency, so a hit tens of kilometers away returns in single-digit
          milliseconds while the exact same request to origin crosses a continent. Better still, every edge hit removes
          a request from your stack completely, making CDN caching some of the cheapest capacity in systems design and
          explaining why engineers work so hard to split personalized pages into a cacheable shell plus a tiny dynamic
          fetch.
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
              {line('Every request crosses the country:', '~70 ms RTT plus a full TLS handshake on every cold connection.', C.alert)}
              <p style={{ color: C.dim, margin: '4px 0' }}>Your origin serves 100% of reads and pays egress on every byte, with distant users paying the highest wait.</p>
            </div>
          ) : (
            <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
              {line('Edge answers nearby:', '~5 to 20 ms, TLS terminated locally, and cache hits never touch your origin.', C.net)}
              <p style={{ color: C.dim, margin: '4px 0' }}>A 90% edge hit rate leaves your origin handling just 10% of reads and 10% of the egress bill.</p>
            </div>
          )
        }
      </Toggler>
    ),
    simplifies:
      'Sets aside cache invalidation (the genuinely hard part), origin-shield tiers, and the extra care needed whenever responses are dynamic or personalized.',
    related: { toys: ['light', 'pipe'], terms: ['cdn', 'tls', 'dns', 'write', 'hitrate'] },
    feltIn: { note: <>Watch how little distance light covers before a cross-region round trip finishes.</>, to: '/lab/light', cta: 'play RACE LIGHT' },
  },
]
