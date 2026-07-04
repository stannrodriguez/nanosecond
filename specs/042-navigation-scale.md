# 042 — Navigation scale: URLs, concept registry, Lab index

**Why now:** spec 050 triples in-mode content (12 puzzles + 6 tastes + 6
interrogations) and the flat tab-strip pattern dies past ~a dozen items; the
Scar Journal (045) already wants to link back to the content that scarred you
and can't. Land the navigation spine before more modes build on the old
pattern. Routing scheme is fixed by ADR 0004.

## Acceptance

- [x] **URLs**: every sub-screen is addressable per ADR 0004 —
      `/lab/:toyId`, `/manual/:tab(/:sectionId)`, `/drills/:tab`,
      `/review/:tab`, `/journal/:tab`. Bare mode paths redirect to their
      default child; unknown ids redirect to the mode index. Refresh and
      back/forward keep your place. No mode navigates sub-content via
      `useState` anymore.
- [x] **Concept registry**: `src/content/concepts.ts` ties each concept to
      its toy, manual briefing, glossary terms, and home numbers (drills
      link via `numbersRefs` overlap — no second id scheme).
      `tests/concepts.test.ts` enforces referential integrity: unique ids,
      every ref resolves, every toy has exactly one concept with a matching
      channel, every concept reaches ≥1 drill. Template documented in
      `docs/content-pipeline.md` §9.
- [x] **Lab index**: `/lab` is a channel-grouped card grid (kit primitives),
      showing per-toy completion ✓, forge status, and a completion count.
      Toy detail gets a back link, prev/next, and a registry-derived
      "connected" row (briefing link · drill count · dotted terms). No
      horizontal overflow at 380px on index or detail.
- [x] **Header**: the six learning modes stay the primary row; JOURNAL moves
      to a compact right-aligned utility slot.
- [x] e2e covers: a direct deep link to a toy renders it; browser back from
      toy detail returns to the index; the lab index at 380px doesn't
      overflow. Existing shots still look right (check `e2e/shots/`).
- [x] `scripts/verify.sh` green.

## Out of scope (deliberately)

Home/Map screen (fold into 080 polish); scars storing typed concept ids
(needs a migration decision — scars currently persist free-string themes);
Ladder rung deep links; moving Builder/On-Call run state into the URL
(ephemeral by ADR 0004).
