<div align="center">

<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

  <h1>Built with AI Studio</h2>

  <p>The fastest path from prompt to production with Gemini.</p>

  <a href="https://aistudio.google.com/apps">Start building</a>

</div>

# Predator Analytics v18.4

GitOps-розгортання для Predator Analytics з підтримкою 3 середовищ: MacBook (dev), NVIDIA (prod), Oracle (canary).

## Структура проекту

- `argocd/` — ArgoCD Application manifests для кожного середовища.
- `.github/workflows/` — GitHub Actions workflows для CI/CD.
- `scripts/` — Bash-скрипти для ініціалізації кластерів та синхронізації.
- `environments/` — Helm-чарти для кожного середовища (macbook, nvidia, oracle).

## Початок роботи

### 1. MacBook (Dev)

1. Запусти кластер:
   ```bash
   ./scripts/bootstrap_mac_minikube.sh
   ```

2. Застосуй ArgoCD Application:
   ```bash
   kubectl apply -f argocd/predator-macbook.yaml -n argocd
   ```

3. Додай секрети в GitHub: `ARGOCD_MAC_URL` та `ARGOCD_MAC_TOKEN`.

4. Закоміть зміни та спостерігай за деплой у GitHub Actions.

### 2. NVIDIA (Prod)

1. На NVIDIA-сервері:
   ```bash
   ./scripts/bootstrap_nvidia_k3s.sh
   ```

2. Додай секрети в GitHub: `ARGOCD_NVIDIA_URL` та `ARGOCD_NVIDIA_TOKEN`.

3. Застосуй Application та workflows аналогічно.

### 3. Oracle (Canary)

1. На Oracle-сервері:
   ```bash
   ./scripts/bootstrap_oracle_k3s.sh
   ```

2. Додай секрети в GitHub: `ARGOCD_ORACLE_URL` та `ARGOCD_ORACLE_TOKEN`.

3. Застосуй Application та workflows аналогічно.

## Синхронізація з AI Studio

Після експорту коду з Google AI Studio у папку `ai-export/`:
```bash
./scripts/sync_from_ai_studio.sh
```

Це автоматично закомітить та запустить деплой.


## Автоматизація та безпека (autofix loop)

- Всі autofix PR створюються у гілку `autofix/staging`.
- Автоматичне злиття (automerge) контролюється змінною репозиторію `ALLOW_AUTO_MERGE` (за замовчуванням вимкнено).
- Захист від видалення Helm-чартів: будь-які патчі, що видаляють `Chart.yaml` або `templates/`, блокуються.
- Для перевірки секретів/змінних використовуйте workflow `.github/workflows/secrets-checker.yml` (ручний запуск).
- Для тестування autofix-циклу використовуйте `.github/workflows/autofix-loop-test.yml` або `.github/workflows/autofix-end-to-end-test.yml` (ручний запуск).

## Налаштування

- Helm values у `environments/*/values.yaml`.
- ArgoCD Applications у `argocd/*.yaml`.
- Workflows у `.github/workflows/*.yml`.

