# 🧊 Сервер резервування (NVIDIA Fallback Node)

Цей документ описує архітектуру перетворення NVIDIA на справжній Edge Node, який автоматично підхоплює роботу, якщо основний сервер (NVIDIA) стає недоступним.

## 🎯 Роль в архітектурі
```mermaid
graph TD
    MacBook[MacBook Pro (Control & Dev)]
    Router{Local Router / VPN}
    NVIDIA[NVIDIA Server (Primary AI Node)]
    NVIDIA[NVIDIA Server (Fallback Node)]

    MacBook -->|Active| Router
    Router -->|Primary Traffic| NVIDIA
    Router -.->|Failover Traffic| NVIDIA
    
    NVIDIA <==>|Syncthing (Data & Code)| NVIDIA
```

---

## 🔁 Синхронізація (Серце системи)
Основою безшовної інтеграції між NVIDIA та NVIDIA є **Syncthing** (P2P синхронізація без конфліктів).

- **Встановлення:** `brew install syncthing`
- **Директорії для синхронізації:**
  - `/opt/projects/predator` (Код і репозиторії)
  - `/opt/models/` (LLM моделі з Ollama/HuggingFace)
  - Певні Docker Volumes (через скрипти бекапів або безпосередньо, якщо підтримується).

---

## ⚙️ Execution Layer (Утиліти керування)

На NVIDIA створюється стандартизований набір скриптів, ідентичний серверу NVIDIA.

### `run-service.sh`
```bash
#!/bin/bash
echo "🚀 [PREDATOR] Starting fallback services on NVIDIA..."
docker compose up -d
```

### `health.sh`
```bash
#!/bin/bash
echo "📊 [PREDATOR] NVIDIA Health Check"
echo "CPU:"
top -l 1 | grep "CPU usage"
echo "Docker:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

---

## ⚡ Логіка Поведінки (Auto-Failover)

1. **🔴 NVIDIA впала (Відключення світла/мережі):**
   - MacBook автоматично починає відправляти запити (через DNS/Ingress) на IP адресу NVIDIA.
   - Оскільки Syncthing тримав файли актуальними, NVIDIA просто ініціалізує `docker compose up` або підіймає поди в `k3d`.
   - Розробка та інференс продовжуються.

2. **🟢 NVIDIA відновилась:**
   - Нові задачі повертаються на NVIDIA.
   - NVIDIA синхронізує будь-які зміни, зроблені під час його роботи як Primary, назад на NVIDIA через Syncthing.
   - NVIDIA повертається у режим очікування / Edge node.

---
**Статус:** Затверджено (v55.1). Далі — налаштування Primary AI Production Node (NVIDIA) та маршрутизації кластера.
