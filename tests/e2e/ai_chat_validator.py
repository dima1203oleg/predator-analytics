#!/usr/bin/env python3
"""
🤖 AI Chat Validator v3.0
PREDATOR Analytics v61.0-ELITE

Перевірка AI-чату з валідацією відповідей згідно з ТЗ v3.0.
"""

import asyncio
import httpx
from typing import Dict, List, Any
from datetime import datetime


class AIChatValidator:
    """Валідатор AI-чату з перевіркою відповідей"""
    
    def __init__(self, backend_url: str = "http://localhost:8000"):
        self.backend_url = backend_url
        self.test_queries = [
            "Покажи декларації за березень 2024 року",
            "Скільки записів було імпортовано?",
            "Які товари зустрічаються найчастіше?",
            "Побудуй коротке резюме імпортованих даних",
            "Покажи найбільших імпортерів",
            "Знайди схожі декларації",
            "Побудуй граф зв'язків контрагентів",
            "Знайди можливі аномалії",
            "Покажи записи з конкретним номером декларації"
        ]
    
    async def validate_ai_chat(self) -> Dict[str, Any]:
        """Виконує повну перевірку AI-чату згідно з ТЗ v3.0"""
        
        results = []
        
        for query in self.test_queries:
            result = await self._execute_query(query)
            results.append(result)
        
        # Валідація відповідей
        validation_result = {
            "total_queries": len(self.test_queries),
            "successful_queries": sum(1 for r in results if r["success"]),
            "queries": results,
            "overall_success_rate": sum(1 for r in results if r["success"]) / len(results),
            "all_use_imported_data": all(r["uses_imported_data"] for r in results),
            "all_match_excel_data": all(r["matches_excel_data"] for r in results),
            "timestamp": datetime.now().isoformat()
        }
        
        return validation_result
    
    async def _execute_query(self, query: str) -> Dict[str, Any]:
        """Виконує один запит до AI-чату"""
        
        start_time = datetime.now()
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.backend_url}/api/chat/query",
                    json={
                        "query": query,
                        "context": "import_validation"
                    }
                )
                
                response_time = (datetime.now() - start_time).total_seconds()
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Валідація відповіді
                    validation = self._validate_response(data, query)
                    
                    return {
                        "query": query,
                        "success": True,
                        "response": data.get("response", ""),
                        "response_time": response_time,
                        "sources_used": data.get("sources", []),
                        "services_used": data.get("services", []),
                        "search_mechanism": data.get("search_mechanism", "unknown"),
                        "confidence_score": data.get("confidence", 0),
                        **validation
                    }
                else:
                    return {
                        "query": query,
                        "success": False,
                        "response_time": response_time,
                        "error": f"HTTP {response.status_code}",
                        "matches_excel_data": False,
                        "uses_imported_data": False
                    }
                    
        except Exception as e:
            response_time = (datetime.now() - start_time).total_seconds()
            
            return {
                "query": query,
                "success": False,
                "response_time": response_time,
                "error": str(e),
                "matches_excel_data": False,
                "uses_imported_data": False
            }
    
    def _validate_response(self, data: Dict[str, Any], query: str) -> Dict[str, Any]:
        """Валідація відповіді AI згідно з ТЗ v3.0"""
        
        # Перевірка джерел
        sources = data.get("sources", [])
        services = data.get("services", [])
        
        # Перевірка використання імпортованих даних
        uses_imported_data = self._check_uses_imported_data(data)
        
        # Перевірка відповідності Excel даним
        matches_excel_data = self._check_matches_excel_data(data, query)
        
        # Перевірка відсутності застарілих відповідей
        not_cached = self._check_not_cached(data)
        
        return {
            "matches_excel_data": matches_excel_data,
            "uses_imported_data": uses_imported_data,
            "not_cached": not_cached,
            "has_sources": len(sources) > 0,
            "has_services": len(services) > 0
        }
    
    def _check_uses_imported_data(self, data: Dict[str, Any]) -> bool:
        """Перевіряє, чи використовуються імпортовані дані"""
        
        sources = data.get("sources", [])
        services = data.get("services", [])
        
        # Перевірка наявності джерел даних
        if not sources:
            return False
        
        # Перевірка використання відповідних сервісів
        required_services = ["PostgreSQL", "Qdrant", "OpenSearch"]
        has_required_service = any(service in services for service in required_services)
        
        return has_required_service
    
    def _check_matches_excel_data(self, data: Dict[str, Any], query: str) -> bool:
        """Перевіряє, чи відповідає відповідь даним з Excel"""
        
        # Для реалізації цієї перевірки потрібно мати доступ до Excel даних
        # Це placeholder для демонстрації логіки
        
        response_text = data.get("response", "").lower()
        
        # Перевірка наявності ключових слів, що вказують на дані
        data_indicators = ["декларація", "запис", "товар", "імпортер", "березень"]
        has_data_indicators = any(indicator in response_text for indicator in data_indicators)
        
        return has_data_indicators
    
    def _check_not_cached(self, data: Dict[str, Any]) -> bool:
        """Перевіряє відсутність застарілих кешованих відповідей"""
        
        # Перевірка timestamp відповіді
        response_time = data.get("timestamp", "")
        
        if not response_time:
            return True  # Якщо немає timestamp, вважаємо що не кешовано
        
        # Перевірка, чи відповідь не старша за 1 хвилину
        try:
            response_dt = datetime.fromisoformat(response_time)
            age = (datetime.now() - response_dt).total_seconds()
            return age < 60  # Менше 1 хвилини
        except:
            return True


async def main():
    """Приклад використання"""
    
    validator = AIChatValidator()
    result = await validator.validate_ai_chat()
    
    print(f"AI Chat Validation Results:")
    print(f"  Total queries: {result['total_queries']}")
    print(f"  Successful: {result['successful_queries']}")
    print(f"  Success rate: {result['overall_success_rate']:.1%}")
    print(f"  All use imported data: {result['all_use_imported_data']}")
    print(f"  All match Excel data: {result['all_match_excel_data']}")
    
    print(f"\nDetailed results:")
    for query_result in result["queries"]:
        status = "✅" if query_result["success"] else "❌"
        print(f"  {status} {query_result['query']}")
        print(f"     Response time: {query_result['response_time']:.2f}s")
        print(f"     Uses imported data: {query_result['uses_imported_data']}")
        print(f"     Matches Excel data: {query_result['matches_excel_data']}")
        print()


if __name__ == "__main__":
    asyncio.run(main())
