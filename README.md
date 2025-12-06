# 🎯 Predator Analytics v21.0

**AI-Native Multi-Agent Analytical Platform**

[![Version](https://img.shields.io/badge/version-21.0.0-blue.svg)](https://github.com/predator-analytics)
[![Status](https://img.shields.io/badge/status-development-yellow.svg)](https://github.com/predator-analytics)

---

## 🚀 Quick Start

```bash
# 1. Clone and setup
git clone <repository>
cd Predator_21

# 2. Start infrastructure
./setup_local.sh

# 3. Start backend
cd ua-sources
pip install -r requirements.txt
python3 app/main_v21.py

# 4. Start frontend (in another terminal)
npm run dev
```

**Access:**
- Frontend: http://localhost:3000
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- MinIO: http://localhost:9001 (predator_admin / predator_secret_key)
- Grafana: http://localhost:3001 (admin / admin)

---

## 📋 What is Predator Analytics?

Predator Analytics — це AI-native платформа для аналізу великих обсягів даних (митні декларації, податкові накладні, реєстри) з використанням мультиагентної архітектури та 58 LLM моделей.

### Ключові можливості:
- 🤖 **30+ AI Agents** для різних типів аналізу
- 🧠 **58 LLM Models** (Ollama, Gemini, Groq, OpenAI)
- 📊 **Real-time Analytics** через OpenSearch
- 🔍 **Vector Search** через Qdrant
- 🎭 **3D Talking Avatar** для взаємодії
- 🔐 **PII Masking** для захисту даних
- 🔄 **Self-Healing** та **Self-Learning**

---

## 🏗️ Architecture

```
Frontend (React) → FastAPI → Nexus Supervisor → MAS Agents
                                    ↓
                    PostgreSQL + OpenSearch + Qdrant
                                    ↓
                    MinIO (S3) + Redis + Kafka
```

**Детальна архітектура:** [Implementation Plan](file:///Users/dima-mac/.gemini/antigravity/brain/b777f1e4-5bfe-4780-a95b-e98b3d60d7db/implementation_plan.md)

---

## 📦 Components

### Backend (`ua-sources/app/`)
- **Agents**: Retriever, Miner, Arbiter, HealthMonitor, DataAcquisition
- **Services**: ModelRouter, AvatarService, MinIO, ETL, OpenSearch
- **Orchestrator**: NexusSupervisor (Auto/Fast/Precise/Council modes)

### Frontend
- Dashboard
- Analytics Views
- Avatar Chat Widget
- LLM Mode Selector

### Infrastructure
- Docker Compose (full stack)
- Helm Charts (K8s ready)
- Prometheus + Grafana
- ArgoCD (GitOps)

---

## 🧪 API Examples

### Analyze Data
```bash
curl -X POST http://localhost:8000/api/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{"query": "Show customs anomalies", "mode": "council"}'
```

### Upload Dataset
```bash
curl -X POST http://localhost:8000/api/v1/data/upload \
  -F "file=@data.csv" \
  -F "dataset_type=customs"
```

### Talk to Avatar
```bash
curl -X POST http://localhost:8000/api/v1/avatar/interact \
  -H "Content-Type: application/json" \
  -d '{"text": "Explain corruption patterns", "emotion": "serious"}'
```

---

## 📚 Documentation

- [Implementation Plan](file:///Users/dima-mac/.gemini/antigravity/brain/b777f1e4-5bfe-4780-a95b-e98b3d60d7db/implementation_plan.md) — Roadmap та архітектура
- [Walkthrough](file:///Users/dima-mac/.gemini/antigravity/brain/b777f1e4-5bfe-4780-a95b-e98b3d60d7db/walkthrough.md) — Детальний огляд реалізації
- [Task Tracker](file:///Users/dima-mac/.gemini/antigravity/brain/b777f1e4-5bfe-4780-a95b-e98b3d60d7db/task.md) — Прогрес розробки

---

## 🛠️ Development

### Prerequisites
- Docker Desktop
- Python 3.9+
- Node.js 18+
- (Optional) Ollama для локальних LLM

### Environment Setup
```bash
cp .env.example .env
# Edit .env with your API keys
```

### Run Tests
```bash
# Backend
cd ua-sources
pytest

# Frontend
npm test
```

---

## 🚢 Deployment

### Local (Docker Compose)
```bash
docker-compose up -d
```

### Kubernetes (Helm)
```bash
helm install predator helm/predator-umbrella \
  -f helm/predator-umbrella/values-prod.yaml
```

### ArgoCD (GitOps)
```bash
kubectl apply -f infra/argocd/apps/
```

---

## 🔐 Security

- **Zero-Trust**: mTLS через Istio
- **PII Masking**: Автоматичне маскування чутливих даних
- **RBAC**: Keycloak SSO (в розробці)
- **Secrets**: Vault integration (в розробці)

---

## 📊 Monitoring

- **Metrics**: Prometheus (http://localhost:9090)
- **Dashboards**: Grafana (http://localhost:3001)
- **Logs**: Loki (в розробці)
- **Tracing**: Tempo (в розробці)

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📝 License

Proprietary — Predator Analytics Team

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/predator-analytics/issues)
- **Docs**: [Full Documentation](./docs/)
- **Email**: team@predator.ai

---

**Built with ❤️ by Predator Analytics Team**
