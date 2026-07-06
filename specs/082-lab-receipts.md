# 082 — Lab receipts (surface the derivations on every toy)

Every number in `numbers.ts` already carries a 3-step derivation and its
`boundingPhysics` — but toy pages never show them, so the "why is this number
what it is, one level down" layer exists as data and is invisible exactly
where the player's hands are (ADR 0005 context #4). This spec surfaces it:
each toy gains **THE RECEIPTS**, a disclosure listing every `targetNumber`
with its value, derivation chain, and bounding physics. Zero new content —
pure surfacing of the numbers database the game already trusts.

- [x] Toy detail pages render a "THE RECEIPTS — where these numbers come from"
      disclosure (FinePrint-style toggle, collapsed by default so the page
      stays sim-first), placed between the punchline area and KEEP THE LOOP
- [x] For each of the toy's `targetNumbers`: name + value + unit, the 3-step
      derivation (mechanism → math → result), and `boundingPhysics`; entries
      with `simplifies` show it as fine print
- [x] Works at 380px (no horizontal overflow), keyboard-toggleable with
      visible focus, honest under prefers-reduced-motion (no animation needed)
- [x] e2e: open the receipts on one toy, assert a derivation line is visible,
      screenshot; existing toy screenshots unchanged while collapsed
- [x] No content files change; no schema change needed (derivations are
      already enforced 3-step by `tests/schema.test.ts`)
- [x] Balance suite untouched and green; `scripts/verify.sh` green; changed
      shots reviewed per autonomy rule 3

## Context (read this, not the whole repo)
- **Read**: `src/content/numbers.ts` (the `NumberEntry` interface, lines
  1–16, + one entry as example), `src/modes/lab/index.tsx` `ToyDetail`
  (placement) and `src/ui/FinePrint.tsx` (the disclosure pattern to mirror).
- **Touch**: `src/modes/lab/index.tsx` (or a small colocated component),
  `e2e/modes.spec.ts` (one new test), baselines only if a default-collapsed
  row shifts layout.
- **Prior art**: the Ladder tab (`src/modes/manual/`) already renders
  number physics — reuse its tone, not necessarily its code.
- **Don't**: build a per-number page, edit numbers.ts, or expand the
  briefing panel — the receipts are a sibling disclosure, not more briefing.
