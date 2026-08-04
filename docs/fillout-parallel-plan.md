# Fill-out parallel plan — F2–F16 + 080 across 10 agents

This file coordinates a one-time parallel build of the remaining queue
(`specs/README.md` rows 102–118, then 080). Each agent reads this file, executes
ONLY its assignment, and opens + merges its own PRs. Written 2026-08-04.

**Authority.** CLAUDE.md rule 1 ("take the FIRST spec not done") is superseded
for this coordinated effort by the user's explicit instruction; the dependency
gates below preserve the ordering that rule existed to protect. Every other
CLAUDE.md rule stands, including rule 8: landing a spec (push → PR against main
using the repo template → merge) is part of doing it. Do not wait for human
approval; do not merge with verify red.

## Common rules — every agent, every spec

1. **One branch + one PR per spec**, worked strictly in your assignment's order.
   Start each spec from fresh main: `git fetch origin main && git checkout -B
   spec-NNN-<slug> origin/main`. Branch name `spec-NNN-<slug>`.
2. **Author the spec file first**: `specs/NNN-<slug>.md`, modeled directly on
   `specs/076-indexing-search-briefings.md` (the F1 reference). Derive it from
   your row in `docs/coverage-map.md` §D.1 (that row is your scope contract:
   blocks, named viz, card counts) plus the §B.2 destination tables for your
   briefings, and include the Source coverage appendix content-pipeline §7
   requires. Restate acceptance criteria before coding.
3. **Build within your file lane.** Your briefings live where your assignment
   says (`src/content/manual/concepts.tsx` / `technologies.tsx` /
   `patterns.tsx`). Never edit another briefing's blocks — cross-briefing
   hand-offs live ONLY in `src/content/edges.ts`. New viz components go in new
   files (no shared-component edits without checking no other agent's row names
   the same component — none do).
4. **Shared append-only files** (`edges.ts`, `sayit.tsx`, and any stray
   additions to `glossary.ts` / `numbers.ts`): append at the end of the
   relevant group. On a merge conflict there, the cause is two agents appending
   at the same anchor — resolution is ALWAYS union: keep main's entries first,
   yours after. Never delete or reorder another agent's entries.
5. **Queue bookkeeping**: flip ONLY your spec's row in `specs/README.md` to ✅,
   and mark ONLY your row in coverage-map §D.1 (append "— **landed as spec
   NNN**" like F1's row). Touch no other line of either table.
6. **Verify + screenshots**: `scripts/verify.sh` green before merging; review
   only the shots `shots-changed.mjs` flags; `node scripts/shots-changed.mjs
   --update` for intended changes. If e2e/baseline PNGs conflict on merge,
   never hand-merge a PNG: take main's version, re-run verify, regenerate with
   `--update`, commit.
7. **Merging under contention**: after your PR is open, if main has moved,
   merge origin/main into your branch (union rule for appends, PNG rule above),
   re-run `scripts/verify.sh`, push, then merge the PR yourself. Retry this
   loop until merged — do not leave a green PR unmerged, and do not ask for
   approval.
8. **Gates**: where your assignment names a gate, check `specs/README.md` on
   origin/main — the gated row must be ✅ before you start that spec. If it
   isn't, wait and re-check periodically (schedule yourself a check-in;
   never busy-poll with sleep loops). Do not start a gated spec early "to save
   time" — that recreates exactly the conflicts this plan exists to avoid.
9. **ADRs**: ADR 0006 already covers the 28th briefing (spec 118). Anything
   else irreversible still triggers CLAUDE.md rule 5 — write the ADR and stop.

## Assignments

Shelf files: C = `src/content/manual/concepts.tsx`, T = `technologies.tsx`,
P = `patterns.tsx`.

| Agent | Specs, in order | Briefings → shelf | Gates |
|---|---|---|---|
| 1 | 102 (F2) → 103 (F3) → 110 (F10) | relational-db → T; contention → P; distributed-locks → T | none external — this IS the critical path, keep it moving |
| 2 | 105 (F5) → 106 (F6) | sharding + consistent-hashing → C; nosql-db → T | none external |
| 3 | 104 (F4) → 112 (F12) | caching → C + distributed-caches → T; scaling-reads + scaling-writes → P | 112 waits on 105 ✅ (Agent 2) and your own 104 |
| 4 | 107 (F7) | api-design → C + api-gateway → T (discharges the 069 GraphQL commitment) | none |
| 5 | 108 (F8) | cap + data-modeling → C | none |
| 6 | 109 (F9) → 113 (F13) → 118 (F16) | queues + streams → T; multi-step + long-running-tasks → P; handling-failure → P (new 28th briefing, ADR 0006) | none external |
| 7 | 111 (F11) | realtime-updates → P | none |
| 8 | 114 (F14) | large-blobs → P + blob-storage → T | none |
| 9 | 115 → 116 → 117 (F15 as three specs, per the 2026-07-30 review decision) | proximity → P; cdn → T; load-balancer → T | ALL of 102–114 ✅ before starting 115 |
| 10 | 080 (polish) | whole app | ALL of 102–118 ✅ before starting |

## Launch order

- **Wave 1, launch together:** Agents 1–8.
- **Wave 2:** Agent 9, once 102–114 are ✅ on main.
- **Wave 3:** Agent 10, once 102–118 are ✅ on main. 080 is deliberately last:
  polish over a finished library, including the /playtest voice-consistency
  pass over all say-it decks (§D.3 resolution 3).

## Why this partition (for the record)

- Every §D.2 serialization lives INSIDE one agent (F2→F3→F10, F5→F6, F9→F13→F16)
  or behind an explicit gate (F12, F15, 080), so no agent ever rebases around a
  dependency — only around appends.
- Concurrent agents touch disjoint briefing entries; the only shared writes are
  end-of-file appends (`edges.ts`, `sayit.tsx`), single-line status flips on
  pre-seeded table rows, and screenshot baselines — each with a mechanical
  resolution rule above.
- F15's three specs share one §D.1 row, so they belong to one agent (rule 5
  would otherwise collide on that line).
