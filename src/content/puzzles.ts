// Find-the-Flaw puzzles (docs/content-pipeline.md §3). Seeded from the
// distributed job scheduler design. Spec 050 grows this to 12 on the ladder
// single-obvious → single-subtle → interacting → "actually fine".

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

export interface Puzzle {
  id: string
  title: string
  reqs: string
  brief: string
  nodes: PuzzleNode[]
  edges: { a: string; b: string; label?: string }[]
  flaw: string
  frames: PuzzleFrame[]
  explain: string
  fix: string
  line: string
}

// Channel hints for bars use raw hex to stay serializable data.
const NET = '#53DCEC'
const COMPUTE = '#F6BB52'
const STORAGE = '#EF7BD0'
const MEM = '#72EAA8'
const ALERT = '#F26D5E'

export const PUZZLES: Puzzle[] = [
  {
    id: 'sawtooth',
    title: 'The Sawtooth Scheduler',
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
]
