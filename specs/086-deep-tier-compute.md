# 086 — Deep tier, the chip trio (Instruction Loop + Heat Wall + Branch Predictor)

The chip floor's story told in order (ADR 0005): what "running code"
physically IS, why it stopped getting faster, and how it survives at the
speed it has. The Instruction Loop is the arc's centerpiece — the player
asked "how is data processed?" and this is the processing step itself,
which currently has no mechanism to poke.

**14 · THE INSTRUCTION LOOP** (compute) — a tiny visible CPU runs a
4-instruction program: fetch → decode → execute, one stage lit per step.
One toggle: pipelining. Same clock, ~4× the throughput, because the stages
work like an assembly line instead of taking turns. Punchline: "the
computer runs code" means THIS loop, billions of times a second — and the
pipeline that makes it fast is a bet on knowing what comes next (toy 16
collects that bet). Reuses `cpu-cycle` (its confusions field already
teaches cycle ≠ instruction — this toy makes that playable).

**15 · THE HEAT WALL** (compute) — drag the clock frequency; watch power grow
like ~f³ (switching energy · voltage that must rise with f) and slam into an
air-cooling budget; past it, the die throttles. Punchline: this exact wall is
why ~2005 the industry stopped selling gigahertz and started selling cores —
and why "just get a faster machine" stopped being an answer.

**16 · THE BRANCH PREDICTOR** (compute) — one branchy loop, one toggle: sorted
vs unsorted data. Same instructions, ~4× the time, because the deep pipeline
from toy 14 runs on guesses and a wrong guess flushes it. Punchline: the CPU
speculates to survive; Spectre is the day the guessing leaked.

- [x] All three toys meet the FULL toy contract in one change each: catalog entry
      (`toys.ts` incl. `click`), sim component registered in
      `TOY_COMPONENTS`, field briefing, concept row, station on the map,
      forecast (spec 084 contract), `simplifies`, playable in <10s with one
      clear manipulable variable, a stack floor (spec 081) alongside the
      journey station
- [x] New numbers with honest 3-step derivations: `clock-ceiling`
      (~4 GHz — P ∝ V²·f with V rising with f ⇒ ~f³ against a fixed cooling
      budget) and `mispredict-penalty` (~15–20 stages flushed ≈ 5 ns at
      0.3 ns/cycle) — values consistent with `cpu-cycle`'s existing
      derivation text ("clocks stalled near 3–5 GHz")
- [x] Concept rows stay drill-reachable without touching the 60-drill bank:
      include `cpu-cycle` in each `numberIds` (per ADR 0005 consequences)
- [x] The map: all three join INSIDE EVERY CHIP; if that station now exceeds 4
      toys, split it (e.g. THE CLOCK / THE MEMORY LADDER) rather than crowd
      it — station coverage tests stay green
- [x] Toy count references update in the same change: e2e specs, CLAUDE.md
      definition of done, product-spec §3.1
- [x] Glossary law holds (add entries for genuinely new jargon — e.g.
      pipeline, speculation — and dot them in copy); every displayed number
      resolves to `numbers.ts`
- [x] Balance suite untouched and green; verify.sh green; new + changed
      shots reviewed at desktop and 380px

## Context (read this, not the whole repo)
- **Read**: `docs/content-pipeline.md` §2 (toy + briefing + map contracts),
  `src/modes/lab/CacheCliff.tsx` (the newest toy — copy its shape: slider,
  staircase SVG, Punchline, onComplete), `src/content/journey.tsx`,
  `src/content/numbers.ts` `cpu-cycle` entry (its derivation constrains
  both new numbers' stories).
- **Touch**: `src/modes/lab/InstructionLoop.tsx` + `HeatWall.tsx` +
  `BranchPredictor.tsx` (new),
  `toys.ts`, `briefings.tsx`, `forecasts.tsx`, `concepts.ts`, `journey.tsx`,
  `numbers.ts`, `glossary.ts`, lab `index.tsx` registry, `e2e/*`, docs
  counts, baselines.
- **Physics honesty**: Heat Wall's `simplifies` must own the caricature
  (Dennard scaling's end, turbo/boost, undervolting); Branch Predictor's
  must own that real predictors hit >95% on most code — the toy shows the
  penalty, not the average.
- **Don't**: model real microarchitecture, add a second manipulable
  variable per toy, or teach Spectre mechanics — one line naming it is the
  hook, the library can go deeper later.
