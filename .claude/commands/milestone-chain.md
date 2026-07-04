---
description: Run the next spec, merge it, then spawn a fresh session to continue the chain
---

Session budget: $ARGUMENTS (an integer; blank or 0 = run one spec, spawn nothing).

You are one link in a self-chaining loop. Each link does ONE spec, lands it on
main, then hands off to a fresh session. Invoking this command is standing
authorization for the pushes and PR merges below.

1. Run /milestone in full: next unfinished spec in `specs/README.md`, built,
   `scripts/verify.sh` green, flagged shots reviewed, boxes checked, row
   flipped, committed on a fresh `claude/<spec>-chain` branch.
2. Push, open a PR (repo template), and MERGE it. Merging is load-bearing:
   the next link clones main fresh, so unmerged work does not exist for it.
3. Spawn a successor ONLY if ALL of these hold:
   - the merge in step 2 succeeded,
   - at least one spec remains unfinished,
   - the budget above is > 0.
   To spawn, call `mcp__Claude_Code_Remote__create_trigger` with:
   - `create_new_session_on_fire: true`
   - `run_once_at`: ~2 minutes from now (one-shot; it self-disables)
   - `notifications: { push: true }`
   - `name`: `milestone-chain (budget <N-1>)`
   - `prompt`: `You are in the stannrodriguez/nanosecond repo. Run /milestone-chain <N-1>`
   Never create more than one trigger, and never use a cron expression.
4. If you did NOT spawn, end with a summary saying why (queue done / verify
   red / budget exhausted / merge failed). If verify cannot be made green,
   do not merge and do not spawn — leave the branch pushed and report where
   you are stuck.

The chain's hard ceiling is the budget the human typed; respect it even if
the queue has more specs.
