# 📚 Довідник скриптів розгортання PREDATOR Analytics v55

Цей документ описує всі доступні скрипти для управління локальним k3s кластером фронтенду.

## 🚀 Основні скрипти

### `quickstart.sh` — Швидкий старт (рекомендується)
**Призначення**: Одна команда для повного розгортання фронтенду  
**Час виконання**: 5-10 хвилин  
**Що робить**:
- ✅ Перевіряє передумови (k3d, kubectl, helm, docker, git)
- ✅ Створює/запускає k3d кластер
- ✅ Встановлює ArgoCD
- ✅ Розгортає фронтенд через Helm
- ✅ Перевіряє розгортання

**Використання**:
```bash
cd deploy/scripts
./quickstart.sh
```

**Результат**:
```
✅ Frontend доступний за адресою: http://localhost:3030
```

---

### `deploy_local_k3d.sh` — Створення k3d кластера
**Призначення**: Ручне створення та налаштування k3d кластера  
**Час виконання**: 3-5 хвилин  
**Що робить**:
- ✅ Створює k3d кластер `predator-local`
- ✅ Налаштовує port mappings (80, 443, 3030)
- ✅ Встановлює ArgoCD
- ✅ Застосовує ArgoCD Application manifests
- ✅ Виводить інструкції доступу

**Використання**:
```bash
./deploy_local_k3d.sh
```

**Вихідні дані**:
```
🎉 PREDATOR Analytics v55 is deploying via ArgoCD!
📍 Frontend URL: http://localhost:3030
🔑 ArgoCD Admin Password: [password]
🌐 ArgoCD UI: kubectl port-forward svc/argocd-server -n argocd 8080:443
```

---

### `sync_frontend_local.sh` — Синхронізація фронтенду
**Призначення**: Локальна побудова та розгортання фронтенду  
**Час виконання**: 2-3 хвилини  
**Що робить**:
- ✅ Будує Docker образ локально
- ✅ Завантажує образ у k3d
- ✅ Розгортає через Helm
- ✅ Чекає готовності deployment

**Використання**:
```bash
./sync_frontend_local.sh
```

**Коли використовувати**:
- Після локальних змін у коді фронтенду
- Для оновлення образу у k3d кластері
- Для тестування локальних змін

---

## 🔄 Управління розгортанням

### `restart_frontend_local.sh` — Перезапуск фронтенду
**Призначення**: Перезапуск frontend pods без перебудови образу  
**Час виконання**: 30 секунд - 1 хвилина  
**Що робить**:
- ✅ Видаляє поточні pods
- ✅ Kubernetes автоматично створює нові
- ✅ Чекає готовності

**Використання**:
```bash
./restart_frontend_local.sh
```

**Коли використовувати**:
- Для швидкого перезапуску без перебудови
- При проблемах з контейнером
- Для очищення стану

---

### `watch_frontend.sh` — Моніторинг в реальному часі
**Призначення**: Спостереження за змінами frontend pods  
**Час виконання**: Безперервно (Ctrl+C для виходу)  
**Що показує**:
- ✅ Статус pods (Running, Pending, CrashLoopBackOff)
- ✅ Останні события
- ✅ Оновлення кожні 5 секунд

**Використання**:
```bash
./watch_frontend.sh
```

**Приклад виходу**:
```
=== Frontend Pods ===
NAME                              READY   STATUS    RESTARTS
predator-frontend-5d4f7c8b9-abc   1/1     Running   0
predator-frontend-5d4f7c8b9-def   1/1     Running   0

=== Recent Events ===
deployment/predator-frontend scaled up to 2
pod/predator-frontend-5d4f7c8b9-abc created
```

---

### `scale.sh` — Управління масштабуванням
**Призначення**: Інтерактивне масштабування frontend pods  
**Час виконання**: Миттєво  
**Опції**:
1. Scale to 1 replica (мінімум)
2. Scale to 2 replicas (за замовчуванням)
3. Scale to 3 replicas
4. Scale to 5 replicas (максимум)
5. Custom number
6. View HPA status
7. Exit

**Використання**:
```bash
./scale.sh
```

