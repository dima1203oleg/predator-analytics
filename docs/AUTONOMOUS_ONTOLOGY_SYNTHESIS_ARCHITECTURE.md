# 🧬 Autonomous Schema Synthesis (ASS) — Архітектура
**PREDATOR Analytics v61.0-ELITE**  
**Кіллер-фіча #1: Асиметрична перевага над Palantir Foundry**

---

## 📋 Вступ

**Проблема Palantir Foundry:** Онтологію (структуру зв'язків) місяцями будують дорогі інженери вручну.

**Інновація PREDATOR:** **Autonomous Schema Synthesis (ASS)**. Система сама аналізує хаотичні текстові масиви, судові реєстри та митні декларації, знаходить нові сутності й **самостійно добудовує графову модель у Neo4j**.

---

## 🎯 Мета

- **Автономність:** Система сама виявляє нові типи корупційних ланцюжків і створює для них зв'язки без коду.
- **Швидкість:** Нові патерни з'являються в графі за хвилини, а не місяці.
- **Точність:** LLM-підтвердження перед створенням нових relationship types.
- **Еволюційність:** Онтологія постійно вдосконалюється на основі нових даних.

---

## 🏗️ Архітектура

```
┌─────────────────────────────────────────────────────────────────┐
│                    Ingestion Worker v55.1                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  PDF Parser  │    │ CSV Parser   │    │Telegram Parser│      │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘      │
│         │                   │                   │                │
│         └───────────────────┼───────────────────┘                │
│                             ▼                                    │
│              ┌──────────────────────────┐                        │
│              │   Raw Text Extractor     │                        │
│              └──────────────┬───────────┘                        │
│                             ▼                                    │
│  ┌──────────────────────────────────────────────────┐            │
│  │         🧠 NLP Pipeline (spaCy + Ollama)          │            │
│  │  ┌──────────────┐  ┌──────────────┐            │            │
│  │  │ Entity       │  │ Relationship │            │            │
│  │  │ Extraction   │  │ Detection    │            │            │
│  │  └──────┬───────┘  └──────┬───────┘            │            │
│  │         │                 │                     │            │
│  │         └────────┬────────┘                     │            │
│  │                  ▼                              │            │
│  │  ┌──────────────────────────┐                  │            │
│  │  │   Pattern Discovery      │                  │            │
│  │  │   (Monte Carlo + LLM)    │                  │            │
│  │  └──────────────┬───────────┘                  │            │
│  └────────────────┼───────────────────────────────┘            │
│                   ▼                                            │
│  ┌──────────────────────────────────────────────────┐            │
│  │        🤖 Schema Evolution Engine                │            │
│  │  ┌──────────────┐  ┌──────────────┐            │            │
│  │  │ New Entity   │  │ New Relation │            │            │
│  │  │ Validator    │  │ Validator    │            │            │
│  │  └──────┬───────┘  └──────┬───────┘            │            │
│  │         │                 │                     │            │
│  │         └────────┬────────┘                     │            │
│  │                  ▼                              │            │
│  │  ┌──────────────────────────┐                  │            │
│  │  │   Auto-Constraint       │                  │            │
│  │  │   Generator             │                  │            │
│  │  └──────────────┬───────────┘                  │            │
│  └────────────────┼───────────────────────────────┘            │
│                   ▼                                            │
│  ┌──────────────────────────────────────────────────┐            │
│  │         📊 Neo4j Auto-Sync                       │            │
│  │  ┌──────────────┐  ┌──────────────┐            │            │
│  │  │ Cypher       │  │ Schema       │            │            │
│  │  │ Generator    │  │ Migration    │            │            │
│  │  └──────┬───────┘  └──────┬───────┘            │            │
│  └────────────────┼───────────────────────────────┘            │
└───────────────────┼─────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Neo4j 5 (APOC + GDS)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Company    │  │   Person     │  │  Declaration │          │
│  │   Node       │  │   Node       │  │   Node       │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         └────────┬────────┴────────┬────────┘                   │
│                  ▼                 ▼                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   OWNS       │  │  DIRECTS     │  │   FILED      │          │
│  │ (relationship)│  │ (relationship)│  │ (relationship)│          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  🆕 Auto-Generated:                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │MUTUAL_       │  │MONEY_        │  │SHELL_        │          │
│  │BENEFICIARY   │  │LAUNDERING_   │  │COMPANY_      │          │
│  │(auto)        │  │PATH          │  │CLUSTER       │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Компоненти

### 1. NLP Pipeline (spaCy + Ollama)

**Мета:** Виділення сутностей та виявлення зв'язків з сирих текстів.

**Технології:**
- **spaCy 3.8+** (ukrainian model: `uk_core_news_sm` або custom-trained)
- **Ollama** (локальний LLM: `qwen2.5-coder:7b` або `nemotron-cascade-2`)
- **RapidFuzz** для fuzzy matching

**Функціонал:**
```python
# services/ingestion-worker/app/core/nlp_pipeline.py

class NLPPipeline:
    """NLP Pipeline для Autonomous Schema Synthesis."""
    
    def __init__(self):
        self.nlp = spacy.load("uk_core_news_sm")
        self.llm = get_llm_service()  # Ollama local
    
    async def extract_entities(self, text: str) -> List[Entity]:
        """Виділяє сутності з тексту."""
        doc = self.nlp(text)
        entities = []
        
        # spaCy NER
        for ent in doc.ents:
            entities.append(Entity(
                text=ent.text,
                label=ent.label_,
                confidence=0.8
            ))
        
        # LLM-підтвердження для невизначених сутностей
        unknown_entities = [e for e in entities if e.label == "UNKNOWN"]
        if unknown_entities:
            confirmed = await self._llm_confirm_entities(unknown_entities, text)
            entities.extend(confirmed)
        
        return entities
    
    async def detect_relationships(self, entities: List[Entity], text: str) -> List[Relationship]:
        """Виявляє зв'язки між сутностями."""
        # LLM-аналіз контексту
        prompt = f"""
        Аналізуй текст та вияв зв'язки між сутностями:
        
        Текст: {text}
        Сутності: {[e.text for e in entities]}
        
        Поверни JSON зі зв'язками:
        {{
            "relationships": [
                {{
                    "source": "назва сутності",
                    "target": "назва сутності",
                    "type": "тип зв'язку (наприклад: OWNS, DIRECTS, MUTUAL_BENEFICIARY)",
                    "confidence": 0.95
                }}
            ]
        }}
        """
        
        response = await self.llm.generate(prompt, format="json")
        return self._parse_relationships(response.content)
```

### 2. Pattern Discovery Engine

**Мета:** Виявлення нових патернів корупційних ланцюжків.

**Алгоритм:**
1. **Monte Carlo Simulation** — тисячі варіацій графу
2. **Statistical Analysis** — виявлення аномалій
3. **LLM Validation** — підтвердження нових патернів

```python
# services/ingestion-worker/app/core/pattern_discovery.py

class PatternDiscoveryEngine:
    """Виявлення нових патернів у графі."""
    
    def __init__(self, neo4j_driver):
        self.driver = neo4j_driver
        self.llm = get_llm_service()
    
    async def discover_new_patterns(self, sample_size: int = 1000) -> List[Pattern]:
        """Виявляє нові патерни за допомогою Monte Carlo."""
        # 1. Отримуємо підграф
        subgraph = await self._sample_subgraph(sample_size)
        
        # 2. Monte Carlo simulation
        patterns = []
        for _ in range(100):  # 100 ітерацій
            simulated = self._simulate_graph(subgraph)
            new_patterns = self._detect_anomalies(simulated)
            patterns.extend(new_patterns)
        
        # 3. LLM-підтвердження
        confirmed = await self._llm_validate_patterns(patterns)
        return confirmed
    
    async def _llm_validate_patterns(self, patterns: List[Pattern]) -> List[Pattern]:
        """LLM-підтвердження нових патернів."""
        prompt = f"""
        Проаналізуй наступні патерни та підтверди, чи вони є реальними корупційними схемами:
        
        {self._patterns_to_json(patterns)}
        
        Поверни JSON з підтвердженими патернами:
        {{
            "confirmed": [
                {{
                    "pattern_id": "ID",
                    "description": "опис",
                    "relationship_type": "MUTUAL_BENEFICIARY",
                    "confidence": 0.9
                }}
            ]
        }}
        """
        
        response = await self.llm.generate(prompt, format="json")
        return self._parse_confirmed_patterns(response.content)
```

### 3. Schema Evolution Engine

**Мета:** Автоматичне створення нових типів сутностей та зв'язків.

**Процес:**
1. **Validation** — перевірка нових типів
2. **Constraint Generation** — створення Neo4j constraints
3. **Migration** — безпечне оновлення схеми

```python
# services/ingestion-worker/app/core/schema_evolution.py

class SchemaEvolutionEngine:
    """Автоматична еволюція схеми Neo4j."""
    
    def __init__(self, neo4j_driver):
        self.driver = neo4j_driver
        self.llm = get_llm_service()
    
    async def evolve_schema(self, new_patterns: List[Pattern]) -> SchemaUpdate:
        """Еволюціонує схему на основі нових патернів."""
        # 1. Валідація
        validated = await self._validate_patterns(new_patterns)
        
        # 2. Генерація Cypher для нових relationship types
        cypher_commands = []
        for pattern in validated:
            if pattern.relationship_type not in self._existing_relationships():
                cypher = self._generate_relationship_constraint(pattern)
                cypher_commands.append(cypher)
        
        # 3. Виконання міграції
        await self._execute_migration(cypher_commands)
        
        # 4. Логування еволюції
        await self._log_evolution(validated)
        
        return SchemaUpdate(
            new_relationships=len(cypher_commands),
            patterns_applied=len(validated),
            timestamp=datetime.now(UTC)
        )
    
    def _generate_relationship_constraint(self, pattern: Pattern) -> str:
        """Генерує Cypher constraint для нового relationship type."""
        return f"""
        // Auto-generated by Autonomous Schema Synthesis
        // Pattern: {pattern.description}
        // Confidence: {pattern.confidence}
        
        CREATE INDEX rel_{pattern.relationship_type.lower()}_date IF NOT EXISTS
        FOR ()-[r:{pattern.relationship_type}]-() ON (r.created_at);
        """
```

### 4. Neo4j Auto-Sync

**Мета:** Синхронізація еволюційної схеми з Neo4j.

```python
# services/ingestion-worker/app/core/neo4j_auto_sync.py

class Neo4jAutoSync:
    """Автоматична синхронізація схеми з Neo4j."""
    
    def __init__(self, neo4j_driver):
        self.driver = neo4j_driver
    
    async def apply_schema_update(self, update: SchemaUpdate):
        """Застосовує оновлення схеми."""
        async with self.driver.session() as session:
            for command in update.cypher_commands:
                await session.run(command)
        
        logger.info(f"Schema updated: {update.new_relationships} new relationships")
    
    async def backfill_relationships(self, pattern: Pattern):
        """Заповнює нові зв'язки для існуючих даних."""
        cypher = self._generate_backfill_cypher(pattern)
        
        async with self.driver.session() as session:
            result = await session.run(cypher)
            count = result.summary().counters.relationships_created
        
        logger.info(f"Backfilled {count} relationships for {pattern.relationship_type}")
```

---

## 🔄 Workflow

```
1. 📄 Ingestion
   ├─ PDF/CSV/Telegram Parser → Raw Text
   └─ Extract entities (spaCy)

2. 🧠 NLP Analysis
   ├─ Entity Extraction (spaCy + Ollama)
   ├─ Relationship Detection (LLM)
   └─ Pattern Discovery (Monte Carlo)

3. 🤖 Schema Evolution
   ├─ Validate new patterns (LLM)
   ├─ Generate constraints (Cypher)
   └─ Apply migration (Neo4j)

4. 📊 Graph Update
   ├─ Create new relationship types
   ├─ Backfill existing data
   └─ Log evolution

5. 🎯 UI Visualization
   └─ Show ontology evolution timeline
```

---

## 📦 Впровадження

### Фаза 1: Базовий NLP Pipeline (1 тиждень)
- [ ] Встановити spaCy з українською моделлю
- [ ] Інтегрувати Ollama для entity confirmation
- [ ] Створити базовий entity extractor
- [ ] Додати relationship detection

### Фаза 2: Pattern Discovery (1 тиждень)
- [ ] Реалізувати Monte Carlo simulation
- [ ] Додати statistical anomaly detection
- [ ] Інтегрувати LLM validation
- [ ] Створити pattern storage

### Фаза 3: Schema Evolution (1 тиждень)
- [ ] Реалізувати constraint generator
- [ ] Додати migration engine
- [ ] Створити backfill mechanism
- [ ] Додати evolution logging

### Фаза 4: Integration (1 тиждень)
- [ ] Інтегрувати в ingestion-worker
- [ ] Додати triggers на нові дані
- [ ] Створити UI для візуалізації
- [ ] Додати monitoring

---

## 🎯 Ключові Метрики

- **Entity Extraction Accuracy:** > 95%
- **Relationship Detection Precision:** > 90%
- **Pattern Discovery Speed:** < 5 хвилин на 1000 документів
- **Schema Evolution Time:** < 1 хвилини на новий relationship type
- **Backfill Performance:** > 10K relationships/хвилина

---

## 🔒 Безпека

- **LLM Validation:** Всі нові relationship types підтверджуються LLM
- **Constraint Safety:** Constraints генеруються з перевіркою на конфлікти
- **Rollback:** Можливість відкату до попередньої схеми
- **Audit Log:** Всі зміни логуються в PostgreSQL

---

## 📚 Додаткові Ресурси

- [spaCy Ukrainian Models](https://spacy.io/models/uk)
- [Neo4j APOC Documentation](https://neo4j.com/docs/apoc/current/)
- [Ollama Models](https://ollama.com/library)
- [Monte Carlo Graph Simulation](https://networkx.org/documentation/stable/reference/generated/networkx.algorithms.approximation.simulated_annealing.html)

---

## 🚀 Наступні Кроки

1. Почати з Фази 1: Базовий NLP Pipeline
2. Створити модуль `services/ingestion-worker/app/core/nlp_pipeline.py`
3. Додати spaCy в `requirements.txt`
4. Протестувати на митних деклараціях
5. Розширити на судові реєстри

---

**Статус:** 🟡 В розробці  
**Пріоритет:** HIGH  
**Вплив:** Критичний (асиметрична перевага над Palantir)
