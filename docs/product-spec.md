# Product Spec — Nanosecond

*Systems design, from the physics up. Numbers don't stick — mechanisms do.*
(What we're building and why. For how it's built, see `architecture.md`.)

## 1. Player & outcome

One player: a software engineer preparing for systems design interviews who wants
DEEP understanding, not memorized answers. Pain points, in priority order:
1. Feels "unanchored" producing numbers (QPS, latency, storage) — no foundations.
2. Can't tell good designs from bad ones ("taste").
3. Wants explanations to go as deep as physics allows (Turing Complete depth).
4. Very visual learner; text-only derivations do not stick.
5. Needs gaps in understanding to become OBVIOUS (the Turing Complete property).

The game succeeds when the player can (a) translate a fuzzy product story into load
numbers out loud, (b) predict where an architecture breaks before it's simulated,
(c) justify choices by fit-to-requirements, and (d) re-derive every canonical number
from a mechanism they've personally played with. The v1.5 "Deep Water" arc
(ADR 0005) raises the bar from interview-ready to staff-level: (e) name the failure
mode from its symptoms — a dashboard, a war story — and (f) reason about
correctness under concurrency, partial failure, and lying clocks, not just capacity.

## 2. Pedagogical laws (non-negotiable; playtest triage cites these)

L1 **Mechanism before number.** No number is taught as a fact; each is the output of
    a playable mechanism (a "toy") or an explicit derivation chain.
L2 **Brief before test.** Every challenge is preceded by a briefing that teaches its
    vocabulary and translates its story into numbers step-by-step. No challenge may
    assume a term the game hasn't taught or made tappable.
L3 **Predict before run.** Wherever a simulation exists, the player commits a
    forecast first and is scored on calibration.
L4 **Failure must be visible and diagnosed.** Every failure produces an animated,
    component-level view of WHAT broke, a plain-language post-mortem of WHY, the
    fix, and an interview-ready soundbite.
L5 **Taste is fit.** Good/bad is only evaluated as a (design, requirements) pair.
    Every A/B judgment includes "when the other answer wins."
L6 **Every term is tappable.** Global glossary (~60 entries), dotted-underline,
    drawer UI.
L7 **Real names for real things.** HP is "error budget", relics are real patterns
    with real-world explanations, bosses are real failure modes.
L8 **Requirements are extracted, not given.** At least one mode trains the
    extraction itself (Interrogation, spec 055).

## 3. Modes

### 3.1 Intuition Lab (reference: `docs/reference/intuition-lab.jsx`)
Playable physics/mechanism toys. v1: 12 toys (4 exist). Each toy makes ONE number
impossible to forget. Framework + catalog: `content-pipeline.md` §2.
v1.5 (specs 090, 120) adds five: The Anomaly Zoo (isolation levels), Retry Storm
(amplification + goodput collapse), The Tail at Scale (fan-out multiplies tails),
Two Clocks (skew + last-write-wins), Shuffle Shard (blast radius) — 17 total.
The Deep Water toys forge nothing; they teach judgment, not parts.

### 3.2 Concept Library — Field Manual + Glossary (reference: `docs/reference/builder-v0-3.jsx`)
**The explanation-and-visualization layer is the heart of the product** (pain points
3–5): plain-language briefings where an interactive or animated diagram carries the
explanation and the text annotates it. Organized on three shelves:
- **Core Concepts** — networking essentials, API design, data modeling, database
  indexing, caching, sharding, consistent hashing, CAP theorem. v1.5: + transactions
  & isolation; CAP grows into "CAP & the Consistency Ladder" (linearizable → causal
  → session guarantees → eventual, plus PACELC).
- **Key Technologies** — relational & NoSQL databases, blob storage, search-optimized
  databases, API gateway, load balancer, queues, streams/event sourcing, distributed
  locks, distributed caches, CDN. v1.5: + OLTP vs OLAP & columnar storage.
- **Common Patterns** — pushing realtime updates, managing long-running tasks,
  dealing with contention, scaling reads, scaling writes, handling large blobs,
  multi-step processes, proximity-based services, and how to pick between patterns.
  v1.5: + The Log (the capstone: WAL = replication stream = Kafka topic = Raft log
  = CDC), + blast radius & shuffle sharding.
Every section carries at least one visualization the player can poke, cross-links to
the Lab toy that proves its number, and ends with where the concept bites in the
other modes. Plus the global glossary system. v1: 27 sections (spec 020 built the
first 10; spec 047 grows and re-shelves them), ~60 glossary entries. v1.5 (specs
100, 120) grows to 31 sections and ~85 entries. Template: `content-pipeline.md` §7.

### 3.3 Drills (reference: `docs/reference/v0-ladder-drills-builder.jsx`, Drills tab)
Order-of-magnitude estimation on a log slider, scored by log-distance (≤0.3 dead-on /
≤0.6 ballpark / ≤1.0 same-universe). Every answer shows a 3-step derivation.
v1: 60 questions with Leitner-box spaced repetition (localStorage).
v1.5 adds a Little's Law family (L = λ·W: pool sizing, in-flight estimation — spec
100) and a second deck, **Read the Dashboards** (spec 110): 12 diagnostic scenes,
3–4 time-series panels → name the failure; teaches USE/RED and why averages lie.

