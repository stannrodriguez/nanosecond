# AGENTS.md

Project instructions live in [CLAUDE.md](CLAUDE.md).

## Deploy

Automatic git deploys are off, including PR preview deploys and production deploys on merge or push to `main` (`vercel.json` sets `git.deploymentEnabled: false`). Production deploys go through `vercel deploy --prod` (or `vercel --prod`) from `main` after a batch of work is merged, or once for an urgent one-off fix. Do not deploy from an agent session.
