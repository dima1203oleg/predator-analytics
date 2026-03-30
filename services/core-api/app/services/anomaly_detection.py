"""Anomaly Detection Service — Виявлення аномалій.

Методи:
- Тимчасові ряди: аналіз динаміки імпорту/експорту
- Кластерний аналіз: виявлення груп компаній зі спільними ознаками
- Паттерн-матчинг: пошук відомих схем (скрутка ПДВ, пересорт)
- Статистичні методи: Z-score, IQR, Isolation Forest
"""
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import StrEnum
import logging
import math
from typing import Any, Dict # Додано Dict для більш точної типізації

logger = logging.getLogger(__name__)


class AnomalyType(StrEnum):
    """Типи аномалій."""

    VOLUME_SPIKE = "volume_spike"  # Різкий стрибок обсягів
    PRICE_ANOMALY = "price_anomaly"  # Аномальна ціна
    PATTERN_MATCH = "pattern_match"  # Відомий паттерн шахрайства
    NETWORK_CLUSTER = "network_cluster"  # Підозріла мережа компаній
    TEMPORAL_ANOMALY = "temporal_anomaly"  # Часова аномалія
    STATISTICAL_OUTLIER = "statistical_outlier"  # Статистичний викид


class PatternType(StrEnum):
    """Типи відомих паттернів шахрайства."""

    VAT_CAROUSEL = "vat_carousel"  # Карусельна схема ПДВ
    TRANSFER_PRICING = "transfer_pricing"  # Трансфертне ціноутворення
    CUSTOMS_UNDERVALUATION = "customs_undervaluation"  # Заниження митної вартості
    PRODUCT_MISCLASSIFICATION = "product_misclassification"  # Пересортиця
    SHELL_COMPANY_CHAIN = "shell_company_chain"  # Ланцюг фіктивних компаній
    ROUND_TRIPPING = "round_tripping"  # Круговий рух коштів
    LAYERING = "layering"  # Багатошарові транзакції


@dataclass
class Anomaly:
    """Виявлена аномалія."""

    id: str
    type: AnomalyType
    severity: str  # critical, high, medium, low
    confidence: float  # 0.0 - 1.0
    description: str
    entities: list[str] = field(default_factory=list)
    details: dict[str, Any] = field(default_factory=dict)
    detected_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    pattern: PatternType | None = None


@dataclass
class TimeSeriesPoint:
    """Точка часового ряду."""

    timestamp: datetime
    value: float
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class AnomalyReport:
    """Звіт про аномалії."""

    total_anomalies: int
    by_type: dict[str, int]
    by_severity: dict[str, int]
    anomalies: list[Anomaly]
    analysis_period: dict[str, str]
    generated_at: datetime = field(default_factory=lambda: datetime.now(UTC))


