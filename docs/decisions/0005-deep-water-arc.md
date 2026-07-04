# ADR 0005: The Deep Water arc (v1.5) — four missing mechanisms, two missing habits
Date: 2026-07-04 · Status: accepted

## Context
A content audit against "thinks like a staff infra engineer" (not just "passes
the interview") found four mechanisms absent from the otherwise-solid canon —
verified by grep, not vibes:

- **Concurrency correctness.** "Isolation" appears exactly once, inside the
  ACID glossary definition. No isolation levels, no anomalies (lost update,
  write skew), no MVCC, no snapshot isolation anywhere.
- **Failure physics of real outages.** Zero hits for retry amplification,
  goodput, or metastable failure — the mechanism behind most famous outages,
  and the natural payoff of the queueing/backpressure/stampede investment.
- **Tails at scale.** The Queue teaches one server's tail; nothing teaches
  that fan-out multiplies it (1 − 0.99¹⁰⁰ ≈ 63%). No hedged requests.
  Fan-out exists only as feed write fan-out in one drill.
- **Time & ordering.** Zero hits for clock skew, Lamport clocks,
  linearizability; last-write-wins data loss is untaught. (Fencing exists in
  the glossary — a seam, not a lesson.)

Plus two habits no curriculum teaches: forming hypotheses from dashboards, and
learning from real postmortems. And Little's Law — the pool-sizing law —
appears once, buried in a scenario.

The v1 queue (050–080) is mid-flight. Injecting the new surface area before it
would stall the modes that make existing content playable, and most of the new
material *wants* those modes (puzzles need the Review shells, the metastable
boss needs On-Call).

## Decision
1. **v1 (specs 050–080) ships as scoped, with one adjustment:** spec 050's
   eight open flaw-puzzle slots pin three anomaly puzzles (write skew, fencing
   token, retry storm) and two of its four open taste tests (serializable
   cost, hedged requests). Each carries its own briefing + glossary entries
   (laws L2/L6), so nothing assumes a toy that doesn't exist yet.
2. **A v1.5 arc — "Deep Water", specs 090–140 — follows 080:**
   090 four staff-level toys + On-Call boss #4 (metastable) · 100 library
   deepening (isolation section, consistency ladder, The Log capstone,
   OLTP/OLAP, Little's Law) · 110 Read-the-Dashboards diagnostic drills ·
   120 blast radius & shuffle sharding · 130 Case Files (playable real
   postmortems) · 140 polish. The backlog file moves to `specs/900-backlog.md`
   so the parking lot stays last.
3. **The v2 backlog is reordered:** Legacy campaign (migration under live
   traffic — expand/contract, dual-write, shadow reads, cutover with rollback)
   promotes ahead of the Readiness Meter. It is the staff-level skill no
   interview-prep resource teaches; the meter measures, Legacy teaches.

## Consequences
- Content counts move across the arc: toys 12 → 17, library sections 27 → 31,
  glossary ~60 → ~85, drills grow by the Little's Law family plus a separate
  dashboards deck. `tests/schema.test.ts` pins exact counts — the spec that
  adds content bumps the assertion in the same change.
- product-spec gains §3.10 (Case Files); v2 becomes §3.11. content-pipeline
  reserves template slots §10–§12 (interrogation / dashboard scene / case
  file) to keep section numbers stable.
- 050's pinned puzzles teach terms whose toys arrive in 090; until then the
  puzzle brief + glossary carry the pedagogy, and 090 retrofits registry
  deep links (an explicit acceptance box there).
- The four new toys forge nothing (`forgeUnlocks: null`): the Forge graph
  stays closed at six components; Deep Water teaches judgment, not parts.
