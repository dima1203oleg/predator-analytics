FROM python:3.12-slim

# Встановлюємо залежності ОС (якщо потрібно)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Створюємо не-root користувача predator
RUN groupadd -r predator && useradd -r -g predator predator

WORKDIR /app

# Копіюємо залежності
COPY requirements.txt .

# Встановлюємо Python залежності
RUN pip install --no-cache-dir -r requirements.txt

# Копіюємо код
COPY . .

# Змінюємо власника файлів
RUN chown -R predator:predator /app

# Змінюємо користувача
USER predator

# Відкриваємо порт
EXPOSE 8002

# Запускаємо сервер
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]
