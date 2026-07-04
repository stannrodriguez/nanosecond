# 130 — Case Files: playable postmortems (ADR 0005)
The Scar Journal holds the player's scars; world-class engineers grow on the
industry's (law L7). Real outages, replayed on mechanisms the game already
taught.

- [ ] Mode shell + template (fills content-pipeline §12 reserved slot):
      { id, company, year, title, timeline[] (phases: dashboard/diagram states
      + narration), decisions[] (at each fork the player commits what they'd
      do next BEFORE the reveal — law L3 — then sees what responders did and
      what the mechanism dictated), mechanisms[] (registry ids, ≥2 per case,
      all already taught by 090–120), officialUrl }
- [ ] 4 cases:
      · **S3, Feb 2017** — a typo'd capacity removal takes out the index
        subsystem; restart-at-scale takes hours (and the status page ran on S3)
      · **GitHub, Oct 2018** — 43 seconds of partition → split-brain MySQL →
        a day of reconciliation; the fencing/ordering case
      · **Cloudflare, Jul 2019** — one regex backtracks → global CPU
        exhaustion; the blast-radius case
      · **Roblox, Oct 2021** — 73-hour Consul outage; the metastable case
        (pairs with boss #4 and the Retry Storm toy)
- [ ] Every case ends with a plain-language post-mortem recap (law L4), a
      deep link from each mechanism to its toy/section, and the OFFICIAL
      public postmortem link — the game's telling is a trailer, not a
      substitute
- [ ] Completions file into the Scar Journal on a new **"Industry scars"**
      shelf; the pre-interview briefing can cite them ("I'd add a fencing
      token — this is the GitHub 2018 failure mode")
- [ ] On-Call's "This Actually Happened" cards (060) now also deep-link to
      the matching case file where one exists
- [ ] Routing `/cases/:caseId` per ADR 0004; header placement decided by the
      six-mode cap (a Journal or Review tab is the reversible fallback)
- [ ] e2e + screenshot review at desktop and 380px

## Context (read this, not the whole repo)
- **Read**: product-spec §3.10; the scripted frame player from spec 050
  (`src/modes/review/`) is the intended renderer — reuse it, don't fork it;
  the dashboard panels from spec 110 are the intended "what you'd have seen"
  visuals inside phases.
- **Touch**: new `src/content/cases.tsx`, new `src/modes/cases/` (or tab —
  see routing box), `src/state/scars.ts` (industry shelf),
  `docs/content-pipeline.md` §12, `tests/schema.test.ts`, e2e.
- **Inherited constraints**: facts come ONLY from the official public
  postmortems — dramatize pacing, never invent internal details; each case
  carries `simplifies` fine print saying what got compressed; law L2 means
  each case's opening phase briefs its vocabulary; misses (wrong decision
  picks) land in the Scar Journal like any other miss.
