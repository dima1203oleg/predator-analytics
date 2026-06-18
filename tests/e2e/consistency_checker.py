#!/usr/bin/env python3
"""
🔗 Consistency Checker v3.0
PREDATOR Analytics v61.0-ELITE

Перевірка консистентності між всіма сховищами згідно з ТЗ v3.0.
"""

import asyncio
import json
from typing import Dict, Any, List
from datetime import datetime


class ConsistencyChecker:
    """Перевірка консистентності між сховищами"""
    
    def __init__(self):
        self.tolerance = 0.05  # 5% толеранс для розбіжностей
    
    async def check_consistency(self, validation_results: Dict[str, Any], excel_rows: int) -> Dict[str, Any]:
        """Виконує повну перевірку консистентності згідно з ТЗ v3.0"""
        
        # Отримання кількостей записів з кожного сховища
        postgres_rows = validation_results.get("postgres", {}).get("count", 0)
        clickhouse_rows = validation_results.get("clickhouse", {}).get("total_analytical_rows", 0)
        opensearch_docs = validation_results.get("opensearch", {}).get("total_docs", 0)
        qdrant_vectors = validation_results.get("qdrant", {}).get("total_vectors", 0)
        neo4j_nodes = validation_results.get("neo4j", {}).get("node_count", 0)
        neo4j_edges = validation_results.get("neo4j", {}).get("edge_count", 0)
        minio_objects = validation_results.get("minio", {}).get("total_objects", 0)
        redpanda_messages = validation_results.get("redpanda", {}).get("details", {}).get("total_topics", 0)
        
        # Розрахунок розбіжностей
        differences = {
            "postgres_vs_excel": self._calculate_difference(excel_rows, postgres_rows),
            "opensearch_vs_postgres": self._calculate_difference(postgres_rows, opensearch_docs),
            "qdrant_vs_postgres": self._calculate_difference(postgres_rows, qdrant_vectors),
            "neo4j_vs_postgres": self._calculate_difference(postgres_rows, neo4j_nodes),
            "clickhouse_vs_postgres": self._calculate_difference(postgres_rows, clickhouse_rows)
        }
        
        # Перевірка критеріїв консистентності
        consistency_checks = {
            "excel_postgres_consistent": self._is_within_tolerance(differences["postgres_vs_excel"]),
            "postgres_opensearch_consistent": self._is_within_tolerance(differences["opensearch_vs_postgres"]),
            "postgres_qdrant_consistent": self._is_within_tolerance(differences["qdrant_vs_postgres"]),
            "postgres_neo4j_consistent": self._is_within_tolerance(differences["neo4j_vs_postgres"]),
            "postgres_clickhouse_consistent": self._is_within_tolerance(differences["clickhouse_vs_postgres"])
        }
        
        # Загальний статус консистентності
        overall_consistent = all(consistency_checks.values())
        
        # Детальний аналіз
        analysis = {
            "excel_rows": excel_rows,
            "postgres_rows": postgres_rows,
            "opensearch_docs": opensearch_docs,
            "qdrant_vectors": qdrant_vectors,
            "neo4j_nodes": neo4j_nodes,
            "neo4j_edges": neo4j_edges,
            "minio_objects": minio_objects,
            "redpanda_messages": redpanda_messages,
            "clickhouse_aggregates": clickhouse_rows,
            "differences": differences,
            "consistency_checks": consistency_checks,
            "overall_consistent": overall_consistent,
            "issues": self._identify_issues(differences, consistency_checks),
            "timestamp": datetime.now().isoformat()
        }
        
        return analysis
    
    def _calculate_difference(self, expected: int, actual: int) -> Dict[str, Any]:
        """Розраховує різницю між очікуваним та фактичним значенням"""
        
        if expected == 0:
            return {
                "absolute": actual,
                "percentage": 100.0 if actual > 0 else 0,
                "within_tolerance": actual == 0
            }
        
        absolute_diff = abs(expected - actual)
        percentage_diff = (absolute_diff / expected) * 100 if expected > 0 else 100
        
        return {
            "absolute": absolute_diff,
            "percentage": percentage_diff,
            "within_tolerance": percentage_diff <= (self.tolerance * 100)
        }
    
    def _is_within_tolerance(self, difference: Dict[str, Any]) -> bool:
        """Перевіряє, чи різниця в межах толерансу"""
        return difference.get("within_tolerance", False)
    
    def _identify_issues(self, differences: Dict[str, Any], checks: Dict[str, bool]) -> List[str]:
        """Ідентифікує проблеми з консистентністю"""
        
        issues = []
        
        for check_name, passed in checks.items():
            if not passed:
                diff_key = check_name.replace("_consistent", "")
                diff = differences.get(diff_key, {})
                issues.append(
                    f"{check_name}: розбіжність {diff.get('absolute', 0)} записів ({diff.get('percentage', 0):.1f}%)"
                )
        
        return issues
    
    def generate_consistency_report(self, analysis: Dict[str, Any]) -> str:
        """Генерує звіт про консистентність"""
        
        report = f"""
## 🔗 Перевірка консистентності між сховищами

**Загальний статус:** {"✅ CONSISTENT" if analysis["overall_consistent"] else "❌ INCONSISTENT"}
**Excel рядків:** {analysis["excel_rows"]}

### Кількість записів у кожному сховищі:
- **PostgreSQL:** {analysis["postgres_rows"]}
- **OpenSearch:** {analysis["opensearch_docs"]}
- **Qdrant:** {analysis["qdrant_vectors"]}
- **Neo4j вузли:** {analysis["neo4j_nodes"]}
- **Neo4j ребра:** {analysis["neo4j_edges"]}
- **MinIO об'єкти:** {analysis["minio_objects"]}
- **Redpanda повідомлення:** {analysis["redpanda_messages"]}
- **ClickHouse агрегати:** {analysis["clickhouse_aggregates"]}

### Розбіжності:
"""
        
        for diff_name, diff_data in analysis["differences"].items():
            status = "✅" if diff_data["within_tolerance"] else "❌"
            report += f"- **{diff_name}:** {status} {diff_data['absolute']} записів ({diff_data['percentage']:.1f}%)\n"
        
        if analysis["issues"]:
            report += "\n### Виявлені проблеми:\n"
            for issue in analysis["issues"]:
                report += f"- ❌ {issue}\n"
        else:
            report += "\n### ✅ Проблем не виявлено\n"
        
        return report


