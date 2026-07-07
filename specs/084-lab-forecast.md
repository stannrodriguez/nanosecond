# 084 — Lab forecast (law L3 comes to the Lab)

Law L3 — predict before run — governs Builder and Review but was never
applied to the Lab, so toys teach by watching instead of by being wrong
first (ADR 0005 context #5). This spec adds a one-tap forecast to every toy:
before the first interaction, the player calls the outcome; the sim then
proves or embarrasses the call; misses land in the Scar Journal like every
other mode's misses. Being wrong, then seeing why, is the strongest memory
the Lab can manufacture.

- [x] New content type `src/content/forecasts.ts` keyed by toy id:
      { question (one line), options (3–4, one-tap, no typing), correctIx,
      reveal (one sentence said after the sim settles it) } — authored for
      all toys; template documented in `docs/content-pipeline.md` §2
- [x] Toy pages show "CALL IT" between the field briefing and the sim:
      options as chips; picking one locks it (stored per toy in progress
      state so revisits don't re-ask); the sim stays behind the panel until a
      call is made — predict-before-peek, since several sims auto-play and a
      visible-but-gated sim would leak its own answer (design refined from the
      original "soft-gate visible controls"; predict-before-peek is stronger)
- [x] On toy completion: verdict (called it / the sim disagrees) + the
      reveal line; a wrong call logs a Scar { mode: 'lab' } with the toy's
      one-line lesson — visible in the Journal's log
- [x] Schema tests: 1:1 toy↔forecast coverage, correctIx in range,
      3–4 options each, non-empty reveal (jargon kept light — the field
      briefing dots the terms on the same page)
- [x] Keyboard + 380px + reduced-motion clean; e2e: make a wrong call on the
      Consensus toy (deterministic completion), assert the verdict and the
      Journal scar
- [x] Deep links still land you AT the challenge (ADR 0004): the forecast is
      part of the toy page, never a separate route
- [x] Balance suite untouched and green; verify.sh green; shots reviewed

## Context (read this, not the whole repo)
- **Read**: `docs/product-spec.md` §2 law L3; `src/content/briefings.tsx`
  (the keyed-record content pattern + its schema tests) as the model;
  `src/state/progress.ts` (how toy completion persists) and
  `src/state/scars.ts` or the journal store used by drills
  (`tests/scars.test.ts` shows the scar contract).
- **Touch**: `src/content/forecasts.tsx` (new), `src/modes/lab/index.tsx`
  (CALL IT strip + verdict), progress state (forecast answers),
  `docs/content-pipeline.md` §2, `tests/schema.test.ts`,
  `e2e/modes.spec.ts`, baselines.
- **Voice**: forecasts are bets, not quizzes — "Where does waiting explode?"
  not "Which of the following…". One line, numbers from `numbers.ts` only.
- **Don't**: hard-block the sim behind the forecast (soft-gate controls,
  never hide the viz), add free-text input, or score calibration — that
  stays Review's job.
