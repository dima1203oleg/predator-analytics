# 🧊 Сервер резервування (iMac Fallback Node)

Цей документ описує архітектуру перетворення iMac на справжній Edge Node, який автоматично підхоплює роботу, якщо основний сервер (NVIDIA) стає недоступним.

## 🎯 Роль в архітектурі
```mermaid
graph TD
    MacBook[MacBook Pro (Control & Dev)]
    Router{Local Router / VPN}
    NVIDIA[NVIDIA Server (Primary AI Node)]
    iMac[iMac Server (Fallback Node)]

    MacBook -->|Active| Router
    Router -->|Primary Traffic| NVIDIA
    Router -.->|Failover Traffic| iMac
    
    NVIDIA <==>|Syncthing (Data & Code)| iMac
```

---

## 🔁 Синхронізація (Серце системи)
Основою безшовної інтеграції між NVIDIA та iMac є **Syncthing** (P2P синхронізація без конфліктів).

- **Встановлення:** `brew install syncthing`
- **Директорії для синхронізації:**
  - `/opt/projects/predator` (Код і репозиторії)
  - `/opt/models/` (LLM моделі з Ollama/HuggingFace)
  - Певні Docker Volumes (через скрипти бекапів або безпосередньо, якщо підтримується).

---

## ⚙️ Execution Layer (Утиліти керування)

На iMac створюється стандартизований набір скриптів, ідентичний серверу NVIDIA.

### `run-service.sh`
```bash
#!/bin/bash
echo "🚀 [PREDATOR] Starting fallback services on iMac..."
docker compose up -d
```

### `health.sh`
```bash
#!/bin/bash
echo "📊 [PREDATOR] iMac Health Check"
echo "CPU:"
top -l 1 | grep "CPU usage"
echo "Docker:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

---

## ⚡ Логіка Поведінки (Auto-Failover)

1. **🔴 NVIDIA впала (Відключення світла/мережі):**
   - MacBook автоматично починає відправляти запити (через DNS/Ingress) на IP адресу iMac.
   - Оскільки Syncthing тримав файли актуальними, iMac просто ініціалізує `docker compose up` або підіймає поди в `k3d`.
   - Розробка та інференс продовжуються.

2. **🟢 NVIDIA відновилась:**
   - Нові задачі повертаються на NVIDIA.
   - iMac синхронізує будь-які зміни, зроблені під час його роботи як Primary, назад на NVIDIA через Syncthing.
   - iMac повертається у режим очікування / Edge node.

---
**Статус:** Затверджено (v55.1). Далі — налаштування Primary AI Production Node (NVIDIA) та маршрутизації кластера.
