# PREDATOR Analytics v56.5-ELITE — Система потокового перехоплення (Event-Driven Pipeline)

## Опис

Система потокового перехоплення — це "рефлекси" PREDATOR Analytics, що забезпечують миттєве реагування на загрози в реальному часі. Дані в розвідці швидко "протухають", тому Pattern Engine (Рушій аномалій) має працювати в режимі Real-Time Event Streaming.

## Архітектура

### 1. Шина даних (Redpanda / Kafka)

Усі нові дані від конекторів (YouControl, Opendatabot, Митниця) потрапляють не напряму в базу, а в швидкісну чергу повідомлень (Message Broker) — Redpanda (бо вона легша за Kafka і написана на C++, що ідеально для вашого сервера).

**Топіки (Topics):**

- `stream.customs.declarations` — Митні декларації
- `stream.registry.fop_changes` — Зміни реєстру ФОП
- `stream.prozorro.tenders` — Тендери Prozorro
- `stream.court.decisions` — Судові рішення
- `stream.sanctions.updates` — Оновлення санкційних списків

**Конфігурація Redpanda:**

```yaml
# docker-compose.yml
redpanda:
  image: vectorized/redpanda:v23.2.4
  container_name: predator-redpanda
  ports:
    - "9092:9092"   # Kafka API
    - "9644:9644"   # HTTP Proxy
  environment:
    - REDPANDA_AUTO_CREATE_TOPICS_ENABLE=true
    - REDPANDA_DEFAULT_PARTITIONS=3
    - REDPANDA_DEFAULT_REPLICATION_FACTOR=1
  volumes:
    - redpanda_data:/var/lib/redpanda/data
  command:
    - redpanda
    - start
    - --overprovisioned
    - --smp=1
    - --memory=2g
    - --reserve-memory=0
    - --node-id=0
    - --set redpanda.enable_transactions=true
    - --set redpanda.idempotence=true
```

### 2. Complex Event Processing (CEP-рушій)

Ми використовуємо потоковий обробник (наприклад, Faust для Python або Apache Flink), який "слухає" ці топіки.

Як тільки надходить нова декларація, CEP-рушій миттєво перевіряє її на відповідність 100 закладеним датасетам аномалій.

**Реалізація на Faust:**

```python
import faust
from datetime import datetime

app = faust.App(
    'predator_cep',
    broker='kafka://localhost:9092',
    store='memory://'
)

# Визначення топіків
customs_topic = app.topic('stream.customs.declarations', value_type=DeclarationEvent)
alerts_topic = app.topic('alerts.incidents', value_type=AlertEvent)

@app.agent(customs_topic)
async def process_declarations(stream):
    """Обробка митних декларацій в реальному часі."""
    async for event in stream:
        # Перевірка на 100 датасетів аномалій
        anomalies = await check_all_anomaly_patterns(event)
        
        if anomalies:
            # Генерація алерту
            alert = AlertEvent(
                timestamp=datetime.now(),
                event_id=event.id,
                anomalies=anomalies,
                severity=calculate_severity(anomalies)
            )
            await alerts_topic.send(value=alert)
            
            # Тригер для Нейро-оркестратора
            await trigger_neuro_orchestrator(alert)

async def check_all_anomaly_patterns(declaration: DeclarationEvent) -> list[str]:
    """Перевірка декларації на всі патерни аномалій."""
    anomalies = []
    
    # Патерн #2: Бум за ніч
    if is_overnight_import(declaration):
        anomalies.append("Бум за ніч")
    
    # Патерн #71: Брокер-невидимка
    if is_invisible_broker(declaration):
        anomalies.append("Брокер-невидимка")
    
    # Патерн #84: Ланцюг прихованого гіганта
    if is_hidden_giant_chain(declaration):
        anomalies.append("Ланцюг прихованого гіганта")
    
    return anomalies
```

### 3. Механізм Алертів (Alerting & Triage)

Якщо CEP-рушій знаходить збіг (Pattern Match):

**1. Дані записуються в TimescaleDB (база часових рядів) як Incident Event:**

```sql
CREATE TABLE incidents (
    time TIMESTAMPTZ NOT NULL,
    event_id TEXT NOT NULL,
    anomaly_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    company_edrpou TEXT,
    declaration_id TEXT,
    raw_data JSONB
);

SELECT create_hypertable('incidents', 'time');
```

**2. Графана (через Alertmanager) генерує візуальний сигнал у "Sovereign Command Center":**

```yaml
# grafana-alerts.yml
groups:
  - name: predator_anomalies
    rules:
      - alert: HighSeverityAnomaly
        expr: rate(incidents_total{severity="critical"}[5m]) > 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Критична аномалія виявлена"
          description: "{{ $labels.anomaly_type }} для компанії {{ $labels.company_edrpou }}"
```

**3. Нейро-оркестратор (Агент) автоматично отримує тригер, збирає досьє на всіх пов'язаних осіб і формує попередній звіт ще до того, як аналітик відкриє вкладку:**

```python
async def trigger_neuro_orchestrator(alert: AlertEvent):
    """Тригер для Нейро-оркестратора при виявленні аномалії."""
    
    # Збір досьє на всіх пов'язаних осіб
    dossier = await collect_dossier(alert.company_edrpou)
    
    # Формування попереднього звіту
    report = await neuro_orchestrator.generate_preliminary_report(
        anomaly=alert.anomalies,
        dossier=dossier
    )
    
    # Збереження звіту в TimescaleDB
    await save_preliminary_report(report)
```

## Інтеграція з Нейро-оркестратором

Система потокового перехоплення тісно інтегрована з Нейро-оркестратором:

1. **Автоматичний тригер** — При виявленні аномалії Нейро-оркестратор автоматично отримує тригер
2. **Попередній аналіз** — Агент формує попередній звіт ще до того, як аналітик відкриє вкладку
3. **Контекстна обізнаність** — Агент використовує контекст з поточних подій для більш точного аналізу

## Переваги

- **Миттєве реагування** — Система реагує на загрози в реальному часі
- **Автоматичний аналіз** — Нейро-оркестратор автоматично формує попередні звіти
- **Масштабованість** — Redpanda дозволяє обробляти тисячі подій в секунду
- **Надійність** — TimescaleDB забезпечує надійне зберігання історії інцидентів

## Наступні кроки

1. Реалізувати CEP-рушій на Faust
2. Налаштувати Redpanda для потокової обробки
3. Інтегрувати з TimescaleDB для зберігання інцидентів
4. Налаштувати Grafana Alertmanager для візуалізації алертів
5. Інтегрувати з Нейро-оркестратором для автоматичного аналізу
