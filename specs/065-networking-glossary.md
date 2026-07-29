# 065 — Networking glossary shelf + speakable contract

First of three thin slices toward "Say it" articulation decks (065 glossary →
066 card content → 067 deck UI). Each slice is a separate small PR so the
user can audit as we build. This one is pure glossary: no new modes, no new
content types.

- [ ] `GlossaryEntry` gains three optional fields: `say` (ONE interview-ready
      sentence in the player's voice — if you can't say it in a breath, the
      entry is wrong), `reachFor` (when to pick it), `trap` (the wrong
      sentence people say, and what to say instead)
- [ ] `docs/content-pipeline.md` §1 documents the speakable-field contract
      alongside the existing def contract
- [ ] Glossary gains a **Networking** group; new entries with all three
      speakable fields populated: `tcp`, `udp`, `handshake`, `headofline`,
      `grpc`, `protobuf`, `webrtc`, `lasteventid`
- [ ] Existing strays move into the Networking group with keys unchanged
      (<Term> refs keep working): `dns`, `tls`, `websocket`, `sse`, `polling`
- [ ] Schema test: every entry in the Networking group has non-empty
      `say`/`reachFor`/`trap`; `say` is a single sentence (no more than one
      terminal period)
- [ ] Reference screen renders the new group and (if present) the speakable
      fields without layout breakage at 380px; screenshots reviewed per
      autonomy rule 3; verify.sh green

## Context (read this, not the whole repo)
- **Read**: `docs/content-pipeline.md` §1; `src/content/glossary.ts`
  interface + two entries + the group list at the bottom; the networking
  briefing in `src/content/manual/concepts.tsx` for voice calibration.
- **Touch**: `src/content/glossary.ts`, `docs/content-pipeline.md` (§1),
  `tests/schema.test.ts`, possibly the Reference screen component if the new
  fields are displayed (displaying them is optional in this slice — required
  is only that nothing breaks).
- **Voice**: `say` sentences are first-person interview answers, not
  definitions. Model: "UDP trades delivery guarantees for latency — no
  handshake, no retransmits, no ordering — so it wins exactly when a late
  packet is worse than a lost one." Source material: Hello Interview
  networking guide (user-provided); tone bar: docs/reference/.
- **Scope guard**: do NOT add say/reachFor/trap to non-networking entries in
  this slice; do NOT build any card/deck machinery — that's 066/067.
