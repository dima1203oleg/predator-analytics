from __future__ import annotations

#!/usr/bin/env python3.12
# policy_engine.py
# Автор: Головний DevOps Predator Analytics v45.0
# Призначення: Перевірка безпеки згенерованого AI коду
import re
from typing import Dict


class PolicyEngine:
    FORBIDDEN_PATTERNS = [
        (r"rm\s+-rf", "❌ Заборонено: rm -rf (спроба видалення файлів)"),
        (r"chmod\s+777", "❌ Заборонено: chmod 777 (небезпечні права доступу)"),
        (r"kubectl\s+(delete|edit|patch)\s+(pod|deployment|secret|node)", "❌ Заборонено: пряма зміна критичних ресурсів K8s"),
        (r"curl.*\|.*(bash|sh|zsh|python)", "❌ Заборонено: запуск скриптів через Pipe (curl | sh)"),
        (r"0\.0\.0\.0/0", "❌ Заборонено: відкриття доступу на весь світ (0.0.0.0/0)"),
        (r"nc\s+-e", "❌ Заборонено: Reverse Shell (netcat)"),
        (r"ssh.*@.*", "❌ Заборонено: зовнішні SSH з'єднання"),
    ]

    ALLOWED_COMMANDS_DRY_RUN = ["echo", "cat", "ls", "grep", "find", "wc", "head", "tail", "df", "du"]

    def check_code(self, code: str, task_type: str = "sandbox-execute") -> dict:
        violations = []

        # 1. Перевірка на небезпечні патерни
        for pattern, message in self.FORBIDDEN_PATTERNS:
            if re.search(pattern, code, re.IGNORECASE | re.MULTILINE):
                violations.append(message)

        # 2. Перевірка для Dry-Run режиму
        if task_type == "dry-run":
            # Беремо лише першу команду (або перші слова рядків)
            lines = code.strip().split('\n')
            for line in lines:
                if line.strip() and not line.strip().startswith(('#', '//')):
                    first_word = line.strip().split()[0] if line.strip().split() else ""
                    if first_word and first_word not in self.ALLOWED_COMMANDS_DRY_RUN:
                        violations.append(f"❌ Dry-run: команда '{first_word}' заборонена в цьому режимі")

        return {
            "approved": len(violations) == 0,
            "violations": violations,
            "action": "BLOCKED" if violations else "ALLOWED",
            "task_type": task_type
        }

if __name__ == "__main__":
    # Тест
    engine = PolicyEngine()
    test_code = "rm -rf /var/log\nls -la"
    result = engine.check_code(test_code, "dry-run")
    print(f"Результат тесту: {result}")
