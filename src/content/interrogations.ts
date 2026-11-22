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
      "Users keep telling us they miss important stuff. Leadership wants us to “add notifications” this quarter. You’re the eng lead, so can your team knock that out? It doesn’t sound that hard.",
    budget: 6,
    questions: [
      {
        text: 'Which events trigger a notification, and who controls that list?',
        cost: 1,
        reveals: 'Start with three: payment failed, someone replied to you, and your export finished. Product will add more later.',
        crucial: false,
        value: 3,
        changes: 'Caps the launch surface at three concrete event types instead of an open-ended firehose product can expand without warning.',
      },
      {
        text: 'Which channels are we sending on: in-app, email, push, or SMS?',
        cost: 1,
        reveals: 'In-app for all of them, plus email for failed payments. No SMS. Too expensive.',
        crucial: false,
        value: 4,
        changes: 'Splits fan-out by channel. Email needs templates and a third-party provider, while in-app needs durable storage and read-state. That is two delivery paths, not one.',
      },
      {
        text: 'For the payment-failed alert, is it acceptable if a user occasionally never receives it?',
        cost: 1.5,
        reveals: "Absolutely not. If a card fails and they don't hear about it, they churn and we eat the loss. That one MUST arrive.",
        crucial: true,
        value: 5,
        changes:
          'This is the delivery-guarantee fork. Payment-failed requires at-least-once delivery with retries and a dead-letter queue, while social pings can stay best-effort. Two reliability tiers, not one.',
      },
      {
        text: 'What peak volume should we plan for, in notifications per second?',
        cost: 1,
        reveals: 'Maybe 500/sec during a marketing blast, and low hundreds normally.',
        crucial: false,
        value: 3,
        changes: 'Modest throughput. A single queue and a standard worker pool handle 500/sec cleanly, with no sharding or dedicated fan-out service needed yet.',
      },
      {
        text: 'Can users mute notifications or pick which categories they receive?',
        cost: 1,
        reveals: 'Yes, a simple per-category on/off toggle. Nothing fancier than that.',
        crucial: false,
        value: 3,
        changes: 'Adds a preferences lookup before every send. Cheap to build, yet it has to exist on day one before you spam users into ignoring the bell.',
      },
      {
        text: 'Do users need an inbox or history of past notifications?',
        cost: 1,
        reveals: 'For in-app, yes. Keep about 30 days. Email is fire-and-forget.',
        crucial: false,
        value: 2,
        changes: 'Splits storage by channel. In-app needs durable 30-day history with read-state, while email needs neither.',
      },
      {
        text: 'Should in-app notifications feel instant, or is a minute of delay fine?',
        cost: 1,
        reveals: 'In-app should feel instant. Email arriving within a few minutes is totally fine.',
        crucial: false,
        value: 3,
        changes: 'Separates transport by freshness. In-app wants a live push channel (WebSocket or SSE), while email works fine over a batched queue.',
      },
      {
        text: 'What should the notification bell look like, including brand color and icon?',
        cost: 0.5,
        reveals: 'Our purple, I think? Honestly, ask design.',
        crucial: false,
        value: 1,
        changes: 'Purely cosmetic, and design owns it anyway. Budget spent with zero architectural signal.',
      },
      {
        text: 'Which email provider do you want us to use?',
        cost: 0.5,
        reveals: "Whatever's cheap and reliable. Your call.",
        crucial: false,
        value: 1,
        changes: 'A reversible vendor choice sitting behind an interface, not an architectural driver. Asking early buys you nothing.',
      },
      {
        text: 'Do notifications need to be localized or translated?',
        cost: 1,
        reveals: 'Not this quarter. English only for now.',
        crucial: false,
        value: 2,
        changes: 'De-scopes i18n for launch. Templates stay single-locale, with no per-user language lookup yet.',
      },
    ],
    trapForUnasked: {
      headline: 'Week 3 of the build. A customer’s card declines.',
      body: "Your notification worker hits a transient timeout from the email provider, drops the job, and moves on because every message was built as best-effort. The customer never hears their card failed, assumes the product broke, cancels, and posts about it. The one alert that protects revenue is the one you silently dropped.",
      lesson: 'Ask which messages are load-bearing before you choose a delivery guarantee. “Add notifications” often hides a best-effort feed and a must-arrive alert under one label.',
    },
    requirementsMatrix: [
      { req: 'Three launch triggers: payment-failed, reply, and export-done', fromQ: 0 },
      { req: 'Channels: in-app (all) and email (payment-failed); no SMS', fromQ: 1 },
      { req: 'Payment-failed needs at-least-once delivery with retries and a DLQ; social pings stay best-effort', fromQ: 2 },
      { req: '~500 notifications/sec peak → single queue and worker pool', fromQ: 3 },
      { req: 'Per-category mute preferences, checked before every send', fromQ: 4 },
      { req: 'In-app inbox kept for 30 days with read-state', fromQ: 5 },
      { req: 'In-app near-instant (WebSocket/SSE); email tolerates a few minutes', fromQ: 6 },
    ],
  },
  {
    id: 'search',
    title: 'Give us search',
    stakeholderPitch:
      "Customers can't find anything in the app. We just need a search box: type a few words, get results. Every product has one. How long could it take?",
    budget: 6,
    questions: [
      {
        text: 'What are users searching over: their own records, or a large shared library?',
        cost: 1,
        reveals: "The full document library. Every doc any user has ever uploaded that they're allowed to see. About 500 million and growing.",
        crucial: false,
        value: 4,
        changes: 'Turns a simple per-user table scan into a 500M-document shared index problem, far beyond a WHERE clause on one account.',
      },
      {
        text: 'Do users need fuzzy matching and partial words, or is exact keyword matching enough?',
        cost: 1.5,
        reveals: "Fuzzy. They'll type 'invoce' and expect the invoice. Typos, stems, synonyms, the works.",
        crucial: true,
        value: 5,
        changes:
          'Rules out SQL LIKE on the spot. Typo tolerance, stemming, and ranked relevance require a dedicated inverted-index search engine (Elasticsearch or OpenSearch), not a database query.',
      },
      {
        text: 'How fresh do search results need to be? Is a minute or two of indexing lag okay?',
        cost: 1,
        reveals: 'A minute or two is fine. Nobody expects a doc uploaded this second to show up instantly.',
        crucial: false,
        value: 3,
        changes: 'Unlocks asynchronous indexing. Writes commit to primary storage while a background pipeline updates the index, avoiding a synchronous index-on-write tax.',
      },
      {
        text: 'What should each search result display: just titles, or snippets and highlights too?',
        cost: 1,
        reveals: 'Title, a highlighted snippet of the matching text, and the folder it lives in.',
        crucial: false,
        value: 2,
        changes: 'Means the index must store highlightable text and folder metadata, not just document IDs. Directly shapes index size and schema.',
      },
      {
        text: 'How do permissions work? Can search ever reveal documents a user is not allowed to open?',
        cost: 1.5,
        reveals: "Never. Search results have to respect sharing, so you can only find what you're allowed to see.",
        crucial: false,
        value: 4,
        changes: 'Forces per-result access filtering at query time or ACLs baked into the index. Getting this wrong is a data leak, not a UX paper cut.',
      },
      {
        text: 'Roughly how many searches per second do we see at peak?',
        cost: 1,
        reveals: 'A few hundred per second on a busy morning.',
        crucial: false,
        value: 3,
        changes: 'Sizes the search cluster and replica count. At a few hundred QPS, a small replicated cluster handles the load comfortably.',
      },
      {
        text: 'Should search cover full file contents, or only filenames and titles?',
        cost: 1,
        reveals: 'Full contents. The whole point is finding a doc from a phrase buried inside it.',
        crucial: false,
        value: 3,
        changes: 'Adds a text-extraction ingestion stage (PDFs and docs converted to plain text) before anything reaches the index. A whole pipeline you would otherwise miss.',
      },
      {
        text: 'What should the search box placeholder text say?',
        cost: 0.5,
        reveals: '“Search your documents…”? Design can bikeshed that.',
        crucial: false,
        value: 1,
        changes: 'UI copy, not system design. Budget burned without surfacing a single requirement.',
      },
      {
        text: 'Do we need search analytics to track what people query and click?',
        cost: 1,
        reveals: 'Nice to have eventually, not for v1.',
        crucial: false,
        value: 2,
        changes: 'Keeps a click-logging pipeline out of v1. Good to plan for later, not a launch constraint.',
      },
      {
        text: 'Which programming language should we write the search service in?',
        cost: 0.5,
        reveals: 'Whatever your team is fastest in.',
        crucial: false,
        value: 1,
        changes: 'An implementation preference, not a product requirement. Tells you nothing about the architecture.',
      },
    ],
    trapForUnasked: {
      headline: 'Demo day. The VP types “invoce”.',
      body: "You shipped `WHERE title ILIKE '%invoce%'`. Zero results, even though the file is right there titled 'Invoice'. Every typo, plural, and synonym comes back empty, and users assume their documents disappeared. Moving from SQL LIKE to a ranked, typo-tolerant inverted index means rebuilding the feature from scratch, because those are two different systems, not two different queries.",
      lesson: '“Search” can mean anything from a filtered lookup to a ranked fuzzy engine. Pin down matching semantics first, because they decide whether you are writing a query or building a subsystem.',
    },
    requirementsMatrix: [
      { req: 'Shared corpus of ~500M documents, scoped by permissions', fromQ: 0 },
      { req: 'Fuzzy, stemmed, typo-tolerant ranking → inverted-index engine', fromQ: 1 },
      { req: 'Async indexing OK (1 to 2 min lag)', fromQ: 2 },
      { req: 'Results show title, highlighted snippet, and folder', fromQ: 3 },
      { req: 'Per-result access filtering (never surface unreadable docs)', fromQ: 4 },
      { req: 'Few hundred QPS peak → small replicated cluster', fromQ: 5 },
      { req: 'Full-content search → text-extraction ingestion stage', fromQ: 6 },
    ],
  },
  {
    id: 'upload',
    title: 'Let users upload files',
    stakeholderPitch:
      "We want users to attach files to their projects. Just a simple upload button: pick a file, and it shows up. Should be a quick win, right?",
    budget: 6,
    questions: [
      {
        text: 'What kinds of files will users upload, and how large can they get?',
        cost: 1.5,
        reveals: 'Mostly PDFs and images, but power users attach raw 4K video. We have seen 5 GB files.',
        crucial: true,
        value: 5,
        changes:
          'A 5 GB file breaks any synchronous multipart POST through your app server. This forces direct-to-storage uploads with pre-signed URLs and multipart resumable transfer, a totally different architecture from a form field.',
      },
      {
        text: 'How many uploads per second should we expect at peak?',
        cost: 1,
        reveals: 'Dozens per second across all users, especially spiky around deadlines.',
        crucial: false,
        value: 3,
        changes: 'Moderate concurrency for object storage, while confirming you cannot buffer large in-flight transfers in app-server memory.',
      },
      {
        text: 'Where should the uploaded bytes live: our database, local disk, or object storage?',
        cost: 1,
        reveals: "We don't care where they live, as long as storage is durable and cheap. Your call.",
        crucial: false,
        value: 3,
        changes: 'Points straight to object storage (S3-class) instead of stuffing blobs in Postgres. Durability and cost are the real requirements, not the specific bucket.',
      },
      {
        text: 'Do uploads need virus or malware scanning before teammates can download them?',
        cost: 1.5,
        reveals: "Yes. These files get shared across teams, so we can't become a malware vector.",
        crucial: false,
        value: 4,
        changes: 'Inserts an async scan state between upload and availability. Files land in quarantine until a scanner clears them, adding a state machine you would otherwise skip.',
      },
      {
        text: 'If an upload drops halfway through, does it need to resume, or can it just restart?',
        cost: 1,
        reveals: 'For the big videos, resuming really matters. Restarting a 5 GB upload on flaky wifi is miserable.',
        crucial: false,
        value: 4,
        changes: 'Requires multipart resumable uploads with part tracking instead of one long stream. Connects straight back to the 5 GB ceiling.',
      },
      {
        text: 'Are there per-user or per-project storage quotas?',
        cost: 1,
        reveals: 'Yes, tiered by plan. Free users get 5 GB, and paid plans get more.',
        crucial: false,
        value: 3,
        changes: 'Adds usage metering before issuing an upload URL. Cheap to enforce, and load-bearing for billing.',
      },
      {
        text: 'Do we need to generate thumbnails or file previews?',
        cost: 1,
        reveals: 'Image thumbnails and a PDF first-page preview, yes.',
        crucial: false,
        value: 2,
        changes: 'Adds an async media-processing worker after upload. Runs alongside malware scanning without blocking file availability.',
      },
      {
        text: 'What should the upload progress bar look like?',
        cost: 0.5,
        reveals: 'Just a normal progress bar? Design will handle it.',
        crucial: false,
        value: 1,
        changes: 'Cosmetic detail with no architectural impact. Budget spent for nothing.',
      },
      {
        text: 'Should deleted files be recoverable, or wiped right away?',
        cost: 1,
        reveals: 'Soft-delete with a 30-day trash, then hard delete.',
        crucial: false,
        value: 2,
        changes: 'Adds a soft-delete flag and a scheduled cleanup job. A straightforward lifecycle rule, minor next to file size.',
      },
      {
        text: 'Which cloud provider are we running on?',
        cost: 0.5,
        reveals: "We're on AWS, though we don't want to over-couple to it.",
        crucial: false,
        value: 1,
        changes: 'Useful vendor context, not a design constraint. Object storage patterns stay the same across clouds.',
      },
    ],
    trapForUnasked: {
      headline: 'Launch week. A filmmaker attaches a 5 GB cut.',
      body: "Your upload endpoint buffers the entire file in app-server memory before writing it out. The first big video OOM-kills the pod, takes every other request on that box down with it, and fails the upload anyway. You built a form handler when users needed a resumable pipe straight to object storage. That is a rewrite, not a patch.",
      lesson: 'Max file size is the hinge of any upload system, deciding between a simple POST and a resumable direct-to-storage pipeline. Ask for the biggest file, not the average one.',
    },
    requirementsMatrix: [
      { req: 'Files up to 5 GB → pre-signed direct-to-storage multipart uploads', fromQ: 0 },
      { req: 'Dozens of uploads/sec, spiky → no app-server buffering', fromQ: 1 },
      { req: 'Durable, low-cost object storage (S3-class)', fromQ: 2 },
      { req: 'Async malware scan; files stay quarantined until cleared', fromQ: 3 },
      { req: 'Resumable uploads with part tracking', fromQ: 4 },
      { req: 'Per-plan storage quotas (5 GB free), checked before upload', fromQ: 5 },
      { req: 'Async thumbnail and PDF preview generation', fromQ: 6 },
    ],
  },
  {
    id: 'ratelimit',
    title: 'Add rate limiting',
    stakeholderPitch:
      "Our API is getting hammered, and a few bad actors are ruining it for everyone. Just put a rate limiter in front and cap how many requests people can make. Standard stuff.",
    budget: 6,
    questions: [
      {
        text: 'What are we limiting by: user, API key, IP address, or globally?',
        cost: 1.5,
        reveals: "Per authenticated account. Definitely not per IP, because half our customers are big companies sharing one office NAT.",
        crucial: true,
        value: 5,
        changes:
          'Limiting by IP would throttle an entire enterprise customer as if they were one loud user, sparking a support fire and churn risk. Keying on the account means limiting authenticated (not anonymous) traffic, and that choice defines the whole feature.',
      },
      {
        text: 'What should happen when a caller hits the limit: reject, queue, or slow them down?',
        cost: 1,
        reveals: 'Reject with a clear 429 and a Retry-After header. Do not queue, because we do not want to hold open requests.',
        crucial: false,
        value: 4,
        changes: 'Commits to shedding load immediately with 429 plus Retry-After rather than buffering requests in server memory. Sets the client retry contract.',
      },
      {
        text: 'Is one flat limit enough, or do we need different tiers and per-endpoint caps?',
        cost: 1,
        reveals: 'Tiered by plan, and the expensive export endpoint needs its own tighter limit.',
        crucial: false,
        value: 4,
        changes: 'Calls for per-plan and per-endpoint limit rules instead of a single constant. You need a policy layer, not one magic number.',
      },
      {
        text: 'What shape should the limit take: a rigid per-minute cap, or smooth bursts?',
        cost: 1,
        reveals: 'Allow short bursts, but bound the sustained rate. Bursty clients are legitimate.',
        crucial: false,
        value: 4,
        changes: 'Points to a token-bucket algorithm (burst allowance plus steady refill) over a fixed-window counter, which either blocks valid bursts or allows double traffic across window edges.',
      },
      {
        text: 'Does the count need to be exact across every server, or is approximate good enough?',
        cost: 1.5,
        reveals: "Approximate is fine. If someone slips a few extra requests through during a spike, nobody cares. Just don't add latency for it.",
        crucial: false,
        value: 4,
        changes: 'Lets you use a shared Redis counter or local counters with gossip instead of a strongly consistent global lock. Avoids latency-heavy coordination nobody asked for.',
      },
      {
        text: 'How many requests per second do we need to survive at peak?',
        cost: 1,
        reveals: 'Normal traffic is ~10k rps, and abusive spikes hit 100k.',
        crucial: false,
        value: 3,
        changes: 'The limiter itself must withstand 100k rps, meaning O(1) checks near the edge and never a database round-trip per request.',
      },
      {
        text: 'Do operators need to adjust limits at runtime without deploying code?',
        cost: 1,
        reveals: 'Yes. On-call needs to tighten or loosen a limit fast during an incident.',
        crucial: false,
        value: 3,
        changes: 'Adds a live config store the limiter reads dynamically. An operational requirement that dictates where limit rules live.',
      },
      {
        text: 'Which HTTP status code should we return when throttling?',
        cost: 0.5,
        reveals: '429 Too Many Requests, obviously. Was there any doubt?',
        crucial: false,
        value: 1,
        changes: 'Already implied once you know the reject posture. Almost zero new information.',
      },
      {
        text: 'Do we need per-customer analytics showing who gets throttled most?',
        cost: 1,
        reveals: 'Eventually, to spot customers ready for an upsell. Not for v1.',
        crucial: false,
        value: 2,
        changes: 'De-scopes a throttle-analytics pipeline at launch. Helpful commercial signal later, not a v1 requirement.',
      },
      {
        text: 'Which library or gateway should we build this with?',
        cost: 0.5,
        reveals: 'Whatever fits: Envoy, a Redis counter, your call.',
        crucial: false,
        value: 1,
        changes: 'An implementation detail, not a requirement. Picking the tool first tells you nothing about the policy it has to enforce.',
      },
    ],
    trapForUnasked: {
      headline: 'Rollout day. Your biggest enterprise account goes dark.',
      body: "You keyed the limiter on client IP. Acme Corp's 4,000 employees all egress through one office gateway, so your limiter sees one screaming caller and throttles them to a crawl in seconds. Your largest customer gets locked out, support lights up, and fixing it means re-keying the entire limiter on account identity. The default that felt neutral quietly knocked out your best account.",
      lesson: 'The limit key is the whole design, because per-IP, per-user, and per-key rules throttle completely different populations. Ask who shares an identity before you decide what to count.',
    },
    requirementsMatrix: [
      { req: 'Limit per authenticated account, never per-IP (NAT-safe)', fromQ: 0 },
      { req: 'Reject with 429 and Retry-After; no server-side request queue', fromQ: 1 },
      { req: 'Per-plan and per-endpoint tiers (tighter cap on export)', fromQ: 2 },
      { req: 'Token-bucket shape: allow short bursts, bound sustained rate', fromQ: 3 },
      { req: 'Approximate counting OK → shared Redis counter, no global lock', fromQ: 4 },
      { req: 'Survive 100k rps (normal ~10k): O(1) edge check, no per-request DB hit', fromQ: 5 },
      { req: 'Runtime-adjustable limits via a live config store', fromQ: 6 },
    ],
  },
  {
    id: 'checkout',
    title: 'Build the checkout flow',
    stakeholderPitch:
      "We're finally charging money. Build the checkout: a user enters a card, we take the payment, and we show a receipt. Payments are a solved problem, so this should go smoothly.",
    budget: 6,
    questions: [
      {
        text: 'If a user double-clicks Pay, or the network retries, can we ever charge them twice?',
        cost: 1.5,
        reveals: 'God no. A double charge is a chargeback, an angry tweet, and a refund. One click, one charge, always.',
        crucial: true,
        value: 5,
        changes:
          'Surfaces the idempotency requirement. Every charge attempt needs a client-generated idempotency key so retries collapse into one charge. Without it, timeouts plus retries silently double-bill, the single most common payments bug.',
      },
      {
        text: 'Do we store card numbers ourselves, or hand them straight to a payment processor?',
        cost: 1.5,
        reveals: "We never touch raw card data. Hand it off to Stripe or Adyen. We are NOT becoming PCI Level 1.",
        crucial: false,
        value: 4,
        changes: 'Eliminates raw card storage altogether. You tokenize through the processor SDK and store only a token, shrinking PCI work from a compliance overhaul to a hosted form.',
      },
      {
        text: 'What happens after payment succeeds, what has to be provisioned, and must it be atomic with the charge?',
        cost: 1.5,
        reveals: "The subscription has to activate. Taking their money without upgrading the account is the worst possible outcome.",
        crucial: false,
        value: 4,
        changes: 'Requires a durable bridge between charging and provisioning, using webhooks or an outbox so a successful charge always leads to an activated account rather than a dropped fire-and-forget call.',
      },
      {
        text: 'Which payment methods and currencies do we need to support at launch?',
        cost: 1,
        reveals: 'Cards only, USD and EUR, at launch. Wallets can wait.',
        crucial: false,
        value: 3,
        changes: 'Keeps v1 focused on one method and two currencies, avoiding a sprawling matrix of local payment rails early.',
      },
      {
        text: 'How should we handle failed or declined payments: fail immediately, retry, or run dunning?',
        cost: 1,
        reveals: 'Show a clear error right away at checkout. For renewals, retry on a schedule before canceling, so standard dunning.',
        crucial: false,
        value: 3,
        changes: 'Splits checkout (fail fast and tell the buyer) from renewals (a scheduled dunning state machine). Two separate flows, not one.',
      },
      {
        text: 'What peak transactions per second do we expect during a launch spike or Black Friday?',
        cost: 1,
        reveals: 'Normally low, though a launch promo could hit a few hundred per second for an hour.',
        crucial: false,
        value: 3,
        changes: 'Modest baseline, sharp bursts. The charge path cannot hold long DB locks or run synchronous provisioning inline, or the spike will stall checkout.',
      },
      {
        text: 'Do we need to send email receipts and downloadable invoices?',
        cost: 1,
        reveals: 'Yes, a receipt email plus a downloadable invoice PDF for accounting.',
        crucial: false,
        value: 2,
        changes: 'Adds an async receipt and invoice worker triggered by the charge-succeeded event. Runs off the hot path so checkout stays fast.',
      },
      {
        text: 'What should the Pay button say and look like?',
        cost: 0.5,
        reveals: '“Pay $X” with the total? Design owns that.',
        crucial: false,
        value: 1,
        changes: 'Cosmetic copy owned by design. Zero architectural value for the budget spent.',
      },
      {
        text: 'Do we need to support full refunds, partial refunds, or self-serve refunds?',
        cost: 1,
        reveals: 'Full refunds through support at launch. Partial and self-serve can come later.',
        crucial: false,
        value: 2,
        changes: 'Scopes v1 to a single support-triggered full refund endpoint instead of a full self-serve refund workflow.',
      },
      {
        text: 'Do you prefer a specific processor, like Stripe, Adyen, or Braintree?',
        cost: 0.5,
        reveals: "No strong preference. Cheapest fees with good docs.",
        crucial: false,
        value: 1,
        changes: 'A reversible vendor choice behind an adapter interface. Settling it early buys no architectural clarity.',
      },
    ],
    trapForUnasked: {
      headline: 'Launch promo, hour one. A user on hotel wifi taps Pay.',
      body: "Their request times out after the charge has already succeeded. The client retries, and because your server has no idempotency key, it charges the card a second time. Multiply that across a few hundred buyers on shaky connections and launch hour turns into double charges, chargebacks, and a burning support queue. You cannot retrofit an idempotency key onto payments that already went through.",
      lesson: 'Build idempotency into any money-moving endpoint from line one. Timeouts and retries are guaranteed, so charging once is an engineering invariant, not a wish.',
    },
    requirementsMatrix: [
      { req: 'Idempotency key per charge → retries collapse to one charge', fromQ: 0 },
      { req: 'Tokenize via processor SDK; never store raw card data (out of PCI Level 1)', fromQ: 1 },
      { req: 'Durable charge ⇒ provision link (outbox or webhook), never dropped', fromQ: 2 },
      { req: 'Launch scope: cards only, USD and EUR', fromQ: 3 },
      { req: 'Fail fast on checkout declines; scheduled dunning for renewals', fromQ: 4 },
      { req: 'Bursty peak (a few hundred/sec) → no inline locks or synchronous provisioning', fromQ: 5 },
      { req: 'Async receipt email and invoice PDF off the charge event', fromQ: 6 },
    ],
  },
  {
    id: 'dashboard',
    title: 'Ship an analytics dashboard',
    stakeholderPitch:
      "The team wants visibility into how the product is doing: signups, active users, revenue. Build a dashboard with some charts. We already have the events, so just show them.",
    budget: 6,
    questions: [
      {
        text: 'How fresh do the numbers need to be: live to the second, or is yesterday’s data fine?',
        cost: 1.5,
        reveals: "The exec team looks at it once each morning over coffee. As long as it's right through yesterday, nobody cares about real-time.",
        crucial: true,
        value: 5,
        changes:
          'The freshness answer flips the whole architecture. A once-a-morning check calls for a nightly batch rollup that is cheap, simple, and easy to backfill, instead of burning money and on-call hours on a 24/7 streaming pipeline nobody watches live.',
      },
      {
        text: 'What daily event volume does the pipeline need to process?',
        cost: 1,
        reveals: 'Around 10 billion events a day.',
        crucial: false,
        value: 4,
        changes: 'Rules out querying raw events on page load. At 10B events a day, the dashboard must read from pre-aggregated rollup tables.',
      },
      {
        text: 'Who will use this dashboard: a handful of executives, or every customer inside the app?',
        cost: 1.5,
        reveals: 'Just our internal exec and ops team. A few dozen people, all trusted.',
        crucial: false,
        value: 4,
        changes: 'Internal-only and low concurrency. That removes multi-tenant isolation, per-customer access control, and a high-QPS serving tier in one stroke.',
      },
      {
        text: 'Which metrics belong on the dashboard, and how do people need to slice or filter them?',
        cost: 1,
        reveals: 'Signups, DAU/MAU, revenue, and retention, sliceable by plan and by region.',
        crucial: false,
        value: 3,
        changes: 'Locks in the rollup dimensions (plan and region) that must be pre-aggregated, shaping the schema of the nightly output tables.',
      },
      {
        text: 'How far back should history go, and can metric definitions change retroactively?',
        cost: 1,
        reveals: "Two years of history, and yes. Whenever we redefine 'active user', we re-run the whole thing.",
        crucial: false,
        value: 3,
        changes: 'Requires reproducible, backfillable jobs over raw history. That strongly favors batch pipelines over streaming, which is painful to recompute across two years.',
      },
      {
        text: 'How exact do these numbers need to be, or are close estimates acceptable?',
        cost: 1,
        reveals: 'Revenue has to reconcile to the penny with finance. Engagement metrics can be approximate.',
        crucial: false,
        value: 4,
        changes: 'Splits metrics into two accuracy tiers: exact, auditable revenue from the source of truth, and sketch-friendly approximate engagement. Different guarantees, different pipelines.',
      },
      {
        text: 'Does anyone need alerts when a key metric shifts sharply?',
        cost: 1,
        reveals: 'Yes, ping us if signups or revenue drop hard day-over-day.',
        crucial: false,
        value: 3,
        changes: 'Adds a threshold check at the end of the daily rollup that triggers an alert. Cheap on top of batch, and easy to forget if you do not ask.',
      },
      {
        text: 'What color palette and chart styling do you want?',
        cost: 0.5,
        reveals: 'On brand and clean. Design will spec it.',
        crucial: false,
        value: 1,
        changes: 'Purely visual, with zero architectural impact. Budget wasted.',
      },
      {
        text: 'Do users need to export dashboard data to CSV or Excel?',
        cost: 1,
        reveals: 'Yes, an export button for the finance folks.',
        crucial: false,
        value: 2,
        changes: 'Adds a CSV export endpoint over the pre-aggregated rollup tables. A small serving-layer feature, not a pipeline driver.',
      },
      {
        text: 'Which BI tool or charting library should we use?',
        cost: 0.5,
        reveals: 'Whatever gets it done: Metabase, a custom React front end, your call.',
        crucial: false,
        value: 1,
        changes: 'A reversible front-end tooling choice, not a system requirement. Low value early in the conversation.',
      },
    ],
    trapForUnasked: {
      headline: 'Two sprints in, the streaming bill lands.',
      body: "You heard 'dashboard', assumed real-time, and built a Kafka plus stream-processor pipeline updating metrics to the second, 24/7, with its own on-call rotation. Then you learn executives check it once each morning over coffee. You spent weeks and a steep cloud bill delivering sub-second freshness to a daily reader, when a nightly batch job would have been cheaper, simpler, and far easier to backfill.",
      lesson: 'Match pipeline freshness to the decision cadence, never to the word “dashboard.” Ask how often a human acts on the number before choosing between batch and streaming.',
    },
    requirementsMatrix: [
      { req: 'Read once each morning → nightly batch rollup, not streaming', fromQ: 0 },
      { req: '~10B events/day → serve pre-aggregated rollups, never scan raw events', fromQ: 1 },
      { req: 'Internal-only, a few dozen users → no multi-tenant or high-QPS layer', fromQ: 2 },
      { req: 'Metrics sliceable by plan and region (rollup dimensions)', fromQ: 3 },
      { req: '2yr history with reproducible, backfillable jobs', fromQ: 4 },
      { req: 'Revenue exact to the penny; engagement approximate (two tiers)', fromQ: 5 },
      { req: 'Day-over-day threshold alerts on the daily rollup', fromQ: 6 },
    ],
  },
]
