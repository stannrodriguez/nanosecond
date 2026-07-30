// Say-it decks (docs/content-pipeline.md §11, specs 066/067): speak-only
// retrieval cards, each deck LOCAL to one briefing. The cue is a question an
// interviewer would realistically ask; the model is ONE speakable answer
// (a breath, max) in the player's first person. ids are stable — the Leitner
// scheduler keys on them; never reuse or rename. The networking deck's copy
// was approved in design review (spec 066 appendix) — ported verbatim.

import type { ReactNode } from 'react'
import { C } from '../theme'

const em = (children: ReactNode) => <span style={{ color: C.net, fontWeight: 600 }}>{children}</span>

export interface SayItCard {
  /** stable — the Leitner scheduler keys on it */
  id: string
  /** the briefing (manual section id) this card belongs to */
  section: string
  /** the front: interviewer voice, a concrete system on the table */
  cue: string
  /** the back's centerpiece: one speakable answer, first person where it's a decision */
  model: ReactNode
  /** exactly 3 self-grade key points: mechanism / tradeoff or cost / decision rule */
  checks: [string, string, string]
  /** the wrong sentence people say — and what to say instead */
  trap: string
  /** one quantity to leave with; refs resolve in numbers.ts (empty for prose numbers) */
  number: { val: string; body: string; refs: string[] }
  /** keys into glossary.ts */
  terms: string[]
}

export const SAYIT_CARDS: SayItCard[] = [
  {
    id: 'sayit-net-udp',
    section: 'networking',
    cue: 'Would you ever pick UDP over TCP here? What would have to be true?',
    model: (
      <>
        Yes — UDP trades delivery guarantees for latency: no handshake, no retransmits, no ordering. It wins exactly when
        a {em('late packet is worse than a lost one')} — live voice, video, game state — and my users aren't stuck in a
        browser without WebRTC.
      </>
    ),
    checks: [
      'Named what’s traded away: delivery, ordering, connection setup',
      'Gave the decision rule — late worse than lost — with an example',
      'Caught the browser caveat: raw UDP needs WebRTC or a fallback',
    ],
    trap: '"UDP is unreliable" is a shrug, not an answer. Say what the unreliability buys you.',
    number: { val: '8 B vs 20–60 B', body: 'UDP header vs TCP — and zero round trips of setup.', refs: ['udp-vs-tcp-header'] },
    terms: ['udp', 'tcp', 'handshake'],
  },
  {
    id: 'sayit-net-hol',
    section: 'networking',
    cue: 'Users on hotel wifi report that live video freezes, then fast-forwards to catch up. What’s going on?',
    model: (
      <>
        That's TCP doing its job: it retransmits lost packets and won't deliver anything out of order, so one lost packet
        blocks everything behind it — {em('head-of-line blocking')}. The stream is reliable but late, and for live media,
        late is worse than lost.
      </>
    ),
    checks: [
      'Named the guarantees doing the damage: retransmission + strict ordering',
      'Said "head-of-line blocking" out loud',
      'Concluded the fix: switch transports (WebRTC/UDP), don’t tune TCP',
    ],
    trap: 'Don’t say "TCP is slow." TCP isn’t slow — it’s strict. Name the guarantee causing the wait.',
    number: { val: '≥ 1 RTT', body: 'per retransmit — 100+ ms on a cross-country path, felt as a freeze.', refs: ['retransmit-rtt'] },
    terms: ['tcp', 'headofline', 'webrtc'],
  },
  {
    id: 'sayit-net-ws',
    section: 'networking',
    cue: 'You drew WebSockets for live comments. Defend that — or back off.',
    model: (
      <>
        I'd back off. Comments are one-way push — users post over plain HTTP — so {em('SSE gives me push without the duplex')}{' '}
        I'm not using. WebSockets earn their stateful cost only when traffic is genuinely bidirectional and high-frequency:
        chat, multiplayer, presence.
      </>
    ),
    checks: [
      'Applied the test: is the traffic truly bidirectional + high-frequency?',
      'Named the cost of stateful connections: memory, sticky routing, harder deploys',
      'Offered the cheaper alternative instead of defending the wrong pick',
    ],
    trap: 'Backing off gracefully scores higher than a confident defense of overkill. Retreat is a move.',
    number: { val: '1 conn = RAM + a slot', body: 'every open socket is server memory the LB must pin somewhere.', refs: [] },
    terms: ['websocket', 'sse', 'lb'],
  },
  {
    id: 'sayit-net-idem',
    section: 'networking',
    cue: 'A timeout triggered a client retry and a customer got charged twice. How do you make retries safe?',
    model: (
      <>
        With an {em('idempotency key')}: the client attaches a unique id per logical operation, the server records it and
        processes each key once — so a retry returns the first result instead of charging again. That's what makes "retry
        with backoff" safe to say.
      </>
    ),
    checks: [
      'Named the mechanism: idempotency key, dedup on the server',
      'Explained the ambiguity: a timeout means the write may have succeeded',
      'Tied it back: retries are only safe on idempotent APIs',
    ],
    trap: '"GETs are idempotent" dodges the question — the interviewer is always asking about writes.',
    number: { val: 'timeout ≠ failure', body: 'the request may have landed; ambiguity is the default, not the edge case.', refs: [] },
    terms: ['idempotent', 'retry', 'timeout'],
  },
  {
    id: 'sayit-net-sse',
    section: 'networking',
    cue: 'Your SSE connection gets killed by a proxy after 60 seconds. What do your users see?',
    model: (
      <>
        Ideally nothing: EventSource auto-reconnects and sends {em('Last-Event-ID')}, and my server replays what they missed
        from a short buffer. If I don't keep that buffer, every proxy timeout silently drops events — so reconnect-and-replay
        is part of the design, not an edge case.
      </>
    ),
    checks: [
      'Named the built-in: auto-reconnect with Last-Event-ID',
      'Named your obligation: a server-side replay buffer',
      'Framed disconnects as routine, not exceptional',
    ],
    trap: 'Interviewers probe SSE limits to find out if you’ve actually shipped it. This card is that probe.',
    number: { val: '~30–90 s', body: 'typical middlebox idle timeout — your connection’s real life expectancy.', refs: ['middlebox-idle-timeout'] },
    terms: ['sse', 'lasteventid', 'timeout'],
  },
  {
    id: 'sayit-net-grpc',
    section: 'networking',
    cue: 'Your public API is REST but services talk gRPC internally. Isn’t that inconsistent?',
    model: (
      <>
        It's deliberate. gRPC's binary protobuf over HTTP/2 is fast and typed, but it assumes {em('you control both ends')} —
        browsers and third parties don't speak it well. So REST at the boundary, gRPC inside where I own every client.
      </>
    ),
    checks: [
      'Named what gRPC buys: binary encoding, HTTP/2, generated typed stubs',
      'Named the constraint: poor browser/third-party support at the edge',
      'Stated the rule: REST at the boundary, gRPC service-to-service',
    ],
    trap: 'If probed past your experience, say where it ends — "I’ve seen it run, not operated it" is a strong answer.',
    number: { val: '15 B vs 40 B', body: 'the same User object in protobuf vs JSON — less space, less CPU to parse.', refs: ['protobuf-vs-json-size'] },
    terms: ['grpc', 'rest', 'protobuf'],
  },
]

export const sayItCardsForSection = (sectionId: string): SayItCard[] => SAYIT_CARDS.filter((c) => c.section === sectionId)
