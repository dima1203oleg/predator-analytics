# Імплементація Production-Автоматизації в Predator Analytics
## Аналіз та Roadmap

**Версія:** 22.0  
**Дата:** 2025-12-10  
**Статус:** Проєктування → Імплементація

---

## 📊 Поточний Стан Системи

### ✅ Що Вже Реалізовано

#### 1. **CI/CD та GitOps** (Частково)
- ✅ GitHub Actions CI/CD pipeline (`ci-cd-pipeline.yml`)
  - Backend тестування та збірка
  - Frontend збірка та публікація
  - Docker образи публікуються в GHCR
- ✅ Helm чарти в `/helm/predator-umbrella`
- ✅ Argo CD конфігурації в `/argocd/`
  - Application definitions для різних середовищ (mac, nvidia, oracle)
- ⚠️ **Потребує доопрацювання:**
  - App-of-Apps патерн не повністю реалізований
  - Немає автоматичної синхронізації між середовищами (dev→staging→prod)
  - Відсутні environment-specific values файли (dev/staging/prod)

#### 2. **Infrastructure & Data Storage** (Добре)
- ✅ Docker Compose конфігурація з усіма сервісами
- ✅ PostgreSQL з міграціями
- ✅ Redis для кешування та черг
- ✅ Qdrant для векторного пошуку
- ✅ OpenSearch для повнотекстового пошуку
- ✅ MinIO для об'єктного сховища
- ✅ Keycloak для аутентифікації

#### 3. **ETL та Індексація** (Базова Реалізація)
- ✅ Data Parser (файли в `/ua-sources/app/parsers/`)
- ✅ OpenSearch індексація (`opensearch_indexer.py`)
- ✅ Qdrant векторизація (`qdrant_service.py`)
- ✅ Embedding service (`embedding_service.py`)
- ✅ ETL ingestion (`etl_ingestion.py`)
- ⚠️ **Потребує розширення:**
  - Немає спеціалізованого модуля для PDF parsing з OCR
  - Відсутня автоматична NER та entity extraction
  - Немає автоматичного data enrichment pipeline

#### 4. **MLOps Інфраструктура** (Початкова Стадія)
- ✅ MLflow сервіс в docker-compose
- ✅ Базові ML сервіси (`/ua-sources/app/services/ml/`)
- ⚠️ **Відсутні критичні компоненти:**
  - ❌ H2O AutoML інтеграція
  - ❌ Data Version Control (DVC)
  - ❌ Automated Fine-Tuning pipeline
  - ❌ Synthetic Data Generation (Augmentor)
  - ❌ Model drift detection
  - ❌ Automated retraining pipeline

#### 5. **LLM Infrastructure** (Існуюча, Але Без Council)
- ✅ LLM сервіс (`llm.py`) з підтримкою:
  - OpenAI, Anthropic, Google Gemini
  - Groq, OpenRouter
  - Ollama для локальних моделей
- ✅ Model router (`model_router.py`)
- ❌ **LLM-Council (Karpathy Pattern) НЕ РЕАЛІЗОВАНИЙ**
  - Немає multi-model consensus mechanism
  - Відсутня peer review система
  - Немає chairman orchestration

#### 6. **Observability & Monitoring** (Частково)
- ✅ Grafana dashboard
- ❌ Prometheus (закоментований в docker-compose)
- ❌ Kubecost для відстеження витрат
- ❌ Автоматичні алерти в Slack
- ❌ XAI інструменти (SHAP/LIME)

#### 7. **Web UI Automation** (Початкова Стадія)
- ✅ Frontend на React з багатим UI
- ❌ Cypress E2E тести НЕ ВПРОВАДЖЕНІ
- ❌ Whisper.js для STT
- ❌ Web Speech API інтеграція
- ❌ Рольові пресети (admin/ml/user)

---

## 🎯 Roadmap Імплементації

### Фаза 1: Critical MLOps Infrastructure (1-2 тижні)

#### 1.1 Federated LLM-Council (Пріоритет: HIGH)
**Мета:** Реалізувати Karpathy LLM-Council для підвищення надійності відповідей

