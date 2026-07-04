// Interrogations (docs/content-pipeline.md §10 — Law L8: requirements are
// extracted, not given). A vague stakeholder pitch + ~10 clarifying questions of
// mixed information value, each costing a slice of a 6-interview-minute budget.
// EXACTLY ONE question is `crucial: true` — skip it and its `trapForUnasked`
// fires mid-build. The `requirementsMatrix` is the ground-truth spec each
// answer crystallizes; `fromQ` attributes a requirement to the question that
// reveals it (or -1 if only the trap surfaces it).

export interface InterroQuestion {
  /** the clarifying question the player can buy */
  text: string
  /** interview-minutes it costs to ask (0.5–1.5) */
  cost: number
  /** the stakeholder's answer */
  reveals: string
  /** exactly one per interrogation — the one that, unasked, becomes the trap */
  crucial: boolean
  /** information value 1..5 — drives the post-mortem ranking */
  value: number
  /** what buying this answer would have changed about the design */
  changes: string
}

export interface Requirement {
  /** a crystallized requirement */
  req: string
  /** index into questions[] that reveals it (-1 = surfaces only via the trap) */
  fromQ: number
}

export interface Interrogation {
  id: string
  title: string
  /** the vague ask, in the stakeholder's own words */
  stakeholderPitch: string
  /** display-only budget in interview-minutes (not a wall-clock timer) */
  budget: number
  /** ~10 questions of mixed value; sum of costs must exceed budget */
  questions: InterroQuestion[]
  /** fires mid-build if the crucial question was never asked */
  trapForUnasked: { headline: string; body: string; lesson: string }
  /** the ground-truth spec the answers crystallize */
  requirementsMatrix: Requirement[]
}

