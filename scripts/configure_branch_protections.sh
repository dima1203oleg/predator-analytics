#!/usr/bin/env bash
# Helper script to configure branch protection using GH CLI / REST API
# Usage: ./scripts/configure_branch_protections.sh <owner> <repo> <branch>
# Requires: gh CLI with admin rights

set -euo pipefail
OWNER=${1:-}
REPO=${2:-}
BRANCH=${3:-main}

if [ -z "$OWNER" ] || [ -z "$REPO" ]; then
  echo "Usage: $0 <owner> <repo> <branch>"
  exit 2
fi

echo "Configuring branch protection for $OWNER/$REPO on branch $BRANCH"

PAYLOAD=$(cat <<JSON
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["Validate GitHub Actions (actionlint)"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "allow_force_pushes": false
}
JSON
)

echo "$PAYLOAD" | gh api --method PUT /repos/${OWNER}/${REPO}/branches/${BRANCH}/protection -H "Accept: application/vnd.github+json" -f body@- || {
  echo "Failed to configure branch protection via API — this may be due to repository plan or permissions."
  echo "If you see a 403, either upgrade your plan, or configure protection manually in GitHub UI (Settings → Branches)."
  exit 1
}

echo "Protection configured (or API succeeded)."
