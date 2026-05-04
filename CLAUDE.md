@AGENTS.md

# Project: Pixiv Novel Reader

## Git Workflow

- Never push directly to `main`. Always create a feature branch and open a PR.
- Use `gh pr create` to create PRs, then `gh pr merge --merge` after review.
- Branch naming: `feat/<short-description>`, `fix/<short-description>`

## Deployment

- Vercel auto-deploys from `main` on merge.
- Always verify the build passes (`npx next build`) before creating a PR.

## Stack

- Next.js (App Router), React, TypeScript, Tailwind CSS
- API routes: `/api/novel`, `/api/tag`, `/api/translate`
- Pixiv API via PHPSESSID, Caiyun translation API
