# 071 — numbers.ts bundles N1 + N2 (capacity ceilings, storage mechanics)

Prerequisite P1 from `docs/coverage-map.md` §D.0. Pure data: ~30 new
`NumberEntry` rows with real derivations, no UI, no briefing changes.
**Blocks fill-out specs F1, F2, F5, F6, F9, F12** — land this before them.

- [ ] Every id in coverage-map §B.4 bundle **N1** (capacity ceilings, 13 ids)
      exists in `src/content/numbers.ts` with a 3-step `derivation`,
      `boundingPhysics`, and `confusions`; `toyId` set only where a real toy
      teaches it (else null)
- [ ] Every id in bundle **N2** (storage and index mechanics, 17 ids)
      likewise
- [ ] Derivation discipline per §B.4: the entries whose source value came WITH
      arithmetic (dataset-size sharding check, async duration test,
      transfer-time computation, burst headroom, quorum overlap) ship that
      arithmetic as the derivation — a bare value there is a defect
- [ ] No id collides with or duplicates an existing entry — §B.4 lists the
      four source quantities that already resolve to existing ids
      (`redis-ops`, `pg-writes`, `kafka-msgs`, `cross-region-rtt`); reuse,
      don't re-add
- [ ] Existing schema tests green (3-step derivations, unique ids); verify.sh
      green; no screenshot changes expected (data only)

## Context (read this, not the whole repo)
- **Read**: `docs/coverage-map.md` §B.4 (the id lists + derivation notes) and
  the relevant §A inventory rows when a value needs its source context;
  `src/content/numbers.ts` interface + two entries as the model.
- **Touch**: `src/content/numbers.ts` only (plus tests if an assertion helps).
- **Scope guard**: no drills, no briefing text, no glossary. Values must be
  defensible without the source in hand — the derivation IS the citation.
