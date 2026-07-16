FROM mcr.microsoft.com/playwright/python:v1.44.0-jammy

# Встановлення робочої директорії
WORKDIR /app

# Налаштування Python
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app/services

# Встановлення залежностей
COPY services/asve/requirements.txt /app/
RUN pip install --timeout=1000 --retries=10 --no-cache-dir --upgrade pip && \
    pip install --timeout=1000 --retries=10 --no-cache-dir -r requirements.txt

# Копіювання коду ASVE
COPY services/asve /app/services/asve

# Створення директорії для звітів
RUN mkdir -p /app/reports && \
    groupadd -r predator && useradd -r -g predator predator && \
    chown -R predator:predator /app

USER predator

# Запуск FastAPI оркестратора
CMD ["python", "services/asve/main.py"]
