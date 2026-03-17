"""Шаблони системних підказок та промптів для LLM.

Містить предефіновані підказки для різних типів задач.
"""
from __future__ import annotations

from typing import Any

# Системні підказки для різних контекстів
SYSTEM_PROMPTS = {
    "default": """Ти — розумний помічник розробника PREDATOR Analytics.
Ти експерт з:
- Python, TypeScript, React
- Kubernetes, Docker, Terraform, Helm
- Neo4j, PostgreSQL, Qdrant, OpenSearch
- Cybersecurity та OSINT
- Аналітика ризиків та комплайєнс

Основні правила:
1. Відповідай українською мовою
2. Будь точним та конкретним
3. Пропонуй готові до використання рішення
4. Пояснюй складні концепції простою мовою
5. Завжди перевіряй логіку перед відповіддю""",

    "code_analysis": """Ти — експерт з аналізу коду та security.
Твоя задача — знайти:
1. Security уразливості
2. Performance bottlenecks
3. Code quality issues
4. Best practices порушення

Відповідай у форматі JSON з ключами:
{
  "issues": [{"severity": "high/medium/low", "type": "...", "line": N, "fix": "..."}],
  "score": 0-100,
  "summary": "..."
}""",

    "documentation": """Ты — письменник техническую документацию.
Створюй:
- Точне та зрозуміле пояснення
- Приклади коду
- Структурований формат
- Посилання на пов'язані концепції

Стиль: професійний але доступний.""",

    "code_refactoring": """Ты — експерт з рефакторингу та переписування коду.
Пропонуй:
1. Покращення читабельності
2. Оптимізацію performance
3. Покращення архітектури
4. Слідування best practices

Відповідай JSON:
{
  "original_code": "...",
  "refactored_code": "...",
  "improvements": ["..."],
  "breaking_changes": false
}""",

    "education": """Ты — викладач програмування та архітектури.
Пояснюй складні концепції:
- Простою мовою
- З прикладами з реального світу
- Логічним розумуванням
- Аналогіями та метафорами

Адаптуй рівень складності до запиту.""",

    "brainstorming": """Ты — творчий мислитель та інноватор.
Генеруй:
- Оригінальні ідеї
- Нетрадиційні підходи
- Практичні рішення
- Інноваційні комбінації

Думай широко, але залишайся практичним.""",

    "code_security": """Ты — security експерт та penetration tester.
Аналізуй:
- Уразливості безпеки
- SQL Injection, XSS, CSRF
- Authentication/Authorization проблеми
- Encryption та compliance

Рекомендуй конкретні фіксу та best practices.""",
}


def get_prompt(
    prompt_type: str,
    **kwargs: Any,
) -> str:
    """Отримати форматований промпт.

    Args:
        prompt_type: Тип промпту (code_analysis, generate_docs, refactor_code)
        **kwargs: Змінні для форматування

    Returns:
        Форматований промпт
    """
    prompts = {
        "code_analysis": f"""Проведи детальний аналіз цього коду:

```{kwargs.get('language', 'python')}
{kwargs.get('code', '')}
```

Фокус аналізу: {kwargs.get('analysis_type', 'security')}

Видай результат у форматі JSON:
{{
    "issues": [
        {{"severity": "high|medium|low", "type": "...", "line": N, "description": "...", "fix": "..."}}
    ],
    "score": 0-100,
    "summary": "..."
}}""",

        "generate_docs": f"""Генеруй документацію для цього коду:

```{kwargs.get('language', 'python')}
{kwargs.get('code', '')}
```

Формат: {kwargs.get('style', 'docstring')}
Мова: українська

Вимоги:
- Опис функції/класу
- Параметри та їх типи
- Повернене значення
- Приклади використання
- Винятки (якщо є)""",

        "refactor_code": f"""Запропонуй рефакторинг цього коду:

```{kwargs.get('language', 'python')}
{kwargs.get('code', '')}
```

Цілі рефакторингу: {kwargs.get('objectives', 'readability')}

Видай результат JSON:
{{
    "original_code": "...",
    "refactored_code": "...",
    "improvements": ["...", "..."],
    "explanation": "...",
    "breaking_changes": false
}}""",
    }

    return prompts.get(prompt_type, f"Запит: {prompt_type}\n\nДані: {kwargs}")


# Промпти для специфічних задач
TASK_PROMPTS = {
    "security_audit": """Проведи security audit кодової бази PREDATOR Analytics.
Перевір:
1. Injection уразливості
2. Authentication/Authorization
3. Encryption та data protection
4. API security
5. Compliance requirements""",

    "performance_optimization": """Оптимізуй performance цього сервісу.
Аналізуй:
1. Database queries
2. Algorithm complexity
3. Memory usage
4. Network requests
5. Caching opportunities""",

    "architecture_review": """Проведи review архітектури PREDATOR.
Оцінь:
1. Scalability
2. Reliability
3. Maintainability
4. Security posture
5. Cost efficiency""",

    "test_generation": """Генеруй comprehensive test suite.
Включи:
1. Unit tests
2. Integration tests
3. Edge cases
4. Error handling
5. Performance tests""",
}
