# PREDATOR Analytics v56.5-ELITE — Підсистема злиття сутностей (Entity Resolution Pipeline)

## Опис

Головний ворог будь-якого графа — дублікати. Фігуранти розслідувань часто реєструють компанії з навмисними помилками в назвах, використовують різні транслітерації або "гублять" цифри в ідентифікаційних кодах. Щоб Pattern Engine працював безпомилково, система повинна вміти "зшивати" різні записи в одну сутність.

## Архітектура

### 1. Трирівнева архітектура дедуплікації

Цей процес запускається на етапі ETL-конвеєра (до запису в Neo4j):

**Рівень 1: Детерміноване злиття (Exact Match)**

Жорстке злиття за унікальними ідентифікаторами (ЄДРПОУ, ІПН, номер ліцензії). Це швидкий прохід на рівні базових скриптів.

```python
async def exact_match_deduplication(entities: list[Entity]) -> list[Entity]:
    """Детерміноване злиття за унікальними ідентифікаторами."""
    
    deduplicated = {}
    
    for entity in entities:
        # Для компаній - ЄДРПОУ
        if entity.type == "company" and entity.edrpou:
            key = f"company_{entity.edrpou}"
            if key not in deduplicated:
                deduplicated[key] = entity
            else:
                # Об'єднання з існуючим
                deduplicated[key] = merge_entities(deduplicated[key], entity)
        
        # Для осіб - ІПН
        elif entity.type == "person" and entity.inn:
            key = f"person_{entity.inn}"
            if key not in deduplicated:
                deduplicated[key] = entity
            else:
                deduplicated[key] = merge_entities(deduplicated[key], entity)
    
    return list(deduplicated.values())
```

**Рівень 2: Ймовірнісне злиття (Fuzzy Matching)**

Використання алгоритмів Jaro-Winkler або Levenshtein distance для назв та адрес. Наприклад, система розуміє, що "ТОВ АГРО-ПЛЮС" та "ТОВ АГРО ПЛЮС" з однаковими директорами — це один вузол.

```python
from Levenshtein import distance as levenshtein_distance
from jellyfish import jaro_winkler_similarity

async def fuzzy_match_deduplication(entities: list[Entity], threshold: float = 0.85) -> list[Entity]:
    """Ймовірнісне злиття за схожістю назв та адрес."""
    
    deduplicated = []
    processed = set()
    
    for i, entity1 in enumerate(entities):
        if i in processed:
            continue
        
        matched = [entity1]
        
        for j, entity2 in enumerate(entities):
            if i == j or j in processed:
                continue
            
            # Порівняння назв
            name_similarity = jaro_winkler_similarity(entity1.name, entity2.name)
            
            # Порівняння адрес (якщо є)
            address_similarity = 0.0
            if entity1.address and entity2.address:
                address_similarity = jaro_winkler_similarity(entity1.address, entity2.address)
            
            # Порівняння директорів (для компаній)
            director_similarity = 0.0
            if entity1.directors and entity2.directors:
                director_similarity = jaro_winkler_similarity(entity1.directors, entity2.directors)
            
            # Загальна схожість
            total_similarity = (
                name_similarity * 0.5 +
                address_similarity * 0.3 +
                director_similarity * 0.2
            )
            
            if total_similarity >= threshold:
                matched.append(entity2)
                processed.add(j)
        
        # Злиття всіх співпадаючих сутностей
        if len(matched) > 1:
            master_entity = merge_multiple_entities(matched)
            deduplicated.append(master_entity)
        else:
            deduplicated.append(entity1)
        
        processed.add(i)
    
    return deduplicated
```

**Рівень 3: AI-Дизамбігуація (LLM Entity Resolution)**

Для найскладніших випадків. Якщо є два "Іванови І.І." без ІПН, але вони перетинаються в історії володіння суміжними компаніями, у гру вступає локальна модель (наприклад, GLM-5.1). Вона аналізує контекст і видає вердикт з рівнем впевненості (Confidence Score).

