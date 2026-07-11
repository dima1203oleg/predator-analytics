#!/usr/bin/env python3
"""
🎾 Ping-Pong Fallback — Автономний обробник команд

Цей скрипт забезпечує безперервну комунікацію між Mega Agent та KLAV-Agent
через файл `agent_tennis_channel.md`, коли Claw недоступний.
"""

import os
import time
import logging
from datetime import datetime

# Налаштування логування
logging.basicConfig(
    filename='/Users/Shared/Predator_60/ping_pong_fallback.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Шлях до файлу каналу зв'язку
TENNIS_CHANNEL = '/Users/Shared/Predator_60/agent_tennis_channel.md'


def read_tennis_channel():
    """Читає вміст файлу каналу зв'язку."""
    try:
        with open(TENNIS_CHANNEL, 'r') as file:
            return file.read()
    except Exception as e:
        logging.error(f"Помилка читання agent_tennis_channel.md: {e}")
        return ""


def write_tennis_channel(content):
    """Записує повідомлення у файл каналу зв'язку."""
    try:
        with open(TENNIS_CHANNEL, 'a') as file:
            file.write(content + "\n")
    except Exception as e:
        logging.error(f"Помилка запису у agent_tennis_channel.md: {e}")


def handle_ping_pong():
    """Обробляє ping-pong команди."""
    try:
        content = read_tennis_channel()
        if "PING" in content:
            response = f"PONG: Ready for next command. Timestamp: {datetime.now()}"
            write_tennis_channel(f"\n### [ACTION_REQUIRED] {datetime.now().strftime('%Y%m%d-%H%M%S')}\n**Від:** Fallback Script\n**Дата:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n**Статус:** Виконано\n**Завдання:** Обробка PING команди.\n**Результат:** {response}\n**Наступні кроки:** Очікування наступної команди.\n")
            logging.info(f"Оброблено PING команду. Відповідь: {response}")
    except Exception as e:
        logging.error(f"Помилка обробки ping-pong: {e}")


def main():
    """Головний цикл скрипта."""
    logging.info("Fallback-скрипт запущено.")
    while True:
        handle_ping_pong()
        time.sleep(10)  # Чекаємо 5 секунд перед наступною перевіркою


if __name__ == "__main__":
    main()