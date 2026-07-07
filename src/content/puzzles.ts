// Find-the-Flaw puzzles (docs/content-pipeline.md §3). Seeded from studied
// designs (job scheduler, URL shortener, rate limiter, social feed, failover).
// Spec 050 grows this to 12 along the ladder single-obvious → single-subtle →
// two interacting → "actually fine".

export interface PuzzleBar {
  label: string
  u: number
  col?: string
  txt?: string
}

export interface PuzzleFrame {
  cap: string
  bars: PuzzleBar[]
}

export interface PuzzleNode {
  id: string
  x: number
  y: number
  label: string
  sub?: string
  chip?: boolean
}

// The difficulty ladder (product-spec §3.5). Shown as a rung label in the
// post-solve reveal — never before, so "fine" and "interacting" stay traps.
export type PuzzleTier = 'obvious' | 'subtle' | 'interacting' | 'fine'

export const TIER_LABEL: Record<PuzzleTier, string> = {
  obvious: 'ONE OBVIOUS FLAW',
  subtle: 'ONE SUBTLE FLAW',
  interacting: 'TWO INTERACTING FLAWS',
  fine: 'THIS DESIGN IS SOUND',
}

const TIER_RANK: Record<PuzzleTier, number> = { obvious: 0, subtle: 1, interacting: 2, fine: 3 }

export interface Puzzle {
  id: string
  title: string
  reqs: string
  brief: string
  nodes: PuzzleNode[]
  edges: { a: string; b: string; label?: string }[]
  flaw: string
  /** ladder rung; drives ordering and the reveal label */
  tier: PuzzleTier
  /** par solve time in seconds (no fail state — pacing is a graded skill) */
  par: number
  /** "actually fine" puzzle: the honest move is to declare it sound, not accuse */
  fine?: boolean
  frames: PuzzleFrame[]
  explain: string
  fix: string
  line: string
  /** optional real public post-mortem (key into HAPPENED, spec 060) */
  happened?: string
}

/** Sentinel picked-value for "this design is sound — ship it". */
export const SOUND = '__sound__'

// Channel hints for bars use raw hex to stay serializable data.
const NET = '#53DCEC'
const COMPUTE = '#F6BB52'
const STORAGE = '#EF7BD0'
const MEM = '#72EAA8'
const ALERT = '#F26D5E'

