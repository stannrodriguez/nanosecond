# nanosecond

A game for building systems design intuition from the physics up.

Grace Hopper used to hand out 30-centimeter lengths of wire when admirals asked
her why satellite links were slow. That's how far light travels in one
nanosecond. She figured people would stop arguing with latency once they could
hold the limit in their hands.

This game tries to do the same thing for the rest of systems design. It's for
engineers prepping for interviews who don't want to memorize a numbers sheet.
If you say "I'd keep steady-state utilization near 70%" because you read it
somewhere, a good interviewer will get to the bottom of that in one follow-up
question. If you say it because you've watched queueing delay go vertical past
the 80% knee in a simulator, with your own prediction on the line, the answer
holds up. Every latency number in the game is traced back to the physical limit
that causes it, every architecture pattern is something you watch fail without
it, and design decisions are scored the way an interviewer would score them.


## The modes

| Mode | What it trains | The trick |
|---|---|---|
| Intuition Lab | Where the numbers come from | Playable physics toys: race a photon, spin a disk, watch DRAM leak, saturate a queue |
| Concept Library | Vocabulary and mental models | Interactive briefings, a latency ladder, and a tap-anything glossary |
| Drills | Producing numbers on demand | Log-scale Fermi estimation, scored by order of magnitude, with spaced repetition |
| The Builder | Story → numbers → architecture | Briefed scenarios run against a queueing-theory simulator |
| Design Review | Judgment | Find the flaw · predict & run · A-vs-B taste tests · requirements interrogation |
| On-Call | Composition under pressure | A roguelike run: error budget as HP, real patterns as relics, real failure modes as bosses |
| The Forge | Earned depth | Components stay locked until you've played the mechanism inside them |

Your play history feeds two things: a Scar Journal that logs every miss with
its lesson, and a one-page pre-interview briefing built from your specific
blind spots.

## Quick start

```bash
pnpm install
pnpm dev            # play at localhost:5173
./scripts/verify.sh # typecheck + unit/balance tests + Playwright e2e
```

No backend, no accounts. Progress lives in localStorage.

## How this repo is built

Most of this project is written by Claude Code, with humans steering through
playtesting. Because of that, the docs do a lot of the work you'd normally
expect from a team:

- **CLAUDE.md**: autonomy rules (verify, look at screenshots, commit per milestone)
- **docs/product-spec.md**: the design, pedagogical laws, and modes
- **docs/architecture.md**: stack, repo layout, simulation math, balance suite, and theme
- **docs/content-pipeline.md**: content templates and authoring recipes for puzzles, taste tests, briefings, and drills
- **docs/decisions/**: architecture decision records for hard-to-reverse choices
- **docs/reference/**: the original five prototypes (voice and feel reference)
- **specs/README.md**: the ordered work queue and milestone status

The piece that makes unsupervised development workable is the balance test
suite. It encodes "the game teaches true things" as executable assertions: if
a design that shouldn't survive 45k req/s without a cache passes in the
simulator, the build is broken.


## Status

Pre-alpha, under active development. Check `specs/README.md` for the current
milestone. Playtest reactions are the most valuable contribution: file them as
issues with the mode, what you expected, and what confused you.
