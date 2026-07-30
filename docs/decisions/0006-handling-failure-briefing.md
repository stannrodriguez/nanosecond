# ADR 0006: "Handling failure" becomes the 28th Concept Library briefing
Date: 2026-07-30 · Status: accepted (user-directed, coverage-map review)

## Context
The Hello Interview source set carries a coherent family of failure-handling
material: timeouts, retries with exponential backoff and jitter, thundering
herds, idempotency keys, circuit breakers, cascading failures. Spec 069's
Appendix A promised it to "a reliability walkthrough spec" without deciding
where that content lives; `docs/coverage-map.md` §D.3 escalated the choice
because CLAUDE.md's v1 definition of done names **27** library sections, and
adding one changes a stated deliverable (autonomy rule 5).

Two options were weighed. **Distribute** the material across `queues`,
`long-running-tasks`, `multi-step`, and `load-balancer` — keeps the count at
27, but "what happens when this fails?" is the single most common senior-
interview probe in the source set, and distribution means no page on the site
answers it as a question; the topic is always a subsection somewhere else.
**Add a 28th briefing** — one more L-sized spec, but the failure family gets a
home the edge graph naturally points at from everywhere, and the walkthrough
idea that seeded this whole arc (stateful reconnects, herds, replay) gets its
anchor page.

## Decision
Add **`handling-failure`** ("Handling failure") to the **patterns** shelf as
the 28th briefing. The definition of done moves from 27 to 28 sections.
Coverage-map spec **F16** builds it, gated on P2a and F13 as mapped; the
briefing follows the three-registers contract like every other fill-out
(blocks + terms panel + say-it deck + edges). Cross-cutting failure mentions
on other pages stay — they link here for depth rather than re-teaching it.

## Consequences
- CLAUDE.md definition of done: 27 → 28 sections (edited with this ADR).
- When F16 ships: `tests/schema.test.ts` section counts change (28 total,
  patterns shelf 8 → 9); the library index and read-counter follow
  automatically.
- The v1 scope grows by one L spec. If v1 needs cutting, F16 is explicitly
  cuttable back to the v2 backlog — the distribute option remains the
  fallback, and this ADR would be superseded.
- `docs/coverage-map.md` §D.3(1) is resolved by this ADR; its F16 row now
  names the briefing.
