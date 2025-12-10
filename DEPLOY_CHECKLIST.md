# Чек-лист розгортання Predator Analytics

## MacBook (Dev) - Локальний кластер

- [ ] Перейти в репозиторій: `cd ~/Documents/predator-analytics`
- [ ] Перевірити наявність файлів: `git status`
- [ ] Запустити кластер: `./scripts/bootstrap_mac_minikube.sh`
- [ ] Зберегти пароль ArgoCD та kubeconfig
- [ ] Перевірити кластер: `kubectl get nodes` та `kubectl get pods -n argocd`
 - [ ] Зібрати діагностику кластера для детальної діагностики: `kubectl cluster-info dump --all-namespaces --output-directory=/tmp/k8s-dump` та стискати результат `tar -czf /tmp/k8s-dump.tar.gz -C /tmp k8s-dump` (зверніть увагу: dump може містити секрети; рекомендується використовувати `--exclude-secrets` у скрипті або очищати файл перед передачею)
- [ ] Застосувати Application: `kubectl apply -f argocd/predator-macbook.yaml -n argocd`
- [ ] Перевірити Application: `kubectl get applications.argoproj.io -n argocd`
- [ ] Перевірити nginx: `kubectl get pods -n predator-dev` та `kubectl get svc -n predator-dev`
- [ ] (Опційно) Відкрити ArgoCD UI: `kubectl port-forward svc/argocd-server -n argocd 8080:443`
- [ ] Закомітити зміни: `git add . && git commit -m "Init MacBook dev env" && git push origin main`

## NVIDIA (Prod) - Сервер з GPU

- [ ] Підключитися до сервера (фізично або через SSH, якщо працює)
- [ ] Клонувати репо: `git clone https://github.com/dima1203oleg/predator-analytics.git && cd predator-analytics`
- [ ] Запустити k3s: `./scripts/bootstrap_nvidia_k3s.sh`
- [ ] Зберегти пароль ArgoCD та kubeconfig
- [ ] Перевірити кластер: `kubectl get nodes` та `kubectl get pods -n argocd`
- [ ] **Налаштувати Self-Hosted Runner (для обходу проблем з SSH):**
    - Створити PAT токен на GitHub (Settings -> Developer settings -> Personal access tokens) з правами `repo`.
    - Запустити скрипт реєстрації:
      ```bash
      export GITHUB_OWNER="dima1203oleg"
      export GITHUB_REPO="predator-analytics"
      export GITHUB_PAT="ghp_ваш_токен"
      ./scripts/register_selfhosted_runner.sh --non-interactive
      ```
    - Перевірити, що раннер з'явився в Settings -> Actions -> Runners.
- [ ] Застосувати Application: `kubectl apply -f argocd/predator-nvidia.yaml -n argocd`
- [ ] Додати секрети в GitHub: `ARGOCD_NVIDIA_URL` та `ARGOCD_NVIDIA_TOKEN`
- [ ] Додати секрети в GitHub: `ARGOCD_NVIDIA_URL` та `ARGOCD_NVIDIA_TOKEN`
- [ ] (Опційно) Для автоматизації при піднятті тунелю встановіть: `AUTO_DEPLOY_ON_UP=true` і `AUTO_RESTART_NGROK=true` в `.env` або середовищі CI
- [ ] Запустити `./scripts/check_argocd_usage.sh` та перевірити чи ArgoCD доступний та налаштований (опційно для автоматизації)
 - [ ] Якщо ArgoCD має self-signed certs — налаштуйте `ARGOCD_INSECURE=true` в середовищі CI/локально (обережно!)
 - [ ] При проблемах з ngrok тунелем: запустіть `./scripts/check_ngrok_service.sh` (за замовчуванням `dev-ngrok`) щоб перевірити присутність `ngrok-ssh.service` та логи

## Oracle (Canary) - VM у хмарі

