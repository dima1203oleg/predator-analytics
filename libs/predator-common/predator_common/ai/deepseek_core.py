import os
import json
import logging
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
import httpx

logger = logging.getLogger("deepseek_core")

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")

class CognitiveDecision(BaseModel):
    decision: str
    rationale: str
    confidence: float
    parameters: Dict[str, Any]

class DeepSeekCore:
    def __init__(self, model_name: str = "deepseek-r1:latest"):
        self.model_name = model_name
        self.api_url = f"{OLLAMA_URL.rstrip('/')}/api/generate"
        self.headers = {"Content-Type": "application/json"}

    async def _invoke(self, system_prompt: str, user_prompt: str, temperature: float = 0.2) -> Dict[str, Any]:
        prompt = f"<|im_start|>system\n{system_prompt}<|im_end|>\n<|im_start|>user\n{user_prompt}<|im_end|>\n<|im_start|>assistant\n"
        
        payload = {
            "model": self.model_name,
            "prompt": prompt,
            "stream": False,
            "temperature": temperature,
            "options": {
                "num_ctx": 4096
            }
        }
        
        async with httpx.AsyncClient(timeout=600.0) as client:
            try:
                response = await client.post(self.api_url, json=payload, headers=self.headers)
                response.raise_for_status()
                data = response.json()
                content = data.get("response", "")
                # Зрізаємо think-блок від DeepSeek R1
                import re
                raw_content = content
                content = re.sub(r'<think>.*?</think>', '', content, flags=re.DOTALL)
                match = re.search(r'```(?:json)?(.*?)```', content, flags=re.DOTALL)
                if match:
                    content = match.group(1)
                content = content.strip()
                
                if not content:
                    logger.error(f"Empty content after stripping. Raw was: {raw_content}")
                    raise ValueError("Empty content from LLM")
                    
                return json.loads(content)
            except Exception as e:
                logger.error(f"API Invocation Error: {e}")
                return {
                    "decision": "ERROR",
                    "rationale": f"API Exception: {str(e)}",
                    "confidence": 0.0,
                    "parameters": {}
                }

    async def evaluate_drift(self, drift_metrics: Dict[str, Any]) -> CognitiveDecision:
        system_prompt = (
            "Ти є Системним Мозком (System Brain) платформи PREDATOR Analytics. Твоє завдання - аналізувати "
            "метрики дрифту даних/концептів (data/concept drift) і приймати рішення щодо стратегії перенавчання моделі. "
            "ПОВЕРНИ ВИКЛЮЧНО JSON з такими полями: decision (рядок: 'FULL_RETRAIN', 'INCREMENTAL', 'PARTIAL', 'IGNORE'), "
            "rationale (рядок з детальним обґрунтуванням українською мовою), confidence (десяткове число 0-1) "
            "та parameters (словник). УСІ ТЕКСТИ ПОВИННІ БУТИ УКРАЇНСЬКОЮ МОВОЮ."
        )
        user_prompt = f"Проаналізуй наступні метрики дрифту: {json.dumps(drift_metrics)}"
        res = await self._invoke(system_prompt, user_prompt, temperature=0.1)
        return CognitiveDecision(**res)

    async def design_dataset(self, raw_metadata: Dict[str, Any]) -> CognitiveDecision:
        system_prompt = (
            "Ти є Архітектором Датасетів (Dataset Architect). Твоє завдання - аналізувати сирі метадані та рекомендувати структуру "
            "датасету. ПОВЕРНИ ВИКЛЮЧНО JSON з полями: decision (рядок: назва стратегії/блюпринту), rationale (обґрунтування українською мовою), "
            "confidence (десяткове число), та parameters (словник, що містить feature_engineering, imbalance_strategy, synthetic_data_needs). "
            "УСІ ВНУТРІШНІ ТЕКСТИ В РІШЕННЯХ ТА РЕКОМЕНДАЦІЯХ МАЮТЬ БУТИ ВИКЛЮЧНО УКРАЇНСЬКОЮ МОВОЮ."
        )
        user_prompt = f"Метадані датасету: {json.dumps(raw_metadata)}"
        res = await self._invoke(system_prompt, user_prompt, temperature=0.3)
        return CognitiveDecision(**res)

    async def generate_novel_blueprint(self, context_seed: str, history: List[str]) -> CognitiveDecision:
        system_prompt = (
            "Ти є Елітним Аналітиком-Розслідувачем. Твоє завдання — згенерувати АБСОЛЮТНО НОВИЙ, "
            "унікальний блюпринт датасету для митної/економічної аналітики, який відкриває нову корупційну або економічну схему. "
            "ЗАБОРОНЕНО повторювати ідеї, які є в історії (history). Шукай нові сфери (медицина, ІТ, тендери, крипта, благодійність тощо). "
            "ПОВЕРНИ ВИКЛЮЧНО JSON формату: \n"
            "{\n"
            "  \"decision\": \"Назва нового датасету\",\n"
            "  \"rationale\": \"Опис того, що саме він виявляє (українською)\",\n"
            "  \"confidence\": 0.9,\n"
            "  \"parameters\": {\n"
            "    \"суть\": \"Яку глибинну логіку або схему ти атакуєш\",\n"
            "    \"поля\": [\"Колонка 1\", \"Колонка 2\"],\n"
            "    \"приклад_кейса\": \"Як виглядає реальний запис\"\n"
            "  }\n"
            "}\n"
            "УСІ ТЕКСТИ МАЮТЬ БУТИ ВИКЛЮЧНО УКРАЇНСЬКОЮ МОВОЮ, СТИЛЬ РАДИКАЛЬНИЙ І ТОЧНИЙ."
        )
        user_prompt = f"ІСТОРІЯ ВЖЕ ІСНУЮЧИХ ІДЕЙ (НЕ ПОВТОРЮВАТИ):\n{json.dumps(history[-5:])}\n\nКОНТЕКСТ ВІД КОРИСТУВАЧА:\n{context_seed[:1000]}...\n\nЗГЕНЕРУЙ НОВУ ІДЕЮ №{len(history) + 101}!"
        
        try:
            res = await self._invoke(system_prompt, user_prompt, temperature=0.8)
            return CognitiveDecision(**res)
        except Exception as e:
            logger.error(f"API Invocation Error: {e}")
            return CognitiveDecision(
                decision="ERROR",
                rationale=f"API Exception: {str(e)}",
                confidence=0.0,
                parameters={}
            )

    async def strategy_optimizer(self, task_desc: Dict[str, Any]) -> CognitiveDecision:
        system_prompt = (
            "Ти є AI Мета-Оптимізатором. Твоє завдання - визначити стратегію AutoML. "
            "ПОВЕРНИ ВИКЛЮЧНО JSON з полями: decision (сімейство моделей, наприклад 'tree-ensemble', 'neural'), "
            "rationale (детальне обґрунтування українською мовою), confidence (десяткове число 0-1), parameters (словник з search_space, "
            "loss_function, hyperparams). УСІ ТЕКСТИ ТА КОМЕНТАРІ МАЮТЬ БУТИ ВІДПОВІДНО УКРАЇНСЬКОЮ МОВОЮ."
        )
        user_prompt = f"Опис завдання: {json.dumps(task_desc)}"
        res = await self._invoke(system_prompt, user_prompt, temperature=0.2)
        return CognitiveDecision(**res)

    async def explain_results(self, shap_values: Dict[str, Any], predictions: List[float]) -> str:
        system_prompt = (
            "Ти є Ядром Пояснення (Explainability Core). Твоє завдання - конвертувати SHAP-значення та передбачення моделі "
            "у зрозумілий для людини бізнес-інсайт. Сфокусуйся на факторах ризику та рекомендаціях. "
            "ВІДПОВІДАЙ ВИКЛЮЧНО УКРАЇНСЬКОЮ МОВОЮ, професійним стилем митного аналітика."
        )
        user_prompt = json.dumps({"shap": shap_values, "predictions": predictions})
        
        prompt = f"<|im_start|>system\n{system_prompt}<|im_end|>\n<|im_start|>user\n{user_prompt}<|im_end|>\n<|im_start|>assistant\n"
        
        payload = {
            "model": self.model_name,
            "prompt": prompt,
            "stream": False,
            "temperature": 0.4
        }
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                response = await client.post(self.api_url, json=payload, headers=self.headers)
                response.raise_for_status()
                data = response.json()
                return data.get("response", "Помилка формату відповіді")
            except Exception as e:
                logger.error(f"Помилка генерації пояснення: {e}")
                return "Помилка генерації пояснення через AI."