**Приклад**:
```
Select scaling option:
1) Scale to 1 replica
2) Scale to 2 replicas
...
Enter choice (1-7): 3
Scaling to 3 replicas...
✅ Scaled to 3 replicas
```

---

### `logs.sh` — Перегляд логів
**Призначення**: Інтерактивний перегляд логів  
**Опції**:
1. Frontend pods (all)
2. Frontend pod (latest)
3. Frontend deployment
4. ArgoCD server
5. All predator namespace
6. Exit

**Використання**:
```bash
./logs.sh
```

**Приклад**:
```
Select log source:
1) Frontend pods (all)
...
Enter choice (1-6): 1
📊 Frontend pods logs (all):
[logs output...]
```

---

## 🧪 Тестування

### `verify_deployment.sh` — Перевірка розгортання
**Призначення**: Комплексна перевірка всіх компонентів  
**Час виконання**: 1-2 хвилини  
**Перевіряє**:
- ✅ k3d кластер запущений
- ✅ Kubernetes namespace існують
- ✅ Frontend deployment готовий
- ✅ Pods здорові
- ✅ Service доступний
- ✅ Security context налаштований
- ✅ Resource limits встановлені
- ✅ Health checks працюють
- ✅ HPA налаштований
- ✅ ArgoCD синхронізує

**Використання**:
```bash
./verify_deployment.sh
```

**Вихідні дані**:
```
✅ Cluster Status:
✅ k3d cluster running
✅ kubectl accessible
...
📈 Summary:
   Passed: 25
   Failed: 0
✅ All checks passed!
```

---

### `test_e2e.sh` — End-to-End тестування
**Призначення**: Детальне тестування всіх аспектів розгортання  
**Час виконання**: 2-3 хвилини  
**Фази тестування**:
1. Cluster Setup
2. Frontend Deployment
3. Pod Health
4. Service Connectivity
5. Security
6. Resource Limits
7. Health Checks
8. Autoscaling
9. ArgoCD Integration
10. Image Configuration
11. Volume Mounts
12. Port Configuration

**Використання**:
```bash
./test_e2e.sh
```

**Вихідні дані**:
```
[Phase 1] Cluster Setup
Testing: k3d cluster exists... ✅ PASSED
...
📊 Test Summary:
   Passed: 45
   Failed: 0
✅ All tests passed!
```

---

### `test_docker_image.sh` — Тестування Docker образу
**Призначення**: Локальне тестування Docker образу перед розгортанням  
**Час виконання**: 2-3 хвилини  
**Що робить**:
- ✅ Будує Docker образ
- ✅ Запускає контейнер
- ✅ Тестує health endpoint
- ✅ Перевіряє non-root user
- ✅ Перевіряє nginx процес
- ✅ Перевіряє файлові дозволи

**Використання**:
```bash
./test_docker_image.sh
```

**Вихідні дані**:
```
🐳 PREDATOR Analytics Frontend Docker Image Test
[Step 1/4] Building Docker image...
✅ Docker image built successfully
...
✅ Docker image test complete!
🎉 Image is ready for deployment!
```

---

## 🗑️ Очищення та обслуговування

### `cleanup.sh` — Повне очищення
**Призначення**: Видалення всіх ресурсів k3d кластера  
**Час виконання**: 2-3 хвилини  
**Що видаляє**:
- ✅ Kubernetes namespaces (predator, argocd)
- ✅ k3d кластер
- ✅ Docker образи
- ✅ kubectl context

**Використання**:
```bash
./cleanup.sh
```

**Запит підтвердження**:
```
Are you sure you want to cleanup? This will delete the k3d cluster and all data. (yes/no): yes
```

**Коли використовувати**:
- Для повного видалення локального середовища
- Перед новим розгортанням
- Для звільнення ресурсів

---

## 📋 Сценарії використання

### Сценарій 1: Перший запуск
```bash
# Одна команда для всього
./quickstart.sh

# Результат: Frontend доступний за http://localhost:3030
```

### Сценарій 2: Локальна розробка з гарячим перезапуском
```bash
# Термінал 1: Спостереження за змінами
./watch_frontend.sh

# Термінал 2: Після змін у коді
./sync_frontend_local.sh

# Результат: Frontend оновлений з новим кодом
```

