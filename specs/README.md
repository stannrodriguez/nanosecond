# specs/ — the ordered implementation queue

Work strictly top to bottom — TABLE order is the queue; spec numbers are stable ids,
not positions. A spec is DONE when all its acceptance boxes are checked AND
scripts/verify.sh is green AND the screenshots look right. `/milestone` executes
this queue. (2026-07-06: playtester promoted the ADR 0005 arc ahead of 060–080.)

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
| 070 | forge | ✅ |
| 080 | polish | ☐ |
| 090 | backlog (v2 — do NOT build) | — |
