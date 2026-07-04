---
description: Execute the next unfinished spec from specs/README.md, efficiently
---

Execute the next spec in the queue. Work token-lean:

1. Open `specs/README.md`, take the FIRST row not marked ✅. Open that spec.
2. Read ONLY what its **Context** block lists. Do not re-read product-spec,
   architecture, or reference prototypes unless the Context block names them —
   the shipped code in `src/` is the truth for everything already built.
3. Restate the acceptance boxes as your plan. Then build.
4. While iterating, run the narrow check: the one vitest file
   (`pnpm exec vitest run tests/X.test.ts`) or one e2e spec
   (`pnpm exec playwright test e2e/X.spec.ts`) that covers what you changed.
5. When the spec is complete, run `scripts/verify.sh` ONCE. It ends by
   printing which screenshots changed vs `e2e/baseline/` — view ONLY those.
   If a change is intended, accept it: `node scripts/shots-changed.mjs
   --update` (the baseline diff is part of your commit). If a shot you didn't
   mean to touch changed, that's a regression — fix it.
6. Check the spec's boxes, flip its row in `specs/README.md`, commit as
   `spec NNN: <summary>`, push.

Decision rules are in CLAUDE.md §How to work — reversible: decide and note in
the commit; irreversible: ADR + stop.
