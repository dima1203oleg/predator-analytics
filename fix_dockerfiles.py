import os
import glob

# Standard Python services
simple_services = [
    'services/ai-explainability-service/Dockerfile',
    'services/api-gateway-service/Dockerfile',
    'services/autonomous-agents/Dockerfile',
    'services/graph-service/Dockerfile',
    'services/mock-data-generator/Dockerfile',
    'services/risk-engine-service/Dockerfile'
]

template = """# Builder stage
FROM python:3.12-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Final stage
FROM python:3.12-slim

# Create non-root user (HR-05)
RUN groupadd -r predator && useradd -r -g predator predator

WORKDIR /app

# Copy installed packages
COPY --from=builder /root/.local /home/predator/.local
ENV PATH=/home/predator/.local/bin:$PATH

# Copy app code
COPY --chown=predator:predator . .

USER predator
"""

for path in simple_services:
    if os.path.exists(path):
        with open(path, 'r') as f:
            lines = f.readlines()
        
        # Extract CMD or ENTRYPOINT
        cmd_lines = [l for l in lines if l.startswith('CMD ') or l.startswith('ENTRYPOINT ')]
        cmd_line = cmd_lines[0] if cmd_lines else 'CMD ["python", "main.py"]\n'
        
        with open(path, 'w') as f:
            f.write(template)
            f.write(cmd_line)
            
print("Fixed simple services.")
