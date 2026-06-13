FROM python:3.12-slim as builder

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-ukr \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip wheel --timeout=1000 --retries=10 --no-cache-dir --wheel-dir /app/wheels -r requirements.txt && \
    apt-get purge -y  && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1

# Створення непривілейованого користувача (HR-05)
RUN useradd -m -U predator

WORKDIR /app

COPY --from=builder /app/wheels /wheels
COPY --from=builder /app/requirements.txt .

RUN pip install --timeout=1000 --retries=10 --no-index --find-links /wheels -r requirements.txt
RUN pip install --timeout=1000 --retries=10 playwright
RUN playwright install --with-deps chromium

COPY . .

# Передача прав власності
RUN chown -R predator:predator /app

USER predator

EXPOSE 8003

CMD ["uvicorn", "services.adv_dvs.main:app", "--host", "0.0.0.0", "--port", "8003"]
