# 🧪 SYSTEM VERIFICATION SUITE (Mixed CLI Stack v45.0)

Цей протокол призначений для перевірки працездатності канонічного CLI-стеку після розгортання.

## 1. Рівень 1: Planner (Gemini 2.5)
**Завдання:** Перевірити стратегічне планування та генерацію JSON-плану.
**Команда:**
```bash
python3 scripts/triple_cli.py --agent planner "Analyze system logs for OOM errors"
```
**Критерій успіху:** Отримано валідний JSON з описом задачі та кроками.

## 2. Рівень 2: Codegen (Mistral Vibe)
**Завдання:** Перевірити генерацію Python-коду.
**Команда:**
```bash
python3 scripts/triple_cli.py --agent codegen '{"description": "Create a script to clean logs folder"}'
```
**Критерій успіху:** Отримано чистий Python-код з імпортами та логуванням.

## 3. Рівень 3: Review (Aider)
**Завдання:** Перевірити автоматичне рев'ю файлу.
**Команда:**
```bash
echo "def test(): print('hi')" > test_review.py
python3 scripts/triple_cli.py --agent review --file test_review.py "Add docstrings and type hints"
```
**Критерій успіху:** Файл `test_review.py` змінено, додано документацію.

## 4. Рівень 4: Fallback (Ollama)
**Завдання:** Перевірити роботу при недоступності API (симуляція).
**Команда:**
```bash
GEMINI_API_KEY=invalid_key python3 scripts/triple_cli.py --agent planner "Quick check"
```
**Критерій успіху:** Повідомлення `⚠️ FALLBACK MODE: PLANNER → OLLAMA` та отримання результату від локальної моделі.

## 5. Інтеграція: Telegram Bot
**Завдання:** Перевірити виклик AiderAgent через бота.
**Послідовність:**
1. Написати боту: "Виправ помилку в generated_script.py"
2. Перевірити логи контейнера `predator_telegram_bot` на наявність виклику `aider`.

---
*Status: Ready to execute after build completion.*
