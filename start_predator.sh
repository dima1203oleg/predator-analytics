
#!/bin/bash
set -e

# PREDATOR ANALYTICS v25.1 - AUTO START
# Builds base image and helps deploy locally (simulation)

echo "🚀 Starting Predator Analytics v25.1 Deployment Sequence"

# 1. Build Base Image
echo "📦 Building Base Docker Image (Predator Core)..."
docker build -t predator-core:25.1 -f Dockerfile.base .

# 2. Tag Images for Local K8s (Simulating separate service builds)
# Since we use a monorepo structure with shared code in the container,
# we can use the same image for different services, just changing the CMD.
SERVICES=(
    "mcp-router"
    "rtb-engine" 
    "sio-controller" 
    "training-controller"
    "aes"
)

for svc in "${SERVICES[@]}"; do
    echo "🏷️  Tagging predator-core as ghcr.io/predator-analytics/$svc:latest"
    docker tag predator-core:25.1 ghcr.io/predator-analytics/$svc:latest
    # In a real cluster (kind/minikube), we'd push or load here.
    # docker push ghcr.io/predator-analytics/$svc:latest
done

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