**Компоненти:**
```
/ua-sources/app/services/llm_council/
├── __init__.py
├── council_orchestrator.py    # Головний оркестратор
├── models/
│   ├── council_member.py      # Базовий клас для моделі-члена ради
│   ├── openai_member.py       # OpenAI GPT-4/3.5
│   ├── anthropic_member.py    # Claude
│   ├── gemini_member.py       # Google Gemini
│   ├── groq_member.py         # Groq LLaMA
│   └── deepseek_member.py     # DeepSeek (через Bedrock)
├── peer_review.py             # Взаємна перевірка відповідей
├── consensus.py               # Агрегація та формування консенсусу
└── chairman.py                # Головуюча модель (GPT-4)
```

**API Endpoint:**
```python
POST /api/llm-council/query
{
  "query": "Складний аналітичний запит",
  "models": ["gpt-4", "claude-3", "gemini-pro", "groq-llama"],
  "chairman": "gpt-4",
  "min_consensus": 0.75
}
```

**Workflow:**
1. Query розподіляється всім моделям паралельно
2. Кожна модель генерує незалежну відповідь
3. Peer review: моделі оцінюють відповіді один одного
4. Chairman агрегує результати та формує фінальну відповідь
5. Логування всіх кроків у MLflow

#### 1.2 MLOps Pipeline (Пріоритет: HIGH)

**A. DVC Integration**
```bash
# Встановлення та конфігурація
/ua-sources/requirements.txt:
  + dvc[s3]==3.48.0
  
/ua-sources/.dvc/
├── config                      # Remote storage (MinIO S3)
└── .gitignore

# Tracking datasets
dvc add data/training_dataset.csv
dvc push  # Sync to MinIO
```

**B. H2O AutoML Service**
```
/ua-sources/app/services/ml/automl/
├── __init__.py
├── h2o_automl_service.py      # H2O AutoML wrapper
├── huggingface_finetuner.py   # HF Transformers fine-tuning
└── model_registry.py          # MLflow integration
```

**API Endpoints:**
```python
POST /api/ml/automl/train
{
  "dataset_id": "customs_classification",
  "target_column": "category",
  "max_runtime_secs": 3600,
  "max_models": 20
}

POST /api/ml/automl/finetune
{
  "base_model": "bert-base-multilingual-cased",
  "dataset_id": "ner_training",
  "epochs": 3
}
```

**C. Synthetic Data Augmentor**
```
/ua-sources/app/services/ml/augmentor/
├── __init__.py
├── text_augmentor.py          # GPT-based text generation
├── tabular_augmentor.py       # SMOTE, GAN for tabular data
└── image_augmentor.py         # Diffusion models for images
```

#### 1.3 Self-Improvement Loop (Пріоритет: MEDIUM)

**Компоненти:**
```
/ua-sources/app/services/ml/self_improvement/
├── __init__.py
├── drift_detector.py          # Model drift detection
├── xai_analyzer.py            # SHAP/LIME analysis
├── weak_case_finder.py        # Identify problematic predictions
├── retraining_manager.py      # Automated retraining pipeline
└── metrics_monitor.py         # NDCG, precision, recall tracking
```

**Celery Tasks:**
```python
# /ua-sources/app/tasks/ml_tasks.py
@celery_app.task
def monitor_model_performance():
    """Щоденний моніторинг якості моделей"""
    
@celery_app.task
def trigger_retraining_if_drift():
    """Автоматичне перенавчання при drift"""
    
@celery_app.task
def generate_synthetic_data_for_weak_cases():
    """Генерація даних для слабких прикладів"""
```

### Фаза 2: Enhanced ETL & Indexing (1 тиждень)

#### 2.1 Advanced Document Parsing
```
/ua-sources/app/parsers/advanced/
├── pdf_parser.py              # OCR + layout analysis
├── table_extractor.py         # Tabula-py integration
├── entity_extractor.py        # NER using spaCy multilingual
└── metadata_enricher.py       # Auto-tagging, categorization
```

**Dependencies:**
```python
# requirements.txt
pytesseract==0.3.10            # OCR
pdf2image==1.16.3
tabula-py==2.9.0               # Table extraction
spacy==3.7.2                   # NER
uk-core-news-lg==3.7.0         # Ukrainian NLP model
```

