# specs/ — the ordered implementation queue

Work strictly top to bottom. A spec is DONE when all its acceptance boxes are checked
AND scripts/verify.sh is green AND the screenshots look right. Numbered with gaps of
10 so new specs can be inserted. `/milestone` executes this queue.

**v1** ships at 080. **v1.5 "Deep Water"** (090–140, ADR 0005) adds the staff-level
layer: the four missing mechanisms (concurrency correctness, failure physics, tails
at scale, clocks & ordering), then the two habits no curriculum teaches (reading
dashboards, reading real postmortems).

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
| 050 | design-review (anomaly puzzles + taste tests pinned — ADR 0005) | ☐ |
| 055 | interrogation | ☐ |
| 060 | on-call | ☐ |
| 070 | forge | ☐ |
| 080 | polish — **v1 ships here** | ☐ |
| 090 | deep-toys (Anomaly Zoo · Retry Storm · Tail at Scale · Two Clocks · boss #4) | ☐ |
| 100 | deep-library (isolation · consistency ladder · The Log · OLTP/OLAP · Little's Law) | ☐ |
| 110 | dashboard-drills (12 diagnostic scenes · USE/RED · averages lie) | ☐ |
| 120 | blast-radius (Shuffle Shard toy + section + relic) | ☐ |
| 130 | case-files (S3 2017 · GitHub 2018 · Cloudflare 2019 · Roblox 2021) | ☐ |
| 140 | deep-polish — **v1.5 ships here** | ☐ |
| 900 | backlog (v2 — do NOT build; Legacy campaign before Readiness Meter) | — |
