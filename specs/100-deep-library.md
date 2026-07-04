# 100 — Deep Water library (ladder, log, ledger — ADR 0005)
Items that deepen existing shelves. The viz carries every one of these; a wall
of text is a bug (pipeline §7 quality bar applies at full strength).

- [ ] New concepts-shelf section **"Transactions & Isolation"**: anomaly-matrix
      viz — five anomalies (dirty read, non-repeatable read, phantom, lost
      update, write skew) × three levels (read committed, snapshot,
      serializable), each cell tappable to animate its interleaving over
      shared rows; MVCC panel (version chains → why Postgres vacuums);
      links The Anomaly Zoo toy
- [ ] CAP section upgraded to **"CAP & the Consistency Ladder"**: linearizable
      → causal → session guarantees (read-your-writes, monotonic reads) →
      eventual, each rung named and toggleable; PACELC (you pay latency for
      consistency even with no partition). The per-guarantee toggle wires into
      the replication-lag viz so "why did my comment vanish right after I
      posted it?" gets a named guarantee that fixes it. Section id stays
      stable (ids are URLs).
- [ ] New patterns-shelf capstone **"The Log"**: ONE append-only log fans out
      to crash recovery, a replica, a cache invalidator, and a search indexer
      — stating plainly that the WAL, the replication stream, the Kafka topic,
      the Raft log, and CDC are the same object. Highest aha-per-pixel in the
      library; this is the section to over-invest in.
- [ ] New technologies-shelf section **"OLTP vs OLAP & Columnar Storage"**:
      row-vs-column layout viz (promoted from the toy backlog) with scan +
      compression counters; why analytics queries on the primary take the
      site down; motivates CDC-into-warehouse (links The Log)
- [ ] **Little's Law first-class**: numbers.ts entry `littles-law` (L = λ·W)
      with derivation; ~6-drill family (connection-pool sizing, in-flight
      request estimation, spotting a leak from climbing concurrency) attached
      to the connection-pool and queue concepts
- [ ] Registry: `manualId` lands on the Anomaly Zoo concept row; new rows for
      The Log and OLTP/OLAP (≥1 term/number/drill each); shelf counts become
      9 concepts / 12 technologies / 9 patterns = 30 sections
- [ ] tests/schema.test.ts: bump exact drill count + per-category cap as needed
- [ ] Screenshot review at desktop and 380px

## Context (read this, not the whole repo)
- **Read**: content-pipeline §7 (template + quality bar) and §9; ADR 0005;
  ONE existing section per shelf as the example, not the whole shelf file.
- **Touch**: `src/content/manual/{concepts,technologies,patterns}.tsx`,
  `src/content/{concepts,numbers,drills,glossary}.ts`, the replication-lag
  toy sim (guarantee toggle), `tests/schema.test.ts`.
- **Inherited constraints**: a section without a manipulable viz is not
  authorable; every displayed number resolves to numbers.ts; every tradeoff
  names when the loser wins (L5) — e.g. when eventual is the RIGHT answer;
  glossary entries for PACELC, causal consistency, session guarantee,
  monotonic reads, OLTP, OLAP, columnar, CDC, vacuum (check what exists
  first — WAL/fsync facts are already scattered in drills and numbers; this
  spec unifies, it doesn't duplicate).