```python
async def ai_entity_disambiguation(entities: list[Entity]) -> list[Entity]:
    """AI-Дизамбігуація для найскладніших випадків."""
    
    # Групування потенційних дублікатів
    potential_duplicates = find_potential_duplicates(entities)
    
    resolved_entities = []
    
    for group in potential_duplicates:
        if len(group) == 1:
            resolved_entities.append(group[0])
            continue
        
        # Аналіз контексту через LLM
        context = build_context_from_graph(group)
        
        prompt = f"""
        Аналізуй наступні записи та визначи, чи вони належать одній сутності:
        
        {context}
        
        Відповідь у форматі JSON:
        {{
            "is_same_entity": true/false,
            "confidence_score": 0.0-1.0,
            "reasoning": "обґрунтування"
        }}
        """
        
        llm_response = await llm.generate(prompt)
        result = parse_llm_response(llm_response)
        
        if result["is_same_entity"] and result["confidence_score"] >= 0.7:
            # Злиття в одну сутність
            master_entity = merge_multiple_entities(group)
            master_entity.resolution_method = "AI"
            master_entity.confidence_score = result["confidence_score"]
            resolved_entities.append(master_entity)
        else:
            # Залишаємо окремими
            resolved_entities.extend(group)
    
    return resolved_entities
```

### 2. Стратегія збереження оригіналів (SAME_AS Edges)

В розвідці не можна фізично видаляти сирі дані. Замість того, щоб перезаписувати вузли, система залишає оригінальні записи, але об'єднує їх спеціальним ребром:

```
(Person_Record_1)-[:SAME_AS {confidence: 0.98, method: "AI"}]->(Person_Master_Node)
(Person_Record_2)-[:SAME_AS {confidence: 0.95, method: "FUZZY"}]->(Person_Master_Node)
```

Аналітичні запити завжди йдуть через `Master_Node`, але аналітик в UI може "провалитися" до оригінального брудного запису.

**Реалізація в Neo4j:**

```cypher
// Створення Master Node
CREATE (master:Person:Master {
    id: "master_person_123",
    full_name: "Іванов Іван Іванович",
    inn: "1234567890",
    resolution_method: "AI",
    confidence_score: 0.98
})

// Зв'язування оригінальних записів
MATCH (record1:Person {id: "record_1"})
MATCH (record2:Person {id: "record_2"})
MATCH (master:Person:Master {id: "master_person_123"})
CREATE (record1)-[:SAME_AS {confidence: 0.98, method: "AI", timestamp: datetime()}]->(master)
CREATE (record2)-[:SAME_AS {confidence: 0.95, method: "FUZZY", timestamp: datetime()}]->(master)
```

**Запити через Master Node:**

```cypher
// Аналітичний запит через Master Node
MATCH (master:Person:Master)-[:SAME_AS]-(record:Person)
MATCH (master)-[:OWNS]->(c:Company)
RETURN master.full_name, c.name
```

**Перегляд оригінальних записів:**

```cypher
// Перегляд всіх оригінальних записів для Master Node
MATCH (master:Person:Master {id: "master_person_123"})<-[:SAME_AS]-(record:Person)
RETURN record
```

## Переваги

- **Точність** — Трирівнева архітектура забезпечує максимальну точність злиття
- **Прозорість** — SAME_AS ребра дозволяють відстежувати походження даних
- **Адаптивність** — AI-дизамбігуація обробляє найскладніші випадки
- **Збереження даних** — Оригінальні записи зберігаються для аудиту

## Наступні кроки

1. Реалізувати детерміноване злиття (Exact Match)
2. Реалізувати ймовірнісне злиття (Fuzzy Matching)
3. Інтегрувати AI-дизамбігуацію через GLM-5.1
4. Створити SAME_AS ребра в Neo4j
5. Налаштувати запити через Master Node
