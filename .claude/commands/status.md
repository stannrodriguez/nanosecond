---
description: One-screen project status — no exploration
---

Report status from these sources ONLY (no repo exploration):

1. `specs/README.md` — the queue table: what's done, what's next.
2. `git log --oneline -10` and `git status -sb` — recent work, dirty state.
3. If shots exist: `node scripts/shots-changed.mjs` — unreviewed visual drift.

Output: next spec to work on, anything blocking it (dirty tree, red verify,
unreviewed shots), and one line per remaining spec with its scope. Do not
read source files for this.
