# 🧠 Multi-Agent Debate — Defender / Innovator / Judge

This repo has a GitHub Actions workflow that runs a multi-agent PR review using the Gemini CLI action.

Location: `.github/workflows/multi-agent-debate.yml`

## What it does
- Runs 3 agents when a Pull Request is opened, updated, or re-opened:
  - Defender — focuses on security, secrets, networking, RBAC, reliability, and per-cluster cost concerns
  - Innovator — focuses on performance, developer experience, CI/CD improvements and feature design
  - Judge — short summary synthesizing both agents' comments into MUST-FIX / NICE-TO-HAVE lists
- Agents analyze the real PR diff and post comments back to the PR (this runs on real code, not simulated).

## Required secrets and variables
Set these in GitHub: Settings → Secrets and variables → Actions

Secrets

Repository variables (recommended)
 - `AI_ISSUE_ASSIGNEES` — optional comma-separated list of GitHub usernames to assign created issues to (e.g. "alice,bob").
 - `AI_ISSUE_LABEL_PREFIX` — optional prefix for created labels (default prefix is `AI`, so labels become `AI-CRITICAL` and `AI-HIGH`).

If you do NOT use Workload Identity, ensure `GEMINI_API_KEY` is present and leave WIF variables blank.

## Cluster-aware behavior (Predator v18.2)
The agents are aware of three environment profiles and will try to prioritize recommendations based on which environment path is affected in the PR:

## Per-environment analysis

The JSON must be valid and use this format exactly (example):
```json
{
  "env": "macbook",
  "severity": "CRITICAL",
  "items": [
    { "id": 1, "severity": "CRITICAL", "title": "Secret exposed in yaml", "fix": "Move secret to GitHub secret + reference via valueFrom" }
  ]
}
```

If any per-environment Defender analysis finds an issue with severity that meets or exceeds `AI_BLOCK_THRESHOLD`, that environment job will fail and the env-analysis matrix is configured fail-fast — the workflow will stop further environment analyses quickly. When severity is HIGH or CRITICAL the workflow will automatically open an issue titled like:
1. Create a test pull request or push a branch with a small change that touches `environments/macbook` (or nvidia/oracle) to trigger cluster-specific analysis.
2. Or run manually from Actions → Multi-Agent Debate → Run workflow (workflow_dispatch).
3. Check the PR for comments from Defender, Innovator and Judge.

## Workflow linting

The workflow also runs a linter job (Super-Linter) to validate `.github/workflows` YAML files and catch syntax or workflow issues early. Add the workflow to your CI checks to fail PRs that introduce broken workflow YAML.

## Fail-fast and automatic issue creation on CRITICAL

If any per-environment Defender analysis finds a CRITICAL issue, that environment job will fail and the env-analysis matrix is configured fail-fast — the workflow will stop further environment analyses quickly. When CRITICAL or HIGH is detected the workflow will also automatically open an issue titled like:

`AI Defender CRITICAL — PR #<N> (macbook|nvidia|oracle|global)` (for CRITICAL) or `AI Defender HIGH — PR #<N> (macbook|nvidia|oracle|global)` (for HIGH).

This gives an obvious triage item so you can track the problem separately from the PR discussion; labels are applied (`AI-CRITICAL`/`AI-HIGH` by default) and assignees added if `AI_ISSUE_ASSIGNEES` is configured in repository variables.

## Blocking on CRITICAL severity

The workflow includes a small evaluator that scans PR comments for the special severity marker `<!-- AI_REVIEW_SEVERITY: <LEVEL> -->` and will fail the workflow when `LEVEL` is `CRITICAL`.

If you want merging to be blocked for `CRITICAL` findings, add this workflow as a required status check in your branch protection rules — the evaluator will make the workflow fail (and thus prevent the merge) when Defender posts a CRITICAL marker.

## Example outputs
- Defender comment: short list of direct risks (secrets, ports, oversized resources) with severity and fixes.
- Innovator comment: suggestions for performance/CI improvements with concrete examples.
- Judge comment: short two-block summary (MUST FIX BEFORE MERGE / NICE TO HAVE).

## Troubleshooting
- The action needs access to `id-token` if using WIF. Ensure job permissions include `id-token: write`.
- If the action doesn't post comments, verify `GEMINI_API_KEY` and that the action can authenticate.

---
If you'd like, I can also adapt the workflow to run separate analyses for each environment in parallel, or add stricter checks (fail PR if Defender finds a high-severity security issue).