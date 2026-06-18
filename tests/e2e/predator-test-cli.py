#!/usr/bin/env python3
"""
🦅 Predator Test CLI v3.0
PREDATOR Analytics v61.0-ELITE

CLI інструмент для швидкого запуску тестів з новими технологіями.
"""

import argparse
import subprocess
import sys
import os
from pathlib import Path
from typing import Dict, List, Optional
import json


class PredatorTestCLI:
    """CLI інструмент для запуску тестів"""
    
    def __init__(self):
        self.project_root = Path("/Users/Shared/Predator_60")
        self.e2e_dir = self.project_root / "tests/e2e"
        self.ui_dir = self.project_root / "apps/predator-analytics-ui"
    
    def run_command(self, command: List[str], cwd: Optional[Path] = None) -> int:
        """Виконує команду"""
        print(f"🚀 Виконуємо: {' '.join(command)}")
        result = subprocess.run(command, cwd=cwd or self.project_root)
        return result.returncode
    
    def run_playwright_tests(self, test_file: Optional[str] = None, headless: bool = True, trace: bool = True):
        """Запускає Playwright тести"""
        # Перевірка наявності package.json
        package_json = self.ui_dir / "package.json"
        if not package_json.exists():
            print("❌ package.json не знайдено")
            return 1
        
        # Спроба запустити через npm run test:e2e
        command = ["npm", "run", "test:e2e"]
        
        if test_file:
            command.append(test_file)
        
        if not headless:
            command.append("--headed")
        
        return self.run_command(command, cwd=self.ui_dir)
    
    def run_autonomous_agent(self, mode: str = "auto", iterations: int = 10):
        """Запускає автономний агент"""
        script_path = self.e2e_dir / "run_autonomous_agent_v2.sh"
        command = [str(script_path), mode, str(iterations)]
        return self.run_command(command)
    
    def run_database_validation(self):
        """Запускає валідацію баз даних"""
        script_path = self.e2e_dir / "validate_8_dbs.py"
        command = ["python3", str(script_path)]
        return self.run_command(command)
    
    def run_ai_chat_validation(self):
        """Запускає валідацію AI-чату"""
        script_path = self.e2e_dir / "ai_chat_validator.py"
        command = ["python3", str(script_path)]
        return self.run_command(command)
    
    def run_consistency_check(self):
        """Запускає перевірку консистентності"""
        script_path = self.e2e_dir / "consistency_checker.py"
        command = ["python3", str(script_path)]
        return self.run_command(command)
    
    def generate_reports(self, test_data: Optional[Dict] = None):
        """Генерує звіти"""
        script_path = self.e2e_dir / "report_generator.py"
        command = ["python3", str(script_path)]
        return self.run_command(command)
    
    def run_load_test(self, config: str = "default"):
        """Запускає навантажувальний тест (Artillery)"""
        # Перевірка наявності Artillery
        try:
            subprocess.run(["artillery", "--version"], capture_output=True, check=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("⚠️ Artillery не встановлено. Встановіть через: npm install -g artillery")
            return 1
        
        config_path = self.e2e_dir / "load-tests" / f"{config}.yml"
        if not config_path.exists():
            print(f"❌ Конфігурація не знайдена: {config_path}")
            return 1
        
        command = ["artillery", "run", str(config_path)]
        return self.run_command(command)
    
    def start_docker_compose(self):
        """Запускає Docker Compose для тестового оточення"""
        # Перевірка наявності Docker
        try:
            subprocess.run(["docker", "--version"], capture_output=True, check=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("⚠️ Docker не запущено або не встановлено")
            return 1
        
        compose_file = self.project_root / "deploy" / "docker-compose.test.yml"
        if not compose_file.exists():
            print(f"❌ Docker Compose файл не знайдено: {compose_file}")
            return 1
        
        command = ["docker-compose", "-f", str(compose_file), "up", "-d"]
        return self.run_command(command)
    
    def stop_docker_compose(self):
        """Зупиняє Docker Compose"""
        # Перевірка наявності Docker
        try:
            subprocess.run(["docker", "--version"], capture_output=True, check=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("⚠️ Docker не запущено або не встановлено")
            return 1
        
        compose_file = self.project_root / "deploy" / "docker-compose.test.yml"
        if not compose_file.exists():
            print(f"❌ Docker Compose файл не знайдено: {compose_file}")
            return 1
        
        command = ["docker-compose", "-f", str(compose_file), "down"]
        return self.run_command(command)
    
    def view_trace(self, trace_file: str):
        """Відкриває Playwright Trace Viewer"""
        command = ["npx", "playwright", "show-trace", trace_file]
        return self.run_command(command, cwd=self.ui_dir)
    
    def run_all_validations(self):
        """Запускає всі валідації"""
        print("🔍 Запуск всіх валідацій...")
        
        results = {}
        
        # Валідація баз даних
        print("\n📊 Валідація баз даних...")
        results["database"] = self.run_database_validation()
        
        # Валідація AI-чату
        print("\n🤖 Валідація AI-чату...")
        results["ai_chat"] = self.run_ai_chat_validation()
        
        # Перевірка консистентності
        print("\n🔗 Перевірка консистентності...")
        results["consistency"] = self.run_consistency_check()
        
        return results
    
    def run_full_test_suite(self):
        """Запускає повний набір тестів"""
        print("🦅 Запуск повного набору тестів PREDATOR Analytics v3.0")
        
        # Запуск Docker Compose
        print("\n🐳 Запуск Docker Compose...")
        docker_result = self.start_docker_compose()
        if docker_result != 0:
            print("⚠️ Docker Compose не запущено, продовжуємо без нього")
        
        # Запуск Playwright тестів
        print("\n🧪 Запуск Playwright тестів...")
        playwright_result = self.run_playwright_tests(trace=True)
        
        # Запуск валідацій
        print("\n🔍 Запуск валідацій...")
        validation_results = self.run_all_validations()
        
        # Генерація звітів
        print("\n📊 Генерація звітів...")
        self.generate_reports()
        
        # Зупинка Docker Compose
        print("\n🐳 Зупинка Docker Compose...")
        self.stop_docker_compose()
        
        # Підсумок
        print("\n✅ Підсумок:")
        print(f"  Playwright: {'✅' if playwright_result == 0 else '❌'}")
        print(f"  Database: {'✅' if validation_results.get('database', 1) == 0 else '❌'}")
        print(f"  AI Chat: {'✅' if validation_results.get('ai_chat', 1) == 0 else '❌'}")
        print(f"  Consistency: {'✅' if validation_results.get('consistency', 1) == 0 else '❌'}")
        
        return playwright_result


def main():
    """Головна функція CLI"""
    cli = PredatorTestCLI()
    
    parser = argparse.ArgumentParser(
        description="🦅 Predator Test CLI v3.0 - CLI інструмент для тестування PREDATOR Analytics",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Приклади:
  # Запуск Playwright тестів
  python predator-test-cli.py playwright
  
  # Запуск автономного агента
  python predator-test-cli.py autonomous --mode auto --iterations 10
  
  # Запуск всіх валідацій
  python predator-test-cli.py validate-all
  
  # Запуск повного набору тестів
  python predator-test-cli.py full
  
  # Запуск Docker Compose
  python predator-test-cli.py docker-up
  
  # Перегляд trace
  python predator-test-cli.py trace --file trace.zip
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Доступні команди')
    
    # Playwright тести
    playwright_parser = subparsers.add_parser('playwright', help='Запуск Playwright тестів')
    playwright_parser.add_argument('--file', help='Файл тесту')
    playwright_parser.add_argument('--headed', action='store_true', help='Запуск в headed режимі')
    playwright_parser.add_argument('--no-trace', action='store_true', help='Без trace')
    
    # Автономний агент
    autonomous_parser = subparsers.add_parser('autonomous', help='Запуск автономного агента')
    autonomous_parser.add_argument('--mode', default='auto', help='Режим (auto, local, remote, ui-only)')
    autonomous_parser.add_argument('--iterations', type=int, default=10, help='Кількість ітерацій')
    
    # Валідація баз даних
    subparsers.add_parser('validate-db', help='Валідація баз даних')
    
    # Валідація AI-чату
    subparsers.add_parser('validate-ai', help='Валідація AI-чату')
    
    # Перевірка консистентності
    subparsers.add_parser('consistency', help='Перевірка консистентності')
    
    # Всі валідації
    subparsers.add_parser('validate-all', help='Запуск всіх валідацій')
    
    # Генерація звітів
    subparsers.add_parser('report', help='Генерація звітів')
    
    # Навантажувальний тест
    load_parser = subparsers.add_parser('load', help='Навантажувальний тест')
    load_parser.add_argument('--config', default='default', help='Конфігурація')
    
    # Docker Compose
    subparsers.add_parser('docker-up', help='Запуск Docker Compose')
    subparsers.add_parser('docker-down', help='Зупинка Docker Compose')
    
    # Trace viewer
    trace_parser = subparsers.add_parser('trace', help='Перегляд trace')
    trace_parser.add_argument('--file', required=True, help='Файл trace')
    
    # Повний набір тестів
    subparsers.add_parser('full', help='Запуск повного набору тестів')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    # Виконання команди
    if args.command == 'playwright':
        cli.run_playwright_tests(
            test_file=args.file,
            headless=not args.headed,
            trace=not args.no_trace
        )
    elif args.command == 'autonomous':
        cli.run_autonomous_agent(mode=args.mode, iterations=args.iterations)
    elif args.command == 'validate-db':
        cli.run_database_validation()
    elif args.command == 'validate-ai':
        cli.run_ai_chat_validation()
    elif args.command == 'consistency':
        cli.run_consistency_check()
    elif args.command == 'validate-all':
        cli.run_all_validations()
    elif args.command == 'report':
        cli.generate_reports()
    elif args.command == 'load':
        cli.run_load_test(config=args.config)
    elif args.command == 'docker-up':
        cli.start_docker_compose()
    elif args.command == 'docker-down':
        cli.stop_docker_compose()
    elif args.command == 'trace':
        cli.view_trace(trace_file=args.file)
    elif args.command == 'full':
        cli.run_full_test_suite()


if __name__ == "__main__":
    main()
