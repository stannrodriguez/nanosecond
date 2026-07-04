# 120 — Blast radius & shuffle sharding (ADR 0005)
Correlated failure and the combinatorial trick that beats it. Nobody teaches
this well; this is differentiating content.

- [ ] Toy, catalog row 17 — **"Shuffle Shard"**: n workers, many customers,
      shards-per-customer slider; one poison customer takes out its k workers
      — watch the fraction of OTHER customers sharing full fate collapse from
      1 (monolith) through 1/n (plain sharding) to 1/C(n,k) (shuffle
      sharding); counters extrapolate to real fleet sizes
- [ ] numbers.ts: `shared-fate` with derivation (8 workers, pick 2: C(8,2)=28
      combinations → ~3.6% of customers share both of yours)
- [ ] New patterns-shelf section **"Blast Radius"**: correlated failure, zones,
      bulkheads (glossary entry exists — link it) → cells → shuffle sharding;
      viz shares the toy's machinery; patterns shelf → 10, library → 31
- [ ] On-Call: **Shuffle Shard** relic per pipeline §8 (fx: one encounter
      modifier's damage hits a fraction of budget instead of all of it);
      balance suite stays green
- [ ] Registry row + ≥1 reachable drill; glossary: blast radius, shuffle
      sharding, cell, correlated failure (check availability-zone coverage
      first)
- [ ] Screenshot review at desktop and 380px

## Context (read this, not the whole repo)
- **Read**: content-pipeline §2 (toy template), §7 (section template), §8
  (relic template), §9 (registry).
- **Touch**: `src/content/toys.ts` + sim, `src/content/manual/patterns.tsx`,
  `src/content/{concepts,numbers,drills,glossary}.ts`,
  `src/content/oncall.ts`, `tests/{schema,balance}.test.ts`.
- **Inherited constraints**: `forgeUnlocks: null`; the displayed 3.6% must
  derive on screen (no magic constants — law L1); Multi-AZ relic already
  exists, Shuffle Shard complements it (different failure axis: correlated
  customer poison vs zone loss); drill-count assertion bumps again.
