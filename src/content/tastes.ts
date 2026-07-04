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
  {
    prompt:
      'Send a welcome email on signup. NFRs: signup response p99 < 200ms · 50k signups/hour · the email provider is a third party (~800ms, occasionally flaky).',
    a: {
      name: 'Design A — Send inline',
      desc: 'The signup request calls the email API and only returns once the email has been accepted. One code path, no extra moving parts.',
    },
    b: {
      name: 'Design B — Enqueue the email',
      desc: 'Signup writes the user and drops an email job on a queue, returning immediately. A worker sends the email and retries on failure.',
    },
    ans: 'b',
    whys: [
      {
        t: 'Synchronous calls are an anti-pattern; everything user-facing should be a queue.',
        ok: false,
        why: 'Absolutist. Plenty of work SHOULD be synchronous — a password check, a payment authorization the user is waiting on. The test is whether the caller needs the result to proceed.',
      },
      {
        t: "The account can exist before the email has sent, so B decouples a fast, must-succeed write from a slow, may-retry side effect. A welds a 200ms promise to an 800ms flaky dependency — every provider hiccup becomes a signup failure.",
        ok: true,
        why: 'The mechanism: separate what the user waits on (the write) from what they don\'t (the email). The queue absorbs the latency and the flakiness, and retries make the email eventually-succeed without blocking signup.',
      },
      {
        t: 'B is better because a managed queue like SQS or Kafka is industrial-strength and scalable.',
        ok: false,
        why: 'Vendor-brained. The win is decoupling latency and failure domains — even a humble "email_outbox" table polled by a cron gives you the same architectural benefit. The idea, not the brand.',
      },
      {
        t: 'A is simpler — one code path, no worker to run, easier to reason about and debug.',
        ok: false,
        why: "Misapplied virtue. Simplicity is real and A would be fine if the provider were instant and reliable. Here it chains your 200ms SLA to an 800ms flaky third party — the constraint beats the tidiness.",
      },
    ],
    flip: "When does A win? When the user must SEE the side effect's result before continuing — a payment authorization, a username-uniqueness check, a document they're about to download. Then synchronous is correct and a queue only adds a race and a 'where's my thing?' bug. Async isn't a virtue; it fits exactly when the caller can walk away.",
  },
  {
    prompt:
      "Store for a social post's 'like' count. 50k likes/sec on hot posts · the displayed total may be slightly stale · but a user's like must never be lost.",
    a: {
      name: 'Design A — Strong, one row',
      desc: 'Every like is a synchronous, linearizable increment on a single likes row inside a transaction. The number is always exactly right.',
    },
    b: {
      name: 'Design B — Append + aggregate',
      desc: 'Likes append to a durable log / sharded counters; the displayed total is aggregated asynchronously and is eventually consistent.',
    },
    ans: 'b',
    whys: [
      {
        t: 'Eventual consistency is sloppy; anything worth building keeps its data strongly consistent.',
        ok: false,
        why: 'Absolutist. Strong consistency is a cost you pay for a reason; where the requirement tolerates staleness, insisting on it just buys a bottleneck. Fit, not dogma.',
      },
      {
        t: 'The spec tolerates a stale TOTAL but not a lost like — exactly what B delivers: durable appends, async rollup. A\'s single-row linearizable increment is a hot-row bottleneck at 50k/s, guaranteeing a guarantee nobody asked for.',
        ok: true,
        why: "Read the requirement literally: staleness is licensed, loss is not. B matches both; A pays a serialization tax on one row to provide exactness the product explicitly said it doesn't need.",
      },
      {
        t: 'A is better because transactions are ACID, and ACID prevents data anomalies.',
        ok: false,
        why: "Irrelevant truth. ACID is real, but a lone counter has no multi-row invariant to protect — there's no anomaly here that matters to the requirement. A correct fact that doesn't decide this case.",
      },
      {
        t: 'A is better: showing the exact, real-time count is a nicer experience for users.',
        ok: false,
        why: 'Misapplied virtue. Accuracy is genuinely nice, but the spec already licensed a slightly stale total, and at 50k/s the hot-row wall makes that niceness a scaling failure. Attractive, and wrong here.',
      },
    ],
    flip: "When does A win? Swap 'like count' for a wallet balance or 'seats left at a concert.' The instant an invariant rides on the exact value — can't go negative, can't oversell — eventual consistency becomes a double-spend bug and strong consistency earns every bit of its cost. Same two designs; the requirement flips the winner.",
  },
  {
    prompt:
      'Architecture for a brand-new product. Team of 4 engineers · pre-product-market-fit · ~100 req/s · requirements change weekly.',
    a: {
      name: 'Design A — Modular monolith',
      desc: 'One deployable app with clear internal module boundaries and a single database. Refactors are atomic; one thing to deploy.',
    },
    b: {
      name: 'Design B — Microservices',
      desc: 'Eight independently deployed services, each with its own repo and database, wired over the network, from day one.',
    },
    ans: 'a',
    whys: [
      {
        t: 'Microservices are the modern, scalable architecture; a monolith is legacy tech debt.',
        ok: false,
        why: 'Absolutist / cargo-cult. Monoliths run enormous companies; microservices are a tool with a cost, not a maturity badge. The reasoning must come from this team and this scale.',
      },
      {
        t: "At 4 engineers and 100 req/s the binding constraint is iteration speed, not scaling — and a monolith gives atomic refactors, one deploy, one DB, local calls. B spends a tiny team's budget on network boundaries and distributed debugging it doesn't need yet.",
        ok: true,
        why: 'Name the actual constraint: coordination cost dominates when the team is small and the product is still moving. The monolith minimizes exactly that; premature service boundaries freeze a design that changes weekly.',
      },
      {
        t: 'B is better because Kubernetes and service meshes make microservices easy now.',
        ok: false,
        why: "Vendor-brained. Better tooling lowers the cost of services; it doesn't create a benefit. You'd be buying org-scaling machinery to solve a problem four people at 100 req/s don't have.",
      },
      {
        t: 'B enforces clean boundaries and lets each service scale independently.',
        ok: false,
        why: 'Misapplied virtue. Boundaries are real value — but they can be enforced INSIDE a monolith with modules, and independent scaling solves nothing at 100 req/s. Genuinely tempting, wrong for this stage.',
      },
    ],
    flip: "When does B win? When the TEAM outgrows the codebase — dozens of engineers colliding on one deploy, subsystems with wildly different scaling or compliance needs, release cadences that must diverge. Microservices are an org-scaling tool first and a tech-scaling tool second: reach for them when coordination cost, not request rate, is the pain.",
  },
  {
    prompt:
      'Pipeline for a daily-active-users dashboard. Reviewed by the business each morning · ~10 billion events/day · cost-sensitive.',
    a: {
      name: 'Design A — Nightly batch',
      desc: "A scheduled job recomputes yesterday's metrics from the event warehouse overnight; the dashboard reads the finished rollup.",
    },
    b: {
      name: 'Design B — Streaming pipeline',
      desc: 'A Kafka + stream-processor pipeline updates the metrics continuously, keeping the dashboard fresh to the second, 24/7.',
    },
    ans: 'a',
    whys: [
      {
        t: 'Real-time always beats batch — nobody wants to look at stale data.',
        ok: false,
        why: 'Absolutist. Freshness only matters if someone acts on it sooner; here the data is read once a morning, so "stale by hours" is invisible. Match freshness to the consumer.',
      },
      {
        t: 'The dashboard is read once a day, so a nightly rollup matches the requirement exactly — at a fraction of the cost and ops of B, which pays for 24/7 streaming and on-call to deliver freshness no one consumes.',
        ok: true,
        why: 'The consumer\'s cadence is the spec. A daily decision wants a daily pipeline; batch is cheaper, simpler, and easier to backfill, and it hits the "ready by morning" bar precisely.',
      },
      {
        t: 'B is better because fresher data is inherently more valuable.',
        ok: false,
        why: "Misapplied virtue. Freshness is real value — but the SLA is 'ready by morning,' and paying for sub-second updates a once-a-day reviewer never sees is spending for a virtue the requirement doesn't reward.",
      },
      {
        t: 'B is better because Kafka and Flink are the modern data stack.',
        ok: false,
        why: "Vendor-brained. The fashionable stack doesn't change the shape of the problem — a daily rollup is a batch job whether or not the logo is trendy.",
      },
    ],
    flip: "When does B win? The moment a human or system acts on the metric in seconds — fraud scoring, a live ops dashboard during an incident, real-time personalization, alerting. As the DECISION latency drops below a day, batch's cost edge evaporates and streaming earns its keep. Match pipeline freshness to the decision cadence, never to fashion.",
  },
]
