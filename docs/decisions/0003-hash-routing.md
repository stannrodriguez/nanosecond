# ADR 0003: Hash-based routing (react-router HashRouter)
Date: 2026-07-04 · Status: accepted

## Context
Spec 000 requires a routing shell. The app is a client-only SPA with no backend
(product spec §5): it must deep-link reliably from any static file host (GitHub
Pages, S3, `vite preview`, even `file://`) without server rewrite rules. History
routing (`BrowserRouter`) requires every host to rewrite unknown paths to
index.html; hash routing needs nothing.

## Decision
react-router-dom v6 with `HashRouter`. URLs look like `/#/lab`, `/#/review`.
Mode pages own their sub-state; anything that must survive reload goes in the
route hash or localStorage.

## Consequences
- Zero-config deploys anywhere; refresh and shared links always work.
- URLs carry a `#`, which is cosmetic only (no SEO concern — the game has no
  crawlable content model).
- If a backend or prettier URLs are ever wanted, swapping to `BrowserRouter`
  is a one-line change in `src/main.tsx` plus host rewrite config; route
  definitions are unaffected.
