# Деплой MCP-платформи в K3s/K8s

## Передумови

- K3s або Kubernetes кластер
- Helm 3.15+
- Docker-реєстр (наприклад, ghcr.io)
- Змінні середовища (секрети) для NATS, Neo4j, Qdrant

## Кроки

### 1) Побудувати та запушити образ

```bash
cd mcp-platform
docker build -t ghcr.io/<org>/mcp-platform:latest .
docker push ghcr.io/<org>/mcp-platform:latest
```

### 2) Встановити Helm-чарт

```bash
helm upgrade --install mcp-platform ./helm/mcp \
  --namespace mcp-platform --create-namespace \
  --set image.repository=ghcr.io/<org>/mcp-platform \
  --set image.tag=latest \
  --set env.NEO4J_PASSWORD=$NEO4J_PASSWORD \
  --set env.QDRANT_API_KEY=$QDRANT_API_KEY
```

### 3) Перевірити статус

```bash
kubectl -n mcp-platform get pods
kubectl -n mcp-platform logs deployment/mcp-platform
curl http://<service-ip>/healthz
curl http://<service-ip>/readyz
```

### 4) CLI доступ (опціонально)

```bash
kubectl exec -n mcp-platform deployment/mcp-platform -- python -m mcp.cli --help
kubectl exec -n mcp-platform deployment/mcp-platform -- python -m mcp.cli ai status
```

## Моніторинг

- Liveness: `/healthz`
- Readiness: `/readyz`
- Info: `/info`

## ArgoCD (GitOps)

Додайте Helm-чарт як ArgoCD Application для автоматичного синхронізації при змінах у Git.
