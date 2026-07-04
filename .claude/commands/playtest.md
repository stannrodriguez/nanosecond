---
description: Visual/UX pass over every screen, judged against the reference feel
---

Playtest the game like a picky human, not like a test suite:

1. Run `scripts/verify.sh` for fresh screenshots, then view EVERY shot in
   `e2e/shots/` (this is the one workflow where you look at all of them —
   that's the point of a playtest).
2. Judge each screen against the quality bar: cramped? off-palette? number
   without a derivation? jargon without a dotted `<Term>`? missing fine
   print? Anything that reads broken at 380px?
3. Check the pedagogy, not just pixels: does each screen answer "what am I
   supposed to learn here"? Cite the pedagogical law (L1–L8,
   product-spec §2) any issue violates.
4. Write findings to a numbered list, most severe first, each with the
   screen, the problem, and the law/quality-bar line it breaks. Propose the
   fix but do NOT apply fixes during the playtest — triage first.
