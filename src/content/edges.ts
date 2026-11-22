// Connection edges between Concept Library sections (spec 074, coverage-map §C).
//
// An edge is a CLAIM, not a link: each direction carries the reason that trip is
// worth making, phrased for the page the player is standing on. §C.0 — "an
// unreachable neighbor is a coverage hole, not a hand-off" — is why this file
// exists centrally rather than as an id array per section: one source of truth,
// reciprocity for free, and a graph the schema tests can check.
//
// Authoring rule for fill-out specs (content-pipeline §7): a briefing ships its
// outbound edges, BOTH directions phrased, in the same change as its blocks and
// its deck. A direction you cannot justify means the edge should be one-way —
// omit `whyBack` rather than writing filler.

export type EdgeKind = 'needs' | 'trades-against' | 'composes-with' | 'breaks-without'

export interface Edge {
  a: string
  b: string
  kind: EdgeKind
  /** why a player on `a` should make the trip to `b` */
  why: string
  /** why a player on `b` should make the trip to `a`; omit for a one-way edge */
  whyBack?: string
}

export const EDGE_KIND_LABEL: Record<EdgeKind, string> = {
  needs: 'needs',
  'trades-against': 'trades against',
  'composes-with': 'composes with',
  'breaks-without': 'breaks without',
}

