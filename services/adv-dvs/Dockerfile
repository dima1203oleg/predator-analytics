# Dockerfile for ADV-DVS service
# Multi-stage build using Python 3.12 slim
FROM python:3.12-slim AS base

# Set working directory
WORKDIR /app

# Copy source code
COPY services/adv-dvs/ /app/

# Install Python dependencies if a requirements.txt exists
RUN if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; else echo "No requirements.txt, skipping"; fi

# Use a non-root user for security
RUN useradd -m appuser && chown -R appuser /app
USER appuser

# Default command runs the validator (can be overridden)
CMD ["python", "validator.py"]
