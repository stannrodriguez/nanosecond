# 090 — Deep Water toys (v1.5 opens — ADR 0005)
The four mechanisms staff engineers carry that v1 doesn't teach: concurrency
correctness, retry/failure physics, tails at scale, time & ordering.

- [ ] 4 new toys per content-pipeline §2 template, catalog rows 13–16:
      · **The Anomaly Zoo** — two concurrent transactions animated over shared
        rows; isolation dial (read committed → snapshot → serializable) +
        contention dial; watch which anomalies survive at each stop (lost
        update dies at snapshot; write skew survives until serializable, which
        pays in aborts/retries). MVCC versions visibly accumulate — why
        Postgres needs vacuum.
      · **Retry Storm** — 3-tier stack, per-tier retry dial; a blip at the
        bottom becomes 3 × 3 × 3 = 27× load; toggles for jittered backoff and
        a retry budget; a goodput-vs-offered-load counter that collapses past
        the knee (timed-out work still burns capacity).
      · **The Tail at Scale** — fan-out slider (1 → 200 backends) × per-backend
        slow rate; P(page is slow) = 1 − 0.99^N hits 63% at N=100; hedged-
        request toggle shows the cheap fix and its double-send cost on writes.
      · **Two Clocks** — two nodes with skewed wall clocks accept concurrent
        writes; last-write-wins silently discards the write that happened
        LATER in real time; skew slider (ms → seconds under a GC pause);
        Lamport toggle shows what logical ordering restores — and what it
        can't (it orders events; it doesn't pick the right winner).
- [ ] numbers.ts entries with derivations: `fanout-tail` (1 − 0.99¹⁰⁰ ≈ 63%),
      `retry-amplification` (3 tiers × 3 tries = 27×), `goodput-collapse`
      (past saturation, useful throughput FALLS as offered load rises),
      `clock-skew` (NTP: single-digit ms typical; a pause makes it seconds)
- [ ] Concept-registry rows for all four (pipeline §9: ≥1 term, ≥1 number,
      ≥1 reachable drill each — author drills where the intersection is empty;
      bump the exact-count assertion in tests/schema.test.ts)
- [ ] Glossary: metastable failure, goodput, retry amplification, clock skew,
      last-write-wins, Lamport clock, linearizability (plus any 050 stragglers)
- [ ] Deep-link retrofit: 050's On-Call Doctors / Zombie Lock / Retry Storm
      puzzles and The Double Send resolve to these toys via the registry
- [ ] On-Call boss #4 **"The Metastable Storm"** — the trigger clears and the
      outage stays (cold cache → overloaded DB → cache can't refill); beatable
      ≥2 distinct ways (shed load below the sustainable point vs retry budgets
      + cache warm-up), enforced in the balance suite; "This Actually
      Happened" card → Roblox Oct 2021 (73-hour Consul outage) + the
      Metastable Failures paper (HotOS '21)
- [ ] Screenshot review at desktop and 380px

## Context (read this, not the whole repo)
- **Read**: content-pipeline §2 (template + catalog rows 13–16) and §9;
  ADR 0005. Closest existing sims to crib: Backpressure (flow between
  stages), TTL & Stampede (cascade), The Queue (the knee).
- **Touch**: `src/content/toys.ts` + sims under `src/modes/lab/`,
  `src/content/{concepts,glossary,numbers,drills}.ts`,
  `src/content/oncall.ts` + `tests/balance.test.ts` (boss #4),
  `src/content/puzzles.ts` (deep links only), `tests/schema.test.ts`
  (drill-count assertion).
- **Inherited constraints**: `forgeUnlocks: null` for all four (the Forge
  graph is closed at six components — these teach judgment, not parts);
  `simplifies` fine print on every toy; concept rows land in the same change
  as their toy; URLs are `/lab/:toyId` per ADR 0004; engines never import
  content.
