from __future__ import annotations


#!/usr/bin/env python3
"""━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 Mixed Top CLI Stack (Canonical Implementation)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Відповідає специфікації: CLI_STACK_MIXED_TOP_TECH_SPEC.md.

Ролі:
1. Gemini CLI - Планування та аналіз (free tier)
2. Mistral Vibe CLI - Генерація коду (free/open-source)
3. Aider - Рев'ю та правки (open-source)
4. Ollama - Offline fallback (local models)

Середовища:
- LOCAL: всі CLI активні, без GPU/orchestrator
- SERVER: всі CLI активні + heavy tasks

Приклад використання:
    # Автоматичний режим (Pipeline)
    python3 triple_cli.py "Створи Redis worker"

    # Окремі агенти (через аргументи)
    python3 triple_cli.py --agent planner "План міграції"
    python3 triple_cli.py --agent codegen "Згенеруй клас"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

import argparse
from enum import Enum
import json
import logging
import os
from pathlib import Path
import subprocess
import sys
from typing import Dict


# Налаштування логування
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger("MixedCLI")

class Environment(Enum):
    LOCAL = "local"
    SERVER = "server"

class AgentRole(Enum):
    PLANNER = "planner"
    CODEGEN = "codegen"
    REVIEW = "review"
    DIAGNOSTIC = "diagnostic"
    FALLBACK = "fallback"

class MixedCLIStack:
    """Імплементація Змішаного ТОП CLI-стеку для Predator Analytics."""

    def __init__(self, gemini_key=None, mistral_key=None, groq_key=None):
        self.env = self._detect_environment()
        self.gemini_key = gemini_key or os.environ.get("GEMINI_API_KEY")
        self.mistral_key = mistral_key or os.environ.get("MISTRAL_API_KEY")
        self.groq_key = groq_key or os.environ.get("GROQ_API_KEY")
        self._init_clients()
        self.root_dir = "/Users/dima-mac/Documents/Predator_21"

        # Ensure common CLI paths are in PATH
        python_bin = os.path.expanduser("~/Library/Python/3.9/bin")
        if python_bin not in os.environ["PATH"]:
            os.environ["PATH"] = f"{python_bin}:{os.environ['PATH']}"

    def self_doctor(self) -> str:
        """Запуск системної діагностики Predator."""
        print("\n" + "━" * 60)
        print("🏥 Рівень 0: System Doctor (Diagnostics)")
        print("━" * 60)
        try:
            script_path = os.path.join(self.root_dir, "scripts/system_doctor.sh")
            result = subprocess.run(['bash', script_path], check=False, capture_output=True, text=True, timeout=30)
            return result.stdout
        except Exception as e:
            return f"❌ Diagnostics failed: {e}"

    def _detect_environment(self) -> Environment:
        """Визначає середовище виконання."""
        # Проста евристика: на сервері зазвичай є специфічні змінні або hostname
        # Тут використовуємо змінну EXECUTION_ENV або дефолт
        env_var = os.environ.get("EXECUTION_ENV", "local").lower()
        if env_var == "server":
            return Environment.SERVER
        return Environment.LOCAL

    def _setup_api_keys(self):
        """Завантажує API ключі з оточення."""
        self.gemini_key = os.environ.get("GEMINI_API_KEY")
        self.mistral_key = os.environ.get("MISTRAL_API_KEY")
        self.groq_key = os.environ.get("GROQ_API_KEY")

    def _init_clients(self):
        """Ініціалізація клієнтів з fallback логікою."""
        # 1. Gemini (Planner)
        self.gemini_client = None
        if self.gemini_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.gemini_key)
                self.gemini_client = genai.GenerativeModel('gemini-pro')
            except ImportError:
                print("⚠️  Google Generative AI SDK не встановлено.")

        # 2. Mistral (Codegen)
        self.mistral_client = None
        if self.mistral_key:
            try:
                from mistralai import Mistral
                self.mistral_client = Mistral(api_key=self.mistral_key)
            except ImportError:
                print("⚠️  Mistral SDK не встановлено.")

        # 4. Groq (Universal Fallback)
        self.groq_client = None
        if self.groq_key:
            try:
                import httpx
                self.groq_client = True # Flag showing we have the key
            except ImportError:
                pass

        # 3. Aider (Review) - перевіряється в runtime

    def _run_fallback(self, task: str, role: AgentRole, context: str = "") -> str:
        """Єдиний механізм Fallback (Ollama).
        Викликається, коли основний інструмент недоступний.
        """
        print(f"\n⚠️  FALLBACK MODE: {role.value.upper()} → OLLAMA")
        print("   Причина: Primary tool unavailable")

        model_map = {
            AgentRole.PLANNER: "llama3.2:3b", # Швидка модель для тексту
            AgentRole.CODEGEN: "codellama",   # Модель для коду
            AgentRole.REVIEW: "codellama",    # Модель для рев'ю
        }

        model = model_map.get(role, "llama3.2:3b")

        full_prompt = f"Task: {task}\nContext: {context}\n"
        if role == AgentRole.PLANNER:
            full_prompt += "Return a JSON execution plan."
        elif role == AgentRole.CODEGEN:
            full_prompt += "Return Python code only."

        try:
            result = subprocess.run(
                ['ollama', 'run', model, full_prompt],
                check=False, capture_output=True,
                text=True,
                timeout=120
            )
            if result.returncode != 0:
                raise Exception(f"Ollama Error: {result.stderr}")
            return result.stdout

        except FileNotFoundError:
            return "❌ CRITICAL: Ollama not found. No fallback available."
        except Exception as e:
            return f"❌ CRITICAL: Fallback failed: {e}"

    # 🧠 Рівень 1: Планування (Gemini)
    def planner_agent(self, task: str) -> dict:
        print("\n" + "━" * 60)
        print("🧠 Рівень 1: Gemini CLI (Planner)")
        print("━" * 60)

        if not self.gemini_client:
            fallback_res = self._run_fallback(task, AgentRole.PLANNER)
            # Спробуємо розпарсити JSON з fallback
            try:
                start = fallback_res.find('{')
                end = fallback_res.rfind('}') + 1
                return json.loads(fallback_res[start:end])
            except:
                return {"description": task, "task_type": "script", "steps": []}

        prompt = f"""
        Ти - Gemini CLI, архітектор системи Predator Analytics.
        Завдання: {task}

        Створи план розробки (JSON):
        {{
            "task_type": "script",
            "description": "...",
            "steps": [
                {{"step": 1, "action": "...", "code_hint": "..."}}
            ]
        }}
        """

        try:
            response = self.gemini_client.generate_content(prompt)
            text = response.text

            # Extract JSON
            start = text.find('{')
            end = text.rfind('}') + 1
            plan = json.loads(text[start:end])

            print(f"✅ План створено: {plan.get('description')}")
            return plan

        except Exception as e:
            print(f"❌ Gemini Error: {e}")
            # Fallback
            fallback_res = self._run_fallback(task, AgentRole.PLANNER, str(e))
            try:
                start = fallback_res.find('{')
                end = fallback_res.rfind('}') + 1
                return json.loads(fallback_res[start:end])
            except:
                return {"description": task, "task_type": "script", "steps": []}

    # ✋ Рівень 2: Генерація (Mistral Vibe)
    def codegen_agent(self, plan: dict) -> str:
        print("\n" + "━" * 60)
        print("✋ Рівень 2: Mistral Vibe CLI (Codegen)")
        print("━" * 60)

        task_desc = plan.get('description', 'Unknown Task')

        if not self.mistral_client:
            if self.groq_key:
                print("⚡ Using Groq (Llama-3/Mistral-vibe) for Codegen")
                import httpx
                response = httpx.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {self.groq_key}"},
                    json={
                        "model": "llama-3.3-70b-versatile",
                        "messages": [{"role": "user", "content": f"Write python code for: {task_desc}"}],
                        "temperature": 0.2
                    },
                    timeout=60.0
                )
                if response.status_code == 200:
                    code = response.json()["choices"][0]["message"]["content"]
                    if "```python" in code:
                        code = code.split("```python")[1].split("```")[0]
                    return code.strip()

            return self._run_fallback(f"Generate code for: {task_desc}", AgentRole.CODEGEN, json.dumps(plan))

        prompt = f"""
        Ти - Mistral Vibe CLI.
        Реалізуй Python скрипт для завдання: {task_desc}

        Деталі плану:
        {json.dumps(plan, indent=2)}

        Вимоги:
        - Python 3.9+
        - Type hinting
        - Logging
        - Ніякого Markdown, тільки код
        """

        try:
            response = self.mistral_client.chat.complete(
                model="codestral-latest",
                messages=[{"role": "user", "content": prompt}]
            )
            code = response.choices[0].message.content

            # Clean Markdown if present
            if "```python" in code:
                code = code.split("```python")[1].split("```")[0]
            elif "```" in code:
                code = code.split("```")[1].split("```")[0]

            print(f"✅ Код згенеровано ({len(code)} bytes)")
            return code.strip()

        except Exception as e:
            print(f"❌ Mistral Error: {e}")
            return self._run_fallback(f"Generate code for: {task_desc}", AgentRole.CODEGEN, str(e))

    # 🎛️ Рівень 3: Рев'ю (Aider)
    def review_agent(self, file_path: str, context: str):
        print("\n" + "━" * 60)
        print("🎛️ Рівень 3: Aider (Review & Fix)")
        print("━" * 60)

        # Flexible aider path search
        import shutil
        aider_bin = shutil.which('aider')
        if not aider_bin:
            possible_paths = [
                os.path.expanduser('~/.local/bin/aider'),
                os.path.expanduser('~/Library/Python/3.9/bin/aider'),
                '/usr/local/bin/aider',
                '/home/dima/.local/bin/aider'
            ]
            for p in possible_paths:
                if os.path.exists(p):
                    aider_bin = p
                    break

        # Check if aider is installed
        try:
            if not aider_bin:
                raise FileNotFoundError
            check = subprocess.run([aider_bin, '--version'], check=False, capture_output=True, timeout=5)
            if check.returncode != 0:
                raise FileNotFoundError
        except (FileNotFoundError, subprocess.TimeoutExpired):
            print("⚠️  Aider не знайдено.")
            print(self._run_fallback(f"Review code in {file_path}", AgentRole.REVIEW, context))
            return None

        print(f"🛡️ Запуск Aider для перевірки: {file_path}")

        # Aider run command
        cmd = [
            aider_bin,
            '--yes',
            '--message',
            f"Review this code compared to requirement: '{context}'. Fix bugs, add type hints, ensure PEP8.",
            file_path
        ]

        try:
            subprocess.run(cmd, check=True, capture_output=True)
            print("✅ Aider завершив рев'ю.")
            with open(file_path) as f:
                return f.read()
        except subprocess.CalledProcessError as e:
            print(f"⚠️ Aider завершився з помилкою: {e}")
            return None

    # Orchestrator Logic
    def run_pipeline(self, task: str, output_file: str | None = None):
        print(f"🚀 ЗАПУСК MIXED CLI PIPELINE [{self.env.value.upper()}]")

        # 1. Plan
        plan = self.planner_agent(task)

        # 2. Code
        code = self.codegen_agent(plan)

        # Save Code
        if not output_file:
            task_type = plan.get("task_type", "script")
            output_file = f"generated_{task_type}.py"

        out_path = Path(output_file)
        out_path.write_text(code, encoding="utf-8")
        print(f"💾 Код збережено в: {out_path}")

        # 3. Review
        self.review_agent(str(out_path), plan.get("description", task))

        print("\n✅ PIPELINE COMPLETED")
        print(f"👉 Результат: {out_path.absolute()}")

def main():
    parser = argparse.ArgumentParser(description="Mixed Top CLI Stack for Predator Analytics")
    parser.add_argument("task", nargs="?", help="Опис завдання")
    parser.add_argument("--agent", choices=["planner", "codegen", "review"], help="Запустити конкретного агента")
    parser.add_argument("--tool", help="Вказати інструмент (для сумісності з predator agents run)")
    parser.add_argument("--file", help="Файл для рев'ю")
    parser.add_argument("-o", "--output", help="Вихідний файл")

    args = parser.parse_args()

    stack = MixedCLIStack()

    if args.agent:
        # Individual Agent Run
        if args.agent == "planner":
            print(json.dumps(stack.planner_agent(args.task), indent=2))
        elif args.agent == "codegen":
            # Expects JSON plan as task input or plain text
            try:
                # Try to parse as json plan
                plan = json.loads(args.task)
            except:
                # Treat as pure description
                plan = {"description": args.task}
            print(stack.codegen_agent(plan))
        elif args.agent == "review":
            if not args.file:
                print("❌ Для рев'ю потрібен файл (--file)")
                sys.exit(1)
            stack.review_agent(args.file, args.task or "Review code")
    elif args.task:
        # Full Pipeline
        stack.run_pipeline(args.task, args.output)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
