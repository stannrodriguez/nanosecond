<!--
  Nanosecond PR template. Fill in every section; delete the HTML comments.
  A spec is not done until scripts/verify.sh is green and the screenshots look right.
-->

## What & why
<!-- One or two sentences: what this change does and the problem it solves.
     If it closes a spec, name it (e.g. "Closes spec 055 — Interrogation"). -->

## Specs / scope
<!-- Which specs/rows in specs/README.md does this advance or complete?
     List the acceptance boxes you checked. -->

## Verification
<!-- Paste the outcome, don't just claim it. -->
- [ ] `scripts/verify.sh` green (typecheck + unit/balance + e2e)
- [ ] Balance suite still green (the game teaches true things)
- [ ] Playwright screenshots in `e2e/shots/` reviewed at desktop **and** 380px

<!-- Note anything that failed, was skipped, or is flaky, with the output. -->

## Screenshots
<!-- Drop the key e2e/shots/*.png here for any visual change. Before/after if you
     touched an existing screen. -->

## Quality bar (check what applies)
- [ ] Every displayed number is derivable in `src/content/numbers.ts` with a `derivation`
- [ ] Every jargon word in player-facing copy is a `<Term>` with a glossary entry
- [ ] Every new component/toy carries `simplifies` fine print
- [ ] Every failure the player can hit produces a plain-language post-mortem
- [ ] Engines still never import content

## Decisions
<!-- Any spec-silent call you made? Link the ADR in docs/decisions/ (irreversible)
     or summarize the reversible choice here. -->