### 3.4 Builder scenarios (reference: `docs/reference/builder-v0-3.jsx`)
Briefing → think → build → run → post-mortem, against the shared simulation engine.
v1: 6 scenarios of escalating difficulty.

### 3.5 Design Review (reference: `docs/reference/design-review.jsx`)
The judgment gym:
- **Find the Flaw** (12 puzzles): plausible design, one embedded bug, accuse a
  component, scripted reveal, fix + soundbite. Difficulty ladder: single-obvious →
  single-subtle → two interacting flaws → "this design is actually fine."
- **Predict & Run** (6 rounds): commit bottleneck + error-onset forecasts first;
  one round scored with confidence intervals.
- **Taste Test** (6 matchups): A vs B under stated requirements; answer 50 pts,
  justification 50 pts; distractor taxonomy in `content-pipeline.md` §4; mandatory
  "Tables Turn" section.
- **Daily Incident**: one flaw puzzle per calendar day (date-seeded), streak,
  spoiler-free shareable result. The app's landing card.
- **Par times** displayed on puzzles (no fail state) — pacing is a graded skill.
- **Teach-back**: optional 60-second timed narration prompt after solves, self-scored
  on a 3-item rubric (mechanism / tradeoff / number), stored in the Scar Journal.

### 3.6 Interrogation (spec 055 — Law L8)
The game plays a vague stakeholder; the player buys clarifying questions from a
mixed-value list with a 6-interview-minute budget; requirements crystallize from
answers; exactly one UNASKED crucial question becomes a mid-run trap. Post-mortem
ranks all questions by information value. v1: 6 interrogations.

### 3.7 On-Call runs (reference: `docs/reference/on-call-run.jsx`)
Roguelike: node map, error budget as HP, cloud budget as gold, draft-1-of-3,
patterns as relics, synergies, scripted encounter modifiers. v1: 3 acts,
18 encounters, 12 patterns, 6 events, 3 bosses (Thundering Herd, Black Friday,
The Region Outage). Boss/flaw post-mortems attach **"This Actually Happened"**
cards linking to real public postmortems (S3 2017, Cloudflare 2019 regex,
GitHub 2018 split-brain, Slack Jan 2021, Facebook BGP 2021).
v1.5 (spec 090) adds boss #4, **The Metastable Storm** — the trigger clears and
the outage stays (cold cache → overloaded DB → cache can't refill); its card
cites the Metastable Failures paper (HotOS '21) and Roblox's Oct 2021 Consul
outage. Spec 120 adds the Shuffle Shard relic.

### 3.8 The Forge (progression spine)
You may not USE a component you haven't understood. Unlock graph:
cache ← Leaky Bits + hit-rate challenge · queue ← The Disk + append challenge ·
replicas ← Replication Lag toy + failover challenge · shards ← Hot Partition toy +
key-choice challenge · workers ← The Queue + drain-sizing challenge · CDN ←
Race Light + placement challenge. Locked parts render greyed with "Forge this in
the Lab" links.

### 3.9 Scar Journal (spec 045)
Auto-log every miss across all modes { date, mode, predicted/accused/built, truth,
oneLineLesson }. Views: chronological + grouped by recurring theme.
**Pre-interview briefing** button compiles: 5 shakiest numbers, 3 recurring blind
spots, all collected soundbites. **Export context pack**: markdown play-history
summary for use in LLM mock interviews.

### 3.10 Case Files (v1.5, spec 130)
Playable real postmortems — the industry's scars shelved next to the player's own
(law L7). Four cases: S3 2017, GitHub 2018, Cloudflare 2019, Roblox 2021. Each maps
onto mechanisms the game already taught: the player commits what they'd do next at
every decision point before the reveal (law L3), gets a plain-language recap
(law L4), and ends at the official public postmortem — the game's telling is a
trailer, not a substitute. Completions file into the Scar Journal's "Industry
scars" shelf and can be cited by the pre-interview briefing.

### 3.11 v2 (spec only, do not build)
In priority order (ADR 0005): Legacy campaign (persistent company, each chapter's
growth breaks the previous architecture; refactor under live traffic —
expand/contract, dual-write, shadow reads, cutover with rollback), then Readiness
Meter (rubric-mapped mock exam).

## 4. The interlock
Lab toys forge components → components fuel Builder + On-Call → runs teach patterns →
patterns and scale-walls send the player back to the Lab for deeper toys. Every
post-mortem that names a mechanism deep-links to its toy. v1.5 closes the outer
loop: dashboards and Case Files run the arrow backwards, from real-world symptom
to the mechanism that explains it.

## 5. Non-goals (v1)
No backend, no accounts, no multiplayer, no mobile app, no LLM calls at runtime.
localStorage persistence only. English only.
