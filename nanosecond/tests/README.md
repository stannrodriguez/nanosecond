# tests/ — the verification layer (non-negotiable)
Two suites live here:
1. **Balance suite** — executable assertions that the game teaches TRUE things
   (see docs/architecture.md, Balance suite section). A content or engine change
   that breaks these is a content bug, not a test bug.
2. **Unit tests** — engine math + content schema validation (every component/toy has
   non-empty `simplifies`; every number has a `derivation`; every glossary key used
   by a <Term> exists).
Playwright e2e lives in e2e/ (created by spec 000).
