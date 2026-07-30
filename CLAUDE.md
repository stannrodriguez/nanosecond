# CLAUDE.md — Nanosecond

You are building **Nanosecond**, a game that teaches systems design from the physics
up. The map of this repo:

- `docs/product-spec.md` — what and why: player, pedagogical laws, all modes
- `docs/architecture.md` — stack, repo layout, simulation math, balance suite, theme
- `docs/content-pipeline.md` — content templates (contracts) + authoring recipes
- `docs/decisions/` — ADRs; add one before any hard-to-reverse choice
- `docs/reference/` — five prototypes, now PORTED (see each file's header); voice/feel
  reference only — the shipped code in `src/` is the source of truth
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
3. Build → run `scripts/verify.sh` → it ends by printing which screenshots
   changed vs `e2e/baseline/`. LOOK at those (only those). This is a visual
   game; if a screen looks broken, cramped, or off-palette, fix it before
   calling the spec done. Intended changes: `node scripts/shots-changed.mjs
   --update` and commit the new baseline. Unintended changes are regressions.
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
8. Landing a spec is PART OF doing it, not a follow-up. Once verify is green,
   the flagged shots are reviewed, the boxes are checked and the row is
   flipped: push the branch, open a PR against main (repo template), and MERGE
   it. Do not stop to ask per slice — this file is the standing authorization,
   and it covers the `specs/` queue in this repo and nothing else. Two hard
   stops: never merge with verify red (leave the branch pushed and report where
   you are stuck), and an irreversible decision still triggers rule 5's ADR.

## Token discipline (context is a budget)
- Start from the spec's **Context** block; read only what it lists. Grep before
  you Read; read slices, not whole files.
- Content files are append-only with schema tests as the contract: read the
  interface + one entry as your example, then append.
- While iterating, run the ONE test file that covers your change; full
  `verify.sh` once at the end.
- View only the screenshots `shots-changed.mjs` flags — except during
  /playtest, which deliberately reviews all of them.

## Quality bar
- **Explanations + visualizations are the product's center of gravity** (playtest-
  confirmed: they're what players love). Every concept — core concepts, key
  technologies, common patterns — teaches through a visualization the player can
  poke; the prose annotates the viz, never the reverse. UNANCHORED prose is the
  bug — depth is not: a briefing may run several substantial blocks as long as
  each block keeps something pokeable in reach. Template:
  `docs/content-pipeline.md` §7.
- **Three registers, every concept** (user-set content philosophy, 2026-07-30 —
  applies to ALL milestones; enforce in specs and reviews):
  1. **UNDERSTAND** — depth first. Real technical explanations are preferred
     over catchy summaries; go as deep as the concept honestly requires.
  2. **GROUND** — precision AND intuition, deliberately doubled. State the
     exact mechanism (terms, numbers, causality), then restate it as the felt
     consequence, analogy, or interaction. Saying one thing twice in two
     registers is a feature, not redundancy — doing both in one sentence is
     usually doing neither.
  3. **RETRIEVE** — compress for the interview. One-breath speakable sentences
     (glossary `say`), explicit relations to neighboring concepts (`related`,
     hand-off paragraphs), and scheduled exercises (say-it decks, drills,
     puzzles). Succinctness lives HERE, not in the teaching prose.
- When the user supplies source material for a topic, shipped content must be an
  information SUPERSET of it, mapped claim-by-claim in the spec's coverage
  appendix (content-pipeline §7). Superset of information, never of wording.
- Every displayed number is derivable: it must exist in `src/content/numbers.ts`
  with a `derivation`.
- Every jargon word in player-facing copy is a `<Term>` with a glossary entry.
- Every component/toy carries `simplifies` fine print.
- Every failure the player experiences produces a plain-language post-mortem.
- Tone: confident, concrete, lightly playful — match `docs/reference/`.
- Accessibility floor: visible keyboard focus, prefers-reduced-motion, 380px width.

## Definition of done (v1)
Specs 000–080 done, verify green, and a human can: play 18 lab toys (12 v1 + the
6-toy ADR 0005 deep tier), browse 28
Concept Library sections (core concepts, key technologies, common patterns — each
with an interactive visualization; the 28th, handling failure, added by ADR
0006), answer 60 drills with spaced repetition, clear
6 builder scenarios, solve
12 flaw puzzles + 6 taste tests + 6 interrogations, win an On-Call run, see the
Forge gate components behind toys, and export a pre-interview briefing from the
Scar Journal.
