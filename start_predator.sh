
#!/bin/bash
set -e

# PREDATOR ANALYTICS v25.1 - AUTO START
# Builds base image and helps deploy locally (simulation)

echo "🚀 Starting Predator Analytics v25.1 Deployment Sequence"

# 1. Build Base Image (Backend)
echo "📦 Building Base Backend Image..."
docker build -t predator-core:25.1 -f Dockerfile.base .

# Tag Backend Services
SERVICES=(
    "mcp-router"
    "rtb-engine" 
    "sio-controller" 
    "training-controller"
    "aes"
    "api"
)

for svc in "${SERVICES[@]}"; do
    echo "🏷️  Tagging [Backend] ghcr.io/predator-analytics/$svc:latest"
    docker tag predator-core:25.1 ghcr.io/predator-analytics/$svc:latest
done

# 2. Build UI Image
echo "📦 Building Frontend UI Image..."
# We use the existing production dockerfile
cd apps/predator-analytics-ui
docker build -t ghcr.io/predator-analytics/ui:latest -f Dockerfile.prod .
cd ../..

echo "✅ Build Complete."

# 3. Validation
echo "🔍 Validating Project Structure..."
if [ -f "docs/TECHNICAL_SPECIFICATION_FINAL.md" ]; then
    echo "✅ Spec found."
else
    echo "❌ Spec missing!"
    exit 1
fi

echo "🏁 Ready for ArgoCD Sync!"
echo "   Run: kubectl apply -f argocd/application.yaml"