### Сценарій 3: Тестування масштабування
```bash
# Перегляд поточного стану
./verify_deployment.sh

# Масштабування до 5 реплік
./scale.sh
# Вибрати опцію 4

# Спостереження за масштабуванням
./watch_frontend.sh
```

### Сценарій 4: Налагодження проблем
```bash
# Перевірка розгортання
./verify_deployment.sh

# Перегляд логів
./logs.sh

# Перезапуск frontend
./restart_frontend_local.sh

# Повторна перевірка
./verify_deployment.sh
```

### Сценарій 5: Очищення та новий старт
```bash
# Видалення всього
./cleanup.sh

# Новий старт
./quickstart.sh
```

---

## 🔧 Розширені команди kubectl

### Перегляд ресурсів
```bash
# Всі ресурси в predator namespace
kubectl get all -n predator

# Тільки frontend pods
kubectl get pods -n predator -l app=frontend

# Детальна інформація про pod
kubectl describe pod -n predator -l app=frontend

# Ресурси, які використовуються
kubectl top pods -n predator -l app=frontend
```

### Управління deployment
```bash
# Перезапуск deployment
kubectl rollout restart deployment/predator-frontend -n predator

# Перегляд історії розгортання
kubectl rollout history deployment/predator-frontend -n predator

# Повернення до попередної версії
kubectl rollout undo deployment/predator-frontend -n predator
```

### Доступ до контейнера
```bash
# Shell доступ до контейнера
kubectl exec -it -n predator $(kubectl get pod -n predator -l app=frontend -o jsonpath='{.items[0].metadata.name}') -- sh

# Виконання команди в контейнері
kubectl exec -n predator <pod-name> -- nginx -t
```

### Port forwarding
```bash
# Frontend
kubectl port-forward -n predator svc/predator-frontend 3030:80

# ArgoCD UI
kubectl port-forward -n argocd svc/argocd-server 8080:443
```

---

## 📊 Моніторинг та метрики

### Перегляд метрик
```bash
# CPU та Memory використання
kubectl top pods -n predator -l app=frontend

# HPA статус
kubectl get hpa -n predator

# Детальна інформація про HPA
kubectl describe hpa -n predator predator-frontend
```

### Логи та события
```bash
# Логи з останніх 100 рядків
kubectl logs -n predator -l app=frontend --tail=100

# Логи в реальному часі
kubectl logs -n predator -l app=frontend -f

# Події в namespace
kubectl get events -n predator --sort-by='.lastTimestamp'
```

---

## 🆘 Розв'язання проблем

### Frontend не доступний
```bash
# Перевірити pods
kubectl get pods -n predator -l app=frontend

# Перевірити логи
./logs.sh

# Перезапустити
./restart_frontend_local.sh

# Перевірити знову
./verify_deployment.sh
```

### Pods не запускаються
```bash
# Детальна інформація
kubectl describe pod -n predator -l app=frontend

# Логи контейнера
kubectl logs -n predator -l app=frontend --previous

# Перевірити image
kubectl get pod -n predator -l app=frontend -o jsonpath='{.items[0].spec.containers[0].image}'
```

### Масштабування не працює
```bash
# Перевірити HPA
kubectl get hpa -n predator

# Перевірити метрики
kubectl top pods -n predator -l app=frontend

# Перевірити metrics-server
kubectl get deployment -n kube-system metrics-server
```

---

## 📚 Додаткові ресурси

- **Документація**: `deploy/LOCAL_FRONTEND_DEPLOYMENT.md`
- **Helm Chart**: `deploy/helm/predator/`
- **ArgoCD Manifests**: `deploy/argocd/predator/`
- **Dockerfile**: `apps/predator-analytics-ui/Dockerfile`
- **Nginx Config**: `apps/predator-analytics-ui/nginx.conf`
- **GitHub Actions**: `.github/workflows/frontend-ci-cd.yml`

---

**Версія**: v55.0.0  
**Останнє оновлення**: 2026-03-12  
**Автор**: PREDATOR Analytics Team
