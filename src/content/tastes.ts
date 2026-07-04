// Taste tests (docs/content-pipeline.md §4). Exactly one ok:true justification;
// the three wrong ones each embody a named bad habit (absolutist, vendor-brain,
// misapplied virtue / irrelevant-truth). flip = "The Tables Turn" (law L5).

export interface TasteWhy {
  t: string
  ok: boolean
  why: string
}

export interface Taste {
  prompt: string
  a: { name: string; desc: string }
  b: { name: string; desc: string }
  ans: 'a' | 'b'
  whys: TasteWhy[]
  flip: string
}

export const TASTES: Taste[] = [
  {
    prompt: 'Distributed job scheduler. NFRs: 10k jobs/sec created · every job executes within 2s of its scheduled time.',
    a: {
      name: 'Design A — Two-phase + delayed delivery',
      desc: 'Watcher polls once per 5-min window for jobs due in the NEXT window; enqueues each to SQS with per-job delayed delivery (the queue releases it at its exact second). Jobs created inside the window bypass the Watcher, straight to the queue.',
    },
    b: {
      name: 'Design B — Tight polling loop',
      desc: 'A scheduler service polls the jobs table every 2 seconds for anything due right now and dispatches immediately to workers. Simple, one moving part, obviously meets the 2s SLA.',
    },
    ans: 'a',
    whys: [
      {
        t: 'Polling is an anti-pattern; event-driven is always better.',
        ok: false,
        why: 'Absolutist. Design A polls too! Polling is fine — the question is what each poll costs and what precision it must deliver.',
      },
      {
        t: "A scans the DB once per window and delegates precision to the queue's delay feature; B must scan a 10k-jobs/sec table every 2 seconds forever — enormous repeated reads to meet the same SLA.",
        ok: true,
        why: "This is the actual mechanism: separate discovery (cheap, infrequent) from precision (the queue's delayed delivery). Same SLA, ~1% of the DB load.",
      },
      {
        t: 'A is better because SQS is managed and serverless.',
        ok: false,
        why: 'Vendor-brained. A self-hosted queue with delayed delivery (RabbitMQ, Redis sorted sets) gives the same architectural win. The idea, not the logo, is the answer.',
      },
      {
        t: 'B is better: simplest thing that meets the requirement.',
        ok: false,
        why: "Simplicity is a genuine virtue and B WOULD win at small scale — a startup's cron table should absolutely be a 2s polling loop. At 10k jobs/sec the polling cost breaks it. Taste = fit to the numbers, and the numbers here say no.",
      },
    ],
    flip: "When does B win? At 50 jobs/minute. A polling loop on Postgres is bulletproof, debuggable, and done by lunch. Reaching for Design A at that scale is resume-driven engineering — ALSO a taste failure. The design isn't good or bad; the (design, requirements) PAIR is.",
  },
  {
    prompt:
      "Storage for the scheduler's executions. NFRs: 10k writes/sec sustained, billions of rows · availability ≫ consistency · pure key-value access (write status, read by id/time-bucket).",
    a: {
      name: 'Design A — PostgreSQL primary + replicas',
      desc: 'One Postgres primary for writes, read replicas for queries. Rich SQL, transactions, joins, the ecosystem everyone knows.',
    },
    b: {
      name: 'Design B — DynamoDB / Cassandra',
      desc: 'Partitioned key-value store: writes scale horizontally with partitions, tunable/eventual consistency, multi-node availability by default.',
    },
    ans: 'b',
    whys: [
      {
        t: "Postgres can't handle scale; NoSQL is what serious companies use.",
        ok: false,
        why: "Absolutist and false — Postgres serves enormous companies. The reasoning has to come from THIS system's requirements, not vibes about seriousness.",
      },
      {
        t: "The requirements literally describe a partitioned KV store: no joins or cross-row transactions needed, availability explicitly beats consistency, uniform access by key. Postgres's superpowers (transactions, rich queries) would be UNUSED while its single-primary write ceiling is exactly the wall this workload hits.",
        ok: true,
        why: "The taste move: list what each tool is great at, check which strengths this workload actually exercises. Paying Postgres's constraints while using none of its powers is a bad trade.",
      },
      {
        t: 'B is better because eventual consistency is faster.',
        ok: false,
        why: "Half-true but not the reason — plenty of eventually-consistent systems are slow, and speed wasn't the stated requirement. Availability-over-consistency was, which is a CAP posture, not a speed claim.",
      },
      {
        t: 'A is better because SQL makes the status queries easier to write.',
        ok: false,
        why: 'True and irrelevant at this scale: the access pattern shown is get/put by key. Developer convenience is a real factor — it just loses to a hard scaling wall in THIS spec.',
      },
    ],
    flip: "When does A win? The moment requirements say 'exactly-once billing' or 'complex reporting across users' — transactions and joins earn their constraints. Also at modest scale, where one Postgres box outruns your whole company. Never say 'X is better than Y' in an interview; say 'X is better HERE, because these requirements exercise X's strengths.'",
  },
]
