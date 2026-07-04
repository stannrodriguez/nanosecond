#!/usr/bin/env bash
# The verification layer. Spec 000 wires these package scripts.
set -euo pipefail
pnpm typecheck
pnpm test        # vitest: unit + balance suite (tests/)
pnpm e2e         # playwright: smoke + screenshots to e2e/shots/
node scripts/shots-changed.mjs   # review ONLY the shots this prints
