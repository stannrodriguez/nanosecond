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
from a mechanism they've personally played with.

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

### 3.2 Concept Library — Field Manual + Glossary (reference: `docs/reference/builder-v0-3.jsx`)
**The explanation-and-visualization layer is the heart of the product** (pain points
3–5): plain-language briefings where an interactive or animated diagram carries the
explanation and the text annotates it. Organized on three shelves:
- **Core Concepts** — networking essentials, API design, data modeling, database
  indexing, caching, sharding, consistent hashing, CAP theorem.
- **Key Technologies** — relational & NoSQL databases, blob storage, search-optimized
  databases, API gateway, load balancer, queues, streams/event sourcing, distributed
  locks, distributed caches, CDN.
- **Common Patterns** — pushing realtime updates, managing long-running tasks,
  dealing with contention, scaling reads, scaling writes, handling large blobs,
  multi-step processes, proximity-based services, and how to pick between patterns.
Every section carries at least one visualization the player can poke, cross-links to
the Lab toy that proves its number, and ends with where the concept bites in the
other modes. Plus the global glossary system. v1: 27 sections (spec 020 built the
first 10; spec 047 grows and re-shelves them), ~60 glossary entries. Template:
`content-pipeline.md` §7.

### 3.3 Drills (reference: `docs/reference/v0-ladder-drills-builder.jsx`, Drills tab)
Order-of-magnitude estimation on a log slider, scored by log-distance (≤0.3 dead-on /
≤0.6 ballpark / ≤1.0 same-universe). Every answer shows a 3-step derivation.
v1: 60 questions with Leitner-box spaced repetition (localStorage).

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

### 3.10 v2 (spec only, do not build)
Readiness Meter (rubric-mapped mock exam); Legacy campaign (persistent company,
each chapter's growth breaks the previous architecture).

## 4. The interlock
Lab toys forge components → components fuel Builder + On-Call → runs teach patterns →
patterns and scale-walls send the player back to the Lab for deeper toys. Every
post-mortem that names a mechanism deep-links to its toy.

## 5. Non-goals (v1)
No backend, no accounts, no multiplayer, no mobile app, no LLM calls at runtime.
localStorage persistence only. English only.
