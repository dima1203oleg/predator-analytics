# Branch protection & required checks — operator guide

This document explains how to make `check-actionlint` a required status check and tighten branch protection for `main` and `autofix/staging`.

Note: On some repository plans (private repositories on older plans) the branch-protection API may be limited and return 403. If you see "Upgrade to GitHub Pro or make this repository public to enable this feature" you must either: upgrade the plan or configure protections via the GitHub UI manually.

## Recommended protection settings
- Protect `main` and `autofix/staging` branches
- Require pull request reviews before merging (1+ reviewers)
- Require status checks to pass before merging and include these checks:
  - `Validate GitHub Actions (actionlint)` (workflow `check-actionlint.yml` job)
  - Any other required CI jobs you rely on (lint, tests, e2e)
- Require up-to-date branches (optional)
- Disallow force pushes

## Example GH CLI commands (use as admin)
> The commands below assume you have `gh` auth with a user that has admin rights.

1) To add `check-actionlint` as a required check for `main` (example):

```bash
# Note: replace OWNER and REPO with your repository details
OWNER=dima1203oleg
REPO=predator-analytics
BRANCH=main

# Configure branch protection via REST API using 'gh api'
# This example turns on required status checks and sets the contexts to the check's name
gh api --method PUT \
  -H "Accept: application/vnd.github+json" \
  /repos/$OWNER/$REPO/branches/$BRANCH/protection \
  -f required_status_checks.strict=true \
  -f required_status_checks.contexts='["Validate GitHub Actions (actionlint)"]' \
  -f enforce_admins=true \
  -f required_pull_request_reviews.dismiss_stale_reviews=true \
  -f required_pull_request_reviews.required_approving_review_count=1 \
  -f restrictions='null' \
  -f allow_force_pushes=false
```

2) If the repository API returns a 403/plan error, do this via the GitHub web UI: Settings → Branches → Branch protection rules → Add rule → follow the recommended settings above.

## How to enable after upgrading or getting admin access
- If you grant org/repo admin scope for a personal access token or run `gh auth login` as an admin user in the runner, the above `gh api` command will succeed.
- If you'd like, I can run these commands for you after you confirm upgrade/admin privileges.

## ALLOW_AUTO_MERGE repo variable
We've created a repository variable named `ALLOW_AUTO_MERGE` set to `false` by default. To enable automated merging by the autofix loop, set the variable to `true` using:

```bash
# set to true (admin required)
gh api -X PATCH /repos/$OWNER/$REPO/actions/variables -f name='ALLOW_AUTO_MERGE' -f value='true'
```

## Next steps
- Decide whether to make `check-actionlint` a required status check for `main` and `autofix/staging`.
- Optionally allow auto-merge by setting `ALLOW_AUTO_MERGE=true` (careful — only after you trust the autofix results and add required checks).
- Let me know if you want me to run the admin commands (I can, after you confirm or provide a token / enable the repository features).
