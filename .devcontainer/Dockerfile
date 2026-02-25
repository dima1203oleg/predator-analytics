FROM mcr.microsoft.com/vscode/devcontainers/python:3.12-bullseye

# ── System Dependencies ────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    jq \
    make \
    build-essential \
    libpq-dev \
    redis-tools \
    postgresql-client \
    iputils-ping \
    netcat-openbsd \
    htop \
    && rm -rf /var/lib/apt/lists/*

# ── Node.js 20 ────────────────────────────────────────────────────────────
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g pnpm typescript tsx

# ── kubectl + Helm ────────────────────────────────────────────────────────
RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" \
    && install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl \
    && curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# ── Python base tools ─────────────────────────────────────────────────────
RUN pip install --upgrade pip \
    && pip install \
    black \
    isort \
    pylint \
    mypy \
    pytest \
    httpie \
    ipython

# ── Working directory ─────────────────────────────────────────────────────
WORKDIR /workspace