export const EDGES: Edge[] = [
  /* ---------- networking: the four neighbors spec 069 Appendix A committed ---------- */
  {
    a: 'networking',
    b: 'cdn',
    kind: 'needs',
    why: 'No amount of clever engineering beats the speed of light. Moving bytes physically closer to the user at the edge is the only way past that floor.',
    whyBack: 'Putting content at the edge only pays off once you see what it cuts out: the round trip, the handshakes stacked on top of it, and which trips a nearby cache actually removes.',
  },
  {
    a: 'networking',
    b: 'load-balancer',
    kind: 'composes-with',
    why: 'A load balancer can live at more than one layer of the stack, and the layer you pick decides both what traffic details it can read and which connections it can keep alive.',
    whyBack: 'Choosing between L4 and L7 is a protocol decision, not a vendor preference. A balancer inherits the capabilities and guarantees of the layer where it terminates traffic.',
  },
  {
    a: 'networking',
    b: 'api-design',
    kind: 'needs',
    why: 'HTTP is where transport mechanics turn into an application contract. Methods, status codes, and headers all ride straight on top of the connection you just paid to open.',
    whyBack: 'Every endpoint choice gets billed in network round trips, which makes API shape a transport decision dressed up in application clothes.',
  },
  {
    a: 'networking',
    b: 'realtime-updates',
    kind: 'needs',
    why: 'Push protocols pick up right where raw transport leaves off. SSE, WebSocket, and WebRTC are three different bargains struck with the underlying connection.',
    whyBack: 'Picking a realtime protocol means picking a transport underneath it, so handshake overhead and head-of-line behavior down at the network layer end up making the call.',
  },

  /* ---------- concepts ---------- */
  {
    a: 'api-design',
    b: 'data-modeling',
    kind: 'composes-with',
    why: 'The resources in your API and the tables storing them are two views of the same domain model. Let them drift too far apart and every request turns into awkward glue code.',
    whyBack: 'A schema only pays off when it matches real queries, and the API surface is where your system declares those queries in public.',
  },
  {
    a: 'api-design',
    b: 'api-gateway',
    kind: 'composes-with',
    why: 'Auth, rate limits, and versioning belong to the API as a whole rather than to every backend service. Putting them at the front door saves every team from rebuilding them.',
    whyBack: 'A gateway can only enforce rules that the API contract spells out cleanly. Leave the contract blurry, and the gateway fills up with brittle one-off exceptions.',
  },
  {
    a: 'data-modeling',
    b: 'indexing',
    kind: 'composes-with',
    why: 'Normalization sets how many tables a read has to visit, while indexing sets the price of each visit. You need both halves to predict how fast a query will run.',
    whyBack: 'Indexes cannot bail out data stored in the wrong shape forever. Past a certain point, the real fix is changing the schema, not bolting on another tree.',
  },
  {
    a: 'data-modeling',
    b: 'relational-db',
    kind: 'composes-with',
    why: 'Normalizing a schema stays practical because the database gives you joins, constraints, and transactions. Every clean model spends those engine features under the hood.',
    whyBack: 'Relational engines hand you joins, constraints, and transactions as building blocks; data modeling is where you decide how heavily to lean on them.',
  },
  {
    a: 'data-modeling',
    b: 'nosql-db',
    kind: 'needs',
    why: 'NoSQL stores flip the usual order: you start from the queries you need to serve and let the schema fall out of them. That works smoothly when you know the queries up front, and hurts when you do not.',
    whyBack: 'Here, the access pattern is the schema. Data modeling is not optional background reading for NoSQL, it is the design step you cannot postpone.',
  },
  {
    a: 'indexing',
    b: 'relational-db',
    kind: 'composes-with',
    why: 'Creating an index does not force the database to use it. The query planner makes that call from table statistics, not from what you hoped would happen.',
    whyBack: 'Every fast read number a relational database quotes assumes the right index is in place. Drop that index, and the same query collapses into a scan.',
  },
  {
    a: 'caching',
    b: 'distributed-caches',
    kind: 'composes-with',
    why: 'Hit rate looks tidy on a whiteboard. Running a real cache cluster is where key placement, eviction pressure, and a dead node turn that theory into an operational number.',
    whyBack: 'Every knob on a cache cluster, from memory size to TTL to eviction policy, exists to move one percentage: the hit rate that keeps your database calm instead of on fire.',
  },
  {
    a: 'caching',
    b: 'scaling-reads',
    kind: 'composes-with',
    why: 'Caching is just one rung on the read-scaling ladder. Knowing which cheaper rungs sit below it keeps you from reaching for a cache first.',
    whyBack: 'Caching sits at the top of the read-scaling ladder on purpose. It buys the highest throughput ceiling, and it brings the most operational failure modes along with it.',
  },
  {
    a: 'sharding',
    b: 'consistent-hashing',
    kind: 'needs',
    why: 'Splitting data across machines is easy right up until you change how many machines you have. Consistent hashing puts a tight bound on how much data moves when the split changes.',
    whyBack: 'A hash ring can feel abstract on its own until you meet the job it was built for: growing a partitioned store without re-homing nearly every key at once.',
  },
  {
    a: 'sharding',
    b: 'scaling-writes',
    kind: 'composes-with',
    why: 'You reach for sharding when write traffic finally outgrows a single primary. The write-scaling ladder gives the context for when that moment arrives.',
    whyBack: 'Most write-scaling tricks just buy breathing room. Sharding is the move that genuinely raises the ceiling, and it is also the most expensive one to undo.',
  },
  {
    a: 'consistent-hashing',
    b: 'distributed-caches',
    kind: 'composes-with',
    why: 'A distributed cache is where the hash ring earns its keep. Resizing the fleet without triggering a total miss storm is the whole problem the technique exists to solve.',
    whyBack: 'Adding a node to a live cache stays safe because only a small slice of keys re-homes, and that stability comes from the ring rather than from the cache itself.',
  },
  {
    a: 'cap',
    b: 'relational-db',
    kind: 'trades-against',
    why: 'A single primary puts the CP corner into concrete terms: you get one source of truth, and writes simply stop when that node is unreachable.',
    whyBack: 'A single relational node sidesteps network partitions, right until you add replication and failover and quietly inherit the partition question you were avoiding.',
  },
  {
    a: 'cap',
    b: 'distributed-locks',
    kind: 'needs',
    why: 'Distributed locks put the theorem at its sharpest edge. When the network splits, you either refuse to grant the lock or accept the risk of granting it twice.',
    whyBack: 'Quorums and fencing tokens are the real machinery behind choosing consistency. Without them, consistency stays just a word on a diagram.',
  },
  {
    a: 'relational-db',
    b: 'scaling-reads',
    kind: 'composes-with',
    why: 'Read replicas are the engine feature you spend when climbing the read-scaling ladder, and replication lag is the bill that arrives right behind them.',
    whyBack: 'Every rung on the read-scaling ladder tries to beat what a single primary can serve, so the ladder only makes sense once you know that starting baseline.',
  },
  {
    a: 'nosql-db',
    b: 'sharding',
    kind: 'needs',
    why: 'NoSQL stores automate partitioning, turning manual sharding decisions into configuration settings, though the mechanics underneath differ far more than the marketing suggests.',
    whyBack: 'A NoSQL partition key is just a shard key wearing a different name, so every lesson you learn about hot spots transfers straight over.',
  },

  /* ---------- indexing + search (spec 076, coverage-map §C.2) ----------
     §C.3 predicts both of these sections land at the six-edge cap; they do. */
  {
    a: 'indexing',
    b: 'nosql-db',
    kind: 'composes-with',
    why: "In wide-column stores, a log-structured engine is not a side index on one column, it is the whole table's storage format. That single choice shapes how they behave all the way down.",
    whyBack: 'Once you see how that storage format works, secondary-index limits in NoSQL stores stop looking arbitrary and start looking inevitable.',
  },
  {
    a: 'indexing',
    b: 'scaling-reads',
    kind: 'composes-with',
    why: 'Good indexes carry you far, but they still hit a ceiling. Once the right index already exists, replicas first and caches second are the next moves up the ladder.',
    whyBack: 'An index is the first and cheapest rung on the read-scaling ladder. Plenty of slow-read problems end right there, with zero extra systems to operate.',
  },
  {
    a: 'search-db',
    b: 'streams',
    kind: 'needs',
    why: 'Search indexes rarely take direct writes. They almost always trail a change stream from the primary store, which is why search results are eventually consistent.',
    whyBack: 'Keeping a derived search index fresh is the classic real-world job for a change stream, showing what an ordered mutation log is actually built for.',
  },
  {
    a: 'search-db',
    b: 'data-modeling',
    kind: 'trades-against',
    why: 'Deciding whether to nest related records inside one document or split them into separate indexes is the same normalization choice, trading read cost against write cost.',
    whyBack: 'The flattened document shape a search index wants is the clearest example of modeling around the query instead of around the entity.',
  },
  {
    a: 'search-db',
    b: 'contention',
    kind: 'composes-with',
    // one-way (§C.2): the return trip is not justifiable — the contention ladder
    // is about a single source of truth, which this system explicitly is not.
    why: 'Search engines resolve concurrent document updates with a version field. It is the same optimistic compare-and-set move, just in a store with no transactions to fall back on.',
  },
  {
    a: 'search-db',
    b: 'proximity',
    kind: 'composes-with',
    // one-way (§C.2): proximity already reaches indexing and sharding, and has
    // no reason to send a player back here for a field type.
    why: 'Search engines ship with geospatial field types built for production proximity search, each backed by its own distinct index structure.',
  },

  /* ---------- technologies ---------- */
  {
    a: 'blob-storage',
    b: 'large-blobs',
    kind: 'composes-with',
    why: 'Object storage is where the bytes belong; the large-blob pattern is the choreography that gets them there without dragging them through your app servers.',
    whyBack: 'Presigned URLs, multipart uploads, and range requests are all features of the object store itself. The pattern is simply knowing which one fits each step.',
  },
  {
    a: 'blob-storage',
    b: 'cdn',
    kind: 'composes-with',
    why: 'Stored objects are the classic payload worth caching at the edge, and most teams wire the object store straight to a CDN through configuration rather than code.',
    whyBack: 'Whenever an edge server misses its cache, it has to fetch from an origin, and for static bytes that origin is almost always blob storage.',
  },
  {
    a: 'search-db',
    b: 'indexing',
    kind: 'needs',
    why: 'An inverted index is just one member of a wider index family. Knowing what the other structures do well is how you spot when a search engine is the wrong reach.',
    whyBack: 'Text search is the one query shape standard tree indexes cannot serve well, so the inverted index is where indexing hands off cleanly instead of degrading.',
  },
  {
    a: 'search-db',
    b: 'relational-db',
    kind: 'trades-against',
    why: 'A dedicated search engine is almost never your source of truth. Your relational database usually holds that job, which means you own the work of keeping both in sync.',
    whyBack: 'Built-in relational text search covers more than most candidates expect. Knowing where it runs out of steam is what justifies operating a whole second system.',
  },
  {
    a: 'api-gateway',
    b: 'load-balancer',
    kind: 'composes-with',
    why: 'They sit right next to each other at the front of your stack while doing different jobs. Being able to draw a clean line between them is the whole point of learning both.',
    whyBack: 'A load balancer spreads traffic across identical boxes, while a gateway makes decisions about the request itself. Neither one can substitute for the other.',
  },
  {
    a: 'load-balancer',
    b: 'scaling-reads',
    kind: 'composes-with',
    why: 'Horizontal scaling only works if something spreads the traffic across your fleet, and the balancing algorithm decides how even that spread actually turns out.',
    whyBack: 'Adding more boxes is the first rung of horizontal read scaling, and the load balancer is the piece that puts every added box to work.',
  },
  {
    a: 'queues',
    b: 'long-running-tasks',
    kind: 'needs',
    why: 'The queue is the mechanism underneath; long-running tasks are the shape it unlocks: accept fast, do the work later, and tell the user how to check back.',
    whyBack: 'Every safeguard in this pattern, including retries, visibility timeouts, and dead letters, is a queue property you inherited rather than invented.',
  },
  {
    a: 'queues',
    b: 'streams',
    kind: 'trades-against',
    why: 'Reading a message deletes it from a queue, while reading from a stream simply moves a number forward. That single difference decides whether replay is possible at all.',
    whyBack: 'A retained log costs extra storage and consumer bookkeeping, a bill only worth paying when someone actually needs to read history twice.',
  },
  {
    a: 'streams',
    b: 'multi-step',
    kind: 'composes-with',
    why: 'Choreographed workflows sit directly on top of the log, so the stream ordering and delivery semantics become your workflow semantics.',
    whyBack: 'Ordering and replay can sound like abstract log properties until you build a multi-step workflow and suddenly lean on both.',
  },
  {
    a: 'distributed-locks',
    b: 'contention',
    kind: 'needs',
    why: 'A lock across machines sits on the last rung of the contention ladder, and it brings its own distributed failure modes along with it.',
    whyBack: 'Walking through the contention pattern tells you whether you even needed a distributed lock, and finding out you did not is usually the better answer.',
  },

  /* ---------- patterns ---------- */
  {
    a: 'realtime-updates',
    b: 'scaling-writes',
    kind: 'breaks-without',
    why: 'Celebrity fan-out turns one update into a write-amplification storm, and hierarchical aggregation is the answer that keeps it manageable.',
    whyBack: 'Hierarchical aggregation exists because millions of clients need one shared view at once, making it a delivery problem before it is a write problem.',
  },
  {
    a: 'realtime-updates',
    b: 'streams',
    kind: 'composes-with',
    why: 'Once an update happens, something has to reach the servers holding open connections. A log that the fan-out layer subscribes to is the usual bridge.',
    whyBack: 'Live connected clients are the most demanding consumer a log ever serves, because the latency budget is set by a human noticing.',
  },
  {
    a: 'long-running-tasks',
    b: 'multi-step',
    kind: 'composes-with',
    why: 'One background job is a task; several jobs that must all finish or all unwind together form a workflow, and that boundary is worth being able to name.',
    whyBack: 'Every step inside a workflow behaves like a long-running task, so the retry, timeout, and status machinery is shared across both.',
  },
  {
    a: 'contention',
    b: 'scaling-writes',
    kind: 'breaks-without',
    why: 'Serializing a hot resource puts a permanent cap on its throughput. It looks like a correctness decision, but it is a scaling decision in disguise.',
    whyBack: 'When one key runs too hot for a single shard, sharding cannot save you. Every request still lines up for the same row, making it a contention problem.',
  },
  {
    a: 'scaling-writes',
    b: 'queues',
    kind: 'composes-with',
    why: 'A queue absorbs sudden traffic bursts, and knowing its failure modes keeps a growing backlog from hiding a real capacity problem.',
    whyBack: 'A hot partition inside a message log is still a write-scaling problem, and you fix it with the same key-splitting moves.',
  },
  {
    a: 'large-blobs',
    b: 'long-running-tasks',
    kind: 'composes-with',
    why: 'Everything that happens after the bytes land, from transcoding to scanning to thumbnailing, is background work kicked off by the upload event.',
    whyBack: 'Upload completion is the starting gun for the whole async processing pipeline, linking the two patterns end to end.',
  },
  {
    a: 'multi-step',
    b: 'distributed-locks',
    kind: 'trades-against',
    why: 'A lock holds one resource still while you act; a saga lets several move forward and undoes them if the sequence fails. Picking the wrong one gets expensive either way.',
    whyBack: 'The moment an operation spans more than one source of truth, a lock stops being an option and a multi-step workflow takes over.',
  },
  {
    a: 'proximity',
    b: 'indexing',
    kind: 'needs',
    why: 'Every spatial approach either reduces to a standard tree lookup or builds a dedicated tree of its own. You cannot judge the tradeoff without knowing what an ordinary tree already does well.',
    whyBack: 'Two-dimensional queries break the one-dimensional order every other index assumes, and that mismatch is the entire reason spatial indexes exist.',
  },
  {
    a: 'proximity',
    b: 'sharding',
    kind: 'composes-with',
    why: 'Geography hands you a partition key that already exists, making regional sharding the rare split that actually matches how the data gets queried.',
    whyBack: 'Partitioning by region brings proximity down into the data layer instead of the query layer, and busy regions carry the same hot-shard risk.',
  },
]

/** Every edge touching `id`, resolved to the direction facing that section. */
export function edgesFor(id: string): { other: string; kind: EdgeKind; why: string }[] {
  const out: { other: string; kind: EdgeKind; why: string }[] = []
  for (const e of EDGES) {
    if (e.a === id) out.push({ other: e.b, kind: e.kind, why: e.why })
    else if (e.b === id && e.whyBack) out.push({ other: e.a, kind: e.kind, why: e.whyBack })
  }
  return out
}
