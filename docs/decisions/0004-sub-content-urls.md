# ADR 0004: Every piece of content gets a URL (sub-content routing scheme)
Date: 2026-07-04 · Status: accepted

## Context
ADR 0003 chose hash routing but left sub-state to the modes, and every mode
grew a `useState`-driven tab strip. By spec 045 the cost is visible: the Scar
Journal records *which* toy/drill/puzzle scarred you but cannot link back to
it, post-mortems cannot say "replay The Queue" as a link, refresh loses your
place, and the Lab's flat 12-tab strip is at its readable limit while the
queue ahead (Review: 12 puzzles + 6 tastes + 6 interrogations) triples the
content. Navigation scheme is called out in CLAUDE.md as an irreversible
decision, so it is fixed here before spec 050 builds on the old pattern.

## Decision
Sub-content is addressed by path segments under each mode, always hash-routed
(`/#/…`), always lowercase content ids:

| Pattern | Example |
|---|---|
| `/lab` | channel-grouped toy index |
| `/lab/:toyId` | one toy, `toyId` from `content/toys.ts` |
| `/manual/:tab` | `briefings` \| `ladder` |
| `/manual/briefings/:sectionId` | one briefing open, id from `content/manual.tsx` |
| `/drills/:tab` | `session` \| `calibration` |
| `/review/:tab` | `flaw` \| `predict` \| `taste` |
| `/journal/:tab` | `log` \| `themes` \| `brief` |

Rules:
- A bare mode path redirects (`replace`) to its default child; an unknown id
  redirects to the mode index — deep links never 404, they degrade.
- Content ids ARE the URL segments; ids are already contractually stable
  (`content-pipeline.md`), so links inherit that stability.
- Tab strips and cards stay `<button>`s that call `navigate()` — the URL is
  the single source of truth for "where am I", component state keeps only
  transient sim state (slider positions, run progress).
- Ephemeral in-challenge state (current drill card, sim tick) stays OUT of
  the URL; a deep link lands you at the challenge, not mid-answer.

## Consequences
- Scars, post-mortems, and cross-mode "study loop" links can target any
  concept surface; browser back/refresh behave.
- Modes added by future specs (050+) must route their sub-content the same
  way — reviewers should reject new `useState` tab navigation.
- e2e tests can jump straight to deep screens, cutting click-path length.
