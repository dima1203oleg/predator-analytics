from typing import Dict, Any, List
from ..core.base_agent import BaseAgent, AgentResponse, AgentConfig
import logging
import statistics

logger = logging.getLogger(__name__)


class MinerAgent(BaseAgent):
    """Data Mining Agent - виявляє аномалії та патерни в даних"""
    
    def __init__(self):
        super().__init__(AgentConfig(name="MinerAgent"))
        self.zscore_threshold = 2.5  # Поріг для Z-score аномалій

    async def process(self, inputs: Dict[str, Any]) -> AgentResponse:
        data = inputs.get("data", [])
        analysis_type = inputs.get("type", "anomaly")
        
        self._log_activity(f"Mining insights from {len(data) if isinstance(data, list) else 0} records")
        
        if not data or not isinstance(data, list):
            return AgentResponse(
                agent_name=self.name,
                result={"insights": [], "message": "No data provided"},
                metadata={"model": "none"}
            )
        
        insights = []
        
        if analysis_type == "anomaly":
            insights = await self._detect_anomalies(data)
        elif analysis_type == "pattern":
            insights = await self._find_patterns(data)
        elif analysis_type == "trend":
            insights = await self._analyze_trends(data)
        else:
            insights = await self._detect_anomalies(data)
        
        return AgentResponse(
            agent_name=self.name,
            result={"insights": insights, "count": len(insights)},
            metadata={"model": "statistical_analysis", "threshold": self.zscore_threshold}
        )
    
    async def _detect_anomalies(self, data: List[Dict]) -> List[str]:
        """Виявлення аномалій через Z-score аналіз"""
        insights = []
        
        # Знаходимо числові поля для аналізу
        numeric_fields = self._get_numeric_fields(data)
        
        for field in numeric_fields:
            values = [r.get(field) for r in data if isinstance(r.get(field), (int, float))]
            if len(values) < 3:
                continue
            
            mean = statistics.mean(values)
            stdev = statistics.stdev(values) if len(values) > 1 else 0
            
            if stdev == 0:
                continue
            
            for i, record in enumerate(data):
                val = record.get(field)
                if isinstance(val, (int, float)):
                    zscore = abs((val - mean) / stdev)
                    if zscore > self.zscore_threshold:
                        record_id = record.get("id", record.get("edrpou", f"record_{i}"))
                        insights.append(f"Аномалія в {field}: {record_id} має значення {val} (Z-score: {zscore:.2f})")
        
        if not insights:
            insights.append("Аномалій не виявлено в наданих даних")
        
        return insights
    
    async def _find_patterns(self, data: List[Dict]) -> List[str]:
        """Пошук повторюваних патернів"""
        insights = []
        
        # Аналіз частоти значень
        for field in self._get_categorical_fields(data):
            value_counts = {}
            for record in data:
                val = str(record.get(field, ""))
                value_counts[val] = value_counts.get(val, 0) + 1
            
            # Знаходимо домінантні значення (>30%)
            total = len(data)
            for val, count in value_counts.items():
                if count / total > 0.3 and val:
                    insights.append(f"Патерн: {field}='{val}' зустрічається в {count}/{total} записах ({count/total*100:.1f}%)")
        
        return insights if insights else ["Значущих патернів не виявлено"]
    
    async def _analyze_trends(self, data: List[Dict]) -> List[str]:
        """Аналіз трендів у часових даних"""
        insights = []
        
        # Шукаємо поля з датами/часом
        date_fields = ["date", "timestamp", "created_at", "updated_at"]
        numeric_fields = self._get_numeric_fields(data)
        
        for num_field in numeric_fields[:3]:  # Аналізуємо перші 3 числових поля
            values = [r.get(num_field) for r in data if isinstance(r.get(num_field), (int, float))]
            if len(values) >= 5:
                # Простий тренд - порівняння першої і останньої третини
                first_third = statistics.mean(values[:len(values)//3])
                last_third = statistics.mean(values[-len(values)//3:])
                
                if last_third > first_third * 1.1:
                    insights.append(f"Зростаючий тренд у {num_field}: +{(last_third/first_third-1)*100:.1f}%")
                elif last_third < first_third * 0.9:
                    insights.append(f"Спадаючий тренд у {num_field}: {(last_third/first_third-1)*100:.1f}%")
        
        return insights if insights else ["Значущих трендів не виявлено"]
    
    def _get_numeric_fields(self, data: List[Dict]) -> List[str]:
        """Отримує список числових полів"""
        if not data:
            return []
        
        numeric = []
        sample = data[0]
        for key, val in sample.items():
            if isinstance(val, (int, float)) and not key.startswith("_"):
                numeric.append(key)
        return numeric
    
    def _get_categorical_fields(self, data: List[Dict]) -> List[str]:
        """Отримує список категоріальних полів"""
        if not data:
            return []
        
        categorical = []
        sample = data[0]
        for key, val in sample.items():
            if isinstance(val, str) and not key.startswith("_") and key not in ["id", "uuid"]:
                categorical.append(key)
        return categorical
