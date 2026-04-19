# 🧪 Гібридна Архітектура PREDATOR (NVIDIA + Colab Cluster)

Цей документ описує систему автоматичного резервування та синхронізації між основним сервером (NVIDIA) та резервним кластером на Google Colab.

## 🏗️ Схема Failover

1. **NVIDIA Server** (Primary): Основне середовище розрахунків.
2. **Google Colab Cluster** (Backup): Повний дублікат 8 баз даних, що працює паралельно.
3. **Synchronization**: NVIDIA періодично вивантажує дамп у Google Drive, Colab автоматично підтягує та відновлює дані.
4. **Auto-Failover**: UI на Mac моніторить доступність NVIDIA. Якщо сервер падає — UI миттєво перемикається на Colab через ZROK тунель.

## 🛠️ Налаштування

### 1. На стороні NVIDIA
Запустіть скрипт синхронізації:
```bash
bash deploy/scripts/push_to_colab_sync.sh
```
*Рекомендується додати в crontab для виконання кожні 15 хвилин.*

### 2. На стороні Google Colab
Відкрийте та запустіть всі клітинки в:
`deploy/colab/PREDATOR_8_DATABASES.ipynb`

Блокнот автоматично:
- Змонтує Google Drive.
- Відновить дані з останнього дампу.
- Запустить 8 баз даних.
- Створить стабільний тунель `https://predator.share.zrok.io`.

### 3. На стороні UI (Mac)
Frontend автоматично розпізнає падіння сервера та змінить `VITE_API_URL` на резервний.

## 📋 Стек Резервного Кластера (8 DBs)
- **PostgreSQL 16** (Центральна БД)
- **Neo4j 5** (Графова аналітика)
- **Redis 7** (Кеш та черги)
- **OpenSearch 2.12** (Пошуковий рушій)
- **Qdrant 1.8** (Векторна пам'ять)
- **MinIO** (S3 сховище)
- **Kafka** (Потокова передача)
- **Ollama** (Локальний ШІ як бекап)
- **K3s** (Kubernetes Cluster for Mirroring)

## ☸️ Інтеграція з Kubernetes Panel (IDE)

Щоб бачити Colab у панелі Kubernetes вашого IDE:

1. **Запустіть K3s у Colab**:
   В блокноті додайте клітинку:
   ```bash
   curl -sfL https://get.k3s.io | sh -s - --write-kubeconfig-mode 644
   zrok reserve public localhost:6443 --name colab-k8s
   zrok share reserved colab-k8s --headless
   ```

2. **На Mac**:
   Отримайте `kubeconfig` з Colab (через Google Drive або `cat` в терміналі) та змініть `server: https://127.0.0.1:6443` на адресу вашого ZROK тунелю: `https://colab-k8s.share.zrok.io`.

3. **Додайте в ~/.kube/config**:
   Додайте нову секцію `context` для `PREDATOR-COLAB`. Тепер він з'явиться в панелі "Kubernetes" (ms-kubernetes-tools).

---
**v56.4-ELITE** | *Sovereign Intelligence Systems*
