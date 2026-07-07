# 081 — The stack map (the vertical axis of the Lab)

THE JOURNEY (spec-less, landed with PR #11's orientation layer) maps toys
horizontally — one request moving between machines. Playtesting round three:
that's a map of a web backend, not of computing. This spec adds the vertical
axis from ADR 0005: **THE STACK** — a computer is machines built out of
machines, and at every floor data is only ever transformed or moved. Toys
get a floor; dark floors show their promises; briefings gain cross-floor
ECHO lines (the same pattern recurring floors apart — caching, queues,
batching — which IS the "understand computers" insight).

- [x] New content type `src/content/stack.tsx`: ordered floors (planet →
      network → machine → chip → cell → physics), each { id, name, gist
      (the two verbs at this floor, one line), toyIds[], promised (what's
      coming/spec refs/v2, or null) }; `floorForToy` helper
- [x] The Lab index map panel gains a JOURNEY / STACK view toggle; stack
      view lists floors top to bottom with their toy chips (deep-linking,
      ✓ when done) and faint "coming: …" promises — thin floors are shown
      honestly, never hidden
- [x] A one-line thesis sits above the floors: two verbs at every floor —
      transform data, move data — and moving is the expensive one
- [x] Toy briefings' YOU ARE HERE gains the stack coordinate (journey
      station + floor)
- [x] `ToyBriefing` gains optional `echo` — "this same pattern, floors
      apart" — authored for every toy with a TRUE echo (≥6 at launch:
      cache recursion, the universal waiting line, batching, Little's law,
      staleness/coherence, overload); no echo is invented to hit a quota
- [x] Schema tests: floor ids unique, every toy on exactly ONE floor,
      non-empty gists, echoes render 40–300 chars, ≥6 echoes exist
- [x] Contracts documented in `docs/content-pipeline.md` §2
- [x] e2e: toggle to STACK, floors + a promise visible, a toy chip
      deep-links; new `lab-stack.png` screenshot; 380px no overflow
- [x] Balance suite untouched and green; verify.sh green; changed shots
      reviewed per autonomy rule 3

## Context (read this, not the whole repo)
- **Read**: ADR 0005 (the frame this implements), `src/content/journey.tsx`
  (the sibling axis — mirror its shape), `src/modes/lab/index.tsx`
  `JourneyMap` + `FieldBriefing` (the components this extends),
  `src/content/briefings.tsx` interface.
- **Touch**: `src/content/stack.tsx` (new), `briefings.tsx` (echo field +
  entries), `src/modes/lab/index.tsx`, `docs/content-pipeline.md` §2,
  `tests/schema.test.ts`, `e2e/modes.spec.ts`, baselines.
- **Floor placement is a claim, not a vibe**: a toy lives where its
  MECHANISM lives (LSM vs B-tree = one box organizing a disk = THE
  MACHINE, even though its channel is storage; Race Light = THE PHYSICS).
- **Don't**: give floors their own colors competing with the four channel
  colors (toy chips keep channel color; floors stay neutral), animate the
  stack, or duplicate the journey's station data — the two axes are
  separate content files, both exactly-one per toy.
