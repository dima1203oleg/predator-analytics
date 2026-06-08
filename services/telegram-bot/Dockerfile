FROM python:3.12-slim

WORKDIR /app

# Налаштування змінного середовища
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Встановлення залежностей
COPY pyproject.toml /app/
RUN pip install --no-cache-dir -e .

# Копіювання коду
COPY app /app/app

# Створення не-root користувача (HR-05)
RUN groupadd -r predator && useradd -r -g predator predator
USER predator

CMD ["python", "-m", "app.main"]
