#!/usr/bin/env python3

import os
import time
import subprocess
import logging
import signal
import sys
import requests

# Налаштування логування
logging.basicConfig(
    filename='/Users/Shared/Predator_60/logs/autonomous_watchdog.log',
    level=logging.INFO,
    format='[%(asctime)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# Назви процесів для моніторингу
PROCESSES_TO_MONITOR = [
    "mega_agent",
    "Terminal",
    "Visual Studio Code",
    "KLAV-Agent"
]

# Шляхи до скриптів для запуску
SCRIPTS_TO_RUN = {
    "mega_agent": "/Users/Shared/Predator_60/scripts/run_mega_agent.sh",
    "KLAV-Agent": "/Users/Shared/Predator_60/scripts/run_klav_agent.sh"
}

# URL LiteLLM Router
LITELLM_ROUTER_URL = "http://192.168.1.58:4000/v1"

# Інтервал перевірки у секундах
INTERVAL = 10

def log(message):
    """Логування повідомлень."""
    logging.info(message)
    print(message)

def is_process_running(process_name):
    """Перевірка, чи запущений процес."""
    try:
        result = subprocess.run(
            ["pgrep", "-f", process_name],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        return result.returncode == 0
    except Exception as e:
        log(f"Помилка при перевірці процесу {process_name}: {e}")
        return False

def start_process(script_path):
    """Запуск процесу у фоновому режимі."""
    try:
        subprocess.Popen(
            ["bash", script_path],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        log(f"Запущено процес: {script_path}")
    except Exception as e:
        log(f"Помилка при запуску процесу {script_path}: {e}")

def check_system_resources():
    """Перевірка системних ресурсів."""
    try:
        # Перевірка використання CPU
        cpu_usage = float(subprocess.check_output(
            "top -l 1 -n 0 | grep \"CPU usage\" | awk '{print $3}' | sed 's/%//'",
            shell=True
        ).decode().strip())

        # Перевірка використання RAM
        ram_usage = float(subprocess.check_output(
            "top -l 1 -n 0 | grep \"PhysMem\" | awk '{print $2}' | sed 's/M//'",
            shell=True
        ).decode().strip())

        # Перевірка кількості вільних PTY
        pty_count = int(subprocess.check_output(
            "sysctl -n kern.tty.ptmx_max",
            shell=True
        ).decode().strip())
        pty_used = int(subprocess.check_output(
            "ls /dev/ttys* | wc -l",
            shell=True
        ).decode().strip())
        pty_free = pty_count - pty_used

        log(f"Ресурси: CPU={cpu_usage}%, RAM={ram_usage}MB, PTY вільно={pty_free}/{pty_count}")

        # Попередження про високе навантаження
        if cpu_usage > 90:
            log("⚠️ Високе використання CPU!")
        if ram_usage > 16000:
            log("⚠️ Високе використання RAM!")
        if pty_free < 10:
            log("⚠️ Низька кількість вільних PTY!")

    except Exception as e:
        log(f"Помилка при перевірці ресурсів: {e}")

def main():
    """Головний цикл сторожового демона."""
    log("Автономний сторожовий демон запущено.")

    while True:
        # Перевірка процесів
        for process in PROCESSES_TO_MONITOR:
            if not is_process_running(process):
                log(f"Процес {process} не запущений. Перезапускаємо...")
                if process in SCRIPTS_TO_RUN:
                    start_process(SCRIPTS_TO_RUN[process])

        # Перевірка системних ресурсів
        check_system_resources()

        # Затримка перед наступною перевіркою
        time.sleep(INTERVAL)

def signal_handler(sig, frame):
    """Обробка сигналів для коректного завершення."""
    log("Сторожовий демон зупинено.")
    sys.exit(0)

if __name__ == "__main__":
    # Обробка сигналів для коректного завершення
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    main()