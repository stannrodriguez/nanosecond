# specs/ — the ordered implementation queue

Work strictly top to bottom. A spec is DONE when all its acceptance boxes are checked
AND scripts/verify.sh is green AND the screenshots look right. Numbered with gaps of
10 so new specs can be inserted. `/milestone` executes this queue.

| # | Spec | Status |
|---|------|--------|
| 000 | scaffold | ✅ |
| 010 | port-prototypes | ✅ |
| 020 | glossary-field-manual | ✅ |
| 030 | intuition-lab | ✅ |
| 040 | drills | ✅ |
| 045 | scar-journal | ✅ |
| 050 | design-review | ☐ |
| 055 | interrogation | ☐ |
| 060 | on-call | ☐ |
| 070 | forge | ☐ |
| 080 | polish | ☐ |
| 090 | backlog (v2 — do NOT build) | — |
