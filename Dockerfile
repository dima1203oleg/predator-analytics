# Використовуємо офіційний легкий образ Python 3.12
FROM python:3.12-slim

# Встановлення змінних середовища
# PYTHONDONTWRITEBYTECODE: Запобігає запису .pyc файлів
# PYTHONUNBUFFERED: Гарантує, що вивід консолі буде видимим одразу
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    APP_HOME=/app \
    PORT=8080

# Встановлення робочої директорії
WORKDIR $APP_HOME

# Встановлення системних залежностей, необхідних для компіляції та gettext
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gettext \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Копіювання файлу залежностей
COPY requirements.txt .

# Встановлення залежностей Python
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Копіювання коду застосунку
COPY . .

# Компіляція файлів перекладу (якщо вони існують)
RUN if [ -d "locales" ]; then \
    msgfmt locales/uk/LC_MESSAGES/messages.po -o locales/uk/LC_MESSAGES/messages.mo; \
    fi

# Створення непривілейованого користувача для безпеки
RUN adduser --disabled-password --gecos "" predator_user && \
    chown -R predator_user:predator_user $APP_HOME

USER predator_user

# Відкриття порту
EXPOSE $PORT

# Встановлення PYTHONPATH для коректного імпорту app та libs
ENV PYTHONPATH=/app

# Команда запуску через модуль для правильного розпізнавання пакету app
CMD ["python", "-m", "app.main"]