#### 2.2 Automated Data Enrichment Pipeline
```python
# Celery ETL Pipeline
@celery_app.task
def parse_document(file_id):
    """Parse PDF/Excel → structured JSON"""
    
@celery_app.task
def extract_entities(doc_id):
    """NER → persons, organizations, locations"""
    
@celery_app.task
def enrich_metadata(doc_id):
    """Add categories, tags, relations"""
    
@celery_app.task
def index_to_opensearch(doc_id):
    """Load to OpenSearch"""
    
@celery_app.task
def vectorize_to_qdrant(doc_id):
    """Generate embeddings → Qdrant"""
```

### Фаза 3: GitOps Maturity (3-5 днів)

#### 3.1 Multi-Environment Helm Values
```
/helm/predator-umbrella/values/
├── values-dev.yaml
├── values-staging.yaml
└── values-prod.yaml
```

**Приклад values-dev.yaml:**
```yaml
global:
  environment: dev
  imageTag: latest
  
backend:
  replicas: 1
  resources:
    limits:
      cpu: 500m
      memory: 1Gi
      
frontend:
  replicas: 1
```

**values-prod.yaml:**
```yaml
global:
  environment: production
  imageTag: "{{GIT_SHA}}"  # From GitOps
  
backend:
  replicas: 3
  resources:
    limits:
      cpu: 2000m
      memory: 4Gi
  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 10
```

#### 3.2 Argo CD App-of-Apps
```yaml
# /argocd/app-of-apps.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: predator-analytics-apps
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/dima1203oleg/predator-analytics
    targetRevision: main
    path: argocd/applications
  destination:
    server: https://kubernetes.default.svc
    namespace: argocd
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

```yaml
# /argocd/applications/dev-backend.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: predator-backend-dev
spec:
  source:
    repoURL: https://github.com/dima1203oleg/predator-analytics
    path: helm/predator-umbrella
    helm:
      valueFiles:
        - values/values-dev.yaml
  destination:
    namespace: predator-dev
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

### Фаза 4: Observability & Cost Optimization (3-5 днів)

#### 4.1 Prometheus Metrics
```yaml
# /infra/prometheus/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: /metrics
    
  - job_name: 'mlflow'
    static_configs:
      - targets: ['mlflow:5000']
      
  - job_name: 'opensearch'
    static_configs:
      - targets: ['opensearch:9200']
```

**Backend Metrics Endpoint:**
```python
# /ua-sources/app/api/metrics.py
from prometheus_client import Counter, Histogram, generate_latest

search_requests = Counter('search_requests_total', 'Total search requests')
search_latency = Histogram('search_latency_seconds', 'Search latency')
llm_council_queries = Counter('llm_council_queries_total', 'LLM Council queries')

@router.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type="text/plain")
```

#### 4.2 Kubecost Integration
```yaml
# /k8s/kubecost/values.yaml
prometheus:
  server:
    global:
      external_labels:
        cluster_id: predator-nvidia

kubecostProductConfigs:
  projectID: "predator-analytics"
  clusterName: "production"
  
# Alert on cost thresholds
alerting:
  enabled: true
  slack:
    enabled: true
    webhook: "${SLACK_WEBHOOK_URL}"
  alerts:
    - type: budget
      threshold: 500  # $500/month
      window: 7d
```

#### 4.3 XAI Service
```python
# /ua-sources/app/services/ml/xai_service.py
import shap
from lime.lime_text import LimeTextExplainer

class XAIService:
    async def explain_search_ranking(self, query: str, doc_id: str):
        """SHAP values for why doc ranked high"""
        
    async def explain_classification(self, text: str, prediction: str):
        """LIME explanation for classification"""
```

### Фаза 5: Web UI Enhancements (1 тиждень)

#### 5.1 Cypress E2E Tests
```typescript
// /frontend/cypress/e2e/search.cy.ts
describe('Search Functionality', () => {
  beforeEach(() => {
    cy.visit('http://localhost:8082')
    cy.login('test@predator.ai', 'password')  // Custom command
  })

  it('should perform semantic search', () => {
    cy.get('[data-testid="search-input"]').type('митні декларації 2024')
    cy.get('[data-testid="search-button"]').click()
    cy.get('[data-testid="search-results"]').should('exist')
    cy.get('[data-testid="result-item"]').should('have.length.greaterThan', 0)
  })

  it('should display analytics dashboard', () => {
    cy.get('[data-testid="nav-analytics"]').click()
    cy.get('[data-testid="chart-container"]').should('be.visible')
  })
})
```

