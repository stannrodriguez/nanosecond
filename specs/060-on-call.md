# 060 — On-Call full game
- [x] 3 acts, 18 encounters, 3 bosses (Thundering Herd, Black Friday, Region Outage),
      12 patterns, 6 events, shops/rests per act
- [x] Run persistence + history + score formula
- [x] "This Actually Happened" cards on boss/flaw post-mortems (S3 2017, Cloudflare
      2019, GitHub 2018, Slack 2021, Facebook BGP 2021 — official writeups only)
- [x] Balance suite additions: every boss beatable ≥2 ways; act-1 boss cheapest win
      ≤ starting gold + act-1 income
- [x] Victory recap: patterns → real-world explanations

## Context (read this, not the whole repo)
- **Read**: product-spec §3.7 (acts/bosses/patterns/"This Actually Happened")
  and content-pipeline §8 (pattern/encounter templates). The prototype is
  ported — `src/modes/oncall/` + `src/content/oncall.ts` are the truth for
  the map/encounter/tick-runner mechanics.
- **Before building**: `src/modes/oncall/index.tsx` is 660 lines; split it
  (map / encounter / rewards / recap) as a separate `infra:` commit first so
  this spec's diffs stay small.
- **Touch**: `src/content/oncall.ts`, `src/modes/oncall/*`,
  `src/state/` (run persistence + history), `tests/balance.test.ts`
  (boss-beatable-≥2-ways and act-1 economy assertions), e2e.
- **Inherited constraints**: sub-content URLs per ADR 0004 (run state is
  ephemeral and stays OUT of the URL); post-mortems deep-link to toys via
  the concept registry; "This Actually Happened" links official postmortems
  only (S3 2017, Cloudflare 2019, GitHub 2018, Slack 2021, Facebook BGP 2021).
