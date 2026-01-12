# Predator Analytics v25 - Ops Bot Dockerfile
# Context: Root of the repository

FROM python:3.12-slim-bookworm

WORKDIR /app

# 1. Install System Dependencies & Ops Tools
# ffmpeg/espeak for voice features
# git/ssh/curl for operations
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    openssh-client \
    ffmpeg \
    espeak-ng \
    && rm -rf /var/lib/apt/lists/*

# 2. Install Kubernetes Tools (kubectl)
RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && \
    install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl && \
    rm kubectl

# 3. Install ArgoCD CLI
RUN curl -sSL -o argocd-linux-amd64 https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64 && \
    install -m 555 argocd-linux-amd64 /usr/local/bin/argocd && \
    rm argocd-linux-amd64

# 4. Install MinIO Client (mc)
RUN curl https://dl.min.io/client/mc/release/linux-amd64/mc \
    --create-dirs -o /usr/local/bin/mc && \
    chmod +x /usr/local/bin/mc

# 5. Install Trivy (Security Scanner)
RUN curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin

# 6. Python Dependencies
COPY apps/telegram-bot/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 7. Copy Application Code
# Bringing in the shared libs is crucial for integration
COPY libs /app/libs
# Copy bot specific code
COPY apps/telegram-bot/bot /app/bot
# Copy config/project files if they exist in root of apps/telegram-bot
# Note: In previous check, config.py was inside bot/
# If there are files in apps/telegram-bot root, copy them:
# COPY apps/telegram-bot/*.py /app/  <-- cannot use wildcard easily for specific files in root context copy
# Assuming main entry is bot/main.py

ENV PYTHONPATH=/app
ENV TERM=xterm-256color

# Run as module to ensure imports work correctly relative to /app
CMD ["python", "-m", "bot.main"]
