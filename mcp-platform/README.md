# MCP-платформа: Автономний мультиагентний оркестратор

## Що це

MCP (Modular Control Platform) — це готова до продакшену, повністю україномовна платформа для оркестрації AI, пам’яті, аналізу коду, інфраструктури, безпеки, моніторингу, тестування, фічфлагів і chaos-тестування. Платформа побудована на Python 3.12, Typer CLI, NATS, Neo4j, Qdrant і готова до деплою в K3s/K8s через Helm/ArgoCD.

## Архітектура (шари)

- **AI шар** — OpenHands/AutoGen інтеграція, планування та виконання завдань
- **Пам’ять** — Neo4j (граф) + Qdrant (вектори)
- **Аналіз коду** — Tree-sitter, Semgrep, SonarQube
- **Інфра/CI/CD** — K3s, Terraform, Helm, ArgoCD
- **Події** — NATS JetStream
- **Безпека** — Vault, OPA, Trivy, CodeQL
- **Спостереження** — Prometheus, Grafana, Loki, Sentry
- **Тести** — PyTest, Jest, Cypress
- **Реєстр/Документи** — Backstage, MkDocs
- **Фічфлаги** — Unleash
- **Chaos Engineering** — LitmusChaos

## Структура проекту

```
mcp-platform/
├── mcp/                     # Основний Python-пакет
│   ├── cli.py              # Головний CLI (Typer)
│   ├── ai_layer/           # AI шар
│   ├── memory_layer/       # Пам’ять
│   ├── code_analysis/      # Аналіз коду
│   ├── infrastructure/     # Інфраструктура
│   ├── event_bus/          # Події (NATS)
│   ├── security/           # Безпека
│   ├── observability/      # Моніторинг
│   ├── testing/            # Тести
│   ├── registry_docs/      # Реєстр/документи
│   ├── feature_flags/      # Фічфлаги
│   ├── chaos_engineering/  # Chaos
│   └── meta_controller/    # Мета-контролер (оркестратор)
├── helm/mcp/               # Helm-чарт для K8s
├── configs/                # Конфігурації сервісів
├── .github/workflows/      # GitHub Actions CI/CD
├── docker-compose.yml      # Локальний стенд (NATS, Neo4j, Qdrant)
├── Dockerfile              # Продакшен-образ (Python 3.12, non-root)
├── requirements.txt        # Залежності
└── .env.example            # Змінні середовища
```

## Швидкий старт (локально)

1) **Клонуйте та встановіть:**
   ```bash
   git clone <repo>
   cd mcp-platform
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2) **Запустіть сервіси (NATS, Neo4j, Qdrant):**
   ```bash
   docker compose up -d
   ```

3) **Перевірте CLI:**
   ```bash
   python -m mcp.cli --help
   ```

4) **Запустіть мета-контролер (автономний режим):**
   ```bash
   python -m mcp.meta_controller.controller
   ```

## CLI-команди (шари)

Кожен шар має власний Typer CLI:

```bash
# AI шар
python -m mcp.cli ai run --prompt "аналізуй код"
python -m mcp.cli ai status

# Пам’ять
python -m mcp.cli memory query --key "project:123"
python -m mcp.cli memory update --key "project:123" --data '{"status":"active"}'

# Аналіз коду
python -m mcp.cli analyze scan --path .
python -m mcp.cli analyze report --format json

# Інфраструктура
python -m mcp.cli infra deploy --env prod
python -m mcp.cli infra diff --env prod
python -m mcp.cli infra rollback --env prod

# Події
python -m mcp.cli events publish --subject "mcp.events.build" --payload '{"status":"ok"}'
python -m mcp.cli events subscribe --subject "mcp.events.>"

# Безпека
python -m mcp.cli sec secrets get --path "secret/data/db"
python -m mcp.cli sec policy check --policy "allow-read"

# Моніторинг
python -m mcp.cli monitor status
python -m mcp.cli monitor logs --service "ai-layer"
python -m mcp.cli monitor alerts

