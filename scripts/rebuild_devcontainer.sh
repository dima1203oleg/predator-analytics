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

# Note: This build command prepares the image. 
# Re-running the container with "up" or similar might be needed depending on usage.
echo "🚀 Environment is ready for rebuild/reopen."
