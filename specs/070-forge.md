# 070 — The Forge
- [ ] Unlock graph per product-spec §3.8; components locked in Builder + On-Call
      until forged
- [ ] 6 forge mini-challenges (one per component)
- [ ] Parts bin shows locked state with deep link to the toy

## Context (read this, not the whole repo)
- **Read**: product-spec §3.8 (the unlock graph, verbatim). The forge seams
  already exist: `TOYS[].forgeUnlocks` (content/toys.ts), the FORGED badge in
  `src/modes/lab/index.tsx`, `useProgress` (state/progress.ts), and the
  parts bin in `src/modes/manual/index.tsx`.
- **Touch**: `src/state/progress.ts` (forged-component selectors),
  `src/modes/builder/` + `src/modes/oncall/` (locked component rendering),
  `src/modes/lab/` (6 mini-challenges attach to toys), manual parts bin
  (locked state + deep link `/lab/:toyId` — routing already supports it).
- **Inherited constraints**: locked parts render greyed with "Forge this in
  the Lab" links, never hidden; unlock graph is content, not engine
  (engines never import content).
