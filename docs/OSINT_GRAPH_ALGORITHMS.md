# 🕸️ 120 Граф-Алгоритмів Розслідування для PREDATOR Analytics

Цей документ описує розширені патерни та запити (Cypher) для виявлення економічних та корупційних схем за допомогою Neo4j (Graph Data Science).

## 1. Структурні аномалії (Мережеві патерни)

### 1.1. Циклічний рух товарів (Phantom Flow)
Виявляє компанії, які купують і продають один одному по колу для штучного завищення обороту (каруселі ПДВ).
```cypher
MATCH path = (a:Company)-[:SELLS_TO*3..5]->(a)
WITH nodes(path) as cycle_nodes, reduce(val=0, r in relationships(path) | val + r.value_uah) as total_volume
WHERE total_volume > 1000000
RETURN cycle_nodes, total_volume
```

### 1.2. Вузол-прокладка (Smurfing / Conduit Node)
Компанія, яка не має власних активів/співробітників, але пропускає через себе великі обсяги транзакцій (високий betweenness, низький retention).
```cypher
MATCH (in:Company)-[r_in:SELLS_TO]->(c:Company)-[r_out:SELLS_TO]->(out:Company)
WITH c, sum(r_in.value_uah) as total_in, sum(r_out.value_uah) as total_out
WHERE total_in > 1000000 AND abs(total_in - total_out) / total_in < 0.05
RETURN c.name, total_in, total_out
```

### 1.3. Приховані монополії (Shadow Holding)
Група формально незалежних компаній, які ділять одних і тих же засновників, адреси, телефони та IP-адреси.
```cypher
MATCH (c1:Company)-[:REGISTERED_AT|USES_CONTACT|HOSTED_ON]->(shared)<-[:REGISTERED_AT|USES_CONTACT|HOSTED_ON]-(c2:Company)
WHERE c1 <> c2
WITH c1, c2, count(shared) as shared_points
WHERE shared_points > 2
RETURN c1.name, c2.name, shared_points
ORDER BY shared_points DESC
```

## 2. Аналіз Бенефіціарів (UBO) та PEP (Політично Значущі Особи)

### 2.1. Ланцюг до офшору
Пошук шляху володіння від української компанії до юрисдикції з високим ризиком (офшор).
```cypher
MATCH p = (c:Company)-[:SUBSIDIARY_OF|BENEFICIAL_OWNER*1..5]->(offshore:Company)-[:REGISTERED_IN]->(country:Country {risk_level: 'HIGH'})
RETURN p
```

### 2.2. Конфлікт інтересів (PEP -> Tender)
Виявлення випадків, коли компанія, пов'язана з чиновником (PEP), виграє державний тендер у відомстві, де цей чиновник працює.
```cypher
MATCH (pep:Person {pep_status: true})-[:DIRECTOR_OF|FOUNDER_OF|BENEFICIAL_OWNER*1..3]->(c:Company)
MATCH (c)-[:WON_TENDER]->(t:Tender)<-[:ISSUED_BY]-(agency:GovAgency)
MATCH (pep)-[:WORKS_AT]->(agency)
RETURN pep.full_name, c.name, t.value_uah, agency.name
```

## 3. Митні Ризики та Контрабанда

### 3.1. Аномальне заниження митної вартості
Компанія імпортує товар за ціною, яка суттєво (на 50%+) нижча за середню ринкову ціну для цього ж коду УКТЗЕД.
```cypher
MATCH (c:Company)-[imp:IMPORTS]->(p:Product)
WITH p.hs_code as hs_code, avg(imp.value_usd / imp.volume_kg) as avg_market_price
MATCH (c2:Company)-[imp2:IMPORTS]->(p2:Product {hs_code: hs_code})
WHERE (imp2.value_usd / imp2.volume_kg) < (avg_market_price * 0.5)
RETURN c2.name, p2.description, (imp2.value_usd / imp2.volume_kg) as anomaly_price, avg_market_price
```

### 3.2. Митний монополіст (Брокер-рішала)
Виявлення брокерів, через яких проходить аномально великий відсоток імпорту певного ризикованого товару на конкретному митному посту.
```cypher
MATCH (c:Company)-[:USES_BROKER]->(b:Broker)
MATCH (c)-[imp:IMPORTS]->(p:Product {category: 'HIGH_RISK'})
MATCH (c)-[:CLEARS_CUSTOMS_AT]->(post:CustomsPost)
WITH b, post, count(imp) as declarations, sum(imp.value_usd) as total_value
ORDER BY total_value DESC
RETURN b.name, post.name, declarations, total_value
```

## 4. Використання Алгоритмів GDS (Graph Data Science)

### 4.1. PageRank для виявлення системних гравців
```cypher
CALL gds.pageRank.stream('financial_graph')
YIELD nodeId, score
RETURN gds.util.asNode(nodeId).name AS name, score
ORDER BY score DESC, name ASC
```

### 4.2. Weakly Connected Components (Виявлення "бульбашок")
```cypher
CALL gds.wcc.stream('business_network')
YIELD nodeId, componentId
WITH componentId, count(nodeId) as size, collect(gds.util.asNode(nodeId).name) as members
WHERE size > 5 AND size < 50
RETURN componentId, size, members
ORDER BY size DESC
```

*(Документ розширюватиметься в процесі розвитку аналітичного ядра Predator)*
