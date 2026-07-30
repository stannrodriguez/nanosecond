# 072 — Glossary: storage, queues, resilience bundles (speakable)

Prerequisite P2a from `docs/coverage-map.md` §D.0. 38 new keys with the full
speakable contract, and the three groups brought under the same schema
enforcement the Networking group already has. **Blocks F1, F2, F3, F5, F6,
F8, F9, F10, F13.**

- [ ] Every key in coverage-map §B.3 for **Storage & Data** (20), **Queues &
      Streams** (9), and **Resilience** (9) exists in `glossary.ts` with
      `def` + full speakable contract (`say`/`reachFor`/`trap`, per
      content-pipeline §1 — say is ONE breath, trap quotes the wrong sentence
      and replaces it with a mechanism)
- [ ] The four flagged entries get review-gate care per §B.3's contract notes:
      `writeskew` (no shared row — that's WHY cheaper tools miss it),
      `compareandset` (the single move under optimistic concurrency),
      `durableexecution` (resume-from-recorded-history, not "retries"),
      `aba` (why monotonic values are exempt)
- [ ] Existing entries in these three groups are BACKFILLED with the speakable
      contract so schema enforcement extends group-wide (the Networking-group
      test generalizes to a SPEAKABLE_GROUPS list; these three join it)
- [ ] Each new key lands in exactly one reference group (the partition test
      already enforces this); the orphan-entry test's allowlist grows ONLY if
      a key is genuinely not yet taught in copy — prefer wiring the term into
      an existing briefing sentence over allowlisting
- [ ] verify.sh green; Reference screen reviewed at 380px (it grows a lot)

## Context (read this, not the whole repo)
- **Read**: coverage-map §B.3; content-pipeline §1 (speakable contract);
  `glossary.ts` interface + two Networking entries as the model + the group
  list; `tests/schema.test.ts` Networking-group test.
- **Touch**: `src/content/glossary.ts`, `tests/schema.test.ts`, possibly a
  briefing sentence per orphan-avoidance, e2e baselines (Reference shot).
- **Sizing**: large — this is a writing spec. Land it as two commits
  (new keys / backfill) so each diff audits cleanly.
- **Scope guard**: no new briefing content beyond minimal orphan-avoidance
  dotting; caching/networking/traffic bundles are 073's.
