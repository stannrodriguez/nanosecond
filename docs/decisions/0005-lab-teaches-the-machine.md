# ADR 0005: The Lab teaches the machine, not just the interview
Date: 2026-07-06 · Status: proposed (playtester sign-off starts spec 082)

## Context
Playtesting surfaced a goal the current Lab only half-serves: the player isn't
just prepping for systems design interviews — they want to *understand
computers* (product-spec pain point 3: "as deep as physics allows"). The
symptoms, in order of discovery:

1. Toys felt mechanism-rich but background-poor → fixed by field briefings
   (PR #10) and the map / YOU ARE HERE / THE CLICK layer.
2. The catalog is distributed-systems-heavy. Of 13 toys, only Race Light,
   The Disk, Leaky Bits, and The Cache Cliff go *inside* one machine.
3. The compute channel advertises "bounded by heat" and no toy shows heat.
   The `l1/l2/l3-hit` numbers sat in the bank with no toy until spec-less
   PR #11 (The Cache Cliff) — evidence the single-machine tier was owed.
4. Numbers carry 3-step derivations and `boundingPhysics` in `numbers.ts`,
   but toy pages never show them — the "why, one level down" layer exists as
   data and is invisible where hands are.
5. Law L3 (predict before run) governs Builder and Review but was never
   applied to the Lab, so toys teach by watching, not by being wrong first.

The open question this ADR settles: is the Lab's scope "the interview
surface" or "the machine, from the transistor to the datacenter"?

## Decision
The Lab's scope is **the machine, end to end**. Committed as specs 082–088:

- **Pedagogy upgrades apply to every toy, old and new** (082 receipts —
  surface each toy's number derivations; 084 forecast — one-tap
  predict-before-run with Scar Journal misses). Upgrades land BEFORE new
  toys so new content ships into the upgraded frame.
- **A deep tier of single-machine toys is first-class Lab content** (086
  compute pair: The Heat Wall + The Branch Predictor; 088 memory pair: The
  TLB Toll + False Sharing) — not a separate mode, not library-only prose.
  Every deep-tier toy meets the full toy contract: derivable numbers,
  glossary terms, concept row, field briefing, click, station on the map,
  forecast, `simplifies` fine print.
- Deep-tier toys join the existing four-wall channel map and the journey's
  INSIDE EVERY CHIP station; when a station exceeds 4 toys, split the
  station rather than crowd it (the map stays honest).

## Alternatives rejected
- **A separate "Machine" mode** — fragments the journey map the Lab just
  gained, doubles navigation, and implies the machine is optional context
  rather than the substrate of every station.
- **Concept Library sections only** — the library explains; the Lab makes
  you operate. The product's core bet (L1: mechanism before number) is that
  understanding lives in the hands, so depth belongs where the hands are.
- **Stay interview-scoped** — contradicts pain points 3–5 and the game's
  own tagline ("from the physics up").

## Consequences
- Toy count moves 13 → 17 as 086/088 land; the counts in CLAUDE.md's
  definition of done and product-spec §3.1 update in the same commits.
- No drill-bank growth this arc: new concepts stay drill-reachable by
  including an already-drilled number (`cpu-cycle`, `l1-hit`,
  `dram-access`) in their `numberIds`. A future arc may grow the bank past
  60 and revisits the schema contract then.
- The queue stays ordered: 060/070/080 (v1) run first; 082–088 are the
  next arc after polish unless the playtester promotes them.
- Parked (v2 backlog, content-pipeline §2): The Gappy Number Line
  (floating point), Syscall Toll Booth, ground-truth panels (real bytes /
  assembly beside each viz).
