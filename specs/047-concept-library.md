# 047 — Concept Library (grow the explanation + visualization layer)

Playtesting verdict: the explanations and visualizations are what players love most.
This spec promotes the Field Manual from a supporting mode into the Concept Library —
three browsable shelves (Core Concepts / Key Technologies / Common Patterns) where
every section teaches through an interactive or animated visualization. Template and
full catalog: `docs/content-pipeline.md` §7; product intent: `product-spec.md` §3.2.

- [ ] Manual data model gains `shelf`, `viz`, `related`, `feltIn` per
      content-pipeline §7; the 10 existing sections are re-shelved and upgraded to
      the new template (none deleted; merge overlaps rather than duplicating)
- [ ] Shelf navigation: sidebar or tab UI grouped by the three shelves, section
      progress ("read" state in localStorage), works at 380px, keyboard navigable
- [ ] **Core Concepts shelf (8):** networking essentials · API design · data
      modeling · database indexing · caching · sharding & partitioning · consistent
      hashing · CAP theorem
- [ ] **Key Technologies shelf (11):** relational databases · NoSQL databases ·
      blob storage · search-optimized databases · API gateway · load balancer ·
      queues · streams / event sourcing · distributed locks · distributed caches ·
      CDN
- [ ] **Common Patterns shelf (8):** pushing realtime updates · managing
      long-running tasks · dealing with contention · scaling reads · scaling
      writes · handling large blobs · multi-step processes · proximity-based
      services
- [ ] Every section has ≥1 interactive or animated visualization with at least one
      player-changeable state; schema test enforces `viz` presence and `simplifies`
      fine print
- [ ] Every section ends with "where you'll feel this" — a working deep link to the
      toy, drill, puzzle, or scenario that exercises the concept; every toy's
      punchline links back to its section
- [ ] Jargon audit stays green (every new term is a <Term> with a glossary entry —
      add entries as needed); every displayed number resolves to `numbers.ts` with a
      derivation
- [ ] Balance suite untouched and green; screenshots of all three shelves reviewed
      per autonomy rule 3
