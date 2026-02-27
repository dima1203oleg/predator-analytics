from __future__ import annotations


#!/usr/bin/env python3
"""Real-time Monitoring Dashboard для Autonomous Intelligence v2.0
Показує статус системи в реальному часі.
"""
from datetime import datetime
import os
import sys
import time
from typing import Any, Dict

import requests


# ANSI кольори
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


def clear_screen():
    """Очистити екран."""
    os.system('clear' if os.name == 'posix' else 'cls')


def print_header():
    """Вивести заголовок."""
    print(f"{Colors.BOLD}{Colors.CYAN}")
    print("╔════════════════════════════════════════════════════════════════════╗")
    print("║     AUTONOMOUS INTELLIGENCE v2.0 - REAL-TIME DASHBOARD            ║")
    print("║     Predator Analytics v45                                         ║")
    print("╚════════════════════════════════════════════════════════════════════╝")
    print(f"{Colors.ENDC}")


def get_status_color(status: str) -> str:
    """Отримати колір для статусу."""
    status_lower = status.lower()
    if status_lower in ['healthy', 'running', 'active']:
        return Colors.GREEN
    if status_lower in ['degraded', 'partial', 'warning']:
        return Colors.YELLOW
    if status_lower in ['error', 'failed', 'stopped']:
        return Colors.RED
    return Colors.BLUE


def format_percentage(value: float) -> str:
    """Форматувати відсоток з кольором."""
    if value >= 80:
        return f"{Colors.GREEN}{value:.1f}%{Colors.ENDC}"
    if value >= 60:
        return f"{Colors.YELLOW}{value:.1f}%{Colors.ENDC}"
    return f"{Colors.RED}{value:.1f}%{Colors.ENDC}"


def print_system_overview(data: dict[str, Any]):
    """Вивести загальний огляд системи."""
    print(f"\n{Colors.BOLD}📊 SYSTEM OVERVIEW{Colors.ENDC}")
    print("─" * 70)

    timestamp = data.get('timestamp', 'N/A')
    overall_status = data.get('overall_status', 'unknown')
    autonomy_level = data.get('autonomy_level', 0)
    automation = data.get('automation_percentage', 0)

    status_color = get_status_color(overall_status)

    print(f"  Timestamp:        {Colors.CYAN}{timestamp}{Colors.ENDC}")
    print(f"  Overall Status:   {status_color}{overall_status.upper()}{Colors.ENDC}")
    print(f"  Autonomy Level:   {Colors.GREEN}Level {autonomy_level}{Colors.ENDC} / 5")
    print(f"  Automation:       {format_percentage(automation)}")


def print_subsystems(systems: dict[str, Any]):
    """Вивести статус підсистем."""
    print(f"\n{Colors.BOLD}🧠 SUBSYSTEMS STATUS{Colors.ENDC}")
    print("─" * 70)

    # Autonomous Optimizer
    if 'autonomous_optimizer' in systems:
        opt = systems['autonomous_optimizer']
        status = opt.get('status', 'unknown')
        level = opt.get('level', 0)
        status_color = get_status_color(status)

        print(f"\n  {Colors.BOLD}Autonomous Optimizer:{Colors.ENDC}")
        print(f"    Status:           {status_color}{status}{Colors.ENDC}")
        print(f"    Optimization Level: {Colors.CYAN}{level}{Colors.ENDC}")
        print(f"    Interval:         {opt.get('interval_seconds', 0)}s")

    # Autonomous Intelligence v2.0
    if 'autonomous_intelligence_v2' in systems:
        ai = systems['autonomous_intelligence_v2']
        status = ai.get('status', 'unknown')
        status_color = get_status_color(status)

        print(f"\n  {Colors.BOLD}Autonomous Intelligence v2.0:{Colors.ENDC}")
        print(f"    Status:           {status_color}{status}{Colors.ENDC}")

        # Predictive Analyzer
        if 'predictive_analyzer' in ai:
            pred = ai['predictive_analyzer']
            print(f"    Metrics Collected: {Colors.CYAN}{pred.get('metrics_collected', 0)}{Colors.ENDC}")
            print(f"    Anomaly Threshold: {Colors.CYAN}{pred.get('anomaly_threshold', 0)}σ{Colors.ENDC}")

        # Learning Engine
        if 'learning_engine' in ai:
            learn = ai['learning_engine']
            print(f"    Learning Records:  {Colors.CYAN}{learn.get('total_records', 0)}{Colors.ENDC}")
            print(f"    Strategies Learned: {Colors.CYAN}{learn.get('strategies_learned', 0)}{Colors.ENDC}")

        # Decision Maker
        if 'decision_maker' in ai:
            dec = ai['decision_maker']
            print(f"    Total Decisions:   {Colors.CYAN}{dec.get('total_decisions', 0)}{Colors.ENDC}")
            confidence = dec.get('min_confidence', 0)
            print(f"    Min Confidence:    {format_percentage(confidence * 100)}")

    # Guardian
    if 'guardian' in systems:
        guard = systems['guardian']
        status = guard.get('status', 'unknown')
        status_color = get_status_color(status)

        print(f"\n  {Colors.BOLD}Guardian Self-Healing:{Colors.ENDC}")
        print(f"    Status:           {status_color}{status}{Colors.ENDC}")
        print(f"    Mode:             {Colors.CYAN}{guard.get('mode', 'N/A')}{Colors.ENDC}")


