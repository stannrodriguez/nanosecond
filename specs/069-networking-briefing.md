# 069 — Networking briefing restructure (three-registers reference implementation)

The networking page becomes the model-first deep briefing the content
philosophy calls for (CLAUDE.md quality bar · content-pipeline §7 "three
registers"): four viz-led blocks — the layer model as the focal point, then
transport at full depth, then the existing request-path stepper demoted to the
worked example, then hand-offs. Appendix B is the user-approved content
BASELINE (design review 2026-07-30): every claim, number, and precise/intuitive
register pairing in it must ship, but wording and organization are yours to
rework — write in the repo's voice, and never drift toward the source PDF's
phrasing. Appendix A is the source-coverage map the SOURCE SUPERSET rule
requires.

- [x] `ManualSection` gains optional `blocks[]`: `{ heading, body (JSX), viz?
      (JSX), simplifies? }`. When present, the briefing page renders blocks in
      order (numbered heading → prose → viz → fine print), and the legacy
      `body`/`viz`/`simplifies` fields are ignored for that section (they stay
      required by the type — point them at block 1's content so the other 26
      sections and existing schema tests are untouched). Document in
      content-pipeline §7.
- [x] Networking briefing rebuilt as the 4 blocks of Appendix B (content
      baseline — no claim dropped; rephrasing and reorganizing within/across
      blocks is fine), with the new thesis. THE TERMS, WHERE YOU'LL FEEL
      THIS, and SAY IT render below, unchanged.
- [x] New viz `LayerStack` (block 1): 7 floors drawn top-down L7→L1; L7/L4/L3
      bright and clickable (detail: GIVES sentence + HIDES / LIVES HERE / THE
      FORK rows per Appendix B), L5–6 and L1–2 dim, dashed, and non-interactive
      with their one-line labels; **L4 starts open** (it's the floor block 2
      deepens). Keyboard: floors are buttons with aria-expanded; visible focus.
- [x] New viz `LossToggle` (block 2): packet-loss slider 0–10% (step 0.5,
      init 2%), two lanes (TCP · live video call / UDP · the same call), each
      showing the stat line and the felt-consequence band for the current loss
      per Appendix B's copy table. Assumes 30 packets/s and 80 ms RTT —
      stated in the simplifies line.
- [x] Block 3 keeps the existing request-path Stepper with two upgrades:
      each step's caption names the layer doing the work (DNS at L7, TCP+TLS
      handshakes at L4, …) and a final-step note that the connection is torn
      down with FIN/ACK unless kept alive. The "100–200 ms" prose claim and
      the caption RTT numbers cite `fiber-rtt-floor`.
- [x] Glossary: `ip`, `quic`, `rtt` added to the **Networking** group with the
      full speakable contract (say/reachFor/trap — the existing schema test
      enforces it automatically). Every new jargon word in Appendix B prose is
      dotted: ip, quic, rtt join the existing tcp/udp/handshake/headofline/
      dns/tls/cdn/webrtc/request terms.
- [x] `numbers.ts` gains `fiber-rtt-floor`: light in fiber ≈ 200,000 km/s →
      NY↔London ≈ 5,600 km → ≥56 ms round trip before any processing; used by
      block 3 and available to drills.
- [x] Schema tests: a section with `blocks` has ≥2 blocks, every block body
      non-empty, ≥2 blocks carry a viz, and every block with a viz has
      `simplifies` fine print; networking uses blocks.
- [x] verify.sh green; flagged screenshots reviewed at desktop AND 380px per
      autonomy rule 3 (this page grows a lot — check the 380px flow top to
      bottom: stack floors, loss lanes, stepper, terms, say-it card).

## Context (read this, not the whole repo)
- **Read**: this spec end to end (appendices are the content); CLAUDE.md
  quality bar (three registers + superset rule); `src/content/manual/types.ts`;
  the networking section in `src/content/manual/concepts.tsx`;
  `src/modes/manual/index.tsx` SectionView + TermsPanel; one glossary
  Networking entry as the speakable model; `src/content/numbers.ts` interface.
- **Touch**: `src/content/manual/types.ts` (+blocks), `concepts.tsx`
  (networking section), `src/modes/manual/index.tsx` (block rendering),
  new viz components colocated with the manual mode or `src/ui/viz`,
  `src/content/glossary.ts` (3 entries), `src/content/numbers.ts` (1 entry),
  `docs/content-pipeline.md` (§7 blocks note), `tests/schema.test.ts`,
  e2e + baselines.
- **Voice**: confident, concrete, lightly playful. The registers are already
  in the prose — precision sentences and intuition sentences deliberately
  doubled. Do not compress them into each other.