const RAW: Puzzle[] = [
  {
    id: 'sawtooth',
    title: 'The Sawtooth Scheduler',
    tier: 'obvious',
    par: 40,
    reqs: 'Job scheduler · 10k jobs/sec · NFR: execute within 2s of scheduled time',
    brief:
      'A teammate proposes this: jobs land in DynamoDB; a Watcher wakes every 5 minutes, queries everything due, and pushes it all to SQS for workers. It demos beautifully. One piece of this design cannot survive the requirements — click your suspect.',
    nodes: [
      { id: 'api', x: 10, y: 100, label: 'API Gateway' },
      { id: 'svc', x: 160, y: 100, label: 'Jobs Service' },
      { id: 'db', x: 310, y: 30, label: 'DynamoDB', sub: 'jobs table' },
      { id: 'watch', x: 310, y: 170, label: 'Watcher', sub: 'polls every 5 min' },
      { id: 'sqs', x: 470, y: 170, label: 'SQS' },
      { id: 'work', x: 470, y: 30, label: 'Workers ×N' },
    ],
    edges: [
      { a: 'api', b: 'svc' },
      { a: 'svc', b: 'db', label: 'write job' },
      { a: 'watch', b: 'db', label: 'query due jobs' },
      { a: 'watch', b: 'sqs', label: 'enqueue all' },
      { a: 'sqs', b: 'work' },
      { a: 'work', b: 'db', label: 'update status' },
    ],
    flaw: 'watch',
    frames: [
      {
        cap: '12:00:00 — the Watcher wakes and queries every job due in the window…',
        bars: [
          { label: 'DynamoDB reads', u: 0.2, col: STORAGE },
          { label: 'SQS enqueue', u: 0.1, col: NET },
          { label: 'Job scheduled 12:00:31', u: 0, txt: 'waiting', col: MEM },
        ],
      },
      {
        cap: '10k jobs/sec × 300s = THREE MILLION rows in one query burst.',
        bars: [
          { label: 'DynamoDB reads', u: 1.35, col: STORAGE },
          { label: 'SQS enqueue', u: 0.95, col: NET },
          { label: 'Job scheduled 12:00:31', u: 0, txt: 'waiting', col: MEM },
        ],
      },
      {
        cap: "12:00:31 — a job's scheduled moment arrives. The Watcher is asleep for 4½ more minutes.",
        bars: [
          { label: 'DynamoDB reads', u: 0.05, col: STORAGE },
          { label: 'SQS enqueue', u: 0.05, col: NET },
          { label: 'Job scheduled 12:00:31', u: 0.3, txt: '0:00 late…', col: COMPUTE },
        ],
      },
      {
        cap: '12:05:00 — finally picked up. Executed 4 minutes 29 seconds late. The SLA said two SECONDS.',
        bars: [
          { label: 'DynamoDB reads', u: 1.35, col: STORAGE },
          { label: 'SQS enqueue', u: 0.95, col: NET },
          { label: 'Job scheduled 12:00:31', u: 1, txt: '4:29 LATE', col: ALERT },
        ],
      },
    ],
    explain:
      'The polling cadence is caught in an impossible squeeze: poll rarely → jobs run minutes late and each poll is a 3M-row avalanche; poll every 2 seconds → you hammer the database with huge scans all day. No polling frequency satisfies both the 2-second SLA and sane DB load.',
    fix: "Break the tension by separating DISCOVERY from PRECISION: the Watcher polls ahead (every 5 min, fetch jobs due in the NEXT window) and enqueues them to SQS with per-job delayed delivery — the queue releases each message at its exact second. Jobs created inside the window skip the Watcher and go straight to the queue. DB is scanned once per window; precision is the queue's job.",
    line: "“Polling frequency is a tradeoff between staleness and load — I'd rather move the precision requirement into the queue via delayed delivery than tighten the poll.”",
  },
  {
    id: 'hothour',
    title: 'The Hot Hour',
    tier: 'subtle',
    par: 50,
    reqs: 'Executions table · 10k writes/sec · partitioned key-value store (DynamoDB)',
    brief:
      'The executions table uses time_bucket (the current hour, e.g. “2026-07-03T11”) as its partition key — “so the Watcher can query one bucket per window, super efficient!” Writes are timing out in production. Click the suspect.',
    nodes: [
      { id: 'svc', x: 10, y: 100, label: 'Jobs Service' },
      { id: 'pk', x: 175, y: 100, label: 'Partition key', sub: 'time_bucket (hour)', chip: true },
      { id: 'p1', x: 360, y: 12, label: 'Partition A', sub: 'hour 09' },
      { id: 'p2', x: 360, y: 100, label: 'Partition B', sub: 'hour 10 (now)' },
      { id: 'p3', x: 360, y: 188, label: 'Partition C', sub: 'hour 11' },
      { id: 'work', x: 520, y: 100, label: 'Workers' },
    ],
    edges: [
      { a: 'svc', b: 'pk', label: '10k writes/s' },
      { a: 'pk', b: 'p1' },
      { a: 'pk', b: 'p2' },
      { a: 'pk', b: 'p3' },
      { a: 'work', b: 'p2', label: 'status updates' },
    ],
    flaw: 'pk',
    frames: [
      {
        cap: "It's 10:14. Every single write this hour computes the same partition key: “hour 10”.",
        bars: [
          { label: 'Partition A (hour 09)', u: 0.02, col: STORAGE },
          { label: 'Partition B (hour 10)', u: 0.6, col: STORAGE },
          { label: 'Partition C (hour 11)', u: 0.0, col: STORAGE },
        ],
      },
      {
        cap: 'Dynamo scales by spreading KEYS across partitions. But right now there is only ONE key.',
        bars: [
          { label: 'Partition A (hour 09)', u: 0.02, col: STORAGE },
          { label: 'Partition B (hour 10)', u: 1.1, col: STORAGE },
          { label: 'Partition C (hour 11)', u: 0.0, col: STORAGE },
        ],
      },
      {
        cap: 'One partition sustains ~1k writes/sec. 10k/sec are arriving. Nine of ten writes are throttled.',
        bars: [
          { label: 'Partition A (hour 09)', u: 0.02, col: STORAGE },
          { label: 'Partition B (hour 10)', u: 3.0, txt: 'THROTTLING', col: ALERT },
          { label: 'Partition C (hour 11)', u: 0.0, col: STORAGE },
        ],
      },
      {
        cap: "At 11:00 the pain doesn't end — it just moves to Partition C. A hot partition on wheels.",
        bars: [
          { label: 'Partition A (hour 09)', u: 0.02, col: STORAGE },
          { label: 'Partition B (hour 10)', u: 0.05, col: STORAGE },
          { label: 'Partition C (hour 11)', u: 3.0, txt: 'THROTTLING', col: ALERT },
        ],
      },
    ],
    explain:
      "A partitioned store's whole superpower is spreading load across keys — and this schema funnels 100% of current writes into one key. Any key derived from “now” (hour buckets, today's date) or from popularity (a viral post's ID) creates the same rolling hot spot. The cluster is huge and 97% of it is idle.",
    fix: "Salt the key: time_bucket#shard_N with N random in 0..9 spreads the hour across 10 partitions. Readers query all suffixes for the bucket and merge — a small, bounded read cost buying 10× write headroom. Alternative: partition by job_id and use a GSI on (time_bucket, next_execution_time) for the Watcher's query.",
    line: "“Before I commit a partition key I ask: will many concurrent writers compute the SAME value? Timestamps and 'today' are the classic trap — I'd salt with a suffix and fan-in on read.”",
  },
  {
    id: 'vanish',
    title: 'The Vanishing Job',
    tier: 'subtle',
    par: 45,
    reqs: 'NFR: every job runs AT LEAST once · workers are ordinary machines (they crash)',
    brief:
      'Worker logic: (1) receive message from SQS, (2) delete the message — “so no one else grabs it”, (3) execute the job, (4) write COMPLETED to the DB. Tidy. Occasionally a job silently never happens. Click the suspect.',
    nodes: [
      { id: 'sqs', x: 10, y: 100, label: 'SQS' },
      { id: 'ack', x: 175, y: 100, label: 'Ack policy', sub: 'delete on receive', chip: true },
      { id: 'wa', x: 350, y: 30, label: 'Worker A' },
      { id: 'wb', x: 350, y: 170, label: 'Worker B' },
      { id: 'db', x: 520, y: 100, label: 'DynamoDB', sub: 'status' },
    ],
    edges: [
      { a: 'sqs', b: 'ack' },
      { a: 'ack', b: 'wa', label: 'job #4411' },
      { a: 'ack', b: 'wb' },
      { a: 'wa', b: 'db', label: 'COMPLETED' },
      { a: 'wb', b: 'db' },
    ],
    flaw: 'ack',
    frames: [
      {
        cap: 'Worker A receives job #4411 and immediately deletes the message. The queue forgets it existed.',
        bars: [
          { label: 'Job #4411 in queue', u: 0, txt: 'DELETED', col: NET },
          { label: 'Worker A', u: 0.5, txt: 'executing…', col: COMPUTE },
          { label: 'Status in DB', u: 0.3, txt: 'IN_PROGRESS', col: MEM },
        ],
      },
      {
        cap: "Mid-execution, Worker A's instance dies. Hardware does that. It's Tuesday.",
        bars: [
          { label: 'Job #4411 in queue', u: 0, txt: 'DELETED', col: NET },
          { label: 'Worker A', u: 1, txt: '💀 CRASHED', col: ALERT },
          { label: 'Status in DB', u: 0.3, txt: 'IN_PROGRESS', col: MEM },
        ],
      },
      {
        cap: 'Job #4411 now exists NOWHERE. Not in the queue, not on a worker, not done.',
        bars: [
          { label: 'Job #4411 in queue', u: 0, txt: 'gone', col: NET },
          { label: 'Worker B', u: 0.05, txt: 'sees nothing to do', col: COMPUTE },
          { label: 'Status in DB', u: 0.3, txt: 'IN_PROGRESS forever', col: ALERT },
        ],
      },
      {
        cap: '“At least once” just became “maybe zero times.” The deletion was the moment of no return.',
        bars: [
          { label: 'Job #4411 in queue', u: 0, txt: 'gone', col: NET },
          { label: 'Worker B', u: 0.05, txt: 'idle', col: COMPUTE },
          { label: 'Status in DB', u: 1, txt: 'LOST', col: ALERT },
        ],
      },
    ],
    explain:
      "Deleting on receive hands the job's ONLY copy to a machine that's allowed to die. The guarantee you're paid for — at-least-once — lives or dies on when you acknowledge. Ack-before-work means crashes lose work; that's at-MOST-once.",
    fix: "Use the queue's visibility timeout: receiving a message hides it instead of deleting it; the worker deletes it only AFTER writing COMPLETED. If the worker crashes, the timeout expires and the message reappears for Worker B. Crash insurance, built into the queue.",
    line: "“I ack only after the side effect is durable. The visibility timeout means a dead worker's jobs automatically return to the pool — the queue is my crash recovery.”",
  },
  {
    id: 'double',
    title: 'The Double Send',
    tier: 'subtle',
    par: 50,
    reqs: 'Jobs have real side effects (send email, charge card) · retries with exponential backoff on failure',
    brief:
      'Failure handling looks solid: on timeout or error, re-enqueue with exponential backoff, mark RETRYING, cap attempts. Customers start reporting duplicate emails — and one duplicate charge. Click the suspect.',
    nodes: [
      { id: 'sqs', x: 10, y: 100, label: 'SQS' },
      { id: 'work', x: 165, y: 100, label: 'Worker' },
      { id: 'retry', x: 165, y: 12, label: 'Retry policy', sub: 'exp backoff ×3', chip: true },
      { id: 'eff', x: 340, y: 100, label: 'Email API', sub: 'the side effect' },
      { id: 'idem', x: 340, y: 188, label: 'Request identity', sub: 'none — each retry is new', chip: true },
      { id: 'db', x: 515, y: 100, label: 'DB status' },
    ],
    edges: [
      { a: 'sqs', b: 'work' },
      { a: 'retry', b: 'work' },
      { a: 'work', b: 'eff', label: 'send' },
      { a: 'eff', b: 'idem' },
      { a: 'work', b: 'db' },
    ],
    flaw: 'idem',
    frames: [
      {
        cap: 'Worker sends the email. The email GOES OUT… but the response times out on the way back.',
        bars: [
          { label: 'Email actually sent', u: 1, txt: '1 sent ✓', col: MEM },
          { label: "Worker's view", u: 0.5, txt: 'timeout — failed?', col: COMPUTE },
          { label: 'Customer inbox', u: 0.2, txt: '1 email', col: NET },
        ],
      },
      {
        cap: 'The worker cannot distinguish “failed” from “succeeded, reply lost.” It does the safe-looking thing: retry.',
        bars: [
          { label: 'Email actually sent', u: 1, txt: '2 sent', col: COMPUTE },
          { label: "Worker's view", u: 0.5, txt: 'retrying…', col: COMPUTE },
          { label: 'Customer inbox', u: 0.5, txt: '2 emails', col: COMPUTE },
        ],
      },
      {
        cap: 'Backoff, retry, backoff, retry. Each attempt is a brand-new request with no identity.',
        bars: [
          { label: 'Email actually sent', u: 1, txt: '4 sent', col: ALERT },
          { label: "Worker's view", u: 0.5, txt: "still 'failing'", col: COMPUTE },
          { label: 'Customer inbox', u: 1, txt: '4 emails 😡', col: ALERT },
        ],
      },
      {
        cap: "The retry policy isn't the bug — retries are correct! The bug: nothing lets the API say “seen this one already.”",
        bars: [
          { label: 'Email actually sent', u: 1, txt: '4 sent', col: ALERT },
          { label: "Worker's view", u: 0.5, txt: 'gives up', col: COMPUTE },
          { label: 'Customer inbox', u: 1, txt: '4 emails', col: ALERT },
        ],
      },
    ],
    explain:
      "At-least-once delivery GUARANTEES occasional duplicates — that's the 'at least'. Retries are the immune system of distributed systems; they're only safe when operations are idempotent. The missing piece isn't fewer retries, it's giving each logical operation a stable identity.",
    fix: "Attach an idempotency key (the job_execution_id you already have!) to every side-effecting call; the receiving API stores processed keys and turns duplicates into no-ops. Same pattern behind Stripe's idempotency keys and exactly-once-looking payment flows.",
    line: '“At-least-once plus non-idempotent side effects equals duplicates — so I make every side effect idempotent with an operation ID, and then retries become free.”',
  },

  {
    id: 'redirect',
    title: 'The Naked Redirect',
    tier: 'obvious',
    par: 30,
    reqs: 'URL shortener · 100k redirects/sec · 99% reads · p99 < 50ms · code→URL mapping is immutable',
    brief:
      'The read path is three lines: GET /:code → SELECT the long URL from Postgres → 301 redirect. Creating a link is rare, so nobody worried about reads. Traffic ramps and redirects start timing out. Click the suspect.',
    nodes: [
      { id: 'cli', x: 10, y: 100, label: 'Browser' },
      { id: 'app', x: 165, y: 100, label: 'App server' },
      { id: 'nocache', x: 320, y: 14, label: 'No cache', sub: 'every hit → DB', chip: true },
      { id: 'db', x: 330, y: 100, label: 'Postgres', sub: 'links table' },
      { id: 'redir', x: 500, y: 100, label: '301 redirect' },
    ],
    edges: [
      { a: 'cli', b: 'app', label: 'GET /:code' },
      { a: 'nocache', b: 'db' },
      { a: 'app', b: 'db', label: 'SELECT by code' },
      { a: 'app', b: 'redir' },
    ],
    flaw: 'nocache',
    frames: [
      {
        cap: 'Launch traffic: a few thousand redirects/sec. Postgres shrugs.',
        bars: [
          { label: 'Redirects/sec', u: 0.05, col: NET },
          { label: 'Postgres reads', u: 0.1, col: STORAGE },
          { label: 'p99 latency', u: 0.1, txt: '4 ms', col: COMPUTE },
        ],
      },
      {
        cap: 'It gets shared. 100k redirects/sec — and EVERY one is a disk-backed SELECT.',
        bars: [
          { label: 'Redirects/sec', u: 1, txt: '100k/s', col: NET },
          { label: 'Postgres reads', u: 5, txt: '5× cap', col: ALERT },
          { label: 'p99 latency', u: 0.6, txt: 'climbing', col: COMPUTE },
        ],
      },
      {
        cap: 'A single primary sustains ~20k reads/sec. You are asking for five times that.',
        bars: [
          { label: 'Redirects served', u: 0.2, txt: '20k of 100k', col: NET },
          { label: 'Postgres reads', u: 1, txt: 'MAXED', col: ALERT },
          { label: 'p99 latency', u: 1, txt: 'timeouts', col: ALERT },
        ],
      },
      {
        cap: 'Four of five redirects fail — waiting on a DB read for data that never changes.',
        bars: [
          { label: 'Redirects served', u: 0.2, txt: '80% dropped', col: ALERT },
          { label: 'Postgres reads', u: 1, txt: 'MAXED', col: ALERT },
          { label: 'p99 latency', u: 1, txt: '> 50ms SLA', col: ALERT },
        ],
      },
    ],
    explain:
      'The mapping code→URL is immutable and tiny — the single most cacheable thing in computing — yet every one of 100k redirects/sec pays a disk-backed round trip to a database that tops out near 20k reads/sec. When reads dwarf writes AND the data never changes, the database should be the cold path, not the hot one.',
    fix: "Put a cache in front (Redis, an in-process LRU, or a CDN edge). Because the mapping is immutable, cache invalidation — the genuinely hard part of caching — doesn't even apply: set it and forget it. Now 100k/s are 1ms memory reads and the DB only sees the rare cold miss.",
    line: '“When reads dwarf writes and the value is immutable, the DB is the cold path — a cache turns 100k DB reads/sec into 100k memory reads/sec with no invalidation headache.”',
  },

  {
    id: 'fanout',
    title: 'The Celebrity Fan-out',
    tier: 'obvious',
    par: 45,
    reqs: 'Social feed · fan-out-on-write · post must appear in follower feeds within seconds · some accounts have 40M followers',
    brief:
      "On every post, a fan-out worker writes the post's id into each follower's precomputed feed list — so reads are dirt cheap O(1) lookups. Beautiful for the timeline. Then a celebrity posts and the whole pipeline backs up. Click the suspect.",
    nodes: [
      { id: 'post', x: 10, y: 100, label: 'Post Service' },
      { id: 'graph', x: 175, y: 14, label: 'Follow graph', sub: '40M followers', chip: true },
      { id: 'fan', x: 175, y: 100, label: 'Fan-out worker', sub: 'write to every follower' },
      { id: 'feeds', x: 345, y: 100, label: 'Feed store', sub: 'per-user timelines' },
      { id: 'read', x: 510, y: 100, label: 'Feed read', sub: 'O(1) lookup' },
    ],
    edges: [
      { a: 'post', b: 'fan' },
      { a: 'graph', b: 'fan' },
      { a: 'fan', b: 'feeds', label: 'N writes / post' },
      { a: 'feeds', b: 'read' },
    ],
    flaw: 'fan',
    frames: [
      {
        cap: 'A normal user (200 followers) posts. Fan-out writes 200 rows. Instant.',
        bars: [
          { label: 'Writes this post', u: 0.02, txt: '200', col: STORAGE },
          { label: 'Fan-out worker', u: 0.1, col: COMPUTE },
          { label: 'Feed freshness', u: 0.05, txt: '< 1s', col: MEM },
        ],
      },
      {
        cap: 'A celebrity posts. One post = 40 MILLION writes, all queued behind it.',
        bars: [
          { label: 'Writes this post', u: 1, txt: '40M', col: ALERT },
          { label: 'Fan-out worker', u: 1, txt: 'saturated', col: ALERT },
          { label: 'Feed freshness', u: 0.4, txt: 'slipping', col: COMPUTE },
        ],
      },
      {
        cap: 'The worker grinds through 40M inserts while every OTHER post waits behind it.',
        bars: [
          { label: 'Backlog', u: 1, txt: 'all posts stalled', col: ALERT },
          { label: 'Fan-out worker', u: 1, txt: '100%', col: ALERT },
          { label: 'Feed freshness', u: 1, txt: 'minutes late', col: ALERT },
        ],
      },
      {
        cap: 'The read side was never the problem. A skewed follower count made writes unbounded.',
        bars: [
          { label: 'Backlog', u: 0.8, txt: 'draining slowly', col: COMPUTE },
          { label: 'Fan-out worker', u: 1, txt: 'still catching up', col: ALERT },
          { label: 'Feed freshness', u: 1, txt: 'SLA blown', col: ALERT },
        ],
      },
    ],
    explain:
      "Fan-out-on-write buys cheap reads by paying at write time, and that cost scales with follower count. For the median user (a few hundred followers) it's a fantastic trade; for a celebrity a single post is tens of millions of writes — an unbounded, highly-skewed write amplification that head-of-line-blocks everyone else. The elegant read path is innocent.",
    fix: 'Go hybrid: fan-out-on-WRITE for ordinary accounts, fan-out-on-READ for the handful of huge accounts (their posts are pulled and merged in at read time). The 0.001% of accounts with enormous follower counts get the opposite strategy — the design real feeds converged on.',
    line: '“Fan-out-on-write dies on skew. I split by follower count: push for the many, pull for the celebrity few, so no single post is 40M writes.”',
  },

  {
    id: 'counter',
    title: 'The One Hot Key',
    tier: 'subtle',
    par: 55,
    reqs: 'Global API rate limiter · 500k requests/sec across the fleet · one enforced limit',
    brief:
      "Every request runs INCR ratelimit:global in Redis and compares the count to the cap — atomic, correct, one source of truth. Redis is famously fast. Yet latency on that INCR keeps climbing and one Redis core is pinned at 100%. Click the suspect.",
    nodes: [
      { id: 'edge', x: 10, y: 100, label: 'Edge servers ×200' },
      { id: 'key', x: 190, y: 100, label: 'ratelimit:global', sub: 'one Redis key', chip: true },
      { id: 'redis', x: 380, y: 100, label: 'Redis node', sub: 'single shard' },
    ],
    edges: [
      { a: 'edge', b: 'key', label: '500k INCR/s' },
      { a: 'key', b: 'redis' },
    ],
    flaw: 'key',
    frames: [
      {
        cap: 'Low traffic: a few thousand INCRs/sec to the key. Sub-millisecond, correct.',
        bars: [
          { label: 'INCR ratelimit:global', u: 0.05, col: MEM },
          { label: 'Redis core serving the key', u: 0.1, col: COMPUTE },
        ],
      },
      {
        cap: '500k INCRs/sec — all to the SAME key. One key lives on one shard, served by one core.',
        bars: [
          { label: 'INCR ratelimit:global', u: 1, txt: '500k/s', col: NET },
          { label: 'Redis core serving the key', u: 1, txt: '100% — one core', col: ALERT },
        ],
      },
      {
        cap: 'A core does ~100k ops/sec. Five cores of work funnel through one. It serializes.',
        bars: [
          { label: 'Effective throughput', u: 0.2, txt: '100k of 500k', col: ALERT },
          { label: 'INCR latency', u: 1, txt: 'queuing', col: ALERT },
        ],
      },
      {
        cap: 'Adding Redis nodes does nothing — you cannot shard a key whose whole point is to be global.',
        bars: [
          { label: 'Extra Redis nodes', u: 0.05, txt: 'idle', col: STORAGE },
          { label: 'The hot core', u: 1, txt: 'still 100%', col: ALERT },
        ],
      },
    ],
    explain:
      'Atomicity is fine — correctness was never the issue. The issue is that a single logical counter is a single physical hot spot: one key lives on one shard, served by one CPU core (~100k ops/sec). Routing 500k/sec at ONE key serializes them on that core, and you cannot shard it away because being global is the counter\'s entire purpose.',
    fix: 'Approximate: split into N sub-counters (ratelimit:global:{0..15}); each edge INCRs a random shard and the limiter sums them — or, better, give each edge a LOCAL token bucket that reconciles with the global count every few hundred ms. You trade exact-at-the-millisecond precision for N× throughput, which a rate limit can easily afford.',
    line: '“A global counter is a global hot key. I shard it into N counters (or local token buckets that sync) — trading millisecond-exactness for N× throughput, which a rate limit tolerates.”',
  },

  {
    id: 'retrystorm',
    title: 'The Synchronized Retry',
    tier: 'subtle',
    par: 55,
    reqs: 'Payment workers ×5000 · downstream gateway occasionally blips for ~1s · retry with exponential backoff',
    brief:
      "Resilience looks textbook: on failure retry after 1s, then 2s, then 4s — exponential backoff, capped at 5 tries. Then the gateway blips for a single second and the fleet knocks it flat, again and again. Click the suspect.",
    nodes: [
      { id: 'workers', x: 10, y: 100, label: 'Workers ×5000' },
      { id: 'backoff', x: 185, y: 100, label: 'Backoff policy', sub: '1s · 2s · 4s — no jitter', chip: true },
      { id: 'gw', x: 375, y: 100, label: 'Payment gateway' },
    ],
    edges: [
      { a: 'workers', b: 'backoff' },
      { a: 'backoff', b: 'gw', label: 'retry' },
    ],
    flaw: 'backoff',
    frames: [
      {
        cap: 'Steady state: requests trickle to the gateway, well under its ceiling.',
        bars: [
          { label: 'Gateway load', u: 0.3, col: NET },
          { label: 'In-flight failures', u: 0, col: COMPUTE },
        ],
      },
      {
        cap: 'The gateway blips for 1s. All ~5000 in-flight requests fail at nearly the same instant.',
        bars: [
          { label: 'Gateway load', u: 0, txt: 'blip', col: ALERT },
          { label: 'In-flight failures', u: 1, txt: '5000 at once', col: ALERT },
        ],
      },
      {
        cap: 'Exactly 1s later — no jitter — all 5000 retry simultaneously. A coordinated spike.',
        bars: [
          { label: 'Gateway load', u: 3, txt: '5000 in one tick', col: ALERT },
          { label: 'Gateway (just recovered)', u: 1, txt: 'knocked over', col: ALERT },
        ],
      },
      {
        cap: 'It re-synchronizes: +2s they all hit again. The retries are worse than the outage.',
        bars: [
          { label: 'Gateway load', u: 3, txt: 'spike, spike, spike', col: ALERT },
          { label: 'Steady demand', u: 0.3, txt: 'would have been fine', col: MEM },
        ],
      },
    ],
    explain:
      'Exponential backoff without JITTER makes every client retry on the same schedule. A shared trigger (the blip) synchronizes them and the deterministic delays keep them synchronized, so retries arrive as one coordinated thundering herd — worse than the original blip — and re-synchronize on every wave. The retry policy is right in spirit and wrong in timing.',
    fix: 'Add jitter: wait a RANDOM duration in [0, backoff] instead of exactly backoff. The 5000 retries then smear across the window rather than stacking on one instant. “Exponential backoff AND jitter” is a single idea — it is the canonical retry recipe for a reason.',
    line: '“Backoff without jitter just reschedules the stampede. I pair exponential backoff with randomized jitter so retries spread out instead of resonating into a self-inflicted DDoS.”',
    happened: 'slack-2021',
  },

  {
    id: 'stalecache',
    title: 'The Cache That Lies',
    tier: 'subtle',
    par: 50,
    reqs: 'Product catalog · read-through cache, TTL 1h · prices change during flash sales · NFR: price shown = price charged',
    brief:
      'Reads go through a cache (miss → DB → fill, TTL 1 hour) and hit rates are gorgeous. Writes go straight to the database. During a flash sale, customers see — and get charged — the OLD price for up to an hour. Click the suspect.',
    nodes: [
      { id: 'read', x: 10, y: 40, label: 'Read path' },
      { id: 'cache', x: 185, y: 40, label: 'Cache', sub: 'TTL 1h' },
      { id: 'db', x: 360, y: 100, label: 'Database', sub: 'source of truth' },
      { id: 'write', x: 10, y: 165, label: 'Write path', sub: 'price update' },
      { id: 'noinval', x: 185, y: 165, label: 'Write → DB only', sub: 'cache untouched', chip: true },
    ],
    edges: [
      { a: 'read', b: 'cache' },
      { a: 'cache', b: 'db', label: 'on miss' },
      { a: 'write', b: 'noinval' },
      { a: 'noinval', b: 'db' },
    ],
    flaw: 'noinval',
    frames: [
      {
        cap: 'Steady state: cache and DB agree. Reads are fast, everyone is happy.',
        bars: [
          { label: 'Cache value', u: 0.5, txt: '$40 ✓', col: MEM },
          { label: 'DB value', u: 0.5, txt: '$40', col: STORAGE },
        ],
      },
      {
        cap: 'Flash sale: price update writes $25 to the DB. The cache is never told.',
        bars: [
          { label: 'Cache value', u: 0.5, txt: '$40 (stale)', col: COMPUTE },
          { label: 'DB value', u: 0.5, txt: '$25', col: STORAGE },
        ],
      },
      {
        cap: 'Every read hits the cache: customers see $40 and the checkout charges $40.',
        bars: [
          { label: 'Price shown', u: 1, txt: '$40 wrong', col: ALERT },
          { label: 'Price in DB', u: 0.5, txt: '$25', col: STORAGE },
        ],
      },
      {
        cap: 'For up to a full hour, until the TTL happens to expire. Support lights up.',
        bars: [
          { label: 'Mischarged customers', u: 1, txt: 'up to 1h', col: ALERT },
          { label: 'Cache confidence', u: 0.5, txt: '"still fresh!"', col: COMPUTE },
        ],
      },
    ],
    explain:
      'The write path and the read path disagree about who owns the truth. Writing only to the DB leaves the cache confidently serving a value it believes is fresh — stale until the TTL happens to lapse. A TTL bounds staleness by TIME; a correctness requirement ("price shown = price charged") needs staleness bounded by EVENT.',
    fix: 'Make writes invalidate the cache: on a price change, delete the key (or write through to update it). The next read re-fills from the DB. Reserve pure-TTL caching for data where bounded staleness is genuinely acceptable; invalidate-on-write for anything a customer is charged against.',
    line: '“A TTL bounds staleness by time, but a correctness field needs invalidation by event — I delete the cache key on every write so the next read can\'t serve a lie.”',
  },

  {
    id: 'tango',
    title: 'The Autoscaling Death Spiral',
    tier: 'interacting',
    par: 70,
    reqs: 'Image processing · bursty uploads · unbounded inbound queue · autoscaler adds workers when queue wait-time rises',
    brief:
      "Two reasonable choices: an unbounded queue so no upload is ever rejected, and an autoscaler that adds workers when queue wait-time climbs. Each is defensible on its own. A burst hits, the bill explodes, and latency gets WORSE. Two pieces are conspiring — click the one that starts the spiral.",
    nodes: [
      { id: 'up', x: 10, y: 100, label: 'Uploads', sub: 'bursty' },
      { id: 'queue', x: 165, y: 100, label: 'Inbound queue', sub: 'unbounded', chip: true },
      { id: 'workers', x: 340, y: 100, label: 'Workers', sub: 'autoscaled' },
      { id: 'scaler', x: 340, y: 14, label: 'Autoscaler', sub: 'trigger: queue wait-time', chip: true },
      { id: 'proc', x: 510, y: 100, label: 'Processed' },
    ],
    edges: [
      { a: 'up', b: 'queue' },
      { a: 'queue', b: 'workers' },
      { a: 'scaler', b: 'workers' },
      { a: 'workers', b: 'proc' },
    ],
    flaw: 'queue',
    frames: [
      {
        cap: 'Normal load: queue near empty, a handful of workers, wait-time low.',
        bars: [
          { label: 'Queue backlog', u: 0.1, col: NET },
          { label: 'Workers', u: 0.2, txt: '×8', col: COMPUTE },
          { label: 'Cloud bill', u: 0.2, col: STORAGE },
        ],
      },
      {
        cap: 'A burst arrives. The unbounded queue happily accepts all of it. Backlog balloons.',
        bars: [
          { label: 'Queue backlog', u: 1, txt: 'unbounded ↑', col: ALERT },
          { label: 'Workers', u: 0.4, txt: '×16', col: COMPUTE },
          { label: 'Cloud bill', u: 0.5, col: STORAGE },
        ],
      },
      {
        cap: 'Autoscaler sees high wait-time and adds workers — but wait-time = age of the OLDEST message.',
        bars: [
          { label: 'Queue backlog', u: 1, txt: 'still huge', col: ALERT },
          { label: 'Workers', u: 1, txt: '×200 and climbing', col: ALERT },
          { label: 'Cloud bill', u: 1, txt: '💸', col: ALERT },
        ],
      },
      {
        cap: 'That age stays high until the whole backlog drains, so it keeps scaling — chasing a number it can\'t move.',
        bars: [
          { label: 'Queue backlog', u: 0.8, txt: 'draining', col: COMPUTE },
          { label: 'Workers', u: 1, txt: 'over-provisioned', col: ALERT },
          { label: 'Latency', u: 1, txt: 'still bad', col: ALERT },
        ],
      },
    ],
    explain:
      "Neither piece is wrong alone — together they form a feedback loop with a lagging signal. The unbounded queue lets backlog grow without limit; the autoscaler reacts to queue WAIT-TIME (the age of the oldest message), which stays high until the entire backlog drains — so it keeps adding workers long after throughput is already sufficient. Two locally-sensible decisions, one emergent death spiral.",
    fix: 'Break the loop on both sides: bound the queue with backpressure (shed or reject past a depth) so backlog can\'t run away, and scale on a LEADING, rate-based signal — arrival rate or queue-depth trend — not the age of the oldest item. Backpressure plus a stable control signal turns the spiral into a settle.',
    line: '“An autoscaler chasing a lagging metric behind an unbounded queue is a death spiral. I bound the queue with backpressure and scale on arrival rate, not on a signal that only falls after the backlog clears.”',
  },

  {
    id: 'splitbrain',
    title: 'The Split Brain',
    tier: 'interacting',
    par: 65,
    reqs: 'Primary + replica DB · automatic failover on primary timeout · clients retry failed writes · NFR: no conflicting writes',
    brief:
      "Failover is automated: if the replica can't reach the primary for 5s it promotes ITSELF. Clients retry writes that error. A brief network blip between the two nodes — not a real crash — and suddenly both think they're primary. Click the piece that lets it happen.",
    nodes: [
      { id: 'cli', x: 10, y: 100, label: 'Clients', sub: 'retry on error' },
      { id: 'part', x: 150, y: 100, label: 'Network blip', sub: 'A↔B link, 3s', chip: true },
      { id: 'p', x: 300, y: 30, label: 'Primary A', sub: 'still alive' },
      { id: 'r', x: 300, y: 170, label: 'Replica B' },
      { id: 'promo', x: 480, y: 170, label: 'Promotion rule', sub: 'self-promote, no quorum', chip: true },
    ],
    edges: [
      { a: 'cli', b: 'p' },
      { a: 'cli', b: 'r' },
      { a: 'p', b: 'r', label: 'replicate' },
      { a: 'part', b: 'p' },
      { a: 'r', b: 'promo' },
    ],
    flaw: 'promo',
    frames: [
      {
        cap: 'Healthy: A is primary, B replicates. One writer, one truth.',
        bars: [
          { label: 'Primaries accepting writes', u: 0.3, txt: '1 (A)', col: STORAGE },
          { label: 'Write conflicts', u: 0, col: MEM },
        ],
      },
      {
        cap: 'A 3s blip: B can\'t reach A. A timeout can\'t tell "A is dead" from "I can\'t see A".',
        bars: [
          { label: 'B\'s belief', u: 0.6, txt: '"A is dead"', col: COMPUTE },
          { label: 'A\'s reality', u: 0.6, txt: 'alive, serving', col: STORAGE },
        ],
      },
      {
        cap: 'B promotes itself. Now A and B BOTH accept writes — and retrying clients reach both.',
        bars: [
          { label: 'Primaries accepting writes', u: 1, txt: '2 — split brain', col: ALERT },
          { label: 'Write conflicts', u: 1, txt: 'same rows, both sides', col: ALERT },
        ],
      },
      {
        cap: 'The blip heals into two divergent histories with no safe way to merge. Writes are lost.',
        bars: [
          { label: 'Divergent copies', u: 1, txt: '2 truths', col: ALERT },
          { label: 'Reconcilable?', u: 1, txt: 'no', col: ALERT },
        ],
      },
    ],
    explain:
      "Two decisions collide: a node promotes itself on a TIMEOUT (which cannot distinguish a dead peer from an unreachable one), and clients retry to whichever node answers. A mere partition then yields two primaries — split brain — each taking conflicting writes. The timeout is a liveness guess; acting on it unilaterally is the bug.",
    fix: 'Require a QUORUM (a majority of voters, or an external witness/arbiter) to elect a primary. With an odd number of voters a minority partition can never promote itself, so at most one primary exists at a time. Consensus — Raft/Paxos, or Patroni + etcd — decides leadership, not a local timeout.',
    line: '“Never let a node promote itself on a timeout — a timeout can\'t tell dead from unreachable. Leadership needs a quorum so a partition yields zero or one primary, never two.”',
    happened: 'github-2018',
  },

  {
    id: 'boring',
    title: 'The Boring Monolith',
    tier: 'fine',
    par: 45,
    fine: true,
    reqs: 'Internal admin tool · 500 employees · ~50 req/s peak · a few GB of data · read-heavy',
    brief:
      "A teammate sketches: one app server, one Postgres, one small Redis cache. No shards, no queue, no replicas. The room is itching to “harden” it — someone wants Kafka and a sharded DB. Before you accuse anything: does this actually violate the requirements? Accuse a component — or declare it sound.",
    nodes: [
      { id: 'users', x: 10, y: 100, label: '500 employees', sub: '~50 req/s' },
      { id: 'app', x: 185, y: 100, label: 'App server' },
      { id: 'cache', x: 360, y: 30, label: 'Redis cache' },
      { id: 'db', x: 360, y: 170, label: 'Postgres', sub: 'single primary' },
    ],
    edges: [
      { a: 'users', b: 'app' },
      { a: 'app', b: 'cache' },
      { a: 'app', b: 'db' },
    ],
    frames: [
      {
        cap: 'Peak load: 50 req/s against an app server rated for ~10,000.',
        bars: [
          { label: 'App server', u: 0.005, txt: '0.5%', col: COMPUTE },
          { label: 'Postgres', u: 0.01, txt: 'idle', col: STORAGE },
          { label: 'Redis cache', u: 0.002, txt: 'barely used', col: MEM },
        ],
      },
      {
        cap: 'Reads: ~45/s against a primary that serves ~20,000/s. Rounding error.',
        bars: [
          { label: 'Postgres reads', u: 0.01, txt: '45 of 20k', col: STORAGE },
          { label: 'Postgres writes', u: 0.005, col: STORAGE },
          { label: 'Headroom', u: 0.02, txt: '~200× spare', col: MEM },
        ],
      },
      {
        cap: 'Everything green, with two-plus orders of magnitude of headroom. Nothing is near a wall.',
        bars: [
          { label: 'App server', u: 0.005, col: COMPUTE },
          { label: 'Postgres', u: 0.01, col: STORAGE },
          { label: 'Redis cache', u: 0.002, col: MEM },
        ],
      },
      {
        cap: 'Shards, queues, replicas would each add failure modes and cost to solve problems this system does not have.',
        bars: [
          { label: 'Requirements met', u: 1, txt: 'all', col: MEM },
          { label: 'Complexity added', u: 0, txt: 'none needed', col: MEM },
        ],
      },
    ],
    flaw: 'db',
    explain:
      'Nothing here violates the requirements — and that IS the answer. At 50 req/s and a few GB, one Postgres runs near 0.5% of its ceiling, the app server idles, the cache is almost decorative. Sharding, queues, and replicas would each solve a problem this system does not have, buying operational complexity, new failure modes, and a bigger bill for zero requirement met. The most expensive failure in a design review is fixing what isn\'t broken.',
    fix: 'Ship it. Add a nightly backup and a health check, then revisit only when a real number moves — data outgrows one box, reads outgrow one primary, or an SLA tightens. The honest review question is “what would have to change for this to break?”, not “what can I add?”',
    line: '“The requirements decide the architecture — at 50 req/s a single Postgres is the right call, not a risk. I add complexity when a number demands it, not before.”',
  },
]

// Serve puzzles along the difficulty ladder (stable sort keeps the seed
// scheduler set — Sawtooth — first, so deep links and e2e stay put).
export const PUZZLES: Puzzle[] = RAW.slice().sort((a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier])
