# ADR 0002: Spec-driven repo layout
Date: 2026-07-03 · Status: accepted

## Context
Autonomous agent development needs an unambiguous work queue and verification layer.

## Decision
docs/ for durable knowledge (product spec, architecture, ADRs, content pipeline,
reference prototypes) · specs/ for the ordered implementation queue (one numbered file
per milestone, gaps of 10 for insertions) · tests/ as the non-negotiable verification
layer · .claude/commands for reusable workflows.

## Consequences
The agent's loop is: next unchecked spec in specs/README.md → implement → verify →
check boxes → commit. The old ROADMAP.md is superseded by specs/.
