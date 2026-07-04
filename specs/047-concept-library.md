# 047 — Concept Library (grow the explanation + visualization layer)

Playtesting verdict: the explanations and visualizations are what players love most.
This spec promotes the Field Manual from a supporting mode into the Concept Library —
three browsable shelves (Core Concepts / Key Technologies / Common Patterns) where
every section teaches through an interactive or animated visualization. Template and
full catalog: `docs/content-pipeline.md` §7; product intent: `product-spec.md` §3.2.

- [x] Manual data model gains `shelf`, `viz`, `related`, `feltIn` per
      content-pipeline §7; the 10 existing sections are re-shelved and upgraded to
      the new template (none deleted; merge overlaps rather than duplicating)
- [x] Shelf navigation: sidebar or tab UI grouped by the three shelves, section
      progress ("read" state in localStorage), works at 380px, keyboard navigable
- [x] **Core Concepts shelf (8):** networking essentials · API design · data
      modeling · database indexing · caching · sharding & partitioning · consistent
      hashing · CAP theorem
- [x] **Key Technologies shelf (11):** relational databases · NoSQL databases ·
      blob storage · search-optimized databases · API gateway · load balancer ·
      queues · streams / event sourcing · distributed locks · distributed caches ·
      CDN
- [x] **Common Patterns shelf (8):** pushing realtime updates · managing
      long-running tasks · dealing with contention · scaling reads · scaling
      writes · handling large blobs · multi-step processes · proximity-based
      services
- [x] Every section has ≥1 interactive or animated visualization with at least one
      player-changeable state; schema test enforces `viz` presence and `simplifies`
      fine print
- [x] Every section ends with "where you'll feel this" — a working deep link to the
      toy, drill, puzzle, or scenario that exercises the concept; every toy's
      punchline links back to its section
- [x] Jargon audit stays green (every new term is a <Term> with a glossary entry —
      add entries as needed); every displayed number resolves to `numbers.ts` with a
      derivation
- [x] Balance suite untouched and green; screenshots of all three shelves reviewed
      per autonomy rule 3

## Context (read this, not the whole repo)
- **Read**: `docs/content-pipeline.md` §7 (the template + full 27-section
  catalog — it's the spec's source of truth) and product-spec §3.2. The
  current manual lives in `src/content/manual.tsx` (10 sections) +
  `src/modes/manual/index.tsx`; `docs/reference/` is ported — don't re-read it.
- **Touch**: `src/content/manual.tsx` (add `shelf`/`viz`/`related`/`feltIn`),
  `src/modes/manual/` (shelf nav), viz components (new, colocated with the
  mode or `src/ui/`), `src/content/concepts.ts` (manualId values must track
  any section-id changes — `tests/concepts.test.ts` will catch drift),
  `tests/schema.test.ts` (viz + simplifies enforcement), e2e + baseline shots.
- **Routing (ADR 0004)**: sections are already addressable at
  `/manual/briefings/:sectionId` and the Lab's "keep the loop" row links
  there. If shelves change the path shape (e.g. `/manual/:shelf/:sectionId`),
  keep old section URLs redirecting — links to them exist in shipped UI.
- **Scale warning**: 27 sections ≈ tripling `manual.tsx`; consider splitting
  content per shelf (`manual/concepts.tsx`, …) in the same change so future
  authoring reads one shelf, not the whole library.
