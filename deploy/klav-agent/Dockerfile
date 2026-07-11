# 🦅 KLAV-Agent — Autonomous Cluster Administrator
# Dockerfile для запуску на NVIDIA-сервері (192.168.1.48)

FROM python:3.12-slim

# Встановлення залежностей
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Створення користувача
RUN useradd -m klav-agent && \
    mkdir -p /home/klav-agent/app && \
    chown -R klav-agent:klav-agent /home/klav-agent

# Робоча директорія
WORKDIR /home/klav-agent/app

# Копіювання файлів
COPY --chown=klav-agent:klav-agent .claw.json /home/klav-agent/app/
COPY --chown=klav-agent:klav-agent scripts/klav-agent/ /home/klav-agent/app/scripts/

# Встановлення Python-залежностей
COPY --chown=klav-agent:klav-agent requirements.txt /home/klav-agent/app/
RUN pip install --no-cache-dir -r requirements.txt

# Налаштування змінних середовища
ENV LITELLM_URL=http://192.168.1.58:4000/v1
ENV KLAV_AGENT_MODE=autonomous

# Запуск агента
USER klav-agent
CMD ["python", "scripts/klav-agent/klav_agent.py"]