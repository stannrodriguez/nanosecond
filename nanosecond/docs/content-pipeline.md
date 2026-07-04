# CONTENT_PIPELINE.md — how content gets made

All content is typed data in `src/content/`. These templates are contracts; the
prototypes in `reference/` show the voice.

## 1. Glossary entry
{ key, name, def } — def is 2–4 sentences, plain language, always contains the WHY
("writes can't be cached away BECAUSE every copy must apply them"), ends with the
practical consequence. Never circular, never assumes another undefined term.

## 2. Toy template + catalog
A toy makes ONE number impossible to forget by letting the player operate the mechanism.
Fields: { id, name, oneLiner, targetNumbers[], sim (rAF component), controls,
punchline (3–5 sentences: mechanism → number → why the whole industry bends around it),
forgeUnlocks (component id | null) }.
Quality bar: playable in <10s, one clear manipulable variable, counters show real-world
extrapolated rates, punchline names at least one famous technology this explains.

Catalog (v1 = rows 1–12):
1. Race Light — latency ladder vs speed of light (built)
2. The Disk — random vs sequential, 120 IOPS (built)
3. Leaky Bits — DRAM refresh, 100ns, volatility (built)
4. The Queue — 1/(1−ρ), the 80% knee (built)
5. Hot Partition — keys as hash buckets; watch "now" melt one node → forges shards
6. Replication Lag — primary→replica stream; read-your-own-write anomaly → forges replicas
7. The Pipe — bandwidth × RTT; why one TCP stream can't fill a fat link
8. Consensus Round-Trips — 2 rounds × cross-region RTT; why global strong writes cost 150ms
9. LSM vs B-tree — same writes, two engines racing; write vs read amplification
10. Connection Pool — 100 conns vs 10k clients; why poolers exist
11. Backpressure — fast producer, slow consumer, bounded buffer; drop, block, or shed
12. TTL & Stampede — hot key expires, 10k misses race to the DB → dogpile lock/jitter → forges cache
Backlog (v2): Transistor Switch, NAND Charge Levels, TCP Handshake+Slow Start,
DNS Resolution, GC Pause, Row vs Column layout, Bloom Filter, Quorum Overlap.

## 3. Flaw puzzle template + the RECIPE
Fields: { id, title, reqs (one line, MUST contain the number the flaw violates),
brief (sets up plausibility — the design must look reasonable), nodes[], edges[],
flaw (node id), frames[] (4–6 scripted {cap, bars}) telling the failure as a story,
explain (the tension, not just the bug), fix (concrete, named technique),
line (first-person interview soundbite) }.

RECIPE — turn any reference design (e.g., a Hello Interview solution) into puzzles:
1. List every safeguard the solved design contains (visibility timeout, partition
   suffix, delayed delivery, idempotency key, dogpile lock, backpressure…).
2. For each safeguard: DELETE it, keep everything else professional-looking. That's
   one puzzle. The safeguard IS the fix section. The requirement it protected goes
   in reqs.
3. Write frames as a 3-act story: normal → stress arrives → the specific consequence.
   The consequence must be concrete (job #4411, 4 emails, partition B at 300%).
4. Distractor nodes must each be defensible-but-wrong; if a node could never be
   suspected, cut it from the diagram.
Each studied design yields 3–6 puzzles. Seed sources: the job scheduler (done),
then: URL shortener, rate limiter, news feed, chat, web crawler, Ticketmaster.

## 4. Taste test template + distractor taxonomy
Fields: { prompt (requirements with NUMBERS), a, b (both defensible), ans,
whys[4] (exactly one ok:true), flip ("The Tables Turn": requirements where the loser
wins — mandatory, this is law L5) }.
The 3 wrong justifications must each embody a named bad habit:
- ABSOLUTIST: "X is always bad/better" (polling, NoSQL, microservices…)
- VENDOR-BRAIN: right answer credited to a product/brand instead of the mechanism
- MISAPPLIED VIRTUE: a true value (simplicity, consistency, DX) that loses to a hard
  constraint in THIS spec — the most tempting distractor; make it genuinely attractive
(A fourth allowed type: IRRELEVANT-TRUTH — accurate fact that doesn't decide this case.)

## 5. Drill categories (60 total, ~10 each)
- Capacity of single machines (app, Redis, Postgres r/w, Kafka, NVMe)
- Latency ladder (recall + combinations: "cache miss then SSD read ≈ ?")
- Story→numbers translation (DAU math, IoT fleets, peak multipliers)
- Storage growth (users × events × size; retention)
- Network (RTTs, bandwidth-delay, requests per page load)
- Cost sanity (what $1k/mo buys; cache vs replica per absorbed read)
Every drill: { q, unit, ans, loExp, hiExp, derive[3], numbersRefs[] }.

## 6. Builder scenario template
{ name, story (JSX with Terms), translate[] (math → out rows), think[] (2–3 Socratic
questions incl. the one that decides the architecture), rps, readPct, budget,
p99Target, profile(t), mod?(t) }. New v1 scenarios beyond the existing three:
"Chat app goes to school" (fan-out writes), "Black Friday checkout" (writes must NOT
be delayed — anti-queue lesson), "Analytics backfill" (batch vs online contention).

## 7. On-Call content
Patterns: { key, name, price, icon, fx (game effect, one line), irl (real-world
explanation, 2 sentences, interview-usable) }. New patterns for v1: Rate Limiter,
Bulkhead, Dead-Letter Queue, Read-Through Cache, Canary Deploys, Multi-AZ.
Encounters escalate per act: act 1 = capacity, act 2 = capacity + one modifier,
act 3 = interacting modifiers. Every boss beatable by ≥2 distinct strategies
(enforced in balance suite).
