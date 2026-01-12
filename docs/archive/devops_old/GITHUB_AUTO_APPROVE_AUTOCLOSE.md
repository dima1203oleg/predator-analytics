# GitHub automation: auto-approve PRs and auto-close issues

This project includes two safe, opt-in automation workflows that help streamline routine maintenance tasks while keeping security restrictions in place.

Files added:

- `.github/workflows/auto-approve-prs.yml` — auto-approve and optionally auto-merge pull requests

- `.github/workflows/auto-close-issues.yml` — automatically close issues when labeled `autoclose`

Key safety rules (defaults):

- Auto-approve PRs only when:
  - PR author is Dependabot (dependabot[bot] or dependabot-preview[bot]) OR
  - PR has label `auto-approve` or `automerge`.

- Auto-merge only when PR contains the `automerge` label.

- Auto-close issues only when issue receives `autoclose` label.

Why this is safe:

- We limit automation to trusted sources (Dependabot) or explicit label from maintainers.

- Merges only happen when explicitly labeled as automerge — maintainers still control approvals via labels.

Configuring or disabling:

- To change label names or trusted authors open the workflow file and adjust the logic in the `Check if PR is eligible for auto-approve` step (for PRs) or the label check for issues.

- To fully disable these automations, remove or rename the corresponding workflow files under `.github/workflows` or restrict triggers.

How to use:

- To auto-approve a PR from a maintainer, add the label `auto-approve` to the PR and the workflow will approve it.

- To request both approve + merge, add `automerge` label.

- To request an issue be closed automatically, add `autoclose` label to the issue.

Permissions:

- Workflows use the repository `GITHUB_TOKEN` and request the minimum permissions required:
  - `pull-requests: write` for PR approval and merges
  - `issues: write` for issue updates

Notes & tips:

- Be careful granting repository write permissions to automation; keep trusted authors and labels minimal.

- If you want to permit more authors (e.g., specific team members), add them to the `allowedAuthors` list in the workflow or configure a label-based flow.
