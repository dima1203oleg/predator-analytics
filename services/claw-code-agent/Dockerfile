# Builder stage
FROM python:3.12-slim AS builder

RUN apt-get update && apt-get install -y git curl build-essential && rm -rf /var/lib/apt/lists/*
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

WORKDIR /app
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt
RUN git clone https://github.com/ultraworkers/claw-code.git /opt/claw-code

# Final stage
FROM python:3.12-slim

RUN groupadd -r predator && useradd -r -g predator predator
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /root/.local /home/predator/.local
COPY --from=builder --chown=predator:predator /opt/claw-code /opt/claw-code
ENV PATH=/home/predator/.local/bin:$PATH

COPY --chown=predator:predator . .

USER predator
CMD ["python", "main.py"]
