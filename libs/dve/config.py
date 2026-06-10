import os
from dataclasses import dataclass
from typing import List

@dataclass(frozen=True)
class DVEConfig:
    """Конфігурація DVE, згенерована на підставі відповідей користувача."""
    # Доступ до секретів
    secrets_access: bool = True
    # Підтримка черги повідомлень
    message_queue: str = "Redpanda"  # варіанти: Redpanda, Kafka, обидва
    # Канали звітності
    report_channels: List[str] = ("Telegram",)
    # Перевірка моделей LLM
    llm_models: List[str] = ("ollama/mistral:latest",)
    # Автоматичні алерти Prometheus
    prometheus_alerts: bool = True
    # Збір логів у Loki
    enable_loki: bool = True
    # Шлях до файлу з конфігураціями рівнів (можна розширити)
    levels_config_path: str = os.getenv("DVE_LEVELS_CONFIG", "/etc/dve/levels.yaml")

def load_config() -> DVEConfig:
    """Завантажує конфігурацію з оточення, з fallback на значення за замовчуванням."""
    # У реальному коді можна парсити JSON/YAML, тут спрощено
    return DVEConfig()
