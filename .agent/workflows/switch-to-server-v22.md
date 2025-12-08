---
description: Переключення роботи на NVIDIA сервер та Kubernetes deployment
---

# Workflow: Переключення на NVIDIA Server

Цей workflow допомагає швидко переключитися на роботу на NVIDIA GPU сервері та розгорнути Kubernetes кластер.

## 📍 Важливо: ngrok порти динамічні!

Перевірте актуальний порт в ngrok dashboard перед підключенням.

---

## Крок 1: Підключення до сервера

```bash
# Стандартне підключення (перевірте порт!)
ssh -i ~/.ssh/id_ed25519_ngrok dima@5.tcp.eu.ngrok.io -p 14564

# Або пряме підключення (якщо є)
ssh dima@<NVIDIA_SERVER_IP>
```

## Крок 2: Перевірка NVIDIA GPU

```bash
# Перевірити GPU
nvidia-smi

# Перевірити CUDA
nvcc --version

# Перевірити Docker з GPU
docker run --rm --gpus all nvidia/cuda:12.0-base nvidia-smi
```

## Крок 3: Перехід до робочої директорії

```bash
cd ~/predator-analytics
```

---

## 🚀 Kubernetes Deployment (Helm)

### Крок 4: Перевірка Kubernetes

```bash
# Перевірити kubectl
kubectl cluster-info

# Перевірити nodes
kubectl get nodes -o wide

# Перевірити GPU в кластері
kubectl get nodes -o json | jq -r '.items[] | "\(.metadata.name): GPU: \(.status.allocatable["nvidia.com/gpu"] // "N/A")"'
```

### Крок 5: Розгортання з Helm

```bash
# Використовуючи deployment script
./scripts/deploy-nvidia-server.sh install

# Або вручну:
helm dependency update helm/predator-umbrella
helm upgrade --install predator helm/predator-umbrella \
  -f helm/predator-umbrella/values-prod.yaml \
  --set selfImprovement.enabled=true \
  --set mlOps.enabled=true \
  --set flower.basicAuth="$FLOWER_BASIC_AUTH" \
  --namespace predator --create-namespace \
  --timeout 15m --wait
```

### Крок 6: Перевірка статусу

```bash
# Статус pods
kubectl get pods -n predator

# Статус services
kubectl get svc -n predator

# Логи API
kubectl logs -n predator -l app=predator-api --tail=100 -f
```

### Крок 7: Port Forwarding (для доступу з Mac)

```bash
# На сервері:
kubectl port-forward -n predator svc/predator-api 8000:8000 --address 0.0.0.0 &
kubectl port-forward -n predator svc/predator-frontend 3000:80 --address 0.0.0.0 &
kubectl port-forward -n predator svc/predator-grafana 3001:3000 --address 0.0.0.0 &
```

---

## 🐳 Docker Compose (альтернатива)

### Крок 4 (alt): Запуск через Docker Compose

```bash
cd ~/predator-analytics

# Запустити всі сервіси
docker-compose up -d

# Перевірити статус
docker-compose ps

# Переглянути логи
docker-compose logs -f backend
```

---

## 🔧 Управління Ollama (LLM)

### Запуск Ollama з GPU

```bash
# Запустити Ollama
ollama serve &

# Завантажити моделі
ollama pull gemma:7b
ollama pull mistral:7b
ollama pull llama3:8b
ollama pull codestral

# Перевірити моделі
ollama list
```

---

## 📦 Синхронізація коду

### З Mac на сервер

```bash
# На Mac виконати:
rsync -avz --exclude 'node_modules' --exclude '.venv' --exclude 'venv' --exclude 'dist' \
  -e "ssh -i ~/.ssh/id_ed25519_ngrok -p 14564" \
  /Users/dima-mac/Documents/Predator_21/ \
  dima@5.tcp.eu.ngrok.io:~/predator-analytics/
```

### З сервера на Mac

```bash
# На Mac виконати:
rsync -avz --exclude 'node_modules' --exclude '.venv' --exclude 'venv' \
  -e "ssh -i ~/.ssh/id_ed25519_ngrok -p 14564" \
  dima@5.tcp.eu.ngrok.io:~/predator-analytics/ \
  /Users/dima-mac/Documents/Predator_21/server-backup/
```

---

## 📊 Моніторинг

```bash
# Grafana (через kubectl)
kubectl port-forward -n predator svc/predator-grafana 3001:3000 --address 0.0.0.0

# Prometheus
kubectl port-forward -n predator svc/predator-prometheus 9090:9090 --address 0.0.0.0

# OpenSearch Dashboards
kubectl port-forward -n predator svc/predator-opensearch-dashboards 5601:5601 --address 0.0.0.0
```

---

## 🛑 Зупинка сервісів

### Kubernetes

```bash
# Scale down
kubectl scale deployment --all -n predator --replicas=0

# Або повне видалення
./scripts/deploy-nvidia-server.sh uninstall
```

### Docker Compose

```bash
docker-compose down
```

---

## 📝 Корисні команди

```bash
# Перезапустити API
kubectl rollout restart deployment predator-api -n predator

# Переглянути ресурси
kubectl top pods -n predator

# Зайти в pod
kubectl exec -it -n predator $(kubectl get pod -n predator -l app=predator-api -o jsonpath='{.items[0].metadata.name}') -- /bin/bash

# Дебаг DNS
kubectl run -it --rm debug --image=busybox --restart=Never -- nslookup predator-postgres.predator.svc.cluster.local
```
