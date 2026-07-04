# Architecture — Nanosecond

System design decisions + rationale. Product intent lives in `product-spec.md`.

## Stack
Vite + React 18 + TypeScript · zustand for run/campaign state · localStorage
persistence · vitest (unit + balance) · Playwright (smoke + screenshots) ·
inline styles + `src/theme.ts` tokens (no CSS framework) · pnpm.
Rationale: client-only SPA keeps the autonomous build loop fast and hermetic; the
whole game is deterministic content + a small engine, so no backend earns its keep.

## Repo layout
```
CLAUDE.md            agent instructions
README.md            for humans
docs/                durable knowledge (this file, product spec, ADRs, pipeline, reference/)
specs/               ordered implementation queue; specs/README.md is the index
src/engine/          simulation math (pure, unit-tested)
src/content/         typed game data ONLY (toys, puzzles, drills, glossary, numbers)
src/ui/              shared components (Bar, Stepper, Diagram, Term, theme)
src/modes/           one folder per mode
tests/               balance suite + schema tests (the verification layer)
e2e/                 playwright specs + shots/
scripts/verify.sh    typecheck + test + e2e
```
Hard rule: engines never import content; content never contains logic beyond data.
This is what makes `/author-content` safe to run unsupervised.

## Simulation engine (`src/engine/capacity.ts`)

### Canonical capacities (mirrored in `src/content/numbers.ts` with derivations)
- app server: 10k simple req/s, base 3ms, $150/mo
- cache node: 100k ops/s, base 1ms, $200/mo
- db primary (per shard): 10k writes/s AND 20k reads/s budget, base 5ms, $600/mo
- read replica: 20k reads/s, $400/mo
- queue: 1M msgs/s intake, $300/mo · worker: 5k writes/s drain, $100/mo
- load balancer: +1ms, free

### Math
- utilization u = load/capacity per tier; reads charge the cache tier the FULL read
  volume; misses = reads × (1 − hitRate) flow to replicas if present, else primary
  (shared read+write utilization when no replicas).
- latency multiplier m(u) = 1/(1 − min(u, 0.95)), clamped to 20 at u ≥ 1 (M/M/1 flavor).
- p50 = mix-weighted chain latency; p99 = min(5000, 3.2 × p50).
- errors accrue as overflow (load − capacity)/load at any saturated tier.
- queue backlog: backlog += arrivals − min(arrivals + backlog, drain), where
  drain = min(workers × 5k × synergyMult, primaryWriteCap). Stranded end-of-run
  backlog is a distinct failure ("size the drain, not just the intake").

### On-Call damage model
dmg/tick = errRate × 30 (write portion ×0.6 with Idempotency) + 1.5 per p99 breach
(0 with Graceful Degradation); Circuit Breaker caps per-encounter total at 30.

## Balance suite (tests/ — encodes "the game teaches true things")
- 2 app servers at 25k req/s → error rate > 20%
- 45k req/s, 90% reads, no cache → primary tier fails; with 2 cache @85% + 2
  replicas → passes
- firehose burst (writes 2.2× for 10 ticks) with queue + 3 workers → passes with
  backlog drained; without queue on 1 shard → fails
- read-heavy round: first tier past 80% is APP, not DB
- write-mix flip (40% writes, same stack): first tier past 80% is PRIMARY
- p99 monotonically increases with utilization; errors are 0 below 80% everywhere
- every boss beatable via ≥2 distinct strategies; act-1 boss's cheapest winning
  build costs ≤ starting gold + act-1 income
- schema: every component/toy has non-empty `simplifies`; every number has a
  `derivation`; every `<Term>` key exists in the glossary
Any content change that breaks these is a content bug, not a test bug.

## Numbers database (`src/content/numbers.ts`)
Every entry: { id, value, unit, derivation: string[3], boundingPhysics: string,
toyId: string|null, confusions: string, simplifies?: string }.
Seed set — latency ladder: cycle 0.3ns · L1 1ns · L2 4ns · L3 12ns · DRAM 100ns ·
compress 1KB 2µs · NVMe read 80µs · same-DC RTT 500µs · HDD read 8ms ·
cross-region RTT 70ms. Rates: 1M req/day ≈ 12/s · peak = 2–5× average (human
traffic) · HDD ≈ 120 IOPS · NVMe ≈ 500k–1M IOPS · Redis ≈ 100k ops/s/node ·
Kafka ≈ 1M msgs/s/broker · Postgres ≈ 5–10k TPS writes, 20–50k QPS cached reads.

## Content honesty ("fine print")
The simulator is a teaching model, not a benchmark. Every component card and toy
punchline carries a `simplifies` field (connection limits, cold-cache warmup,
replication lag, GC pauses, cross-AZ costs) rendered behind a small toggle.
Enforced by schema test.

## Design system (`src/theme.ts` — single source)
Palette: bg #0F1930 · panel #152238 · panelUp #1B2C48 · line #283A5C ·
text #E9EEF8 · dim #8FA0C0 · faint #5B6C8F. Channels: network #53DCEC ·
compute #F6BB52 · storage #EF7BD0 · memory #72EAA8 · alert #F26D5E · gold #F6D452.
Type: Space Grotesk (display/UI) + IBM Plex Mono (data, labels, eyebrows).
Voice: confident, concrete, lightly playful; mono-caps eyebrow labels; every mode
has a one-line thesis under its title. The 80% danger line is drawn on every
utilization bar, everywhere, always. Accessibility floor: visible keyboard focus,
prefers-reduced-motion respected, usable at 380px.