def print_predictions(api_url: str):
    """Вивести поточні передбачення."""
    try:
        response = requests.get(f"{api_url}/api/v1/v45/autonomous/predictions", timeout=2)
        if response.status_code == 200:
            data = response.json()
            predictions = data.get('predictions', [])

            print(f"\n{Colors.BOLD}🔮 CURRENT PREDICTIONS{Colors.ENDC}")
            print("─" * 70)

            if predictions:
                for i, pred in enumerate(predictions[:5], 1):  # Показати перші 5
                    pred_type = pred.get('type', 'unknown')
                    severity = pred.get('severity', 'unknown')

                    severity_color = Colors.RED if severity == 'critical' else Colors.YELLOW if severity == 'high' else Colors.GREEN

                    print(f"\n  {i}. {Colors.BOLD}{pred_type}{Colors.ENDC}")
                    print(f"     Severity:  {severity_color}{severity}{Colors.ENDC}")

                    if 'current_value' in pred:
                        print(f"     Current:   {Colors.CYAN}{pred['current_value']:.1f}{Colors.ENDC}")
                    if 'threshold' in pred:
                        print(f"     Threshold: {Colors.CYAN}{pred['threshold']}{Colors.ENDC}")
                    if 'eta_minutes' in pred:
                        print(f"     ETA:       {Colors.YELLOW}{pred['eta_minutes']} min{Colors.ENDC}")
            else:
                print(f"\n  {Colors.GREEN}✅ No predictions - System healthy{Colors.ENDC}")
    except Exception as e:
        print(f"\n  {Colors.RED}❌ Failed to fetch predictions: {e}{Colors.ENDC}")


def print_recent_decisions(api_url: str):
    """Вивести останні рішення."""
    try:
        response = requests.get(f"{api_url}/api/v1/v45/autonomous/decisions", timeout=2)
        if response.status_code == 200:
            data = response.json()
            decisions = data.get('decisions', [])

            print(f"\n{Colors.BOLD}🤖 RECENT DECISIONS{Colors.ENDC}")
            print("─" * 70)

            if decisions:
                for i, dec in enumerate(decisions[:3], 1):  # Показати останні 3
                    dec_type = dec.get('type', 'unknown')
                    confidence = dec.get('confidence', 0)
                    executed = dec.get('executed', False)

                    status_icon = "✅" if executed else "⏳"

                    print(f"\n  {status_icon} {i}. {Colors.BOLD}{dec_type}{Colors.ENDC}")
                    print(f"     Confidence: {format_percentage(confidence * 100)}")
                    print(f"     Executed:   {Colors.GREEN if executed else Colors.YELLOW}{executed}{Colors.ENDC}")

                    if 'timestamp' in dec:
                        print(f"     Time:       {Colors.CYAN}{dec['timestamp']}{Colors.ENDC}")
            else:
                print(f"\n  {Colors.BLUE}ℹ️  No decisions yet{Colors.ENDC}")
    except Exception as e:
        print(f"\n  {Colors.RED}❌ Failed to fetch decisions: {e}{Colors.ENDC}")


def print_footer():
    """Вивести футер."""
    print(f"\n{Colors.CYAN}{'─' * 70}{Colors.ENDC}")
    print(f"{Colors.BOLD}Press Ctrl+C to exit | Refreshing every 5 seconds{Colors.ENDC}")


def main():
    """Головна функція."""
    api_url = os.getenv('API_URL', 'http://localhost:8000')

    print(f"{Colors.GREEN}Starting Autonomous Intelligence v2.0 Dashboard...{Colors.ENDC}")
    print(f"API URL: {api_url}")
    print("Press Ctrl+C to exit\n")
    time.sleep(2)

    try:
        while True:
            clear_screen()
            print_header()

            # Отримати статус системи
            try:
                response = requests.get(f"{api_url}/system/autonomy/status", timeout=5)

                if response.status_code == 200:
                    data = response.json()

                    # Вивести огляд
                    print_system_overview(data)

                    # Вивести підсистеми
                    systems = data.get('systems', {})
                    print_subsystems(systems)

                    # Вивести передбачення
                    print_predictions(api_url)

                    # Вивести рішення
                    print_recent_decisions(api_url)

                else:
                    print(f"\n{Colors.RED}❌ API Error: {response.status_code}{Colors.ENDC}")
                    print(f"Response: {response.text[:200]}")

            except requests.exceptions.ConnectionError:
                print(f"\n{Colors.RED}❌ Cannot connect to API at {api_url}{Colors.ENDC}")
                print(f"\n{Colors.YELLOW}Make sure the backend is running:{Colors.ENDC}")
                print("  cd services/api-gateway")
                print("  python -m uvicorn app.main:app --reload")

            except Exception as e:
                print(f"\n{Colors.RED}❌ Error: {e}{Colors.ENDC}")

            # Футер
            print_footer()

            # Чекати перед наступним оновленням
            time.sleep(5)

    except KeyboardInterrupt:
        print(f"\n\n{Colors.GREEN}Dashboard stopped. Goodbye!{Colors.ENDC}\n")
        sys.exit(0)


if __name__ == "__main__":
    main()
