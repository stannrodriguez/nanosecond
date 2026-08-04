# specs/ — the ordered implementation queue

Work strictly top to bottom — TABLE order is the queue; spec numbers are stable ids,
not positions. A spec is DONE when all its acceptance boxes are checked AND
scripts/verify.sh is green AND the screenshots look right. `/milestone` executes
this queue. (2026-07-06: playtester promoted the ADR 0005 arc ahead of 060–080.)
(2026-08-04: the §D.1 fill-out queue F2–F16 authored into the table as specs
102–118 for a coordinated parallel build — dependency gates are in each row and
in `docs/fillout-parallel-plan.md`; specs run in parallel where no gate applies.)

| # | Spec | Status |
|---|------|--------|
| 000 | scaffold | ✅ |
| 010 | port-prototypes | ✅ |
| 020 | glossary-field-manual | ✅ |
| 030 | intuition-lab | ✅ |
| 040 | drills | ✅ |
| 042 | navigation-scale | ✅ |
| 045 | scar-journal | ✅ |
| 047 | concept-library | ✅ |
| 050 | design-review | ✅ |
| 055 | interrogation | ✅ |
| 081 | lab-stack-map (ADR 0005 arc) | ✅ |
| 082 | lab-receipts (ADR 0005 arc) | ✅ |
| 084 | lab-forecast (ADR 0005 arc) | ✅ |
| 086 | deep-tier-compute (ADR 0005 arc) | ✅ |
| 088 | deep-tier-memory (ADR 0005 arc) | ✅ |
| 060 | on-call | ✅ |
| 065 | networking-glossary (Say-it slice 1/3) | ✅ |
| 068 | briefing-terms-panel (networking pilot) | ✅ |
| 066 | say-it-content (slice 2/3) | ✅ |
| 067 | say-it-ui (slice 3/3) | ✅ |
| 069 | networking-briefing (three-registers reference impl) | ✅ |
| 070 | forge | ✅ |
| 071 | numbers-capacity-storage (coverage-map P1) | ✅ |
| 072 | glossary-storage-queues-resilience (P2a) | ✅ |
| 073 | glossary-caching-networking-traffic (P2b) | ✅ |
| 074 | edge-graph (P3) | ✅ |
| 075 | numbers-cache-transport-async (P4) | ✅ |
| 076 | indexing-search-briefings (coverage-map F1) | ✅ |
| 102 | relational-deep-dive (F2) | ☐ |
| 103 | contention-escalation (F3, after 102) | ☐ |
| 104 | caching-distributed-caches (F4) | ☐ |
| 105 | sharding-consistent-hashing (F5) | ☐ |
| 106 | wide-column-stores (F6, after 105) | ☐ |
| 107 | api-design-gateway (F7) | ☐ |
| 108 | cap-data-modeling (F8) | ☐ |
| 109 | queues-streams (F9) | ☐ |
| 110 | coordination-locks (F10, after 103) | ☐ |
| 111 | realtime-updates (F11) | ☐ |
| 112 | scaling-reads-writes (F12, after 104 + 105) | ☐ |
| 113 | workflows-async (F13, after 109) | ☐ |
| 114 | large-blobs-object-storage (F14) | ☐ |
| 115 | proximity (F15a, after 102–114) | ☐ |
| 116 | cdn (F15b, after 102–114) | ☐ |
| 117 | load-balancer (F15c, after 102–114) | ☐ |
| 118 | handling-failure (F16, ADR 0006, after 113) | ☐ |
| 080 | polish (last — after 102–118) | ☐ |
| 090 | backlog (v2 — do NOT build) | — |
