# 110 — Read the Dashboards (ADR 0005)
The daily on-call skill On-Call doesn't train: forming a hypothesis from
graphs. A new diagnostic drill type — panels in, diagnosis out.

- [ ] Scene renderer: 3–4 small time-series panels per scene (traffic, p50/p99
      or a latency histogram, error rate, saturation/queue depth) drawn from
      typed data — inline SVG, no chart library; readable at 380px
- [ ] 12 scenes, each { id, panels[], options[4], ans, why, mechanism
      (registry id) }; the 3 wrong options are defensible-but-wrong in the
      spirit of the taste-test distractor taxonomy (§4). Cover at minimum:
      retry storm, cache stampede on expiry, hot partition, connection-pool
      exhaustion, GC pauses (bimodal histogram — the "averages lie" scene),
      replication lag surfacing as stale reads, disk/IO saturation knee,
      client/server timeout mismatch, metastable persistence after the
      trigger clears, thundering herd on deploy, a slow leak (Little's Law:
      in-flight climbs while traffic is flat), and one "everything is
      actually fine" scene (the ladder's "actually fine" analog)
- [ ] Vocabulary taught, not assumed: USE (utilization / saturation / errors)
      and RED (rate / errors / duration) as glossary entries; the bimodal
      scene shows mean vs histogram on the same data
- [ ] Joins the drill session + Leitner scheduler + calibration stats as its
      own deck; misses land in the Scar Journal with the mechanism named
- [ ] Template added to content-pipeline.md §11 (reserved slot) in the same
      change; schema tests for the scene contract; e2e + screenshots

## Context (read this, not the whole repo)
- **Read**: product-spec §3.3 (v1.5 note), content-pipeline §4 (distractor
  taxonomy) + §11 stub; `src/modes/drills/` is the shell to extend.
- **Touch**: new `src/content/dashboards.ts`, `src/modes/drills/*` (new tab:
  `/drills/dashboards` per ADR 0004), `src/state/` (own Leitner deck key —
  don't mix decks: log-slider scoring and multiple-choice scoring differ),
  `tests/schema.test.ts`, e2e.
- **Inherited constraints**: scenes are content, the panel renderer is
  engine/ui (engines never import content); every scene's `mechanism` must
  resolve to a registry concept — that's what makes the post-miss deep link
  work; panel data is hand-authored and deterministic (no Math.random —
  same rule as Daily Incident); every jargon word a <Term>.
