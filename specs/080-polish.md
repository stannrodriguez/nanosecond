# 080 — Polish pass
- [ ] Onboarding: 90-second guided first run (1 drill + 1 mini flaw puzzle +
      1 predict round) that orders the suggested path from results
- [ ] Cross-mode deep links from every post-mortem to the relevant toy/manual section
- [ ] Juice: subtle audio behind mute toggle (traffic tick, saturation alarm,
      FLAWLESS chord); 100–150ms ease on bar transitions
- [ ] Reduced-motion + keyboard audit; 380px audit on all screens
- [ ] README screenshots + "how this game thinks" section

## Context (read this, not the whole repo)
- **Read**: the acceptance boxes above are self-contained; product-spec §4
  (the interlock) for which cross-mode deep links matter most.
- **Touch**: onboarding = new route + `src/state/progress.ts`; deep links =
  concept registry lookups (`src/content/concepts.ts` — post-mortems already
  know their toy/manual ids through it); audio behind a mute toggle in the
  header; `src/index.css` (reduced-motion, focus); README.
- **Verification emphasis**: this spec is mostly visual — lean on
  `scripts/shots-changed.mjs` and review every shot it flags at desktop AND
  380px; the 380px audit means walking ALL screens, not just lab.
