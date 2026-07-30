# 073 — Glossary: caching, networking, traffic bundles (speakable)

Prerequisite P2b from `docs/coverage-map.md` §D.0. 15 new keys, same contract
as 072. **Blocks F4, F7, F11, F14.** May run in parallel with 072 (disjoint
groups); if serialized, 072's generalized enforcement mechanism lands first
and this spec reuses it.

- [ ] Every key in coverage-map §B.3 for **Networking** (`graphql`, `nat`,
      `signaling`), **Requests & Traffic** (`jwt`, `rbac`, `cursor`,
      `rangerequest`, `apikey`), and **Caching & Delivery** (`cacheaside`,
      `writethrough`, `readthrough`, `eviction`, `coalescing`, `keyversion`,
      `edgecache`) exists with `def` + full speakable contract
- [ ] The Caching & Delivery group's existing entries (`cache`, `hitrate`,
      `ttl`, `stampede`, `cdn`, `fanout`) are backfilled and the group joins
      SPEAKABLE_GROUPS; Networking already enforces (the 3 new keys must
      comply on arrival)
- [ ] Requests & Traffic: the 5 new keys carry the contract; group-wide
      backfill of its ~18 existing keys is explicitly DEFERRED to the
      briefing specs that own them (F7, F12) — note this in the schema test
      comment so it isn't mistaken for an omission
- [ ] Orphan-entry rule as in 072: wire terms into copy or justify each
      allowlist addition
- [ ] verify.sh green; Reference screen reviewed at 380px

## Context (read this, not the whole repo)
- **Read**: coverage-map §B.3; content-pipeline §1; 072's enforcement
  mechanism if landed (else establish it here and 072 reuses).
- **Touch**: `src/content/glossary.ts`, `tests/schema.test.ts`, e2e baseline
  (Reference shot).
- **Scope guard**: 15 new + 6 backfilled entries, nothing else.
