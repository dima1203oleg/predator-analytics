# 🧠 Оптимізація RAM для PREDATOR v55 (8GB Mac)

Цей гайд містить професійні поради для запуску повного стеку PREDATOR Analytics на пристроях з обмеженою оперативною пам'яттю (8 ГБ).

---

## 🛠 1. Попередня підготовка системи

Перш ніж встановлювати будь-які інструменти, переконайтеся, що база системи готова:

```bash
# Фундаментальний крок для macOS
xcode-select --install
```

### Встановлення мінімального стеку через Homebrew:

```bash
brew install kubectl helm k3d
# Docker Desktop (рекомендується встановити вручну та лімітувати ресурси)
```

---

## 🐳 2. Налаштування Docker Desktop (Critical)

Для стабільної роботи на 8GB RAM, встановіть ліміти у налаштуваннях Docker Desktop:

- **CPU**: 2–3 Cores
- **Memory**: 4 GB (це "золота середина")
- **Swap**: 1 GB

---

## 🏗 3. RAM-Friendly k3d Кластер

Замість стандартного запуску, використовуйте оптимізовану конфігурацію:

```bash
k3d cluster create predator-local \
  --agents 1 \
  --servers 1 \
  --k3s-arg "--disable=traefik@server:0"
```

👉 **Чому це важливо:**
- **Менше нод** = менше споживання RAM.
- **Відключення Traefik** — він жере ресурси, а для локальної розробки ми використовуємо прямі порти або `port-forward`.

---

## 📊 4. Перевірка працездатності

Після запуску обов'язково прогони діагностику:

```bash
kubectl version --client
helm version
k3d version
docker version
```

Перевірка статусу кластера:
```bash
kubectl get nodes
kubectl get pods -A
```

---

## ⚡ 5. Лайфхаки для економії ресурсів

### Аліаси для швидкості (додати в `~/.zshrc`):
```bash
echo 'alias k=kubectl' >> ~/.zshrc
source ~/.zshrc
```

### Режим "Економія енергії":
Якщо бачите, що система починає "задихатися" (swap зростає, UI лагає), зупиніть кластер, коли він не потрібен:

```bash
# Зупинка
k3d cluster stop predator-local

# Запуск тільки тоді, коли треба тестувати deployment
k3d cluster start predator-local
```

### Очищення невикористовуваних ресурсів Docker:
```bash
docker system prune -f
```

---

## 📂 Пов'язані скрипти

- `deploy/scripts/deploy_local_k3d.sh` — автоматизований запуск кластера з цими оптимізаціями.

> [!TIP]
> Якщо ви розробляєте тільки фронтенд, backend можна не розгортати у кластері, а використовувати `mock-api-server.mjs` (порт 9080).

---
**Версія**: v55.1.0  
**Автор**: PREDATOR AI Agent & Senior Engineer Feedback