**CI Integration:**
```yaml
# /.github/workflows/e2e-tests.yml
name: E2E Tests
on: [push, pull_request]

jobs:
  cypress:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Start Services
        run: docker compose up -d
        
      - name: Wait for Services
        run: ./scripts/wait-for-services.sh
        
      - name: Run Cypress
        uses: cypress-io/github-action@v6
        with:
          working-directory: frontend
          start: npm run dev
          wait-on: 'http://localhost:8082'
```

#### 5.2 Voice Interface (STT/TTS)
```typescript
// /frontend/src/services/voice/SpeechService.ts
import { pipeline } from '@xenova/transformers'

class SpeechService {
  private whisperModel: any
  
  async initWhisper() {
    this.whisperModel = await pipeline(
      'automatic-speech-recognition',
      'Xenova/whisper-base'
    )
  }
  
  async transcribe(audioBlob: Blob): Promise<string> {
    const arrayBuffer = await audioBlob.arrayBuffer()
    const result = await this.whisperModel(arrayBuffer)
    return result.text
  }
  
  speak(text: string) {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'uk-UA'
    window.speechSynthesis.speak(utterance)
  }
}
```

**Integration in Search Component:**
```tsx
// /frontend/src/components/search/VoiceSearch.tsx
import { useSpeechRecognition } from 'react-speech-recognition'
import { SpeechService } from '@/services/voice/SpeechService'

export function VoiceSearch() {
  const { transcript, listening, startListening } = useSpeechRecognition()
  const speechService = new SpeechService()
  
  const handleVoiceSearch = async () => {
    await startListening({ language: 'uk-UA' })
    // Fallback to Whisper if Web Speech API fails
    if (!transcript) {
      const audio = await recordAudio()
      const text = await speechService.transcribe(audio)
      performSearch(text)
    }
  }
}
```

#### 5.3 Role-Based UI Presets
```typescript
// /frontend/src/context/RoleContext.tsx
type UserRole = 'user' | 'admin' | 'ml'

const roleConfig: Record<UserRole, RoleConfig> = {
  user: {
    dashboards: ['search', 'analytics'],
    features: ['basic_search', 'export_reports']
  },
  admin: {
    dashboards: ['search', 'analytics', 'admin', 'monitoring'],
    features: ['all', 'user_management', 'system_config']
  },
  ml: {
    dashboards: ['search', 'analytics', 'mlops'],
    features: ['model_training', 'experiment_tracking', 'data_labeling']
  }
}

export function RoleProvider({ children }) {
  const { user } = useAuth()
  const config = roleConfig[user.role]
  
  return (
    <RoleContext.Provider value={{ role: user.role, config }}>
      {children}
    </RoleContext.Provider>
  )
}
```

---

## 📦 Додаткові Компоненти

### Slack Integration для Алертів
```python
# /ua-sources/app/services/notifications/slack_service.py
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError

class SlackNotifier:
    def __init__(self):
        self.client = WebClient(token=settings.SLACK_BOT_TOKEN)
        
    async def send_alert(self, channel: str, message: str, severity: str):
        """Send alert to Slack channel"""
        try:
            await self.client.chat_postMessage(
                channel=channel,
                text=f"🚨 [{severity}] {message}",
                blocks=[
                    {
                        "type": "section",
                        "text": {"type": "mrkdwn", "text": message}
                    }
                ]
            )
        except SlackApiError as e:
            logger.error(f"Slack error: {e}")
```

**Integration з Prometheus Alertmanager:**
```yaml
# /infra/prometheus/alertmanager.yml
route:
  receiver: 'slack-notifications'

receivers:
  - name: 'slack-notifications'
    slack_configs:
      - api_url: '${SLACK_WEBHOOK_URL}'
        channel: '#predator-alerts'
        title: 'Predator Analytics Alert'
```

