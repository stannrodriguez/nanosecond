# 089 — Named-technology lens (ADR 0007)

User-directed (2026-08-04): the library teaches plenty *about* Redis, Kafka, and
the rest of the kt01–kt09 product list, but no page *is* any of them — a player
prepping against a product-named checklist has nowhere to stand. ADR 0007 decides
the shape: nine product pages that are a **derived lens** over existing content,
not a fourth shelf of briefings. This spec builds it.

**Context:** ADR 0007 · `docs/coverage-map.md` §A.2 (kt01–kt09 Destination lines
are the where-it-lives source of truth) · `src/content/manual/types.ts` ·
`src/modes/manual/index.tsx` (TermsPanel/WhereThisTouches row idioms) ·
`src/content/briefings.tsx` (MEET IT data the lens reads back).

- [x] `src/content/products.tsx`: nine `Product` entries (Redis, Elasticsearch,
      Kafka, API Gateway, Cassandra, DynamoDB, PostgreSQL, Flink, ZooKeeper).
      Authored per entry: alias list, tagline, a 2–4 sentence `what` identity
      block (every jargon word a `<Term>`), a one-breath `say` line, the home
      briefing, and a where-it-lives list whose rows carry phrased reasons
      (edges.ts discipline). `liveIn[0]` is the home row.
- [x] Derived collectors in the same file: `termsFor` (glossary entries whose
      text names the product), `numbersFor` (numbers.ts entries whose id or
      derivation names it), `toysFor` (Lab toys whose MEET IT panel names it,
      with the panel's `how` clause). Word-boundary alias match; no second list
      to keep in sync.
- [x] `/manual/tech/:productId` renders the product page: identity block, home
      briefing card, WHERE IT LIVES rows, IN THE LAB rows, THE NUMBERS
      (expandable: value + 3-step derivation + bounding physics), IN THE
      REFERENCE (expandable speakable rows), and a lens fine-print. Unknown or
      missing product ids degrade to the library index (ADR 0004).
- [x] Library index: a NAMED TECHNOLOGIES strip (gold accent) between the
      shelves and the Ladder card — nine chips, name + tagline, keyboard
      focusable.
- [x] Schema tests: nine unique products matching the source list; home +
      liveIn resolve to live section ids with non-empty reasons; identity
      fields authored and speakable-sized; every product's alias scan matches
      ≥1 glossary entry (alias-rot guard); the storage-heavy products surface
      ≥1 number; the big five surface ≥1 toy.
- [x] e2e: the Redis page renders its sections and screenshots; unknown
      product ids redirect to `/manual/briefings`.
- [x] verify.sh green; changed shots reviewed; baselines updated for the
      intended library-index and new-page changes.

Non-goals (ADR 0007): no new teaching prose beyond the identity block, no viz,
no say-it decks, no progress tracking, not counted in the 28-section definition
of done.
