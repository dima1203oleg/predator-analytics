# 🛠️ Налаштування Середовища Розробника — PREDATOR v56.5-ELITE

> **ТЗ актуалізовано:** 23 квітня 2026 року  
> Цей документ є **єдиним джерелом істини** щодо вимог до середовища розробника на macOS.  
> Усі інструменти мають бути встановлені у вказаному порядку.

---

## 📋 Зміст

1. [Основні інструменти розробки](#-1-основні-інструменти-розробки)
2. [Контейнеризація та оркестрація](#-2-контейнеризація-та-оркестрація)
3. [Мови та фреймворки](#-3-мови-та-фреймворки)
4. [Додаткові інструменти](#-4-додаткові-інструменти)
5. [Обов'язкові кроки після встановлення](#-5-обовязкові-кроки-після-встановлення)
6. [Перевірка готовності середовища](#-6-перевірка-готовності-середовища)

---

## 🔧 1. Основні інструменти розробки

### Homebrew (v4.2+) — Перший крок!

Homebrew є фундаментом для встановлення всього іншого ПЗ. Встановіть його **першим**.

```bash
# Перевірка поточної версії (якщо вже встановлено)
brew --version

# Встановлення Homebrew (якщо відсутній)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Після встановлення на Apple Silicon (M1/M2/M3) — додати до PATH
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
source ~/.zshrc
```

> [!IMPORTANT]
> На Apple Silicon (M1/M2/M3) Homebrew встановлюється у `/opt/homebrew`.  
> На Intel Mac — у `/usr/local`. Перевірте архітектуру: `uname -m`

---

### Git (Остання стабільна версія)

```bash
# Встановлення через Homebrew (отримаємо актуальнішу версію, ніж системна)
brew install git

# Перевірка версії
git --version

# Обов'язкове налаштування ідентичності (КРИТИЧНО для ACP-протоколу)
git config --global user.name  "Ваше Ім'я"
git config --global user.email "your@email.com"

# Додаткові рекомендовані налаштування
git config --global init.defaultBranch main
git config --global pull.rebase true
git config --global core.autocrlf input
```

> [!WARNING]
> `user.name` та `user.email` є обов'язковими. Без них неможливий **Autonomous Commit Protocol (ACP)**.

---

### VS Code (v1.85+)

Встановіть вручну з офіційного сайту: [code.visualstudio.com](https://code.visualstudio.com/)

Або через Homebrew Cask:
```bash
brew install --cask visual-studio-code
```

#### Обов'язкові розширення для PREDATOR:

```bash
# Встановлення через CLI (після того, як `code` є в PATH)
code --install-extension ms-python.python
code --install-extension ms-python.pylance
code --install-extension charliermarsh.ruff
code --install-extension ms-azuretools.vscode-docker
code --install-extension ms-kubernetes-tools.vscode-kubernetes-tools
code --install-extension dbaeumer.vscode-eslint
code --install-extension bradlc.vscode-tailwindcss
code --install-extension esbenp.prettier-vscode
code --install-extension eamodio.gitlens
```

> [!TIP]
> Щоб `code` команда працювала в терміналі: відкрийте VS Code → `⇧⌘P` → введіть `Shell Command: Install 'code' command in PATH`.

---

## 🐳 2. Контейнеризація та оркестрація

### Rancher Desktop (v1.12+) — Замість Docker Desktop

**Rancher Desktop** — основний інструмент для управління контейнерами та Kubernetes на macOS. Надає Docker CLI та kubectl безкоштовно.

```bash
# Встановлення через Homebrew Cask
brew install --cask rancher

# Або завантажте вручну: https://rancherdesktop.io/
```

#### Налаштування після встановлення:
1. Відкрийте **Rancher Desktop**
2. **Preferences → Kubernetes**:
   - Увімкніть **Enable Kubernetes**
   - Оберіть режим: **k3s** (легковаговий Kubernetes)
   - Версія Kubernetes: `v1.29.x` (актуальна стабільна)
3. **Preferences → Virtual Machine**:
   - CPU: `2–3 cores`
   - Memory: `4 GB` (критично для 8GB RAM-машин, див. [LOCAL_DEV_RAM_OPTIMIZATION.md](./LOCAL_DEV_RAM_OPTIMIZATION.md))
4. **Preferences → Container Engine**: оберіть `dockerd (moby)`

> [!NOTE]
> Rancher Desktop автоматично встановлює **Docker CLI**, **kubectl**, **helm** та **nerdctl**.  
> Додатково встановлювати їх не потрібно, якщо ви використовуєте Rancher.

#### Перевірка k3s кластера:
```bash
kubectl get nodes
# Очікуваний результат: один нод зі статусом Ready
```

---

### Helm (v3.14+)

> [!NOTE]
> Якщо встановлено Rancher Desktop — Helm вже присутній. Перевірте: `helm version`

```bash
# Встановлення окремо (якщо потрібна інша версія)
brew install helm

# Перевірка
helm version

# Додавання основних репозиторіїв для PREDATOR
helm repo add stable https://charts.helm.sh/stable
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
```

---

### k3d (для локальних кластерів)

```bash
# k3d — обгортка для запуску k3s у Docker (для розробки)
brew install k3d

# Перевірка
k3d version
```

> [!TIP]
> Для деталей про RAM-оптимізований k3d кластер — дивіться [LOCAL_DEV_RAM_OPTIMIZATION.md](./LOCAL_DEV_RAM_OPTIMIZATION.md).

---

## 💻 3. Мови та фреймворки

### Node.js (LTS v22.x) — для React/TypeScript

```bash
# Встановлення конкретної LTS-версії
brew install node@22

# Додати до PATH (якщо не додалось автоматично)
echo 'export PATH="/opt/homebrew/opt/node@22/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Перевірка
node --version   # v22.x.x
npm  --version   # 10.x.x

# Встановити pnpm (рекомендований менеджер пакетів для PREDATOR UI)
npm install -g pnpm
pnpm --version
```

> [!IMPORTANT]
> PREDATOR UI (`apps/predator-analytics-ui`) використовує **pnpm** як package manager.  
> Порт frontend: **3030** (HR-10).

---

### Python (v3.12+) — для FastAPI backend

```bash
# Встановлення Python 3.12
brew install python@3.12

# Додати до PATH
echo 'export PATH="/opt/homebrew/opt/python@3.12/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Перевірка
python3.12 --version   # Python 3.12.x
pip3.12 --version

# Встановлення Poetry (менеджер залежностей для backend)
curl -sSL https://install.python-poetry.org | python3.12 -
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

poetry --version

# Встановлення Ruff (лінтер, HR-12)
pip3.12 install ruff
ruff --version
```

> [!IMPORTANT]
> HR-01: **ТІЛЬКИ Python 3.12**. Жодні інші версії (3.11, 3.13) не допускаються.

---

### Java JDK (v21+) — для backend/аналітики

```bash
# Встановлення через Homebrew (OpenJDK 21 LTS)
brew install openjdk@21

# Символьне посилання для macOS system Java
sudo ln -sfn /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk \
     /Library/Java/JavaVirtualMachines/openjdk-21.jdk

# Додати до PATH
echo 'export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"' >> ~/.zshrc
echo 'export JAVA_HOME="/opt/homebrew/opt/openjdk@21"' >> ~/.zshrc
source ~/.zshrc

# Перевірка
java --version   # openjdk 21.x.x
```

---

## 🔌 4. Додаткові інструменти

### Oh My Zsh — Покращений термінал

```bash
# Встановлення
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

# Рекомендовані плагіни (додати у ~/.zshrc в масив plugins)
# plugins=(git docker kubectl helm python node vscode)

# Рекомендована тема: agnoster або powerlevel10k
```

#### Корисні аліаси для PREDATOR (додати в `~/.zshrc`):
```bash
# Kubernetes
alias k='kubectl'
alias kgp='kubectl get pods -A'
alias kgn='kubectl get nodes'

# PREDATOR-specific
alias predator-ui='cd /Volumes/Macintosh\ HD/System/Volumes/Data/Users/Shared/Predator_60/apps/predator-analytics-ui && pnpm dev'
alias predator-mock='node /Volumes/Macintosh\ HD/System/Volumes/Data/Users/Shared/Predator_60/mock-api-server.mjs'
alias predator-cluster-start='k3d cluster start predator-local'
alias predator-cluster-stop='k3d cluster stop predator-local'
```

---

### Postman (v11.0+) — Тестування API

```bash
# Встановлення через Homebrew Cask
brew install --cask postman
```

Або завантажте вручну: [postman.com](https://www.postman.com/downloads/)

#### Налаштування для PREDATOR API:
- **Base URL**: `http://localhost:8000/api/v1`
- **Mock URL**: `http://localhost:9080/api/v1`
- **Authorization**: `Bearer Token` (JWT)

---

### Lens (v6.0+) — Графічний інтерфейс Kubernetes

```bash
# Встановлення через Homebrew Cask
brew install --cask openlens

# Перевірка
open /Applications/OpenLens.app
```

> [!NOTE]
> Lens автоматично підхопить конфігурацію з `~/.kube/config`.  
> Для роботи з віддаленим кластером (iMac) — дивіться [REMOTE_IMAC_SERVER_SETUP.md](./REMOTE_IMAC_SERVER_SETUP.md).

---

## 🔐 5. Обов'язкові кроки після встановлення

### Крок 1: Налаштування SSH-ключів для GitHub

```bash
# Генерація ключа (рекомендується ed25519)
ssh-keygen -t ed25519 -C "your@email.com"
# Натисніть Enter для шляху за замовчуванням
# Встановіть passphrase (рекомендовано)

# Запуск ssh-agent та додавання ключа
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Додати до ~/.ssh/config для автозавантаження
cat >> ~/.ssh/config << 'EOF'
Host github.com
  AddKeysToAgent yes
  UseKeychain yes
  IdentityFile ~/.ssh/id_ed25519
EOF

# Скопіювати публічний ключ у буфер обміну
pbcopy < ~/.ssh/id_ed25519.pub
# Додайте його на: https://github.com/settings/keys
```

#### Налаштування SSH для PREDATOR-серверів:
```bash
cat >> ~/.ssh/config << 'EOF'

# PREDATOR iMac Fallback Server
Host predator-server
  HostName 192.168.1.45
  User predator
  IdentityFile ~/.ssh/id_ed25519
  AddKeysToAgent yes
EOF
```

---

### Крок 2: Перевірка Kubernetes

```bash
# Інформація про кластер
kubectl cluster-info

# Список нод
kubectl get nodes

# Очікуваний вивід:
# NAME                     STATUS   ROLES                  AGE   VERSION
# k3d-predator-local-...   Ready    control-plane,master   ...   v1.29.x
```

---

### Крок 3: Тестовий деплой

```bash
# Перевірочний deployment nginx
kubectl create deployment nginx-test --image=nginx:alpine

# Перевірка запуску
kubectl get pods -l app=nginx-test

# Очищення після перевірки
kubectl delete deployment nginx-test
```

---

### Крок 4: Перевірка PREDATOR Frontend

```bash
# Перехід до директорії frontend
cd /Volumes/Macintosh\ HD/System/Volumes/Data/Users/Shared/Predator_60/apps/predator-analytics-ui

# Встановлення залежностей
pnpm install

# Запуск dev-сервера (порт 3030, HR-10)
pnpm dev
# Відкрийте: http://localhost:3030
```

---

## ✅ 6. Перевірка готовності середовища

Запустіть повну діагностику одною командою:

```bash
echo "=== PREDATOR Dev Environment Check ===" && \
echo "📦 Homebrew:   $(brew --version | head -1)" && \
echo "🔧 Git:        $(git --version)" && \
echo "🐳 Docker:     $(docker --version 2>/dev/null || echo 'NOT FOUND')" && \
echo "☸️  kubectl:   $(kubectl version --client --short 2>/dev/null | head -1)" && \
echo "⛵ Helm:       $(helm version --short 2>/dev/null)" && \
echo "🐋 k3d:        $(k3d version | head -1)" && \
echo "🟢 Node.js:    $(node --version 2>/dev/null || echo 'NOT FOUND')" && \
echo "📦 pnpm:       $(pnpm --version 2>/dev/null || echo 'NOT FOUND')" && \
echo "🐍 Python:     $(python3.12 --version 2>/dev/null || echo 'NOT FOUND')" && \
echo "☕ Java:        $(java --version 2>/dev/null | head -1 || echo 'NOT FOUND')" && \
echo "🔍 Ruff:       $(ruff --version 2>/dev/null || echo 'NOT FOUND')" && \
echo "" && \
echo "☸️  Kubernetes Cluster:" && \
kubectl get nodes 2>/dev/null || echo "  ⚠️  Кластер не запущено"
```

---

## 📊 Матриця відповідності вимогам

| Інструмент | Мінімальна версія | Перевірка | Статус |
|---|---|---|---|
| Homebrew | 4.2+ | `brew --version` | ☐ |
| Git | 2.44+ | `git --version` | ☐ |
| VS Code | 1.85+ | `code --version` | ☐ |
| Rancher Desktop | 1.12+ | Про застосунок | ☐ |
| Helm | 3.14+ | `helm version --short` | ☐ |
| k3d | 5.6+ | `k3d version` | ☐ |
| Node.js | 22.x LTS | `node --version` | ☐ |
| pnpm | 9.x+ | `pnpm --version` | ☐ |
| Python | 3.12+ | `python3.12 --version` | ☐ |
| Ruff | latest | `ruff --version` | ☐ |
| Java JDK | 21+ | `java --version` | ☐ |
| SSH-ключ | ed25519 | `ssh -T git@github.com` | ☐ |

---

## 🔗 Пов'язані документи

| Документ | Призначення |
|---|---|
| [LOCAL_DEV_RAM_OPTIMIZATION.md](./LOCAL_DEV_RAM_OPTIMIZATION.md) | Оптимізація RAM для 8GB Mac |
| [REMOTE_IMAC_SERVER_SETUP.md](./REMOTE_IMAC_SERVER_SETUP.md) | Налаштування iMac як Remote Server |
| [IMAC_FALLBACK_ARCHITECTURE.md](./IMAC_FALLBACK_ARCHITECTURE.md) | Архітектура резервного вузла |
| [LOCAL_FRONTEND_DEPLOYMENT.md](./LOCAL_FRONTEND_DEPLOYMENT.md) | Деплой Frontend локально |
| [SCRIPTS_REFERENCE.md](./SCRIPTS_REFERENCE.md) | Довідник скриптів |

---

> [!TIP]
> Якщо ви розробляєте **тільки фронтенд** — достатньо встановити Node.js + pnpm + VS Code.  
> Запустіть Mock API: `node mock-api-server.mjs` (порт **9080**) замість повного backend-стеку.

---

**Версія**: v56.5.0  
**Актуалізовано**: 23 квітня 2026 року  
**Автор**: PREDATOR AI Agent — Senior Engineer
