# ADR 0007: Named-technology pages — a derived lens, not a fourth shelf
Date: 2026-08-04 · Status: accepted (user-directed)

## Context
The Key Technologies shelf is deliberately organized by capability
(`relational-db`, `queues`, `distributed-caches`, …) while the source articles
are named for products (Redis, Elasticsearch, Kafka, API Gateway, Cassandra,
DynamoDB, PostgreSQL, Flink, ZooKeeper — kt01–kt09 in `docs/coverage-map.md`).
The mapping is many-to-many: Redis alone feeds eight briefings, and `nosql-db`
draws on two articles. The consequence the user hit directly: the library
teaches plenty *about* Redis, but no page *is* Redis — a player prepping
against a product-named checklist has nowhere to stand.

Two options were weighed. **Author product briefings** — nine new
three-register briefings would duplicate the capability briefings' material
(the same claims live in both shapes), fork the coverage map's claim ledger,
and permanently double the maintenance surface. **Add a derived lens** — one
authored identity block per product plus machinery that *collects* what the
library already says about it (glossary entries, numbers, Lab toys), so the
pages get richer automatically as the F2–F16 fill-out queue lands its
product-heavy claims.

## Decision
Add a **Named Technologies lens**: nine product pages at
`/manual/tech/:productId`, listed in a strip on the library index. Contract
(enforced in `tests/schema.test.ts`):

- A product entry (`src/content/products.tsx`) AUTHORS only: an identity block
  (what it is / one-breath `say` line), its **home briefing** (the primary
  destination from the coverage map), and a **where-it-lives list** — each
  briefing that carries its material, with the reason phrased (edges.ts
  discipline: a link is a claim).
- Everything else on the page is **derived by mention scan** over existing
  content — glossary entries, `numbers.ts` entries, and toy MEET IT panels
  that name the product (word-boundary alias match). No second list to keep
  in sync; fill-out specs enrich these pages for free.
- Product pages are a lens, **not briefings**: no new teaching prose beyond
  the identity block, no viz requirement, no say-it decks, not counted in the
  28-section definition of done or the read counter. Depth stays in the
  capability briefings; the lens consolidates and points.
- API Gateway is included for parity with the source list even though it is
  the one entry that is a capability, not a product — its page owns saying so.

## Consequences
- Library index gains a fourth block (strip, not shelf) between the shelves
  and the Ladder; `/manual` routing gains the `tech` tab. Unknown product ids
  degrade to the library index (ADR 0004).
- Schema tests pin the derivations: every product's home + where-it-lives
  sections resolve, and every product's alias scan matches ≥1 glossary entry —
  alias rot fails the suite instead of silently emptying a page.
- If a future spec wants per-product *teaching* content, that is a new
  decision (it reopens the duplicate-the-ledger cost this ADR declined).