- **Scope guard**: no edge-graph work, no changes to other briefings, no new
  say-it cards, no changes to the deck or terms panel. The neighbor-page
  obligations in Appendix A are commitments for FUTURE specs, not this one.

## Appendix A — source coverage (Hello Interview "Networking Essentials")
Superset is site-level (content-pipeline §7). Every source topic maps to a
destination or carries a waiver.

**On this page (069):** layered architecture / OSI framing · layers-as-
abstractions · kernel-vs-user-space callout · the simple-web-request lifecycle
including TCP handshake (SYN/SYN-ACK/ACK) and FIN/ACK teardown · connection
state + keep-alive/reuse · TCP characteristics (connection-oriented, reliable,
ordered, flow/congestion control) · UDP characteristics + when-to-choose list
(latency-critical, loss-tolerant, telemetry, non-browser) · browser-UDP caveat
· QUIC as modernized transport + why HTTP/3 exists (HTTP/2 multiplexing vs
per-connection HOL) · header-size and RTT numbers (already in numbers.ts:
`udp-vs-tcp-header`, `retransmit-rtt`; this spec adds `fiber-rtt-floor`).

**Assigned to neighbor pages (recorded here; future fill-out specs must
honor):** HTTP anatomy, methods, status codes, headers, content negotiation,
HTTPS note, never-trust-the-request-body → **api-design**. REST resource
modeling (+updateUser→PUT example) → **api-design**. GraphQL (under/over-
fetching, where it's murky in interviews) → **api-design** (must-add; not
currently covered anywhere). gRPC service definitions, streaming/deadlines/
client-side LB features → **api-design**. SSE mechanics, WebSocket upgrade
handshake + infra caveat, WebRTC signaling/STUN/TURN/NAT + 4-step setup +
video-calling-only guidance → **realtime-updates** (SSE/WS basics already
covered; STUN/TURN depth pending). Client-side load balancing (Redis Cluster
gossip/MOVED, DNS TTL rotation, gRPC built-in, the decision flowchart),
dedicated LB L4 vs L7, health checks, LB algorithms (incl. Least Connections
for persistent conns), hardware/software/cloud LB examples → **load-balancer**.
Vertical vs horizontal scaling → **scaling-reads / scaling-writes**. CDN edge
caching → **cdn**. Regionalization, AZs, regional partitioning (the Uber
example) → **proximity + cdn**. Timeouts, retries with exponential backoff +
jitter, thundering herd, idempotency keys (user-id+date example), circuit
breakers (state machine, where to apply), cascading failures → **reliability
walkthrough spec** (idempotency + middlebox timeouts already partly on this
page's say-it deck).

**Waived:** DHCP/RIR address-allocation trivia (below interview value; L3
floor's "you inherit its geography" covers what matters) · Wireshark /
Network Link Conditioner homework (outside the product — the Lab IS our
version of this) · the source's video/quiz/quick-reference upsells (the terms
panel + say-it deck are our quick reference).

## Appendix B — approved content baseline (keep every claim; rephrase and reorganize freely)

**Thesis:** What is each layer promising your code — and what does keeping
that promise cost?

### Block 1 · THE STACK — the organizing model

Body ¶1:
> Every protocol you will ever name in an interview is an answer to one
> question: **what should this layer promise the one above it?** [ip]IP[/ip]
> promises "give me a packet and an address, and I will probably get it
> there — anywhere on earth." [tcp]TCP[/tcp] promises "give me bytes, and the
> other side will receive all of them, in order." HTTP promises "ask a named
> server for a thing, and you'll get a labeled answer." Each promise is a
> contract: the layer above builds on it without knowing how it's kept, and
> the layer below keeps it without knowing why it's wanted. That contract
> structure — not any particular protocol — is the deep fact about networks.
> It is why you can build a web app without once thinking about fiber, radio,
> or routing tables: three contracts down, someone is turning your bytes into
> light.

Body ¶2:
> The OSI model names seven such layers. For system design, three do all the
> work: **L3** gets packets to a machine, **L4** turns packets into a
> conversation, **L7** gives the conversation meaning. There's a reason the
> action clusters where it does. L3 and L4 are kept by the operating system's
> kernel — decades old, ferociously optimized, and near-impossible to change,
> which is why the internet has run on TCP and UDP for fifty years and why
> [quic]QUIC[/quic], the first serious newcomer, had to disguise itself inside
> UDP to get deployed. L7 lives in your process, where anyone can invent a
> protocol this afternoon — which is why that floor is crowded: HTTP, gRPC,
> WebSockets, and whatever your company builds internally.

Viz: LayerStack. Floor copy:
- **L7 · Application** — who: "where you design". GIVES: "Gives the
  conversation **meaning**: verbs and URLs, names, subscriptions, calls.
  Everything you can curl lives here." HIDES: "That a 'request' is many
  packets on many routes, and that the connection beneath it has a lifespan
  and a cost." LIVES HERE: HTTP · DNS · WebSocket · SSE · gRPC · WebRTC.
  THE FORK: "REST at the public edge, gRPC where you own both ends, push
  protocols only for genuinely push-shaped traffic — every API debate is an
  L7 debate."
- **L5–6 · Session · Presentation** — dim: "absorbed by L7 in practice".
- **L4 · Transport** — who: "the foundational trade" (STARTS OPEN). GIVES:
  "Turns loose packets into an **end-to-end conversation** — with exactly the
  guarantees you ordered, at exactly their price." HIDES: "Loss, duplication,
  reordering: repaired invisibly (TCP) or handed to you raw (UDP), which is
  precisely its offer." LIVES HERE: TCP · UDP · QUIC. THE FORK: "TCP when
  completeness beats freshness; UDP when a late packet is worse than a lost
  one. The next block is this floor at full depth."
- **L3 · Network** — who: "you inherit its geography". GIVES: "Gives every
  machine an **address** and best-effort delivery to any of them, worldwide.
  'Best effort' is load-bearing: it promises to try, not to succeed." HIDES:
  "Routing, BGP, peering — the entire internet backbone is this floor's
  implementation detail." LIVES HERE: IP. THE FORK: "You rarely choose here,
  but you always pay here: regions, availability zones, and the speed-of-light
  round trip are L3 facts your design inherits."
- **L1–2 · Physical · Data link** — dim: "bytes become light".

Simplifies: "real deployments run TCP/IP's four layers wearing OSI's names;
layers 5–6 exist mostly in textbooks — HTTP absorbed their jobs."

Body ¶3 (after viz, dim register):
> Use the stack as a filing system and half of networking vocabulary organizes
> itself. Regions, round trips, and the speed of light are L3 facts. TCP vs
> UDP, handshakes, and head-of-line blocking are L4 facts. REST vs gRPC,
> polling vs push, everything you can `curl` — L7. When an interviewer says
> "L4 load balancer," they are telling you which promises it can see:
> addresses and connections, but never the request inside.

### Block 2 · TRANSPORT — the guarantees you order, and their price

Body ¶1:
> L4 is where you make networking's foundational trade, so it deserves the
> page's full attention. **TCP's promise is completeness:** it numbers every
> byte, the receiver acknowledges what arrived, and anything unacknowledged is
> sent again. Ordering is enforced absolutely — if byte 4,001 is missing,
> bytes 4,002 through 4,000,000 wait in a buffer, delivered to your
> application only when the gap is filled. That refusal to reorder is called
> [headofline]head-of-line blocking[/headofline], and it is the honest price
> of a guaranteed stream: **the stream is never wrong, but it can be
> arbitrarily late.** Recovering one lost packet costs at least one
> [rtt]round trip[/rtt] — the sender has to learn about the loss before it can
> resend — and a round trip is geography: ~1 ms across a city, ~70 ms across a
> country, ~150 ms across an ocean.

Body ¶2:
> **UDP's promise is speed, kept by promising nothing else.** A UDP datagram
> is an addressed envelope: it may arrive, arrive twice, or arrive after the
> one sent behind it — and the moment it arrives, your application has it. No
> handshake before the first byte, no acknowledgments, no buffer holding fresh
> data hostage to old losses. This is not a lesser TCP; it is the correct
> product for a different customer. A video call that receives a 400-ms-old
> audio packet has received garbage — the conversation has moved on. Better
> one syllable crackles than the whole call freezes and fast-forwards. **The
> decision rule: reach for UDP exactly when a late packet is worse than a lost
> one** — live audio and video, game state, high-volume telemetry — and check
> the escape hatch first: browsers can't speak raw UDP, so on the web this
> choice arrives dressed as [webrtc]WebRTC[/webrtc].

Viz: LossToggle ("Same wire, both promises · drag the packet loss").
Lane copy (30 packets/s, 80 ms RTT):
- TCP lane, promise line: "'every byte, in order' — losses repaired, stream
  stalls". Stat: 0% → "smooth — nothing to repair"; else "N% of each second
  spent frozen" where N = min(100, rate·loss·RTT). Feel bands — 0%: "The
  guarantee is free on a clean network. This is why TCP is the right
  default." · ≤2%: "A freeze every ~Xs, each ≥ 80 ms — the call **stutters,
  then fast-forwards**. Every byte eventually arrives; none of it on time." ·
  ≤6%: "Stalls now overlap: the buffer is perpetually waiting on some gap.
  **Reliable and unwatchable** — completeness delivered too late to matter." ·
  >6%: "The stream is a slideshow. TCP is keeping its promise perfectly; the
  promise is simply wrong for live media."
- UDP lane, promise line: "'whatever arrives, immediately' — losses shrugged
  off". Stat: 0% → "smooth — nothing to lose"; else "N% of frames simply
  gone". Feel bands — 0%: "Identical to TCP here — minus one round trip of
  handshake you never paid." · ≤2%: "A blip you barely notice; the
  conversation never stops moving. **Late beats lost — inverted:** lost beats
  late." · ≤6%: "Crackles and the odd dropped syllable — degraded but **live
  and intelligible**. The app papers over gaps instead of waiting on them." ·
  >6%: "Rough — but still live. At loss this bad, no transport saves you; UDP
  at least keeps the survivors current."

Simplifies: "assumes 30 packets/s and an 80 ms round trip; real TCP recovers
smarter (fast retransmit, SACK) and real video hides loss behind jitter
buffers — the shape of the trade survives all of it."

Body ¶3 (after viz, dim register):
> One more pattern worth internalizing, because it explains modern protocol
> history: TCP's head-of-line blocking applies per *connection*, so when
> HTTP/2 multiplexed many requests onto one TCP connection, one lost packet
> could stall all of them at once. QUIC exists precisely to fix this — streams
> that don't block each other, with TLS folded into the first round trip — and
> HTTP/3 is HTTP over QUIC. You rarely need QUIC in an interview answer, but
> saying *why it exists* is a one-sentence proof you understand the layer
> under you.

### Block 3 · ONE TAP, EVERY LAYER — the model in motion

Body:
> Now watch the contracts cooperate. A tap resolves a name ([dns]DNS[/dns] —
> L7 asking L3's question), opens a conversation (TCP's
> [handshake]handshake[/handshake], one round trip; [tls]TLS[/tls], one to two
> more), and only then speaks (HTTP). On a 70 ms cross-country path, a cold
> connection spends 140–210 ms on handshakes before your API sees byte one —
> pure L4 tax, which is why connections are pooled and reused, and why a
> [cdn]CDN[/cdn] terminates TLS near the user even for uncacheable traffic.

Viz: the EXISTING Stepper, with captions upgraded to name each step's layer
(DNS/L7 · TCP+TLS/L4 · CDN edge/L7-terminating · LB · app · DB) and a final
note that the connection closes with FIN/ACK unless kept alive. RTT numbers
cite `fiber-rtt-floor`. Keep the existing simplifies line, extended with:
"and shows one request — real browsers open several connections and reuse
them all."

### Block 4 · WHERE THIS PAGE HANDS OFF

Body (dim register; § links are section links):
> The rest of the stack's decisions live on their own pages: how to shape L7
> APIs (REST's resources, gRPC's contracts) is §API design; how to push
> instead of pull (polling, SSE, WebSockets) is §Pushing realtime updates; how
> a balancer that can only see L4 differs from one that reads L7 — and why
> WebSockets care — is §Load balancer; and what geography does to every number
> on this page is §CDN. The stack you just learned is the map: every one of
> those pages is a floor of this building, furnished.

### New glossary entries (Networking group, full speakable contract)
- **ip** — def covers: addressing + best-effort packet delivery; "best effort"
  means try-not-succeed; why routing is invisible to app developers. say (one
  breath): "IP gives every machine an address and best-effort packet delivery
  — it promises to try, not to succeed — and everything reliable is built on
  top of that honesty." reachFor: naming why regions/RTT/geography constrain a
  design. trap: "Treating the network as reliable — IP never promised that;
  TCP papers over it and UDP hands it to you."
- **quic** — def covers: transport over UDP, per-stream ordering (no
  cross-stream HOL), TLS in first round trip, HTTP/3. say: "QUIC is TCP's
  ideas rebuilt over UDP — independent streams so one loss doesn't stall the
  rest, with encryption folded into the first round trip — and HTTP/3 is HTTP
  running on it." reachFor: explaining why HTTP/2's single-connection
  multiplexing made HOL worse, or naming the modern fix. trap: "Bringing up
  QUIC as a default — it's a one-sentence depth signal, not a design choice
  most interviews need."
- **rtt** — def covers: round-trip time; geography floor via speed of light in
  fiber; why every handshake/retransmit is priced in RTTs. say: "A round trip
  is the network's unit of cost — speed of light in fiber puts a hard floor
  under it, so handshakes, retransmits, and consensus are all priced in RTTs
  you can't engineer away." reachFor: any latency budget; explaining handshake
  or retransmit cost. trap: "Quoting bandwidth when the question is latency —
  a fat pipe doesn't shorten a round trip."
