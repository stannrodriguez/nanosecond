# 075 — numbers.ts bundles N3 + N4 (cache/delivery, transport/transfer/async)

Prerequisite P4 from `docs/coverage-map.md` §D.0. Same shape as 071: pure
data, ~31 new `NumberEntry` rows. **Blocks F4, F11, F12, F13, F14.** Follows
071 so its derivation conventions carry over; may land any time before F4.

- [x] Every id in coverage-map §B.4 bundle **N3** (cache and delivery, 11
      ids) exists with a 3-step `derivation`, `boundingPhysics`, `confusions`
- [x] Every id in bundle **N4** (transport, transfer, and async, 20 ids)
      likewise
- [x] Derivation discipline per §B.4 — in this bundle that especially means
      `upload-time-derivation` (the transfer-time arithmetic that motivates
      resumable uploads), `stampede-refresh-curve`, `burst-headroom`, and
      `batching-improvement`: the arithmetic ships as the derivation
- [x] Reuse over re-adding where a source value already resolves (§B.4 note);
      unique ids; existing schema tests green
- [x] verify.sh green; no screenshot changes expected (data only)

## Context (read this, not the whole repo)
- **Read**: coverage-map §B.4 (N3/N4 lists + notes); `numbers.ts` interface +
  071's entries as the convention.
- **Touch**: `src/content/numbers.ts` only.
- **Scope guard**: no drills, no briefing text, no glossary.
