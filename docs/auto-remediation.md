# Automated remediation & continuous improvement loop

This project implements an automated continuous improvement loop that attempts to fix failing CI/workflow problems with minimal human intervention. The goal is to run safetly and iteratively until all checks pass.

High-level flow:

- AI Studio pushes changes into repo via `ai-sync/*` branches (or you push manually) → `ai-sync-ci` runs and attempts auto-fixes and builds.
- If a workflow run fails, the `AI Autofix Loop` workflow attempts local auto-fixes (linters / formatters) and pushes them back; if not possible, it creates an issue and requests AI remediation comments. The AI agent posts suggested fixes inside this issue.
- The `Push to AI Studio` workflow packages changes in `main` into an artifact (or uploads to an AI Studio endpoint if configured) so AI Studio can pull the latest repo state — enabling two-way loops between VS Code / repo and AI Studio.

Important settings / secrets:

- `GEMINI_API_KEY` — required for AI remediation agents.
- `AI_STUDIO_UPLOAD_ENDPOINT` & `AI_STUDIO_UPLOAD_TOKEN` — optional: endpoint and token to allow GitHub to push packaged repo contents to AI Studio or another service.
- `ARGOCD_SERVER` & `ARGOCD_TOKEN` — if set, deploy workflow will call the ArgoCD API to trigger app syncs after merges.

Safety notes:

- The autofix loop tries automated repairs first (lint/format) and only creates issues + AI suggestions if that doesn't resolve the problem.
- No automatic destructive changes will be pushed without PRs in most cases — auto-fixes create dedicated branches and PRs. Automerge is optional and must be enabled in the `ai-sync-ci` workflow or branch protection rules.

If you'd like, I can make the autofix loop more aggressive (attempt to automatically apply AI patches without human review) — but I recommend keeping a human gate for production branches.
