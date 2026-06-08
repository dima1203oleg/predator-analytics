FROM python:3.12-slim

WORKDIR /app

# Налаштування змінного середовища
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Спочатку встановимо локальну лібу predator-common
COPY libs/predator-common /libs/predator-common
RUN pip install --no-cache-dir /libs/predator-common

# Встановлення залежностей бота
COPY services/telegram-bot/pyproject.toml /app/
RUN pip install --no-cache-dir .

# Копіювання коду
COPY services/telegram-bot/app /app/app

# Створення не-root користувача (HR-05)
RUN groupadd -r predator && useradd -r -g predator predator
USER predator

CMD ["python", "-m", "app.main"]
