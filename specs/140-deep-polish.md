# 140 — Deep Water polish (v1.5 ships here — ADR 0005)
- [ ] Onboarding suggested-path + landing surfaces know the new content
      (dashboards deck in the path; a Case File is a valid landing card
      alongside the Daily Incident)
- [ ] Cross-mode deep-link audit over everything v1.5 added: every new
      post-mortem/miss → its toy/section; boss #4 ↔ the Roblox case file;
      consistency-ladder section ↔ replication-lag toy; 050's pinned puzzles
      ↔ 090's toys
- [ ] README + "how this game thinks" refreshed: 17 toys, 31 sections,
      boss #4, the dashboards deck, Case Files; screenshots updated
- [ ] Reduced-motion + keyboard + 380px audit on all NEW screens; full
      /playtest pass over the app; regressions fixed before the arc is done

## Context (read this, not the whole repo)
- Mirrors spec 080 for the v1.5 surfaces. Lean on `scripts/shots-changed.mjs`
  and review every flagged shot at desktop AND 380px; /playtest deliberately
  reviews all screens.
- CLAUDE.md's "Definition of done (v1.5)" is the checklist this spec closes.
