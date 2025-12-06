# 🚀 Unified Launch Guide: Predator Analytics v21.0

Цей гайд описує процес запуску платформи на всіх етапах: від локальної розробки на Mac до продакшну на сервері.

## 🌍 Матриця Середовищ

| Середовище | Призначення | Інструменти | Команда запуску |
|------------|-------------|-------------|-----------------|
| **Local (Mac)** | Розробка, швидкі тестування | Docker Compose | `make up` |
| **Oracle (Dev)** | Інтеграційні тести, GitOps | K3s + Helm (Dev) | `make helm-dev` |
| **Server (Prod)** | Бойова експлуатація | K3s + Helm (Prod) | `make helm-prod` |

---

## 🛠 1. Local Development (Mac)

**Вимоги:**
*   Docker Desktop / OrbStack
*   Make
*   Python 3.11+

**Кроки:**
1.  **Клонування та налаштування:**
    ```bash
    git clone <repo_url>
    cd predator-analytics
    cp .env.example .env
    ```

2.  **Запуск платформи:**
    ```bash
    make up
    ```
    *   Frontend: [http://localhost:3000](http://localhost:3000) (або 80)
    *   Backend API: [http://localhost:8000/docs](http://localhost:8000/docs)
    *   Postgres: `localhost:5432`
    *   OpenSearch: `localhost:9200`
    *   Qdrant: `localhost:6333`

3.  **Перезапуск сервісів (при зміні коду):**
    ```bash
    make build  # Перезбірка
    make up     # Перезапуск
    ```

4.  **Зупинка:**
    ```bash
    make down
    ```

---

## ☁️ 2. Oracle Cloud (Dev/Staging)

**Вимоги:**
*   Кластер K3s встановлено.
*   `kubectl` налаштовано на цей кластер (`~/.kube/config`).
*   Helm 3 встановлено.

**Кроки:**
1.  **Перевірка з'єднання:**
    ```bash
    kubectl get nodes
    ```

2.  **Деплой (через Makefile):**
    ```bash
    make helm-dev
    ```
    Це встановить chart `infra/helm/umbrella` з файлом `values-dev.yaml`.

3.  **Перевірка статусів подів:**
    ```bash
    kubectl get pods -n semantic-search-dev
    ```

4.  **Доступ (Port-forwarding):**
    Якщо Ingress не налаштовано публічно:
    ```bash
    kubectl port-forward svc/predator-frontend 8080:80 -n semantic-search-dev
    ```
    Відкрити [http://localhost:8080](http://localhost:8080).

---

## 🏢 3. Main Server (Production)

**Вимоги:**
*   Потужний сервер з K3s.
*   Налаштований Ingress Controller (Traefik/Nginx).
*   Cert-manager (для HTTPS).
*   ArgoCD (рекомендовано для Prod) АБО Helm.

**Варіант А: Ручний Helm Deploy (для початкового старту):**
```bash
make helm-prod
```
Це застосує `values-prod.yaml` (ресурси, репліки, scaling).

**Варіант Б: GitOps (ArgoCD) - Рекомендовано:**
1.  Встановіть ArgoCD.
2.  Застосуйте маніфест Application:
    ```bash
    kubectl apply -f infra/argocd/apps/app-prod.yaml
    ```
3.  ArgoCD автоматично сінхронізує стан кластера з Git-репозиторієм (`infra/helm/umbrella`).

---

## 🔍 Troubleshooting

### Логи
*   **Local:** `make logs`
*   **K8s:** `kubectl logs -l app=predator-backend -n semantic-search-dev`

### База даних
*   **Local SQL connect:**
    ```bash
    docker exec -it predator_postgres psql -U predator -d predator_db
    ```

### Reindexing
Якщо треба переіндексувати дані:
1.  Зайдіть в под `indexer`.
2.  Запустіть скрипт: `python app/main.py --reindex-all` (приклад).

---

## 📚 Корисні команди Makefile

*   `make test` - Запуск unit-тестів бекенду.
*   `make lint` - Перевірка якості коду.
*   `make clean` - Очистка тимчасових файлів.
