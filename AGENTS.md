# Рекомендовані помічники / агенти для Predator v22.0

Це набір agent/assistant рекомендацій, які допомагають автоматизувати рутинні задачі та підвищити швидкість розробки.

## 1) Dev Assist (GitHub Copilot + Copilot Chat)
- Використання Copilot + Copilot Chat у VS Code для надання контекстних підказок та автогенерації тестів.
- Налаштування: `GitHub.copilot`, `GitHub.copilot-chat` у `.vscode/extensions.json`.

## 2) Repo Maintenance Agent (GH Actions + Dependabot)
- Dependabot для автопоновлення залежностей.
- CI агенти у GitHub Actions для лінтінгу, тестування та сканування вразливостей (Trivy/TruffleHog).

## 3) Secret Prevention/Scan Agent
- TruffleHog + detect-secrets у CI.
- Pre-commit hook з detect-secrets для локального сканування.

## 4) Infra & Cost Agent
- Kubecost (policy/alerts) → автоматичні дії (scale-down) по порогу бюджету.
- Observability agent (Prometheus exporter) для моделей.

## 5) Self-Improve Orchestrator (SIO)
- Агент контролює цикли self-improvement: Auto-diagnose → Augment → Train → Evaluate → Promote
- Policy engine для контролю Auto-Promote (requires manual approval triggers for production)

## 6) Test Automation Agent
- Cypress Runner + scheduling job (nightly) to run E2E and backup regression tests.

