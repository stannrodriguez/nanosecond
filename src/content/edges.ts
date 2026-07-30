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
    why: 'The speed-of-light floor is the one number here that no engineering removes, and the edge is the only answer to it — move the bytes closer, because you cannot move them faster.',
    whyBack: 'An edge only pays off if you know what it is shortening: the round trip, the handshakes stacked on top of it, and which of those a nearby cache actually removes.',
  },
  {
    a: 'networking',
    b: 'load-balancer',
    kind: 'composes-with',
    why: 'Every layer in the model is somewhere a balancer could sit, and which layer it picks decides what it can see and what it can keep alive.',
    whyBack: 'L4 versus L7 is not a product choice but a protocol one — the balancer inherits exactly the guarantees of the layer it terminates.',
  },
  {
    a: 'networking',
    b: 'api-design',
    kind: 'needs',
    why: 'HTTP is where the transport stops being abstract: methods, status codes, and headers are the contract layer sitting directly on the connection you just paid for.',
    whyBack: 'Every API decision is priced in round trips, so the shape of an endpoint is a transport decision wearing application clothes.',
  },
  {
    a: 'networking',
    b: 'realtime-updates',
    kind: 'needs',
    why: 'Push protocols are the transport chapter continued: SSE, WebSocket, and WebRTC are each a different bargain with the same connection.',
    whyBack: 'Choosing between them is choosing a transport, so the handshake costs and head-of-line behavior from the layer below are what actually decide it.',
  },

  /* ---------- concepts ---------- */
  {
    a: 'api-design',
    b: 'data-modeling',
    kind: 'composes-with',
    why: 'The resources an API exposes and the tables underneath them are the same modeling decision seen from two ends, and they drift apart at your peril.',
    whyBack: 'A schema is only as good as the queries it serves, and the API is where those queries are declared out loud.',
  },
  {
    a: 'api-design',
    b: 'api-gateway',
    kind: 'composes-with',
    why: 'Auth, rate limits, and versioning are API concerns that no service should implement twice — the front door is where they go instead.',
    whyBack: 'The gateway can only enforce policy the API contract makes explicit, so a vague contract produces a gateway full of special cases.',
  },
  {
    a: 'data-modeling',
    b: 'indexing',
    kind: 'composes-with',
    why: 'Normalizing decides how many tables a read must touch; indexing decides what each of those touches costs, and neither answer is complete alone.',
    whyBack: 'An index cannot rescue a model that stored the data in the wrong shape — at some point the fix is the schema, not another tree.',
  },
  {
    a: 'data-modeling',
    b: 'relational-db',
    kind: 'composes-with',
    why: 'Joins, constraints, and transactions are the features that make normalizing affordable, and they are the engine features you are actually spending.',
    whyBack: 'The engine gives you these tools; the modeling decision is how hard you intend to lean on them.',
  },
  {
    a: 'data-modeling',
    b: 'nosql-db',
    kind: 'needs',
    why: 'These stores invert the order: you design for the query first and the schema falls out of it, which is only a constraint if you did not know the queries.',
    whyBack: 'The access pattern IS the schema here, so the modeling chapter is not optional background — it is the design step you cannot postpone.',
  },
  {
    a: 'indexing',
    b: 'relational-db',
    kind: 'composes-with',
    why: 'The planner is what decides whether your index gets used at all, and it decides on statistics rather than on your intentions.',
    whyBack: 'Every read-throughput number the engine quotes assumes the right index exists; without it the same query is a scan.',
  },
  {
    a: 'caching',
    b: 'distributed-caches',
    kind: 'composes-with',
    why: 'Hit rate is the theory; a real cache cluster is where placement, eviction, and one node dying turn it into an operational number.',
    whyBack: 'Every knob on the cluster — size, TTL, eviction policy — is moving the one percentage that decides whether the database is bored or on fire.',
  },
  {
    a: 'caching',
    b: 'scaling-reads',
    kind: 'composes-with',
    why: 'A cache is one rung of the read-scaling ladder, and knowing which rungs come before it is what keeps you from reaching for it first.',
    whyBack: 'The ladder ends at caching for a reason: it is the step with the highest ceiling and the most operational failure modes.',
  },
  {
    a: 'sharding',
    b: 'consistent-hashing',
    kind: 'needs',
    why: 'Splitting data is easy until the split changes; consistent hashing is what bounds how much moves when it does.',
    whyBack: 'The ring is abstract until you see what it is for — a partitioned store that must grow without re-homing everything at once.',
  },
  {
    a: 'sharding',
    b: 'scaling-writes',
    kind: 'composes-with',
    why: 'Sharding is the move you make when writes outgrow one primary, so the write-scaling ladder is the context that says when.',
    whyBack: 'Every other write-scaling move buys time; this is the one that raises the ceiling, and it is the most expensive to undo.',
  },
  {
    a: 'consistent-hashing',
    b: 'distributed-caches',
    kind: 'composes-with',
    why: 'A cache cluster is where the ring earns its keep: resizing without a total miss storm is the whole reason the technique exists.',
    whyBack: 'Adding a node to a cache is only safe because of how keys re-home, which is a property of the ring rather than of the cache.',
  },
  {
    a: 'cap',
    b: 'relational-db',
    kind: 'trades-against',
    why: 'A single primary is the CP corner made concrete: one source of truth, and writes simply stop when it is unreachable.',
    whyBack: 'Replication and failover are where a relational deployment quietly acquires the partition question it was avoiding.',
  },
  {
    a: 'cap',
    b: 'distributed-locks',
    kind: 'needs',
    why: 'A lock is the theorem at its sharpest: during a partition you either refuse to grant it or risk granting it twice.',
    whyBack: 'Quorums and fencing tokens are the concrete machinery of choosing consistency, which is otherwise just a word on a diagram.',
  },
  {
    a: 'relational-db',
    b: 'scaling-reads',
    kind: 'composes-with',
    why: 'Read replicas are the engine feature the ladder spends, and replication lag is the bill that comes with them.',
    whyBack: 'The read numbers you are trying to beat come from one primary, so the ladder is meaningless without knowing where it starts.',
  },
  {
    a: 'nosql-db',
    b: 'sharding',
    kind: 'needs',
    why: 'These stores partition automatically, so the manual decisions here become configuration there — with the mechanisms differing more than the marketing suggests.',
    whyBack: 'The partition key is a shard key wearing a different name; every hot-spot lesson transfers directly.',
  },

  /* ---------- technologies ---------- */
  {
    a: 'blob-storage',
    b: 'large-blobs',
    kind: 'composes-with',
    why: 'The store is the destination; the pattern is the choreography that gets bytes there without touching your app servers.',
    whyBack: 'Presigned URLs, multipart uploads, and range requests are store features, and the pattern is just knowing which to use when.',
  },
  {
    a: 'blob-storage',
    b: 'cdn',
    kind: 'composes-with',
    why: 'Objects are the canonical thing worth caching at the edge, and the store is usually wired to the CDN by configuration rather than code.',
    whyBack: 'The edge has to fetch from somewhere on a miss, and for static bytes that origin is almost always the object store.',
  },
  {
    a: 'search-db',
    b: 'indexing',
    kind: 'needs',
    why: 'The inverted index is one entry in a family; understanding what the others are good at is what tells you when a search engine is the wrong reach.',
    whyBack: 'Text is the one query shape the tree cannot serve, so the inverted index is where indexing hands off rather than degrades.',
  },
  {
    a: 'search-db',
    b: 'relational-db',
    kind: 'trades-against',
    why: 'The dedicated engine is almost never the source of truth; the relational store usually still is, and the two must be kept in sync.',
    whyBack: 'Built-in text search covers more than candidates expect, and knowing exactly where it stops is what justifies adding a whole system.',
  },
  {
    a: 'api-gateway',
    b: 'load-balancer',
    kind: 'composes-with',
    why: 'They sit in the same place and do different jobs, and being able to say which is which is the whole point of learning both.',
    whyBack: 'The balancer spreads load across identical boxes; the gateway makes decisions about the request itself, and one cannot substitute for the other.',
  },
  {
    a: 'load-balancer',
    b: 'scaling-reads',
    kind: 'composes-with',
    why: 'Horizontal scaling only works if something spreads the traffic, and the balancing algorithm decides how evenly that actually happens.',
    whyBack: 'Adding boxes is the first rung of the ladder, and the balancer is the piece that makes an added box do anything.',
  },
  {
    a: 'queues',
    b: 'long-running-tasks',
    kind: 'needs',
    why: 'A queue is the mechanism; the pattern is the shape it enables — accept fast, work later, and tell the user how to find out.',
    whyBack: 'Every property of the pattern — retries, visibility timeouts, dead letters — is a queue property you inherited rather than chose.',
  },
  {
    a: 'queues',
    b: 'streams',
    kind: 'trades-against',
    why: 'Consuming deletes in one and moves a number in the other, and that single difference decides whether replay is possible at all.',
    whyBack: 'A retained log costs storage and consumer bookkeeping, which is worth it only when someone actually needs to read history twice.',
  },
  {
    a: 'streams',
    b: 'multi-step',
    kind: 'composes-with',
    why: 'Choreographed workflows are built directly on the log, so its ordering and delivery semantics ARE the workflow semantics.',
    whyBack: 'A workflow is the clearest reason to want ordering and replay, which is otherwise an abstract property of a log.',
  },
  {
    a: 'distributed-locks',
    b: 'contention',
    kind: 'needs',
    why: 'A lock across machines is the last rung of the contention ladder, and it is the one that brings its own failure modes with it.',
    whyBack: 'The contention pattern is what tells you whether you needed a distributed lock at all, which is usually the more valuable answer.',
  },

  /* ---------- patterns ---------- */
  {
    a: 'realtime-updates',
    b: 'scaling-writes',
    kind: 'breaks-without',
    why: 'The celebrity fan-out problem is a write-amplification problem; hierarchical aggregation is its answer.',
    whyBack: 'Hierarchical aggregation exists because millions of clients need one shared view, which is a delivery problem before it is a write problem.',
  },
  {
    a: 'realtime-updates',
    b: 'streams',
    kind: 'composes-with',
    why: 'Something has to reach the servers holding the connections, and a log the fan-out layer subscribes to is the usual answer.',
    whyBack: 'Delivering to connected clients is the most demanding consumer a log gets, because the latency budget is a human noticing.',
  },
  {
    a: 'long-running-tasks',
    b: 'multi-step',
    kind: 'composes-with',
    why: 'One background job is a task; several that must all succeed or all be undone is a workflow, and the boundary is worth being able to name.',
    whyBack: 'Every step of a workflow is itself a long-running task, so the retry, timeout, and status machinery is shared.',
  },
  {
    a: 'contention',
    b: 'scaling-writes',
    kind: 'breaks-without',
    why: 'Serializing a hot resource caps its throughput permanently, which is a scaling decision disguised as a correctness one.',
    whyBack: 'A key too hot for one shard is a contention problem that sharding cannot solve, because every request wants the same row.',
  },
  {
    a: 'scaling-writes',
    b: 'queues',
    kind: 'composes-with',
    why: 'The queue is the burst absorber, and knowing its failure mode is what keeps it from masking a real capacity problem.',
    whyBack: 'A hot partition is a write-scaling problem that happens to live in the log; the remediations are the same key-splitting moves.',
  },
  {
    a: 'large-blobs',
    b: 'long-running-tasks',
    kind: 'composes-with',
    why: 'Everything after the bytes land — transcoding, scanning, thumbnailing — is background work, and the upload event is what starts it.',
    whyBack: 'Upload completion is the trigger for the whole async processing pipeline, so the two patterns compose end to end.',
  },
  {
    a: 'multi-step',
    b: 'distributed-locks',
    kind: 'trades-against',
    why: 'A lock holds one resource still; a saga lets several move and undoes them if the sequence fails, and picking wrong is expensive both ways.',
    whyBack: 'The moment an operation spans more than one source of truth, a lock stops being available and a workflow takes over.',
  },
  {
    a: 'proximity',
    b: 'indexing',
    kind: 'needs',
    why: 'Every spatial approach either reduces to a tree lookup or builds its own; you cannot judge which without knowing what the tree already does well.',
    whyBack: 'Two-dimensional queries break the one-dimensional assumption every other index makes, and that break is the entire reason spatial indexes exist.',
  },
  {
    a: 'proximity',
    b: 'sharding',
    kind: 'composes-with',
    why: 'Geography is a partition key that already exists, which makes regional sharding the rare split that matches how the data is queried.',
    whyBack: 'Partitioning by region is proximity applied to the data layer rather than the query layer, and the hot-shard risk is the same.',
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
