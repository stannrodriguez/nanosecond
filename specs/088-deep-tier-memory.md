# 088 — Deep tier, memory pair (The TLB Toll + False Sharing)

Completes the deep tier's first arc (ADR 0005): the two remaining
single-machine mysteries a working engineer actually hits — "why did my
program fall off a cliff when the data got big?" has a second cliff beyond
spec 011's caches, and "why did adding a thread make it slower?" has a
one-word answer nobody taught them.

**17 · THE TLB TOLL** (mem) — every memory access is secretly two: translate
the virtual address, then fetch. Drag the working set: within TLB reach
(entries × 4 KB pages) translation is free; past it, every access pays a
second trip; way past it (swap), you fall off the bottom of the ladder onto
the disk rungs from toy 02. Punchline: "it fit in RAM" isn't the last
question — it has to fit in the *map of* RAM too.

**18 · FALSE SHARING** (compute) — two threads increment two different
counters. Toggle: counters on the same 64-byte cache line vs padded apart.
Same code, more cores, *less* throughput, because the cores fight over the
line. Punchline: the multicore turn (toy 15) sold you parallelism; the cache
line (toy 13) fine-prints it — cores share memory in 64-byte bites, and
"different variables" is not the same as "different lines".

- [ ] Both toys meet the FULL toy contract (catalog + click, sim in
      `TOY_COMPONENTS`, briefing, concept row, station, stack floor
      (spec 081), forecast, `simplifies`, <10s playable, one manipulable
      variable)
- [ ] New number `page-size` (4 KB — the fragmentation-vs-table-size bargain
      virtual memory struck decades ago; note hugepages as the escape hatch
      in `simplifies`); False Sharing reuses `cache-line` + `l1-hit` — no
      new number needed
- [ ] Concept rows drill-reachable via already-drilled numbers
      (`dram-access`, `l1-hit`) per ADR 0005 — drill bank stays 60
- [ ] The map: station assignment follows spec 086's decision (INSIDE EVERY
      CHIP or its split successors); exactly-one-station coverage stays green
- [ ] Cross-toy links land: TLB Toll's punchline links toy 02 (the disk
      rungs it falls onto); False Sharing's briefing links toys 13/14 —
      the deep tier should feel like one story, not four cards
- [ ] Toy count references update (e2e, CLAUDE.md, product-spec §3.1) —
      the arc ends at 18 toys
- [ ] Glossary law holds (candidates: virtual memory / page table / TLB,
      coherence); numbers law holds
- [ ] Balance suite untouched and green; verify.sh green; shots reviewed at
      desktop and 380px

## Context (read this, not the whole repo)
- **Read**: spec 086's landed code first (it sets the station-split
  decision and the deep-tier voice); `docs/content-pipeline.md` §2;
  `src/modes/lab/CacheCliff.tsx` (TLB Toll is its sibling — same staircase
  bones, one new cliff); `src/content/numbers.ts` `cache-line` + `l1-hit`.
- **Touch**: `src/modes/lab/TlbToll.tsx` + `FalseSharing.tsx` (new),
  `toys.ts`, `briefings.tsx`, `forecasts.tsx`, `concepts.ts`,
  `journey.tsx`, `numbers.ts` (page-size only), `glossary.ts`, lab
  `index.tsx` registry, `e2e/*`, docs counts, baselines.
- **Physics honesty**: TLB Toll `simplifies` owns multi-level page walks,
  hugepages, and that modern walks are cached too; False Sharing owns that
  real coherence is MESI-shaped and the toy shows only its cost.
- **Don't**: simulate page tables or MESI states, add per-core sliders, or
  let either toy grow a second variable. One cliff, one toggle, one number.
