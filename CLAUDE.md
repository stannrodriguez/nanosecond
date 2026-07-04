# CLAUDE.md — Nanosecond

You are building **Nanosecond**, a game that teaches systems design from the physics
up. The map of this repo:

- `docs/product-spec.md` — what and why: player, pedagogical laws, all modes
- `docs/architecture.md` — stack, repo layout, simulation math, balance suite, theme
- `docs/content-pipeline.md` — content templates (contracts) + authoring recipes
- `docs/decisions/` — ADRs; add one before any hard-to-reverse choice
- `docs/reference/` — five working prototypes; source of truth for look, feel, voice
- `specs/` — the ordered work queue; `specs/README.md` is the index
- `tests/` — the verification layer; `scripts/verify.sh` runs everything
- `.claude/commands/` — /milestone, /author-content, /playtest, /status

## Stack & commands
Vite + React 18 + TypeScript · zustand · vitest · Playwright · pnpm.
`pnpm dev` · `scripts/verify.sh` (typecheck + test + e2e). **A spec is not done
until verify.sh is green.**

## How to work (autonomy rules)
1. Take the FIRST spec in `specs/README.md` not marked done. Work only on it.
2. Before coding, restate its acceptance criteria in your plan.
3. Build → run `scripts/verify.sh` → LOOK at the Playwright screenshots in
   `e2e/shots/`. This is a visual game; if a screen looks broken, cramped, or
   off-palette, fix it before calling the spec done.
4. Check the spec's boxes, flip its row in `specs/README.md`, commit as
   `spec NNN: <summary>`, move on.
5. Never ask the user a question the docs answer. If the docs are silent AND the
   decision is reversible: decide, add a line to the commit message, continue. If
   irreversible (save-data model, routing scheme): write an ADR in
   `docs/decisions/` and stop to ask.
6. Content lives as typed data in `src/content/`, engines in `src/engine/`; engines
   never import content. New content must follow `docs/content-pipeline.md`
   templates exactly (the content-authoring skill enforces this).
7. Every simulation change keeps the balance suite green — those tests encode
   "the game teaches true things" and are load-bearing.

## Quality bar
- Every displayed number is derivable: it must exist in `src/content/numbers.ts`
  with a `derivation`.
- Every jargon word in player-facing copy is a `<Term>` with a glossary entry.
- Every component/toy carries `simplifies` fine print.
- Every failure the player experiences produces a plain-language post-mortem.
- Tone: confident, concrete, lightly playful — match `docs/reference/`.
- Accessibility floor: visible keyboard focus, prefers-reduced-motion, 380px width.

## Definition of done (v1)
Specs 000–080 done, verify green, and a human can: play 12 lab toys, read the field
manual, answer 60 drills with spaced repetition, clear 6 builder scenarios, solve
12 flaw puzzles + 6 taste tests + 6 interrogations, win an On-Call run, see the
Forge gate components behind toys, and export a pre-interview briefing from the
Scar Journal.
