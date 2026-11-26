# Copy Audit: nanosecond

## Changes made
- `index.html`: Unified meta, OG, and Twitter descriptions with concrete phrasing ("Run interactive simulations...") and expanded `og:image:alt` to describe the social card.
- `public/site.webmanifest`: Removed the em dash from `name` and clarified `description`.
- `README.md`: Replaced stale mode name (`Field Manual` -> `Concept Library`), broken command (`pnpm verify` -> `./scripts/verify.sh`), and obsolete doc paths (`GAME_SPEC.md`, `ROADMAP.md`, etc.) with real repo paths, and replaced all seven em dashes with colons.
- `src/engine/capacity.ts`: Replaced em dashes in cache tags and postmortem diagnostics, changed "requests queue then die" to "requests queue and fail", and fixed the missing verb in "it is one traffic spike away from failing."
- `src/state/scars.ts` and `tests/scars.test.ts`: Replaced em dashes in exported Markdown context pack headings and blind-spot lines; updated test assertions to match.
- `src/ui/fmt.ts`: Replaced the em dash in sub-second human-scale formatting with parentheses.
- `src/modes/practice/index.tsx`: Replaced hardcoded fake-progress labels (`drill 1 · nothing overdue`, `puzzle 1/12`, `act 1/3`) with accurate catalog counts (`60 drills`, `12 puzzles`, `3 acts`), removed the inaccurate "before the clock runs out" claim from Review (no countdown fail state, and sound designs exist), and clarified On-Call's timing note.
- `src/modes/lab/index.tsx`, `ForgePanel.tsx`, `ConsensusRTT.tsx`: Made the progress bar `aria-label` specific, fixed singular "control" -> "controls", capitalized "Scar Journal" and tightened retry copy, and capitalized "Agreeing…".
- `src/modes/manual/index.tsx`, `Product.tsx`: Replaced Windows-only "ctrl-F" with platform-neutral "search the page", clarified Named Technologies subtitle, and unified the back button to `← back to library`.
- `src/modes/drills/index.tsx`: Changed "lost in space (>1 order)" to "off by >1 order" and fixed the histogram subtitle to cover all estimates rather than only misses.
- `src/modes/journal/index.tsx`: Made empty states for Scars, Soundbites, and Teach-backs concrete about which actions populate them.
- `src/modes/review/DailyIncident.tsx`, `Interrogate.tsx`, `TasteTest.tsx`, `TeachBackCard.tsx`, `src/state/daily.ts`: Clarified button labels ("Lock requirements and see debrief", "Submit pick and reason", "Select a component to flag"), fixed casing and missing period in Teach-back prompts, replaced "already played" with "(completed)", and changed slangy "got got" in the share string to "missed it".
- `src/modes/oncall/index.tsx`, `src/modes/builder/index.tsx`: Added "Running…" to On-Call's active encounter button, clarified "An incident needs your decision" and "Ring the IPO bell", and harmonized `POSTMORTEM` spelling with On-Call and Lab.

## Left alone on purpose
- `README.md` opening Grace Hopper wire story and framing paragraphs: authored narrative voice; kept intact.
- `src/modes/about/index.tsx`: authored premise essay and four-walls thesis; accurate to the current 18 toys and 27 briefings.
- `src/content/` authored teaching material (`glossary.ts`, `manual/`, `toys.ts`, `puzzles.ts`, `drills.ts`, `scenarios.tsx`, `interrogations.ts`, `tastes.ts`, `oncall.ts`, `forge.ts`, `products.tsx`, `ladder.ts`, `edges.ts`, `sayit.tsx`, `numbers.ts`): authored pedagogical prose, definitions, and schema-tested derivations; preserved untouched.
- `src/modes/lab/` toy intro and punchline prose: authored teaching explanations; preserved untouched.
- `public/og-card.svg`: visual asset synced with `public/og-card.png`; left untouched to avoid asset drift without rebuilding.
- Tested button labels (`Lock it in`, `Take the traffic`, `Collect & draft reward`, `Or declare it sound`, `← practice`, `← the journey`): concise, clear, and asserted in Playwright suites.

## Not done (next pass)
- Standardizing capitalization across lowercase mono micro-labels vs. sentence-case buttons inside the 18 Lab simulation components.
- Reviewing long-form `simplifies` fine print and `feltIn` CTA wording across the 27 Concept Library briefings once specs 102 through 118 land.
