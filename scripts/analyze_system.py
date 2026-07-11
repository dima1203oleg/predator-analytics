#!/usr/bin/env python3

# 🔍 Analyze System — Аналіз архітектури та інфраструктури Predator_60

import os
import subprocess
import json
from datetime import datetime

LOG_DIR = "/Users/Shared/Predator_60/logs"
REPORT_FILE = f"{LOG_DIR}/system_analysis_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"


def log(message):
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {message}")


def run_command(command):
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        log(f"❌ Помилка виконання команди: {command}\n{e.stderr}")
        return None


def analyze_docker_containers():
    log("🐳 Аналіз Docker-контейнерів...")
    containers = run_command("docker ps --format '{{.Names}} ({{.Status}})'")
    if containers:
        containers = containers.split("\n")
    else:
        containers = []
    
    container_status = {}
    for container in containers:
        name, status = container.split(" (")
        status = status.replace(")", "")
        container_status[name] = status
    
    return container_status


def analyze_databases():
    log("🗄️ Аналіз баз даних...")
    databases = {
        "PostgreSQL": "Up" if run_command("docker inspect --format='{{.State.Status}}' postgres 2>/dev/null") == "running" else "Down",
        "Redis": "Up" if run_command("docker inspect --format='{{.State.Status}}' redis 2>/dev/null") == "running" else "Down",
        "ClickHouse": "Up" if run_command("docker inspect --format='{{.State.Status}}' clickhouse 2>/dev/null") == "running" else "Down",
        "Neo4j": "Up" if run_command("docker inspect --format='{{.State.Status}}' neo4j 2>/dev/null") == "running" else "Down",
    }
    return databases


def analyze_logs():
    log("📜 Аналіз логів...")
    logs = {}
    log_files = [
        f"{LOG_DIR}/core_api.log",
        f"{LOG_DIR}/ingestion_worker.log",
        f"{LOG_DIR}/watchdog.log",
    ]
    
    for log_file in log_files:
        if os.path.exists(log_file):
            with open(log_file, "r") as f:
                lines = f.readlines()
                errors = [line for line in lines if "ERROR" in line]
                warnings = [line for line in lines if "WARNING" in line]
                logs[os.path.basename(log_file)] = {
                    "errors": len(errors),
                    "warnings": len(warnings),
                }
    
    return logs


def generate_report():
    report = {
        "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        "docker_containers": analyze_docker_containers(),
        "databases": analyze_databases(),
        "logs": analyze_logs(),
    }
    
    with open(REPORT_FILE, "w") as f:
        json.dump(report, f, indent=2)
    
    log(f"✅ Звіт збережено у {REPORT_FILE}")
    return report


def main():
    log("🚀 Запуск аналізу системи Predator_60...")
    report = generate_report()
    log("📋 Звіт про аналіз системи:")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()