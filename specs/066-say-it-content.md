# 066 — Say-it card template + networking pilot deck (content only)

Second of three thin slices (065 glossary → 066 card content → 067 deck UI).
This slice ships the content contract and the data — no UI. Format decisions
(locked with the user 2026-07-29): speak-only, no timers, no card taxonomy —
the single admission test for a cue is "would an interviewer realistically
say this?" — and decks are local to their briefing, not a global drill tab.

- [ ] `docs/content-pipeline.md` gains §11 "Say-it card template": fields
      `id` (stable — scheduler keys on it), `section` (briefing id), `cue`
      (interviewer voice; textbook prompts like "define X" don't ship),
      `model` (one speakable sentence, two max, first person where it's a
      decision), `checks` (exactly 3: mechanism / tradeoff or cost / decision
      rule), `trap`, `number` (`{val, body}` display + optional `numbersRefs`
      into `numbers.ts`), `terms` (glossary keys)
- [ ] `src/content/sayit.ts`: `SayItCard` type + the networking pilot deck —
      the 6 cards from the appendix below, ported VERBATIM (copy is
      user-approved; don't rewrite)
- [ ] `src/content/numbers.ts` gains 4 entries with derivations:
      `udp-vs-tcp-header`, `retransmit-rtt`, `middlebox-idle-timeout`,
      `protobuf-vs-json-size` (sources: RFC header sizes, speed-of-light RTT
      math already in the numbers db, typical proxy idle timeouts, protobuf
      wire format)
- [ ] Schema test: every card has exactly 3 checks, a non-empty trap, `terms`
      that resolve in the glossary, `numbersRefs` that resolve in
      `numbers.ts`, a `section` that resolves to a manual section id, and a
      `cue` that doesn't start with "define"/"what is"
- [ ] No UI in this slice — no screenshot changes expected; verify.sh green

## Context (read this, not the whole repo)
- **Read**: this spec's appendix (the deck); `docs/content-pipeline.md` §5
  (drill template — §11 sits beside it); `src/content/drills.ts` header
  comment (stable-id convention); `src/content/numbers.ts` interface + one
  entry.
- **Touch**: `docs/content-pipeline.md` (§11), `src/content/sayit.ts` (new),
  `src/content/numbers.ts` (4 entries), `tests/schema.test.ts`.
- **Depends on**: 065 (the glossary keys the cards reference — `udp`,
  `headofline`, `lasteventid`, `grpc`, `protobuf`, etc. — must exist).
- **Scope guard**: no mode, no route, no store — 067 owns all UI and
  scheduling. `1 conn = RAM + a slot` and `timeout ≠ failure` are prose
  numbers with no `numbersRefs`; that's intentional.

## Appendix — pilot deck copy (approved 2026-07-29; port verbatim)

### 1 · `sayit-net-udp`
- cue: Would you ever pick UDP over TCP here? What would have to be true?
- model: Yes — UDP trades delivery guarantees for latency: no handshake, no
  retransmits, no ordering. It wins exactly when a **late packet is worse than
  a lost one** — live voice, video, game state — and my users aren't stuck in
  a browser without WebRTC.
- checks: Named what's traded away: delivery, ordering, connection setup ·
  Gave the decision rule — late worse than lost — with an example · Caught the
  browser caveat: raw UDP needs WebRTC or a fallback
- trap: "UDP is unreliable" is a shrug, not an answer. Say what the
  unreliability buys you.
- number: `8 B vs 20–60 B` — UDP header vs TCP — and zero round trips of
  setup. (`udp-vs-tcp-header`)
- terms: udp, tcp, handshake

### 2 · `sayit-net-hol`
- cue: Users on hotel wifi report that live video freezes, then fast-forwards
  to catch up. What's going on?
- model: That's TCP doing its job: it retransmits lost packets and won't
  deliver anything out of order, so one lost packet blocks everything behind
  it — **head-of-line blocking**. The stream is reliable but late, and for
  live media, late is worse than lost.
- checks: Named the guarantees doing the damage: retransmission + strict
  ordering · Said "head-of-line blocking" out loud · Concluded the fix: switch
  transports (WebRTC/UDP), don't tune TCP
- trap: Don't say "TCP is slow." TCP isn't slow — it's strict. Name the
  guarantee causing the wait.
- number: `≥ 1 RTT` — per retransmit — 100+ ms on a cross-country path, felt
  as a freeze. (`retransmit-rtt`)
- terms: tcp, headofline, webrtc

### 3 · `sayit-net-ws`
- cue: You drew WebSockets for live comments. Defend that — or back off.
- model: I'd back off. Comments are one-way push — users post over plain
  HTTP — so **SSE gives me push without the duplex I'm not using**. WebSockets
  earn their stateful cost only when traffic is genuinely bidirectional and
  high-frequency: chat, multiplayer, presence.
- checks: Applied the test: is the traffic truly bidirectional +
  high-frequency? · Named the cost of stateful connections: memory, sticky
  routing, harder deploys · Offered the cheaper alternative instead of
  defending the wrong pick
- trap: Backing off gracefully scores higher than a confident defense of
  overkill. Retreat is a move.
- number: prose — every open socket is server memory the LB must pin
  somewhere. (no ref)
- terms: websocket, sse, lb

### 4 · `sayit-net-idem`
- cue: A timeout triggered a client retry and a customer got charged twice.
  How do you make retries safe?
- model: With an **idempotency key**: the client attaches a unique id per
  logical operation, the server records it and processes each key once — so a
  retry returns the first result instead of charging again. That's what makes
  "retry with backoff" safe to say.
- checks: Named the mechanism: idempotency key, dedup on the server ·
  Explained the ambiguity: a timeout means the write may have succeeded · Tied
  it back: retries are only safe on idempotent APIs
- trap: "GETs are idempotent" dodges the question — the interviewer is always
  asking about writes.
- number: prose — timeout ≠ failure: the request may have landed; ambiguity is
  the default, not the edge case. (no ref)
- terms: idempotent, retry, timeout

### 5 · `sayit-net-sse`
- cue: Your SSE connection gets killed by a proxy after 60 seconds. What do
  your users see?
- model: Ideally nothing: EventSource auto-reconnects and sends
  **Last-Event-ID**, and my server replays what they missed from a short
  buffer. If I don't keep that buffer, every proxy timeout silently drops
  events — so reconnect-and-replay is part of the design, not an edge case.
- checks: Named the built-in: auto-reconnect with Last-Event-ID · Named your
  obligation: a server-side replay buffer · Framed disconnects as routine, not
  exceptional
- trap: Interviewers probe SSE limits to find out if you've actually shipped
  it. This card is that probe.
- number: `~30–90 s` — typical middlebox idle timeout — your connection's real
  life expectancy. (`middlebox-idle-timeout`)
- terms: sse, lasteventid, timeout

### 6 · `sayit-net-grpc`
- cue: Your public API is REST but services talk gRPC internally. Isn't that
  inconsistent?
- model: It's deliberate. gRPC's binary protobuf over HTTP/2 is fast and
  typed, but it assumes **you control both ends** — browsers and third parties
  don't speak it well. So REST at the boundary, gRPC inside where I own every
  client.
- checks: Named what gRPC buys: binary encoding, HTTP/2, generated typed
  stubs · Named the constraint: poor browser/third-party support at the edge ·
  Stated the rule: REST at the boundary, gRPC service-to-service
- trap: If probed past your experience, say where it ends — "I've seen it run,
  not operated it" is a strong answer.
- number: `15 B vs 40 B` — the same User object in protobuf vs JSON — less
  space, less CPU to parse. (`protobuf-vs-json-size`)
- terms: grpc, rest, protobuf