class AnomalyDetectionService:
    """Сервіс виявлення аномалій."""

    # Пороги для виявлення
    Z_SCORE_THRESHOLD = 3.0  # Стандартне відхилення
    IQR_MULTIPLIER = 1.5  # Для IQR методу
    VOLUME_SPIKE_THRESHOLD = 3.0  # 300% від середнього
    PRICE_DEVIATION_THRESHOLD = 0.5  # 50% відхилення від ринкової ціни

    def __init__(self) -> None:
        self.known_patterns = self._load_known_patterns()

    def _load_known_patterns(self) -> Dict[PatternType, Dict[str, Any]]: # Властивості словника можуть бути довільними
        """Завантаження відомих паттернів шахрайства."""
        return {
            PatternType.VAT_CAROUSEL: {
                "name": "Карусельна схема ПДВ",
                "description": "Циклічний рух товарів між компаніями для незаконного відшкодування ПДВ",
                "indicators": [
                    "circular_transactions",
                    "rapid_company_creation",
                    "no_real_goods_movement",
                    "vat_refund_claims",
                ],
                "severity": "critical",
            },
            PatternType.TRANSFER_PRICING: {
                "name": "Трансфертне ціноутворення",
                "description": "Маніпуляції з цінами між пов'язаними компаніями",
                "indicators": [
                    "related_party_transactions",
                    "price_deviation_from_market",
                    "offshore_connections",
                    "profit_shifting",
                ],
                "severity": "high",
            },
            PatternType.CUSTOMS_UNDERVALUATION: {
                "name": "Заниження митної вартості",
                "description": "Декларування товарів за заниженою вартістю",
                "indicators": [
                    "price_below_market",
                    "inconsistent_documentation",
                    "high_risk_origin_country",
                    "frequent_importer",
                ],
                "severity": "high",
            },
            PatternType.PRODUCT_MISCLASSIFICATION: {
                "name": "Пересортиця",
                "description": "Декларування товарів під іншим кодом УКТЗЕД",
                "indicators": [
                    "weight_price_mismatch",
                    "unusual_hs_code",
                    "country_product_mismatch",
                ],
                "severity": "high",
            },
            PatternType.SHELL_COMPANY_CHAIN: {
                "name": "Ланцюг фіктивних компаній",
                "description": "Використання ланцюга компаній-прокладок",
                "indicators": [
                    "multiple_intermediaries",
                    "shell_company_signs",
                    "common_beneficial_owner",
                    "same_registration_address",
                ],
                "severity": "critical",
            },
            PatternType.ROUND_TRIPPING: {
                "name": "Круговий рух коштів",
                "description": "Виведення та повернення коштів через офшори",
                "indicators": [
                    "offshore_transactions",
                    "circular_money_flow",
                    "fake_investments",
                ],
                "severity": "critical",
            },
            PatternType.LAYERING: {
                "name": "Багатошарові транзакції",
                "description": "Приховування походження коштів через множинні транзакції",
                "indicators": [
                    "multiple_transactions",
                    "rapid_movement",
                    "multiple_jurisdictions",
                    "complex_structure",
                ],
                "severity": "critical",
            },
        }

    # ======================== TIME SERIES ANALYSIS ========================

    def analyze_time_series(
        self,
        data: list[TimeSeriesPoint],
        method: str = "zscore",
    ) -> list[Anomaly]:
        """Аналіз часового ряду на аномалії."""
        if len(data) < 10:
            return []

        values = [point.value for point in data]

        if method == "zscore":
            anomaly_indices = self._detect_zscore_anomalies(values)
        elif method == "iqr":
            anomaly_indices = self._detect_iqr_anomalies(values)
        elif method == "moving_average":
            anomaly_indices = self._detect_moving_average_anomalies(values)
        else:
            anomaly_indices = self._detect_zscore_anomalies(values)

        anomalies = []
        for idx in anomaly_indices:
            point = data[idx]
            mean_val = sum(values) / len(values)
            deviation = (point.value - mean_val) / mean_val * 100 if mean_val != 0 else 0

            anomalies.append(Anomaly(
                id=f"ts_anomaly_{idx}_{int(point.timestamp.timestamp())}",
                type=AnomalyType.VOLUME_SPIKE if point.value > mean_val else AnomalyType.STATISTICAL_OUTLIER,
                severity="high" if abs(deviation) > 200 else "medium",
                confidence=min(0.95, abs(deviation) / 100),
                description=f"Аномальне значення: {point.value:.2f} (відхилення {deviation:.1f}%)",
                details={
                    "timestamp": point.timestamp.isoformat(),
                    "value": point.value,
                    "mean": mean_val,
                    "deviation_percent": deviation,
                    "method": method,
                    "metadata": point.metadata,
                },
            ))

        return anomalies

    def _detect_zscore_anomalies(self, values: list[float]) -> list[int]:
        """Виявлення аномалій методом Z-score."""
        if len(values) < 2:
            return []

        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        std = math.sqrt(variance) if variance > 0 else 1

        anomalies = []
        for i, value in enumerate(values):
            z_score = abs((value - mean) / std) if std > 0 else 0
            if z_score > self.Z_SCORE_THRESHOLD:
                anomalies.append(i)

        return anomalies

    def _detect_iqr_anomalies(self, values: list[float]) -> list[int]:
        """Виявлення аномалій методом IQR (Interquartile Range)."""
        sorted_values = sorted(values)
        n = len(sorted_values)

        q1 = sorted_values[n // 4]
        q3 = sorted_values[3 * n // 4]
        iqr = q3 - q1

        lower_bound = q1 - self.IQR_MULTIPLIER * iqr
        upper_bound = q3 + self.IQR_MULTIPLIER * iqr

        anomalies = []
        for i, value in enumerate(values):
            if value < lower_bound or value > upper_bound:
                anomalies.append(i)

        return anomalies

    def _detect_moving_average_anomalies(
        self,
        values: list[float],
        window: int = 7,
    ) -> list[int]:
        """Виявлення аномалій методом ковзного середнього."""
        if len(values) < window:
            return []

        anomalies = []

        for i in range(window, len(values)):
            window_values = values[i - window:i]
            ma = sum(window_values) / window
            std = math.sqrt(sum((x - ma) ** 2 for x in window_values) / window)

            if std > 0:
                z_score = abs((values[i] - ma) / std)
                if z_score > self.Z_SCORE_THRESHOLD:
                    anomalies.append(i)

        return anomalies

    # ======================== PATTERN MATCHING ========================

    def detect_patterns(
        self,
        entity_data: Dict[str, Any], # Властивості словника можуть бути довільними
        transactions: list[Dict[str, Any]] | None = None, # Властивості словника можуть бути довільними
    ) -> list[Anomaly]:
        """Виявлення відомих паттернів шахрайства."""
        anomalies = []

        # Перевірка кожного паттерну
        for pattern_type, pattern_info in self.known_patterns.items():
            match_score, matched_indicators = self._check_pattern(
                pattern_type,
                pattern_info,
                entity_data,
                transactions,
            )

            if match_score >= 0.6:  # 60% збіг
                anomalies.append(Anomaly(
                    id=f"pattern_{pattern_type.value}_{hash(str(entity_data.get('id', '')))}",
                    type=AnomalyType.PATTERN_MATCH,
                    severity=pattern_info["severity"],
                    confidence=match_score,
                    description=f"Виявлено паттерн: {pattern_info['name']}",
                    pattern=pattern_type,
                    entities=[entity_data.get("id", "")],
                    details={
                        "pattern_name": pattern_info["name"],
                        "pattern_description": pattern_info["description"],
                        "matched_indicators": matched_indicators,
                        "total_indicators": len(pattern_info["indicators"]),
                        "match_score": match_score,
                    },
                ))

        return anomalies

    def _check_pattern(
        self,
        pattern_type: PatternType,
        pattern_info: Dict[str, Any], # Властивості словника можуть бути довільними
        entity_data: Dict[str, Any], # Властивості словника можуть бути довільними
        transactions: list[Dict[str, Any]] | None, # Властивості словника можуть бути довільними
    ) -> tuple[float, list[str]]:
        """Перевірка конкретного паттерну."""
        indicators = pattern_info["indicators"]
        matched = []

        for indicator in indicators:
            if self._check_indicator(indicator, entity_data, transactions):
                matched.append(indicator)

        score = len(matched) / len(indicators) if indicators else 0
        return score, matched

    def _check_indicator(
        self,
        indicator: str,
        entity_data: Dict[str, Any], # Властивості словника можуть бути довільними
        transactions: list[Dict[str, Any]] | None, # Властивості словника можуть бути довільними
    ) -> bool:
        """Перевірка конкретного індикатора."""
        # Циклічні транзакції
        if indicator == "circular_transactions":
            return self._check_circular_transactions(transactions)

        # Швидке створення компаній
        if indicator == "rapid_company_creation":
            reg_date = entity_data.get("registration_date")
            if reg_date:
                days_since_reg = (datetime.now(UTC) - datetime.fromisoformat(reg_date)).days
                return days_since_reg < 180  # Менше 6 місяців

        # Офшорні зв'язки
        if indicator == "offshore_connections":
            return entity_data.get("has_offshore_connections", False)

        # Ознаки фіктивності
        if indicator == "shell_company_signs":
            return entity_data.get("shell_company_score", 0) > 50

        # Відхилення ціни від ринкової
        if indicator == "price_deviation_from_market":
            return entity_data.get("price_deviation_percent", 0) > 50

        # Пов'язані сторони
        if indicator == "related_party_transactions":
            return entity_data.get("related_party_transactions_percent", 0) > 70

        # Спільний бенефіціар
        if indicator == "common_beneficial_owner":
            return entity_data.get("shared_beneficiary", False)

        # Та сама адреса реєстрації
        if indicator == "same_registration_address":
            return entity_data.get("companies_at_address", 1) > 10

        # Множинні посередники
        if indicator == "multiple_intermediaries":
            return entity_data.get("intermediaries_count", 0) > 3

        # Ціна нижче ринкової
        if indicator == "price_below_market":
            return entity_data.get("price_vs_market_percent", 100) < 70

        return False

    def _check_circular_transactions(self, transactions: list[Dict[str, Any]] | None) -> bool: # Властивості словника можуть бути довільними
        """Перевірка на циклічні транзакції."""
        if not transactions or len(transactions) < 3:
            return False

        # Будуємо граф транзакцій
        graph = defaultdict(set)
        for tx in transactions:
            sender = tx.get("sender_id")
            receiver = tx.get("receiver_id")
            if sender and receiver:
                graph[sender].add(receiver)

        # Шукаємо цикли (спрощений DFS)
        def has_cycle(node: str, visited: set, path: set) -> bool:
            visited.add(node)
            path.add(node)

            for neighbor in graph.get(node, []):
                if neighbor in path:
                    return True
                if neighbor not in visited and has_cycle(neighbor, visited, path):
                    return True

            path.remove(node)
            return False

        visited: set[str] = set()
        return any(node not in visited and has_cycle(node, visited, set()) for node in graph)

    # ======================== NETWORK ANALYSIS ========================

    def detect_network_anomalies(
        self,
        entities: list[dict[str, Any]],
        relations: list[dict[str, Any]],
    ) -> list[Anomaly]:
        """Виявлення аномалій у мережі зв'язків."""
        anomalies = []

        # 1. Виявлення щільних кластерів
        clusters = self._find_dense_clusters(entities, relations)
        for cluster in clusters:
            if cluster["density"] > 0.8 and cluster["size"] >= 3:
                anomalies.append(Anomaly(
                    id=f"cluster_{hash(str(cluster['members']))}",
                    type=AnomalyType.NETWORK_CLUSTER,
                    severity="high" if cluster["size"] > 5 else "medium",
                    confidence=cluster["density"],
                    description=f"Виявлено щільний кластер з {cluster['size']} компаній",
                    entities=cluster["members"],
                    details={
                        "cluster_size": cluster["size"],
                        "density": cluster["density"],
                        "common_attributes": cluster.get("common_attributes", []),
                    },
                ))

        # 2. Виявлення хабів (центральних вузлів)
        hubs = self._find_hubs(entities, relations)
        for hub in hubs:
            if hub["degree"] > 20:  # Більше 20 зв'язків
                anomalies.append(Anomaly(
                    id=f"hub_{hub['id']}",
                    type=AnomalyType.NETWORK_CLUSTER,
                    severity="medium",
                    confidence=0.7,
                    description=f"Виявлено центральний вузол з {hub['degree']} зв'язками",
                    entities=[hub["id"]],
                    details={
                        "degree": hub["degree"],
                        "entity_name": hub.get("name"),
                        "connected_entities": hub.get("connected", [])[:10],
                    },
                ))

        # 3. Виявлення спільних атрибутів
        shared_attributes = self._find_shared_attributes(entities)
        for attr in shared_attributes:
            if attr["count"] >= 5:
                anomalies.append(Anomaly(
                    id=f"shared_{attr['attribute']}_{hash(str(attr['value']))}",
                    type=AnomalyType.NETWORK_CLUSTER,
                    severity="medium",
                    confidence=0.6,
                    description=f"Виявлено {attr['count']} компаній зі спільним {attr['attribute']}",
                    entities=attr["entities"],
                    details={
                        "attribute": attr["attribute"],
                        "value": attr["value"],
                        "count": attr["count"],
                    },
                ))

        return anomalies

    def _find_dense_clusters(
        self,
        entities: list[Dict[str, Any]], # Властивості словника можуть бути довільними
        relations: list[Dict[str, Any]], # Властивості словника можуть бути довільними
    ) -> list[Dict[str, Any]]: # Властивості словника можуть бути довільними
        """Пошук щільних кластерів."""
        # Спрощена реалізація — в реальності використовується Louvain або Label Propagation
        clusters = []

        # Будуємо граф
        graph = defaultdict(set)
        for rel in relations:
            source = rel.get("source_id")
            target = rel.get("target_id")
            if source and target:
                graph[source].add(target)
                graph[target].add(source)

        # Знаходимо компоненти зв'язності
        visited = set()

        def dfs(node: str, component: set):
            visited.add(node)
            component.add(node)
            for neighbor in graph.get(node, []):
                if neighbor not in visited:
                    dfs(neighbor, component)

        for entity in entities:
            entity_id = entity.get("id")
            if entity_id and entity_id not in visited:
                component: set[str] = set()
                dfs(entity_id, component)

                if len(component) >= 3:
                    # Обчислюємо щільність
                    edges = sum(
                        1 for rel in relations
                        if rel.get("source_id") in component and rel.get("target_id") in component
                    )
                    max_edges = len(component) * (len(component) - 1) / 2
                    density = edges / max_edges if max_edges > 0 else 0

                    clusters.append({
                        "members": list(component),
                        "size": len(component),
                        "density": density,
                    })

        return clusters

    def _find_hubs(
        self,
        entities: list[Dict[str, Any]], # Властивості словника можуть бути довільними
        relations: list[Dict[str, Any]], # Властивості словника можуть бути довільними
    ) -> list[Dict[str, Any]]: # Властивості словника можуть бути довільними
        """Пошук хабів (вузлів з великою кількістю зв'язків)."""
        degree_count = defaultdict(int)
        connections = defaultdict(list)

        for rel in relations:
            source = rel.get("source_id")
            target = rel.get("target_id")
            if source:
                degree_count[source] += 1
                connections[source].append(target)
            if target:
                degree_count[target] += 1
                connections[target].append(source)

        # Знаходимо entity name
        entity_names = {e.get("id"): e.get("name") for e in entities}

        hubs = []
        for entity_id, degree in sorted(degree_count.items(), key=lambda x: -x[1])[:10]:
            hubs.append({
                "id": entity_id,
                "name": entity_names.get(entity_id),
                "degree": degree,
                "connected": connections[entity_id][:20],
            })

        return hubs

    def _find_shared_attributes(self, entities: list[Dict[str, Any]]) -> list[Dict[str, Any]]: # Властивості словника можуть бути довільними
        """Пошук спільних атрибутів."""
        # Групуємо за адресою
        by_address = defaultdict(list)
        # Групуємо за директором
        by_director = defaultdict(list)
        # Групуємо за телефоном
        by_phone = defaultdict(list)

        for entity in entities:
            entity_id = entity.get("id")

            address = entity.get("address")
            if address:
                by_address[address].append(entity_id)

            director = entity.get("director", {}).get("name")
            if director:
                by_director[director].append(entity_id)

            phone = entity.get("phone")
            if phone:
                by_phone[phone].append(entity_id)

        shared = []

        for address, entities_list in by_address.items():
            if len(entities_list) >= 5:
                shared.append({
                    "attribute": "address",
                    "value": address,
                    "count": len(entities_list),
                    "entities": entities_list,
                })

        for director, entities_list in by_director.items():
            if len(entities_list) >= 3:
                shared.append({
                    "attribute": "director",
                    "value": director,
                    "count": len(entities_list),
                    "entities": entities_list,
                })

        for phone, entities_list in by_phone.items():
            if len(entities_list) >= 3:
                shared.append({
                    "attribute": "phone",
                    "value": phone,
                    "count": len(entities_list),
                    "entities": entities_list,
                })

        return shared

    # ======================== PRICE ANOMALIES ========================

    def detect_price_anomalies(
        self,
        declarations: list[dict[str, Any]],
        reference_prices: dict[str, float] | None = None,
    ) -> list[Anomaly]:
        """Виявлення цінових аномалій у митних деклараціях."""
        anomalies = []

        # Групуємо за кодом товару
        by_hs_code = defaultdict(list)
        for decl in declarations:
            hs_code = decl.get("hs_code")
            if hs_code:
                by_hs_code[hs_code].append(decl)

        for hs_code, decls in by_hs_code.items():
            if len(decls) < 3:
                continue

            # Обчислюємо середню ціну за одиницю
            prices = []
            for decl in decls:
                quantity = decl.get("quantity", 1)
                value = decl.get("value", 0)
                if quantity > 0:
                    prices.append(value / quantity)

            if not prices:
                continue

            mean_price = sum(prices) / len(prices)

            # Перевіряємо кожну декларацію
            for i, decl in enumerate(decls):
                quantity = decl.get("quantity", 1)
                value = decl.get("value", 0)
                unit_price = value / quantity if quantity > 0 else 0

                # Відхилення від середнього
                deviation = abs(unit_price - mean_price) / mean_price if mean_price > 0 else 0

                if deviation > self.PRICE_DEVIATION_THRESHOLD:
                    anomalies.append(Anomaly(
                        id=f"price_{decl.get('id', i)}",
                        type=AnomalyType.PRICE_ANOMALY,
                        severity="high" if deviation > 0.7 else "medium",
                        confidence=min(0.95, deviation),
                        description=f"Аномальна ціна: {unit_price:.2f} (відхилення {deviation*100:.1f}% від середнього {mean_price:.2f})",
                        entities=[decl.get("importer_id", "")],
                        details={
                            "declaration_id": decl.get("id"),
                            "hs_code": hs_code,
                            "unit_price": unit_price,
                            "mean_price": mean_price,
                            "deviation_percent": deviation * 100,
                            "importer": decl.get("importer_name"),
                            "origin_country": decl.get("origin_country"),
                        },
                    ))

        return anomalies

    # ======================== REPORT GENERATION ========================

    def generate_report(
        self,
        anomalies: list[Anomaly],
        period_start: datetime | None = None,
        period_end: datetime | None = None,
    ) -> AnomalyReport: # Властивості словника можуть бути довільними
        """Генерація звіту про аномалії."""
        by_type = defaultdict(int)
        by_severity = defaultdict(int)

        for anomaly in anomalies:
            by_type[anomaly.type.value] += 1
            by_severity[anomaly.severity] += 1

        return AnomalyReport(
            total_anomalies=len(anomalies),
            by_type=dict(by_type),
            by_severity=dict(by_severity),
            anomalies=sorted(anomalies, key=lambda a: (
                {"critical": 0, "high": 1, "medium": 2, "low": 3}.get(a.severity, 4),
                -a.confidence,
            )),
            analysis_period={
                "start": period_start.isoformat() if period_start else "N/A",
                "end": period_end.isoformat() if period_end else "N/A",
            },
        )
