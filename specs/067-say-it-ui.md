# 067 — Say-it deck UI + scheduling (networking pilot live)

Third of three thin slices (065 glossary → 066 card content → 067 deck UI).
This slice makes the deck playable. Locked format decisions apply: speak-only
(no text input), no timers, decks local to their briefing.

- [ ] Deck route `/manual/briefings/networking/say-it` (sub-content URL per
      ADR 0004; generic over `section` so future decks get routes for free)
- [ ] Card front: progress dots, "INTERVIEWER" label, cue, "say your answer
      out loud — full sentences, like you're in the room — then flip" hint,
      flip button
- [ ] Card back: "A strong answer sounds like" + model sentence · "Did you
      say…" + 3 toggleable checklist rows · trap row · number row · dotted
      <Term> links · grade bar (blanked / partial / nailed it)
- [ ] End screen: tally by grade + note that blanked cards return daily,
      with a link back to the briefing
- [ ] Grades feed Leitner boxes (5, localStorage, same shape as
      `src/state/drillProgress.ts` — shared module or parallel store,
      whichever is smaller); session builder mixes due cards first, like
      drills; blanked demotes to box 1, partial holds, nailed promotes
- [ ] Entry point: a card at the bottom of the networking briefing ("SAY IT —
      6 questions an interviewer would ask"); deck locked until the briefing
      has been opened at least once (law L2, brief-before-test — reuse the
      manual's read-state), with a plain-language locked state
- [ ] Keyboard: space/enter flips, 1/2/3 grades; visible focus throughout;
      works at 380px; prefers-reduced-motion respected on any transitions
- [ ] e2e: open briefing → entry card unlocks → play a card (flip, toggle a
      check, grade) → end screen; screenshots reviewed per autonomy rule 3;
      verify.sh green

## Context (read this, not the whole repo)
- **Read**: `src/content/sayit.ts` (066's output — the data contract);
  `src/state/drillProgress.ts` (Leitner shape); `src/modes/drills/index.tsx`
  session-builder pattern only; `src/modes/manual/index.tsx` routing +
  read-state; ADR 0004.
- **Touch**: `src/modes/manual/` (route + entry card + deck component —
  colocate the deck under the manual mode, it's manual sub-content),
  `src/state/` (sayit progress store), e2e + baseline shots.
- **Look**: match the manual's briefing styling (panel, C.net accent for the
  networking deck, mono labels). Grade colors: blanked C.alert · partial
  C.compute · nailed C.mem. The interaction was prototyped and approved in
  the design-review artifact; this spec's card-front/back bullets are that
  prototype, so build to these bullets.
- **Scope guard**: networking deck only; no global Say-it tab; no decks on
  other briefings; no audio recording — speak-only means the player talks to
  the room, the checklist is the record.
