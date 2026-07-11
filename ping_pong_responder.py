#!/usr/bin/env python3
"""
🎾 Ping-Pong Responder — Fallback для обробки команд між агентами

Цей скрипт забезпечує безперервну комунікацію між Mega Agent та KLAV-Agent
через файл `agent_tennis_channel.md`, коли Claw недоступний.
"""

import os
import time
import logging
from datetime import datetime

# Налаштування логування
logging.basicConfig(
    filename='/Users/Shared/Predator_60/ping_pong_responder.log',
    level=logging.INFO,
    format='%(asctime)s - %(message)s'
)

# Шлях до файлу каналу зв'язку
TENNIS_CHANNEL = '/Users/Shared/Predator_60/agent_tennis_channel.md'


def read_tennis_channel():
    """Читає вміст файлу каналу зв'язку."""
    try:
        with open(TENNIS_CHANNEL, 'r') as file:
            return file.read().strip()
    except FileNotFoundError:
        logging.warning(f"Файл {TENNIS_CHANNEL} не знайдено. Створюємо новий.")
        return ""


def write_tennis_channel(message):
    """Записує повідомлення у файл каналу зв'язку."""
    try:
        with open(TENNIS_CHANNEL, 'w') as file:
            file.write(message)
        logging.info(f"Записано у файл: {message}")
    except Exception as e:
        logging.error(f"Помилка запису у файл: {e}")


def handle_ping_pong():
    """Обробляє ping-pong команди."""
    content = read_tennis_channel()
    
    if "PING" in content:
        response = f"PONG: Ready for next command. Timestamp: {datetime.now()}"
        write_tennis_channel(f"ACTION_REQUIRED: {response}")
    elif "PONG" in content:
        response = f"PING: Awaiting response. Timestamp: {datetime.now()}"
        write_tennis_channel(f"ACTION_REQUIRED: {response}")
    else:
        # Ініціалізуємо протокол, якщо файл порожній
        response = f"PING: Awaiting response. Timestamp: {datetime.now()}"
        write_tennis_channel(f"ACTION_REQUIRED: {response}")


def main():
    """Головний цикл скрипта."""
    logging.info("🚀 Запущено Ping-Pong Responder (fallback)")
    while True:
        handle_ping_pong()
        time.sleep(5)  # Чекаємо 5 секунд перед наступною перевіркою


if __name__ == "__main__":
    main()