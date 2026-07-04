# 050 — Design Review full
- [ ] Generalized Diagram renderer + scripted frame player
- [ ] 12 flaw puzzles (4 exist; author 8 via docs/content-pipeline.md §3 recipe;
      ladder per product-spec §3.5 incl. one "actually fine" puzzle). Three of
      the eight are pinned (ADR 0005 — the staff-level anomalies):
      · **"On-Call Doctors"** — write skew: two transactions each read both
        rows, each writes its own; the invariant (≥1 doctor on call) breaks
        with zero write-write conflict. Survives snapshot isolation; only
        serializable (or explicit locking) catches it.
      · **"The Zombie Lock"** — a GC-paused worker's lock lease expires; it
        wakes and writes anyway. Fix: fencing token (glossary seam exists).
      · **"The Retry Storm"** — 3 tiers × 3 retries each, no backoff/jitter/
        budget: a blip becomes 27× load at the DB. Fix: retry budget +
        jittered backoff, retries at ONE layer.
      Remaining five come from the §3 recipe seeds as planned.
- [ ] Upgrade the existing "The Double Send" puzzle's explain + line to state
      the principle: exactly-once = at-least-once + idempotence
- [ ] 6 predict rounds (2 exist) incl. one with confidence-interval scoring
- [ ] 6 taste tests (2 exist) using the distractor taxonomy; "Tables Turn"
      mandatory. Two of the four are pinned (ADR 0005):
      · **"Serializable Everywhere?"** — read-committed + targeted locks vs
        serializable, under a stated throughput number; flip: the money-moving
        invariant where paying the serialization tax wins.
      · **"The 1% Problem"** — hedged requests vs tighter timeouts for a
        100-way fan-out read path; flip: the non-idempotent write path where
        hedging double-fires.
- [ ] Glossary entries for every new term the pinned content uses (write skew,
      lost update, isolation level, snapshot isolation, MVCC, serializable,
      lock lease, retry budget, exponential backoff, jitter, hedged request,
      fan-out; fencing token exists — extend, don't duplicate). Laws L2/L6:
      no puzzle may assume an untaught term.
- [ ] Daily Incident: date-seeded daily puzzle, streak, spoiler-free share string;
      app landing card
- [ ] Par times displayed; teach-back prompt after solves (60s, 3-item self-rubric,
      logged to Scar Journal)
- [ ] Aggregate judgment score + weakest-category surfacing

## Context (read this, not the whole repo)
- **Read**: `docs/content-pipeline.md` §3 (flaw template + RECIPE) and §4 (taste
  template + distractor taxonomy); product-spec §3.5 for Daily Incident, par
  times, and teach-back details. The reference prototype is already ported —
  `src/modes/review/` is the truth for the three game shells.
- **Touch**: `src/content/puzzles.ts` (4 exist → 12), `src/content/predict.ts`
  (2 → 6), `src/content/tastes.ts` (2 → 6), `src/content/glossary.ts`,
  `src/modes/review/*`, `src/ui/Diagram.tsx` (generalize renderer + frame
  player), `src/state/scars.ts` (teach-back logs there),
  `tests/schema.test.ts`, e2e.
- **Inherited constraints**: sub-content URLs per ADR 0004 (puzzles should get
  `/review/flaw/:puzzleId`); append content entries — the schema tests enforce
  the template, so read one existing entry as the example, not the whole file;
  new concepts (if any) need registry rows per content-pipeline §9.
- **Inline from product-spec**: flaw ladder = single-obvious → single-subtle →
  two interacting → "actually fine"; Taste "Tables Turn" flip is mandatory
  (law L5); Daily Incident is date-seeded (no Math.random), streak +
  spoiler-free share string, and becomes the app's landing card.
- **Deep Water note (ADR 0005)**: the pinned puzzles' mechanisms get their Lab
  toys in spec 090 — here the puzzle `brief` + glossary carry the pedagogy
  alone. Do NOT build toys or registry rows for them now; 090 retrofits the
  deep links. Slot the pinned three into the ladder where they fit (write skew
  is a natural "single-subtle"; Retry Storm a natural "two interacting").
