FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y \
    software-properties-common \
    curl \
    git \
    build-essential \
    jq \
    vim \
    tmux \
    zsh \
    unzip \
    wget \
    ca-certificates \
    gnupg \
    && add-apt-repository ppa:deadsnakes/ppa -y \
    && apt-get update && apt-get install -y \
    python3.12 \
    python3.12-dev \
    python3.12-venv \
    && curl -sS https://bootstrap.pypa.io/get-pip.py | python3.12

RUN wget https://nodejs.org/dist/v20.15.0/node-v20.15.0-linux-x64.tar.xz \
    && tar -xJf node-v20.15.0-linux-x64.tar.xz -C /usr/local --strip-components=1 \
    && rm node-v20.15.0-linux-x64.tar.xz \
    && npm install -g pnpm

RUN python3.12 -m pip install poetry

RUN curl -LO "https://dl.k8s.io/release/v1.31.0/bin/linux/amd64/kubectl" \
    && install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

RUN curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

RUN wget https://releases.hashicorp.com/terraform/1.9.5/terraform_1.9.5_linux_amd64.zip \
    && unzip terraform_1.9.5_linux_amd64.zip \
    && mv terraform /usr/local/bin/ \
    && rm terraform_1.9.5_linux_amd64.zip

RUN curl -L https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64 -o /usr/local/bin/yq \
    && chmod +x /usr/local/bin/yq

RUN apt-get install -y docker.io

RUN useradd -m -u 1000 devuser && chsh -s /bin/zsh devuser
WORKDIR /workspaces
USER devuser

CMD ["sleep", "infinity"]
