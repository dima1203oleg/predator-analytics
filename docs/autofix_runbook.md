# Autofix automation — runbook & checklist

This runbook helps operators enable the autofix automation safely — from a disabled automerge state to fully automatic remediation in production, while keeping safeguards in place.

Quick summary:
- `autofix/staging` is the quarantine branch where autofix PRs are opened.
- `ALLOW_AUTO_MERGE` repository variable gates whether the loop is allowed to enable automerge.
- `check-actionlint.yml` must pass and be required in branch protection before enabling automerge.

Steps to enable automated autofix safely
1. Ensure CI is healthy
   - Confirm `check-actionlint.yml` and other essential checks pass on `main`.
2. Configure branch protections for `main` and `autofix/staging` (admin only)
   - Require PR reviews, require status checks including 'Validate GitHub Actions (actionlint)', and disallow force pushes.
   - See `docs/branch-protection.md` for GH-CLI examples or use the repo Settings → Branches UI.
3. Add reviewers / owners
   - Ensure `.github/CODEOWNERS` is present and has the appropriate reviewers for `environments/` and `.github/workflows/` so autofix PRs will be automatically requested for review.
4. Test E2E in a safe environment
   - Use `.github/workflows/autofix-end-to-end-test.yml` with `simulate_patch=true` to simulate destructive patches and validate protections.
5. Enable automerge when ready
   - Set repo variable `ALLOW_AUTO_MERGE=true` only after step 1-4 are green.
   - Monitor the first few merges carefully.

Rollback plan and mitigation
- If the autofix loop causes unwanted changes, revert the PR and disable `ALLOW_AUTO_MERGE` immediately.
- Use GitHub's audit logs / actions logs to identify which run created the PR and which model (if applicable) produced the diff.

Monitoring and alerts
- Optional Slack webhook: set `secrets.SLACK_WEBHOOK` so `ai-autofix-loop.yml` sends a notification for newly created autofix PRs.
- The workflow also creates an issue when it couldn’t apply local fixes allowing human review.

Notes for admins
- Branch protection via API may require an upgraded plan or appropriate admin privileges. If the API returns 403, use the Settings → Branches UI or upgrade the repository plan.
