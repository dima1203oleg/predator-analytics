# 🦁 Predator Analytics - Linting & Static Analysis Stack

> Ultra-fast, modern tooling for Python and TypeScript/JavaScript

## 📦 Інструменти

| Інструмент | Мова | Призначення | Швидкість |
|-----------|------|-------------|-----------|
| **Ruff** | Python | Linting + Formatting | ⚡ 10-100x швидше flake8 |
| **Pyrefly** | Python | Type Checking | ⚡ Rust-based |
| **OxLint** | TS/JS | Linting | ⚡ 50-100x швидше ESLint |
| **Knip** | TS/JS | Dead code detection | ⚡ Parallel execution |

## 🚀 Швидкий старт

### Встановлення залежностей

```bash
# Node.js/pnpm залежності (oxlint, knip)
pnpm install

# Python залежності (ruff, pyrefly)
pip install ruff pyrefly

# Pre-commit hooks
pre-commit install
```

### Запуск

```bash
# === PYTHON ===
pnpm py:lint        # Перевірка Python коду
pnpm py:lint:fix    # Автоматичне виправлення
pnpm py:format      # Форматування коду
pnpm py:type        # Перевірка типів (Pyrefly)
pnpm py:all         # Все разом

# === TYPESCRIPT/JAVASCRIPT ===
pnpm lint:ox        # OxLint перевірка
pnpm lint:ox:fix    # OxLint з автофіксом
pnpm lint:knip      # Пошук мертвого коду
pnpm lint:knip:fix  # Видалення невикористаного
pnpm lint:all       # Все для JS/TS

# === PRE-COMMIT ===
pre-commit run --all-files  # Запуск всіх перевірок
```

## 📁 Конфігураційні файли

```
Predator_21/
├── ruff.toml           # Ruff: linting + formatting Python
├── pyrefly.toml        # Pyrefly: статичний аналіз типів Python
├── oxlint.json         # OxLint: linting TypeScript/JavaScript
├── knip.json           # Knip: пошук невикористаного коду
└── .pre-commit-config.yaml  # Pre-commit hooks для всіх інструментів
```

## ⚙️ Ruff (Python)

Найшвидший Python linter & formatter у світі. Замінює:
- flake8, pylint, pycodestyle, pyflakes
- isort (сортування імпортів)
- black (форматування)
- autoflake, autopep8

### Правила що включені:

| Категорія | Коди | Опис |
|-----------|------|------|
| Errors | E | pycodestyle errors |
| Warnings | W | pycodestyle warnings |
| Pyflakes | F | Unused imports, variables |
| isort | I | Import sorting |
| Naming | N | PEP 8 naming |
| Security | S | bandit security checks |
| Bugbear | B | Common bugs |
| Performance | PERF | Performance hints |
| Upgrade | UP | Python modernization |

### Приклад використання:

```bash
# Повна перевірка
ruff check --config ruff.toml .

# З автофіксом
ruff check --config ruff.toml --fix .

# Форматування (як Black)
ruff format --config ruff.toml .

# Перевірка одного файлу
ruff check --config ruff.toml services/api-gateway/app/main.py
```

## 🔥 Pyrefly (Python Type Checking)

Rust-based type checker для Python. Альтернатива mypy, але швидший.

### Рівні строгості:

| Рівень | Опис |
|--------|------|
| `basic` | Мінімальні перевірки |
| `standard` | Балансована перевірка (default) |
| `strict` | Повна типізація |
| `all` | Максимальна строгість |

```bash
# Перевірка типів
pyrefly check

# Конкретна директорія
pyrefly check services/api-gateway/app/
```

## ⚡ OxLint (TypeScript/JavaScript)

Rust-based linter в 50-100x швидший за ESLint.

### Категорії правил:

| Категорія | Опис |
|-----------|------|
| `correctness` | Помилки що ламають код |
| `suspicious` | Підозрілий код |
| `style` | Стиль коду |
| `pedantic` | Додаткові перевірки |
| `react` | React-специфічні правила |
| `react-hooks` | Правила React Hooks |
| `jsx-a11y` | Accessibility |
| `typescript` | TypeScript правила |
| `unicorn` | Сучасний JavaScript |

```bash
# Перевірка
oxlint --config oxlint.json apps/predator-analytics-ui/src/

# З автофіксом
oxlint --config oxlint.json --fix apps/predator-analytics-ui/src/

# Конкретний файл
oxlint --config oxlint.json src/App.tsx
```

## 🔍 Knip (Dead Code Detection)

Знаходить невикористаний код, залежності, exports.

### Що шукає:

- 📦 Невикористані dependencies
- 📦 Невикористані devDependencies
- 📁 Файли без імпортів
- 🔗 Невикористані exports
- 🏷️ Невикористані типи
- 🗑️ Дублікати

```bash
# Пошук невикористаного
knip

# Автоматичне видалення
knip --fix

# Детальний вивід
knip --reporter detailed
```

## 🔗 Pre-commit Integration

Всі інструменти інтегровані в pre-commit hooks:

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    hooks:
      - id: ruff
      - id: ruff-format
  - repo: local
    hooks:
      - id: oxlint
```

### Команди:

```bash
# Встановити hooks
pre-commit install

# Запуск на всіх файлах
pre-commit run --all-files

# Запуск конкретного hook
pre-commit run ruff --all-files
pre-commit run oxlint --all-files

# Оновити версії hooks
pre-commit autoupdate
```

## 📊 CI/CD Integration

### GitHub Actions приклад:

```yaml
# .github/workflows/lint.yml
name: Lint

on: [push, pull_request]

jobs:
  python:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/ruff-action@v1
        with:
          args: "check --config ruff.toml"

  typescript:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install -g oxlint
      - run: oxlint --config oxlint.json apps/predator-analytics-ui/src/
```

## 🎯 Рекомендації

1. **Завжди використовуй pre-commit** - автоматична перевірка перед commit
2. **Налаштуй IDE** - встанови extensions для Ruff та OxLint
3. **CI/CD** - додай перевірки в pipeline
4. **Поступово вмикай правила** - не вмикай все одразу на legacy проекті

## 🔧 Troubleshooting

### Ruff не знаходить конфіг
```bash
ruff check --config ./ruff.toml .
```

### OxLint повільно працює
```bash
# Вкажи конкретну директорію
oxlint --config oxlint.json src/
```

### Knip знаходить false positives
```json
// knip.json
{
  "ignoreDependencies": ["@types/node"]
}
```

---

**🦁 Predator Analytics** - Autonomous Intelligence Platform