- [ ] Підключитися до VM: `ssh -i ~/.ssh/id_rsa ubuntu@<IP>`
- [ ] Клонувати репо: `git clone https://github.com/dima1203oleg/predator-analytics.git && cd predator-analytics`
- [ ] Запустити k3s: `./scripts/bootstrap_oracle_k3s.sh`
- [ ] Зберегти пароль ArgoCD та kubeconfig
- [ ] Перевірити кластер: `kubectl get nodes` та `kubectl get pods -n argocd`
- [ ] Застосувати Application: `kubectl apply -f argocd/predator-oracle.yaml -n argocd`
- [ ] Додати секрети в GitHub: `ARGOCD_ORACLE_URL` та `ARGOCD_ORACLE_TOKEN`

## Загальні перевірки

- [ ] Всі 3 кластери живі
- [ ] ArgoCD Applications створені
- [ ] GitHub Actions workflows готові
- [ ] Синхронізація з AI Studio працює: `./scripts/sync_from_ai_studio.sh`

### Container registry & GHCR

- [ ] Create a GitHub PAT with `packages:write` and save it as repo secret `GHCR_PAT` if you plan to push images to ghcr.io from GitHub Actions.
- [ ] Make sure all clusters have an imagePull secret for ghcr.io if your images are private. Use `kubectl create secret docker-registry` to create a `dockerconfigjson`-type secret and add its name to `environments/*/values.yaml` under `imagePullSecrets`.
## AI Studio → GitHub → ArgoCD → MacBook (minikube)

0. Передумови (перевірте перед початком)

- [ ] Локально є репозиторій `predator-analytics` (`cd ~/Documents/predator-analytics` + `git status`)
- [ ] Наявні файли/папки: `scripts/bootstrap_mac_minikube.sh`, `argocd/predator-macbook.yaml`, `environments/macbook/` (Chart.yaml, templates/, `values-mac.yaml`), `scripts/sync_from_ai_studio.sh`

1. Підняти кластер на MacBook (minikube + ArgoCD)

```bash
cd ~/Documents/predator-analytics
./scripts/bootstrap_mac_minikube.sh
```

- [ ] Дочекатися завершення скрипта (він збереже kubeconfig та пароль ArgoCD)
- [ ] Перевірити: `kubectl get nodes` та `kubectl get pods -n argocd`

2. Підключити ArgoCD Application для MacBook

```bash
kubectl apply -f argocd/predator-macbook.yaml -n argocd
kubectl get applications.argoproj.io -n argocd
```

- [ ] Перевірити, що `predator-macbook` з'явився (Synced / Healthy або OutOfSync → Synced)
	- ✅ predator-macbook is now Synced → Healthy (deployed from ai-sync/20251130_055839 → merged to main)

3. Перевірити деплой тестового nginx

```bash
kubectl get pods -n predator-dev
kubectl get svc -n predator-dev
# приклад port-forward
kubectl port-forward svc/<назва-сервісу> -n predator-dev 8081:80
```

- [ ] Перевірити, що nginx-под у `predator-dev` у статусі Running
- [ ] Відкрити `http://localhost:8081` і побачити стартову сторінку nginx

4. Налаштування Google AI Studio → GitHub

4.1. Підготувати папку для експорту

```bash
cd ~/Documents/predator-analytics
mkdir -p ai-export
```

4.2. Потік роботи

- Експортуєте проект з AI Studio у zip і розпаковуєте в `ai-export/`
- Запускаєте синхронізаційний скрипт:

```bash
./scripts/sync_from_ai_studio.sh
```

- [ ] Скрипт має скопіювати файли з `ai-export/` у `frontend/`, `backend/`, `environments/` (не зачіпати `.github/`, `argocd/`, `scripts/`), зробити `git add/commit/push`
- [ ] Після пушу ArgoCD автоматично підхопить зміни і перезадеплоїть застосунки

5. Перевірка після синхронізації

- [ ] `kubectl get pods -n predator-dev` — побачити перезапуск або нові релізи
- [ ] Перевірити ArgoCD UI (port-forward `svc/argocd-server -n argocd 8080:443`) — дивитись статуси і історію деплоїв

Примітка: поки що для локальної роботи GitHub Actions не потрібні секрети ARGOCD_MAC_* — ArgoCD сам підтягує зміни з GitHub. Секрети потрібні, якщо ви хочете, щоб GitHub Actions тригерив sync через ArgoCD API.