# 055 — Interrogation (Law L8)
- [ ] Framework: vague stakeholder pitch; ~10 clarifying questions (mixed value),
      each costing 0.5–1.5 of a 6-minute budget; requirements crystallize from
      answers; exactly one UNASKED crucial question fires as a mid-run trap
- [ ] Post-mortem: full question list ranked by information value, with "what each
      answer would have changed"
- [ ] 6 interrogations; template { stakeholderPitch, questions[{text, cost, reveals,
      crucial}], trapForUnasked, requirementsMatrix }

## Context (read this, not the whole repo)
- **Read**: product-spec §3.6 + law L8 (requirements are extracted, not given).
  No reference prototype exists for this mode — design from the template in
  this spec, matching the visual language of `src/modes/review/`.
- **Touch**: new `src/content/interrogations.ts` (add its template to
  content-pipeline.md as §10 in the same change), new `src/modes/interrogation/`
  or a Review tab — decide by header crowding (six modes is the cap; a
  `/review/interrogate` tab is the reversible choice), `src/state/scars.ts`
  (mode tag), `tests/schema.test.ts`, e2e.
- **Inherited constraints**: sub-content URLs per ADR 0004; every jargon word
  a `<Term>`; misses land in the Scar Journal with a one-line lesson; the
  6-minute budget is display copy, not a wall-clock timer.
