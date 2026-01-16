FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

WORKDIR /app

# Встановлення залежностей через uv (надшвидко)
ENV UV_SYSTEM_PYTHON=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Copy requirements from service directory (Context is Root)
COPY services/constitutional-core/requirements.txt .
# COPY services/constitutional-core/pyproject.toml . # Uncomment if needed

RUN uv pip install --system --no-cache -r requirements.txt

# Copy Core Libraries
COPY libs ./libs

# Copy Application Code
COPY services/constitutional-core/app ./app
COPY infrastructure/constitution ./infrastructure/constitution

# Експортуємо порти (всі в одному)
# 8000: API
# 50051: gRPC
EXPOSE 8000 50051

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