export const INTERROGATIONS: Interrogation[] = [
  {
    id: 'notifications',
    title: 'Add notifications',
    stakeholderPitch:
      "Users keep telling us they miss important stuff. Leadership wants us to “add notifications” this quarter. You’re the eng lead — can your team knock that out? It doesn’t sound that hard.",
    budget: 6,
    questions: [
      {
        text: 'Which events trigger a notification — and who decides the list?',
        cost: 1,
        reveals: 'Start with three: payment failed, someone replied to you, and your export finished. Product will add more later.',
        crucial: false,
        value: 3,
        changes: 'Bounds the trigger surface to three event types, not an open-ended firehose product can grow at will.',
      },
      {
        text: 'What channels do we send on — in-app, email, push, SMS?',
        cost: 1,
        reveals: 'In-app for all of them. Email for the payment one too. No SMS — too expensive.',
        crucial: false,
        value: 4,
        changes: 'Fan-out is per-channel: email needs templates + a provider, in-app needs a store and read-state. Two delivery paths, not one.',
      },
      {
        text: 'For the payment-failed alert, is it OK if a user occasionally never receives it?',
        cost: 1.5,
        reveals: "Absolutely not. If a card fails and they don't hear it, they churn and we eat the loss. That one MUST arrive.",
        crucial: true,
        value: 5,
        changes:
          'This is the delivery-guarantee question. Payment-failed needs at-least-once with retries and a dead-letter queue; the social pings can stay best-effort. Two reliability tiers, not one.',
      },
      {
        text: 'What volume are we talking about at peak — notifications per second?',
        cost: 1,
        reveals: 'Maybe 500/sec during a marketing blast, low hundreds normally.',
        crucial: false,
        value: 3,
        changes: 'Modest volume: a single queue and a worker pool cover it. No sharding or fan-out service needed yet.',
      },
      {
        text: 'Should users be able to mute or configure which ones they get?',
        cost: 1,
        reveals: 'Yes — a per-category on/off toggle. Nothing fancier than that.',
        crucial: false,
        value: 3,
        changes: 'Adds a preferences check before every send. Cheap, but it has to exist from day one or you spam people and train them to ignore the bell.',
      },
      {
        text: 'Do we need a history/inbox of past notifications?',
        cost: 1,
        reveals: 'For in-app, yes — keep about 30 days. Email is fire-and-forget.',
        crucial: false,
        value: 2,
        changes: 'In-app needs durable storage with read-state; email needs neither. Splits the storage requirement by channel.',
      },
      {
        text: 'Should in-app notifications feel instant, or is a minute of delay fine?',
        cost: 1,
        reveals: 'In-app should feel instant. Email within a few minutes is totally fine.',
        crucial: false,
        value: 3,
        changes: 'In-app wants a push transport (WebSocket/SSE); email tolerates a batched queue. Freshness requirement differs per channel.',
      },
      {
        text: 'What should the notification bell look like — brand color, icon?',
        cost: 0.5,
        reveals: 'Our purple, I think? Honestly, ask design.',
        crucial: false,
        value: 1,
        changes: 'Nothing architectural — a cosmetic detail design owns. Pure budget burned.',
      },
      {
        text: 'Which email provider would you like us to use?',
        cost: 0.5,
        reveals: "Whatever's cheap and reliable — your call.",
        crucial: false,
        value: 1,
        changes: 'A reversible vendor pick behind an interface, not a design driver. Answering it early buys you nothing.',
      },
      {
        text: 'Do the notifications need to be localized/translated?',
        cost: 1,
        reveals: 'Not this quarter — English only for now.',
        crucial: false,
        value: 2,
        changes: 'De-scopes i18n: templates stay single-locale, no per-user language resolution yet.',
      },
    ],
    trapForUnasked: {
      headline: 'Week 3 of the build. A customer’s card declines.',
      body: "Your notification worker hits a transient timeout from the email provider, drops the job, and moves on — every message was treated as best-effort. The user never learns their card failed, assumes the product is broken, cancels, and posts about it. The one notification that funds the company is the one you silently lost.",
      lesson: 'Ask which messages are load-bearing before you pick a delivery guarantee — “add notifications” hides a best-effort system and a must-arrive system wearing the same coat.',
    },
    requirementsMatrix: [
      { req: 'Three launch triggers: payment-failed, reply, export-done', fromQ: 0 },
      { req: 'Channels: in-app (all) + email (payment); no SMS', fromQ: 1 },
      { req: 'Payment-failed = at-least-once w/ retries + DLQ; social = best-effort', fromQ: 2 },
      { req: '~500 notifications/sec peak → single queue + worker pool', fromQ: 3 },
      { req: 'Per-category mute preferences, checked before send', fromQ: 4 },
      { req: 'In-app inbox retained 30 days with read-state', fromQ: 5 },
      { req: 'In-app near-instant (push); email tolerates minutes', fromQ: 6 },
    ],
  },
  {
    id: 'search',
    title: 'Give us search',
    stakeholderPitch:
      "Customers can't find anything in the app. We just need a search box — type a few words, get results. Every product has one. How long could it take?",
    budget: 6,
    questions: [
      {
        text: "What exactly are users searching over — their own records, or a big shared corpus?",
        cost: 1,
        reveals: "The full document library — every doc any user has ever uploaded that they're allowed to see. About 500 million and growing.",
        crucial: false,
        value: 4,
        changes: 'Turns a per-user table scan into a large shared index problem — 500M documents, not a WHERE clause on one account.',
      },
      {
        text: 'Do they need to match on meaning / partial words, or is exact keyword enough?',
        cost: 1.5,
        reveals: "Fuzzy. They'll type 'invoce' and expect the invoice. Typos, stems, synonyms — the works.",
        crucial: true,
        value: 5,
        changes:
          'This kills SQL LIKE dead. Fuzzy, stemmed, typo-tolerant ranking means a real inverted-index search engine (Elasticsearch/OpenSearch), not a database query.',
      },
      {
        text: 'How fresh must results be — is a few minutes of indexing lag acceptable?',
        cost: 1,
        reveals: 'A minute or two is fine. Nobody expects a doc uploaded this second to be searchable instantly.',
        crucial: false,
        value: 3,
        changes: 'Licenses async indexing: writes go to the store, a pipeline updates the index behind them. No synchronous index-on-write tax.',
      },
      {
        text: 'What does the result list need to show — just titles, or snippets and highlights?',
        cost: 1,
        reveals: 'Title, a highlighted snippet of the matching text, and the folder it lives in.',
        crucial: false,
        value: 2,
        changes: 'Requires storing highlightable text and metadata in the index, not just document IDs. Shapes what gets indexed.',
      },
      {
        text: 'Are there permission rules — can users search documents they can’t open?',
        cost: 1.5,
        reveals: "Never. Search results must respect sharing — you can only find what you're allowed to see.",
        crucial: false,
        value: 4,
        changes: 'Adds per-result access filtering at query time (or ACLs baked into the index). A wrong answer here is a data-leak bug, not a UX one.',
      },
      {
        text: 'Roughly how many searches per second at peak?',
        cost: 1,
        reveals: 'A few hundred per second on a busy morning.',
        crucial: false,
        value: 3,
        changes: 'Sizes the index cluster and replica count — moderate, so a small replicated cluster suffices.',
      },
      {
        text: 'Should search cover file contents, or just filenames and titles?',
        cost: 1,
        reveals: 'Full contents — the whole point is finding a doc by a phrase buried inside it.',
        crucial: false,
        value: 3,
        changes: 'Requires a text-extraction pipeline (PDFs, docs → plain text) before indexing. A whole ingestion stage you would otherwise miss.',
      },
      {
        text: 'What should the search box’s placeholder text say?',
        cost: 0.5,
        reveals: '“Search your documents…”? Design can bikeshed that.',
        crucial: false,
        value: 1,
        changes: 'Nothing architectural. Copy, not system design — budget spent for zero requirement.',
      },
      {
        text: 'Do we need search analytics — what people searched, what they clicked?',
        cost: 1,
        reveals: 'Would be nice eventually, not for v1.',
        crucial: false,
        value: 2,
        changes: 'De-scopes a click-logging pipeline for launch — a fast-follow, not a v1 constraint.',
      },
      {
        text: 'Which programming language should the service be written in?',
        cost: 0.5,
        reveals: 'Whatever your team is fastest in.',
        crucial: false,
        value: 1,
        changes: 'A team choice, not a requirement. Reveals nothing about the problem.',
      },
    ],
    trapForUnasked: {
      headline: 'Demo day. The VP types “invoce”.',
      body: "You shipped `WHERE title ILIKE '%invoce%'`. Zero results — the document is titled 'Invoice'. Every typo, plural, and synonym returns nothing, and users conclude their files vanished. Retrofitting a real ranked, typo-tolerant engine means re-architecting the whole feature, because a keyword LIKE and an inverted index are different systems, not different queries.",
      lesson: '“Search” means anything from a filtered lookup to a ranked fuzzy engine. Pin down matching semantics first — they decide whether this is a query or an entire subsystem.',
    },
    requirementsMatrix: [
      { req: 'Shared corpus of ~500M documents, permission-scoped', fromQ: 0 },
      { req: 'Fuzzy, stemmed, typo-tolerant ranking → inverted-index engine', fromQ: 1 },
      { req: 'Async indexing OK (~1–2 min lag)', fromQ: 2 },
      { req: 'Results show title + highlighted snippet + folder', fromQ: 3 },
      { req: 'Per-result access filtering (no finding what you can’t open)', fromQ: 4 },
      { req: 'Few hundred QPS peak → small replicated cluster', fromQ: 5 },
      { req: 'Full-content search → text-extraction ingestion stage', fromQ: 6 },
    ],
  },
  {
    id: 'upload',
    title: 'Let users upload files',
    stakeholderPitch:
      "We want users to attach files to their projects. Just a little upload button — pick a file, it shows up. Should be a quick win, right?",
    budget: 6,
    questions: [
      {
        text: 'What kinds of files, and how big can they get?',
        cost: 1.5,
        reveals: 'Mostly PDFs and images, but power users attach raw 4K video — we’ve seen 5 GB files.',
        crucial: true,
        value: 5,
        changes:
          'A 5 GB file blows up any synchronous multipart POST through your app server. This forces direct-to-storage uploads (pre-signed URLs) and multipart/resumable transfer — a different architecture than a form field.',
      },
      {
        text: 'How many uploads per second do we expect at peak?',
        cost: 1,
        reveals: 'Dozens per second across all users, spiky around deadlines.',
        crucial: false,
        value: 3,
        changes: 'Moderate concurrency — fine for object storage, but confirms you cannot pin large transfers to app-server memory.',
      },
      {
        text: 'Where should the bytes actually live — our DB, our disk, or object storage?',
        cost: 1,
        reveals: "We don't care where, as long as it's durable and cheap. Your call.",
        crucial: false,
        value: 3,
        changes: 'Confirms object storage (S3-class) over stuffing blobs in Postgres — the durability/cost answer, not the location, is the requirement.',
      },
      {
        text: 'Do uploads need virus/malware scanning before other users can download them?',
        cost: 1.5,
        reveals: "Yes — these get shared across a team. We can't be a malware vector.",
        crucial: false,
        value: 4,
        changes: 'Inserts an async scan stage between upload and availability: files land quarantined, a scanner clears them before they’re downloadable. A whole state machine you would otherwise skip.',
      },
      {
        text: 'What happens if an upload fails halfway — must it resume, or just restart?',
        cost: 1,
        reveals: 'For the big videos, resuming matters — restarting a 5 GB upload on flaky wifi is miserable.',
        crucial: false,
        value: 4,
        changes: 'Requires resumable/multipart uploads with part tracking, not a single stream. Ties directly to the max-size answer.',
      },
      {
        text: 'Are there per-user or per-project storage quotas?',
        cost: 1,
        reveals: 'Yes, tiered by plan. Free users get 5 GB, paid more.',
        crucial: false,
        value: 3,
        changes: 'Adds usage accounting checked before granting an upload URL — a metering requirement, cheap but load-bearing for billing.',
      },
      {
        text: 'Do we need thumbnails or previews generated?',
        cost: 1,
        reveals: 'Image thumbnails and a PDF first-page preview, yes.',
        crucial: false,
        value: 2,
        changes: 'Adds an async media-processing worker after upload — parallels the scan stage, doesn’t block availability.',
      },
      {
        text: 'What should the upload progress bar look like?',
        cost: 0.5,
        reveals: 'A normal progress bar? Design will handle it.',
        crucial: false,
        value: 1,
        changes: 'Cosmetic. No requirement surfaced — budget spent for nothing.',
      },
      {
        text: 'Should deleted files be recoverable, or gone immediately?',
        cost: 1,
        reveals: 'Soft-delete with a 30-day trash, then hard delete.',
        crucial: false,
        value: 2,
        changes: 'Adds a soft-delete flag + a cleanup job. A lifecycle requirement, minor next to the size one.',
      },
      {
        text: 'Which cloud provider are we on?',
        cost: 0.5,
        reveals: "We're on AWS, but don't over-couple to it.",
        crucial: false,
        value: 1,
        changes: 'Vendor context, not a design constraint — object storage is object storage. Low information value.',
      },
    ],
    trapForUnasked: {
      headline: 'Launch week. A filmmaker attaches a 5 GB cut.',
      body: "Your upload endpoint buffers the whole file in the app server's memory before writing it out. The first big video OOM-kills the pod, takes every other request on that box down with it, and the upload fails anyway. You built a form field; the users needed a resumable pipe straight to object storage. That's a rewrite, not a patch.",
      lesson: 'Max file size is the hinge of any upload feature — it decides between a simple POST and a resumable direct-to-storage pipeline. Ask for the biggest file, not the typical one.',
    },
    requirementsMatrix: [
      { req: 'Files up to ~5 GB → pre-signed direct-to-storage, multipart', fromQ: 0 },
      { req: 'Dozens of uploads/sec, spiky — no app-server buffering', fromQ: 1 },
      { req: 'Durable, cheap object storage (S3-class)', fromQ: 2 },
      { req: 'Async malware scan; files quarantined until cleared', fromQ: 3 },
      { req: 'Resumable uploads with part tracking', fromQ: 4 },
      { req: 'Per-plan storage quotas, metered before upload', fromQ: 5 },
      { req: 'Async thumbnail/preview generation', fromQ: 6 },
    ],
  },
  {
    id: 'ratelimit',
    title: 'Add rate limiting',
    stakeholderPitch:
      "Our API's getting hammered and a few bad actors are ruining it for everyone. Just put a rate limiter in front — cap how many requests people can make. Standard stuff.",
    budget: 6,
    questions: [
      {
        text: 'What are we limiting per — per user, per API key, per IP, or globally?',
        cost: 1.5,
        reveals: "Per authenticated account. Definitely not per IP — half our customers are big companies behind one office NAT.",
        crucial: true,
        value: 5,
        changes:
          'Per-IP would throttle an entire corporate customer as if they were one user — a support fire and a churn risk. The limit key must be the account, which means limiting authenticated (not anonymous) traffic. This choice defines the whole feature.',
      },
      {
        text: 'What should happen when someone hits the limit — reject, queue, or slow them down?',
        cost: 1,
        reveals: 'Reject with a clear 429 and a Retry-After header. Don’t queue — we don’t want to hold requests.',
        crucial: false,
        value: 4,
        changes: 'Picks a shed-load posture over buffering: return 429 + Retry-After, no server-side queue to blow up memory. Shapes the client contract.',
      },
      {
        text: 'Is one flat limit enough, or different tiers/endpoints?',
        cost: 1,
        reveals: 'Tiered by plan, and the expensive export endpoint needs its own tighter limit.',
        crucial: false,
        value: 4,
        changes: 'Requires per-plan + per-endpoint limit configs, not a single number. A policy layer, not a constant.',
      },
      {
        text: 'What time window and shape — fixed per-minute, or smooth bursts?',
        cost: 1,
        reveals: 'Allow short bursts but bound the sustained rate. Bursty clients are legit.',
        crucial: false,
        value: 4,
        changes: 'Points at a token-bucket (burst + refill) over a fixed-window counter, which would either reject legit bursts or allow double at the boundary.',
      },
      {
        text: 'Does the limit need to be exact across all servers, or is approximate OK?',
        cost: 1.5,
        reveals: "Approximate is fine — if someone occasionally sneaks a few over during a spike, nobody cares. Don't add latency for it.",
        crucial: false,
        value: 4,
        changes: 'Licenses a shared counter (Redis) or even local+gossip over a strongly-consistent global count. Saves you a latency-adding distributed-lock design nobody asked for.',
      },
      {
        text: 'How many requests per second are we protecting against at peak?',
        cost: 1,
        reveals: 'Normal is ~10k rps; abusive spikes hit 100k.',
        crucial: false,
        value: 3,
        changes: 'The limiter itself must survive 100k rps — so the counter store and check must be O(1) and near the edge, not a DB round-trip per request.',
      },
      {
        text: 'Should limits be adjustable at runtime without a deploy?',
        cost: 1,
        reveals: 'Yes — on-call needs to loosen or tighten a limit during an incident, fast.',
        crucial: false,
        value: 3,
        changes: 'Adds a config store the limiter reads live. An operational requirement that changes where the numbers live.',
      },
      {
        text: 'What HTTP status code do you want returned?',
        cost: 0.5,
        reveals: '429 Too Many Requests, obviously. Was there any doubt?',
        crucial: false,
        value: 1,
        changes: 'A detail already implied by the reject-posture answer. Low marginal information.',
      },
      {
        text: 'Do we need per-customer analytics on who’s getting throttled?',
        cost: 1,
        reveals: 'Eventually, to spot customers who need an upsell. Not v1.',
        crucial: false,
        value: 2,
        changes: 'De-scopes a throttle-metrics pipeline for launch — nice signal, not a v1 constraint.',
      },
      {
        text: 'Which library or gateway should we use for it?',
        cost: 0.5,
        reveals: 'Whatever fits — Envoy, a Redis counter, your call.',
        crucial: false,
        value: 1,
        changes: 'An implementation pick, not a requirement. Answering it first tells you nothing about the policy you need.',
      },
    ],
    trapForUnasked: {
      headline: 'Rollout day. Your biggest enterprise account goes dark.',
      body: "You keyed the limiter on client IP. Acme Corp's 4,000 employees all egress through one office gateway, so to your limiter they're a single screaming user — throttled to a crawl within seconds. Your largest customer can't use the product, support lights up, and the fix means re-keying the entire limiter on account identity. The default that felt neutral quietly targeted your best customers.",
      lesson: 'The limit KEY is the whole design — per-IP, per-user, and per-key throttle completely different populations. Ask who shares an identity before you pick what to count.',
    },
    requirementsMatrix: [
      { req: 'Limit per authenticated account, never per-IP (NAT-safe)', fromQ: 0 },
      { req: 'Reject with 429 + Retry-After; no server-side queue', fromQ: 1 },
      { req: 'Per-plan + per-endpoint tiers (export gets a tighter cap)', fromQ: 2 },
      { req: 'Token-bucket: allow bursts, bound sustained rate', fromQ: 3 },
      { req: 'Approximate counting OK → shared Redis counter, no global lock', fromQ: 4 },
      { req: 'Survive 100k rps: O(1) edge check, no per-request DB hit', fromQ: 5 },
      { req: 'Runtime-adjustable limits via live config store', fromQ: 6 },
    ],
  },
  {
    id: 'checkout',
    title: 'Build the checkout flow',
    stakeholderPitch:
      "We're finally charging money. Build the checkout — user enters a card, we take the payment, show a receipt. Payments are a solved problem, so this should be smooth.",
    budget: 6,
    questions: [
      {
        text: 'If a user double-clicks Pay, or the network retries, can we ever charge twice?',
        cost: 1.5,
        reveals: 'God no. A double charge is a chargeback, an angry tweet, and a refund. One click, one charge, always.',
        crucial: true,
        value: 5,
        changes:
          'This is the idempotency requirement. Every charge attempt must carry a client-generated idempotency key so a retry collapses to one charge. Without it, timeouts + retries silently double-bill — the single most common payments bug.',
      },
      {
        text: 'Do we store card numbers ourselves, or hand off to a processor?',
        cost: 1.5,
        reveals: "We never touch raw card data — hand off to Stripe/Adyen. We are NOT becoming PCI Level 1.",
        crucial: false,
        value: 4,
        changes: 'Removes card storage entirely: tokenize via the processor’s SDK, store only a token. Collapses your PCI scope from a compliance project to a form.',
      },
      {
        text: 'What happens after payment succeeds — what has to be provisioned, and must it be atomic with the charge?',
        cost: 1.5,
        reveals: "The subscription has to activate. If we charge them but the account doesn't upgrade, that's the worst outcome — money taken, nothing delivered.",
        crucial: false,
        value: 4,
        changes: 'Requires a durable link between charge and provisioning — a webhook/outbox that guarantees "charged ⇒ eventually provisioned", not a fire-and-forget call that can drop.',
      },
      {
        text: 'Which payment methods and currencies do we support at launch?',
        cost: 1,
        reveals: 'Cards only, USD and EUR, at launch. Wallets later.',
        crucial: false,
        value: 3,
        changes: 'Bounds the launch scope: two currencies, one method. De-risks a sprawling matrix of local payment methods.',
      },
      {
        text: 'How do we handle failed or declined payments — retry, dun, or just error?',
        cost: 1,
        reveals: 'Show a clear error immediately. For renewals, retry on a schedule before we cancel — dunning.',
        crucial: false,
        value: 3,
        changes: 'Splits checkout (fail fast, show the user) from renewals (a scheduled dunning state machine). Two flows, not one.',
      },
      {
        text: 'What are the peak transactions per second — a launch spike, a Black Friday?',
        cost: 1,
        reveals: 'Normally low, but a launch promo could do a few hundred per second for an hour.',
        crucial: false,
        value: 3,
        changes: 'Modest, but bursty — the charge path must not hold DB locks or synchronous provisioning inline, or the spike stalls.',
      },
      {
        text: 'Do we need to send email receipts and invoices?',
        cost: 1,
        reveals: 'Yes — a receipt email and a downloadable invoice PDF for accounting.',
        crucial: false,
        value: 2,
        changes: 'Adds an async receipt/invoice job off the successful-charge event. Parallels notifications, doesn’t block checkout.',
      },
      {
        text: 'What should the Pay button say and look like?',
        cost: 0.5,
        reveals: '“Pay $X” with the total? Design owns it.',
        crucial: false,
        value: 1,
        changes: 'Cosmetic — no requirement. Budget spent for nothing.',
      },
      {
        text: 'Do we need to support refunds and partial refunds?',
        cost: 1,
        reveals: 'Full refunds via support at launch; partial and self-serve later.',
        crucial: false,
        value: 2,
        changes: 'Scopes refunds to a support-triggered full-refund call for v1 — a small addition, not a self-serve subsystem yet.',
      },
      {
        text: 'Which processor do you prefer — Stripe, Adyen, Braintree?',
        cost: 0.5,
        reveals: "No strong preference — cheapest fees with good docs.",
        crucial: false,
        value: 1,
        changes: 'A reversible vendor pick behind an interface. Answering it early buys no design clarity.',
      },
    ],
    trapForUnasked: {
      headline: 'Launch promo, hour one. A user on hotel wifi taps Pay.',
      body: "Their request times out after the charge already went through. The client retries; your server, with no idempotency key, charges the card a second time. Multiply by a few hundred flaky-network buyers and you've got a wall of double charges, chargebacks, and a support queue on fire — during your launch. The fix is an idempotency key you can't retrofit onto charges already made.",
      lesson: 'Any money-moving action needs idempotency from the first line of code — retries and timeouts are certain, and “charge exactly once” is a design property, not a hope.',
    },
    requirementsMatrix: [
      { req: 'Idempotency key per charge → retries collapse to one charge', fromQ: 0 },
      { req: 'Tokenize via processor; never store raw card data (PCI scope-out)', fromQ: 1 },
      { req: 'Durable charge⇒provision link (outbox/webhook), never dropped', fromQ: 2 },
      { req: 'Launch: cards only, USD + EUR', fromQ: 3 },
      { req: 'Fail-fast on decline; scheduled dunning for renewals', fromQ: 4 },
      { req: 'Bursty peak (~hundreds/sec) → no inline locks/provisioning', fromQ: 5 },
      { req: 'Async receipt email + invoice PDF off the charge event', fromQ: 6 },
    ],
  },
  {
    id: 'dashboard',
    title: 'Ship an analytics dashboard',
    stakeholderPitch:
      "The team wants visibility into how the product's doing — signups, active users, revenue. Build a dashboard with some charts. We've got the events already; just show them.",
    budget: 6,
    questions: [
      {
        text: 'How fresh must the numbers be — live to the second, or is yesterday’s data fine?',
        cost: 1.5,
        reveals: "The exec team reviews it once each morning over coffee. As long as it's correct through yesterday, nobody cares about real-time.",
        crucial: true,
        value: 5,
        changes:
          'This is the freshness question, and it flips the entire architecture. A once-a-morning read means a nightly batch rollup — cheap, simple, backfillable. Building a 24/7 streaming pipeline for a daily reader burns money and on-call for freshness nobody consumes.',
      },
      {
        text: 'What’s the event volume the pipeline has to chew through?',
        cost: 1,
        reveals: 'Around 10 billion events a day.',
        crucial: false,
        value: 4,
        changes: 'Rules out computing on the fly per page-load: the dashboard must read pre-aggregated rollups, not scan raw events at query time.',
      },
      {
        text: 'Who sees this — a handful of execs, or every customer in-product?',
        cost: 1.5,
        reveals: 'Just our internal exec and ops team. A few dozen people, all trusted.',
        crucial: false,
        value: 4,
        changes: 'Internal-only, low concurrency — no multi-tenant isolation, per-customer access control, or high-QPS serving layer needed. Massively narrows the problem.',
      },
      {
        text: 'Which specific metrics, and do they need to be filterable/sliceable?',
        cost: 1,
        reveals: 'Signups, DAU/MAU, revenue, retention — sliceable by plan and by region.',
        crucial: false,
        value: 3,
        changes: 'Defines the rollup dimensions (plan, region) that must be pre-aggregated. Determines the shape of the nightly job’s output tables.',
      },
      {
        text: 'How far back does history need to go, and can definitions change retroactively?',
        cost: 1,
        reveals: "Two years of history, and yes — when we redefine 'active user' we re-run the whole thing.",
        crucial: false,
        value: 3,
        changes: 'Requires reproducible, backfillable batch jobs over raw events — reinforcing batch over streaming, which is painful to recompute historically.',
      },
      {
        text: 'How accurate must the numbers be — exact, or are close estimates OK?',
        cost: 1,
        reveals: 'Revenue must reconcile to the penny with finance. Engagement metrics can be approximate.',
        crucial: false,
        value: 4,
        changes: 'Splits metrics into two tiers: exact/auditable (revenue, from the source of truth) vs approximate (engagement, sketch-friendly). Different pipelines, different guarantees.',
      },
      {
        text: 'Does anyone need alerting when a metric moves sharply?',
        cost: 1,
        reveals: 'Yes — ping us if signups or revenue drop hard day-over-day.',
        crucial: false,
        value: 3,
        changes: 'Adds a threshold-check on the daily rollup that fires an alert. Cheap on top of batch, but a real requirement to design in.',
      },
      {
        text: 'What color scheme and chart style do you want?',
        cost: 0.5,
        reveals: 'On brand, clean. Design will spec it.',
        crucial: false,
        value: 1,
        changes: 'Cosmetic — no architectural information. Budget wasted.',
      },
      {
        text: 'Should users be able to export to CSV/Excel?',
        cost: 1,
        reveals: 'Yes, an export button for the finance folks.',
        crucial: false,
        value: 2,
        changes: 'Adds a CSV export off the rollup tables — a small serving-layer addition, not a pipeline driver.',
      },
      {
        text: 'Which BI tool or chart library should we use?',
        cost: 0.5,
        reveals: 'Whatever gets it done — Metabase, a custom React front end, your call.',
        crucial: false,
        value: 1,
        changes: 'A tooling pick, reversible, not a requirement. Low information value early.',
      },
    ],
    trapForUnasked: {
      headline: 'Two sprints in, the streaming bill lands.',
      body: "You assumed 'dashboard' meant real-time and built a Kafka + stream-processor pipeline updating metrics to the second, 24/7, with its own on-call rotation. Then you learn the execs glance at it once each morning. You spent weeks and a fat cloud bill delivering sub-second freshness to a once-a-day reader — and a nightly batch job would have been cheaper, simpler, and easier to backfill. Right numbers, wrong cadence, enormous waste.",
      lesson: 'Match pipeline freshness to the DECISION cadence, never to the word “dashboard.” Ask how often a human acts on the number before you choose batch vs streaming.',
    },
    requirementsMatrix: [
      { req: 'Read once each morning → nightly batch rollup, not streaming', fromQ: 0 },
      { req: '~10B events/day → serve pre-aggregated rollups, never raw scans', fromQ: 1 },
      { req: 'Internal-only, dozens of users → no multi-tenant/high-QPS layer', fromQ: 2 },
      { req: 'Metrics sliceable by plan + region (rollup dimensions)', fromQ: 3 },
      { req: '2yr history, reproducible/backfillable jobs', fromQ: 4 },
      { req: 'Revenue exact/auditable; engagement approximate (two tiers)', fromQ: 5 },
      { req: 'Day-over-day threshold alerting on the daily rollup', fromQ: 6 },
    ],
  },
]
