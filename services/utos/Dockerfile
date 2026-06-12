FROM mcr.microsoft.com/playwright/python:v1.42.0-jammy

WORKDIR /app

# Install Python dependencies
COPY services/utos/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY services/utos /app/utos

ENV PYTHONPATH=/app
ENV HOST=0.0.0.0
ENV PORT=8003

EXPOSE 8003

CMD ["uvicorn", "utos.main:app", "--host", "0.0.0.0", "--port", "8003"]
