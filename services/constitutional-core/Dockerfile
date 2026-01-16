FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

WORKDIR /app

# Встановлення залежностей через uv (надшвидко)
ENV UV_SYSTEM_PYTHON=1
ENV PYTHONUNBUFFERED=1

COPY pyproject.toml .
# Якщо немає pyproject.toml, використовуємо requirements
COPY requirements.txt .
RUN uv pip install --system --no-cache -r requirements.txt

# Копіюємо код
COPY . .

# Експортуємо порти (всі в одному)
# 8000: API
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
