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
- `GEMINI_API_KEY` — API key for Gemini CLI (used by the action)

Repository variables (recommended)
- `GEMINI_CLI_VERSION` — version of `run-gemini-cli` action (e.g. `v0.3.0`) or a pinned tag
- `GCP_WIF_PROVIDER` — Workload Identity Provider (if using WIF)
- `GOOGLE_CLOUD_PROJECT` — GCP project id used by WIF
- `GOOGLE_CLOUD_LOCATION` — region (if required)
- `SERVICE_ACCOUNT_EMAIL` — service account email for WIF (if used)
- `GOOGLE_GENAI_USE_VERTEXAI` — `true`/`false` (optional)
- `GOOGLE_GENAI_USE_GCA` — `true`/`false` (optional)

If you do NOT use Workload Identity, ensure `GEMINI_API_KEY` is present and leave WIF variables blank.

## Cluster-aware behavior (Predator v18.2)
The agents are aware of three environment profiles and will try to prioritize recommendations based on which environment path is affected in the PR:
- macbook: dev, limited CPU/memory, single-node. Recommendations: small requests, replicas=1, avoid large images and heavy probes.
- nvidia: GPU cluster. Recommendations: respect nodeSelector/tolerations for GPU nodes, use GPU resource requests/limits, watch cost and GPU quota.
- oracle: cloud free-tier/minimal. Recommendations: avoid large PVs, avoid autoscaling that might exceed free capacity, watch networking/egress costs.

## Testing the workflow
1. Create a test pull request or push a branch with a small change that touches `environments/macbook` (or nvidia/oracle) to trigger cluster-specific analysis.
2. Or run manually from Actions → Multi-Agent Debate → Run workflow (workflow_dispatch).
3. Check the PR for comments from Defender, Innovator and Judge.

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