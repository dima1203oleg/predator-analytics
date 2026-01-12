FROM ubuntu:22.04

# Avoid prompts from apt
ENV DEBIAN_FRONTEND=noninteractive

# Install common tools and Python
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    git \
    curl \
    wget \
    build-essential \
    libpq-dev \
    postgresql-client \
    htop \
    ncdu \
    tmux \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Set python3 as default python
RUN ln -s /usr/bin/python3 /usr/bin/python

# Install Python tools
RUN pip3 install --no-cache-dir \
    black \
    pylint \
    pytest \
    ipython \
    rich \
    httpx

# Set working directory
WORKDIR /workspace
