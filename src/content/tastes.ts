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
      name: 'Design A: Two-phase + delayed delivery',
      desc: 'A Watcher polls once per 5-min window for jobs due in the next window and enqueues each to SQS with per-job delayed delivery, so the queue releases it on its exact second. Jobs created inside the current window skip the Watcher and go straight to the queue.',
    },
    b: {
      name: 'Design B: Tight polling loop',
      desc: 'A scheduler service polls the jobs table every 2 seconds for anything due right now and dispatches straight to workers. Simple, one moving part, and it clearly meets the 2s SLA.',
    },
    ans: 'a',
    whys: [
      {
        t: 'Polling is an anti-pattern; event-driven is always better.',
        ok: false,
        why: 'Absolutist. Design A polls too! Polling is fine on its own; what matters is what each poll costs and what precision it has to deliver.',
      },
      {
        t: "A scans the DB once per window and lets the queue's delay feature handle timing precision; B has to scan a 10k-jobs/sec table every 2 seconds forever, burning enormous repeated reads for the same SLA.",
        ok: true,
        why: "That is the actual mechanism: separate discovery (cheap and infrequent) from precision (the queue's delayed delivery). Same 2s SLA, roughly 1% of the DB load.",
      },
      {
        t: 'A is better because SQS is managed and serverless.',
        ok: false,
        why: 'Vendor-brained. A self-hosted queue with delayed delivery, like RabbitMQ or Redis sorted sets, gives you the same win. The architecture is the answer, not the logo.',
      },
      {
        t: 'B is better: it is the simplest thing that meets the requirement.',
        ok: false,
        why: "Misapplied virtue. Simplicity matters, and B would win at small scale, like a startup's cron table running on a 2s polling loop. At 10k jobs/sec, the polling cost breaks it. Good taste means fitting the numbers in front of you.",
      },
    ],
    flip: "When does B win? At 50 jobs/minute. A 2s polling loop on Postgres is boring, debuggable, and shipped before lunch. Reaching for Design A at that scale is resume-driven engineering, which is a taste failure too. A design is rarely good or bad on its own; the pairing with the requirements is.",
  },
  {
    prompt:
      "Storage for the scheduler's executions. NFRs: 10k writes/sec sustained, billions of rows · availability ≫ consistency · pure key-value access (write status, read by id/time-bucket).",
    a: {
      name: 'Design A: PostgreSQL primary + replicas',
      desc: 'One Postgres primary for writes and read replicas for queries. Rich SQL, transactions, joins, and an ecosystem every engineer already knows.',
    },
    b: {
      name: 'Design B: DynamoDB / Cassandra',
      desc: 'Partitioned key-value store: writes scale horizontally across partitions, with tunable or eventual consistency and multi-node availability by default.',
    },
    ans: 'b',
    whys: [
      {
        t: "Postgres can't handle scale; NoSQL is what serious companies use.",
        ok: false,
        why: 'Absolutist and untrue. Postgres powers huge companies; the case has to come from these specific requirements, not status myths about NoSQL.',
      },
      {
        t: "The requirements map straight onto a partitioned KV store: no joins or cross-row transactions, availability explicitly beats consistency, and every access is by key. Postgres's strengths (transactions, rich queries) would sit unused while its single-primary write ceiling is the exact wall this workload hits.",
        ok: true,
        why: "That is the core taste move: check which strengths a workload actually exercises. Paying for Postgres's single-primary constraint while leaving its superpowers idle is a lopsided trade.",
      },
      {
        t: 'B is better because eventual consistency is faster.',
        ok: false,
        why: 'Half-true and beside the point. Plenty of eventually consistent systems are slow, and raw speed was not the requirement here. Availability over consistency was, which is a CAP tradeoff, not a latency claim.',
      },
      {
        t: 'A is better because SQL makes status queries easier to write.',
        ok: false,
        why: 'True, and outweighed here. The access pattern is already simple get and put by key; developer convenience matters, but it loses to a hard write-scaling wall in this spec.',
      },
    ],
    flip: "When does A win? The moment the spec asks for exactly-once billing or complex reporting across users, transactions and joins earn every bit of their cost. It also wins at modest scale, where one Postgres box comfortably outruns your traffic. Avoid saying X beats Y in the abstract; say X fits here because these requirements use what X is built for.",
  },
  {
    prompt:
      'Send a welcome email on signup. NFRs: signup response p99 < 200ms · 50k signups/hour · the email provider is a third party (~800ms, occasionally flaky).',
    a: {
      name: 'Design A: Send inline',
      desc: 'The signup request calls the email API and waits for acceptance before returning. One code path, no extra moving parts.',
    },
    b: {
      name: 'Design B: Enqueue the email',
      desc: 'Signup writes the user, drops an email job onto a queue, and returns right away. A worker sends the email and retries if the provider hiccups.',
    },
    ans: 'b',
    whys: [
      {
        t: 'Synchronous calls are an anti-pattern; everything user-facing should be a queue.',
        ok: false,
        why: 'Absolutist. Plenty of work belongs on the synchronous path, like a password check or a payment authorization the user is waiting on. The test is whether the caller needs the result before moving on.',
      },
      {
        t: 'The account can exist before the email lands, so B separates a fast, must-succeed write from a slow, retryable side effect. A welds a 200ms promise to an 800ms flaky dependency, turning every provider blip into a failed signup.',
        ok: true,
        why: 'That is the mechanism: split what the user waits on (account creation) from what can happen seconds later (the email). The queue absorbs the latency and flakiness, and retries handle transient failures without blocking signup.',
      },
      {
        t: 'B is better because a managed queue like SQS or Kafka is industrial-strength and scalable.',
        ok: false,
        why: 'Vendor-brained. The win comes from decoupling latency and failure domains; even a humble "email_outbox" table polled by a cron delivers the same architectural separation. Pick the mechanism, not the brand.',
      },
      {
        t: 'A is simpler: one code path, no worker to operate, and easier to trace when something breaks.',
        ok: false,
        why: 'Misapplied virtue. Simplicity is real, and A would be completely fine if the email provider were fast and rock-solid. Here it chains your 200ms SLA to an 800ms flaky third party, so the latency budget beats the tidiness.',
      },
    ],
    flip: "When does A win? Whenever the user has to see the result before continuing, such as a payment authorization, a username-uniqueness check, or a file they are about to download. In those cases synchronous is right, and a queue only introduces a race and a missing-result bug. Async is not a universal upgrade; it fits when the caller can safely walk away.",
  },
  {
    prompt:
      "Store for a social post's 'like' count. 50k likes/sec on hot posts · the displayed total may be slightly stale · but a user's like must never be lost.",
    a: {
      name: 'Design A: Strong, one row',
      desc: 'Every like runs as a synchronous, linearizable increment on a single likes row inside a transaction. The displayed count is always exact.',
    },
    b: {
      name: 'Design B: Append + aggregate',
      desc: 'Likes append to a durable log or sharded counters; the displayed total is rolled up asynchronously and is eventually consistent.',
    },
    ans: 'b',
    whys: [
      {
        t: 'Eventual consistency is sloppy; anything worth building keeps its data strongly consistent.',
        ok: false,
        why: 'Absolutist. Strong consistency carries a real coordination cost; when the spec explicitly tolerates a stale display, insisting on it only buys you a bottleneck.',
      },
      {
        t: "The spec allows a stale total but forbids losing a like, which is exactly what B gives you through durable appends and async rollups. A's single-row linearizable increment creates a hot-row bottleneck at 50k/s for exactness nobody asked for.",
        ok: true,
        why: 'Read the requirement closely: staleness is allowed, data loss is not. B honors both, while A pays a serialization tax on one row to uphold a guarantee the product explicitly waived.',
      },
      {
        t: 'A is better because transactions are ACID, and ACID prevents data anomalies.',
        ok: false,
        why: 'Irrelevant truth. ACID is real, but a lone counter has no multi-row invariant to guard, so there is no anomaly here that matters to the spec. A true statement that still does not decide the call.',
      },
      {
        t: 'A is better: showing the exact, real-time count is a nicer experience for users.',
        ok: false,
        why: 'Misapplied virtue. Exactness sounds appealing, but the spec already allows a slightly stale total. At 50k/s, that extra polish turns a hot row into a scaling wall.',
      },
    ],
    flip: "When does A win? Swap 'like count' for a wallet balance or 'seats left at a concert.' The second a hard invariant depends on the exact number, like never going negative or never overselling, eventual consistency turns into a double-spend bug and strong consistency earns its cost. Same two designs, opposite winner.",
  },
  {
    prompt:
      'Architecture for a brand-new product. Team of 4 engineers · pre-product-market-fit · ~100 req/s · requirements change weekly.',
    a: {
      name: 'Design A: Modular monolith',
      desc: 'One deployable app with clean internal module boundaries and a single database. Refactors stay atomic and there is only one service to deploy.',
    },
    b: {
      name: 'Design B: Microservices',
      desc: 'Eight independently deployed services, each with its own repo and database, talking over the network from day one.',
    },
    ans: 'a',
    whys: [
      {
        t: 'Microservices are the modern, scalable architecture; a monolith is legacy tech debt.',
        ok: false,
        why: 'Absolutist. Monoliths run huge companies, and microservices are a tool with real overhead rather than a badge of maturity. Tie the choice to this team and this traffic.',
      },
      {
        t: "At 4 engineers and 100 req/s, the real bottleneck is iteration speed, not throughput. A monolith gives you atomic refactors, one deploy, one DB, and local function calls, whereas B burns a tiny team's time on network boundaries and distributed debugging it does not need yet.",
        ok: true,
        why: 'Name the binding constraint: when a small team is still discovering the product, coordination overhead dominates. A modular monolith keeps changes cheap, while early service boundaries harden seams that are still moving every week.',
      },
      {
        t: 'B is better because Kubernetes and service meshes make microservices easy now.',
        ok: false,
        why: 'Vendor-brained. Good tooling lowers the tax of running many services, but it does not invent a reason to have them. Four engineers at 100 req/s would still be paying for org-scaling machinery they do not need.',
      },
      {
        t: 'B enforces clean boundaries and lets each service scale independently.',
        ok: false,
        why: 'Misapplied virtue. Clean boundaries are valuable, and you can build them inside a monolith with modules. Independent scaling is tempting in theory, too, but at 100 req/s it solves a problem you do not have.',
      },
    ],
    flip: "When does B win? When the team outgrows the single codebase: dozens of engineers colliding on one deploy, subsystems with sharply different scaling or compliance needs, or release schedules that have to move apart. Microservices solve organizational friction first and traffic scaling second. Reach for them when team coordination, not request rate, is what hurts.",
  },
  {
    prompt:
      'Pipeline for a daily-active-users dashboard. Reviewed by the business each morning · ~10 billion events/day · cost-sensitive.',
    a: {
      name: 'Design A: Nightly batch',
      desc: "A scheduled job recomputes yesterday's metrics from the event warehouse overnight, and the dashboard serves the finished rollup.",
    },
    b: {
      name: 'Design B: Streaming pipeline',
      desc: 'A Kafka plus stream-processor pipeline updates metrics continuously, keeping the dashboard fresh to the second, 24/7.',
    },
    ans: 'a',
    whys: [
      {
        t: 'Real-time always beats batch; nobody wants to look at stale data.',
        ok: false,
        why: 'Absolutist. Freshness only pays off if someone acts on it sooner. Here the numbers are read once each morning, so being hours behind overnight is invisible to the reader.',
      },
      {
        t: 'The dashboard is checked once a day, so a nightly rollup fits the requirement directly at a fraction of the cost and operational load. B pays for 24/7 streaming infrastructure and on-call support to deliver freshness nobody looks at.',
        ok: true,
        why: 'The consumer cadence sets the spec. A daily decision wants a daily pipeline: batch is cheaper, simpler to operate, easier to backfill, and hits the "ready by morning" bar cleanly.',
      },
      {
        t: 'B is better because fresher data is inherently more valuable.',
        ok: false,
        why: "Misapplied virtue. Freshness has real value when it changes a decision, but the SLA here is 'ready by morning.' Paying for sub-second updates a once-a-day viewer never sees spends budget on something the spec does not reward.",
      },
      {
        t: 'B is better because Kafka and Flink are the modern data stack.',
        ok: false,
        why: 'Vendor-brained. Fashion does not change the shape of the problem. A daily rollup is a batch workload regardless of which logos are popular this year.',
      },
    ],
    flip: "When does B win? The instant a person or system has to react in seconds: fraud scoring, a live ops dashboard during an outage, real-time personalization, or alerting. Once decision latency shrinks well below a day, batch loses its advantage and streaming earns its keep. Match pipeline freshness to how fast decisions happen, not to trends.",
  },
]
