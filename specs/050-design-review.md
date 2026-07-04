# 050 — Design Review full
- [ ] Generalized Diagram renderer + scripted frame player
- [ ] 12 flaw puzzles (4 exist; author 8 via docs/content-pipeline.md §3 recipe;
      ladder per product-spec §3.5 incl. one "actually fine" puzzle)
- [ ] 6 predict rounds (2 exist) incl. one with confidence-interval scoring
- [ ] 6 taste tests (2 exist) using the distractor taxonomy; "Tables Turn" mandatory
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
  (2 → 6), `src/content/tastes.ts` (2 → 6), `src/modes/review/*`,
  `src/ui/Diagram.tsx` (generalize renderer + frame player),
  `src/state/scars.ts` (teach-back logs there), `tests/schema.test.ts`, e2e.
- **Inherited constraints**: sub-content URLs per ADR 0004 (puzzles should get
  `/review/flaw/:puzzleId`); append content entries — the schema tests enforce
  the template, so read one existing entry as the example, not the whole file;
  new concepts (if any) need registry rows per content-pipeline §9.
- **Inline from product-spec**: flaw ladder = single-obvious → single-subtle →
  two interacting → "actually fine"; Taste "Tables Turn" flip is mandatory
  (law L5); Daily Incident is date-seeded (no Math.random), streak +
  spoiler-free share string, and becomes the app's landing card.
