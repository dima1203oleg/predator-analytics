FROM mcr.microsoft.com/vscode/devcontainers/python:3.11

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Install K8s tools
RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" \
    && install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl \
    && curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Install dependencies for the project
COPY requirements.txt* requirements_v4.txt* ./
RUN if [ -f requirements.txt ]; then pip install -r requirements.txt; fi \
    && if [ -f requirements_v4.txt ]; then pip install -r requirements_v4.txt; fi

# Set up working directory
WORKDIR /workspace
