# 068 — Terms on the briefing page (networking pilot)

Course-correction after 065 shipped: the Networking glossary group landed in
the Reference shelf, but the user's plan is to FILL OUT THE BRIEFING PAGES —
a player studying networking should see its terms on
`/manual/briefings/networking`, not have to leave for Reference. This slice
adds a generic terms panel to the briefing template and adopts it on the
networking briefing only. (The Say-it practice cards are 066/067, queued
right after this — 067 already mounts them at the bottom of this same page.)

- [ ] `ManualSection` gains optional `termShelf`: the id of a glossary group;
      when set, the briefing page renders a **THE TERMS** panel (after the
      viz + body, before related/feltIn) listing that group's entries
- [ ] Panel row per entry: term name + its `say` sentence always visible;
      expanding a row reveals `def`, `reachFor`, and `trap` (labeled in the
      same voice as Reference). Entries without speakable fields fall back to
      `def` only
- [ ] Networking briefing sets `termShelf` to the Networking group — all 13
      entries (8 new + 5 re-homed strays) appear on the page
- [ ] The mechanism is generic: any briefing can adopt it as its page gets
      filled out, but ONLY networking adopts in this slice
- [ ] Schema test: `termShelf`, when present, resolves to an existing
      glossary group id
- [ ] Rows are keyboard-expandable with visible focus; panel works at 380px;
      prefers-reduced-motion respected on expand/collapse
- [ ] e2e covers the panel (present on networking, absent elsewhere, one row
      expands); screenshots reviewed per autonomy rule 3; verify.sh green

## Context (read this, not the whole repo)
- **Read**: `src/content/manual/types.ts` (ManualSection); the networking
  section in `src/content/manual/concepts.tsx`; `src/content/glossary.ts`
  group list + one Networking entry (065's output — speakable fields exist);
  the briefing page component in `src/modes/manual/index.tsx`.
- **Touch**: `src/content/manual/types.ts`, `src/content/manual/concepts.tsx`
  (one field on one section), `src/modes/manual/` (panel component),
  `tests/schema.test.ts`, e2e + baseline shots.
- **Look**: quiet — the viz stays the star of the page. Collapsed rows are a
  compact list (mono term name, dim say-sentence), C.net accent, matching the
  briefing's existing panel styling.
- **Scope guard**: no glossary content changes (065 wrote the entries); no
  other briefings adopt yet; don't move or remove the Reference shelf — the
  panel is a second surface for the same entries, not a relocation.
