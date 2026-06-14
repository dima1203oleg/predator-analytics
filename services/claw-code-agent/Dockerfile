FROM python:3.12-slim

# Install system dependencies including rust for claw-code
RUN apt-get update && apt-get install -y \
    git \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Rust toolchain
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

WORKDIR /app

# Clone claw-code
RUN git clone https://github.com/ultraworkers/claw-code.git /opt/claw-code

# Alternatively, we install python dependencies for our orchestrator wrapper
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "main.py"]
