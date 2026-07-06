# ADR 0005: The Lab teaches computing — one stack, two verbs
Date: 2026-07-06 (revised same day while still proposed) · Status: proposed
(playtester sign-off starts spec 081)

## Context
Playtesting surfaced, in three rounds of feedback, a goal the app only
half-serves. The player isn't just prepping for systems design interviews —
they want to understand computers: "how data is processed / moved on a
deeper level" (product-spec pain point 3: Turing-Complete depth).

Round one (background per toy) produced the field briefings. Round two
(untethered, "what am I trying to make click") produced THE MAP — a request's
journey through 8 stations — plus per-toy clicks. Round three exposed the
remaining gap precisely: **the journey is a map of a web backend, not a map
of computing.** It answers "what whole are these parts of?" with the
interview's whole. The player's question is vertical, not horizontal: what
is a computer, all the way down?

The measurable symptom of the app's anchor: 8 of 13 toys live on the
top floor (distributed systems). The floors below thin out fast, and the
single most central mechanism in computing — the fetch-decode-execute
loop, what "running code" physically IS — has no toy at all.

## Decision
The app's macro-picture is **one stack, two verbs**:

- **The stack**: a computer is machines built out of machines. Floors, top
  to bottom: the planet (many machines pretending to be one) → the network
  (bytes crossing wires) → the machine/OS (one box pretending to be many
  programs) → the chip (code becoming electricity) → the cell (what a bit
  physically is) → the physics (the four walls).
- **The two verbs**: at every floor, data is only ever *transformed* or
  *moved* — and moving dominates the cost, growing with distance. This
  asymmetry is why every floor independently invented the same tricks:
  a small fast copy nearby (L1:DRAM :: Redis:Postgres :: CDN:origin),
  a waiting line when arrivals outrun service, and movement in batches
  (lines, pages, packets, streams). These cross-floor echoes ARE the
  understanding the player is asking for.

Committed consequences:

1. **The Lab map becomes two-axis** (spec 081): THE JOURNEY (existing,
   horizontal) and THE STACK (new, vertical) as toggled views of the same
   toys. The stack shows dark floors honestly — an unlit floor is a
   curriculum promise, not an embarrassment. Briefings gain ECHO lines
   ("this same pattern, N floors apart") where a true echo exists.
2. **Every toy gets a stack coordinate** (floor) alongside its journey
   station; both enforced exactly-one by schema tests.
3. **The deep tier fills floors, not a theme** — spec 086 becomes the chip
   trio (The Instruction Loop, The Heat Wall, The Branch Predictor: the
   loop, its speed limit, its survival trick), spec 088 the machine/OS +
   chip pair (The TLB Toll, False Sharing). Arc ends at 18 toys.
4. **System design is repositioned, not removed**: the interview modes are
   the top floor's application. Copy stops implying the interview is the
   point; the physics is the point, the interview is a place it pays off.
5. Pedagogy upgrades (receipts 082, forecast 084) still precede new toys.

## Alternatives rejected
- **A separate "Machine" mode** — fragments the map; the stack IS the Lab's
  organizing view, not a sibling mode.
- **Concept Library sections only** — the library explains; the Lab makes
  you operate (law L1). Depth belongs where the hands are.
- **Stay interview-scoped** — contradicts pain points 3–5, the tagline,
  and now three rounds of direct playtest feedback.
- **Go full Turing Complete (build a CPU from gates)** — out of scope for
  this app's format; the chip floor's toys go down to the mechanism level
  (loop, pipeline, cache, heat), and the ADR names dedicated tools
  (Turing Complete, nand2tetris) as the right vehicle below the transistor.
  The cell floor keeps its two toys plus v2 backlog (NAND, transistor).

## Consequences
- Toy count moves 13 → 18 as 086/088 land; CLAUDE.md DoD and product-spec
  §3.1 counts update in the same commits.
- No drill-bank growth this arc: new concepts include an already-drilled
  number (`cpu-cycle`, `l1-hit`, `dram-access`) in `numberIds`.
- Queue order: the playtester promoted this arc ahead of the remaining v1
  specs — 081–088 run next, then 060/070/080. v1's definition of done is
  deferred behind the arc by their explicit call (2026-07-06).
- The network and machine/OS floors remain the thinnest after this arc;
  the next arc's candidates are a packet's life, syscall toll, GC pause
  (parked in content-pipeline §2 backlog with the other v2 toys).