async def main():
    """Приклад використання"""
    
    checker = ConsistencyChecker()
    
    # Приклад даних валідації
    validation_results = {
        "postgres": {"status": "ok", "count": 1000},
        "clickhouse": {"status": "ok", "total_analytical_rows": 1000},
        "opensearch": {"status": "ok", "total_docs": 1000},
        "qdrant": {"status": "ok", "total_vectors": 1000},
        "neo4j": {"status": "ok", "node_count": 500, "edge_count": 800},
        "minio": {"status": "ok", "total_objects": 1},
        "redpanda": {"status": "ok", "details": {"total_topics": 5}}
    }
    
    excel_rows = 1000
    
    analysis = await checker.check_consistency(validation_results, excel_rows)
    
    print("Consistency Analysis:")
    print(f"  Overall consistent: {analysis['overall_consistent']}")
    print(f"  Issues found: {len(analysis['issues'])}")
    
    print("\nDifferences:")
    for diff_name, diff_data in analysis["differences"].items():
        status = "✅" if diff_data["within_tolerance"] else "❌"
        print(f"  {status} {diff_name}: {diff_data['absolute']} ({diff_data['percentage']:.1f}%)")
    
    print("\n" + checker.generate_consistency_report(analysis))


if __name__ == "__main__":
    asyncio.run(main())