# Тести
python -m mcp.cli test run
python -m mcp.cli test report

# Реєстр/Документи
python -m mcp.cli docs update
python -m mcp.cli docs serve --port 8080

# Фічфлаги
python -m mcp.cli flags enable --flag "new-analyzer"
python -m mcp.cli flags disable --flag "legacy-mode"

# Chaos
python -m mcp.cli chaos run --experiment "pod-delete"
python -m mcp.cli chaos report --experiment "pod-delete"
```

## Конфігурація

- Скопіюйте `.env.example` в `.env` і заповніть секрети (NATS, Neo4j, Qdrant, Unleash, Vault, Sentry тощо).
- Конфігурації сервісів знаходяться в `configs/` (YAML). Вони підключаються через змінні середовища.
- У K8s/ArgoCD використовуйте Helm values і Secrets для секретів.

## Деплой в K8s (Helm + ArgoCD)

1) **Побудуйте та запуште образ (GitHub Actions зробить це автоматично):**
   ```bash
   docker build -t ghcr.io/<org>/mcp-platform:latest ./mcp-platform
   docker push ghcr.io/<org>/mcp-platform:latest
   ```

2) **Встановіть Helm-чарт:**
   ```bash
   helm upgrade --install mcp-platform ./helm/mcp \
     --namespace mcp-platform --create-namespace \
     --set image.repository=ghcr.io/<org>/mcp-platform \
     --set image.tag=latest \
     --set env.NEO4J_PASSWORD=$NEO4J_PASSWORD \
     --set env.QDRANT_API_KEY=$QDRANT_API_KEY
   ```

3) **ArgoCD:** додайте Helm-чарт як ArgoCD Application для GitOps-синхронізації.

## Розробка

- CLI-команди реалізовані через Typer, кожен шар — окремий підпакет `mcp/*/cli.py`.
- Реальні клієнти (NATS, Neo4j, Qdrant) підключаються через env; якщо сервіс недоступний — працює заглушка.
- Мета-контролер (`mcp/meta_controller/controller.py`) слухає NATS, збирає стан з Neo4j/Qdrant, приймає рішення та виконує CLI-команди.
- Повна типізація, Python 3.12, українська локалізація CLI та логів.

## Схема MCP-процесу (Mermaid)

```mermaid
flowchart LR
    subgraph Events
        E[NATS JetStream\n`mcp-events publish|subscribe`]
    end
    subgraph Meta[Meta-Controller]
        MC[Прийняття рішення\nfix|refactor|feature|rollback]
        MEM[Стан: Neo4j/Qdrant\n`mcp-memory query|update`]
        ANA[Аналіз коду\nTree-sitter/Semgrep/SonarQube\n`mcp-analyze scan|report`]
        AI[План/код\nAutoGen+OpenHands\n`mcp-ai plan|run|status`]
        SEC[Секрети/політики\nVault/OPA\n`mcp-sec secrets get|policy check`]
        CHAOS[Chaos-тести\nLitmusChaos\n`mcp-chaos run|report`]
    end
    subgraph CI[CI/CD]
        GH[GitHub Actions\n`mcp-infra diff|deploy|rollback`]
        HELM[Helm/ArgoCD\nK3s]
        TEST[Тести\nPyTest/Jest/Cypress\n`mcp-test run|report`]
    end
    subgraph Obs[Спостереження]
        MON[Prometheus/Grafana/Loki/Sentry\n`mcp-monitor status|logs|alerts`]
        FLAGS[Unleash\n`mcp-flags enable|disable`]
    end
    E --> MC
    MC --> MEM
    MC --> ANA
    MC --> AI
    AI --> GH
    GH --> TEST
    TEST --> GH
    GH --> HELM
    HELM --> MON
    MON --> MC
    FLAGS --> MC
    MC --> SEC
    MC --> CHAOS
    CHAOS --> MON
```

## Відповідність CLI → шари

- `mcp-ai` — AutoGen + OpenHands (план/генерація коду)
- `mcp-memory` — Neo4j/Qdrant (граф + семантика)
- `mcp-analyze` — Tree-sitter, Semgrep, SonarQube
- `mcp-infra` — Terraform/Helm/ArgoCD, GitHub Actions тригери
- `mcp-events` — NATS JetStream
- `mcp-sec` — Vault/OPA/Trivy/CodeQL
- `mcp-monitor` — Prometheus/Grafana/Loki/Sentry
- `mcp-test` — PyTest/Jest/Cypress
- `mcp-docs` — Backstage/MkDocs
- `mcp-flags` — Unleash
- `mcp-chaos` — LitmusChaos

### OpenHands/LiteLLM (приклади безкоштовних моделей)

- HF Inference (безкоштовні ліміти): `OPENHANDS_API_BASE=https://api-inference.huggingface.co/models/bigcode/starcoder2-7b`;
  `OPENHANDS_API_KEY=<HF_TOKEN>`; `OPENHANDS_MODEL=bigcode/starcoder2-7b`.
- Together (free tier): `OPENHANDS_API_BASE=https://api.together.xyz/v1`; `OPENHANDS_API_KEY=<TOGETHER_API_KEY>`; модель `codellama/CodeLlama-7b-Instruct`.
- LiteLLM проксі (локально): `OPENHANDS_API_BASE=http://litellm:4000/v1`; `OPENHANDS_API_KEY` не обов’язковий, якщо внутрішній проксі.
- Ollama локально: `OPENHANDS_CLI=ollama`; `OPENHANDS_MODEL=llama3:8b`; API base не потрібен, CLI викликає локальний ollama.

## Playbook Meta-Controller (авто-дії)

- Подія `mcp.events.*` → зчитати стан (`mcp-memory query`), контекст аналізу (`mcp-analyze scan`).
- Якщо Semgrep/SonarQube критичні → `mcp-ai plan` + `mcp-ai run` → `mcp-test run` → `mcp-infra deploy`.
- Якщо алерти Prod (Sentry/Prometheus) > порогу → `mcp-infra rollback` + `mcp-chaos report` (фіксація стану).
- Якщо latency p95 > 800ms або error rate > 2% → `mcp-flags disable <feature>` (канарейка), паралельно `mcp-infra diff` для масштабування (HPA/репліки).
- При відновленні (алерти < порога) → `mcp-flags enable <feature>` і `mcp-infra deploy` для повернення канарейки.
- Регулярно (cron/NATS) → `mcp-chaos run` (перелік профілів нижче) + `mcp-monitor status` для валідації стійкості.

## SLO/алерти (рекомендовані пороги)

- HTTP 5xx rate > 2% за 5 хв → подія у NATS, дії: rollback + disable flag.
- Latency p95 > 800ms за 5 хв → подія у NATS, дії: канарейка off, scale up.
- Error budget burn (4xx/5xx сумарно) > 10% за 1 год → блок нових фіч (freeze) через `mcp-flags disable <feature>`.
- Coverage < 80% або Sonar/Semgrep critical → заборона деплою, авто-PR на фікс через `mcp-ai`.

## Хаос-профілі (LitmusChaos)

- `pod-delete` (mcp meta-controller, events) — перевірка відновлення.
- `network-latency` (NATS/Neo4j/Qdrant) — перевірка тайм-аутів/ретраїв.
- `cpu-hog`/`memory-hog` (infra pods) — перевірка автоскейлу.
- `node-drain` (K3s) — перевірка перенесення подів.

## Вимоги

- Python 3.12
- Docker/Podman
- K3s/K8s (для продакшену)
- NATS, Neo4j, Qdrant (локально через docker-compose; у продакшені — зовнішні сервіси)

## Ліцензія

Внутрішній продукт Predator Analytics. Усі права захищені.
