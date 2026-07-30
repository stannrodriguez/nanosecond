# 074 — Connection edges: the graph becomes content (P3)

Prerequisite P3 from `docs/coverage-map.md` §D.0 and the mechanism behind the
three-registers RETRIEVE contract's "relations to neighboring concepts." Today
a connection is a bare id in `related.sections`; after this spec it is a
CLAIM — an edge with a why-sentence in each direction, rendered on both pages.
Landing this before the fill-out queue avoids ~15 per-spec migrations.

- [x] `src/content/edges.ts` (new): central typed list, one row per edge:
      `{ a, b, kind ('needs' | 'trades-against' | 'composes-with' |
      'breaks-without'), why (a→b sentence), whyBack (b→a sentence — may
      be omitted ONLY for the §C.2 one-way edges) }`. Central file, not
      per-section: one source of truth, reciprocity for free, testable as a
      graph.
- [x] Briefing page renders **WHERE THIS TOUCHES** at the foot (replacing the
      bare `related.sections` links; `related.terms`/`toys` render as today):
      each row = neighbor title + kind badge + the why-sentence facing THIS
      page. Works at 380px, keyboard-reachable links.
- [x] The ~54 existing `related.sections` links migrate to edges using the
      sentences already written in coverage-map §C.1; `related.sections` is
      removed from the type (edges are derived per-section at render time)
- [x] The four networking edges from §C (to `api-design`,
      `realtime-updates`, `load-balancer`, `cdn`) land here with both
      directions — they connect already-shipped pages. All other §C.2 edges
      land WITH their briefings' fill-out specs, not here.
- [x] Schema tests: every edge's endpoints resolve to section ids; every
      `why`/`whyBack` ≥ 40 chars (a sentence, not a label); no section
      exceeds SIX outbound edges (the §C.3 cap — review decision 2026-07-30);
      no duplicate pairs; every section keeps ≥1 edge so no page is an island
- [x] Fill-out spec checklist note added to content-pipeline §7: a briefing
      spec ships its outbound edges (both directions phrased) in the same
      change as its blocks and deck
- [x] verify.sh green; screenshots of a briefing foot reviewed (desktop +
      380px)

## Context (read this, not the whole repo)
- **Read**: coverage-map §C in full (C.1 sentences are the migration
  content; C.3 cap and hub warnings); `src/content/manual/types.ts`;
  `RelatedRow` in `src/modes/manual/index.tsx`; content-pipeline §7.
- **Touch**: `src/content/edges.ts` (new), `src/content/manual/types.ts` +
  per-shelf files (drop `related.sections`), `src/modes/manual/index.tsx`
  (WHERE THIS TOUCHES), `docs/content-pipeline.md`, `tests/schema.test.ts`,
  e2e + baselines.
- **Scope guard**: migrate existing edges + the four networking edges ONLY.
  No new edges for unshipped pages, no graph visualization (v2 candidate),
  no changes to briefing prose.
