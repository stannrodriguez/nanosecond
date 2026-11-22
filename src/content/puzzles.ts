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
    reqs: 'Job scheduler · 10k jobs/sec · NFR: run within 2s of scheduled time',
    brief:
      'A teammate sketches this out: jobs land in DynamoDB, and a Watcher wakes every 5 minutes, queries everything due, and pushes the batch to SQS for workers. It demos like a dream. One piece of this architecture cannot survive the requirements. Click the weak point.',
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
        cap: '12:00:00. The Watcher wakes up and queries every job due in this window.',
        bars: [
          { label: 'DynamoDB reads', u: 0.2, col: STORAGE },
          { label: 'SQS enqueue', u: 0.1, col: NET },
          { label: 'Job scheduled 12:00:31', u: 0, txt: 'waiting', col: MEM },
        ],
      },
      {
        cap: '10k jobs/sec × 300s adds up to 3 million rows in a single bursty query.',
        bars: [
          { label: 'DynamoDB reads', u: 1.35, col: STORAGE },
          { label: 'SQS enqueue', u: 0.95, col: NET },
          { label: 'Job scheduled 12:00:31', u: 0, txt: 'waiting', col: MEM },
        ],
      },
      {
        cap: '12:00:31. A job hits its scheduled time while the Watcher sleeps for 4½ more minutes.',
        bars: [
          { label: 'DynamoDB reads', u: 0.05, col: STORAGE },
          { label: 'SQS enqueue', u: 0.05, col: NET },
          { label: 'Job scheduled 12:00:31', u: 0.3, txt: '0:00 late...', col: COMPUTE },
        ],
      },
      {
        cap: '12:05:00. Finally picked up, 4 minutes 29 seconds past due. The SLA promised 2 seconds.',
        bars: [
          { label: 'DynamoDB reads', u: 1.35, col: STORAGE },
          { label: 'SQS enqueue', u: 0.95, col: NET },
          { label: 'Job scheduled 12:00:31', u: 1, txt: '4:29 LATE', col: ALERT },
        ],
      },
    ],
    explain:
      'No single polling cadence can meet both a 2-second SLA and sane database load. Poll every 5 minutes and jobs run minutes late while each sweep pulls a 3M-row avalanche from DynamoDB; poll every 2 seconds and you hammer the database with continuous scans all day.',
    fix: 'Split discovery from timing precision. Have the Watcher poll ahead every 5 min for jobs due in the next window and enqueue them to SQS with per-job delayed delivery so the queue releases each message at its exact second. Jobs created inside the current window skip the Watcher and go straight to SQS. DynamoDB gets one calm scan per window, and the queue handles second-level precision.',
    line: "“Polling frequency trades staleness against database load, so I move timing precision into the queue with delayed delivery instead of tightening the poll.”",
  },
  {
    id: 'hothour',
    title: 'The Hot Hour',
    tier: 'subtle',
    par: 50,
    reqs: 'Executions table · 10k writes/sec · partitioned key-value store (DynamoDB)',
    brief:
      'The executions table partitions on time_bucket, the current hour (such as “2026-07-03T11”), so the Watcher can read one tidy bucket per window. In production, writes are timing out. Click the weak point.',
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
        cap: 'It is 10:14. Every single write this hour hashes to the exact same partition key: “hour 10”.',
        bars: [
          { label: 'Partition A (hour 09)', u: 0.02, col: STORAGE },
          { label: 'Partition B (hour 10)', u: 0.6, col: STORAGE },
          { label: 'Partition C (hour 11)', u: 0.0, col: STORAGE },
        ],
      },
      {
        cap: 'DynamoDB scales by spreading distinct keys across partitions, and right now there is only one active key.',
        bars: [
          { label: 'Partition A (hour 09)', u: 0.02, col: STORAGE },
          { label: 'Partition B (hour 10)', u: 1.1, col: STORAGE },
          { label: 'Partition C (hour 11)', u: 0.0, col: STORAGE },
        ],
      },
      {
        cap: 'One partition sustains ~1k writes/sec while 10k/sec pile in. Nine out of ten writes get throttled.',
        bars: [
          { label: 'Partition A (hour 09)', u: 0.02, col: STORAGE },
          { label: 'Partition B (hour 10)', u: 3.0, txt: 'THROTTLING', col: ALERT },
          { label: 'Partition C (hour 11)', u: 0.0, col: STORAGE },
        ],
      },
      {
        cap: 'At 11:00 the bottleneck just rolls over to Partition C. A hot partition on wheels.',
        bars: [
          { label: 'Partition A (hour 09)', u: 0.02, col: STORAGE },
          { label: 'Partition B (hour 10)', u: 0.05, col: STORAGE },
          { label: 'Partition C (hour 11)', u: 3.0, txt: 'THROTTLING', col: ALERT },
        ],
      },
    ],
    explain:
      'A partitioned key-value store only scales when writes fan across many keys, and this schema funnels 100% of current traffic into one. Any key built from “now” (hour buckets, today\'s date) or from popularity (a viral post\'s ID) creates the same rolling hot spot while 97% of the cluster sits idle.',
    fix: 'Salt the partition key into time_bucket#shard_N with N chosen randomly from 0 to 9, spreading the current hour across 10 partitions. Readers query all 10 suffixes and merge them, paying a small bounded read cost for 10× write headroom. Alternatively, partition by job_id and add a GSI on (time_bucket, next_execution_time) for the Watcher\'s query.',
    line: "“Before I pick a partition key, I check whether concurrent writers will compute the same value; timestamps and 'today' are classic traps, so I salt with a suffix and fan-in on read.”",
  },
  {
    id: 'vanish',
    title: 'The Vanishing Job',
    tier: 'subtle',
    par: 45,
    reqs: 'NFR: every job runs at least once · workers are ordinary machines (they crash)',
    brief:
      'The worker loop looks clean: receive a message from SQS, delete it right away so nobody else grabs it, run the job, and write COMPLETED to DynamoDB. Every so often, a job quietly disappears without ever running. Click the weak point.',
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
        cap: 'Worker A pulls job #4411 and deletes the message immediately. SQS forgets it ever existed.',
        bars: [
          { label: 'Job #4411 in queue', u: 0, txt: 'DELETED', col: NET },
          { label: 'Worker A', u: 0.5, txt: 'executing...', col: COMPUTE },
          { label: 'Status in DB', u: 0.3, txt: 'IN_PROGRESS', col: MEM },
        ],
      },
      {
        cap: 'Halfway through, Worker A crashes. Ordinary machines do that on a regular Tuesday.',
        bars: [
          { label: 'Job #4411 in queue', u: 0, txt: 'DELETED', col: NET },
          { label: 'Worker A', u: 1, txt: '💀 CRASHED', col: ALERT },
          { label: 'Status in DB', u: 0.3, txt: 'IN_PROGRESS', col: MEM },
        ],
      },
      {
        cap: 'Job #4411 now lives nowhere: gone from the queue, gone from every worker, never finished.',
        bars: [
          { label: 'Job #4411 in queue', u: 0, txt: 'gone', col: NET },
          { label: 'Worker B', u: 0.05, txt: 'sees nothing to do', col: COMPUTE },
          { label: 'Status in DB', u: 0.3, txt: 'IN_PROGRESS forever', col: ALERT },
        ],
      },
      {
        cap: '“At least once” just turned into “maybe zero times.” Deleting on receive was the point of no return.',
        bars: [
          { label: 'Job #4411 in queue', u: 0, txt: 'gone', col: NET },
          { label: 'Worker B', u: 0.05, txt: 'idle', col: COMPUTE },
          { label: 'Status in DB', u: 1, txt: 'LOST', col: ALERT },
        ],
      },
    ],
    explain:
      'Deleting a message on receive hands the only durable copy of the job to a machine that is allowed to die. At-least-once delivery depends on when you acknowledge: ack before the work finishes and crashes drop jobs, leaving you with at-most-once delivery.',
    fix: 'Rely on the queue\'s visibility timeout instead. Receiving a message hides it from other workers without deleting it, and the worker sends the delete only after writing COMPLETED to DynamoDB. If Worker A crashes mid-run, the timeout expires and the message reappears for Worker B.',
    line: "“I acknowledge a queue message only after the side effect is durable, so the visibility timeout turns the queue itself into crash recovery.”",
  },
  {
    id: 'double',
    title: 'The Double Send',
    tier: 'subtle',
    par: 50,
    reqs: 'Jobs have real side effects (send email, charge card) · retries with exponential backoff on failure',
    brief:
      'Failure handling looks thorough: on timeout or error, re-enqueue with exponential backoff, mark the job RETRYING, and cap the attempts. Then customers start reporting duplicate emails, plus one duplicate charge. Click the weak point.',
    nodes: [
      { id: 'sqs', x: 10, y: 100, label: 'SQS' },
      { id: 'work', x: 165, y: 100, label: 'Worker' },
      { id: 'retry', x: 165, y: 12, label: 'Retry policy', sub: 'exp backoff ×3', chip: true },
      { id: 'eff', x: 340, y: 100, label: 'Email API', sub: 'the side effect' },
      { id: 'idem', x: 340, y: 188, label: 'Request identity', sub: 'none, each retry is new', chip: true },
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
        cap: 'The worker calls the Email API. The email goes out, then the response times out on the return trip.',
        bars: [
          { label: 'Email actually sent', u: 1, txt: '1 sent ✓', col: MEM },
          { label: "Worker's view", u: 0.5, txt: 'timeout, failed?', col: COMPUTE },
          { label: 'Customer inbox', u: 0.2, txt: '1 email', col: NET },
        ],
      },
      {
        cap: 'The worker cannot tell “failed” from “succeeded, reply lost.” It does the sensible thing and retries.',
        bars: [
          { label: 'Email actually sent', u: 1, txt: '2 sent', col: COMPUTE },
          { label: "Worker's view", u: 0.5, txt: 'retrying...', col: COMPUTE },
          { label: 'Customer inbox', u: 0.5, txt: '2 emails', col: COMPUTE },
        ],
      },
      {
        cap: 'Backoff, retry, backoff, retry. Without an operation ID, every attempt looks brand new to the API.',
        bars: [
          { label: 'Email actually sent', u: 1, txt: '4 sent', col: ALERT },
          { label: "Worker's view", u: 0.5, txt: "still 'failing'", col: COMPUTE },
          { label: 'Customer inbox', u: 1, txt: '4 emails 😡', col: ALERT },
        ],
      },
      {
        cap: 'Retries are not the bug here. The bug is that the API has no way to recognize a request it already ran.',
        bars: [
          { label: 'Email actually sent', u: 1, txt: '4 sent', col: ALERT },
          { label: "Worker's view", u: 0.5, txt: 'gives up', col: COMPUTE },
          { label: 'Customer inbox', u: 1, txt: '4 emails', col: ALERT },
        ],
      },
    ],
    explain:
      'At-least-once delivery guarantees occasional duplicates because a caller cannot tell a lost response from a failed request. Retries are essential in distributed systems, but they are safe only when side effects are idempotent and every logical operation carries a stable identity.',
    fix: 'Attach an idempotency key (such as the job_execution_id you already track) to every side-effecting call. The receiving API records processed keys and turns repeats into harmless no-ops, the same mechanism behind Stripe\'s idempotency keys and safe payment retries.',
    line: '“At-least-once delivery plus non-idempotent side effects guarantees duplicates, so I attach a stable operation ID to every side effect and make retries safe.”',
  },

  {
    id: 'redirect',
    title: 'The Naked Redirect',
    tier: 'obvious',
    par: 30,
    reqs: 'URL shortener · 100k redirects/sec · 99% reads · p99 < 50ms · code→URL mapping is immutable',
    brief:
      'The read path is three lines of code: handle GET /:code, SELECT the long URL from Postgres, and return a 301 redirect. Link creation is rare, so nobody worried much about reads. Traffic climbs and redirects start timing out. Click the weak point.',
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
        cap: 'Launch day: a few thousand redirects/sec, and Postgres barely notices.',
        bars: [
          { label: 'Redirects/sec', u: 0.05, col: NET },
          { label: 'Postgres reads', u: 0.1, col: STORAGE },
          { label: 'p99 latency', u: 0.1, txt: '4 ms', col: COMPUTE },
        ],
      },
      {
        cap: 'A link takes off: 100k redirects/sec, and every single one triggers a disk-backed SELECT.',
        bars: [
          { label: 'Redirects/sec', u: 1, txt: '100k/s', col: NET },
          { label: 'Postgres reads', u: 5, txt: '5× cap', col: ALERT },
          { label: 'p99 latency', u: 0.6, txt: 'climbing', col: COMPUTE },
        ],
      },
      {
        cap: 'One Postgres primary sustains roughly 20k reads/sec, and traffic is demanding 5× that ceiling.',
        bars: [
          { label: 'Redirects served', u: 0.2, txt: '20k of 100k', col: NET },
          { label: 'Postgres reads', u: 1, txt: 'MAXED', col: ALERT },
          { label: 'p99 latency', u: 1, txt: 'timeouts', col: ALERT },
        ],
      },
      {
        cap: 'Four out of five redirects fail while waiting on database reads for values that never change.',
        bars: [
          { label: 'Redirects served', u: 0.2, txt: '80% dropped', col: ALERT },
          { label: 'Postgres reads', u: 1, txt: 'MAXED', col: ALERT },
          { label: 'p99 latency', u: 1, txt: '> 50ms SLA', col: ALERT },
        ],
      },
    ],
    explain:
      'An immutable, tiny code→URL lookup is about as cacheable as data gets, yet every one of 100k redirects/sec hits a Postgres primary that tops out around 20k reads/sec. When reads dwarf writes and the mapping never mutates, the database belongs on the cold path, not the hot one.',
    fix: 'Put a cache in front using Redis, an in-process LRU, or a CDN edge. Because the code→URL mapping is immutable, cache invalidation does not even enter the picture. Now 100k/s resolve as 1ms memory reads and Postgres only serves the rare cold miss.',
    line: '“When reads dwarf writes and the value is immutable, the database is the cold path; a cache turns 100k DB reads/sec into 100k memory reads/sec with zero invalidation headache.”',
  },

  {
    id: 'fanout',
    title: 'The Celebrity Fan-out',
    tier: 'obvious',
    par: 45,
    reqs: 'Social feed · fan-out-on-write · post must appear in follower feeds within seconds · some accounts have 40M followers',
    brief:
      'Whenever someone posts, a fan-out worker writes the post ID into each follower\'s precomputed feed list so reads stay fast O(1) lookups. The timeline flies until a celebrity posts and the entire pipeline stalls. Click the weak point.',
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
        cap: 'A typical user with 200 followers posts. The worker writes 200 rows and finishes almost instantly.',
        bars: [
          { label: 'Writes this post', u: 0.02, txt: '200', col: STORAGE },
          { label: 'Fan-out worker', u: 0.1, col: COMPUTE },
          { label: 'Feed freshness', u: 0.05, txt: '< 1s', col: MEM },
        ],
      },
      {
        cap: 'A celebrity posts. One action expands into 40 million writes, all stacked behind it.',
        bars: [
          { label: 'Writes this post', u: 1, txt: '40M', col: ALERT },
          { label: 'Fan-out worker', u: 1, txt: 'saturated', col: ALERT },
          { label: 'Feed freshness', u: 0.4, txt: 'slipping', col: COMPUTE },
        ],
      },
      {
        cap: 'The worker chews through 40M inserts while every other post on the platform waits in line.',
        bars: [
          { label: 'Backlog', u: 1, txt: 'all posts stalled', col: ALERT },
          { label: 'Fan-out worker', u: 1, txt: '100%', col: ALERT },
          { label: 'Feed freshness', u: 1, txt: 'minutes late', col: ALERT },
        ],
      },
      {
        cap: 'Reads were never the problem. Extreme follower skew turned write amplification into an unbounded queue.',
        bars: [
          { label: 'Backlog', u: 0.8, txt: 'draining slowly', col: COMPUTE },
          { label: 'Fan-out worker', u: 1, txt: 'still catching up', col: ALERT },
          { label: 'Feed freshness', u: 1, txt: 'SLA blown', col: ALERT },
        ],
      },
    ],
    explain:
      'Fan-out-on-write buys cheap reads by paying at write time, so every post costs as many writes as the author has followers. That works cleanly for a median user with a few hundred followers, but a celebrity post triggers tens of millions of writes and head-of-line-blocks everyone else while the read path sits innocent.',
    fix: 'Use a hybrid strategy: keep fan-out-on-write for ordinary accounts, and switch to fan-out-on-read for the 0.001% of accounts with massive follower counts by pulling and merging their posts at read time. That split is where real production feeds converge.',
    line: '“Fan-out-on-write breaks under follower skew, so I split by follower count: push for ordinary accounts and pull at read time for the celebrity few so one post never explodes into 40M writes.”',
  },

  {
    id: 'counter',
    title: 'The One Hot Key',
    tier: 'subtle',
    par: 55,
    reqs: 'Global API rate limiter · 500k requests/sec across the fleet · one enforced limit',
    brief:
      'Every incoming request runs INCR ratelimit:global in Redis and checks the total against the cap. It is atomic, accurate, and backed by one source of truth. Redis is famously fast, yet INCR latency keeps climbing and one Redis core is pinned at 100%. Click the weak point.',
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
        cap: 'Under light load, a few thousand INCRs/sec hit the key. Sub-millisecond and exact.',
        bars: [
          { label: 'INCR ratelimit:global', u: 0.05, col: MEM },
          { label: 'Redis core serving the key', u: 0.1, col: COMPUTE },
        ],
      },
      {
        cap: 'At 500k INCRs/sec, every request lands on the same key, which lives on one shard and runs on one core.',
        bars: [
          { label: 'INCR ratelimit:global', u: 1, txt: '500k/s', col: NET },
          { label: 'Redis core serving the key', u: 1, txt: '100%, one core', col: ALERT },
        ],
      },
      {
        cap: 'One core handles ~100k ops/sec, so five cores of traffic funnel into one and wait in line.',
        bars: [
          { label: 'Effective throughput', u: 0.2, txt: '100k of 500k', col: ALERT },
          { label: 'INCR latency', u: 1, txt: 'queuing', col: ALERT },
        ],
      },
      {
        cap: 'Adding more Redis nodes changes nothing because a single global key cannot be split across them.',
        bars: [
          { label: 'Extra Redis nodes', u: 0.05, txt: 'idle', col: STORAGE },
          { label: 'The hot core', u: 1, txt: 'still 100%', col: ALERT },
        ],
      },
    ],
    explain:
      'A single logical counter becomes a single physical hot spot because one key lives on one shard and serializes on one CPU core (~100k ops/sec). Atomicity and correctness were never broken, but aiming 500k/sec at one key leaves no room to shard it away.',
    fix: 'Accept slight approximation for scale: split the counter into N sub-counters (such as ratelimit:global:{0..15}) where each edge increments a random shard and sums them, or give each edge a local token bucket that reconciles with the global count every few hundred ms. You trade millisecond-exactness for N× throughput, a bargain any rate limiter can afford.',
    line: '“A global counter is a global hot key, so I shard it into N sub-counters or sync local token buckets, trading millisecond-exactness for N× throughput.”',
  },

  {
    id: 'retrystorm',
    title: 'The Synchronized Retry',
    tier: 'subtle',
    par: 55,
    reqs: 'Payment workers ×5000 · downstream gateway occasionally blips for ~1s · retry with exponential backoff',
    brief:
      'The retry logic reads like a textbook: on failure, wait 1s, then 2s, then 4s, with exponential backoff capped at 5 attempts. Then the payment gateway blips for a single second, and your own fleet knocks it flat over and over. Click the weak point.',
    nodes: [
      { id: 'workers', x: 10, y: 100, label: 'Workers ×5000' },
      { id: 'backoff', x: 185, y: 100, label: 'Backoff policy', sub: '1s · 2s · 4s, no jitter', chip: true },
      { id: 'gw', x: 375, y: 100, label: 'Payment gateway' },
    ],
    edges: [
      { a: 'workers', b: 'backoff' },
      { a: 'backoff', b: 'gw', label: 'retry' },
    ],
    flaw: 'backoff',
    frames: [
      {
        cap: 'Steady state: traffic flows to the gateway comfortably below its ceiling.',
        bars: [
          { label: 'Gateway load', u: 0.3, col: NET },
          { label: 'In-flight failures', u: 0, col: COMPUTE },
        ],
      },
      {
        cap: 'The gateway blips for 1s. Roughly 5000 in-flight requests fail at almost the exact same moment.',
        bars: [
          { label: 'Gateway load', u: 0, txt: 'blip', col: ALERT },
          { label: 'In-flight failures', u: 1, txt: '5000 at once', col: ALERT },
        ],
      },
      {
        cap: 'Exactly 1s later, with no jitter, all 5000 workers retry in lockstep and flatten the recovering gateway.',
        bars: [
          { label: 'Gateway load', u: 3, txt: '5000 in one tick', col: ALERT },
          { label: 'Gateway (just recovered)', u: 1, txt: 'knocked over', col: ALERT },
        ],
      },
      {
        cap: 'Two seconds later they strike in unison again. The retries now hurt far more than the 1s blip.',
        bars: [
          { label: 'Gateway load', u: 3, txt: 'spike, spike, spike', col: ALERT },
          { label: 'Steady demand', u: 0.3, txt: 'would have been fine', col: MEM },
        ],
      },
    ],
    explain:
      'Exponential backoff without jitter puts every worker on the exact same metronome. The shared 1s blip synchronizes the fleet, and deterministic delays keep those 5000 retries crashing into the gateway together as a thundering herd on every wave.',
    fix: 'Add jitter so each worker waits a random duration in [0, backoff] instead of the exact backoff interval. That spreads the 5000 retries across the window instead of stacking them on one tick. Exponential backoff and jitter belong together as one retry pattern.',
    line: '“Backoff without jitter just reschedules the stampede, so I pair exponential backoff with randomized jitter to spread retries out instead of triggering a self-inflicted DDoS.”',
    happened: 'slack-2021',
  },

  {
    id: 'stalecache',
    title: 'The Cache That Lies',
    tier: 'subtle',
    par: 50,
    reqs: 'Product catalog · read-through cache, TTL 1h · prices change during flash sales · NFR: price shown = price charged',
    brief:
      'Reads flow through a read-through cache (miss, query DB, fill with a 1 hour TTL) and hit rates look great. Writes go straight to the database. During a flash sale, shoppers see and get charged the old price for up to an hour. Click the weak point.',
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
        cap: 'Steady state: cache and database both hold $40. Reads are fast and accurate.',
        bars: [
          { label: 'Cache value', u: 0.5, txt: '$40 ✓', col: MEM },
          { label: 'DB value', u: 0.5, txt: '$40', col: STORAGE },
        ],
      },
      {
        cap: 'A flash sale starts and the write path updates the database to $25. Nobody tells the cache.',
        bars: [
          { label: 'Cache value', u: 0.5, txt: '$40 (stale)', col: COMPUTE },
          { label: 'DB value', u: 0.5, txt: '$25', col: STORAGE },
        ],
      },
      {
        cap: 'Every read hits the cache, so customers see $40 on the page and checkout charges $40.',
        bars: [
          { label: 'Price shown', u: 1, txt: '$40 wrong', col: ALERT },
          { label: 'Price in DB', u: 0.5, txt: '$25', col: STORAGE },
        ],
      },
      {
        cap: 'That stale price sticks around for up to 1h until the TTL runs out, and support tickets flood in.',
        bars: [
          { label: 'Mischarged customers', u: 1, txt: 'up to 1h', col: ALERT },
          { label: 'Cache confidence', u: 0.5, txt: '"still fresh!"', col: COMPUTE },
        ],
      },
    ],
    explain:
      'The read path and write path disagree on who owns the truth because DB-only writes leave the cache serving stale prices until its 1h TTL expires. A TTL bounds staleness by time, while a correctness rule like “price shown = price charged” requires invalidation by event.',
    fix: 'Have every price write invalidate the cache by deleting the key (or writing through to update it) so the next read refills from the database. Save pure-TTL caching for data that can safely lag, and invalidate on write for anything tied to billing.',
    line: '“A TTL bounds staleness by time, while a correctness field needs invalidation by event, so I delete the cache key on every write rather than letting it serve a stale price.”',
  },

  {
    id: 'tango',
    title: 'The Autoscaling Death Spiral',
    tier: 'interacting',
    par: 70,
    reqs: 'Image processing · bursty uploads · unbounded inbound queue · autoscaler adds workers when queue wait-time rises',
    brief:
      'Two reasonable-looking choices sit side by side: an unbounded queue so no upload gets rejected, and an autoscaler that adds workers whenever queue wait-time rises. Each sounds sensible in isolation. Then a burst hits, the bill spikes, and latency gets worse. Click the piece that starts the spiral.',
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
        cap: 'Normal load: the queue stays nearly empty, 8 workers keep up, and wait-time is low.',
        bars: [
          { label: 'Queue backlog', u: 0.1, col: NET },
          { label: 'Workers', u: 0.2, txt: '×8', col: COMPUTE },
          { label: 'Cloud bill', u: 0.2, col: STORAGE },
        ],
      },
      {
        cap: 'An upload burst arrives. The unbounded queue accepts every request and the backlog balloons.',
        bars: [
          { label: 'Queue backlog', u: 1, txt: 'unbounded ↑', col: ALERT },
          { label: 'Workers', u: 0.4, txt: '×16', col: COMPUTE },
          { label: 'Cloud bill', u: 0.5, col: STORAGE },
        ],
      },
      {
        cap: 'The autoscaler sees high wait-time and spins up workers, missing that wait-time measures the age of the oldest message.',
        bars: [
          { label: 'Queue backlog', u: 1, txt: 'still huge', col: ALERT },
          { label: 'Workers', u: 1, txt: '×200 and climbing', col: ALERT },
          { label: 'Cloud bill', u: 1, txt: '💸', col: ALERT },
        ],
      },
      {
        cap: 'Oldest-message age stays high until the entire backlog drains, so the scaler keeps piling on workers while chasing a lagging metric.',
        bars: [
          { label: 'Queue backlog', u: 0.8, txt: 'draining', col: COMPUTE },
          { label: 'Workers', u: 1, txt: 'over-provisioned', col: ALERT },
          { label: 'Latency', u: 1, txt: 'still bad', col: ALERT },
        ],
      },
    ],
    explain:
      'Neither choice breaks on its own, yet together they create a runaway feedback loop on a lagging signal. The unbounded queue lets backlog grow without limit while queue wait-time (the age of the oldest message) stays elevated until the whole backlog clears, pushing the autoscaler to add workers long after throughput is already enough.',
    fix: 'Break both halves of the loop: cap the queue with backpressure (shed or reject past a set depth) so backlog cannot run away, and scale on a leading, rate-based signal like arrival rate or queue-depth trend instead of oldest-item age. Backpressure plus a responsive signal lets the system settle cleanly.',
    line: '“An autoscaler chasing a lagging wait-time metric behind an unbounded queue spirals out of control, so I bound the queue with backpressure and scale on arrival rate instead.”',
  },

  {
    id: 'splitbrain',
    title: 'The Split Brain',
    tier: 'interacting',
    par: 65,
    reqs: 'Primary + replica DB · automatic failover on primary timeout · clients retry failed writes · NFR: no conflicting writes',
    brief:
      'Failover is automated: if the replica cannot reach the primary for 5s, it promotes itself. Meanwhile, clients retry failed writes. A brief network blip hits between the two nodes, not an actual crash, and suddenly both believe they are primary. Click the piece that lets this happen.',
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
        cap: 'Healthy state: Primary A takes writes and Replica B follows along. One writer, one history.',
        bars: [
          { label: 'Primaries accepting writes', u: 0.3, txt: '1 (A)', col: STORAGE },
          { label: 'Write conflicts', u: 0, col: MEM },
        ],
      },
      {
        cap: 'A 3s network blip cuts B off from A. A timeout cannot tell “A is dead” from “I cannot reach A.”',
        bars: [
          { label: "B's belief", u: 0.6, txt: '"A is dead"', col: COMPUTE },
          { label: "A's reality", u: 0.6, txt: 'alive, serving', col: STORAGE },
        ],
      },
      {
        cap: 'B promotes itself anyway. Now both A and B accept writes, and retrying clients talk to both.',
        bars: [
          { label: 'Primaries accepting writes', u: 1, txt: '2, split brain', col: ALERT },
          { label: 'Write conflicts', u: 1, txt: 'same rows, both sides', col: ALERT },
        ],
      },
      {
        cap: 'When the link heals, you are stuck with two divergent histories and no safe merge. Writes are lost.',
        bars: [
          { label: 'Divergent copies', u: 1, txt: '2 truths', col: ALERT },
          { label: 'Reconcilable?', u: 1, txt: 'no', col: ALERT },
        ],
      },
    ],
    explain:
      'Two choices collide here: a replica promotes itself on a local timeout (which cannot distinguish a dead peer from an unreachable one), and clients retry against whichever node responds. A simple network partition then produces two primaries in split brain, each accepting conflicting writes.',
    fix: 'Require a quorum (a majority of voters, or an external witness/arbiter) to elect a primary. With an odd number of voters, a minority partition can never promote itself, so at most one primary exists at a time. Let consensus (Raft, Paxos, or Patroni with etcd) decide leadership instead of a local timeout.',
    line: '“Never let a node promote itself on a timeout because a timeout cannot tell dead from unreachable; require a quorum so a partition yields zero or one primary, never two.”',
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
      'A teammate puts a plain box-and-arrows sketch on the board: one app server, one Postgres primary, and one small Redis cache. No shards, no queue, no replicas. Half the room wants to “harden” it with Kafka and a sharded database. Before you point at anything, check the requirements: accuse a component, or declare the design sound.',
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
        cap: 'Peak traffic hits 50 req/s on an app server comfortable near ~10,000 req/s.',
        bars: [
          { label: 'App server', u: 0.005, txt: '0.5%', col: COMPUTE },
          { label: 'Postgres', u: 0.01, txt: 'idle', col: STORAGE },
          { label: 'Redis cache', u: 0.002, txt: 'barely used', col: MEM },
        ],
      },
      {
        cap: 'Reads run ~45/s against a Postgres primary built to serve ~20,000/s. Practically a rounding error.',
        bars: [
          { label: 'Postgres reads', u: 0.01, txt: '45 of 20k', col: STORAGE },
          { label: 'Postgres writes', u: 0.005, col: STORAGE },
          { label: 'Headroom', u: 0.02, txt: '~200× spare', col: MEM },
        ],
      },
      {
        cap: 'Every box stays green with two-plus orders of magnitude to spare. Nothing is anywhere near a wall.',
        bars: [
          { label: 'App server', u: 0.005, col: COMPUTE },
          { label: 'Postgres', u: 0.01, col: STORAGE },
          { label: 'Redis cache', u: 0.002, col: MEM },
        ],
      },
      {
        cap: 'Shards, queues, and replicas would each bring new failure modes and cost to solve problems you do not have.',
        bars: [
          { label: 'Requirements met', u: 1, txt: 'all', col: MEM },
          { label: 'Complexity added', u: 0, txt: 'none needed', col: MEM },
        ],
      },
    ],
    flaw: 'db',
    explain:
      'Nothing in this sketch violates the requirements, and recognizing that is the real test. At 50 req/s and a few GB of data, one Postgres primary sits near 0.5% of its ceiling, the app server idles, and Redis is barely needed. Adding sharding, queues, or replicas buys operational complexity, new failure modes, and a higher bill without serving a single requirement.',
    fix: 'Ship it as drawn. Add a nightly backup and a health check, then revisit only when a real number moves: data outgrows one box, reads outgrow one primary, or an SLA tightens. The useful review question is “what would have to change for this to break?”, not “what else can I add?”',
    line: '“The requirements decide the architecture: at 50 req/s, a single Postgres is the right call, not a risk, and I add complexity only when a real number demands it.”',
  },
]

// Serve puzzles along the difficulty ladder (stable sort keeps the seed
// scheduler set — Sawtooth — first, so deep links and e2e stay put).
export const PUZZLES: Puzzle[] = RAW.slice().sort((a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier])
