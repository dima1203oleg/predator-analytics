
#!/bin/bash
set -e

# PREDATOR ANALYTICS v45.1 - GIT OPS SYNC
# Automates the commit and push process

echo "🐙 Initializing GitOps Sync..."

# 1. Check if git is initialized
if [ ! -d ".git" ]; then
    echo "⚙️  Initializing Git repository..."
    git init
    git branch -M main
fi

# 2. Add all files
echo "➕ Adding files..."
git add .
git add .github
git add .devcontainer

# 3. Commit
echo "💾 Committing changes..."
# We use a timestamp to allow multiple consecutive runs without 'nothing to commit' error
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
git commit -m "feat(predator-v45.1): System Architecture Update $TIMESTAMP

- Implemented full Technical Specification (docs/TECHNICAL_SPECIFICATION_FINAL.md)
- Added Control Plane (GitHub Actions, Dagger)
- Added Intelligence Plane (MCP Router, RTB Engine v2.0)
- Added Autonomy Plane (SIO, Trainer, AES)
- Added Infrastructure (Helm Charts, Resource Quotas)
- $0 LLM Budget Compliance" || echo "⚠️  Nothing to commit"

# 4. Instructions
echo " "
echo "✅ Codebase committed locally."
echo " "
echo "👉 TO PUSH TO GITHUB (Run manually):"
echo "   git remote add origin <YOUR_REPO_URL>"
echo "   git push -u origin main"
echo " "
