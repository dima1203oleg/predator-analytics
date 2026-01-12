#!/usr/bin/env bash
# Update helm values with new image digest and create a PR using GH CLI
# Usage: commit-helm-values-pr.sh <chart-path> <image-key> <repository> <digest> [tag]

set -euo pipefail

CHART_PATH=${1:-helm/predator-umbrella}
IMAGE_KEY=${2:-backend.image}
REPOSITORY=${3:-ghcr.io/your-org/predator-backend}
DIGEST=${4:-}
TAG=${5:-latest}

# Optional: support multiple image updates in a single call
shift 5 || true
EXTRA_ARGS=(${@:-})

if [[ -z "$DIGEST" && -z "$TAG" ]]; then
  echo "Either a digest or tag must be provided" >&2
  exit 1
fi

VALUES_FILE="$CHART_PATH/values.yaml"

# Install yq if missing
if ! command -v yq >/dev/null 2>&1; then
  echo "Installing yq..."
  sudo wget https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64 -O /usr/bin/yq || true
  sudo chmod +x /usr/bin/yq || true
fi

# Update repository
REPO_FIELD="${IMAGE_KEY%.*}.image.repository"
DIGEST_FIELD="${IMAGE_KEY%.*}.image.digest"
TAG_FIELD="${IMAGE_KEY%.*}.image.tag"

echo "Updating $VALUES_FILE with repository=$REPOSITORY"
yq e ".$(echo $REPO_FIELD | sed 's/\./\./g') = \"$REPOSITORY\"" -i "$VALUES_FILE" || true

if [[ -n "$DIGEST" ]]; then
  echo "Setting digest: $DIGEST"
  yq e ".$(echo $DIGEST_FIELD | sed 's/\./\./g') = \"$DIGEST\"" -i "$VALUES_FILE" || true
  # remove tag if digest set
  yq e "del(.${TAG_FIELD})" -i "$VALUES_FILE" || true
else
  echo "Setting tag: $TAG"
  yq e ".$(echo $TAG_FIELD | sed 's/\./\./g') = \"$TAG\"" -i "$VALUES_FILE" || true
fi

# Update extra images if provided in the form <image_key>=<digest or tag>
for a in "${EXTRA_ARGS[@]}"; do
  if [[ "$a" =~ .+=.+ ]]; then
    AKI=${a%%=*}
    AV=${a#*=}
    ADIGFIELD="${AKI%.*}.image.digest"
    ATAGFIELD="${AKI%.*}.image.tag"
    if [[ "$AV" == sha256:* || "$AV" == @sha256:* || "$AV" == *:sha256* ]]; then
      # normalize digest
      AV_CLEAN=$(echo "$AV" | sed 's/^@//')
      yq e ".${ADIGFIELD} = \"$AV_CLEAN\"" -i "$VALUES_FILE" || true
      yq e "del(.${ATAGFIELD})" -i "$VALUES_FILE" || true
    else
      yq e ".${ATAGFIELD} = \"$AV\"" -i "$VALUES_FILE" || true
      yq e "del(.${ADIGFIELD})" -i "$VALUES_FILE" || true
    fi
  fi
done

# Commit and push
BRANCH=update-images-${GITHUB_RUN_NUMBER:-manual}-$RANDOM

git config user.name "github-actions"
git config user.email "actions@github.com"

git checkout -b "$BRANCH"

git add "$VALUES_FILE"
if git commit -m "chore(images): update $IMAGE_KEY to $DIGEST"; then
  if git push --set-upstream origin "$BRANCH"; then
    if ! command -v gh >/dev/null 2>&1; then
      echo "Installing gh..."
      curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg || true
      sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg || true
      echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null || true
      sudo apt update && sudo apt install -y gh || true
    fi
    echo "Creating PR..."
    gh pr create --title "chore(images): update $IMAGE_KEY to $DIGEST" --body "Automated image update for $IMAGE_KEY" || true
  else
    echo "Push failed; ensure GITHUB_TOKEN or ssh key available."
  fi
else
  echo "No changes to commit"
fi
