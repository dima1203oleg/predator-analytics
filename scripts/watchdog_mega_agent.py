#!/usr/bin/env python3

import os
import time
import subprocess
import logging

# Налаштування логування
logging.basicConfig(
    filename='/Users/Shared/Predator_60/logs/watchdog_mega_agent.log',
    level=logging.INFO,
    format='[%(asctime)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# Назва процесу мега-агента
PROCESS_NAME = "mega_agent"

# Шлях до скрипта, який запускає мега-агент
AGENT_SCRIPT = "/Users/Shared/Predator_60/scripts/run_mega_agent.sh"

# Інтервал перевірки у секундах
INTERVAL = 5


def is_process_running():
    """Перевіряє, чи запущений процес мега-агента."""
    try:
        # Виконуємо команду pgrep для пошуку процесу
        result = subprocess.run(
            ["pgrep", "-f", PROCESS_NAME],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        return result.returncode == 0
    except Exception as e:
        logging.error(f"Помилка при перевірці процесу: {e}")
        return False


def start_agent():
    """Запускає мега-агент у фоновому режимі."""
    try:
        logging.info(f"Запускаємо мега-агент: {AGENT_SCRIPT}")
        subprocess.Popen(
            ["bash", AGENT_SCRIPT],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
    except Exception as e:
        logging.error(f"Помилка при запуску мега-агента: {e}")


def main():
    """Головний цикл сторожового демона."""
    logging.info(f"Сторожовий демон мега-агента запущено. Інтервал перевірки: {INTERVAL} секунд.")

    while True:
        if not is_process_running():
            logging.warning("Процес мега-агента не знайдено. Перезапускаємо...")
            start_agent()
        time.sleep(INTERVAL)


if __name__ == "__main__":
    main()