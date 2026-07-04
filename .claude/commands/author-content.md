---
description: Author new game content (toys, puzzles, tastes, drills, patterns, concepts)
---

Author content for: $ARGUMENTS

1. Open the matching template section in `docs/content-pipeline.md` (§1
   glossary, §2 toys, §3 flaw puzzles + RECIPE, §4 tastes + distractor
   taxonomy, §5 drills, §6 builder scenarios, §7 concept-library sections, §8 on-call, §9 concepts).
2. Read the target file's interface + ONE existing entry as the example.
   Do not read the whole content file — the schema tests enforce the
   template, and ids are stable/append-only.
3. Write the new entries. Every displayed number must exist in
   `src/content/numbers.ts` with a derivation; every jargon word needs a
   glossary key; every toy/component carries `simplifies` fine print.
4. New toy? Add its concept row (`src/content/concepts.ts`, §9) and its
   entry in the Lab's `TOY_COMPONENTS` map in the same change.
5. Verify with the narrow suite first:
   `pnpm exec vitest run tests/schema.test.ts tests/concepts.test.ts tests/balance.test.ts`
   then `scripts/verify.sh` once at the end; view only the shots it flags.
