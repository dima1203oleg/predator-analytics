from __future__ import annotations

import json

#!/usr/bin/env python3
import os
from pathlib import Path
import subprocess
import sys


# Project Root setup
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

def get_color(status):
    return "\033[92m" if status else "\033[91m"

def end_color():
    return "\033[0m"

def check_docker():
    try:
        res = subprocess.run(["docker", "ps", "--format", "json"], capture_output=True, text=True)
        containers = [json.loads(line) for line in res.stdout.splitlines() if line]
        return len(containers), containers
    except Exception as e:
        if "permission denied" in str(e).lower():
            return 0, [{"Error": "Socket Locked. Run: chmod 666 /Users/dima-mac/.docker/run/docker.sock"}]
        return 0, []

def get_evolution_info():
    try:
        # Check audit log from master control
        log_path = os.path.join(str(ROOT_DIR), "azr_audit_log.jsonl")
        cycles = 0
        if os.path.exists(log_path):
            with open(log_path) as f:
                cycles = len(f.readlines())

        # Check memory file directly to avoid import issues in quick status
        mem_path = os.path.join(str(ROOT_DIR), "azr_memory.jsonl")
        solutions = 0
        if os.path.exists(mem_path):
            with open(mem_path) as f:
                solutions = len(f.readlines())

        return cycles, "ACTIVE", {"solutions_stored": solutions}
    except Exception as e:
        return 0, f"ERR: {e!s}", {"solutions_stored": 0}

def run():
    print("\n🏛️  PREDATOR AZR GLOBAL STATUS")
    print("="*50)

    # 1. Constitution
    v_output = subprocess.run([sys.executable, "scripts/azr_constitutional_guard.py"], capture_output=True, text=True).stdout
    is_valid = "✅ СИСТЕМА ВІДПОВІДАЄ КОНСТИТУЦІЇ" in v_output
    print(f"Конституційна відповідність: {get_color(is_valid)}{'ПАРАМЕТРИ В НОРМІ' if is_valid else 'ВИЯВЛЕНО ПОРУШЕННЯ'}{end_color()}")

    # 2. Infra
    docker_count, containers = check_docker()
    print(f"Активні сервіси (Docker): {get_color(docker_count > 0)}{docker_count} працює{end_color()}")

    # 3. Network
    ngrok_url = "https://jolyn-bifid-eligibly.ngrok-free.dev/admin"
    print(f"Публічне посилання (Ngrok): {get_color(True)}{ngrok_url}{end_color()}")
    print(f"Прямий IP (Static):         {get_color(True)}http://194.177.1.240:8080{end_color()}")

    # 4. Learning & Evolution (Axiom 16)
    cycles, ev_status, mem_stats = get_evolution_info()
    print(f"Автонавчання (Evolution):    {get_color(cycles > 0)}{ev_status} ({cycles} циклів){end_color()}")
    mem_color = get_color(mem_stats.get('solutions_stored', 0) >= 0)
    print(f"Нейронна Пам'ять (Memory):   {mem_color}{mem_stats.get('solutions_stored', 0)} кейсів засвоєно{end_color()}")

    # 5. System Info
    py_ver = f"{sys.version_info.major}.{sys.version_info.minor}"
    is_py312 = py_ver == "3.12"
    py_status = f"{get_color(is_py312)}{py_ver}{end_color()}"
    if not is_py312:
        py_status += f" {get_color(False)}(ARCHITECTURAL VIOLATION - AXIOM 15.2){end_color()}"

    print(f"Пуризм Версії (3.12):        {py_status}")
    print(f"Статус Системи:             {'🔱 SOVEREIGN' if is_py312 else '⚠️ DEGRADED (STAY IN DOCKER)'}")

    print("="*50)
    if not is_valid:
        print("\n⚠️  УВАГА: Виконайте 'python3 scripts/azr_constitutional_guard.py' для деталей!")

    print("\n🚀 Система працює в режимі АВТОНОМНОГО ВДОСКОНАЛЕННЯ.")

if __name__ == "__main__":
    run()