### Kubecost Budget Alerts
```python
# /ua-sources/app/tasks/cost_monitoring.py
@celery_app.task
async def check_cost_budget():
    """Daily cost budget check"""
    kubecost = KubecostClient()
    daily_cost = await kubecost.get_daily_cost()
    
    if daily_cost > settings.DAILY_BUDGET_THRESHOLD:
        await slack_notifier.send_alert(
            channel='#predator-ops',
            message=f"⚠️ Daily cost ${daily_cost:.2f} exceeds budget ${settings.DAILY_BUDGET_THRESHOLD}",
            severity='warning'
        )
        
        # Auto-scale down GPU nodes if over budget
        if daily_cost > settings.CRITICAL_BUDGET_THRESHOLD:
            await k8s_scaler.scale_down_gpu_nodes()
```

---

## 🔄 Workflow Automation

### Automated Model Retraining Workflow
```python
# /ua-sources/app/workflows/model_retraining.py
class ModelRetrainingWorkflow:
    async def execute(self):
        # 1. Detect drift
        drift_detected = await drift_detector.check_drift()
        if not drift_detected:
            return
            
        # 2. Find weak cases
        weak_cases = await xai_analyzer.find_weak_predictions()
        
        # 3. Generate synthetic data
        synthetic_data = await augmentor.generate_for_cases(weak_cases)
        
        # 4. Version data with DVC
        dataset_version = await dvc.version_dataset(synthetic_data)
        
        # 5. Trigger AutoML
        experiment = await h2o_automl.train(
            dataset_version=dataset_version,
            max_runtime_secs=3600
        )
        
        # 6. Log to MLflow
        mlflow.log_experiment(experiment)
        
        # 7. Deploy if better
        if experiment.metrics['ndcg'] > current_model.metrics['ndcg']:
            await model_registry.promote_to_production(experiment.model_id)
            await slack_notifier.send_alert(
                channel='#ml-updates',
                message=f"✅ New model deployed: NDCG {experiment.metrics['ndcg']:.3f}",
                severity='info'
            )
```

---

## 📈 Success Metrics

### KPIs для Відстеження Автоматизації

1. **CI/CD Performance**
   - Build time < 10 хвилин
   - Deployment frequency: кілька разів на день
   - Mean time to recovery (MTTR) < 1 година

2. **MLOps Efficiency**
   - Model drift detection latency < 1 година
   - Automated retraining success rate > 95%
   - Synthetic data quality score > 0.85

3. **Cost Optimization**
   - GPU utilization > 80%
   - Cost per query < $0.01
   - Budget overrun incidents = 0

4. **Search Quality**
   - NDCG@10 > 0.85
   - Search latency p95 < 500ms
   - User satisfaction score > 4.5/5

5. **LLM Council Performance**
   - Consensus agreement rate > 90%
   - Hallucination reduction > 50% vs single model
   - Response quality (human eval) > 4.7/5

---

## 🚀 Пріоритизація

### Immediate (Цей Тиждень)
1. ✅ LLM-Council базова реалізація
2. ✅ Prometheus + Grafana активація
3. ✅ Multi-environment Helm values

### Short-term (2-3 Тижні)
1. H2O AutoML + DVC integration
2. Synthetic Data Augmentor
3. Advanced ETL pipeline з NER

### Medium-term (1-2 Місяці)
1. Self-Improvement Loop повна реалізація
2. Cypress E2E tests full coverage
3. Kubecost + cost automation

### Long-term (3+ Місяці)
1. Federated Learning across edge nodes
2. Multi-region deployment
3. Advanced XAI dashboards

---

## 📚 Джерела та Best Practices

**MLOps:**
- MLflow Model Registry documentation
- DVC with MLflow integration patterns
- H2O AutoML best practices guide

**GitOps:**
- Argo CD App-of-Apps pattern
- Helm multi-environment strategies
- Kubernetes progressive delivery

**LLM Engineering:**
- Andrej Karpathy's LLM-Council blog post (2025)
- OpenAI best practices for prompt engineering
- Multi-model consensus techniques

**Cost Optimization:**
- Kubecost documentation
- FinOps Foundation guidelines
- GPU optimization strategies

---

**Наступні Кроки:** Почати з Фази 1.1 - LLM-Council імплементація
