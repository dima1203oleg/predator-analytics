#!/bin/bash
# Script to rebuild the Dev Container using the @devcontainers/cli

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)

echo "🔄 Starting Dev Container rebuild..."
echo "📂 Project root: $REPO_ROOT"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Run devcontainer build using npx to avoid global installation issues
echo "🛠️ Running devcontainer build..."
npx -y @devcontainers/cli build --workspace-folder "$REPO_ROOT"

if [ $? -eq 0 ]; then
    echo "✅ Dev Container build successful!"
else
    echo "❌ Dev Container build failed."
    exit 1
fi

# Re-open (ensure container is up and running)
echo "🚀 Starting/Refreshing Dev Container (Reopen)..."
npx -y @devcontainers/cli up --workspace-folder "$REPO_ROOT"

if [ $? -eq 0 ]; then
    echo "✅ Dev Container is UP and ready for attachment."
else
    echo "❌ Failed to start Dev Container."
    exit 1
fi

echo "✨ Environment is fully prepared."
